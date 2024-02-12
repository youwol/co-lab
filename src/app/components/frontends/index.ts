import { AppState } from '../../app-state'
import * as Javascript from './javascript'
import * as Python from './python'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { parseMd, Router } from '@youwol/mkdocs-ts'

export const navigation = (appState: AppState) => ({
    name: 'Frontends',
    icon: {
        tag: 'div',
        class: 'fas fa-code mx-2',
    },
    html: ({ router }) => new PageView({ router, appState }),
    '/javascript': Javascript.navigation(appState),
    '/python': Python.navigation(appState),
})

class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({ router }: { router: Router; appState: AppState }) {
        this.children = [
            parseMd({
                src: `
# Frontends

Frontends components are running in your web-browser.

Two kinds are distinguished:

*  **javascript & web-assembly**: regular components interpreted by the browser.
*  **python**: python packages from the pyodide ecosystem. This includes:
    *  any pure python wheels from the PyPi repository
    *  ported non pure python wheel (e.g. numpy, pandas, etc) from the pyodide repository.

`,
                router: router,
            }),
        ]
    }
}
