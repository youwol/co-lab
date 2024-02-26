import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { AssetsGateway } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { map, take } from 'rxjs/operators'
import { AssetView, ExplorerView } from './explorer.views'
import { combineLatest, of } from 'rxjs'
import { AppState } from '../app-state'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Installer, PreferencesFacade } from '@youwol/os-core'

const tableOfContent = Views.tocView

export const navigation = (appState: AppState) => ({
    name: 'Explorer',
    icon: { tag: 'i', class: 'fas fa-folder mr-2' },
    tableOfContent,
    html: ({ router }) => new PageView({ router, appState }),
    '/**': explorerNavigation,
})

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    static warmUp = () => {
        combineLatest([
            Installer.getApplicationsInfo$(),
            PreferencesFacade.getPreferences$(),
        ]).subscribe()
    }

    constructor({ router }: { router: Router; appState: AppState }) {
        this.children = [
            parseMd({
                src: `
# Explorer

The explorer organize assets in a files-explorer like structure.

                 `,
                router,
            }),
        ]
    }
}

function explorerNavigation({
    path,
    router,
}: {
    path: string
    router: Router
}) {
    const parts = path.split('/').filter((d) => d != '')
    const client = new AssetsGateway.Client()
    if (parts.length == 0) {
        return client.accounts.getSessionDetails$().pipe(
            raiseHTTPErrors(),
            map((details) => {
                return {
                    children: details.userInfo.groups.map((g) => ({
                        name: g.path.split('/').slice(-1)[0],
                        icon: {
                            tag: 'div',
                            class: g.id.includes('private')
                                ? 'fas fa-user mx-2'
                                : 'fas fa-users mx-2',
                        },
                        id: g.id,
                    })),
                    html: async () => ({ tag: 'h1', innerText: 'Groups' }),
                }
            }),
        )
    }
    if (parts.length == 1) {
        return client.explorer
            .queryDrives$({
                groupId: parts[0],
            })
            .pipe(
                raiseHTTPErrors(),
                take(1),
                map(({ drives }) => {
                    return {
                        children: drives.map((d) => ({
                            name: d.name,
                            id: 'folder_' + d.driveId,
                            icon: {
                                tag: 'div',
                                class: 'fas fa-hdd mx-2',
                            },
                        })),
                        html: async () => ({ tag: 'h1', innerText: 'Drives' }),
                    }
                }),
            )
    }
    if (parts.length >= 2 && parts.slice(-1)[0].startsWith('folder_')) {
        return client.explorer
            .queryChildren$({
                parentId: parts.slice(-1)[0].replace('folder_', ''),
            })
            .pipe(
                raiseHTTPErrors(),
                take(1),
                map((response) => {
                    return {
                        children: [
                            ...response.folders.map((d) => ({
                                name: d.name,
                                id: `folder_${d.folderId}`,
                                icon: {
                                    tag: 'div',
                                    class: 'fas fa-folder mx-2',
                                },
                            })),
                            ...response.items.map((d) => ({
                                name: d.name,
                                id: `asset_${d.assetId}`,
                                wrapperClass: 'd-none',
                                leaf: true,
                            })),
                        ],
                        html: async () => new ExplorerView({ response, path }),
                    }
                }),
            )
    }
    if (parts.length >= 2 && parts.slice(-1)[0].startsWith('asset_')) {
        return combineLatest([
            client.assets
                .getAsset$({
                    assetId: parts.slice(-1)[0].replace('asset_', ''),
                })
                .pipe(raiseHTTPErrors(), take(1)),
            client.explorer
                .queryChildren$({
                    parentId: parts.slice(-2)[0].replace('folder_', ''),
                })
                .pipe(raiseHTTPErrors(), take(1)),
        ]).pipe(
            map(([assetResponse, itemsResponse]) => ({
                leaf: true,
                children: [],
                tableOfContent,
                html: async () =>
                    new AssetView({
                        assetResponse,
                        itemsResponse,
                        router,
                        path,
                    }),
            })),
        )
    }
    return of({ children: [] })
}
