import { ChildrenLike, RxHTMLElement, VirtualDOM } from '@youwol/rx-vdom'

import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs'
import { delay, filter, map, take, takeUntil, tap } from 'rxjs/operators'
import { AttributesView, labelMethodIcons, LogView } from './log.view'
import { ContextMessage } from '@youwol/local-youwol-client'

/**
 * @category View
 */
export class NodeHeaderView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex align-items-center fv-pointer my-2'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        maxWidth: '50%',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick: (ev: MouseEvent) => void

    constructor(
        message: ContextMessage,
        visible$: BehaviorSubject<boolean>,
        expanded$: BehaviorSubject<boolean>,
        status$: Observable<Status>,
    ) {
        this.children = [
            {
                tag: 'div',
                class: {
                    source$: visible$,
                    vdomMap: (visible): string =>
                        visible ? 'fa-caret-down' : 'fa-caret-right',
                    wrapper: (d) => `fas mr-2 ${d}`,
                },
            },
            {
                tag: 'div',
                class: {
                    source$: status$,
                    vdomMap: (status: Status) => {
                        return (
                            {
                                processing: 'fas fa-spinner fa-spin',
                                error: 'fas fa-times fv-text-error',
                                success: 'fas fa-check fv-text-success',
                            }[status] + ' mr-2'
                        )
                    },
                },
            },
            {
                tag: 'div',
                children: [
                    {
                        tag: 'div',
                        class: 'd-flex flex-align-center px-2',
                        children: message.labels
                            .filter((label) => labelMethodIcons[label])
                            .map((label) => {
                                return {
                                    tag: 'div',
                                    class: labelMethodIcons[label] + ' mx-1',
                                }
                            }),
                    },
                    {
                        tag: 'div',
                        class: 'mr-3',
                        innerText: message.text,
                    },
                ],
            },
            new AttributesView(message.attributes),
        ]
        this.onclick = (ev) => {
            ev.stopPropagation()
            if (!expanded$.getValue()) {
                expanded$.next(true)
            }
            visible$.next(!visible$.getValue())
        }
    }
}

type Status = 'processing' | 'error' | 'success'

/**
 * @category View
 */
export class NodeView implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike
    /**
     * @group Immutable Constants
     */
    public readonly createdChildren = []
    /**
     * @group Observables
     */
    public readonly expanded$: BehaviorSubject<boolean>
    /**
     * @group Observables
     */
    public readonly visible$: BehaviorSubject<boolean>

    /**
     * @group Observables
     */
    public readonly status$ = new BehaviorSubject<Status>('processing')

    /**
     * @group Mutable Variables
     */
    private headerMessage: ContextMessage = undefined

    constructor(
        public readonly state: TerminalState,
        public readonly contextId: string,
        public readonly nestedIndex: number,
        public readonly expanded: boolean,
        messages$: { [key: string]: ReplaySubject<ContextMessage> },
    ) {
        this.expanded$ = new BehaviorSubject<boolean>(expanded)
        this.visible$ = new BehaviorSubject<boolean>(expanded)

        messages$[contextId]
            .pipe(
                filter((message) => message.contextId == this.contextId),
                takeUntil(this.status$.pipe(filter((s) => s != 'processing'))),
            )
            .subscribe((message) => {
                if (message.labels.includes('Label.FAILED')) {
                    this.status$.next('error')
                }

                if (message.labels.includes('Label.DONE')) {
                    this.status$.next('success')
                }
            })

        this.children = [
            {
                tag: 'div',
                class: 'd-flex flex-column overflow-auto',
                children: [
                    {
                        source$: messages$[contextId].pipe(
                            filter(
                                (m) =>
                                    m.contextId == this.contextId &&
                                    m.labels.includes('Label.STARTED'),
                            ),
                            take(1),
                            tap((v) => v),
                        ),
                        vdomMap: (m: ContextMessage) => {
                            this.headerMessage = m
                            return new NodeHeaderView(
                                m,
                                this.visible$,
                                this.expanded$,
                                this.status$,
                            )
                        },
                    },

                    {
                        source$: this.expanded$,
                        vdomMap: (exp: boolean) => {
                            if (!exp) {
                                return { tag: 'div' }
                            }
                            return {
                                tag: 'div',
                                class: {
                                    source$: this.visible$,
                                    vdomMap: (visible) =>
                                        visible ? 'py-2' : 'd-none',
                                },

                                style: {
                                    paddingLeft: `${
                                        this.nestedIndex > 0 ? 40 : 0
                                    }px`,
                                },
                                children: {
                                    policy: 'append',
                                    source$: messages$[contextId].pipe(
                                        filter((m) => {
                                            return !m.labels.includes(
                                                'Label.STARTED',
                                            )
                                        }),
                                        map((message) => [message]),
                                    ),

                                    vdomMap: (message: ContextMessage) => {
                                        if (message.contextId == contextId) {
                                            return new LogView({
                                                state: this.state,
                                                message,
                                            })
                                        }

                                        if (
                                            message.parentContextId ==
                                                contextId &&
                                            !this.createdChildren.includes(
                                                message.contextId,
                                            )
                                        ) {
                                            this.createdChildren.push(
                                                message.contextId,
                                            )
                                            return new NodeView(
                                                this.state,
                                                message.contextId,
                                                nestedIndex + 1,
                                                false,
                                                messages$,
                                            )
                                        }
                                        return { tag: 'div', class: 'd-none' }
                                    },
                                },
                            }
                        },
                    },
                ],
            },
        ]
    }
}

const invite = ``

/**
 * @category State
 */
export class TerminalState implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'
    /**
     * @group Observables
     */
    public readonly customViews$ = new BehaviorSubject<
        { name: string; view: VirtualDOM<'div'> }[]
    >([{ name: 'TERMINAL', view: undefined }])

    /**
     * @group Observables
     */
    public readonly selectedView$ = new BehaviorSubject<string | 'TERMINAL'>(
        'TERMINAL',
    )

    /**
     * @group Observables
     */
    public readonly expanded$ = new BehaviorSubject(true)

    openCustomView(name: string, view: VirtualDOM<'div'>) {
        const actual = this.customViews$.getValue()
        this.customViews$.next([...actual, { name, view }])
    }
}

/**
 * @category View
 */
export class TerminalView implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'
    /**
     * @group States
     */
    public readonly state = new TerminalState()

    /**
     * @group Observables
     */
    public readonly commands$ = new BehaviorSubject([invite, ''])

    /**
     * @group Mutable Variables
     */
    private contentElement: HTMLDivElement

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = {
        source$: this.state.expanded$,
        vdomMap: (expanded): string => (expanded ? 'w-100 h-50' : 'w-100'),
        wrapper: (d) => `${d} w-100 d-flex flex-column flex-grow-1 `,
    }

    /**
     * @group Immutable DOM Constants
     */
    children: ChildrenLike

    /**
     * @group Immutable DOM Constants
     */
    connectedCallback: (elem: RxHTMLElement<'div'>) => void

    /**
     * @group Observables
     */
    messages$: {
        [key: string]: ReplaySubject<ContextMessage>
    } = {
        root: new ReplaySubject(),
    }

    constructor(messages$: Observable<ContextMessage>) {
        messages$.subscribe((message) => {
            if (!this.messages$[message.parentContextId]) {
                message.parentContextId = 'root'
            }
            if (!message.parentContextId) {
                return
            }
            if (this.messages$[message.contextId]) {
                this.messages$[message.contextId].next(message)
                this.messages$[message.parentContextId].next(message)
                return
            }
            this.messages$[message.contextId] = new ReplaySubject()
            this.messages$[message.contextId].next(message)
            this.messages$[message.parentContextId].next(message)
        })

        this.children = [
            {
                source$: this.state.expanded$,
                vdomMap: (expanded) =>
                    expanded ? this.contentView() : { tag: 'div' },
            },
        ]

        this.commands$.pipe(delay(0)).subscribe(() => {
            if (!this.contentElement) {
                return
            }
            this.contentElement.scrollTop = this.contentElement.scrollHeight
        })
    }

    logsView() {
        return {
            tag: 'div',
            class: `d-flex flex-column h-100 w-100 overflow-auto p-2`,
            children: [
                {
                    tag: 'div',
                    children: {
                        policy: 'append',
                        source$: this.commands$,
                        vdomMap: (command) => {
                            if (command == invite) {
                                return {
                                    tag: 'div',
                                    class: 'd-flex justify-content-around',
                                    children: [
                                        {
                                            tag: 'pre',
                                            class: 'fv-text-success mx-auto',
                                            innerHTML: `${command}`,
                                            style: { fontSize: '8px' },
                                        },
                                    ],
                                }
                            }
                            return {
                                tag: 'pre',
                                class: 'fv-text-success mx-auto w-100',
                                innerHTML: `${command}`,
                            }
                        },
                    },
                },
                new NodeView(this.state, 'root', 0, true, this.messages$),
            ],
            connectedCallback: (elem) => {
                this.contentElement = elem
                this.contentElement.scrollTop = this.contentElement.scrollHeight
                this.messages$['root'].subscribe(() => {
                    this.contentElement.scrollTop =
                        this.contentElement.scrollHeight
                })
            },
        }
    }

    contentView(): VirtualDOM<'div'> {
        return {
            tag: 'div',
            class: 'flex-grow-1',
            style: {
                minHeight: '0px',
            },
            children: {
                policy: 'sync',
                source$: this.state.customViews$,
                vdomMap: ({ name, view }) => {
                    return {
                        tag: 'div',
                        class: {
                            source$: this.state.selectedView$,
                            vdomMap: (
                                selectedView: string | 'TERMINAL',
                            ): string =>
                                selectedView == name ? 'd-block' : 'd-none',

                            wrapper: (d) => `${d} w-100 h-100`,
                        },
                        children: [name == 'TERMINAL' ? this.logsView() : view],
                    }
                },
            },
        }
    }
}
