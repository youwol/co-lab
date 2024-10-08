import { AppState } from '../app-state'
import {
    raiseHTTPErrors,
    send$,
    WebSocketResponse$,
} from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import { Observable } from 'rxjs'
import { map, mergeMap, shareReplay } from 'rxjs/operators'

import * as Browser from './browser'
import { Label } from '@youwol/local-youwol-client'

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

/**
 * @category Event
 */
export class CommandEvents {
    /**
     * @group Observables
     */
    log$: WebSocketResponse$<unknown, Label>

    constructor(public readonly command: pyYw.Routers.Environment.Command) {
        this.log$ =
            new pyYw.PyYouwolClient().admin.customCommands.webSocket.log$({})
    }

    static fullId(flowId: string, stepId: string) {
        return `${flowId}#${stepId}`
    }
}

/**
 * @category State
 */
export class State {
    /**
     * @group Immutable Constants
     */
    public readonly client = new pyYw.PyYouwolClient().admin.environment

    /**
     * @group Observables
     */
    public readonly environment$: Observable<pyYw.Routers.Environment.EnvironmentStatusResponse>

    /**
     * @group State
     */
    public readonly appState: AppState

    /**
     * @group State
     */
    public readonly browserState: Browser.State

    /**
     * @group Immutable Constants
     */
    public readonly commandsEvent: { [k: string]: CommandEvents } = {}

    /**
     * @group Observables
     */
    public readonly customDispatches$: Observable<{
        [k: string]: pyYw.Routers.Environment.CustomDispatch[]
    }>

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
        this.environment$ = this.appState.environment$
        this.customDispatches$ = this.environment$.pipe(
            mergeMap(() => this.client.queryCustomDispatches$()),
            raiseHTTPErrors(),
            map((response) => response.dispatches),
            shareReplay(1),
        )
        this.browserState = new Browser.State({ appState: this.appState })
    }

    openCommand(command: pyYw.Routers.Environment.Command) {
        if (!this.commandsEvent[command.name]) {
            this.commandsEvent[command.name] = new CommandEvents(command)
        }
    }

    executeNoBodyCommand$({ url, method }: { url: string; method: Method }) {
        return send$('query', url, {
            method,
        }).pipe(raiseHTTPErrors())
    }

    executeWithBodyCommand$({
        url,
        body,
        method,
    }: {
        url: string
        method: Method
        body: unknown
    }) {
        return send$('update', url, {
            method,
            json: body,
        }).pipe(raiseHTTPErrors())
    }
}
