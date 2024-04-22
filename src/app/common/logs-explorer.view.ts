import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs'
import * as pyYw from '@youwol/local-youwol-client'
import { Routers } from '@youwol/local-youwol-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { ExpandableGroupView } from './expandable-group.view'
import { Label } from '@youwol/local-youwol-client/src/lib/interfaces'
import { DataView } from './data.view'

export const labelMethodIcons = {
    'Label.ADMIN': 'fas fa-users-cog',
    'Label.API_GATEWAY': 'fas fa-door-open',
    'Label.MIDDLEWARE': 'fas fa-ghost',
    'Label.END_POINT': 'fas fa-microchip',
    'Label.APPLICATION': 'fas fa-play',
    'Label.LOG': 'fas fa-edit',
}
export const labelLogIcons = {
    'Label.LOG_WARNING': 'fas fa-exclamation-circle fv-text-focus',
    'Label.LOG_ERROR': 'fas fa-times fv-text-error',
    'Label.DONE': 'fas fa-flag',
}

export class LogsExplorerState {
    public readonly title: string
    public readonly t0$ = new BehaviorSubject(Date.now())
    public readonly rootLogs$: Observable<Routers.System.QueryLogsResponse>

    public readonly logs$ = new ReplaySubject<pyYw.Routers.System.LogsResponse>(
        1,
    )

    public readonly fetchingLogs$ = new BehaviorSubject<boolean>(false)

    public readonly stack$ = new BehaviorSubject<Routers.System.LogResponse[]>(
        [],
    )

    private rootLogsResponse: Routers.System.LogsResponse
    public delta = {}

    constructor(params: {
        rootLogs$: Observable<Routers.System.QueryLogsResponse> | string
        title: string
    }) {
        Object.assign(this, params)

        if (typeof params.rootLogs$ === 'string') {
            this.rootLogs$ = new pyYw.PyYouwolClient().admin.system
                .queryLogs$({
                    parentId: params.rootLogs$,
                })
                .pipe(raiseHTTPErrors())
        }
    }
    refresh() {
        this.fetchingLogs$.next(true)
        this.stack$.value.length == 0 && this.t0$.next(Date.now())
        this.stack$.value.length == 0
            ? this.rootLogs$.subscribe((response) => {
                  this.logs$.next(response)
                  this.rootLogsResponse = response
                  this.fetchingLogs$.next(false)
              })
            : new pyYw.PyYouwolClient().admin.system
                  .queryLogs$({
                      parentId: this.stack$.value.slice(-1)[0].contextId,
                  })
                  .pipe(raiseHTTPErrors())
                  .subscribe((response) => {
                      this.logs$.next(response)
                      this.fetchingLogs$.next(false)
                  })
    }

    elapsedTime(log: Routers.System.LogResponse): number | undefined {
        return log.labels.includes('Label.STARTED') && this.delta[log.contextId]
    }

    clear() {
        this.expandLog()
        this.fetchingLogs$.next(true)
        new pyYw.PyYouwolClient().admin.system.clearLogs$().subscribe(() => {
            this.refresh()
        })
    }

    expandLog(log?: Routers.System.LogResponse) {
        if (!log) {
            this.stack$.next([])
            this.logs$.next(this.rootLogsResponse)
            return
        }
        const stack = this.stack$.value

        new pyYw.PyYouwolClient().admin.system
            .queryLogs$({ parentId: log.contextId })
            .pipe(raiseHTTPErrors())
            .subscribe((response) => {
                const end = response.logs.find((l) =>
                    l.labels.includes('Label.DONE'),
                )
                this.delta[log.contextId] = Math.floor(
                    (end.timestamp - log.timestamp) / 1000,
                )
                this.logs$.next(response)
                if (stack.includes(log)) {
                    const index = stack.indexOf(log)
                    this.stack$.next(stack.slice(0, index + 1))
                } else {
                    this.stack$.next([...this.stack$.value, log])
                }
            })
    }
}

export class LogsExplorerView implements VirtualDOM<'div'> {
    public readonly tag = 'div'

    public readonly class = `w-100 h-100 d-flex flex-column p-2`

    public readonly children: ChildrenLike

    public readonly state: LogsExplorerState

    public readonly style = {
        fontSize: 'smaller',
    }
    constructor(params: {
        rootLogs$: Observable<Routers.System.QueryLogsResponse> | string
        title: string
        showHeaderMenu?: boolean
    }) {
        Object.assign(this, params)
        this.state = new LogsExplorerState({
            rootLogs$: params.rootLogs$,
            title: params.title,
        })
        this.children = [
            params.showHeaderMenu && clearButton(this.state),
            new StackView({ state: this.state }),
            new LogsListView({
                state: this.state,
            }),
        ]
        this.state.refresh()
    }
}

const stepIntoIcon = (
    state: LogsExplorerState,
    log?: Routers.System.LogResponse,
): AnyVirtualDOM => ({
    tag: 'div',
    class: 'fas fa-sign-in-alt fv-text-focus fv-pointer',
    onclick: () => {
        log ? state.expandLog(log) : state.expandLog()
    },
})

const refreshButton = (state: LogsExplorerState): AnyVirtualDOM => {
    return {
        tag: 'i',
        class: {
            source$: state.fetchingLogs$,
            vdomMap: (isFetching) =>
                isFetching
                    ? 'fas fa-spinner fa-spin'
                    : 'fas fa-sync  fv-pointer',
            wrapper: (d) => `${d} ml-1`,
        },
        onclick: () => state.refresh(),
    }
}
const clearButton = (state: LogsExplorerState): AnyVirtualDOM => {
    return {
        tag: 'button',
        class: `btn btn-danger btn-sm`,
        children: [
            {
                tag: 'i',
                class: 'fas fa-trash',
            },
        ],
        style: {
            width: 'fit-content',
        },
        onclick: () => state.clear(),
    }
}

const dateFormat = {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    second: '2-digit' as const,
}

const rootElemStackView = (state: LogsExplorerState) =>
    new ExpandableGroupView({
        icon: {
            tag: 'div',
            ...labelsStyle,
            children: [
                {
                    tag: 'div',
                    innerText: {
                        source$: state.t0$,
                        vdomMap: (t: number) =>
                            new Date(t).toLocaleTimeString([], dateFormat),
                    },
                },
                {
                    tag: 'i',
                    class: 'fas fa-newspaper px-2',
                },
            ],
        },
        title: {
            tag: 'div',
            class: 'd-flex align-items-center',
            children: [
                stepIntoIcon(state),
                { tag: 'i', class: 'mx-1' },
                {
                    tag: 'div',
                    innerText: state.title,
                },
                { tag: 'i', class: 'mx-1' },
                {
                    source$: state.stack$,
                    vdomMap: (stack: unknown[]) =>
                        stack.length === 0
                            ? refreshButton(state)
                            : { tag: 'div' },
                },
            ],
        },
        content: () => {
            return { tag: 'div' }
        },
    })

class StackView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    public readonly state: LogsExplorerState

    constructor(params: { state: LogsExplorerState }) {
        Object.assign(this, params)
        const items = (stack: Routers.System.LogResponse[]) =>
            [
                rootElemStackView(this.state),
                ...stack.map((log) => {
                    return new LogView({
                        state: params.state,
                        log,
                    })
                }),
            ] as AnyVirtualDOM[]
        this.children = [
            {
                tag: 'div',
                children: {
                    source$: this.state.stack$,
                    policy: 'replace',
                    vdomMap: (stack: Routers.System.LogResponse[]) => {
                        return items(stack).map((item, i) => {
                            return {
                                tag: 'div',
                                class: i === stack.length ? '' : 'text-muted',
                                style:
                                    i === stack.length
                                        ? { fontWeight: 'bolder' }
                                        : {},
                                children: [item],
                            }
                        })
                    },
                },
            },
        ]
    }
}

class LogView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'w-100'
    public readonly children: ChildrenLike
    public readonly state: LogsExplorerState
    public readonly log: Routers.System.LogResponse
    constructor(params: {
        state: LogsExplorerState
        log: Routers.System.LogResponse
    }) {
        Object.assign(this, params)
        this.children = [
            new ExpandableGroupView({
                title: new LogTitleView(params),
                icon: new LogLabelsView({
                    log: this.log,
                    state: this.state,
                }),
                content: () => new LogDetailsView({ log: this.log }),
            }),
        ]
    }
}

const labelsStyle = {
    class: 'd-flex align-items-center overflow-auto',
    style: {
        minHeight: '1.5rem',
        width: '33%',
    },
}
class LogLabelsView {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    public readonly connectedCallback: (elem: HTMLElement) => void
    public readonly state: LogsExplorerState
    public readonly log: Routers.System.LogResponse

    constructor(params: {
        log: Routers.System.LogResponse
        state: LogsExplorerState
    }) {
        Object.assign(this, params, labelsStyle)
        const labelsView: AnyVirtualDOM[] = this.log.labels
            .filter((label) => label && labelMethodIcons[label])
            .map((label) => {
                return {
                    tag: 'div' as const,
                    class: labelMethodIcons[label],
                }
            })
            .reduce((acc, e, index, array) => {
                acc.push(e)
                index < array.length - 1 &&
                    acc.push({ tag: 'i', style: { marginRight: '2px' } })
                return acc
            }, [])

        this.children = [
            {
                tag: 'i',
                innerText: new Date(
                    this.log.timestamp / 1000,
                ).toLocaleTimeString([], dateFormat),
            },
            {
                tag: 'div',
                class: 'd-flex  align-items-center px-2',
                children: labelsView,
            },
        ]
        this.connectedCallback = (elem: HTMLElement) => {
            elem.scrollLeft = elem.scrollWidth - elem.clientWidth
        }
    }
}
class LogTitleView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex align-items-center'
    public readonly style = {
        maxWidth: '50%',
        minWidth: '50%',
    }
    public readonly state: LogsExplorerState
    public readonly log: Routers.System.LogResponse
    public readonly children: ChildrenLike

    constructor(params: {
        state: LogsExplorerState
        log: Routers.System.LogResponse
    }) {
        Object.assign(this, params)
        const isMethodCall = this.log.labels.includes('Label.STARTED')
        const labelsLogType: AnyVirtualDOM[] = this.log.labels
            .filter((label: Label) => labelLogIcons[label])
            .map((label) => {
                return {
                    tag: 'div',
                    class: `${labelLogIcons[label]} mr-1`,
                }
            })
        const stepInto = stepIntoIcon(this.state, this.log)
        const labelStatus = {
            Failed: {
                tag: 'i' as const,
                class: 'fas fa-times text-danger mr-1',
            },
            Unresolved: {
                tag: 'i' as const,
                class: 'fas fa-question-circle text-warning mr-1',
            },
        }
        const labels = [
            this.log.status && labelStatus[this.log.status],
            ...labelsLogType,
            isMethodCall && stepInto,
        ].filter((l) => l !== undefined)

        const timingView: AnyVirtualDOM = this.state.elapsedTime(this.log) &&
            this.state.delta[this.log.contextId] && {
                tag: 'div',
                class: 'mx-2',
                innerText: `(${this.state.elapsedTime(this.log)}ms)`,
            }
        this.children = [
            {
                tag: 'div',
                class: 'd-flex align-items-center',
                children: labels,
            },
            { tag: 'i', class: 'mx-1' },
            {
                tag: 'div',
                class: 'overflow-auto',
                innerText: this.log.text,
            },
            timingView,
            this.log === this.state.stack$.value.slice(-1)[0] &&
                refreshButton(this.state),
            { tag: 'i', class: 'flex-grow-1', style: { minWidth: '0px' } },
        ]
    }
}

class LogDetailsView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'py-2 overflow-auto'
    public readonly children: ChildrenLike
    public readonly log: Routers.System.LogResponse
    public readonly style = {
        fontSize: 'small',
        fontWeight: 'normal' as const,
    }
    constructor(params: { log: Routers.System.LogResponse }) {
        Object.assign(this, params)
        const attributes: AnyVirtualDOM[] = Object.entries(
            this.log.attributes,
        ).map(([k, v]) => {
            return {
                tag: 'div',
                class: 'd-flex align-items-center',
                children: [
                    {
                        tag: 'li',
                        innerText: `${k}:`,
                        style: {
                            fontWeight: 'bolder',
                        },
                    },
                    { tag: 'i', class: 'mx-1' },
                    {
                        tag: 'div',
                        innerText: v,
                    },
                ],
            }
        })
        const labels: AnyVirtualDOM[] = this.log.labels.map((l) => {
            return {
                tag: 'li',
                innerText: l,
            }
        })
        this.children = [
            {
                tag: 'ul',
                innerText: 'Attributes list:',
                children: attributes,
            },
            {
                tag: 'ul',
                innerText: 'Labels list:',
                children: labels,
            },
            {
                tag: 'ul',
                children: [new DataView(this.log.data, true)],
            },
        ]
    }
}

class LogsListView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'w-100 pl-3 bg-dark text-light border-left'
    public readonly children: ChildrenLike

    public readonly state: LogsExplorerState

    constructor(params: { state: LogsExplorerState }) {
        Object.assign(this, params)
        this.children = {
            policy: 'replace',
            source$: this.state.logs$,
            vdomMap: (response: pyYw.Routers.System.LogsResponse) =>
                response.logs.map((log) => {
                    return new LogView({ state: this.state, log })
                }),
        }
    }
}
