import { distinctUntilChanged, merge, Observable, Subject } from 'rxjs'
import { filter, map, mergeMap, shareReplay, take, tap } from 'rxjs/operators'
import * as Projects from './projects'
import * as Components from './components'
import * as Backends from './environment/backends'
import * as Environment from './environment'
import * as Notification from './environment/notifications'
import * as Explorer from './explorer'
import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import * as pyYw from '@youwol/local-youwol-client'
import { WsRouter } from '@youwol/local-youwol-client'
import { Accounts } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { Navigation, parseMd, Router, Views } from '@youwol/mkdocs-ts'
import * as Dashboard from './dashboard'
import * as Mounted from './mounted'
import { setup } from '../auto-generated'
import { CoLabBanner, CoLabLogo } from './common'
import { pyYwDocLink } from './common/py-yw-references.view'

export type Topic =
    | 'Projects'
    | 'Updates'
    | 'CDN'
    | 'Admin'
    | 'Environment'
    | 'System'

export interface Screen {
    topic: Topic
    viewId: string
    view: AnyVirtualDOM
}

pyYw.PyYouwolClient.ws = new WsRouter({
    autoReconnect: true,
    autoReconnectDelay: 1000,
})
/**
 * @category State
 */
export class AppState {
    /**
     * @group Immutable Constants
     */
    public readonly navigation: Navigation
    /**
     * @group Immutable Constants
     */
    public readonly router: Router
    /**
     * @group Observables
     */
    public readonly confChanged$: Observable<string>
    /**
     * @group Immutable Constants
     */
    public readonly environmentClient = new pyYw.PyYouwolClient().admin
        .environment

    /**
     * @group Observables
     */
    public readonly environment$: Observable<pyYw.Routers.Environment.EnvironmentStatusResponse>

    /**
     * @group Observables
     */
    public readonly session$: Observable<Accounts.SessionDetails>

    /**
     * @group State
     */
    public readonly projectsState: Projects.State

    /**
     * @group State
     */
    public readonly cdnState: Components.State

    /**
     * @group State
     */
    public readonly backendsState = new Backends.State()

    /**
     * @group State
     */
    public readonly environmentState: Environment.State

    /**
     * @group State
     */
    public readonly notificationsState = new Notification.State()

    /**
     * @group Observables
     */
    public readonly connectedLocal$: Observable<boolean>

    public readonly hdFolder$ = new Subject<string>()

    constructor() {
        pyYw.PyYouwolClient.startWs$()
            .pipe(take(1))
            .subscribe(() => {
                console.log('Web sockets connected')
            })
        this.environment$ = this.environmentClient.webSocket.status$().pipe(
            map(({ data }) => data),
            shareReplay(1),
        )
        this.connectedLocal$ = pyYw.PyYouwolClient.ws.connected$
        this.connectedLocal$.pipe(filter((c) => c)).subscribe(() => {
            this.environmentClient.getStatus$().subscribe()
        })
        this.projectsState = new Projects.State({ appState: this })
        this.cdnState = new Components.State({ appState: this })
        this.environmentState = new Environment.State({ appState: this })

        this.environmentClient.getStatus$().subscribe()
        this.projectsState.projects$.subscribe(() => {})
        this.confChanged$ = this.environment$.pipe(
            map((env) => env.youwolEnvironment.pathsBook.config),
            distinctUntilChanged(),
            tap((path) => console.log('Configuration changed', path)),
        )
        merge(this.connectedLocal$, this.confChanged$).subscribe(() => {
            this.cdnState.refreshPackages()
        })

        this.session$ = this.environment$.pipe(
            map((env) => env['youwolEnvironment'].currentConnection),
            distinctUntilChanged(
                (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr),
            ),
            mergeMap(() => new Accounts.AccountsClient().getSessionDetails$()),
            raiseHTTPErrors(),
            shareReplay(1),
        )

        this.navigation = {
            name: '',
            tableOfContent: Views.tocView,
            html: ({ router }) => new PageView({ router }),
            '/dashboard': Dashboard.navigation(this),
            '/environment': Environment.navigation(this),
            '/components': Components.navigation(this),
            '/projects': Projects.navigation(this),
            '/explorer': Explorer.navigation({
                session$: this.session$,
            }),
            '/mounted': Mounted.navigation(this),
        }
        this.router = new Router({
            navigation: this.navigation,
            basePath: `/applications/${setup.name}/${setup.version}`,
        })
        this.router.explorerState.selectedNode$.subscribe((node) => {
            console.log({ node, state: this.router.explorerState })
        })
    }
}

export class PageView implements VirtualDOM<'div'> {
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
