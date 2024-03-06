import { AnyVirtualDOM, ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Routers } from '@youwol/local-youwol-client'
import { parseMd, Router } from '@youwol/mkdocs-ts'
import { DagFlowView } from './dag-flow.view'
import { State } from './state'
import { filterCtxMessage, raiseHTTPErrors } from '@youwol/http-primitives'
import { FilesBrowserView, HdPathBookView, InfoSectionView } from '../common'
import { ExpandableGroupView } from '../common/expandable-group.view'
import { NewProjectFromTemplateView } from './new-project.view'
import { debounceTime, merge, mergeMap, of } from 'rxjs'
import { AppState } from '../app-state'
import { SelectedStepView } from './project/selected-step.view'
import { CdnLinkView, ExplorerLinkView } from '../common/links.view'
import { parse } from 'marked'
import {
    FailureDirectoryNotFound,
    FailureImportException,
    FailurePipelineNotFound,
} from '@youwol/local-youwol-client/src/lib/routers/projects/interfaces'

export class ProjectView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({
        router,
        project,
        appState,
    }: {
        router: Router
        project: Routers.Projects.Project
        appState: AppState
    }) {
        const projectsState = appState.projectsState
        projectsState.openProject(project)
        this.children = [
            parseMd({
                src: `
# ${project.name}

**Version**: ${project.version}

<info>
A project is a folder on your computer featuring a \`yw_pipeline.py\` file.

</info>


*  The project is located in your computer at:
<projectFolder></projectFolder>

*  <cdnLink></cdnLink>

*  <explorerLink></explorerLink>

## Flow

<flow></flow>

<selectedStep></selectedStep>

## Artifacts

<info>
Artifacts are a set of files and folders generated by the steps in the pipeline. 
Artifacts can also reference links (e.g. coverage, bundle analysis).
Publishing a components means to publish all or a part of those artifacts.

</info>

<artifacts></artifacts>
`,
                router,
                views: {
                    info: (elem: HTMLElement) =>
                        new InfoSectionView({
                            text: elem.innerHTML,
                            router,
                        }),
                    projectFolder: () => {
                        return new HdPathBookView({
                            path: project.path,
                            appState,
                        })
                    },
                    cdnLink: () => {
                        return {
                            tag: 'div',
                            children: [
                                {
                                    source$: appState.cdnState.status$,
                                    vdomMap: () =>
                                        new CdnLinkView({
                                            name: project.name,
                                            router,
                                        }),
                                },
                            ],
                        }
                    },
                    explorerLink: () => {
                        return new ExplorerLinkView({
                            name: project.name,
                            router,
                        })
                    },
                    flow: () =>
                        new FlowView({
                            flowId: 'prod',
                            projectsState,
                            project,
                        }),
                    selectedStep: () =>
                        new SelectedStepView({
                            flowId: 'prod',
                            projectsState,
                            project,
                        }),
                    artifacts: () =>
                        new ArtifactsView({
                            flowId: 'prod',
                            router,
                            projectsState,
                            project,
                        }),
                },
            }),
        ]
    }
}

export class FlowView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({
        flowId,
        projectsState,
        project,
    }: {
        flowId: string
        projectsState: State
        project: Routers.Projects.Project
    }) {
        this.children = [
            {
                tag: 'div',
                children: [new DagFlowView({ project, projectsState, flowId })],
            },
        ]
    }
}

export class ArtifactsView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({
        projectsState,
        router,
        project,
    }: {
        projectsState: State
        router: Router
        project: Routers.Projects.Project
        flowId: string
    }) {
        const event$ = projectsState.projectEvents[project.id].messages$.pipe(
            filterCtxMessage({
                withLabels: ['PipelineStepStatusResponse'],
                withAttributes: { projectId: project.id },
            }),
            debounceTime(1000),
        )
        this.children = {
            policy: 'replace',
            source$: merge(of(undefined), event$).pipe(
                mergeMap(() =>
                    projectsState.projectsClient.getArtifacts$({
                        projectId: project.id,
                        flowId: 'prod',
                    }),
                ),
                raiseHTTPErrors(),
            ),
            vdomMap: ({
                artifacts,
            }: {
                artifacts: Routers.Projects.GetArtifactResponse[]
            }) => {
                return artifacts.map((artifact) => {
                    return new ArtifactView({ artifact, router })
                })
            },
        }
    }
}
export class ArtifactView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({
        artifact,
        router,
    }: {
        artifact: Routers.Projects.Artifact
        router: Router
    }) {
        this.children = [
            new ExpandableGroupView({
                title: artifact.id,
                icon: 'fas fa-box',
                content: () => {
                    return parseMd({
                        src: `
Links:
${artifact.links.map((l) => `*  <a href="${l.url}" target="_blank">${l.name}</a>\n`)}

**Files included**:

<filesBrowser></filesBrowser>                        
                        `,
                        router,
                        views: {
                            filesBrowser: () =>
                                new FilesBrowserView({
                                    startingFolder: artifact.path,
                                    originFolderIndex:
                                        artifact.path.split('/').length - 1,
                                }),
                        },
                    })
                },
            }),
        ]
    }
}

export class NewProjectsCard implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ projectsState }: { projectsState: State }) {
        this.children = [
            {
                tag: 'div',
                class: 'pl-4 flex-grow-1 overflow-auto',
                children: {
                    policy: 'replace',
                    source$: projectsState.appState.environment$,
                    vdomMap: (
                        environment: Routers.Environment.EnvironmentStatusResponse,
                    ) => {
                        return environment.configuration.projects.templates.map(
                            (projectTemplate) =>
                                new ExpandableGroupView({
                                    title: projectTemplate.type,
                                    icon: projectTemplate.icon as AnyVirtualDOM,
                                    content: () =>
                                        new NewProjectFromTemplateView({
                                            projectsState,
                                            projectTemplate,
                                        }),
                                }),
                        )
                    },
                },
            },
        ]
    }
}

type Failures =
    | FailurePipelineNotFound[]
    | FailureDirectoryNotFound[]
    | FailureImportException[]

export class FailuresView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({ appState }: { appState: AppState; router: Router }) {
        this.children = {
            policy: 'replace',
            source$: appState.projectsState.projectsFailures$,
            vdomMap: (
                failures: Routers.Projects.ProjectsLoadingResults['failures'],
            ) => [
                new FailuresCategoryView({
                    appState: appState,
                    failures: failures.importExceptions,
                    title: 'Import Failures',
                }),
                new FailuresCategoryView({
                    appState: appState,
                    failures: failures.directoriesNotFound,
                    title: 'Directory Not Found Failures',
                }),
                new FailuresCategoryView({
                    appState: appState,
                    failures: failures.pipelinesNotFound,
                    title: 'Pipeline Not Found Failures',
                }),
            ],
        }
    }
}

class FailuresCategoryView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({
        appState,
        failures,
        title,
    }: {
        appState: AppState
        failures: Failures
        title: string
    }) {
        this.children = [
            failures.length !== 0
                ? {
                      tag: 'div',
                      innerHTML: parse(`### ${title}`),
                      children: failures.map((failure) => ({
                          tag: 'div' as const,
                          class: 'my-4',
                          children: [
                              new ExpandableGroupView({
                                  title: {
                                      tag: 'div',
                                      style: {
                                          maxWidth: '75%',
                                      },
                                      children: [
                                          new HdPathBookView({
                                              path: failure.path,
                                              appState,
                                          }),
                                      ],
                                  },
                                  icon: 'fas fa-times fv-text-error',
                                  content: () => {
                                      return {
                                          tag: 'pre',
                                          children: [
                                              {
                                                  tag: 'div',
                                                  class: 'pt-2 px-2 text-start overflow-auto fv-text-error ',
                                                  style: {
                                                      whiteSpace: 'pre-wrap',
                                                  },
                                                  innerText:
                                                      failure['traceback'] ??
                                                      failure.message,
                                              },
                                          ],
                                      }
                                  },
                              }),
                          ],
                      })),
                  }
                : undefined,
        ]
    }
}
