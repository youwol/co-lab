import { AppState } from '../../app-state'
import { Navigation, parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { LogsExplorerView } from '../../common/logs-explorer.view'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'

export const navigation = (appState: AppState): Navigation => ({
    name: 'Logs',
    decoration: { icon: { tag: 'i', class: 'fas fa-bug mr-2' } },
    tableOfContent: Views.tocView,
    html: ({ router }) => new PageView({ router, appState }),
})

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ router }: { appState: AppState; router: Router }) {
        this.children = [
            parseMd({
                src: `
# Logs

<logsView></logsView>

`,
                router,
                views: {
                    logsView: () =>
                        new LogsExplorerView({
                            rootLogs$: new pyYw.PyYouwolClient().admin.system
                                .queryRootLogs$({
                                    fromTimestamp: Date.now(),
                                    maxCount: 1000,
                                })
                                .pipe(raiseHTTPErrors()),
                            showHeaderMenu: true,
                            title: 'Root logs',
                        }),
                },
            }),
        ]
    }
}
