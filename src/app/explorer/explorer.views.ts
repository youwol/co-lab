import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AssetsBackend, ExplorerBackend } from '@youwol/http-clients'
import { parseMd, Router } from '@youwol/mkdocs-ts'
import { PermissionsViews } from './permissions.views'
import { TagsViews } from './tags.views'
import { DescriptionsViews } from './descriptions.views'
import { ExpandableGroupView } from '../common/expandable-group.view'

export class ExplorerView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = ''
    public readonly children: ChildrenLike

    constructor({
        response,
        path,
    }: {
        response: ExplorerBackend.QueryChildrenResponse
        path: string
    }) {
        this.children = response.items.map(
            (item) => new ItemView({ item, path }),
        )
    }
}
export class ItemView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'd-flex align-items-center fv-pointer fv-hover-text-focus'
    public readonly children: ChildrenLike

    constructor({
        item,
        path,
    }: {
        item: ExplorerBackend.GetItemResponse
        path: string
    }) {
        this.children = [
            { tag: 'i', class: 'fas fa-file' },
            { tag: 'span', class: 'mx-3' },
            {
                tag: 'a',
                innerText: item.name,
                href: '@nav/explorer' + path + '/asset_' + item.assetId,
            },
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

export class AssetView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = ''
    public readonly children: ChildrenLike

    constructor({
        assetResponse,
        itemsResponse,
        router,
        path,
    }: {
        assetResponse: AssetsBackend.GetAssetResponse
        itemsResponse: ExplorerBackend.QueryChildrenResponse
        router: Router
        path?: string
    }) {
        this.children = [
            parseMd({
                src: `
*TO BE IMPLEMENTED: path of the asset (interactive)*

# ${response.name}         

<i class='fas fa-tag mx-2'></i>Tags:
${response.tags.reduce((acc, e) => acc + '\n*  ' + e, '')}

${response.description}      

<tags></tags>

<description></description>

<permissions></permissions>
                `,
                router,
                views: {
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
                },
            }),
        ]
    }
}
