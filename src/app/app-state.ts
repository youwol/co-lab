import { Observable, Subject } from 'rxjs'
import { filter, map, shareReplay, take, tap } from 'rxjs/operators'
import * as Projects from './projects'
import * as Components from './components'
import * as Environment from './environment'
import { AnyVirtualDOM } from '@youwol/rx-vdom'
import * as pyYw from '@youwol/local-youwol-client'
import { WsRouter } from '@youwol/local-youwol-client'

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
    public readonly environmentClient = new pyYw.PyYouwolClient().admin
        .environment

    /**
     * @group Observables
     */
    public readonly environment$: Observable<pyYw.Routers.Environment.EnvironmentStatusResponse>

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
    public readonly environmentState: Environment.State

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
            tap((env) => console.log('Got environment from WS', env)),
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
    }
}
