import {
    ChildrenLike,
    AnyVirtualDOM,
    VirtualDOM,
    ChildLike,
} from '@youwol/rx-vdom'
import { State } from '../state'

import { AssetsBackend, CdnBackend } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import {
    combineLatest,
    from,
    Observable,
    ReplaySubject,
    Subject,
    switchMap,
} from 'rxjs'
import { AssetLightDescription } from '@youwol/os-core'
import { parseMd, Router } from '@youwol/mkdocs-ts'
import { ExplorerView } from '../package-explorer.view'
import { map, mergeMap } from 'rxjs/operators'
import { ExplorerLinkView } from '../../common/links.view'

/**
 * @category View
 */
export class PackageView implements VirtualDOM<'div'> {
    /**
     * @group States
     */
    public readonly cdnState: State

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex flex-column h-100'
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable Constants
     */
    public readonly packageId: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildLike[]

    public readonly selectedVersion$ = new ReplaySubject<string>(1)
    constructor(params: {
        cdnState: State
        router: Router
        packageId: string
    }) {
        Object.assign(this, params)
        this.cdnState.openPackage(this.packageId)
        this.children = [
            parseMd({
                src: `
# ${window.atob(this.packageId)}          

<linkExplorer></linkExplorer>

## Versions      

**Select the version** from the table below:

<versions></versions>

<details></details>


                `,
                router: params.router,
                views: {
                    linkExplorer: () => {
                        return new ExplorerLinkView({
                            router: params.router,
                            name: window.atob(this.packageId),
                        })
                    },
                    versions: () => ({
                        tag: 'div',
                        children: [
                            {
                                source$:
                                    this.cdnState.packagesEvent[this.packageId]
                                        .info$,
                                vdomMap: (
                                    packageInfo: pyYw.Routers.LocalCdn.CdnPackage,
                                ) => {
                                    this.selectedVersion$.next(
                                        packageInfo.versions.slice(-1)[0]
                                            .version,
                                    )
                                    return new VersionsView({
                                        cdnState: this.cdnState,
                                        package: packageInfo,
                                        selectedVersion$: this.selectedVersion$,
                                    })
                                },
                            },
                        ],
                    }),
                    details: () => {
                        return new PackageDetailsView({
                            router: params.router,
                            selectedVersion$: this.selectedVersion$,
                            packageId: this.packageId,
                        })
                    },
                },
            }),
        ]
    }
}

export class PackageDetailsView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable Constants
     */
    public readonly package: pyYw.Routers.LocalCdn.CdnPackage

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor({
        packageId,
        router,
        selectedVersion$,
    }: {
        packageId: string
        router: Router
        selectedVersion$: Subject<string>
    }) {
        this.children = [
            parseMd({
                emitHtmlUpdated: true,
                src: `
## Type

<launch></launch>

## Explorer

<explorer></explorer>

## Links      

<links></links>
                    
                    `,
                router,
                views: {
                    launch: () => {
                        return new LinkLaunchAppLib({
                            selectedVersion$,
                            packageId,
                            router,
                        })
                    },
                    explorer: () =>
                        new FilesView({
                            selectedVersion$: selectedVersion$,
                            packageId: packageId,
                        }),
                    links: () =>
                        new LinksView({
                            selectedVersion$: selectedVersion$,
                            packageId: packageId,
                        }),
                },
            }),
        ]
    }
}

/**
 * @category View
 */
export class VersionsView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'overflow-auto mx-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        maxHeight: '50%',
    }

    /**
     * @group Immutable Constants
     */
    public readonly package: pyYw.Routers.LocalCdn.CdnPackage

    /**
     * @group Observables
     */
    public readonly selectedVersion$: Subject<string>

    constructor(params: {
        cdnState: State
        package: pyYw.Routers.LocalCdn.CdnPackage
        selectedVersion$: Subject<string>
    }) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'div',
                class: 'd-flex justify-content-around w-100',
                children: [
                    {
                        tag: 'div',
                        class: 'd-flex flex-column h-100 px-2 w-100',
                        children: [
                            this.packageDetails(this.package),
                            {
                                tag: 'br',
                            },
                        ],
                    },
                ],
            },
        ]
    }

    packageDetails(pack: pyYw.Routers.LocalCdn.CdnPackage): VirtualDOM<'div'> {
        return {
            tag: 'div' as const,
            class: 'overflow-auto',
            style: {
                maxHeight: '50%',
                width: 'fit-content',
            },
            children: [
                {
                    tag: 'table',
                    class: 'w-100 text-center',
                    style: { maxHeight: '100%' },
                    children: [
                        {
                            tag: 'thead',
                            children: [
                                {
                                    tag: 'tr',
                                    class: '',
                                    children: [
                                        {
                                            tag: 'td',
                                            innerText: 'Version',
                                            class: 'px-2',
                                        },
                                        {
                                            tag: 'td',
                                            innerText: 'files count',
                                            class: 'px-2',
                                        },
                                        {
                                            tag: 'td',
                                            innerText: 'Entry-point size (kB)',
                                            class: 'px-2',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            tag: 'tbody',
                            children: pack.versions.map(
                                (
                                    packVersion: pyYw.Routers.LocalCdn.CdnVersion,
                                ): AnyVirtualDOM => {
                                    return {
                                        tag: 'tr',
                                        class: {
                                            source$: this.selectedVersion$,
                                            vdomMap: (s): string =>
                                                s == packVersion.version
                                                    ? 'fv-text-focus'
                                                    : '',
                                            wrapper: (d) =>
                                                `${d} fv-hover-bg-background-alt fv-pointer fv-hover-text-primary`,
                                        },
                                        onclick: () => {
                                            this.selectedVersion$.next(
                                                packVersion.version,
                                            )
                                        },
                                        children: [
                                            {
                                                tag: 'td',
                                                innerText: packVersion.version,
                                                class: 'px-2',
                                            },
                                            {
                                                tag: 'td',
                                                innerText: `${packVersion.filesCount}`,
                                                class: 'px-2',
                                            },
                                            {
                                                tag: 'td',
                                                innerText: `${
                                                    Math.floor(
                                                        packVersion.entryPointSize,
                                                    ) / 1000
                                                }`,
                                                class: 'px-2',
                                            },
                                        ],
                                    }
                                },
                            ),
                        },
                    ],
                },
            ],
        }
    }
}

export class FilesView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({
        selectedVersion$,
        packageId,
    }: {
        packageId: string
        selectedVersion$: Observable<string>
    }) {
        this.children = [
            {
                source$: combineLatest([
                    new AssetsBackend.AssetsClient()
                        .getAsset$({
                            assetId: window.btoa(packageId),
                        })
                        .pipe(raiseHTTPErrors()),
                    selectedVersion$,
                ]),
                vdomMap: ([assetResponse, version]: [
                    AssetLightDescription,
                    string,
                ]): AnyVirtualDOM => {
                    const asset = {
                        ...assetResponse,
                        rawId: packageId,
                    } as AssetLightDescription
                    return new ExplorerView({ asset, version })
                },
            },
        ]
    }
}

export class LinksView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({
        selectedVersion$,
        packageId,
    }: {
        packageId: string
        selectedVersion$: Observable<string>
    }) {
        this.children = [
            {
                source$: selectedVersion$.pipe(
                    mergeMap((version) =>
                        new CdnBackend.Client()
                            .getResource$({
                                libraryId: packageId,
                                version,
                                restOfPath: '.yw_metadata.json',
                            })
                            .pipe(
                                map((resp) => ({
                                    resp,
                                    version,
                                })),
                            ),
                    ),
                    raiseHTTPErrors(),
                ),
                vdomMap: ({ resp, version }) => {
                    return {
                        tag: 'ul',
                        children: resp.links.map((link) => {
                            const href =
                                link.kind === 'artifactFile'
                                    ? `/api/cdn-backend/resources/${packageId}/${version}/${link.url}`
                                    : link.url
                            return {
                                tag: 'li',
                                children: [
                                    {
                                        tag: 'a',
                                        target: '_blank',
                                        href,
                                        innerText: link.name,
                                    },
                                ],
                            }
                        }),
                    }
                },
            },
        ]
    }
}

export class LinkLaunchAppLib implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({
        selectedVersion$,
        packageId,
        router,
    }: {
        packageId: string
        selectedVersion$: Observable<string>
        router: Router
    }) {
        const packageName = window.atob(packageId)
        this.children = [
            {
                source$: selectedVersion$.pipe(
                    switchMap((version) => {
                        return from(
                            fetch(
                                `/api/assets-gateway/raw/package/${packageId}/${version}/.yw_metadata.json`,
                            )
                                .then((resp) => resp.json())
                                .then((resp) => ({
                                    ...resp,
                                    version,
                                })),
                        )
                    }),
                ),
                vdomMap: (resp: {
                    family?: string
                    version: string
                    execution?: { standalone: boolean }
                }) => {
                    if (resp.family === 'application') {
                        return new LinkLaunchAppView({
                            version: resp.version,
                            packageName,
                            execution: resp.execution,
                            router,
                        })
                    }
                    if (resp.family === 'library') {
                        return new LinkTryLibView({
                            version: resp.version,
                            packageName,
                            router,
                        })
                    }
                    return { tag: 'div' }
                },
            },
        ]
    }
}

export class LinkLaunchAppView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({
        version,
        packageName,
        execution,
        router,
    }: {
        version: string
        packageName: string
        execution: { standalone?: boolean; parametrized?: unknown[] }
        router: Router
    }) {
        this.children = [
            execution.standalone &&
                parseMd({
                    src: 'The package is a standalone application, you can launch it from <linkApp></linkApp>.',
                    router,
                    views: {
                        linkApp: () => {
                            return {
                                tag: 'a',
                                target: '_blank',
                                class: 'link-success',
                                href: `/applications/${packageName}/${version}`,
                                innerText: 'here',
                            }
                        },
                    },
                }),
            execution.parametrized.length > 0 &&
                parseMd({
                    src: `
The package is an application that can be launched from an asset.      
Refer to the file \`.yw_metadata.json\` for derails. `,
                    router,
                }),
        ]
    }
}

export class LinkTryLibView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({
        version,
        packageName,
        router,
    }: {
        version: string
        packageName: string
        router: Router
    }) {
        const urlWebpm =
            '/api/assets-gateway/cdn-backend/resources/QHlvdXdvbC93ZWJwbS1jbGllbnQ=/^3.0.0/dist/@youwol/webpm-client.js'

        const tryLibScript = `
<!DOCTYPE html>
<html lang="en">
    <head><script src="${urlWebpm}"></script></head>
    <body id="content"></body>    
    <script type="module">
        const {lib} = await webpm.install({
            modules:['${packageName}#${version} as lib'],
            displayLoadingScreen: true,
        })
        console.log(lib)
    </script>
</html>        
        `

        this.children = [
            parseMd({
                src: `
The package is a library, you can try it from <linkLib></linkLib>.`,
                router,
                views: {
                    linkLib: () => ({
                        tag: 'a',
                        target: '_blank',
                        href: `/applications/@youwol/js-playground/latest?content=${encodeURIComponent(tryLibScript)}`,
                        innerText: 'here',
                    }),
                },
            }),
        ]
    }
}
