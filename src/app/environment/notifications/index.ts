import { AppState } from '../../app-state'
import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { InfoSectionView } from '../../common'
import { State } from './state'
import { map } from 'rxjs/operators'
import { Routers } from '@youwol/local-youwol-client'
import { BackendInstallNotificationView } from './backend/views'

export * from './state'

export const navigation = (appState: AppState) => ({
    name: 'Notifications',
    html: ({ router }) => new PageView({ router, appState }),
    tableOfContent: Views.tocView,
    icon: { tag: 'i', class: 'fas fa-envelope-open-text mr-2' },
})

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({ appState, router }: { appState: AppState; router: Router }) {
        this.children = [
            parseMd({
                src: `
# Notifications

<info>
This page gathers notifications about ongoing installations.

</info>

<notifications></notifications>
                `,
                router,
                views: {
                    info: (elem: HTMLElement) => {
                        return new InfoSectionView({
                            text: elem.innerHTML,
                            router,
                        })
                    },
                    notifications: () => {
                        return new NotificationsView({
                            state: appState.notificationsState,
                            router,
                        })
                    },
                },
            }),
        ]
    }
}

export class NotificationsView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ state, router }: { state: State; router: Router }) {
        const backend$ = state.backendEvents.startInstall$

        this.children = {
            policy: 'append',
            source$: backend$.pipe(map((b) => [b])),
            vdomMap: ({
                name,
                version,
                installId,
            }: Routers.System.InstallBackendEvent) => {
                return new BackendInstallNotificationView({
                    router,
                    backend: name,
                    version,
                    installId,
                    state,
                })
            },
        }
    }
}
