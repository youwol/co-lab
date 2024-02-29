import { AppState } from '../../app-state'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { BackendView } from './package.views'

export const navigation = (appState: AppState) => ({
    name: 'Backends',
    icon: {
        tag: 'div',
        class: 'fas fa-server mr-2',
    },
    html: ({ router }) => new PageView({ router, appState }),
    '/**': async ({ path }: { path: string }) => {
        const parts = path.split('/').filter((d) => d != '')
        return {
            tableOfContent: Views.tocView,
            children: [],
            html: ({ router }) => {
                return new BackendView({
                    router,
                    appState: appState,
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
# Backends

Gathers the installed backends.

Backends are components executed in your PC (not in the web-browser).
For now only python backends are supported, in the near future we expect allowing to run any kind of backends.
`,
                router: router,
            }),
        ]
    }
}
