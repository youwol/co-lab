import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { PyYouwolClient, Routers } from '@youwol/local-youwol-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { Router } from '@youwol/mkdocs-ts'
import { ObjectJs } from '@youwol/rx-tree-views'
import { CodeEditorView, CodeLanguage } from '../common/code-editor.view'
import { encodeHdPath } from './index'
export class FilesListView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = ''
    public readonly children: ChildrenLike

    constructor({
        path,
        router,
        baseUrl,
    }: {
        path: string
        baseUrl: string
        router: Router
    }) {
        const folderResp$ = new PyYouwolClient().admin.system
            .queryFolderContent$({
                path,
            })
            .pipe(raiseHTTPErrors())

        this.children = {
            policy: 'replace',
            source$: folderResp$,
            vdomMap: (resp: Routers.System.QueryFolderContentResponse) => {
                return resp.files.map(
                    (file) => new ItemView({ file, baseUrl, router }),
                )
            },
        }
    }
}
export class ItemView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class =
        'd-flex align-items-center fv-pointer fv-hover-text-focus'
    public readonly children: ChildrenLike

    constructor({
        file,
        router,
        baseUrl,
    }: {
        file: string
        baseUrl: string
        router: Router
    }) {
        const url = `${baseUrl}/file_${encodeHdPath(file)}`

        this.children = [
            { tag: 'i', class: 'fas fa-file' },
            { tag: 'span', class: 'mx-3' },
            {
                tag: 'a',
                innerText: file,
                href: '@nav/mounted' + url,
                onclick: (ev) => {
                    ev.preventDefault()
                    router.navigateTo({ path: url })
                },
            },
        ]
    }
}

export class FileContentView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = ''
    public readonly children: ChildrenLike

    constructor({ path }: { path: string }) {
        const file$ = new PyYouwolClient().admin.system
            .getFileContent$({
                path,
            })
            .pipe(raiseHTTPErrors())

        const languages: Record<string, CodeLanguage> = {
            '.js': 'javascript',
            '.ts': 'javascript',
            '.css': 'css',
            '.html': 'html',
            '.md': 'markdown',
            '.yml': 'yaml',
            '.py': 'python',
        }
        this.children = [
            {
                source$: file$,
                vdomMap: (resp: string | { [k: string]: unknown }) => {
                    if (typeof resp == 'string') {
                        const language: CodeLanguage = Object.entries(
                            languages,
                        ).reduce((acc, [ext, lang]) => {
                            if (acc != 'unknown') {
                                return acc
                            }
                            return path.endsWith(ext) ? lang : acc
                        }, 'unknown')

                        return new CodeEditorView({
                            language: language,
                            content: resp,
                        })
                    }
                    const state = new ObjectJs.State({
                        title: 'data',
                        data: resp,
                        expandedNodes: ['data_0'],
                    })
                    return new ObjectJs.View({ state })
                },
            },
        ]
    }
}
