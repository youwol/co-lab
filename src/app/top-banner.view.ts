import { TopBannerView as TopBannerBase } from '@youwol/os-top-banner'
import {
    BehaviorSubject,
    combineLatest,
    distinctUntilChanged,
    Subject,
    timer,
} from 'rxjs'
import { Views, Router } from '@youwol/mkdocs-ts'
import {
    AnyVirtualDOM,
    AttributeLike,
    ChildrenLike,
    VirtualDOM,
    CustomAttribute,
} from '@youwol/rx-vdom'
import { Routers, PyYouwolClient } from '@youwol/local-youwol-client'
import { AppState } from './app-state'
import { Accounts } from '@youwol/http-clients'
import { CoLabLogo } from './common'
import { internalAnchor } from './common/links.view'
import { map } from 'rxjs/operators'

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
                                class: 'd-flex align-items-center',
                                children: [
                                    new NotificationsView({
                                        state: appState,
                                        router,
                                    }),
                                    { tag: 'i', class: 'mx-1' },
                                    new BackendServingView({
                                        state: appState,
                                        router,
                                    }),
                                    { tag: 'i', class: 'mx-1' },
                                    new UserBadgeDropdownView({
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

class NotificationsView implements VirtualDOM<'div'> {
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

    constructor({ state, router }: { state: AppState; router: Router }) {
        const notifState = state.notificationsState
        this.children = [
            {
                ...internalAnchor({
                    path: '/environment/notifications',
                    router,
                }),
                children: [
                    {
                        tag: 'i',
                        class: {
                            source$: notifState.backendEvents.installing$,
                            vdomMap: (installing: unknown[]) => {
                                return installing.length > 0
                                    ? 'fas fa-plug text-success fv-blink'
                                    : 'd-none'
                            },
                        },
                    },
                    { tag: 'i', class: 'mx-1' },
                    {
                        tag: 'i',
                        class: {
                            source$: notifState.assetEvents.downloading$,
                            vdomMap: (installing: unknown[]) => {
                                return installing.length > 0
                                    ? 'fas fa-download text-success fv-blink'
                                    : 'd-none'
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
export class UserBadgeDropdownView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'dropdown'
    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor({ state }: { state: AppState }) {
        this.children = [
            {
                source$: combineLatest([
                    new Accounts.AccountsClient().getSessionDetails$(),
                    state.environment$,
                ]),
                vdomMap: ([sessionInfo, env]: [
                    Accounts.SessionDetails,
                    Routers.Environment.EnvironmentStatusResponse,
                ]) => {
                    return {
                        tag: 'div',
                        class: 'dropdown',
                        children: [
                            this.headerButton(sessionInfo),
                            {
                                tag: 'div',
                                class: 'dropdown-menu bg-dark',
                                customAttributes: {
                                    ariaLabelledby: 'dropdownMenuButton',
                                },
                                children: [this.currentConnection(env)],
                            },
                        ],
                    }
                },
            },
        ]
    }

    private headerButton(sessionInfo: Accounts.SessionDetails): AnyVirtualDOM {
        return {
            tag: 'button',
            class: 'btn btn-secondary dropdown-toggle d-flex align-items-center bg-info',
            id: 'dropdownMenuButton',
            customAttributes: {
                dataToggle: 'dropdown',
                dataAutoClose: 'outside',
                ariaExpanded: false,
                ariaHaspopup: 'true',
            },
            children: [new RegisteredBadgeView(sessionInfo)],
        }
    }

    private currentConnection(
        env: Routers.Environment.EnvironmentStatusResponse,
    ): AnyVirtualDOM {
        return {
            tag: 'div',
            class: 'dropdown-item d-flex align-items-center fv-pointer disabled',
            children: [
                {
                    tag: 'i',
                    class: 'fas fa-cloud text-success',
                },
                {
                    tag: 'i',
                    class: 'mx-2',
                },
                {
                    tag: 'div',
                    class: 'text-light',
                    innerText: env.remoteGatewayInfo.host,
                },
            ],
        }
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
    public readonly customAttributes: CustomAttribute

    constructor(userDetails: Accounts.SessionDetails) {
        this.customAttributes = {
            dataBSToggle: 'tooltip',
            title: userDetails.userInfo.name,
        }
        this.children = [
            {
                tag: 'div',
                class: 'text-light rounded text-center',
                style: { fontWeight: 'bold', fontSize: '0.9rem' },
                innerText: userDetails.userInfo.name
                    .split(' ')
                    .map((name) => name.charAt(0))
                    .join(''),
            },
        ]
    }
}

class BackendServingView implements VirtualDOM<'a'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'a'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = ''

    /**
     * @group Immutable DOM Constants
     */
    public readonly customAttributes = {
        dataToggle: 'tooltip',
        title: 'Backend(s) serving',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor({ state, router }: { state: AppState; router: Router }) {
        Object.assign(
            this,
            internalAnchor({ path: '/environment/backends', router }),
        )
        this.children = [
            {
                source$: state.environment$.pipe(
                    map((env) => env.configuration.proxiedBackends),
                ),
                vdomMap: (proxieds: Routers.Environment.ProxiedBackend[]) => {
                    return proxieds.length == 0
                        ? { tag: 'i' }
                        : { tag: 'i', class: 'fas fa-network-wired' }
                },
            },
        ]
    }
}
