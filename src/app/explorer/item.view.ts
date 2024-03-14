import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { ExplorerBackend } from '@youwol/http-clients'
import {
    ApplicationInfo,
    OpenWithParametrization,
    defaultOpeningApp$,
} from '@youwol/os-core'
import { Observable, of } from 'rxjs'
import { ExplorerState } from './explorer.state'
import { ContextMenuHandler } from './nav-context-menu.view'

export class ItemView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'd-flex align-items-center mb-2 p-1 yw-hover-shadow shadow-sm rounded border border-light ' +
        'page-explorer-item-view'
    public readonly children: ChildrenLike
    public readonly defaultOpeningApp$: Observable<
        | {
              appInfo: ApplicationInfo
              parametrization: OpenWithParametrization
          }
        | undefined
    >
    constructor({
        item,
        path,
        explorerState,
    }: {
        item: ExplorerBackend.GetItemResponse
        path: string

        explorerState: ExplorerState
    }) {
        this.defaultOpeningApp$ = ExplorerBackend.isInstanceOfItemResponse(item)
            ? defaultOpeningApp$(item)
            : of(undefined)

        const nodeData = explorerState.getItemData(item)

        this.children = [
            new ItemIconView({ item }),
            { tag: 'span', class: 'mx-3' },
            {
                tag: 'a',
                class: 'fv-pointer fv-text-on-primary  fv-hover-text-secondary text-decoration-none',
                innerText: `${item.name}`,
                href: '@nav/explorer' + path + '/asset_' + item.assetId,
            },
            new ContextMenuHandler({
                node: nodeData,
                explorerState: explorerState,
            }),
            {
                tag: 'div',
                class: 'flex-grow-1',
            },
            item['origin']?.local
                ? { tag: 'div', class: 'fas fa-laptop' }
                : undefined,
            item['origin']?.remote
                ? { tag: 'div', class: 'fas fa-cloud' }
                : undefined,
        ]
    }
}

export class ItemIconView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex justify-content-center align-items-center'
    public readonly style = {
        height: '25px',
        width: '25px',
    }
    public readonly children: ChildrenLike
    public readonly defaultOpeningApp$: Observable<
        | {
              appInfo: ApplicationInfo
              parametrization: OpenWithParametrization
          }
        | undefined
    >

    constructor({ item }: { item: ExplorerBackend.GetItemResponse }) {
        this.defaultOpeningApp$ = ExplorerBackend.isInstanceOfItemResponse(item)
            ? defaultOpeningApp$(item)
            : of(undefined)
        this.children = [
            {
                source$: this.defaultOpeningApp$,
                vdomMap: (appData: {
                    appInfo: ApplicationInfo
                    parametrization: OpenWithParametrization
                }) => {
                    return appData?.appInfo?.graphics?.fileIcon
                        ? {
                              tag: 'div',
                              style: {
                                  ...appData.appInfo.graphics.fileIcon.style,
                                  filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 2px)',
                              },
                          }
                        : {
                              tag: 'div',
                              class: `fas fa-file h4 m-0`,
                              style: {
                                  filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 2px)',
                              },
                          }
                },
            },
        ]
    }
}
