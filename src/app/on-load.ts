import { render } from '@youwol/rx-vdom'
import { Views } from '@youwol/mkdocs-ts'

import { TopBannerView } from './top-banner.view'
import { AppState } from './app-state'
import { Observable } from 'rxjs'
import { DisconnectedView } from './disconnected.view'

const appState = new AppState()
const { router } = appState

export interface ColabController {
    navigation$: Observable<string>
}

if (parent['@youwol/co-lab-controller']) {
    console.log('Plug Colab Controller')
    const controller: ColabController = parent['@youwol/co-lab-controller']
    controller.navigation$?.subscribe((path) => {
        router.navigateTo({ path })
    })
}

document.getElementById('content').appendChild(
    render({
        tag: 'div',
        class: 'h-100 w-100',
        style: {
            position: 'relative',
        },
        children: [
            new Views.DefaultLayoutView({
                router,
                name: 'iLab',
                topBanner: ({ displayMode$ }) =>
                    new TopBannerView({
                        router,
                        appState,
                        displayMode$,
                    }),
            }),
            new DisconnectedView({ appState }),
        ],
    }),
)
