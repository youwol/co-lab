import { AssetsBackend, ExplorerBackend } from '@youwol/http-clients'
import { combineLatest } from 'rxjs'
import * as OsCore from '@youwol/os-core'
import { mergeMap } from 'rxjs/operators'

export function getAssetProperties$({
    assetResponse,
    itemsResponse,
}: {
    assetResponse: AssetsBackend.GetAssetResponse
    itemsResponse: ExplorerBackend.QueryChildrenResponse
}) {
    return combineLatest([
        OsCore.RequestsExecutor.getAsset(assetResponse.assetId),
        OsCore.RequestsExecutor.getPermissions(assetResponse.assetId).pipe(
            mergeMap((resp) => {
                const item = itemsResponse.items.find(
                    (item) => item.assetId === assetResponse.assetId,
                )
                return [
                    {
                        ...resp,
                        write: !item || !item['origin'] || item['origin'].local,
                    } as unknown as AssetsBackend.GetPermissionsResponse,
                ]
            }),
        ),
    ])
}
