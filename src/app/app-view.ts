import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AppMode, AppState } from './app-state'
import { Router, Views } from '@youwol/mkdocs-ts'
import { TopBannerView } from './top-banner.view'
import { Subject } from 'rxjs'

export class AppView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'w-100 h-100'
    public readonly style = {
        position: 'relative' as const,
    }
    public readonly children: ChildrenLike
    public readonly appState: AppState

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)

        const mainView = new Views.DefaultLayoutView({
            router: this.appState.router,
            name: '',
            topBanner:
                parent.document === document
                    ? (params) => new TopBannerView(params, this.appState)
                    : (params) => new TopBannerDocCompanion(params),
            footer: () => {
                return parent.document === document
                    ? new Views.FooterView()
                    : { tag: 'div' }
            },
        })
        this.children = [
            {
                tag: 'div',
                class: {
                    source$: this.appState.appMode$,
                    vdomMap: (mode: AppMode) => {
                        return mode === 'docRemoteBelow'
                            ? 'h-50 w-100 border'
                            : 'h-100 w-100'
                    },
                },
                children: [mainView],
            },
            {
                source$: this.appState.appMode$,
                vdomMap: (mode: AppMode) => {
                    if (mode !== 'docRemoteBelow') {
                        return { tag: 'div' }
                    }
                    return {
                        tag: 'div',
                        class: 'w-100 h-50',
                        children: [
                            {
                                tag: 'iframe',
                                width: '100%',
                                height: '100%',
                                src: getCompanionDocHref(this.appState),
                            },
                        ],
                    }
                },
            },
        ]
    }
}

export function getCompanionDocHref(appState: AppState) {
    const location = document.location
    const parameters = `appMode=docCompanion&channelId=${appState.navBroadcastChannel.name}`
    if (location.search.startsWith('?nav=/doc')) {
        return `${document.location.href}&${parameters}`
    }
    return `${location.pathname}?nav=/doc&${parameters}`
}
class TopBannerDocCompanion implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor(params: {
        title: string | AnyVirtualDOM
        router: Router
        displayModeNav$: Subject<Views.DisplayMode>
        displayModeToc$: Subject<Views.DisplayMode>
        layoutOptions: Views.LayoutOptions
    }) {
        this.children = [
            {
                source$: params.displayModeNav$,
                vdomMap: (displayMode: Views.DisplayMode) => {
                    if (displayMode === 'Full') {
                        return { tag: 'div' as const }
                    }
                    return {
                        tag: 'div',
                        class: 'mkdocs-bg-5 mkdocs-text-5 py-2',
                        children: [
                            new Views.ModalNavigationView({
                                router: params.router,
                                displayModeToc$: params.displayModeToc$,
                                footer: undefined,
                            }),
                        ],
                    }
                },
            },
        ]
    }
}
