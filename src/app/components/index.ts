import { AppState } from '../app-state'
import * as Backends from './backends'
import * as JsWasm from './js-wasm'
import * as Pyodide from './pyodide'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'

import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { PackageView } from './js-wasm/package.views'
import { lastValueFrom } from 'rxjs'
import * as pyYw from '@youwol/local-youwol-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { BackendView } from './backends/package.views'
export * from './state'

export const navigation = (appState: AppState) => ({
    name: 'Components',
    icon: { tag: 'i', class: 'fas  fa-microchip mr-2' },
    html: ({ router }) => new PageView({ router, appState }),
    '/js-wasm': JsWasm.navigation(appState),
    '/pyodide': Pyodide.navigation(appState),
    '/backends': Backends.navigation(appState),
})

class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({ router }: { router: Router; appState: AppState }) {
        this.children = [
            parseMd({
                src: `
# Packages

Gathers the installed components (executables).

They are retrieved either:
*  when requested by an *e.g.* application
*  when published from your projects

Executables can be:
*  applications
*  libraries
*  python: Python modules running in the browser.
*  backends`,
                router: router,
            }),
        ]
    }
}

const cdnStatus = await lastValueFrom(
    new pyYw.PyYouwolClient().admin.localCdn
        .getStatus$()
        .pipe(raiseHTTPErrors()),
)
export function subRoutes({
    appState,
    type,
}: {
    appState: AppState
    type: 'js/wasm' | 'backend'
}) {
    return cdnStatus.packages
        .filter((elem) => {
            return elem.versions[0].type === type
        })
        .reduce((acc, e) => {
            return {
                ...acc,
                ['/' + e.id]: {
                    name: e.name,
                    tableOfContent: Views.tocView,
                    icon: {
                        tag: 'div',
                        class: 'mx-2',
                    },
                    html: ({ router }) =>
                        type == 'js/wasm'
                            ? new PackageView({
                                  router,
                                  cdnState: appState.cdnState,
                                  packageId: e.id,
                              })
                            : new BackendView({
                                  router,
                                  appState: appState,
                                  packageId: e.id,
                              }),
                },
            }
        }, {})
}
