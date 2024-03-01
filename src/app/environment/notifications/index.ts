import { AppState } from '../../app-state'
import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { InfoSectionView } from '../../common'
import { AssetDownloadNotification, BackendInstallFlow, State } from './state'
import { map } from 'rxjs/operators'
import { Routers } from '@youwol/local-youwol-client'
import { BackendInstallNotificationView } from './backend/views'
import { merge } from 'rxjs'
import { AssetDownloadNotificationView } from './asset/views'

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

function isBackendInstallNotification(
    data: unknown,
): data is BackendInstallFlow {
    return (data as BackendInstallFlow).installId !== undefined
}

function isAssetDownloadNotification(
    data: unknown,
): data is AssetDownloadNotification {
    return (data as AssetDownloadNotification).rawId !== undefined
}

export class NotificationsView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ state, router }: { state: State; router: Router }) {
        const backend$ = state.backendEvents.startInstall$
        const asset$ = state.assetEvents.enqueuedDownload$
        this.children = {
            policy: 'append',
            source$: merge(backend$, asset$).pipe(map((b) => [b])),
            vdomMap: (
                event:
                    | Routers.System.InstallBackendEvent
                    | AssetDownloadNotification,
            ) => {
                if (isBackendInstallNotification(event)) {
                    return new BackendInstallNotificationView({
                        router,
                        backend: event.name,
                        version: event.version,
                        installId: event.installId,
                        state,
                    })
                }
                if (isAssetDownloadNotification(event)) {
                    return new AssetDownloadNotificationView({
                        router,
                        rawId: event.rawId,
                        kind: event.kind,
                        state,
                    })
                }
            },
        }
    }
}
