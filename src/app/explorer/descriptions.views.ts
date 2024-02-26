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

export class DescriptionsViews implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly description$: BehaviorSubject<string>
    public readonly assetsClient = new AssetsGateway.Client().assets
    public readonly assetOutput$: Subject<AssetsBackend.GetAssetResponse>
    public readonly click$ = new Subject<MouseEvent>()
    public readonly editionMode$ = new BehaviorSubject<boolean>(false)
    public readonly connectedCallback: (elem: RxHTMLElement<'div'>) => void
    public readonly children: ChildrenLike

    constructor({
        assetResponse,
        itemsResponse,
    }: {
        assetResponse: AssetsBackend.GetAssetResponse
        itemsResponse: ExplorerBackend.QueryChildrenResponse
    }) {
        this.description$ = new BehaviorSubject(
            assetResponse.description.trim() == ''
                ? 'No description has been provided yet.'
                : assetResponse.description,
        )
        const updatedAsset$ = this.description$.pipe(
            skip(1),
            mergeMap((description) => {
                return this.assetsClient.updateAsset$({
                    assetId: assetResponse.assetId,
                    body: {
                        description,
                    },
                })
            }),
            raiseHTTPErrors(),
            shareReplay(1),
        )

        this.children = [
            new DescriptionActions({
                editionMode$: this.editionMode$,
                click$: this.click$,
            }),
            {
                source$: getAssetProperties$({
                    assetResponse,
                    itemsResponse,
                }).pipe(
                    mergeMap(([asset, permissions]) =>
                        from(
                            osWidgets.assetViewModule().then(
                                (osWidget) =>
                                    new osWidget.AssetDescriptionView({
                                        description$: this.description$,
                                        asset: asset,
                                        permissions: permissions,
                                        outsideClick$: this.click$,
                                        editionMode$: this.editionMode$,
                                    }),
                            ),
                        ),
                    ),
                ),
                vdomMap: (assetDescriptionView: AssetView) =>
                    assetDescriptionView,
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

class DescriptionActions implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'w-100 d-flex justify-content-center '
    public readonly children: ChildrenLike
    constructor(params: {
        editionMode$: BehaviorSubject<boolean>
        click$: Subject<MouseEvent>
    }) {
        this.children = [
            {
                class: {
                    source$: params.editionMode$,
                    vdomMap: (editionMode) =>
                        editionMode
                            ? 'fv-pointer text-success'
                            : 'text-secondary',
                    wrapper: (d) => ` fas fa-save ${d} m-1`,
                },
                onclick: (ev) => {
                    if (params.editionMode$.getValue()) {
                        params.click$.next(ev)
                    }
                },
                tag: 'div',
            },
            {
                tag: 'div',
                class: {
                    source$: params.editionMode$,
                    vdomMap: (editionMode) =>
                        !editionMode
                            ? 'fv-pointer text-success'
                            : 'text-secondary',
                    wrapper: (d) => `fas fa-pen ${d} m-1`,
                },
                onclick: () => {
                    if (!params.editionMode$.getValue()) {
                        params.editionMode$.next(true)
                    }
                },
            },
        ]
    }
}
