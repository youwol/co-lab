import { Navigation, parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { AppState } from '../app-state'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { combineLatest } from 'rxjs'
import { Installer, PreferencesFacade } from '@youwol/os-core'
import { Routers } from '@youwol/local-youwol-client'
import { NewAppsView, DesktopWidgetsView } from './views'

export const navigation = (appState: AppState): Navigation => ({
    name: 'Dashboard',
    tableOfContent: Views.tocView,
    decoration: { icon: { tag: 'i', class: 'fas fa-tachometer-alt mr-2' } },
    html: ({ router }) => new PageView({ appState, router }),
})

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    static warmUp = () => {
        combineLatest([
            Installer.getApplicationsInfo$(),
            PreferencesFacade.getPreferences$(),
        ]).subscribe()
    }

    constructor({ router, appState }: { router: Router; appState: AppState }) {
        this.children = [
            parseMd({
                src: `
# Dashboard    

The server is running using the configuration file <configFile></configFile>

## Launch-pad

<info>
Here are displayed the applications reference by the [installer script](@nav/environment/profiles.installers), 
they are similar to 'pined' applications.   

You may want to use this 
<a href='https://chromewebstore.google.com/detail/auto-tab-groups/nicjeeimgboiijpfcgfkbemiclbhfnio?pli=1'
target='_blank'>plugin</a> to group YouWol's applications in a tab group (for chrome).

</info>
 
<appsView></appsView>

## Widgets

<info>
Here are the widgets referenced by the [preferences script](@nav/environment/profiles.preferences).

</info>


<desktopWidgets></desktopWidgets>

## Components summary

*TODO: NEED TO BE IMPLEMENTED*

*  Number of ESM modules, applications, python modules, backends

## Projects summary

*TODO: NEED TO BE IMPLEMENTED*

*  Number of projects, gathered by tag in a colorful histogram
                 `,
                router,
                views: {
                    configFile: () => ({
                        tag: 'a',
                        href: '@nav/environment/yw-configuration',
                        innerText: {
                            source$: appState.environment$,
                            vdomMap: (
                                env: Routers.Environment.EnvironmentStatusResponse,
                            ) => {
                                return env.configuration.pathsBook.config.match(
                                    /[^\\/]+$/,
                                )[0]
                            },
                        },
                    }),
                    appsView: () =>
                        new NewAppsView({
                            state: undefined,
                            router,
                        }),
                    desktopWidgets: () => new DesktopWidgetsView(),
                },
            }),
        ]
    }
}

PageView.warmUp()
