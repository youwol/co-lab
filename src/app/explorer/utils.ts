export function groupNavNodeInput({
    group,
}: {
    group: { id: string; path: string }
}) {
    return {
        name: group.path.split('/').slice(-1)[0],
        decoration: {
            icon: {
                tag: 'div' as const,
                class: group.id.includes('private')
                    ? 'fas fa-user mx-2'
                    : 'fas fa-users mx-2',
            },
        },
        leaf: true,
        id: group.id,
    }
}
