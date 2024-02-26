import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AssetsBackend, ExplorerBackend } from '@youwol/http-clients'
import { getAssetProperties$ } from './utils'
import { mergeMap } from 'rxjs/operators'
import { from } from 'rxjs'
import * as osWidgets from '@youwol/os-widgets'
import { AssetView } from './explorer.views'
import { ExpandableGroupView } from '../common/expandable-group.view'

export class PermissionsViews implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'test'
    public readonly children: ChildrenLike

    constructor({
        assetResponse,
        itemsResponse,
    }: {
        assetResponse: AssetsBackend.GetAssetResponse
        itemsResponse: ExplorerBackend.QueryChildrenResponse
    }) {
        this.children = [
            {
                source$: getAssetProperties$({
                    assetResponse,
                    itemsResponse,
                }).pipe(
                    mergeMap(([asset, permissions]) =>
                        from(
                            osWidgets.assetViewModule().then(
                                (v) =>
                                    new v.AssetPermissionsView({
                                        asset,
                                        permissions,
                                    }),
                            ),
                        ),
                    ),
                ),
                vdomMap: (assetPermissionsView: AssetView) => {
                    return new ExpandableGroupView({
                        title: 'Permissions',
                        icon: 'fas fa-user-lock',
                        content: () => assetPermissionsView,
                        expanded: true,
                    })
                },
            },
        ]
    }
}
