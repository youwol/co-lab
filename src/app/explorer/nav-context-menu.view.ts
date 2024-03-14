import {
    autoUpdate,
    computePosition,
    flip,
    ReferenceElement,
} from '@floating-ui/dom'
import { ChildrenLike, render, VirtualDOM } from '@youwol/rx-vdom'
import { ExplorerNode, ItemNode } from './nodes'
import { Action, getActions$ } from './actions.factory'
import { ExplorerState } from './explorer.state'

export class ContextMenuHandler implements VirtualDOM<'i'> {
    public readonly tag = 'i'
    public readonly class =
        'mx-2 fas fa-ellipsis-h fv-hover-text-focus fv-pointer ctx-menu-handler'
    public readonly onclick: (ev: MouseEvent) => void

    constructor({
        node,
        explorerState,
        withClass,
    }: {
        node: ExplorerNode
        explorerState: ExplorerState
        withClass?: string
    }) {
        this.class += ` ${withClass}`
        this.onclick = (ev: MouseEvent) => {
            const contextMenu = new ContextMenuView({ node, explorerState })
            const ctxMenuDiv: HTMLDivElement = render(contextMenu)
            ev.preventDefault()
            ev.stopPropagation()
            document.querySelectorAll('.ctx-menu').forEach((c) => c.remove())
            document.body.appendChild(ctxMenuDiv)
            const refElement = ev.target as ReferenceElement

            const cleanup = autoUpdate(refElement, ctxMenuDiv, () => {
                document.onclick = () => {
                    ctxMenuDiv.remove()
                    cleanup()
                }
                // we should use event 'focusout'
                // https://stackoverflow.com/questions/152975/how-do-i-detect-a-click-outside-an-element/3028037#3028037
                // https://web.dev/learn/html/focus#:~:text=Interactive%20elements%2C%20including%20form%20controls,meaning%20they%20are%20not%20interactive.
                computePosition(refElement, ctxMenuDiv, {
                    placement: 'bottom',
                    middleware: [flip()],
                }).then(({ x, y }) => {
                    Object.assign(ctxMenuDiv.style, {
                        left: `${x}px`,
                        top: `${y}px`,
                    })
                })
            })
        }
    }
}
export class ContextMenuView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'bg-dark  ctx-menu'
    public readonly style = {
        width: 'max-content',
        position: 'absolute' as const,
        top: 0 as const,
        left: 0 as const,
        padding: '5px',
        borderRadius: '4px',
        fontSize: ' 90%',
    }
    public readonly children: ChildrenLike
    constructor({
        node,
        explorerState,
    }: {
        node: ExplorerNode
        explorerState: ExplorerState
    }) {
        this.children = {
            policy: 'replace',
            source$: getActions$(explorerState, node),
            vdomMap: (actions: Action[]) => {
                console.log('Actions', {
                    actions,
                    isItem: node instanceof ItemNode,
                })
                return actions.map(
                    (action: Action) => new ContexMenuItemView({ action }),
                )
            },
        }
    }
}

export class ContexMenuItemView implements VirtualDOM<'button'> {
    public readonly tag = 'button'
    public readonly class =
        'btn d-flex align-items-center btn-sm w-100 btn-outline-info text-light'
    public readonly children: ChildrenLike
    public readonly style = {
        border: 'none' as const,
    }
    public readonly onclick: (ev: MouseEvent) => void
    constructor({ action }: { action: Action }) {
        this.children = [
            action.icon,
            {
                tag: 'i',
                class: 'mx-2',
            },
            {
                tag: 'div',
                style: {
                    fontWeight: 'bold' as const,
                },
                innerText: action.name,
            },
        ]
        this.onclick = () => action.exe()
    }
}
