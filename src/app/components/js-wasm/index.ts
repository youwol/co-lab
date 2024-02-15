import { AppState } from '../../app-state'
import { parseMd, Router } from '@youwol/mkdocs-ts'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { NavIconSvg } from '../../common'
import { lastValueFrom } from 'rxjs'
import * as pyYw from '@youwol/local-youwol-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { subRoutes } from '../index'

export const cdnStatus = await lastValueFrom(
    new pyYw.PyYouwolClient().admin.localCdn
        .getStatus$()
        .pipe(raiseHTTPErrors()),
)

export const navigation = (appState: AppState) => ({
    name: 'Js/WASM',
    icon: new NavIconSvg({ filename: 'icon-js.svg' }),
    html: ({ router }) => new PageView({ router, appState }),
    ...subRoutes({ type: 'js/wasm', appState }),
})

class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({ router }: { router: Router; appState: AppState }) {
        this.children = [
            parseMd({
                src: `
# Javascript / WASM

This section gathers the packages able to run in the browser including javascript and/or webassembly source code.

*TODO: IMPLEMENT SEARCH VIEW LIKE IN PROJECTS*
`,
                router: router,
            }),
        ]
    }
}
