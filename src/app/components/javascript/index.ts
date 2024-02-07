import { AppState } from '../../app-state'
import { PackageView } from '../package.views'
import { lastValueFrom } from 'rxjs'
import * as pyYw from '@youwol/local-youwol-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'

const cdnStatus = await lastValueFrom(
    new pyYw.PyYouwolClient().admin.localCdn
        .getStatus$()
        .pipe(raiseHTTPErrors()),
)

export const navigation = (appState: AppState) => ({
    name: 'Javascript/WASM',
    withIcon: {
        tag: 'div',
        class: 'fas fa-code mx-2',
    },
    html: ({ router }) => new PageView({ router, appState }),
    ...cdnStatus.packages.reduce((acc, e) => {
        return {
            ...acc,
            ['/' + e.id]: {
                name: e.name,
                tableOfContent: Views.tocView,
                html: ({ router }) =>
                    new PackageView({
                        router,
                        cdnState: appState.cdnState,
                        packageId: e.id,
                    }),
            },
        }
    }, {}),
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
