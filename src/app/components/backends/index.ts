import { AppState } from '../../app-state'
import { subRoutes } from '../index'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { parseMd, Router } from '@youwol/mkdocs-ts'

export const navigation = (appState: AppState) => ({
    name: 'Backends',
    icon: {
        tag: 'div',
        class: 'fas fa-server mr-2',
    },
    html: ({ router }) => new PageView({ router, appState }),
    ...subRoutes({ type: 'backend', appState }),
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
