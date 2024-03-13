import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AppState } from '../app-state'
import { Navigation, parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { FileContentView, FilesListView } from './views'
import { map, scan, take } from 'rxjs/operators'
import { PyYouwolClient } from '@youwol/local-youwol-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'

export const navigation = (appState: AppState): Navigation => ({
    name: 'Mounted',
    decoration: { icon: { tag: 'i', class: 'fas fa-laptop mr-2' } },
    tableOfContent: Views.tocView,
    html: ({ router }) => new PageView({ router, appState }),
    '...': appState.hdFolder$.pipe(
        scan((acc, f) => [...acc, f], []),
        map(
            (folders: string[]) =>
                ({ path, router }: { path: string; router: Router }) => {
                    return lazyResolver(folders, path, router)
                },
        ),
    ),
})

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
//
function lazyResolver(folders: string[], path: string, router: Router) {
    const parts = path.split('/').filter((d) => d != '')

    if (parts.length === 0) {
        return {
            children: folders.map((folder) => {
                return {
                    id: window.btoa(folder),
                    name: folder.split('/').slice(-1)[0],
                    decoration: {
                        icon: {
                            tag: 'div' as const,
                            class: 'fas fa-folder mx-2',
                        },
                    },
                }
            }),
            html: undefined,
        }
    }
    if (parts.slice(-1)[0].startsWith('file_')) {
        parts[parts.length - 1] = parts[parts.length - 1].replace('file_', '')
        const path = decodeHRef(`${parts[0]}/${parts.slice(1).join('/')}`)
        return {
            tableOfContent: Views.tocView,
            children: undefined,
            html: () =>
                new FileContentView({
                    path,
                }),
        }
    }
    const origin = parts[0]
    const from = parts.slice(1).join('/')

    const fromDecoded = from != '' ? decodeHRef(from) : ''

    return new PyYouwolClient().admin.system
        .queryFolderContent$({
            path: `${window.atob(origin)}/${fromDecoded}`,
        })
        .pipe(
            raiseHTTPErrors(),
            take(1),
            map((response) => {
                return {
                    tableOfContent: Views.tocView,
                    html: () => {
                        if (parts.slice(-1)[0].startsWith('file_')) {
                            parts[parts.length - 1] = parts[
                                parts.length - 1
                            ].replace('file_', '')
                            const path = decodeHRef(
                                `${parts[0]}/${parts.slice(1).join('/')}`,
                            )
                            return new FileContentView({
                                path,
                            })
                        }
                        return new FilesListView({
                            baseUrl: `/mounted${path}`,
                            path: decodeHRef(
                                `${parts[0]}/${parts.slice(1).join('/')}`,
                            ),
                            router,
                        })
                    },
                    children: [
                        ...response.folders.map((folder) => {
                            return {
                                id: window.btoa(folder),
                                name: folder,
                                decoration: {
                                    icon: {
                                        tag: 'div' as const,
                                        class: 'fas fa-folder mx-2',
                                    },
                                },
                            }
                        }),
                        ...response.files.map((file) => {
                            return {
                                id: `file_${window.btoa(file)}`,
                                name: file,
                                leaf: true,
                                decoration: {
                                    icon: {
                                        tag: 'div' as const,
                                        class: 'fas fa-file mx-2',
                                    },
                                },
                            }
                        }),
                    ],
                }
            }),
        )
}
