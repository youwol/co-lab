import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Navigation, parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { AppState } from '../../app-state'
import { InfoSectionView } from '../../common'
import { debounceTime, merge, Observable, of } from 'rxjs'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { PyYouwolClient, Routers } from '@youwol/local-youwol-client'
import { LogsExplorerView } from '../../common/logs-explorer.view'
import { filter, map, mergeMap, shareReplay } from 'rxjs/operators'

export * from './state'

function backendId(backend: Routers.Environment.ProxiedBackend) {
    return window.btoa(`${backend.name}#${backend.version}`)
}
function backendName(backend: Routers.Environment.ProxiedBackend) {
    return `${backend.name}#${backend.version}`
}

export const navigation = (appState: AppState): Navigation => ({
    name: 'Backends',
    decoration: { icon: { tag: 'i', class: 'fas fa-server mr-2' } },
    tableOfContent: Views.tocView,
    html: ({ router }) => new PageView({ router, appState }),
    '...': appState.environment$.pipe(
        map((env) => ({ path, router }: { path: string; router: Router }) => {
            return lazyResolver(path, env, router, appState)
        }),
    ),
})

function lazyResolver(
    path: string,
    env: Routers.Environment.EnvironmentStatusResponse,
    router: Router,
    appState: AppState,
) {
    const parts = path.split('/').filter((d) => d != '')
    if (parts.length === 0) {
        const children = env.youwolEnvironment.proxiedBackends
            .map((backend) => {
                return {
                    name: backendName(backend),
                    id: backendId(backend),
                }
            })
            .sort((a, b) => a['name'].localeCompare(b['name']))
            .map(({ name, id }) => {
                return {
                    name,
                    id,
                    leaf: true,
                    decoration: {
                        icon: {
                            tag: 'i' as const,
                            class: 'fas fa-running mr-2',
                        },
                    },
                }
            })
        return {
            children,
            html: undefined,
        }
    }
    return {
        tableOfContent: Views.tocView,
        children: [],
        html: () => {
            const id = window.atob(parts.slice(-1)[0])
            return new ExampleBackendView({
                backend: {
                    name: id.split('#')[0],
                    version: id.split('#')[1],
                },
                router,
                appState,
            })
        },
    }
}

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ router }: { appState: AppState; router: Router }) {
        this.children = [
            parseMd({
                src: `
# Backends

<info>
This page gathers information related to the running backends.

</info>
`,
                router,
                views: {
                    info: (elem: HTMLElement) => {
                        return new InfoSectionView({
                            text: elem.innerHTML,
                            router,
                        })
                    },
                },
            }),
        ]
    }
}

export class ExampleBackendView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({
        backend,
        router,
        appState,
    }: {
        backend: { name: string; version: string }
        appState: AppState
        router: Router
    }) {
        const logs$ = merge(
            of({ name: backend.name, version: backend.version }),
            appState.backendsState.response$,
        ).pipe(
            filter(
                (resp) =>
                    resp.name == backend.name &&
                    resp.version == backend.version,
            ),
            debounceTime(500),
            mergeMap(() =>
                new PyYouwolClient().admin.system.queryBackendLogs$({
                    name: backend.name,
                    version: backend.version,
                }),
            ),
            raiseHTTPErrors(),
            shareReplay({ bufferSize: 1, refCount: true }),
        )
        this.children = [
            parseMd({
                src: `
# ${backend.name}

**Version**: ${backend.version}

You can find the associated component in your database [here](@nav/components/backends/${window.btoa(backend.name)}).

Below are gathered the logs generated by the service, latest entries come first.

<terminate></terminate>

## Server outputs 

<backendOut></backendOut>

## Logs 

<backendLogs></backendLogs>
`,
                router,
                views: {
                    info: (elem: HTMLElement) => {
                        return new InfoSectionView({
                            text: elem.innerHTML,
                            router,
                        })
                    },
                    terminate: () => {
                        return new TerminateButton({ ...backend, router })
                    },
                    backendLogs: () => {
                        return new LogsExplorerView({
                            rootLogs$: logs$,
                            title: 'Backend logs',
                            showHeaderMenu: false,
                        })
                    },
                    backendOut: () => {
                        return new OutputsView({
                            logs$,
                        })
                    },
                },
            }),
        ]
    }
}

class OutputsView implements VirtualDOM<'pre'> {
    public readonly tag = 'pre'
    public readonly children: ChildrenLike
    public readonly style = {
        backgroundColor: 'black',
        color: 'white',
        fontSize: 'smaller',
        minHeight: '25vh',
        maxHeight: '50vh',
    }
    constructor({
        logs$,
    }: {
        logs$: Observable<Routers.System.BackendLogsResponse>
    }) {
        this.children = {
            policy: 'replace',
            source$: logs$,
            vdomMap: (resp: Routers.System.BackendLogsResponse) => {
                return resp.server_outputs.reverse().map((text) => ({
                    tag: 'div',
                    innerText: text,
                }))
            },
        }
    }
}

class TerminateButton implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'd-flex align-items-center justify-content-center border rounded p-1 fv-pointer my-1 text-danger'

    public readonly style = {
        width: 'fit-content',
        fontWeight: 'bolder' as const,
    }
    public readonly children: ChildrenLike
    constructor({
        name,
        version,
        router,
    }: {
        name: string
        version: string
        router: Router
    }) {
        this.children = [
            {
                tag: 'i',
                class: 'fas fa-ban mr-1',
            },
            {
                tag: 'div',
                innerText: 'Terminate',
                onclick: () => {
                    new PyYouwolClient().admin.system
                        .terminateBackend$({
                            name,
                            version,
                        })
                        .subscribe(() =>
                            router.navigateTo({
                                path: '/environment/backends',
                            }),
                        )
                },
            },
        ]
    }
}
