import {
    Navigation,
    parseMd,
    Router,
    Views,
    CatchAllNav,
} from '@youwol/mkdocs-ts'
import { AssetsGateway } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { map, take } from 'rxjs/operators'
import { AssetView, ExplorerView } from './explorer.views'
import { combineLatest } from 'rxjs'
import { AppState } from '../app-state'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Installer, PreferencesFacade } from '@youwol/os-core'

const tableOfContent = Views.tocView

export const navigation = (appState: AppState): Navigation => ({
    name: 'Explorer',
    decoration: { icon: { tag: 'i', class: 'fas fa-folder mr-2' } },
    tableOfContent,
    html: ({ router }) => new PageView({ router, appState }),
    '...': appState.session$.pipe(map(() => lazyResolver)),
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

function lazyResolver({
    path,
    router,
}: {
    path: string
    router: Router
}): CatchAllNav {
    const parts = path.split('/').filter((d) => d != '')
    const client = new AssetsGateway.Client()
    if (parts.length == 0) {
        return lazyResolverGroups({ client })
    }
    if (parts.length == 1) {
        return lazyResolverDrives({ groupId: parts[0], client })
    }
    if (parts.length >= 2 && parts.slice(-1)[0].startsWith('folder_')) {
        return lazyResolverFolders({
            path,
            parentId: parts.slice(-1)[0].replace('folder_', ''),
            client,
        })
    }
    if (parts.length >= 2 && parts.slice(-1)[0].startsWith('asset_')) {
        return lazyResolverAsset({
            parentId: parts.slice(-2)[0].replace('folder_', ''),
            assetId: parts.slice(-1)[0].replace('asset_', ''),
            client,
            router,
            path,
        })
    }
}

function lazyResolverGroups({
    client,
}: {
    client: AssetsGateway.Client
}): CatchAllNav {
    return client.accounts.getSessionDetails$().pipe(
        raiseHTTPErrors(),
        map((details) => {
            return {
                children: details.userInfo.groups.map((g) => {
                    return {
                        name: g.path.split('/').slice(-1)[0],
                        decoration: {
                            icon: {
                                tag: 'div' as const,
                                class: g.id.includes('private')
                                    ? 'fas fa-user mx-2'
                                    : 'fas fa-users mx-2',
                            },
                        },
                        id: g.id,
                    }
                }),
                html: () => ({ tag: 'h1' as const, innerText: 'Groups' }),
            }
        }),
    )
}

function lazyResolverDrives({
    groupId,
    client,
}: {
    groupId: string
    client: AssetsGateway.Client
}): CatchAllNav {
    return client.explorer
        .queryDrives$({
            groupId,
        })
        .pipe(
            raiseHTTPErrors(),
            take(1),
            map(({ drives }) => {
                return {
                    children: drives.map((d) => ({
                        name: d.name,
                        id: 'folder_' + d.driveId,
                        decoration: {
                            icon: {
                                tag: 'div' as const,
                                class: 'fas fa-hdd mx-2',
                            },
                        },
                    })),
                    html: () => ({
                        tag: 'h1' as const,
                        innerText: 'Drives',
                    }),
                }
            }),
        )
}

function lazyResolverFolders({
    path,
    parentId,
    client,
}: {
    path: string
    parentId: string
    client: AssetsGateway.Client
}): CatchAllNav {
    return client.explorer
        .queryChildren$({
            parentId,
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
                            decoration: {
                                icon: {
                                    tag: 'div' as const,
                                    class: 'fas fa-folder mx-2',
                                },
                            },
                        })),
                        ...response.items.map((d) => ({
                            name: d.name,
                            id: `asset_${d.assetId}`,
                            decoration: { wrapperClass: 'd-none' },
                            leaf: true,
                        })),
                    ],
                    html: () => new ExplorerView({ response, path }),
                }
            }),
        )
}

function lazyResolverAsset({
    path,
    parentId,
    assetId,
    router,
    client,
}: {
    path: string
    parentId: string
    assetId: string
    router: Router
    client: AssetsGateway.Client
}): CatchAllNav {
    return combineLatest([
        client.assets
            .getAsset$({
                assetId, //parts.slice(-1)[0].replace('asset_', ''),
            })
            .pipe(raiseHTTPErrors(), take(1)),
        client.explorer
            .queryChildren$({
                parentId, //: parts.slice(-2)[0].replace('folder_', ''),
            })
            .pipe(raiseHTTPErrors(), take(1)),
    ]).pipe(
        map(([assetResponse, itemsResponse]) => ({
            leaf: true,
            children: [],
            tableOfContent,
            html: () =>
                new AssetView({
                    assetResponse,
                    itemsResponse,
                    router,
                    path,
                }),
        })),
    )
}
