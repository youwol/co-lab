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
import { State } from './state'
import { Routers } from '@youwol/local-youwol-client'

export * from './state'

const projects = await lastValueFrom(
    new pyYw.PyYouwolClient().admin.projects.status$().pipe(raiseHTTPErrors()),
)

export const navigation = (appState: AppState) => ({
    name: 'Projects',
    withIcon: { tag: 'i', class: 'fas  fa-boxes mr-2' },
    tableOfContent: Views.tocView,
    html: ({ router }) =>
        new PageView({
            router,
            projectsState: appState.projectsState,
        }),
    ...projects.results.reduce((acc, e) => {
        return {
            ...acc,
            ['/' + e.id]: {
                name: e.name,
                tableOfContent: Views.tocView,
                withIcon: {
                    tag: 'div',
                    class: 'fas fa-wrench mx-2',
                },
                html: ({ router }) =>
                    new ProjectView({
                        router,
                        project: e,
                        projectsState: appState.projectsState,
                    }),
            },
        }
    }, {}),
})

export class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({
        router,
        projectsState,
    }: {
        router: Router
        projectsState: State
    }) {
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

<projectsListView></projectsListView>

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
                    searchView: () => new SearchView({ projectsState }),
                    projectsListView: () => ({
                        tag: 'ul',
                        children: {
                            policy: 'replace',
                            source$: projectsState.projects$,
                            vdomMap: (projects: Routers.Projects.Project[]) =>
                                projects.map((p) =>
                                    parseMd({
                                        src: `*  [${p.name}](@nav/workspace/${p.id}): Description of the project`,
                                        router,
                                    }),
                                ),
                        },
                    }),
                    failedListView: () => new FailuresView({ projectsState }),
                },
            }),
        ]
    }
}
