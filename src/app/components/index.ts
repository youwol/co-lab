import { AppState } from '../app-state'
import * as Backends from './backends'
import * as JsWasm from './js-wasm'
import * as Pyodide from './pyodide'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'

import { ExplicitNode, parseMd, Router } from '@youwol/mkdocs-ts'
import { Routers } from '@youwol/local-youwol-client'
import { ImmutableTree } from '@youwol/rx-tree-views'
import { mountReactiveNav } from '../common/mount-reactive-nav'
export * from './state'

export const navigation = (appState: AppState) => ({
    name: 'Components',
    icon: { tag: 'i', class: 'fas  fa-microchip mr-2' },
    html: ({ router }) => new PageView({ router, appState }),
    '/js-wasm': JsWasm.navigation(appState),
    '/pyodide': Pyodide.navigation(appState),
    '/backends': Backends.navigation(appState),
})

export function mountComponents({
    packages,
    router,
    treeState,
}: {
    packages: Routers.LocalCdn.CdnPackageLight[]
    treeState: ImmutableTree.State<ExplicitNode>
    router: Router
}) {
    const jsWasm = packages.filter((elem) => {
        return !elem.name.includes('backend')
    })
    const backends = packages.filter((elem) => {
        return elem.name.includes('backend')
    })
    mountReactiveNav<Routers.LocalCdn.CdnPackageLight>({
        basePath: '/components/js-wasm',
        entities: jsWasm,
        router,
        treeState,
        icon: () => ({
            tag: 'div',
            class: 'mx-2',
        }),
    })
    mountReactiveNav<Routers.LocalCdn.CdnPackageLight>({
        basePath: '/components/backends',
        entities: backends,
        router,
        treeState,
        icon: () => ({
            tag: 'div',
            class: 'mx-2',
        }),
    })
}

class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({ router }: { router: Router; appState: AppState }) {
        this.children = [
            parseMd({
                src: `
# Packages

Gathers the installed components (executables).

They are retrieved either:
*  when requested by an *e.g.* application
*  when published from your projects

Executables can be:
*  applications
*  libraries
*  python: Python modules running in the browser.
*  backends`,
                router: router,
            }),
        ]
    }
}
