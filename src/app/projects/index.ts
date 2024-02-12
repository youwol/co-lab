import { FailuresView, NewProjectsCard, ProjectView } from './project.view'
import { AppState } from '../app-state'
import { parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { lastValueFrom } from 'rxjs'
import * as pyYw from '@youwol/local-youwol-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { SearchView } from './search.view'
import { InfoSectionView } from '../common'
import { pyYwDocLink } from '../common/py-yw-references.view'
import { Routers } from '@youwol/local-youwol-client'
import { icon } from './icons'

export * from './state'

const projects = await lastValueFrom(
    new pyYw.PyYouwolClient().admin.projects.status$().pipe(raiseHTTPErrors()),
)

const skipNamespace = (name: string) => {
    return name.split('/').slice(-1)[0]
}

export const navigation = (appState: AppState) => ({
    name: 'Projects',
    icon: { tag: 'i', class: 'fas  fa-boxes mr-2' },
    tableOfContent: Views.tocView,
    html: ({ router }) =>
        new PageView({
            router,
            appState,
        }),
    ...projects.results['toSorted']((a, b) =>
        skipNamespace(a.name).localeCompare(skipNamespace(b.name)),
    ).reduce((acc, project) => {
        return {
            ...acc,
            ['/' + project.id]: {
                name: skipNamespace(project.name),
                tableOfContent: Views.tocView,
                icon: icon(project),
                html: ({ router }) =>
                    new ProjectView({
                        router,
                        project,
                        appState,
                    }),
            },
        }
    }, {}),
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
