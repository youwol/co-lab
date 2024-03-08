import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AppState } from '../app-state'
import { ExplicitNode, parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ImmutableTree } from '@youwol/rx-tree-views'
import { PyYouwolClient } from '@youwol/local-youwol-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { map, shareReplay, take } from 'rxjs/operators'
import { of } from 'rxjs'
import { FileContentView, FilesListView } from './views'

const basePath = 'mounted'
export const navigation = (appState: AppState) => ({
    name: 'Mounted',
    icon: { tag: 'i', class: 'fas fa-laptop mr-2' },
    tableOfContent: Views.tocView,
    html: ({ router }) => new PageView({ router, appState }),
    '/**': ({ path, router }: { path: string; router: Router }) => {
        const parts = path.split('/').filter((d) => d != '')
        return of({
            tableOfContent: Views.tocView,
            children: [],
            html: async () => {
                if (parts.slice(-1)[0].startsWith('file_')) {
                    parts[parts.length - 1] = parts[parts.length - 1].replace(
                        'file_',
                        '',
                    )
                    const path = decodeHRef(
                        `${parts[0]}/${parts.slice(1).join('/')}`,
                    )
                    return new FileContentView({
                        path,
                    })
                }
                return new FilesListView({
                    baseUrl: `/mounted${path}`,
                    path: decodeHRef(`${parts[0]}/${parts.slice(1).join('/')}`),
                    router,
                })
            },
        })
    },
})

export function mountFolder({
    folder,
    treeState,
    router,
}: {
    folder: string
    treeState: ImmutableTree.State<ExplicitNode>
    router: Router
}) {
    const parentNode = treeState.getNode(`/${basePath}`)

    treeState.getChildren$(parentNode).subscribe((children: ExplicitNode[]) => {
        const name = folder.split('/').slice(-1)[0]
        const id = `/${basePath}/${window.btoa(folder)}`
        if (children.find((node) => node.id === id)) {
            return
        }
        const node = new ExplicitNode({
            id: id,
            name,
            // if share replay is omitted:
            // Failed to execute 'fetch' on 'Window':
            // Cannot construct a Request with a Request object that has already been used.
            // This is because of `router.navigateTo` below; the shareReplay somehow prevents this
            children: getFolderChildren$(window.btoa(folder), '').pipe(
                shareReplay(1),
            ),
            href: id,
            icon: {
                tag: 'div',
                class: 'fas fa-folder mx-2',
            },
        })
        treeState.addChild(parentNode, node)
        router.navigateTo({ path: node.href })
    })
    treeState.getChildren(parentNode)
}

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ router }: { appState: AppState; router: Router }) {
        this.children = [
            parseMd({
                src: `
# Mounted


This page allows to explore folders referenced by your laboratory.

These folders are added when clicking on the <i class="fas fa-folder-open"></i> associated to folder path on 
your hard drive.

`,
                router,
            }),
        ]
    }
}

export function decodeHRef(path) {
    return path
        .split('/')
        .map((p) => window.atob(p))
        .join('/')
}

function getFolderChildren$(origin: string, from: string) {
    const fromDecoded = from != '' ? decodeHRef(from) : ''

    const baseId = `/${basePath}/${origin}${from}`
    return new PyYouwolClient().admin.system
        .queryFolderContent$({
            path: window.atob(origin) + fromDecoded,
        })
        .pipe(
            raiseHTTPErrors(),
            take(1),
            map((response) => {
                return [
                    ...response.folders.map((folder) => {
                        const id = `${baseId}/${window.btoa(folder)}`
                        return new ExplicitNode({
                            id,
                            name: folder,
                            children: getFolderChildren$(
                                origin,
                                `${from}/${window.btoa(folder)}`,
                            ),
                            href: id,
                            icon: {
                                tag: 'div',
                                class: 'fas fa-folder mx-2',
                            },
                        })
                    }),
                    ...response.files.map((file) => {
                        const id = `${baseId}/file_${window.btoa(file)}`
                        return new ExplicitNode({
                            id,
                            name: file,
                            children: undefined,
                            href: id,
                            icon: {
                                tag: 'div',
                                class: 'fas fa-file mx-2',
                            },
                        })
                    }),
                ]
            }),
        )
}
