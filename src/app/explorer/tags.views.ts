import { ChildrenLike, RxHTMLElement, VirtualDOM } from '@youwol/rx-vdom'
import { BehaviorSubject, from, skip, Subject } from 'rxjs'
import {
    AssetsBackend,
    AssetsGateway,
    ExplorerBackend,
} from '@youwol/http-clients'
import { mergeMap, shareReplay } from 'rxjs/operators'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { getAssetProperties$ } from './utils'
import * as osWidgets from '@youwol/os-widgets'
import { AssetView } from './explorer.views'
import { ExpandableGroupView } from '../common/expandable-group.view'

export class TagsViews implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'test'
    public readonly children: ChildrenLike
    public readonly tags$: BehaviorSubject<string[]>
    public readonly assetOutput$: Subject<AssetsBackend.GetAssetResponse>
    public readonly assetsClient = new AssetsGateway.Client().assets
    public readonly connectedCallback: (elem: RxHTMLElement<'div'>) => void

    constructor({
        assetResponse,
        itemsResponse,
    }: {
        assetResponse: AssetsBackend.GetAssetResponse
        itemsResponse: ExplorerBackend.QueryChildrenResponse
    }) {
        Object.assign(this, assetResponse, itemsResponse)
        this.tags$ = new BehaviorSubject(assetResponse.tags)

        const updatedAsset$ = this.tags$.pipe(
            skip(1),
            mergeMap((tags) => {
                return this.assetsClient.updateAsset$({
                    assetId: assetResponse.assetId,
                    body: {
                        tags: tags,
                    },
                })
            }),
            raiseHTTPErrors(),
            shareReplay(1),
        )
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
                                    new v.AssetTagsView({
                                        tags$: this.tags$,
                                        asset: assetResponse,
                                        permissions: permissions,
                                    }),
                            ),
                        ),
                    ),
                ),
                vdomMap: (assetTagsView: AssetView) => {
                    return new ExpandableGroupView({
                        title: 'Tags',
                        icon: 'fas fa-tag',
                        content: () => assetTagsView,
                        expanded: true,
                    })
                },
            },
        ]
        this.connectedCallback = (elem) => {
            elem.ownSubscriptions(
                updatedAsset$.subscribe((asset) => {
                    this.assetOutput$ && this.assetOutput$.next(asset)
                }),
            )
        }
    }
}
