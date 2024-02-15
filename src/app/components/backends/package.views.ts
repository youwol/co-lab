import { State } from '../state'

import { parseMd, Router } from '@youwol/mkdocs-ts'
import { PackageView } from '../js-wasm/package.views'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AssetsGateway } from '@youwol/http-clients'
import { onHTTPErrors } from '@youwol/http-primitives'
import { of } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

/**
 * @category View
 */
export class BackendView extends PackageView {
    constructor(params: {
        cdnState: State
        router: Router
        packageId: string
    }) {
        super(params)
        this.children.push(
            parseMd({
                src: `
## Install Manifest

<installManifest></installManifest>      
                `,
                router: params.router,
                views: {
                    installManifest: () => {
                        return new InstallManifestView({
                            packageId: this.packageId,
                        })
                    },
                },
            }),
        )
    }
}

class InstallManifestView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ packageId }: { packageId: string }) {
        this.children = [
            {
                tag: 'pre',
                class: 'overflow-auto',
                style: {
                    maxHeight: '50vh',
                },
                innerText: {
                    source$: new AssetsGateway.Client().cdn
                        .getResource$({
                            libraryId: packageId,
                            version: '0.1.0',
                            restOfPath: '/install.manifest.txt',
                        })
                        .pipe(
                            onHTTPErrors(() => undefined),
                            mergeMap((content?: string) => {
                                if (content) {
                                    return of(content)
                                }
                                return of(undefined)
                            }),
                        ),
                    vdomMap: (text?: string) => {
                        return text || 'No manifest available'
                    },
                },
            },
        ]
    }
}
