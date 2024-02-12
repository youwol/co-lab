import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import * as OsCore from '@youwol/os-core'

import { AssetsGateway, ExplorerBackend } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { Router } from '@youwol/mkdocs-ts'

export class SideAppActionsView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    public readonly class = 'd-flex flex-column'
    public readonly style = {
        position: 'absolute' as const,
        top: '5px',
        right: '5%',
    }

    public readonly children: ChildrenLike
    public readonly onclick = (ev) => ev.stopPropagation()

    constructor(params: {
        state: OsCore.PlatformState
        app: OsCore.ApplicationInfo
        router: Router
    }) {
        const assetId = window.btoa(window.btoa(params.app.cdnPackage))
        this.children = [
            new SideAppRunAction({
                state: params.state,
                app: params.app,
            }),
            new SideAppInfoAction({
                assetId,
                name: params.app.displayName,
                router: params.router,
            }),
        ]
    }
}

const basedActionsClass =
    'rounded d-flex justify-content-center align-items-center'
const basedActionsStyle = {
    width: '15px',
    height: '15px',
    marginTop: '3px',
}

const iconsClasses = 'fas  fa-xs yw-hover-text-orange fv-pointer'

class SideAppRunAction implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    public readonly class = basedActionsClass
    public readonly style = basedActionsStyle
    public readonly children: ChildrenLike
    public readonly onclick: (ev) => void

    constructor(params: {
        state: OsCore.PlatformState
        app: OsCore.ApplicationInfo
    }) {
        this.children = [
            {
                tag: 'a',
                class: `fa-play ${iconsClasses}`,
                href: `/applications/${params.app.cdnPackage}/latest`,
                target: '_blank',
                customAttributes: {
                    dataToggle: 'tooltip',
                    title: 'Run',
                },
            },
        ]
    }
}

class SideAppInfoAction implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    public readonly class = basedActionsClass
    public readonly style = basedActionsStyle
    public readonly children: ChildrenLike
    public readonly onclick: () => void

    constructor(params: { name: string; assetId: string; router: Router }) {
        Object.assign(this, params)
        this.children = [
            {
                source$: new AssetsGateway.Client().explorer
                    .getPath$({ itemId: params.assetId })
                    .pipe(raiseHTTPErrors()),
                vdomMap: (resp: ExplorerBackend.GetPathResponse) => {
                    const folders = resp.folders.reduce(
                        (acc, e) => acc + '/folder_' + e.folderId,
                        '',
                    )
                    const path = `/explorer/${resp.drive.groupId}/folder_${resp.drive.driveId}${folders}/asset_${resp.item.assetId}`
                    return {
                        tag: 'a',
                        class: `fa-info ${iconsClasses}`,
                        href: '',
                        onclick: (ev) => {
                            ev.stopPropagation()
                            ev.preventDefault()
                            params.router.navigateTo({ path })
                        },
                        customAttributes: {
                            dataToggle: 'tooltip',
                            title: 'More information',
                        },
                    }
                },
            },
        ]
    }
}
