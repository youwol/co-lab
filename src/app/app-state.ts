import {
    BehaviorSubject,
    combineLatest,
    distinctUntilChanged,
    firstValueFrom,
    Observable,
} from 'rxjs'
import { filter, map, mergeMap, shareReplay, take, tap } from 'rxjs/operators'
import * as Projects from './projects'
import * as Components from './components'
import * as Backends from './environment/backends'
import * as EsmServers from './environment/esm-servers'
import * as Environment from './environment'
import * as Notification from './environment/notifications'
import * as Explorer from './explorer'
import * as Doc from './doc'
import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import * as pyYw from '@youwol/local-youwol-client'
import { Routers, WsRouter } from '@youwol/local-youwol-client'
import { Accounts } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import {
    MdWidgets,
    Navigation,
    parseMd,
    Router,
    Views,
} from '@youwol/mkdocs-ts'
import * as Mounted from './mounted'
import { setup } from '../auto-generated'
import { Installer, PreferencesFacade } from '@youwol/os-core'
import { DesktopWidgetsView, NewAppsView } from './home/views'
import { encodeHdPath } from './mounted'
import { Patches } from './common'

export type Topic =
    | 'Projects'
    | 'Updates'
    | 'CDN'
    | 'Admin'
    | 'Environment'
    | 'System'

export interface Screen {
    topic: Topic
    viewId: string
    view: AnyVirtualDOM
}

pyYw.PyYouwolClient.ws = new WsRouter({
    autoReconnect: true,
    autoReconnectDelay: 1000,
})

export type MountedPath = {
    path: string
    type: 'file' | 'folder'
}

export type AppMode =
    | 'normal'
    | 'docRemoteBelow'
    | 'docRemoteInTab'
    | 'docCompanion'

/**
 * @category State
 */
export class AppState {
    /**
     * @group Immutable Constants
     */
    public readonly navigation: Navigation
    /**
     * @group Immutable Constants
     */
    public readonly router: Router
    /**
     * @group Observables
     */
    public readonly confChanged$: Observable<string>
    /**
     * @group Immutable Constants
     */
    public readonly environmentClient = new pyYw.PyYouwolClient().admin
        .environment

    /**
     * @group Observables
     */
    public readonly environment$: Observable<pyYw.Routers.Environment.EnvironmentStatusResponse>

    /**
     * @group Observables
     */
    public readonly session$: Observable<Accounts.SessionDetails>

    /**
     * @group State
     */
    public readonly projectsState: Projects.State

    /**
     * @group State
     */
    public readonly cdnState: Components.State

    /**
     * @group State
     */
    public readonly backendsState = new Backends.State()

    /**
     * @group State
     */
    public readonly esmServersState: EsmServers.State

    /**
     * @group State
     */
    public readonly environmentState: Environment.State

    /**
     * @group State
     */
    public readonly notificationsState = new Notification.State()

    /**
     * @group Observables
     */
    public readonly connectedLocal$: Observable<boolean>

    public readonly mountedHdPaths$ = new BehaviorSubject<MountedPath[]>([])

    public readonly appMode$ = new BehaviorSubject<AppMode>('normal')

    public readonly navBroadcastChannel = new BroadcastChannel(
        `colab-${Math.floor(Math.random() * 1e6)}`,
    )

    constructor() {
        const queryString = window.location.search
        const urlParams = new URLSearchParams(queryString)

        if (urlParams.get('appMode') === 'docCompanion') {
            this.appMode$ = new BehaviorSubject('docCompanion')
        }
        if (urlParams.get('channelId')) {
            this.navBroadcastChannel = new BroadcastChannel(
                urlParams.get('channelId'),
            )
        }

        pyYw.PyYouwolClient.startWs$()
            .pipe(take(1))
            .subscribe(() => {
                console.log('Web sockets connected')
            })
        this.environment$ = this.environmentClient.webSocket.status$().pipe(
            map(({ data }) => data),
            shareReplay(1),
        )
        this.connectedLocal$ = pyYw.PyYouwolClient.ws.connected$

        this.projectsState = new Projects.State({ appState: this })
        this.cdnState = new Components.State({ appState: this })
        this.esmServersState = new EsmServers.State({ appState: this })
        this.environmentState = new Environment.State({ appState: this })

        this.projectsState.projects$.subscribe(() => {})
        this.confChanged$ = this.environment$.pipe(
            map((env) => env.youwolEnvironment.pathsBook.config),
            distinctUntilChanged(),
            tap((path) => console.log('Configuration changed', path)),
        )
        this.connectedLocal$.subscribe((connected) => {
            if (connected) {
                this.environmentClient.getStatus$().subscribe()
                this.cdnState.refreshPackages()
                this.projectsState.refreshProjects()
            }
        })

        this.session$ = this.environment$.pipe(
            map((env) => env['youwolEnvironment'].currentConnection),
            distinctUntilChanged(
                (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr),
            ),
            mergeMap(() => new Accounts.AccountsClient().getSessionDetails$()),
            raiseHTTPErrors(),
            shareReplay(1),
        )
        this.navigation = this.getNav()

        this.router = new Router({
            navigation: this.navigation,
            basePath: `/applications/${setup.name}/${setup.version}`,
            redirects: (target) => this.getRedirects(target),
        })
        this.navBroadcastChannel.onmessage = (e) => {
            e.data.path && this.router.navigateTo({ path: e.data.path })
            e.data === 'done' && this.appMode$.next('normal')
        }
        if (
            this.appMode$.value === 'docCompanion' &&
            parent.document === document
        ) {
            window.addEventListener('beforeunload', () => {
                this.navBroadcastChannel.postMessage('done')
            })
        }
        PageView.warmUp()
    }

    mountHdPath(path: string, type: 'file' | 'folder') {
        const values = this.mountedHdPaths$.value
        const redirectNav =
            type === 'folder'
                ? `/mounted/${encodeHdPath(path)}`
                : `/mounted/file_${encodeHdPath(path)}`
        if (!values.map((p) => p.path).includes(path)) {
            this.mountedHdPaths$.next([...values, { path, type }])
            this.router.explorerState.root$
                .pipe(
                    filter(() =>
                        this.router.explorerState.getNode(redirectNav),
                    ),
                    take(1),
                    Patches.patchRequestObjectAlreadyUsed(),
                )
                .subscribe(() => {
                    this.router.navigateTo({
                        path: redirectNav,
                    })
                })
            return
        }
        this.router.navigateTo({
            path: redirectNav,
        })
    }

    private getNav() {
        const navs: Record<
            Exclude<AppMode, 'docRemoteBelow' | 'docRemoteInTab'>,
            Navigation
        > = {
            normal: {
                name: 'Home',
                decoration: {
                    icon: { tag: 'div', class: 'fas fa-home pe-1' },
                },
                tableOfContent: Views.tocView,
                html: ({ router }) => new PageView({ router, appState: this }),
                '/environment': Environment.navigation(this),
                '/components': Components.navigation(this),
                '/projects': Projects.navigation(this),
                '/explorer': Explorer.navigation({
                    session$: this.session$,
                }),
                '/mounted': Mounted.navigation(this),
                '/doc': Doc.navigation(this),
            },
            docCompanion: {
                name: 'Home',
                decoration: {
                    icon: { tag: 'div', class: 'fas fa-home pe-1' },
                    wrapperClass: 'd-none',
                },
                tableOfContent: Views.tocView,
                html: ({ router }) => new PageView({ router, appState: this }),
                '/doc': Doc.navigation(this),
            },
        }
        return navs[this.appMode$.value]
    }

    async getRedirects(target: string) {
        let to = target
        if (target.startsWith('/doc')) {
            // Documentation features examples using code snippets in python.
            // We await installing the dependencies such that the snippets are displayed right away,
            // and navigation to a given part of the page actually land at the right place.
            // If not done, the code snippet views update after the navigation is done, translating the location of the
            // elements and result in discrepancy with the expected location.
            await firstValueFrom(
                MdWidgets.CodeSnippetView.fetchCmDependencies$('python'),
            )
        }
        if (target.startsWith('/api/youwol')) {
            to = target.replace('/api/youwol', '/doc/api/youwol')
        }
        if (target.startsWith('/api/yw_utils')) {
            to = target.replace('/api/yw_utils', '/doc/api/yw_utils')
        }
        if (this.appMode$.value === 'docCompanion' && !to.startsWith('/doc')) {
            this.navBroadcastChannel.postMessage({
                path: to,
            })
            return
        }
        if (this.appMode$.value == 'docRemoteBelow' && to.startsWith('/doc')) {
            this.navBroadcastChannel.postMessage({
                path: to,
            })
            return
        }
        return to
    }
}

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    static readonly warmUp = () => {
        combineLatest([
            Installer.getApplicationsInfo$(),
            PreferencesFacade.getPreferences$(),
        ]).subscribe()
    }

    constructor({ router, appState }: { router: Router; appState: AppState }) {
        this.children = [
            parseMd({
                src: `
# Home    

The server is running using the configuration file <configFile></configFile>

## Launch-pad

<info>
Here are displayed the applications reference by the [installer script](@nav/environment/profiles.installers), 
they are similar to 'pined' applications.   

You may want to use this 
<a href='https://chromewebstore.google.com/detail/auto-tab-groups/nicjeeimgboiijpfcgfkbemiclbhfnio?pli=1'
target='_blank'>plugin</a> to group YouWol's applications in a tab group (for chrome).

</info>
 
<appsView></appsView>

## Widgets

<info>
Here are the widgets referenced by the [preferences script](@nav/environment/profiles.preferences).

</info>


<desktopWidgets></desktopWidgets>
`,
                router,
                views: {
                    configFile: () => ({
                        tag: 'a',
                        href: '@nav/environment/yw-configuration',
                        innerText: {
                            source$: appState.environment$,
                            vdomMap: (
                                env: Routers.Environment.EnvironmentStatusResponse,
                            ) => {
                                return env.configuration.pathsBook.config.match(
                                    /[^\\/]+$/,
                                )[0]
                            },
                        },
                    }),
                    appsView: () =>
                        new NewAppsView({
                            state: undefined,
                            router,
                        }),
                    desktopWidgets: () => new DesktopWidgetsView(),
                },
            }),
        ]
    }
}
