import { AssetsGateway, ExplorerBackend } from '@youwol/http-clients'
import {
    HTTPResponse$,
    raiseHTTPErrors,
    RequestEvent,
    send$,
} from '@youwol/http-primitives'
import { Observable } from 'rxjs'

import {
    DriveNode,
    FolderNode,
    instanceOfRegularFolder,
    ItemNode,
    TrashNode,
} from './nodes'
import { Router } from '@youwol/mkdocs-ts'

export class ExplorerState {
    public readonly explorerClient = new AssetsGateway.Client().explorer
    private router: Router
    public itemCut: {
        cutType: 'borrow' | 'move'
        node: ItemNode | FolderNode
        originRefreshPath: string
    }

    public readonly itemData: { [itemId: string]: ItemNode } = {}

    setRouter(router: Router) {
        this.router = router
    }
    getItemData(item: ExplorerBackend.ItemBase) {
        if (!this.itemData[item.itemId]) {
            this.itemData[item.itemId] = new ItemNode(item)
        }
        return this.itemData[item.itemId]
    }
    newFolder(parentNode: FolderNode | DriveNode) {
        this.explorerClient
            .createFolder$({
                parentFolderId: this.isInstanceFolderNode(parentNode)
                    ? parentNode.folderId
                    : parentNode.driveId,
                body: { name: 'new folder' },
            })
            .pipe(raiseHTTPErrors())
            .subscribe(() => {
                this.router.refresh({
                    resolverPath: '/explorer',
                })
            })
    }

    newAsset<_T>({
        response$,
    }: {
        parentNode: FolderNode
        response$: Observable<ExplorerBackend.GetItemResponse>
        progress$?: Observable<RequestEvent>
        pendingName: string
    }) {
        response$.subscribe(() => {
            this.router.refresh({
                resolverPath: '/explorer',
            })
        })
    }

    rename(node: FolderNode | ItemNode) {
        const newname = prompt('Please enter the new name:', node.name)
        const body = {
            name: newname,
        }
        const source$: HTTPResponse$<unknown> = this.isInstanceItemNode(node)
            ? this.explorerClient.updateItem$({
                  itemId: node.itemId,
                  body,
              })
            : this.explorerClient.updateFolder$({
                  folderId: node.folderId,
                  body,
              })
        source$.pipe(raiseHTTPErrors()).subscribe(() => {
            this.router.refresh({
                path: this.router.getParentPath(),
                resolverPath: '/explorer',
            })
        })
    }

    deleteItemOrFolder(node: FolderNode | ItemNode) {
        const parentPath = this.router.getParentPath()

        node instanceof FolderNode
            ? this.router.navigateTo({ path: parentPath })
            : this.getRefreshPathForItemAction()

        const source$: HTTPResponse$<unknown> = this.isInstanceFolderNode(node)
            ? this.explorerClient.trashFolder$({
                  folderId: node.folderId,
              })
            : this.explorerClient.trashItem$({ itemId: node.itemId })

        source$.pipe(raiseHTTPErrors()).subscribe(() => {
            this.router.refresh({
                path: parentPath,
                resolverPath: '/explorer',
            })
        })
    }

    purgeDrive(trashNode: TrashNode) {
        this.explorerClient
            .purgeDrive$({ driveId: trashNode.driveId })
            .subscribe(() => {
                this.router.refresh({
                    resolverPath: '/explorer',
                })
            })
    }

    cutItem(node: ItemNode | FolderNode) {
        if (node instanceof FolderNode && !instanceOfRegularFolder(node)) {
            console.warn('This action is available only for regular folder.')
        }
        node.addStatus({ type: 'cut' })
        this.itemCut = {
            cutType: 'move',
            node,
            originRefreshPath: this.isInstanceItemNode(node)
                ? this.getRefreshPathForItemAction()
                : this.router.getParentPath(),
        }
    }

    borrowItem(node: ItemNode) {
        node.addStatus({ type: 'cut' })
        this.itemCut = {
            cutType: 'borrow',
            node,
            originRefreshPath: this.getRefreshPathForItemAction(),
        }
    }

    pasteItem(destination: FolderNode | DriveNode) {
        if (!this.itemCut) {
            return
        }

        const nodeSelected = this.itemCut.node
        const itemId = this.itemCut.node.id
        const destinationFolderId = this.isInstanceFolderNode(destination)
            ? destination.folderId
            : destination.driveId
        const refresh = () => {
            // This is moved into this folder: we refresh it
            this.router.refresh({
                resolverPath: '/explorer',
            })
            // This is moved from this folder: we refresh it
            this.router.refresh({
                resolverPath: '/explorer',
                path: this.itemCut.originRefreshPath,
            })
            this.itemCut = undefined
        }

        if (
            nodeSelected instanceof ItemNode &&
            this.itemCut.cutType == 'borrow'
        ) {
            this.explorerClient
                .borrow$({
                    itemId,
                    body: {
                        destinationFolderId,
                    },
                })
                .pipe(raiseHTTPErrors())
                .subscribe(refresh)
        }

        if (
            nodeSelected instanceof ItemNode &&
            this.itemCut.cutType == 'move'
        ) {
            this.explorerClient
                .move$({
                    body: {
                        targetId: itemId,
                        destinationFolderId,
                    },
                })
                .pipe(raiseHTTPErrors())
                .subscribe(refresh)
        }

        if (
            nodeSelected instanceof FolderNode &&
            this.itemCut.cutType == 'move'
        ) {
            this.explorerClient
                .move$({
                    body: {
                        targetId: itemId,
                        destinationFolderId,
                    },
                })
                .pipe(raiseHTTPErrors())
                .subscribe(refresh)
        }
        nodeSelected.removeStatus({ type: 'cut' })
    }

    refresh() {
        this.router.refresh({
            resolverPath: '/explorer',
        })
    }

    uploadAsset(node: ItemNode) {
        return send$(
            'upload',
            `${window.location.origin}/admin/environment/upload/${node.assetId}`,
            { method: 'POST' },
        )
            .pipe(raiseHTTPErrors())
            .subscribe(() => {
                this.router.refresh({
                    resolverPath: '/explorer',
                    path: this.getRefreshPathForItemAction(),
                })
            })
    }

    launchApplication({
        cdnPackage,
        parameters,
    }: {
        cdnPackage: string
        parameters: { [_k: string]: string }
    }) {
        const queryParams = Object.entries(parameters).reduce(
            (acc, [k, v]) => `${acc}&${k}=${v}`,
            '',
        )
        window.open(
            `/applications/${cdnPackage}/latest?${queryParams}`,
            '_blank',
        )
    }

    private isInstanceItemNode(d: unknown): d is ItemNode {
        return (d as ItemNode).assetId !== undefined
    }
    private isInstanceDriveNode(d: unknown): d is DriveNode {
        return !this.isInstanceItemNode(d) && !d['folderId']
    }
    private isInstanceFolderNode(d: unknown): d is FolderNode {
        return !(this.isInstanceItemNode(d) || this.isInstanceDriveNode(d))
    }

    private getRefreshPathForItemAction() {
        const path = this.router.getCurrentPath()
        const lastPart = path.split('/').slice(-1)[0]
        return lastPart.includes('asset_') ? this.router.getParentPath() : path
    }
}
