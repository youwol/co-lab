import { AppState } from '../app-state'
import * as Backends from './backends'
import * as Frontends from './frontends'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { parseMd, Router } from '@youwol/mkdocs-ts'
export * from './state'

export const navigation = (appState: AppState) => ({
    name: 'Components',
    icon: { tag: 'i', class: 'fas  fa-microchip mr-2' },
    html: ({ router }) => new PageView({ router, appState }),
    '/frontends': Frontends.navigation(appState),
    '/backends': Backends.navigation(appState),
})

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
