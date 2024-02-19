import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { parseMd, Router } from '@youwol/mkdocs-ts'
import { PyYouwolClient, Routers } from '@youwol/local-youwol-client'
import { onHTTPErrors } from '@youwol/http-primitives'
import { mergeMap, of } from 'rxjs'
import { AssetsGateway, ExplorerBackend } from '@youwol/http-clients'

export const internalAnchor = ({
    path,
    router,
}: {
    path: string
    router: Router
}): VirtualDOM<'a'> => ({
    tag: 'a',
    href: `@nav${path}`,
    onclick: (e: MouseEvent) => {
        e.preventDefault()
        router.navigateTo({ path })
    },
})

export class CdnLinkView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ name, router }: { name: string; router: Router }) {
        const client = new PyYouwolClient().admin.localCdn

        this.children = [
            {
                source$: client
                    .getPackage$({
                        packageId: window.btoa(name),
                    })
                    .pipe(
                        onHTTPErrors(() => undefined),
                        mergeMap(
                            (resp?: Routers.LocalCdn.GetPackageResponse) => {
                                if (resp === undefined) {
                                    return of(undefined)
                                }
                                return of(resp)
                            },
                        ),
                    ),
                vdomMap: (resp?: Routers.LocalCdn.GetPackageResponse) => {
                    if (resp == undefined) {
                        return parseMd({
                            src: 'The project has not been published in your components yet.',
                            router,
                        })
                    }
                    const type = resp.versions.slice(-1)[0]['type']
                    const topics = {
                        'js/wasm': 'js-wasm',
                        backend: 'backends',
                        pyodide: 'pyodide',
                    }
                    return parseMd({
                        src: `The project is published in components 
                        [here](@nav/components/${topics[type]}/${resp.id}).`,
                        router,
                    })
                },
            },
        ]
    }
}

export class ExplorerLinkView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ name, router }: { name: string; router: Router }) {
        const client = new AssetsGateway.Client().explorer
        const itemId = window.btoa(window.btoa(name))
        this.children = [
            {
                source$: client
                    .getItem$({
                        itemId,
                    })
                    .pipe(
                        onHTTPErrors(() => undefined),
                        mergeMap((resp?: ExplorerBackend.ItemBase) => {
                            if (resp === undefined) {
                                return of(undefined)
                            }
                            return client.getPath$({ itemId })
                        }),
                    ),
                vdomMap: (resp?: ExplorerBackend.PathBase) => {
                    if (resp == undefined) {
                        return parseMd({
                            src: 'The project has not been published in your explorer yet.',
                            router,
                        })
                    }
                    const folders = resp.folders.reduce(
                        (acc, e) => `${acc}/folder_${e.folderId}`,
                        `${resp.drive.groupId}/folder_${resp.drive.driveId}`,
                    )
                    const url = `${folders}/asset_${resp.item.assetId}`
                    return parseMd({
                        src: `The project is published in your explorer
                        [here](@nav/explorer/${url}).`,
                        router,
                    })
                },
            },
        ]
    }
}
