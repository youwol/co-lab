import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { State } from './state'
import { map } from 'rxjs/operators'

export class SearchView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'my-2'
    public readonly children: ChildrenLike
    constructor({ projectsState }: { projectsState: State }) {
        const tags$ = projectsState.projects$.pipe(
            map(
                (projects) =>
                    new Set(
                        projects
                            .map((p) => {
                                return p.pipeline.tags
                            })
                            .flat(),
                    ),
            ),
        )
        this.children = [
            {
                tag: 'div',
                class: 'd-flex align-items-center',
                children: [
                    { tag: 'i', class: 'fas fa-search' },
                    { tag: 'span', class: 'mx-2' },
                    {
                        tag: 'input',
                        type: 'text',
                    },
                ],
            },
            {
                tag: 'div',
                class: 'd-flex flex-wrap',
                children: {
                    policy: 'replace',
                    source$: tags$,
                    vdomMap: (tags: Set<string>) =>
                        Array.from(tags).map((tag): AnyVirtualDOM => {
                            return {
                                tag: 'div',
                                class: 'd-flex mx-2 p-1',
                                children: [
                                    {
                                        tag: 'input',
                                        type: 'checkbox',
                                    },
                                    { tag: 'div', class: 'mx-1' },
                                    {
                                        tag: 'div',
                                        innerText: tag,
                                    },
                                ],
                            }
                        }),
                },
            },
        ]
    }
}
