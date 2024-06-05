import { ChildrenLike, RxChild, VirtualDOM } from '@youwol/rx-vdom'
import {
    PlatformState,
    PreferencesFacade,
    Preferences,
    PreferencesExtractor,
} from '@youwol/os-core'
import * as OsCore from '@youwol/os-core'
import { Router } from '@youwol/mkdocs-ts'
import { map } from 'rxjs/operators'
import { BehaviorSubject } from 'rxjs'
import { SideAppActionsView } from './actions.view'

/**
 * @category View
 */
export class DesktopWidgetsView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex flex-column w-100'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor() {
        const state = new PlatformState()
        this.children = {
            policy: 'replace',
            source$: PreferencesFacade.getPreferences$(),
            vdomMap: (preferences: Preferences) =>
                PreferencesExtractor.getDesktopWidgets(preferences, {
                    platformState: state,
                }),
        }
    }
}

/**
 * @category View
 */
export class NewAppsView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 flex-grow-1 d-flex flex-column '
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '0px',
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike
    /**
     * @group State
     */
    public readonly state: OsCore.PlatformState

    constructor(params: { state: OsCore.PlatformState; router: Router }) {
        Object.assign(this, params)
        const spinner: RxChild = {
            source$: OsCore.Installer.getApplicationsInfo$(),
            vdomMap: () => {
                return { tag: 'div' }
            },
            untilFirst: {
                tag: 'div',
                class: 'fas fa-spinner fa-spin mx-2',
            },
        }

        this.children = [
            {
                tag: 'div',
                class: 'fv-text-primary d-flex align-items-center',
                children: [spinner],
            },
            {
                tag: 'div',
                class: 'flex-grow-1 overflow-auto',
                style: {
                    minHeight: '0px',
                },
                children: [
                    {
                        tag: 'div',
                        class: 'd-flex p-2 mx-auto flex-wrap justify-content-start align-items-center',
                        children: {
                            policy: 'replace',
                            source$:
                                OsCore.Installer.getApplicationsInfo$().pipe(
                                    map((apps) => {
                                        return apps.filter(
                                            (app) => app.execution.standalone,
                                        )
                                    }),
                                ),
                            vdomMap: (apps: OsCore.ApplicationInfo[]) => {
                                return apps.map((app) => {
                                    return new NewAppView({
                                        state: this.state,
                                        app,
                                        router: params.router,
                                    })
                                })
                            },
                        },
                    },
                ],
            },
        ]
    }
}

/**
 * @category View
 */
class NewAppView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'p-1 d-flex flex-column align-items-center yw-hover-app m-1'
    public readonly style = {
        position: 'relative' as const,
        width: '116px',
        height: '125px',
        overflowWrap: 'anywhere' as const,
        textAlign: 'center' as const,
        justifyContent: 'center' as const,
    }
    /**
     * @group States
     */
    public readonly state: OsCore.PlatformState
    /**
     * @group Immutable Constants
     */
    public readonly app: OsCore.ApplicationInfo
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike
    public readonly hovered$ = new BehaviorSubject(false)

    public readonly onmouseenter = () => {
        this.hovered$.next(true)
    }
    public readonly onmouseleave = () => {
        this.hovered$.next(false)
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly ondblclick: (ev: MouseEvent) => void

    constructor(params: {
        state: OsCore.PlatformState
        app: OsCore.ApplicationInfo
        router: Router
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                class: 'd-flex justify-content-center align-items-center',
                style: {
                    width: '70px',
                    height: '70px',
                },
                children: [this.app.graphics.appIcon],
            },
            {
                tag: 'div',
                class: 'd-flex justify-content-center align-items-center mt-1',
                children: [
                    {
                        tag: 'div',
                        style: {
                            height: '43px',
                        },
                        innerText: this.app.displayName,
                    },
                ],
            },
            {
                source$: this.hovered$,
                vdomMap: (isHovered) =>
                    isHovered
                        ? new SideAppActionsView({
                              state: params.state,
                              router: params.router,
                              app: params.app,
                          })
                        : { tag: 'div' },
            },
        ]
        this.ondblclick = () => {
            const url = `/applications/${this.app.cdnPackage}/latest`
            window.open(url, '_blank')
        }
    }
}
