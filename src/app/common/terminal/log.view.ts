import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import * as pyYw from '@youwol/local-youwol-client'
import { DataView } from './data.view'
import { ChartExplorerView } from './factories/helm.view'
import { TerminalState } from './terminal.view'

type KnownViews = 'HelmPackage'

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

const viewsFactory: Record<KnownViews, (d) => VirtualDOM<'div'>> = {
    HelmPackage: (data) => new ChartExplorerView(data),
}

/**
 * @category View
 */
export class LogView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex align-items-center fv-pointer'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {}

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group State
     */
    public readonly state: TerminalState

    /**
     * @group Immutable Constants
     */
    public readonly message: pyYw.ContextMessage

    constructor(params: {
        state: TerminalState
        message: pyYw.ContextMessage
    }) {
        Object.assign(this, params)

        let customView: AnyVirtualDOM
        if (this.message.level == 'DATA') {
            const views = Object.keys(viewsFactory)
                .filter((key) =>
                    this.message.labels.includes(key as pyYw.Label),
                )
                .map((key: KnownViews) => ({
                    name: key,
                    factory: viewsFactory[key],
                }))

            if (views.length > 0) {
                customView = {
                    tag: 'div',
                    innerText: views[0].name,
                    class: 'fv-bg-secondary border rounded fv-hover-xx-lighter p-1',
                    onclick: () => {
                        const view = views[0].factory(this.message.data)
                        this.state.openCustomView(views[0].name, view)
                    },
                }
            }
        }
        this.style = this.message.labels.includes('Label.BASH')
            ? { fontFamily: 'monospace', fontSize: 'x-small' }
            : {}

        this.children = [
            {
                tag: 'div',
                class: 'd-flex flex-align-center px-2',
                children: this.message.labels
                    .filter((label) => labelLogIcons[label])
                    .map((label) => {
                        return {
                            tag: 'div',
                            class: labelLogIcons[label] + ' mx-1',
                        }
                    }),
            },
            {
                tag: 'div',
                innerText: this.message.text,
            },
            customView,
            this.message.data ? new DataView(this.message.data) : undefined,
        ]
    }
}

/**
 * @category View
 */
export class MethodLabelView {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex align-items-center mr-3'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(message: pyYw.ContextMessage) {
        this.children = [
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
        ]
    }
}

/**
 * @category View
 */
export class AttributesView implements VirtualDOM<'table'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'table'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = ''

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        fontSize: 'small',
        maxWidth: '50%',
    }

    constructor(attributes: { [key: string]: unknown }) {
        this.children = [
            {
                tag: 'tr',
                children: Object.keys(attributes).map((attName) => {
                    return {
                        tag: 'th',
                        class: 'px-2',
                        innerText: attName,
                    }
                }),
            },
            {
                tag: 'tr' as const,
                children: Object.values(attributes).map((value) => {
                    return {
                        tag: 'td',
                        class: 'px-2',
                        innerText: `${value}`,
                    }
                }),
            },
        ]
    }
}
