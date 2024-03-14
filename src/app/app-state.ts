import { distinctUntilChanged, Observable, Subject } from 'rxjs'
import { filter, map, mergeMap, shareReplay, take, tap } from 'rxjs/operators'
import * as Projects from './projects'
import * as Components from './components'
import * as Backends from './environment/backends'
import * as Environment from './environment'
import * as Notification from './environment/notifications'
import * as Explorer from './explorer'
import { AnyVirtualDOM } from '@youwol/rx-vdom'
import * as pyYw from '@youwol/local-youwol-client'
import { WsRouter } from '@youwol/local-youwol-client'
import { Accounts } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { Navigation, Router, Views } from '@youwol/mkdocs-ts'
import * as Dashboard from './dashboard'
import * as Mounted from './mounted'
import { setup } from '../auto-generated'
import { PageView } from './on-load'

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
    public readonly environmentState: Environment.State

    /**
     * @group State
     */
    public readonly notificationsState = new Notification.State()

    /**
     * @group Observables
     */
    public readonly connectedLocal$: Observable<boolean>

    public readonly hdFolder$ = new Subject<string>()

    constructor() {
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
        this.connectedLocal$.pipe(filter((c) => c)).subscribe(() => {
            this.environmentClient.getStatus$().subscribe()
        })
        this.projectsState = new Projects.State({ appState: this })
        this.cdnState = new Components.State({ appState: this })
        this.environmentState = new Environment.State({ appState: this })

        this.environmentClient.getStatus$().subscribe()
        this.projectsState.projects$.subscribe(() => {})
        this.confChanged$ = this.environment$.pipe(
            map((env) => env.configuration.pathsBook.config),
            distinctUntilChanged(),
            tap((path) => console.log('Configuration changed', path)),
        )
        this.confChanged$.subscribe(() => {
            this.cdnState.refreshPackages()
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

        this.navigation = {
            name: '',
            tableOfContent: Views.tocView,
            html: ({ router }) => new PageView({ router }),
            '/dashboard': Dashboard.navigation(this),
            '/environment': Environment.navigation(this),
            '/components': Components.navigation(this),
            '/projects': Projects.navigation(this),
            '/explorer': Explorer.navigation({
                session$: this.session$,
            }),
            '/mounted': Mounted.navigation(this),
        }
        this.router = new Router({
            navigation: this.navigation,
            basePath: `/applications/${setup.name}/${setup.version}`,
        })
        this.router.explorerState.selectedNode$.subscribe((node) => {
            console.log({ node, state: this.router.explorerState })
        })
    }
}
