import { render } from '@youwol/rx-vdom'
import { GlobalMarkdownViews } from '@youwol/mkdocs-ts'

import { AppState } from './app-state'
import { Observable } from 'rxjs'
import { InfoSectionView } from './common'
import { AppView } from './app-view'
import {
    apiLink,
    copyClipboard,
    defaultUserDrive,
    label,
    navNode,
    projectNav,
} from './doc/md-widgets'
import {
    componentsDonutChart,
    launchPad,
    projectsDonutChart,
} from './home/md-widgets'

GlobalMarkdownViews.factory = {
    ...GlobalMarkdownViews.factory,
    info: (elem: HTMLElement, { router }) => {
        return new InfoSectionView({
            text: elem.textContent,
            router,
        })
    },
    apiLink,
    label,
    navNode,
    copyClipboard,
    projectNav,
    defaultUserDrive,
    launchPad,
    projectsDonutChart,
    componentsDonutChart,
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

document
    .getElementById('content')
    .appendChild(render(new AppView({ appState })))
