import { AppState } from '../app-state'
import * as Backends from './backends'
import * as JsWasm from './js-wasm'
import * as Pyodide from './pyodide'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'

import { Navigation, parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { Routers } from '@youwol/local-youwol-client'
import { PackageView } from './js-wasm/package.views'
import { BackendView } from './backends/package.views'
export * from './state'

export const navigation = (appState: AppState): Navigation => ({
    name: 'Components',
    decoration: { icon: { tag: 'i', class: 'fas  fa-microchip mr-2' } },
    html: ({ router }) => new PageView({ router, appState }),
    '/js-wasm': JsWasm.navigation(appState),
    '/pyodide': Pyodide.navigation(appState),
    '/backends': Backends.navigation(appState),
})

export function formatChildren(
    { packages }: Routers.LocalCdn.CdnStatusResponse,
    target: 'js/wasm' | 'backend',
) {
    return packages
        .filter((elem) => {
            return elem.versions[0].type === target
        })
        .sort((a, b) => a['name'].localeCompare(b['name']))
        .map((component) => {
            return {
                name: component.name,
                id: component.id,
                leaf: true,
                decoration: {
                    icon: { tag: 'div' as const, class: 'mx-2' },
                },
            }
        })
}

export function lazyResolver(
    status: Routers.LocalCdn.CdnStatusResponse,
    appState: AppState,
    target: 'js/wasm' | 'backend',
) {
    return ({ path }: { path: string }) => {
        const parts = path.split('/').filter((d) => d != '')
        if (parts.length === 0) {
            return {
                children: formatChildren(status, target),
                html: ({ router }) => {
                    return new PackageView({
                        router,
                        cdnState: appState.cdnState,
                        packageId: parts.slice(-1)[0],
                    })
                },
            }
        }
        return {
            tableOfContent: Views.tocView,
            children: [],
            html: ({ router }) => {
                const params = {
                    appState,
                    router,
                    cdnState: appState.cdnState,
                    packageId: parts.slice(-1)[0],
                }
                return target === 'js/wasm'
                    ? new PackageView(params)
                    : new BackendView(params)
            },
        }
    }
}

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
