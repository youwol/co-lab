import { AppState } from '../../app-state'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Navigation, parseMd, Router } from '@youwol/mkdocs-ts'
import { lazyResolver } from '../index'
import { debounceTime } from 'rxjs'
import { map } from 'rxjs/operators'

export const navigation = (appState: AppState): Navigation => ({
    name: 'Backends',
    decoration: {
        icon: {
            tag: 'div',
            class: 'fas fa-server mr-2',
        },
    },
    html: ({ router }) => new PageView({ router, appState }),
    '...': appState.cdnState.status$
        .pipe(debounceTime(500))
        .pipe(map((status) => lazyResolver(status, appState, 'backend'))),
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
