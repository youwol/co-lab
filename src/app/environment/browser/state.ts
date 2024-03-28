import { AppState } from '../../app-state'
import { merge, Observable, Subject } from 'rxjs'
import { PyYouwolClient, Routers } from '@youwol/local-youwol-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { mergeMap, shareReplay } from 'rxjs/operators'

export class State {
    public readonly status$: Observable<Routers.Environment.BrowserCacheStatusResponse>
    private refresh$ = new Subject<unknown>()
    constructor({ appState }: { appState: AppState }) {
        this.status$ = merge(appState.environment$, this.refresh$).pipe(
            mergeMap(() => {
                return new PyYouwolClient().admin.environment.getBrowserCacheStatus$()
            }),
            raiseHTTPErrors(),
            shareReplay({ bufferSize: 1, refCount: true }),
        )
    }

    sync() {
        this.refresh$.next(undefined)
    }
    clear() {
        new PyYouwolClient().admin.environment
            .clearBrowserCache({ body: { file: true, memory: true } })
            .subscribe(() => this.refresh$.next(undefined))
    }
}
