import { FailuresView, NewProjectsCard, ProjectView } from './project.view'
import { AppState } from '../app-state'
import { Navigation, parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { SearchView } from './search.view'
import { InfoSectionView } from '../common'
import { pyYwDocLink } from '../common/py-yw-references.view'
import { Routers } from '@youwol/local-youwol-client'
import { BehaviorSubject } from 'rxjs'
import { delay, map } from 'rxjs/operators'
import { icon } from './icons'

export * from './state'

const skipNamespace = (name: string) => {
    return name.split('/').slice(-1)[0]
}
const refresh$ = new BehaviorSubject(false)
export const navigation = (appState: AppState): Navigation => ({
    name: 'Projects',
    decoration: {
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
    },
    tableOfContent: Views.tocView,
    html: ({ router }) =>
        new PageView({
            router,
            appState,
        }),
    '...': appState.projectsState.projects$.pipe(
        map((projects) => {
            return ({ path }: { path: string; router: Router }) => {
                return lazyResolver(path, projects, appState)
            }
        }),
    ),
})

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

function lazyResolver(
    path: string,
    projects: Routers.Projects.Project[],
    appState: AppState,
) {
    const parts = path.split('/').filter((d) => d != '')
    if (parts.length === 0) {
        return {
            tableOfContent: Views.tocView,
            children: projects
                .map((project) => ({
                    ...project,
                    name: skipNamespace(project.name),
                }))
                .sort((a, b) => a['name'].localeCompare(b['name']))
                .map((p) => {
                    return {
                        name: p.name,
                        id: p.id,
                        decoration: {
                            icon: icon(p),
                        },
                    }
                }),
            html: undefined,
        }
    }
    const project = projects.find((p) => p.id === parts.slice(-1)[0])
    return {
        tableOfContent: Views.tocView,
        children: [],
        html: ({ router }) =>
            new ProjectView({
                router,
                project,
                appState,
            }),
    }
}
