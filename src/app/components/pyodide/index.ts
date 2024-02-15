import { AppState } from '../../app-state'
import { NavIconSvg } from '../../common'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { parseMd, Router } from '@youwol/mkdocs-ts'

export const navigation = (appState: AppState) => ({
    name: 'Pyodide',
    icon: new NavIconSvg({ filename: 'icon-python.svg' }),
    html: ({ router }) => new PageView({ router, appState }),
})

class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({ router }: { router: Router; appState: AppState }) {
        this.children = [
            parseMd({
                src: `
# Python

Python components are served by the [Pyodide ecosystem](https://pyodide.org/en/stable/usage/loading-packages.html).

TODO:
*  be able to intercept requests to pyodide packages in order to save them in the local drive.

## Example


To load modules:

\`\`\`javascript
const youwol = await youwol.install({
    python:{ pyodide:'0.25.0', modules:['numpy'] }
})

youwol.python.run(\`
\timport numpy

\t# etc
\`)
\`\`\`

`,
                router: router,
            }),
        ]
    }
}
