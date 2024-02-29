import { ChildrenLike, render, VirtualDOM } from '@youwol/rx-vdom'
import { parseMd, Router, Views, ExplicitNode } from '@youwol/mkdocs-ts'
import { setup } from '../auto-generated'

import { TopBannerView } from './top-banner.view'
import { AppState } from './app-state'
import * as Components from './components'
import * as Explorer from './explorer'
import * as Projects from './projects'
import * as Environment from './environment'
import * as Dashboard from './dashboard'
import * as Mounted from './mounted'
import { CoLabBanner, CoLabLogo } from './common'
import { pyYwDocLink } from './common/py-yw-references.view'
import { mountProjects } from './projects'
import { ImmutableTree } from '@youwol/rx-tree-views'
import { mountFolder } from './mounted'
import { Subject } from 'rxjs'
import { Routers } from '@youwol/local-youwol-client'
import { mountBackends } from './environment/backends'
import { DisconnectedView } from './disconnected.view'

const appState = new AppState()

export const navigation = {
    name: '',
    tableOfContent: Views.tocView,
    html: ({ router }) => new PageView({ router }),
    '/dashboard': Dashboard.navigation(appState),
    '/environment': Environment.navigation(appState),
    '/components': Components.navigation(appState),
    '/projects': Projects.navigation(appState),
    '/explorer': Explorer.navigation(appState),
    '/mounted': Mounted.navigation(appState),
}
const router = new Router({
    navigation,
    basePath: `/applications/${setup.name}/${setup.version}`,
    updates: [
        {
            from$: appState.hdFolder$,
            then: ({
                data,
                router,
                treeState,
            }: {
                router: Router
                treeState: ImmutableTree.State<ExplicitNode>
                data: string
            }) => {
                mountFolder({ folder: data, router, treeState })
            },
        },
        {
            from$: appState.projectsState.projects$,
            then: ({
                data,
                router,
                treeState,
            }: {
                router: Router
                treeState: ImmutableTree.State<ExplicitNode>
                data
            }) => {
                mountProjects({
                    projects: data,
                    router,
                    treeState,
                })
            },
        },
        {
            from$: appState.environment$,
            then: ({
                data,
                router,
                treeState,
            }: {
                router: Router
                treeState: ImmutableTree.State<ExplicitNode>
                data: Routers.Environment.EnvironmentStatusResponse
            }) => {
                mountBackends({
                    backends: data.configuration.proxiedBackends,
                    router,
                    treeState,
                })
            },
        },
    ],
})

class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ router }: { router: Router }) {
        const loaded$ = new Subject<boolean>()
        this.children = [
            new CoLabBanner({ router, loaded$ }),
            {
                source$: loaded$,
                vdomMap: () =>
                    parseMd({
                        src: `
# Welcome

Welcome to the YouWol collaborative lab for consuming or producing web applications. 
This space (the \`@youwol/co-lab\` application) lets you explore your lab's content.

At its core, the lab collects executable units, or components, treating them as independent entities that dynamically
 assemble during the execution of applications or user scripts. These components range from those interpreted in the
  browser, like JavaScript, WebAssembly, or Python via the Pyodide wrapper, to those processed on a PC as backends. 
  Your lab grows as it automatically acquires components encountered during browsing or from your own project 
  publications. 

Collaboration is seamless in this ecosystem: when components are needed to run an application, 
the system ensures the most up-to-date, compatible version is used, whether sourced from your ongoing projects
 or the broader YouWol network through updates. New or missing components are efficiently downloaded, 
 enhancing performance for future access.

This dual local-cloud approach not only optimizes the development cycle and enhances flexibility but also opens up 
new possibilities. Everything we've built leverages this innovative framework, and we're excited for you to experience
 its benefits.
 
Explore your lab and its features at your own pace:

- The [dashboard](@nav/dashboard) offers a streamlined view for quick access to information you've selected as most
 relevant, providing shortcuts and at-a-glance visualizations tailored to your preferences.
 
- The [environment](@nav/environment) section gives you a comprehensive look at your local server's configuration, 
including which backends are active, the middlewares you've installed, and a tool for exploring logs, among others.

- In the [components](@nav/components) area, you can review everything that has been utilized and effectively 
'installed' on your PC up to this point.

- The [projects](@nav/projects) section is dedicated to your work-in-progress projects, which you are preparing to 
publish as components—first locally on your PC, and subsequently to the wider online ecosystem for community access.

 For a deeper insight into the workings of your new laboratory, don't hesitate to click on the info icon
  <i class="fas fa-info-circle fv-text-focus"></i> during your initial visits. 
 If you're looking for a more comprehensive overview, we invite you to check out our 
${pyYwDocLink('documentation', '/')}.

  `,
                        router,
                        views: {
                            logo: () => new CoLabLogo({ router }),
                        },
                        emitHtmlUpdated: true,
                    }),
            },
        ]
    }
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
