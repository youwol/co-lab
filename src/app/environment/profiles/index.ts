import { AppState } from '../../app-state'
import {
    InstallersView,
    PreferencesView,
    ProfilesListView,
} from './profiles.view'
import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { ProfilesState } from './profiles.state'

export const navigation = (_appState: AppState) => ({
    name: 'Profiles',
    html: ({ router }) => new PageView({ router }),
    tableOfContent: Views.tocView,
    icon: { tag: 'i', class: 'fas fa-user-friends mr-2' },
})

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor(params: { router: Router }) {
        const profilesState = new ProfilesState()

        this.children = [
            parseMd({
                src: `
# Profiles

Profiles correspond to configurations that defines:
*  **Widgets** : those displayed in the top banner or in the dashboard tab
*  **applicative logic**: context menu action from the explorer, list of applications in the launchpad, *etc.*.

One profile is selected at a time, among the profiles available there is always a (read-only) default profile.
                
## Profiles available

Here is the list of the available profiles, you can change the selection and eventually update it latter on this page.


<profiles></profiles>

## Current profile

### Preferences

<preferences></preferences>    
          
### Installers

<installer></installer>    
                `,
                router: params.router,
                views: {
                    installer: () => new InstallersView({ profilesState }),
                    profiles: () => new ProfilesListView({ profilesState }),
                    preferences: () => new PreferencesView({ profilesState }),
                },
            }),
        ]
    }
}
