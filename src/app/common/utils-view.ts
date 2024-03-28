import { ChildrenLike, VirtualDOM, CSSAttribute } from '@youwol/rx-vdom'
import {
    fromMarkdown,
    GlobalMarkdownViews,
    parseMd,
    Router,
} from '@youwol/mkdocs-ts'
import { BehaviorSubject, Observable, of, Subject, timer } from 'rxjs'
import { setup } from '../../auto-generated'
import { AppState } from '../app-state'
import { take } from 'rxjs/operators'

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
    public readonly class = 'mr-2'
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
                children: [
                    {
                        tag: 'div',
                        class: 'i',
                        innerText: 'C',
                        style: {
                            fontSize: '22px',
                        },
                    },
                    {
                        tag: 'div',
                        class: 'i mr-1 fas fa-globe',
                        style: {
                            fontSize: '15px',
                        },
                    },
                ],
            },
            {
                tag: 'span',
                class: 'light',
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
    }: {
        path: string | Observable<string>
        appState: AppState
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
                        onclick: () => appState.hdFolder$.next(path),
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

export const globalMdViews = {
    ...GlobalMarkdownViews.factory,
    docLink: (elem: HTMLElement) => {
        return {
            tag: 'a' as const,
            href: `/doc?nav=${elem.getAttribute('nav')}`,
            target: '_blank',
            innerText: elem.innerText,
        }
    },
}
