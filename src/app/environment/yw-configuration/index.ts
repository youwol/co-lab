import { AppState } from '../../app-state'
import { CodeEditorView } from '../../common/code-editor.view'
import { Navigation, parseMd, Router, Views } from '@youwol/mkdocs-ts'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { HdPathBookView } from '../../common'
import { PyYwReferencesView } from '../../common/py-yw-references.view'
import { map, mergeMap } from 'rxjs/operators'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { PyYouwolClient } from '@youwol/local-youwol-client'

export const navigation = (appState: AppState): Navigation => ({
    html: ({ router }) => new PageView({ appState, router }),
    decoration: { icon: { tag: 'i', class: 'fas fa-wrench mr-2' } },
    name: 'Server config.',
    tableOfContent: Views.tocView,
})

class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor(params: { router: Router; appState: AppState }) {
        const { appState } = params
        this.children = [
            parseMd({
                src: `
# Configuration

The server configuration is located at:
<configPath></configPath>


Below is displayed the current configuration of the local YouWol server:
 
<fileView></fileView>

<refDoc></refDoc>
                `,
                router: params.router,
                views: {
                    configPath: () => {
                        return new HdPathBookView({
                            path: appState.environment$.pipe(
                                map(
                                    (env) => env.configuration.pathsBook.config,
                                ),
                            ),
                            appState,
                        })
                    },
                    fileView: () =>
                        new CodeEditorView({
                            language: 'python',
                            content: appState.environment$.pipe(
                                mergeMap(() =>
                                    new PyYouwolClient().admin.environment
                                        .getFileContent$()
                                        .pipe(raiseHTTPErrors()),
                                ),
                            ),
                        }),
                    refDoc: () => {
                        return new PyYwReferencesView({
                            router: params.router,
                            items: [
                                {
                                    title: 'Configuration API',
                                    path: '/references/youwol/app/environment/models.models_config.Configuration',
                                    description:
                                        'The API of the configuration object.',
                                },
                            ],
                        })
                    },
                },
            }),
        ]
    }
}
