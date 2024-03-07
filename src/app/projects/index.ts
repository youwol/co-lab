import { FailuresView, NewProjectsCard, ProjectView } from './project.view'
import { AppState } from '../app-state'
import { ExplicitNode, parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { SearchView } from './search.view'
import { InfoSectionView } from '../common'
import { pyYwDocLink } from '../common/py-yw-references.view'
import { Routers } from '@youwol/local-youwol-client'
import { icon } from './icons'
import { ImmutableTree } from '@youwol/rx-tree-views'
import { BehaviorSubject, firstValueFrom, of } from 'rxjs'
import { delay, map } from 'rxjs/operators'
import { mountReactiveNav } from '../common/mount-reactive-nav'

export * from './state'

const skipNamespace = (name: string) => {
    return name.split('/').slice(-1)[0]
}
const refresh$ = new BehaviorSubject(false)
export const navigation = (appState: AppState) => ({
    name: 'Projects',
    icon: { tag: 'i', class: 'fas  fa-boxes mr-2' },
    actions: [
        {
            tag: 'button',
            class: 'mx-2 btn btn-info btn-sm px-1',
            style: {
                padding: '0px',
            },
            onclick: (ev: MouseEvent) => {
                refresh$.next(true)
                ev.preventDefault()
                ev.stopPropagation()
                appState.projectsState.projectsClient
                    .status$()
                    .pipe(delay(500))
                    .subscribe(() => {
                        refresh$.next(false)
                    })
            },
            children: [
                {
                    tag: 'i',
                    class: {
                        source$: refresh$,
                        vdomMap: (r: boolean) => (r ? 'fa-spin' : ''),
                        wrapper: (d: string) => `${d} fas fa-sync`,
                    },
                },
            ],
        },
    ],
    tableOfContent: Views.tocView,
    html: ({ router }) =>
        new PageView({
            router,
            appState,
        }),
    '/**': ({ path }: { path: string; router: Router }) => {
        const parts = path.split('/').filter((d) => d != '')
        return of({
            tableOfContent: Views.tocView,
            children: [],
            html: async ({ router }) => {
                const project$ = appState.projectsState.projects$.pipe(
                    map((projects) => {
                        return projects.find((p) => p.id === parts.slice(-1)[0])
                    }),
                )
                return firstValueFrom(project$).then((project) => {
                    return new ProjectView({
                        router,
                        project,
                        appState,
                    })
                })
            },
        })
    },
})

export function mountProjects({
    projects,
    router,
    treeState,
}: {
    projects: Routers.Projects.Project[]
    treeState: ImmutableTree.State<ExplicitNode>
    router: Router
}) {
    const entities = projects.map((project) => ({
        ...project,
        name: skipNamespace(project.name),
    }))
    mountReactiveNav<Routers.Projects.Project>({
        basePath: '/projects',
        entities,
        router,
        treeState,
        icon: (entity) => icon(entity),
    })
}

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ router, appState }: { router: Router; appState: AppState }) {
        const { projectsState } = appState
        this.children = [
            parseMd({
                src: `
# Projects

<info>
This page gathers the projects you are working on, they correspond to folder including a \`.yw_pipeline.py\` file.

</info>

## New project

<info>
To create a new project from a template, you need to reference the associated python module in your configuration 
file. Below is an example using the youwol's \`pipeline_typescript_weback_npm\`:

\`\`\`python
from youwol.app.environment import (
    Configuration,
    Projects,
)
from youwol.pipelines.pipeline_typescript_weback_npm \
    import app_ts_webpack_template

projects_folder = Path.home() / 'auto-generated'

Configuration(
    projects=Projects(
        templates=[app_ts_webpack_template(folder=projects_folder)],
    )
)          
\`\`\`                    

Find out more on 
${pyYwDocLink('ProjectTemplate', '/references/youwol/app/environment/models.ProjectTemplate')}.

</info>


<newProject></newProject>

## Browse projects

<searchView></searchView>


## Failures

The following projects have failed to load:            

<failedListView></failedListView>

`,
                router,
                views: {
                    info: (elem: HTMLElement) => {
                        return new InfoSectionView({
                            text: elem.innerHTML,
                            router,
                        })
                    },
                    newProject: () => {
                        return new NewProjectsCard({
                            projectsState,
                        })
                    },
                    searchView: () => new SearchView({ projectsState, router }),
                    projectsListView: () => ({
                        tag: 'ul',
                        children: {
                            policy: 'replace',
                            source$: projectsState.projects$,
                            vdomMap: (projects: Routers.Projects.Project[]) =>
                                projects.map((p) =>
                                    parseMd({
                                        src: `*  [${p.name}](@nav/projects/${p.id})`,
                                        router,
                                    }),
                                ),
                        },
                    }),
                    failedListView: () =>
                        new FailuresView({ appState, router }),
                },
            }),
        ]
    }
}
