import { ChildrenLike, render, VirtualDOM } from '@youwol/rx-vdom'
import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { setup } from '../auto-generated'

import { TopBannerView } from './top-banner.view'
import { AppState } from './app-state'
import * as Components from './components'
import * as Explorer from './explorer'
import * as Projects from './projects'
import * as Environment from './environment'
import * as Dashboard from './dashboard'
import * as System from './system'
import { CoLabLogo } from './common'

const appState = new AppState()

export const navigation = {
    name: '',
    html: ({ router }) => new PageView({ router }),
    '/dashboard': Dashboard.navigation(appState),
    '/environment': Environment.navigation(appState),
    '/components': Components.navigation(appState),
    '/projects': Projects.navigation(appState),
    '/explorer': Explorer.navigation(appState),
    '/system': System.navigation(appState),
}
const router = new Router({
    navigation,
    basePath: `/applications/${setup.name}/${setup.version}`,
})

class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ router }: { router: Router }) {
        this.children = [
            parseMd({
                src: `
<logo></logo>
Welcome to YouWol's collaborative laboratory for developing browser-based applications.

This laboratory is about:

* **Browser-Based Applications**: Our platform hosts "executable blocks" as independent units that dynamically link 
together to function within a browser. These units, known as 'components,' create an ecosystem easily utilized by
 applications or scripts to form a coherent run-time.

* **Collaboration**: Integrating work from others into your projects is seamless with YouWol. 
Powered by an online ecosystem, updates are published and can be automatically integrated as needed. 
This ecosystem also features **assets** - conceptualized as 'projects' - which can be automatically retrieved 
when necessary.

* **Performance**: Requested resources are automatically downloaded to your PC, turning it into an 
additional cache layer to avoid unnecessary downloads and enhance performance.

* **Flexibility**: Our diverse array of component types ensures the most effective solution for any given problem.
 This includes JavaScript and its related languages, as well as C/C++/Rust/*etc.* through WebAssembly,
  Python in the browser via Pyodide, and Python backends.

* **Development Cycle**: The workspace is engineered to incorporate the versions of the components you're working 
on effortlessly. Once you publish your package to your PC's database, it becomes accessible to the dependency resolver 
and is linked accordingly. Moreover, several options are available to facilitate development servers for application or
 backend development.
 
## Example

In a nutshell, it comes down to:
\`\`\`javascript

await youwol.install({
    modules:['react'],
    python: ['numpy', 'pandas'],
    backends: ['scipy_backend']
})
// At that point all of the above dependencies are ready to be used
\`\`\`

                 `,
                router,
                views: {
                    logo: () => new CoLabLogo({ router }),
                },
            }),
        ]
    }
}
document.getElementById('content').appendChild(
    render({
        tag: 'div',
        class: 'h-100 w-100',
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
        ],
    }),
)
