import { TopBannerView as TopBannerBase } from '@youwol/os-top-banner'
import { BehaviorSubject, distinctUntilChanged, Subject, timer } from 'rxjs'
import { Views, Router } from '@youwol/mkdocs-ts'
import { AttributeLike, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Routers, PyYouwolClient } from '@youwol/local-youwol-client'
import { AppState } from './app-state'
import { Accounts } from '@youwol/http-clients'
import { CoLabLogo } from './common'

/**
 * Top banner of the application
 *
 * @category View.TopBanner
 */
export class TopBannerView extends TopBannerBase {
    public readonly tag = 'div'
    public readonly class =
        'fv-text-primary fv-bg-background mkdocs-ts-top-banner'
    constructor({
        displayMode$,
        router,
        appState,
    }: {
        displayMode$: Subject<Views.DisplayMode>
        router: Router
        appState: AppState
    }) {
        const loadInProgress$ = new BehaviorSubject(false)
        super({
            innerView: {
                tag: 'div',
                class: 'd-flex flex-column justify-content-center h-100 w-100',
                children: [
                    {
                        tag: 'div',
                        class: 'd-flex mx-auto align-items-center justify-content-center px-5 w-100',
                        children: [
                            {
                                source$: displayMode$.pipe(
                                    distinctUntilChanged(),
                                ),
                                vdomMap: (mode: Views.DisplayMode) => {
                                    return mode === 'Full'
                                        ? { tag: 'div' }
                                        : new Views.ModalNavigationView({
                                              router,
                                          })
                                },
                            },
                            {
                                tag: 'div',
                                style: {
                                    source$: displayMode$.pipe(
                                        distinctUntilChanged(),
                                    ),
                                    vdomMap: (mode: Views.DisplayMode) => {
                                        return mode === 'Full'
                                            ? { width: '12.1rem' }
                                            : { width: '0rem' }
                                    },
                                },
                            },
                            {
                                tag: 'div',
                                class: 'd-flex align-items-center',
                                style: {
                                    width: '12.1rem',
                                },
                                children: [
                                    {
                                        tag: 'div',
                                        class: 'mx-3',
                                    },
                                    new CoLabLogo({ router }),
                                    { tag: 'i', class: 'mx-2' },
                                    new ReloadButton(loadInProgress$),
                                ],
                            },
                            {
                                tag: 'div',
                                class: 'flex-grow-1',
                                style: {
                                    minWidth: '0px',
                                },
                            },
                            {
                                tag: 'div',
                                children: [
                                    new ConnectionView({
                                        state: appState,
                                    }),
                                ],
                            },
                        ],
                    },
                ],
            },
        })
    }
}
class ReloadButton implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    class: AttributeLike<string>
    onclick: () => void

    constructor(private loadInProgress$: Subject<boolean>) {
        const spinning$ = new Subject<boolean>()
        let lastInProgress = Date.now()
        loadInProgress$.subscribe((inProgress) => {
            if (inProgress) {
                lastInProgress = Date.now()
                spinning$.next(true)
            } else {
                timer(new Date(lastInProgress + 1500)).subscribe(() =>
                    spinning$.next(false),
                )
            }
        })
        this.class = {
            source$: spinning$,
            vdomMap: (isSpinning: boolean) => {
                return isSpinning ? ' fa-spin' : ''
            },
            untilFirst: 'fa-spin',
            wrapper: (v: string) =>
                `${v} fv-button fas fa-sync mx-1 fv-pointer fv-hover-text-secondary`,
        }
        this.onclick = () => {
            this.loadInProgress$.next(true)
            new PyYouwolClient().admin.environment
                .reloadConfig$()
                .subscribe(() => this.loadInProgress$.next(false))
        }
    }
}

class LocalConnectionView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class: AttributeLike<string>

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        position: 'relative' as const,
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly customAttributes = {
        dataToggle: 'tooltip',
        title: 'local server',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: { state: AppState }) {
        this.class = {
            source$: params.state.connectedLocal$,
            vdomMap: (isConnected: boolean) =>
                isConnected ? 'fv-text-success' : 'fv-text-error',
            wrapper: (d) => `fas  fa-network-wired  px-2 ${d}`,
        }
        this.children = [
            {
                tag: 'div',
                class: {
                    source$: params.state.connectedLocal$,
                    vdomMap: (isConnected: boolean) =>
                        isConnected
                            ? ''
                            : 'spinner-grow spinner-grow-sm text-secondary',
                },
                role: 'status',
                style: {
                    position: 'absolute',
                    top: '-5px',
                    left: '0px',
                },
            },
        ]
    }
}

class ConnectionView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class: AttributeLike<string>

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: { state: AppState }) {
        this.class = {
            source$: params.state.connectedLocal$,
            vdomMap: (isConnected: boolean) =>
                isConnected ? '' : 'connectionView-bg-blur',
        }
        this.children = [
            {
                source$: params.state.environment$,
                vdomMap: (
                    environment: Routers.Environment.EnvironmentStatusResponse,
                ) => {
                    // This has to be removed when upgrading http/clients to 1.0.5
                    // There is a mismatch: it is now (1.0.4) exposed (wrongly) as remoteGateway
                    const remoteInfo = environment['remoteGatewayInfo']
                    return {
                        tag: 'div',
                        style: {
                            source$: params.state.connectedLocal$,
                            vdomMap: (isConnected: boolean) =>
                                isConnected
                                    ? {}
                                    : {
                                          position: 'relative',
                                          zIndex: 5,
                                      },
                        },
                        class: 'd-flex align-items-center justify-content-center',
                        children: [
                            new LocalConnectionView({ state: params.state }),
                            {
                                tag: 'div',
                                class:
                                    'fas fa-cloud px-2 ' +
                                    (remoteInfo.connected
                                        ? 'fv-text-success'
                                        : 'fv-text-error'),
                                customAttributes: {
                                    dataToggle: 'tooltip',
                                    title: `${remoteInfo.host}`,
                                },
                            },
                            {
                                tag: 'div',
                                class: 'mx-1',
                            },
                            {
                                source$:
                                    new Accounts.AccountsClient().getSessionDetails$(),
                                vdomMap: (
                                    sessionInfo: Accounts.SessionDetails,
                                ) => new UserBadgeDropdownView(sessionInfo),
                            },
                        ],
                    }
                },
            },
        ]
    }
}

/**
 * @category View
 */
export class UserBadgeDropdownView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'dropdown '
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike
    /**
     * @group Immutable Constants
     */
    public readonly sessionInfo: Accounts.SessionDetails

    constructor(sessionInfo: Accounts.SessionDetails) {
        Object.assign(this, { sessionInfo })

        this.children = [
            {
                tag: 'button',
                class: 'btn  dropdown-toggle fv-font-size-regular yw-border-none fv-font-family-regular d-flex align-items-center  fv-text-primary yw-hover-text-primary dropdown-toggle yw-btn-no-focus-shadow me-2  my-auto  p-1 pe-2 fv-hover-bg-background-alt  yw-btn-focus  rounded   top-banner-menu-view  align-items-center',
                type: 'button',
                id: 'dropdownMenuClickableInside',
                customAttributes: {
                    dataBsToggle: 'dropdown',
                    dataBsAutoClose: 'outside',
                    ariaExpanded: false,
                    ariaHaspopup: 'true',
                },
                children: [
                    sessionInfo.userInfo.temp
                        ? new VisitorBadgeView()
                        : new RegisteredBadgeView(this.sessionInfo),
                ],
            },
        ]
    }
}

/**
 * @category View
 */
export class RegisteredBadgeView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex align-items-center'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike
    /**
     * @group Immutable DOM Constants
     */
    public readonly customAttributes

    constructor(userDetails: Accounts.SessionDetails) {
        this.customAttributes = {
            dataBSToggle: 'tooltip',
            title: userDetails.userInfo.name,
        }
        this.children = [new AvatarView(userDetails.userInfo)]
    }
}

/**
 * @category View
 */
export class VisitorBadgeView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class: string =
        'my-auto   fv-hover-bg-background-alt  yw-btn-focus  rounded   top-banner-menu-view d-flex align-items-center'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor() {
        this.children = [
            {
                tag: 'div',
                class: 'fa fa-user-circle fa-2x me-2',
                customAttributes: {
                    dataBSToggle: 'tooltip',
                    title: 'You are a visitor',
                    dataCustom: 'custom-tooltip',
                },
            },
        ]
    }
}

/**
 * @category View
 */
export class AvatarView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'd-flex justify-content-center align-items-center rounded me-2'
    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        width: '25px',
        height: '25px',
        backgroundColor: 'red',
    }
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(userInfos: Accounts.UserInfos) {
        this.children = [
            {
                tag: 'div',
                class: 'rounded text-center',
                style: {
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '13px',
                },
                innerText: userInfos.name
                    .split(' ')
                    .map((name) => name.charAt(0))
                    .join(''),
            },
        ]
    }
}
