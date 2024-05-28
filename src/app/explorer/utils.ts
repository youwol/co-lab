import { AssetsBackend, ExplorerBackend } from '@youwol/http-clients'
import { combineLatest } from 'rxjs'
import * as OsCore from '@youwol/os-core'
import { mergeMap } from 'rxjs/operators'
import { ContextMenuHandler } from './nav-context-menu.view'
import { FolderNode, TrashNode } from './nodes'
import { NavNodeInput, Views } from '@youwol/mkdocs-ts'
import { ExplorerState } from './explorer.state'

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
                        write: item['origin']?.local,
                    } as unknown as AssetsBackend.GetPermissionsResponse,
                ]
            }),
        ),
    ])
}

export function folderNavNodeInput({
    folder,
    explorerState,
}: {
    folder: ExplorerBackend.FolderBase
    explorerState: ExplorerState
}) {
    return {
        name: folder.name,
        id: `folder_${folder.folderId}`,
        decoration: {
            icon: {
                tag: 'div' as const,
                class: 'fas fa-folder mx-2',
            },
            actions: [
                new ContextMenuHandler({
                    node: new FolderNode(folder),
                    explorerState,
                    withClass: 'nav-ctx-menu-handler',
                }),
            ],
        },
        leaf: true,
    }
}

export function itemNavNodeInput({
    item,
    explorerState,
}: {
    item: ExplorerBackend.ItemBase
    explorerState: ExplorerState
}): NavNodeInput {
    const nodeData = explorerState.getItemData(item)
    const baseClass =
        Views.NavigationHeader.DefaultWrapperClass.replace('d-flex', '') +
        ' mkdocs-nav-item'
    return {
        name: item.name,
        id: `asset_${item.assetId}`,
        data: nodeData,
        decoration: {
            wrapperClass: {
                source$: nodeData.status$,
                vdomMap: (status: { type: string }[]): string => {
                    if (
                        status.find(({ type }) => type === 'cut') !== undefined
                    ) {
                        return `${baseClass} text-primary`
                    }
                    return baseClass
                },
                untilFirst: baseClass,
            },
            icon: {
                tag: 'div' as const,
                class: 'fas fa-file mx-2',
            },
            actions: [
                new ContextMenuHandler({
                    node: nodeData,
                    explorerState: explorerState,
                    withClass: 'nav-ctx-menu-handler',
                }),
            ],
        },
        leaf: true,
    }
}

export function trashNavNodeInput({
    parentId,
    groupId,
    explorerState,
}: {
    parentId: string
    groupId: string
    explorerState: ExplorerState
}) {
    return {
        name: 'Trash',
        id: `trash_${parentId}`,
        decoration: {
            icon: {
                tag: 'div' as const,
                class: 'fas fa-trash mx-2 text-danger',
            },
            actions: [
                new ContextMenuHandler({
                    node: new TrashNode({
                        driveId: parentId,
                        groupId,
                    }),
                    explorerState,
                    withClass: 'nav-ctx-menu-handler',
                }),
            ],
        },
        leaf: true,
    }
}

export function groupNavNodeInput({
    group,
}: {
    group: { id: string; path: string }
}) {
    return {
        name: group.path.split('/').slice(-1)[0],
        decoration: {
            icon: {
                tag: 'div' as const,
                class: group.id.includes('private')
                    ? 'fas fa-user mx-2'
                    : 'fas fa-users mx-2',
            },
        },
        leaf: true,
        id: group.id,
    }
}

export function driveNavNodeInput({
    drive,
}: {
    drive: { driveId: string; name: string }
}) {
    return {
        name: drive.name,
        id: 'folder_' + drive.driveId,
        decoration: {
            icon: {
                tag: 'div' as const,
                class: 'fas fa-hdd mx-2',
            },
        },
    }
}
