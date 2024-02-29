import { ImmutableTree } from '@youwol/rx-tree-views'
import { ExplicitNode, Router } from '@youwol/mkdocs-ts'
import { AnyVirtualDOM } from '@youwol/rx-vdom'

export function mountReactiveNav<TEntity extends { id: string; name: string }>({
    basePath,
    entities,
    router,
    treeState,
    icon,
}: {
    basePath: string
    entities: TEntity[]
    treeState: ImmutableTree.State<ExplicitNode>
    router: Router
    icon: (e: TEntity) => AnyVirtualDOM
}) {
    const parentNode = treeState.getNode(basePath)
    const startTime = performance.now()
    treeState.getChildren$(parentNode).subscribe((children: ExplicitNode[]) => {
        const existingIds = children.map((c) => c.id)
        const actualIds = entities.map((e) => `${basePath}/${e.id}`)
        const added = actualIds.filter((id) => !existingIds.includes(id))
        const removed = existingIds.filter((id) => !actualIds.includes(id))
        if (added.length + removed.length === 0) {
            return
        }
        removed.forEach((id) => {
            treeState.removeNode(id, false)
        })

        added.forEach((id) => {
            const entity = entities.find((e) => `${basePath}/${e.id}` === id)
            const name = entity.name
            const href = `${basePath}/${entity.id}`
            const node = new ExplicitNode({
                id,
                name,
                children: undefined,
                href,
                icon: icon(entity),
            })
            const sortedChildren = [
                ...treeState.getNode(basePath).resolvedChildren(),
            ].sort((a, b) => a['name'].localeCompare(b['name']))

            const insertIndex = sortedChildren.findIndex(
                (child) => name.localeCompare(child['name']) < 0,
            )
            const effectiveInsertIndex =
                insertIndex === -1 ? sortedChildren.length : insertIndex

            treeState.insertChild(
                { parent: basePath, insertIndex: effectiveInsertIndex },
                node,
                false,
            )
        })
        treeState.emitUpdate()
        const path = router.getCurrentPath()
        const resolved = treeState.getNode(basePath).resolvedChildren()
        const node = resolved.find((node: ExplicitNode) => node.href === path)

        if (!node && router.getCurrentPath().startsWith(basePath)) {
            router.navigateTo({ path: basePath })
        }
        console.log(`mounted ${basePath}`, {
            entities,
            'elapsed (ms)': performance.now() - startTime,
        })
    })
    treeState.getChildren(parentNode)
}
