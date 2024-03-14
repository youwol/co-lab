import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AssetsBackend, ExplorerBackend } from '@youwol/http-clients'
import { parseMd, Router } from '@youwol/mkdocs-ts'
import { PermissionsViews } from './permissions.views'
import { TagsViews } from './tags.views'
import { DescriptionsViews } from './descriptions.views'
import { ExpandableGroupView } from '../common/expandable-group.view'
import { BreadcrumbViews } from './breadcrumb.views'
import { ItemView } from './item.view'
import { ContextMenuHandler } from './nav-context-menu.view'
import { ExplorerState } from './explorer.state'

export class ExplorerView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = ''
    public readonly children: ChildrenLike
    constructor({
        response,
        path,
        explorerState,
    }: {
        response: ExplorerBackend.QueryChildrenResponse
        path: string
        explorerState: ExplorerState
    }) {
        this.children = response.items.map(
            (item) => new ItemView({ item, path, explorerState }),
        )
    }
}

export class AssetView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = ''
    public readonly children: ChildrenLike

    constructor({
        assetResponse,
        itemsResponse,
        explorerState,
        router,
        path,
    }: {
        assetResponse: AssetsBackend.GetAssetResponse
        itemsResponse: ExplorerBackend.QueryChildrenResponse
        explorerState: ExplorerState
        router: Router
        path?: string
    }) {
        this.children = [
            parseMd({
                src: `
<path></path>

# ${assetResponse.name} <ctxMenuActions></ctxMenuActions>         


<tags></tags>

<description></description>

<permissions></permissions>
                `,
                router,
                views: {
                    path: () =>
                        new BreadcrumbViews({
                            response: assetResponse,
                            path: path,
                            router: router,
                        }),
                    permissions: () =>
                        new PermissionsViews({ assetResponse, itemsResponse }),
                    tags: () => new TagsViews({ assetResponse, itemsResponse }),
                    description: () =>
                        new ExpandableGroupView({
                            title: 'Description',
                            icon: 'fas fa-info',
                            content: () =>
                                new DescriptionsViews({
                                    assetResponse,
                                    itemsResponse,
                                }),
                            expanded: true,
                        }),
                    ctxMenuActions: () => {
                        const item = itemsResponse.items.find(
                            (item) => item.assetId === assetResponse.assetId,
                        )
                        const nodeData = explorerState.getItemData(item)
                        return new ContextMenuHandler({
                            node: nodeData,
                            explorerState: explorerState,
                        })
                    },
                },
            }),
        ]
    }
}
