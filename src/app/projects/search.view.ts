import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { State } from './state'
import { map } from 'rxjs/operators'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { Routers } from '@youwol/local-youwol-client'
import { Router } from '@youwol/mkdocs-ts'
import { icon } from './icons'

export class SearchView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'my-2'
    public readonly children: ChildrenLike

    public readonly searchTerm$ = new BehaviorSubject('')
    public readonly tags$ = new BehaviorSubject<string[]>([])
    constructor({
        router,
        projectsState,
    }: {
        projectsState: State
        router: Router
    }) {
        const allTags$ = projectsState.projects$.pipe(
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
        const selected$ = combineLatest([
            projectsState.projects$,
            this.tags$,
            this.searchTerm$,
        ]).pipe(
            map(([projects, tags, term]) => {
                return projects
                    .filter((project) => {
                        return tags.reduce(
                            (acc, tag) =>
                                acc || project.pipeline.tags.includes(tag),
                            false,
                        )
                    })
                    .filter((p) => {
                        return term == '' ? true : p.name.includes(term)
                    })
            }),
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
                        oninput: (ev) => {
                            this.searchTerm$.next(ev.target['value'])
                        },
                    },
                ],
            },
            {
                tag: 'div',
                class: 'd-flex flex-wrap',
                children: {
                    policy: 'replace',
                    source$: allTags$,
                    vdomMap: (tags: Set<string>) => {
                        return Array.from(tags).map((tag): AnyVirtualDOM => {
                            return {
                                tag: 'div',
                                class: 'd-flex mx-2 p-1',
                                children: [
                                    {
                                        tag: 'input',
                                        type: 'checkbox',
                                        onchange: (ev) => {
                                            const f = this.tags$.value.filter(
                                                (t) => t != tag,
                                            )
                                            console.log(ev)
                                            this.tags$.next(
                                                ev.target['checked']
                                                    ? [...f, tag]
                                                    : f,
                                            )
                                        },
                                    },
                                    { tag: 'div', class: 'mx-1' },
                                    {
                                        tag: 'div',
                                        innerText: tag,
                                    },
                                ],
                            }
                        })
                    },
                },
            },
            {
                tag: 'div',
                class: '',
                children: {
                    policy: 'replace',
                    source$: selected$,
                    vdomMap: (projects: Routers.Projects.Project[]) => {
                        console.log('Projects', projects)
                        return projects.map((p) => ({
                            tag: 'a',
                            class: 'd-flex align-items-center m-2',
                            href: `@nav/projects/${p.id}`,
                            children: [
                                icon(p),
                                {
                                    tag: 'div',
                                    innerText: p.name,
                                },
                            ],
                            onclick: (ev) => {
                                ev.preventDefault()
                                router.navigateTo({ path: `/projects/${p.id}` })
                            },
                        }))
                    },
                },
            },
        ]
    }
}
