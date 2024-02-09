import { AppState } from '../app-state'
import { parseMd, Router, Views } from '@youwol/mkdocs-ts'

import * as YwConfiguration from './yw-configuration'
import * as Profiles from './profiles'
import * as Databases from './databases'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { pyYwDocLink } from '../common/py-yw-references.view'
import { InfoSectionView } from '../common'
import { DispatchListView } from './dispatches.view'
import { CommandsListView } from './commands.view'
import * as Logs from './logs'
export * from './state'

export const navigation = (appState: AppState) => ({
    name: 'Environment',
    tableOfContent: Views.tocView,
    withIcon: { tag: 'i', class: 'fas fa-tasks mr-2' },
    html: ({ router }) => new PageView({ appState, router }),
    '/yw-configuration': YwConfiguration.navigation(appState),
    '/profiles': Profiles.navigation(appState),
    '/databases': Databases.navigation(appState),
    '/logs': Logs.navigation(appState),
})

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({ appState, router }: { router: Router; appState: AppState }) {
        this.children = [
            parseMd({
                src: `
# Environment

<info>
This page gathers information that summarize the environment defined from the 
youwol's [configuration file](@nav/environment/yw-configuration).

</info>

## Dispatches

<info>
Dispatches are often used to redirect incoming request to applications or backends to a dev. server.

This is useful in development mode as it allows to skip repeated build & publish steps.

For more information visit:

*  ${pyYwDocLink('CdnSwitch', '/references/youwol/app/environment/models.flow_switches.CdnSwitch')}:
Switch to redirect incoming request to a front-end app in the CDN to a live server.

*  ${pyYwDocLink('RedirectSwitch', '/references/youwol/app/environment/models.flow_switches.RedirectSwitch')}:
Switch to redirect incoming request matching a predefined base path to another base path. Useful for instance for 
backends.

</info>

<dispatches></dispatches>

## Commands

<commands></commands>
                `,
                router: router,
                views: {
                    info: (elem: HTMLElement) => {
                        return new InfoSectionView({
                            text: elem.innerHTML,
                            router,
                        })
                    },
                    dispatches: () =>
                        new DispatchListView({
                            environmentState: appState.environmentState,
                        }),
                    commands: () =>
                        new CommandsListView({
                            environmentState: appState.environmentState,
                        }),
                },
            }),
        ]
    }
}
