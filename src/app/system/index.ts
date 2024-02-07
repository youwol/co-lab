import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AppState } from '../app-state'
import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { HdPathBookView, InfoSectionView } from '../common'
import { map } from 'rxjs/operators'
import * as Logs from './logs'

export * from './state'

export const navigation = (appState: AppState) => ({
    name: 'System',
    withIcon: { tag: 'i', class: 'fas fa-wrench mr-2' },
    tableOfContent: Views.tocView,
    html: ({ router }) => new PageView({ router, appState }),
    '/logs': Logs.navigation(appState),
})

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ appState, router }: { appState: AppState; router: Router }) {
        this.children = [
            parseMd({
                src: `
# System

<info>
This page gathers system related information.

</info>

## Paths

### Databases

<paths type="databases"></paths>

This folder persist the components & explorer data.

### Cache

<paths type="system"></paths>


This folder persist the artifacts & manifests created when working with projects.

`,
                router,
                views: {
                    info: (elem: HTMLElement) => {
                        return new InfoSectionView({
                            text: elem.innerHTML,
                            router,
                        })
                    },
                    paths: (elem) =>
                        new HdPathBookView({
                            path: appState.environment$.pipe(
                                map(
                                    (env) =>
                                        env.configuration.pathsBook[
                                            elem.getAttribute('type')
                                        ],
                                ),
                            ),
                        }),
                },
            }),
        ]
    }
}
