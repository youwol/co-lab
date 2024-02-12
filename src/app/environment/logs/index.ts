import { AppState } from '../../app-state'
import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { InfoSectionView } from '../../common'
import { AdminLogsView } from './admin.view'

export * from './admin.view'

export const navigation = (appState: AppState) => ({
    name: 'Logs',
    icon: { tag: 'i', class: 'fas fa-bug mr-2' },
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
                    info: (elem: HTMLElement) => {
                        return new InfoSectionView({
                            text: elem.innerHTML,
                            router,
                        })
                    },
                    logsView: () => new AdminLogsView(),
                },
            }),
        ]
    }
}
