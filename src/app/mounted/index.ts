import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AppState } from '../app-state'
import { ExplicitNode, parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ImmutableTree } from '@youwol/rx-tree-views'
import { PyYouwolClient } from '@youwol/local-youwol-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { map, take } from 'rxjs/operators'
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
                    baseUrl: `/mounted/${path}`,
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
    treeState.selectNodeAndExpand(treeState.getNode(`/${basePath}`))
    const name = folder.split('/').slice(-1)[0]
    const node = new ExplicitNode({
        id: `/${basePath}/${name}`,
        name,
        children: getFolderChildren$(window.btoa(folder), ''),
        href: `/${basePath}/${window.btoa(folder)}`,
        icon: {
            tag: 'div',
            class: 'fas fa-folder mx-2',
        },
    })
    if (!treeState.getNode(node.id)) {
        treeState.addChild(`/${basePath}`, node)
    }
    treeState.selectNodeAndExpand(treeState.getNode(node.id))
    router.navigateTo({ path: `/${basePath}/${window.btoa(folder)}` })
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
export function encodeHRef(path) {
    return path
        .split('/')
        .map((p) => window.btoa(p))
        .join('/')
}

function getFolderChildren$(origin: string, from: string) {
    const fromDecoded = from != '' ? decodeHRef(from) : ''

    function getHRef(item: string) {
        return `/${basePath}/${origin}${from}/${window.btoa(item)}`
    }
    function getId(item: string) {
        return `${window.atob(origin)}/${fromDecoded}/${item}`
    }
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
                        return new ExplicitNode({
                            id: getId(folder),
                            name: folder,
                            children: getFolderChildren$(
                                origin,
                                `${from}/${window.btoa(folder)}`,
                            ),
                            href: getHRef(folder),
                            icon: {
                                tag: 'div',
                                class: 'fas fa-folder mx-2',
                            },
                        })
                    }),
                    ...response.files.map((file) => {
                        return new ExplicitNode({
                            id: getId(file),
                            name: file,
                            children: undefined,
                            href: getHRef(file),
                            wrapperClass: 'd-none',
                        })
                    }),
                ]
            }),
        )
}
