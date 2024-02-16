import { BehaviorSubject, merge, ReplaySubject } from 'rxjs'
import { PyYouwolClient, Routers } from '@youwol/local-youwol-client'
import { filter } from 'rxjs/operators'

type InstallBackendEvent = Routers.System.InstallBackendEvent

export type Error = {
    kind: 'BackendInstall'
    message: string
}

export type Backend = {
    name: string
    version: string
}

export type BackendInstallFlow = Backend & { installId: string }

export class BackendEvents {
    /**
     * All install events.
     */
    public readonly install$ = new ReplaySubject<InstallBackendEvent>(100)

    /**
     * Start install events for all backends.
     */
    public readonly startInstall$ = this.install$.pipe(
        filter(({ event }) => event === 'started'),
    )
    /**
     * End install events for all backends.
     */
    public readonly endInstall$ = this.install$.pipe(
        filter(({ event }) => event !== 'started'),
    )

    /**
     * Std outputs of backend's `install.sh` script for all backends.
     */
    public readonly installStdOut$ = new ReplaySubject<
        BackendInstallFlow & { text: string }
    >(1000)

    /**
     * The backends under installation at a particular point in time.
     */
    public readonly installing$ = new BehaviorSubject<BackendInstallFlow[]>([])

    /**
     * Emit each time a backend failed to install.
     */
    public readonly failedInstall$ = new ReplaySubject<BackendInstallFlow>()

    constructor() {
        new PyYouwolClient().admin.system.webSocket
            .installBackendEvent$()
            .subscribe((m) => {
                this.install$.next(m.data)
            })

        new PyYouwolClient().admin.system.webSocket
            .installBackendStdOut$()
            .subscribe((m) => {
                this.installStdOut$.next({
                    installId: m.attributes.installId,
                    name: m.attributes.name,
                    version: m.attributes.version,
                    text: m.text,
                })
            })

        merge(this.startInstall$, this.endInstall$).subscribe(
            ({ installId, name, version, event }) => {
                const currentInstalls = this.installing$.value
                if (
                    event === 'started' &&
                    this.installing$.value.find(
                        (d) =>
                            d.name == name &&
                            d.version == version &&
                            d.installId == installId,
                    ) == undefined
                ) {
                    this.installing$.next([
                        ...currentInstalls,
                        { name, version, installId },
                    ])
                    return
                }
                const remaining = currentInstalls.filter(
                    (d) => d.name !== name && d.version !== version,
                )
                if (remaining.length !== this.installing$.value.length) {
                    this.installing$.next(remaining)
                }
            },
        )
        this.endInstall$
            .pipe(filter(({ event }) => event === 'failed'))
            .subscribe((failed) => this.failedInstall$.next(failed))
    }
}

export class State {
    public readonly backendEvents = new BackendEvents()

    public readonly errors = new BehaviorSubject<Error[]>([])
    constructor() {
        this.backendEvents.failedInstall$.subscribe(({ name, version }) => {
            const newError = {
                kind: 'BackendInstall' as const,
                message: `${name}#${version} failed to install.`,
            }
            this.errors.next([...this.errors.value, newError])
        })
    }
}
