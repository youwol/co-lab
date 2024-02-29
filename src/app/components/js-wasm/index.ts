import { AppState } from '../../app-state'
import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { NavIconSvg } from '../../common'
import { PackageView } from './package.views'

export const navigation = (appState: AppState) => ({
    name: 'Js/WASM',
    icon: new NavIconSvg({ filename: 'icon-js.svg' }),
    html: ({ router }) => new PageView({ router, appState }),
    '/**': async ({ path }: { path: string }) => {
        const parts = path.split('/').filter((d) => d != '')
        return {
            tableOfContent: Views.tocView,
            children: [],
            html: ({ router }) => {
                return new PackageView({
                    router,
                    cdnState: appState.cdnState,
                    packageId: parts.slice(-1)[0],
                })
            },
        }
    },
})

class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({ router }: { router: Router; appState: AppState }) {
        this.children = [
            parseMd({
                src: `
# Javascript / WASM

This section gathers the packages able to run in the browser including javascript and/or webassembly source code.

*TODO: IMPLEMENT SEARCH VIEW LIKE IN PROJECTS*
`,
                router: router,
            }),
        ]
    }
}
