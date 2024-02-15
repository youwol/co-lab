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
import { combineLatest, ReplaySubject, Subject } from 'rxjs'
import { AssetLightDescription } from '@youwol/os-core'
import { parseMd, Router } from '@youwol/mkdocs-ts'
import { ExplorerView } from '../package-explorer.view'
import { map, mergeMap } from 'rxjs/operators'

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

*TODO: PROVIDE A LINK TO THE ASSET IN THE EXPLORER*

## Versions      
                `,
                router: params.router,
            }),
            {
                source$: this.cdnState.packagesEvent[this.packageId].info$,
                vdomMap: (packageInfo: pyYw.Routers.LocalCdn.CdnPackage) => {
                    this.selectedVersion$.next(packageInfo.versions[0].version)
                    return new VersionsView({
                        cdnState: this.cdnState,
                        package: packageInfo,
                        selectedVersion$: this.selectedVersion$,
                    })
                },
            },
            parseMd({
                src: `
## Explorer      

*TODO: NEXT EXPLORER NEEDS TO BE REACTIVE*
                `,
                router: params.router,
            }),
            {
                source$: combineLatest([
                    new AssetsBackend.AssetsClient()
                        .getAsset$({ assetId: window.btoa(this.packageId) })
                        .pipe(raiseHTTPErrors()),
                    this.selectedVersion$,
                ]),
                vdomMap: ([assetResponse, version]: [
                    AssetLightDescription,
                    string,
                ]): AnyVirtualDOM => {
                    const asset = {
                        ...assetResponse,
                        rawId: this.packageId,
                    } as AssetLightDescription
                    return new ExplorerView({ asset, version })
                },
            },
            parseMd({
                src: `
## Links      

*TODO: PROVIDE THE LINKS (bundle analysis, coverage, *etc.*)*
                `,
                router: params.router,
            }),
            {
                source$: this.selectedVersion$.pipe(
                    mergeMap((version) =>
                        new CdnBackend.Client()
                            .getResource$({
                                libraryId: this.packageId,
                                version,
                                restOfPath: '.yw_metadata.json',
                            })
                            .pipe(map((resp) => ({ resp, version }))),
                    ),
                    raiseHTTPErrors(),
                ),
                vdomMap: ({ resp, version }) => {
                    console.log('resp', resp)
                    return {
                        tag: 'div',
                        children: resp.links.map((link) => {
                            return parseMd({
                                src: `
### ${link.name}      

<iframe height='800px' width='100%' src='/api/cdn-backend/resources/${this.packageId}/${version}/${link.url}'></iframe>

                `,
                                router: params.router,
                            })
                        }),
                    }
                },
            },
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
