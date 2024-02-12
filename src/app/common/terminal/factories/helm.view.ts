import { ChildrenLike, RxHTMLElement, VirtualDOM } from '@youwol/rx-vdom'
import { ImmutableTree } from '@youwol/rx-tree-views'
import { Subject } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import * as pyYw from '@youwol/local-youwol-client'
import { HTTPResponse$ } from '@youwol/http-primitives'

class ChartNode extends ImmutableTree.Node {
    name: string

    constructor({ id, name, children }) {
        super({ id, children })
        this.name = name
    }
}

class FileNode extends ChartNode {
    constructor({ id, name }) {
        super({ id, name, children: undefined })
    }
}

class FolderNode extends ChartNode {
    static getChildren(data, id) {
        const foldersNode = data[id].folders.map((folder) => {
            return new FolderNode({ id: folder.path, name: folder.name, data })
        })
        const filesNode = data[id].files.map((file) => {
            return new FileNode({ id: file.path, name: file.name })
        })
        return [...foldersNode, ...filesNode]
    }

    constructor({ id, name, data }) {
        super({ id, name, children: FolderNode.getChildren(data, id) })
    }
}

export class ChartExplorerView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    public readonly selectedFile$ = new Subject<FileNode>()
    public readonly class =
        'd-flex w-100 h-100 justify-content-around p-3 border '

    constructor(data) {
        const state = new ImmutableTree.State<ChartNode>({
            rootNode: new FolderNode({
                id: data.chart_folder,
                name: '.',
                data: data['chart_explorer'],
            }),
            expandedNodes: ['.'],
        })
        const view = new ImmutableTree.View({
            state,
            headerView: (_, node: ChartNode) =>
                headerView(node, this.selectedFile$),
        })

        this.children = [
            {
                tag: 'div',
                class: 'w-25',
                children: [view],
            },
            {
                tag: 'div',
                class: 'w-75 h-100',
                children: [
                    {
                        source$: this.selectedFile$.pipe(
                            mergeMap((fileNode: FileNode) => {
                                return new pyYw.PyYouwolClient().admin.system.getFileContent$(
                                    { path: fileNode.id },
                                )
                            }),
                        ),
                        vdomMap: (content: HTTPResponse$<string>) => {
                            return {
                                tag: 'div',
                                class: 'flex-grow-1 w-100 h-100 py-1',
                                style: { fontSize: 'small' },
                                connectedCallback: (
                                    elem: RxHTMLElement<'div'>,
                                ) => {
                                    const config = {
                                        value: content,
                                        mode: 'yaml',
                                        theme: 'blackboard',
                                        lineNumbers: true,
                                    }
                                    const cm = window['CodeMirror'](
                                        elem,
                                        config,
                                    )
                                    cm.setSize('100%', '100%')
                                },
                            }
                        },
                    },
                ],
            },
        ]
    }
}

function headerView(node: ChartNode, selectedFile$: Subject<FileNode>) {
    if (node instanceof FileNode) {
        return helmFileView(node, selectedFile$)
    }
    return helmFolderView(node)
}

function helmFolderView(node: FileNode): VirtualDOM<'div'> {
    return {
        tag: 'div',
        class: 'd-flex align-items-center',
        children: [
            {
                tag: 'div',
                class: 'fas fa-folder px-2',
            },
            {
                tag: 'div',
                innerText: node.name,
            },
        ],
    }
}

function helmFileView(
    node: FileNode,
    selectedFile$: Subject<FileNode>,
): VirtualDOM<'div'> {
    return {
        tag: 'div',
        class: 'fv-hover-bg-background-alt fv-pointer d-flex align-items-center ',
        onclick: () => selectedFile$.next(node),
        children: [
            {
                tag: 'div',
                class: 'fas fa-file px-2',
            },
            {
                tag: 'div',
                innerText: node.name,
            },
        ],
    }
}
