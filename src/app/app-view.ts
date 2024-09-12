import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AppState } from './app-state'
import { Views } from '@youwol/mkdocs-ts'
import { TopBannerView } from './top-banner.view'

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
        this.children = [
            new Views.DefaultLayoutView({
                router: this.appState.router,
                name: '',
                topBanner: (params) => new TopBannerView(params, this.appState),
            }),
        ]
    }
}
