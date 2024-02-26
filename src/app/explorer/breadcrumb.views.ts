import { GetPathResponse } from '@youwol/http-clients/dist/src/lib/explorer-backend'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { AssetsBackend, AssetsGateway } from '@youwol/http-clients'
import { Router } from '@youwol/mkdocs-ts'

export class BreadcrumbViews implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex'
    public readonly children: ChildrenLike
    public readonly client = new AssetsGateway.Client()

    constructor({
        response,
        path,
        router,
    }: {
        response: AssetsBackend.GetAssetResponse
        path?: string
        router: Router
    }) {
        this.children = {
            policy: 'replace',
            source$: this.client.explorer.getPath$({
                itemId: response.assetId,
            }),
            vdomMap: (paths: GetPathResponse) => {
                const folderNames = getNestedFolderNames(paths)
                const folderPath = getNestedFoldersPath(path)

                return getBreadcrumb(folderPath, folderNames).map(
                    (d) =>
                        new BreadcrumbWidgetViews({
                            name: d.name,
                            path: d.path,
                            router: router,
                        }),
                )
            },
        }
    }
}

class BreadcrumbWidgetViews implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex align-items-center'
    public readonly children: ChildrenLike

    constructor({ name, path, router }) {
        this.children = [
            {
                tag: 'div',
                style: {
                    fontSize: 'x-large',
                },
                innerText: '/',
            },
            {
                tag: 'div',
                class: 'd-flex border rounded fv-hover-text-focus fv-pointer mx-1 p-1',
                innerText: `${name}`,
                onclick: () =>
                    router.navigateTo({
                        path: `/explorer${path}`,
                    }),
            },
        ]
    }
}

function getNestedFolderNames(data: GetPathResponse): string[] {
    const { drive, folders } = data
    const folderNames: string[] = []

    folderNames.push(drive.name)
    for (const folder of folders) {
        folderNames.push(folder.name)
    }
    return folderNames
}

function getNestedFoldersPath(input: string): string[] {
    const folders: string[] = []
    let currentPath = ''

    input.split('/').forEach((part) => {
        if (part && part.startsWith('folder_')) {
            currentPath += `${part}/`
            folders.push(currentPath)
        } else {
            currentPath += `${part}/`
        }
    })

    return folders
}

const getBreadcrumb = (paths: string[], folders: string[]) =>
    paths.map((path, index) => ({ name: folders[index], path }))
