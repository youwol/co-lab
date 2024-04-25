import { render } from '@youwol/rx-vdom'
import { GlobalMarkdownViews, Views } from '@youwol/mkdocs-ts'

import { TopBannerView } from './top-banner.view'
import { AppState } from './app-state'
import { Observable } from 'rxjs'
import { DisconnectedView } from './disconnected.view'
import { InfoSectionView } from './common'

GlobalMarkdownViews.factory = {
    ...GlobalMarkdownViews.factory,
    info: (elem: HTMLElement, { router }) => {
        return new InfoSectionView({
            text: elem.textContent,
            router,
        })
    },
    docLink: (elem: HTMLElement) => {
        return {
            tag: 'a' as const,
            href: `/doc?nav=${elem.getAttribute('nav')}`,
            target: '_blank',
            innerText: elem.textContent,
        }
    },
}

const appState = new AppState()
const { router } = appState

export interface ColabController {
    navigation$?: Observable<string>
    refreshPage$?: Observable<unknown>
}

if (parent['@youwol/co-lab-controller']) {
    console.log('Plug Colab Controller')
    const controller: ColabController = parent['@youwol/co-lab-controller']
    controller.navigation$?.subscribe((path) => {
        router.navigateTo({ path })
    })
    controller.refreshPage$?.subscribe(() => {
        location.reload()
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
