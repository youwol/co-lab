import {
    Navigation,
    parseMd,
    Router,
    Views,
    CatchAllNav,
} from '@youwol/mkdocs-ts'
import { Accounts, AssetsGateway } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { map, take } from 'rxjs/operators'
import { AssetView, ExplorerView } from './explorer.views'
import { combineLatest, Observable, of } from 'rxjs'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Installer, PreferencesFacade } from '@youwol/os-core'
import { ExplorerState } from './explorer.state'
import {
    driveNavNodeInput,
    folderNavNodeInput,
    groupNavNodeInput,
    itemNavNodeInput,
    trashNavNodeInput,
} from './utils'

export { ExplorerState as State } from './explorer.state'

const tableOfContent = Views.tocView

export const navigation = ({
    session$,
}: {
    session$?: Observable<Accounts.SessionDetails>
}): Navigation => {
    const explorerState = new ExplorerState()
    return {
        name: 'Explorer',
        decoration: { icon: { tag: 'i', class: 'fas fa-folder mr-2' } },
        tableOfContent,
        html: ({ router }) => {
            explorerState.setRouter(router)
            return new PageView({ router })
        },
        '...': (session$ || of(undefined)).pipe(
            map(() => ({ router, path }) => {
                explorerState.setRouter(router)
                return lazyResolver({
                    explorerState,
                    router,
                    path,
                })
            }),
        ),
    }
}

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    static warmUp = () => {
        combineLatest([
            Installer.getApplicationsInfo$(),
            PreferencesFacade.getPreferences$(),
        ]).subscribe()
    }

    constructor({ router }: { router: Router }) {
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
    explorerState,
}: {
    path: string
    router: Router
    explorerState: ExplorerState
}): CatchAllNav {
    const parts = path.split('/').filter((d) => d != '')
    const client = new AssetsGateway.Client()
    if (parts.length == 0) {
        return lazyResolverGroups({ client })
    }
    if (parts.length == 1) {
        return lazyResolverDrives({ groupId: parts[0], client })
    }
    if (
        parts.length >= 2 &&
        (parts.slice(-1)[0].startsWith('folder_') ||
            parts.slice(-1)[0].startsWith('trash_'))
    ) {
        return lazyResolverFolders({
            path,
            parentId: parts.slice(-1)[0].replace('folder_', ''),
            client,
            explorerState,
            groupId: parts[0],
            isDrive: parts.length === 2,
        })
    }
    if (parts.length >= 2 && parts.slice(-1)[0].startsWith('asset_')) {
        return lazyResolverAsset({
            parentId: parts.slice(-2)[0].replace('folder_', ''),
            assetId: parts.slice(-1)[0].replace('asset_', ''),
            client,
            router,
            path,
            explorerState,
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
                children: details.userInfo.groups.map((group) => {
                    return groupNavNodeInput({ group })
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
                    children: drives.map((drive) => {
                        return driveNavNodeInput({ drive })
                    }),
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
    explorerState,
    groupId,
    isDrive,
}: {
    path: string
    parentId: string
    client: AssetsGateway.Client
    explorerState: ExplorerState
    groupId: string
    isDrive: boolean
}): CatchAllNav {
    const source$ = parentId.startsWith('trash_')
        ? client.explorer.queryDeleted$({
              driveId: parentId.replace('trash_', ''),
          })
        : client.explorer.queryChildren$({
              parentId,
          })
    return source$.pipe(
        raiseHTTPErrors(),
        take(1),
        map((response) => {
            const children = [
                ...response.folders.map((folder) => {
                    return folderNavNodeInput({ folder, explorerState })
                }),
                ...response.items.map((item) => {
                    return itemNavNodeInput({ item, explorerState })
                }),
            ]
            if (isDrive) {
                children.push(
                    trashNavNodeInput({ parentId, groupId, explorerState }),
                )
            }
            return {
                children,
                html: () =>
                    new ExplorerView({
                        response,
                        path,
                        explorerState,
                    }),
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
    explorerState,
}: {
    path: string
    parentId: string
    assetId: string
    router: Router
    client: AssetsGateway.Client
    explorerState: ExplorerState
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
                    explorerState,
                    router,
                    path,
                }),
        })),
    )
}
