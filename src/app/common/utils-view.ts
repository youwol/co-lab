import {
    ChildrenLike,
    VirtualDOM,
    CSSAttribute,
    AnyVirtualDOM,
} from '@youwol/rx-vdom'
import { fromMarkdown, parseMd, Router } from '@youwol/mkdocs-ts'
import {
    BehaviorSubject,
    combineLatest,
    mergeMap,
    Observable,
    of,
    Subject,
    timer,
} from 'rxjs'
import { setup } from '../../auto-generated'
import { AppState } from '../app-state'
import { take } from 'rxjs/operators'
import { Routers } from '@youwol/local-youwol-client'
import { onHTTPErrors } from '@youwol/http-primitives'
import { AssetsGateway, ExplorerBackend } from '@youwol/http-clients'

export const styleShellStdOut = {
    tag: 'pre' as const,
    class: 'px-2',
    style: {
        backgroundColor: 'black',
        color: 'white',
        fontSize: 'smaller',
        minHeight: '25vh',
        maxHeight: '50vh',
    },
}

export const classesButton =
    'd-flex border p-2 rounded  fv-bg-secondary fv-hover-xx-lighter fv-pointer mx-2 align-items-center'

export class NavIconSvg implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'me-2'
    public readonly style: CSSAttribute
    constructor({ filename }: { filename: string }) {
        const basePath = `/api/assets-gateway/cdn-backend/resources/${setup.assetId}/${setup.version}`
        this.style = {
            width: '20px',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '20px',
            backgroundImage: `url(${basePath}/assets/${filename})`,
        }
    }
}

export class CoLabLogo implements VirtualDOM<'a'> {
    public readonly tag = 'a'
    public readonly href = 'index.html?nav=/'
    public readonly onclick: (ev: MouseEvent) => void
    public readonly style = {
        fontSize: '22px',
        fontWeight: 700,
    }
    public readonly class = 'ilab d-flex  align-items-baseline fv-pointer'
    public readonly children: ChildrenLike

    constructor({ router }: { router: Router }) {
        this.onclick = (ev) => {
            ev.preventDefault()
            router.navigateTo({ path: '/' })
        }
        this.children = [
            {
                tag: 'div',
                class: 'd-flex align-items-center',
                style: {
                    fontSize: '18px',
                    color: '#e63946',
                },
                children: [
                    {
                        tag: 'div',
                        style: {
                            fontStyle: 'italic',
                        },
                        innerText: 'C',
                    },
                    {
                        tag: 'div',
                        class: ' me-1 fas fa-globe',
                        style: {
                            fontSize: '12px',
                            fontStyle: 'italic',
                        },
                    },
                ],
            },
            {
                tag: 'span',
                class: 'light',
                style: {
                    fontWeight: 'lighter',
                    color: '#58a4b0',
                },
                innerText: 'Lab',
            },
        ]
    }
}
export class InfoSectionView implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'

    public readonly children: ChildrenLike

    constructor({ text, router }: { text: string; router: Router }) {
        const expanded$ = new BehaviorSubject(false)
        this.children = [
            {
                tag: 'div',
                class: 'd-flex align-items-center',
                children: [
                    {
                        tag: 'i',
                        class: {
                            source$: expanded$,
                            vdomMap: (expanded): string =>
                                expanded
                                    ? 'fv-hover-text-focus fv-text-success'
                                    : 'fv-text-focus',
                            wrapper: (d) =>
                                `${d} fas fa-info-circle fv-pointer`,
                        },
                    },
                ],
                onclick: () => expanded$.next(!expanded$.value),
            },
            {
                source$: expanded$,
                vdomMap: (expanded) =>
                    expanded
                        ? {
                              tag: 'div',
                              class: 'p-2 border-left border-bottom',
                              children: [
                                  parseMd({
                                      src: text,
                                      router,
                                  }),
                              ],
                          }
                        : { tag: 'div' },
            },
        ]
    }
}

/**
 * @category View
 */
export class CopyClipboardView implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'fas fa-clipboard p-1 rounded border fv-pointer fv-hover-text-focus mx-2'

    /**
     * @group Immutable Constants
     */
    public readonly text: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick = () =>
        navigator.clipboard.writeText(this.text).then(() => {
            /*NOOP*/
        })

    constructor(params: { text: string }) {
        Object.assign(this, params)
    }
}

/**
 * @category View
 */
export class AttributeTitleView implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'col col-sm-3'

    /**
     * @group Immutable DOM Constants
     */
    public readonly innerText: string

    /**
     * @group Immutable Constants
     */
    public readonly text: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        fontWeight: 'bolder' as const,
        whiteSpace: 'nowrap' as const,
    }

    constructor(params: { text: string }) {
        Object.assign(this, params)
        this.innerText = this.text
    }
}

/**
 * @category View
 */
export class AttributeValueView implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex align-items-center flex-grow-1'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minWidth: '0px',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group Immutable Constants
     */
    public readonly value: string

    constructor(params: { value: string; [k: string]: string }) {
        this.value = params.value

        this.children = [
            {
                tag: 'div',
                innerText: this.value,
                style: {
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                },
                ...params,
            },
            new CopyClipboardView({ text: this.value }),
        ]
    }
}

/**
 * @category View
 */
export class AttributeView implements VirtualDOM<'div'> {
    /**
     * @group Immutable Constants
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

    constructor({ text, value }) {
        this.children = [
            new AttributeTitleView({ text }),
            new AttributeValueView({ value }),
        ]
    }
}

/**
 * @category View
 */
export class DashboardTitle implements VirtualDOM<'h5'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'h5'

    /**
     * @group Immutable DOM Constants
     */
    public readonly innerText: string

    /**
     * @group Immutable Constants
     */
    public readonly title: string

    constructor(params: { title: string }) {
        Object.assign(this, params)
        this.innerText = this.title
    }
}

export class HdPathBookView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    public readonly class = 'd-flex align-items-center'

    constructor({
        path,
        appState,
        type,
    }: {
        path: string | Observable<string>
        appState: AppState
        type: 'folder' | 'file'
    }) {
        const path$ = typeof path === 'string' ? of(path) : path
        this.children = [
            {
                tag: 'div',
                class: 'flex-grow-1',
                style: {
                    fontFamily: 'monospace',
                    fontSize: 'smaller',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                    direction: 'rtl',
                    textAlign: 'left',
                },
                innerText: {
                    source$: path$,
                    vdomMap: (path: string) => {
                        return path
                    },
                },
            },
            {
                source$: path$,
                vdomMap: (path: string) => {
                    return new CopyClipboardView({
                        text: path,
                    })
                },
            },
            {
                source$: path$,
                vdomMap: (path: string) => {
                    return {
                        tag: 'i',
                        class: 'fas fa-folder-open p-1 rounded border fv-pointer fv-hover-text-focus mx-2',
                        onclick: () => appState.mountHdPath(path, type),
                    }
                },
            },
        ]
    }
}

export function fromMd(file: string) {
    return fromMarkdown({
        url: `/api/assets-gateway/raw/package/${setup.assetId}/${setup.version}/assets/${file}`,
    })
}

export class CoLabBanner implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'h-100 w-100 mb-5'
    public readonly children: ChildrenLike
    public readonly style = {
        position: 'relative' as const,
    }

    constructor({
        router,
        loaded$,
    }: {
        loaded$: Subject<boolean>
        router: Router
    }) {
        const timer$ = timer(0, 1000).pipe(take(2))
        const basePath = `/api/assets-gateway/raw/package/${setup.assetId}/${setup.version}/assets`
        const style = { width: '100%', opacity: 0.1, filter: 'invert(1)' }
        this.children = [
            {
                tag: 'img',
                class: {
                    source$: timer$,
                    vdomMap: (i) => (i == 0 ? '' : 'd-none'),
                },
                style,
                src: `${basePath}/co-lab-light.png`,
                onload: () => loaded$.next(true),
            },
            {
                tag: 'img',
                class: {
                    source$: timer(0, 1000).pipe(take(2)),
                    vdomMap: (i) => (i == 0 ? 'd-none' : ''),
                },
                style,
                src: `${basePath}/co-lab-high.png`,
            },
            {
                tag: 'div',
                class: {
                    source$: loaded$,
                    vdomMap: () => 'w-100',
                    untilFirst: 'd-none',
                },
                style: {
                    position: 'absolute' as const,
                    top: '50%',
                },
                children: [
                    {
                        style: {
                            transform: 'scale(3)',
                        },
                        tag: 'div',
                        class: 'd-flex justify-content-center',
                        children: [new CoLabLogo({ router })],
                    },
                ],
            },
        ]
    }
}

export const spinnerView: AnyVirtualDOM = {
    tag: 'i',
    class: 'fas fa-spinner fa-spin',
}

export class ComponentCrossLinksView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex align-items-center w-100 rounded p-1'
    public readonly children: ChildrenLike
    public readonly appState: AppState
    public readonly component: string
    constructor(params: {
        component: string
        type: 'backend' | 'js-wasm' | 'pyodide'
        appState: AppState
    }) {
        Object.assign(this, params)
        const { component, appState } = params
        const client = new AssetsGateway.Client().explorer
        const itemId = window.btoa(window.btoa(component))
        const sep: AnyVirtualDOM = {
            tag: 'i',
            class: 'mx-2',
        }
        this.children = [
            {
                tag: 'div',
                class: 'd-flex align-items-center',
                children: [
                    {
                        tag: 'i',
                        class: 'fas fa-link',
                        style: {
                            fontSize: '0.7rem',
                        },
                    },
                ],
            },
            sep,
            {
                source$: appState.cdnState.status$,
                vdomMap: (status: Routers.LocalCdn.CdnStatusResponse) => {
                    const enabled =
                        status.packages.find((p) => p.name === component) !==
                        undefined
                    return this.linkView({
                        icon: 'fa-microchip',
                        nav: `components/${params.type}/${window.btoa(component)}`,
                        enabled,
                    })
                },
            },
            sep,
            {
                source$: client
                    .getItem$({
                        itemId,
                    })
                    .pipe(
                        onHTTPErrors(() => undefined),
                        mergeMap((resp?: ExplorerBackend.ItemBase) => {
                            if (resp === undefined) {
                                return of(undefined)
                            }
                            return client.getPath$({ itemId })
                        }),
                    ),
                vdomMap: (resp?: ExplorerBackend.PathBase) => {
                    let nav = ''
                    if (resp) {
                        const folders = resp.folders.reduce(
                            (acc, e) => `${acc}/folder_${e.folderId}`,
                            `${resp.drive.groupId}/folder_${resp.drive.driveId}`,
                        )
                        nav = `/explorer/${folders}/item_${resp.item.itemId}`
                    }
                    return this.linkView({
                        icon: 'fa-folder',
                        nav,
                        enabled: resp !== undefined,
                    })
                },
            },
            sep,
            {
                source$: combineLatest([
                    appState.projectsState.projects$,
                    appState.environment$,
                ]),
                vdomMap: ([projects, env]: [
                    projects: Routers.Projects.Project[],
                    env: Routers.Environment.EnvironmentStatusResponse,
                ]) => {
                    let nav = ''
                    const project = projects.find(
                        (p) => p.name.split('~')[0] === component,
                    )
                    if (project) {
                        const finder =
                            env.youwolEnvironment.projects.finders.find((f) =>
                                project.path.startsWith(f.fromPath),
                            )
                        nav = `/projects/${window.btoa(finder.fromPath)}/${project.id}`
                    }
                    return this.linkView({
                        icon: 'fa-boxes',
                        nav,
                        enabled: project !== undefined,
                    })
                },
            },
            sep,
            {
                source$: appState.projectsState.projects$,
                vdomMap: (projects: Routers.Projects.Project[]) => {
                    const project = projects.find(
                        (p) => p.name.split('~')[0] === component,
                    )
                    return this.linkView({
                        icon: 'fa-laptop',
                        nav: '',
                        enabled: project !== undefined,
                        onclick: (ev) => {
                            ev.preventDefault()
                            project &&
                                appState.mountHdPath(project.path, 'folder')
                        },
                    })
                },
            },
        ]
    }

    private linkView({
        icon,
        enabled,
        nav,
        onclick,
    }: {
        icon: string
        enabled: boolean
        nav?: string
        onclick?: (ev) => void
    }): AnyVirtualDOM {
        if (enabled) {
            return {
                tag: 'a',
                href: onclick ? undefined : `@nav/${nav}`,
                class: `fas ${icon} `,
                onclick: (ev: MouseEvent) => {
                    if (onclick) {
                        return onclick(ev)
                    }
                    ev.preventDefault()
                    this.appState.router.navigateTo({
                        path: nav,
                    })
                },
            }
        }
        return {
            tag: 'i',
            class: `fas ${icon} text-muted`,
        }
    }
}
