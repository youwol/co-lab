import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { ImmutableTree } from '@youwol/rx-tree-views'
import { of } from 'rxjs'

/**
 * @category Data structure
 */
export class LogDataNode extends ImmutableTree.Node {
    /**
     * @group Immutable Constants
     */

    public readonly name: string
    /**
     * @group Immutable Constants
     */

    public readonly data: unknown

    constructor({ name, data }: { name: string; data: unknown }) {
        super({
            id: `${Math.floor(Math.random() * 1e6)}`,
            children: LogDataNode.getChildren(data),
        })
        this.name = name
        this.data = data
    }

    static getChildren(data) {
        const isObject =
            data != null &&
            typeof data != 'string' &&
            typeof data != 'number' &&
            typeof data != 'boolean'
        return isObject
            ? of(
                  Object.entries(data).map(
                      ([k, v]) => new LogDataNode({ name: k, data: v }),
                  ),
              )
            : undefined
    }
}

/**
 * @category View
 */
export class DataView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'fv-pointer'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        fontSize: 'small',
    }

    constructor(data, expandRoot: boolean = false) {
        const rootNode = new LogDataNode({ name: 'data', data })
        const expandedNodes = expandRoot ? [rootNode.id] : []
        const treeState = new ImmutableTree.State({ rootNode, expandedNodes })
        const headerView = (
            _state: ImmutableTree.State<LogDataNode>,
            node: LogDataNode,
        ): VirtualDOM<'div'> => {
            const title: VirtualDOM<'div'> = {
                tag: 'div',
                innerText: node.name,
            }
            return node.children
                ? title
                : {
                      tag: 'div',
                      class: 'd-flex align-items-baseline',
                      children: [
                          title,
                          {
                              tag: 'i',
                              class: 'px-2',
                              innerText: `${node.data}`,
                          },
                      ],
                  }
        }
        this.children = [
            new ImmutableTree.View({ state: treeState, headerView }),
        ]
    }
}
