import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { parseMd, Router } from '@youwol/mkdocs-ts'
import { HdPathBookView, InfoSectionView } from '../common'
import { AppState } from '../app-state'
import { FailuresView } from './project.view'
import { Routers } from '@youwol/local-youwol-client'

export class ProjectsFinderView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike

    constructor({
        router,
        appState,
        finder,
    }: {
        router: Router
        appState: AppState
        finder: Routers.Environment.ProjectFinders
    }) {
        const ignored = finder.lookUpIgnore
            .filter((pattern) => !pattern.includes('/.'))
            .map((pattern) => `\n    *  ${pattern}`)
            .reduce(
                (acc, e) => acc + e,
                "\n    *  **Any folder's name starting with '.'**",
            )
        this.children = [
            parseMd({
                src: `
# Projects finder **${finder.name}**



<info>
A project finder scans a specified directory on your computer, searching recursively for projects. 
It operates up to a defined maximum depth in the directory structure. Optionally, it can continuously monitor the
 directory for any newly added or removed projects.
 
 More inforation can be found 
 <a target="_blank" href="/doc?nav=/references/youwol/app/environment/models.models_project.Projects">here</a>.
 
</info>


*  Root folder: <folder></folder>

*  Lookup depth: ${finder.lookUpDepth}

*  Continuously watched: ${finder.watch}

*  Ignored folders (and associated children) in look-up: ${ignored}


## Failures

The following projects have failed to load:            

<failedListView></failedListView>

`,
                router,
                views: {
                    info: (elem: HTMLElement) =>
                        new InfoSectionView({
                            text: elem.innerHTML,
                            router,
                        }),
                    folder: () => {
                        return new HdPathBookView({
                            path: finder.fromPath,
                            appState,
                        })
                    },
                    failedListView: () =>
                        new FailuresView({
                            appState,
                            router,
                            prefix: finder.fromPath,
                        }),
                },
            }),
        ]
    }
}
