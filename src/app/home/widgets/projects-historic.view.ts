import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { colabClassPrefix, ComponentCrossLinksView } from '../../common'
import { Router } from '@youwol/mkdocs-ts'
import { Routers } from '@youwol/local-youwol-client'
import { AppState } from '../../app-state'
import { getProjectNav$ } from '../../common/utils-nav'
import { take } from 'rxjs/operators'

/**
 * Represents a view that displays the most recently edited projects.
 *
 * Each item in the historic is displayed using {@link ProjectHistoricItemView}.
 *
 * This component is designed to be embedded in a `Markdown` page,
 * refer to {@link ProjectsHistoricView.fromHTMLElement}.
 */
export class ProjectsHistoricView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    /**
     * CSS classes applied to the container.
     */
    public readonly class = `${colabClassPrefix}-ProjectsHistoricView d-flex flex-wrap`
    public readonly children: ChildrenLike

    public readonly appState: AppState

    public readonly count: number
    constructor(params: { count: number; appState: AppState }) {
        Object.assign(this, params)

        this.children = [
            {
                source$: this.appState.projectsState.historic$,
                vdomMap: (projects: Routers.Projects.Project[]) => {
                    return {
                        tag: 'div',
                        class: 'w-100',
                        children: projects.slice(0, this.count).map(
                            (project) =>
                                new ProjectHistoricItemView({
                                    project,
                                    appState: this.appState,
                                }),
                        ),
                    }
                },
            },
        ]
    }

    /**
     * Creates a `ProjectsHistoricView` instance from an HTML element, typically sourced from `Markdown`.
     *
     * The HTML element can feature specific attributes:
     *
     * - **count**: (Optional) Maximum number of items to display. Defaults to 10.
     *
     * **Example**
     *
     * <code-snippet language='html'>
     * <projectsHistoric count='5'></projectsHistoric>
     * </code-snippet>
     *
     *
     * @param elem The HTML element to parse and convert.
     * @param router The application's router.
     * @returns A new instance of `ProjectsHistoricView`.
     */
    static fromHTMLElement(
        elem: HTMLElement,
        router: Router,
    ): ProjectsHistoricView {
        return new ProjectsHistoricView({
            appState: router['appState'],
            count: elem.getAttribute('count')
                ? parseInt(elem.getAttribute('count'))
                : 10,
        })
    }
}

/**
 * Represents the view of an individual project in the projects historic.
 *
 * This view displays the project's name, links to navigate to the project, and relevant cross-links for enhanced
 * interactivity.
 */
export class ProjectHistoricItemView implements VirtualDOM<'div'> {
    public readonly tag: 'div'
    /**
     * CSS classes applied to the container.
     */
    public readonly class = `${colabClassPrefix}-ProjectHistoricItemView d-flex align-items-center w-100 border rounded p-1 my-1`
    public readonly children: ChildrenLike

    constructor({
        project,
        appState,
    }: {
        appState: AppState
        project: Routers.Projects.Project
    }) {
        this.children = [
            {
                source$: getProjectNav$({
                    projectName: project.name,
                    appState,
                }).pipe(take(1)),
                vdomMap: (nav: string | undefined) => {
                    return {
                        tag: 'a',
                        href: nav,
                        innerText: project.name,
                        onclick: (ev) => {
                            ev.preventDefault()
                            nav && appState.router.navigateTo({ path: nav })
                        },
                    }
                },
            },
            { tag: 'div', class: 'flex-grow-1' },
            new ComponentCrossLinksView({
                appState,
                component: project.name,
            }),
        ]
    }
}
