import { ChildrenLike, RxHTMLElement, VirtualDOM } from '@youwol/rx-vdom'
import { combineLatest, from, Observable } from 'rxjs'
import { install } from '@youwol/webpm-client'
import { mergeMap, shareReplay } from 'rxjs/operators'
import { PyYouwolClient } from '@youwol/local-youwol-client'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import { AppState } from '../../app-state'

function fetchCodeMirror$(): Observable<WindowOrWorkerGlobalScope> {
    return from(
        install({
            modules: ['codemirror'],
            scripts: ['codemirror#5.52.0~mode/python.min.js'],
            css: ['codemirror#5.52.0~codemirror.min.css'],
        }),
    ).pipe(shareReplay(1))
}

/**
 * @category View
 */
export class ConfigFileView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Configurations
     */
    public readonly codeMirrorConfiguration = {
        lineNumbers: true,
        lineWrapping: false,
        indentUnit: 4,
        readOnly: true,
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 h-100 p-2 overflow-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        fontSize: 'smaller',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: { appState: AppState }) {
        const { appState } = params

        const client = new PyYouwolClient().admin.environment

        const configFile$ = appState.environment$.pipe(
            mergeMap(() => client.getFileContent$().pipe(raiseHTTPErrors())),
        )
        this.children = [
            {
                source$: combineLatest([configFile$, fetchCodeMirror$()]),
                vdomMap: ([content, _]: [string, unknown]) => {
                    return {
                        tag: 'div',
                        class: 'h-100 w-100',
                        connectedCallback: (
                            htmlElement: RxHTMLElement<'div'>,
                        ) => {
                            const config = {
                                ...this.codeMirrorConfiguration,
                                value: content,
                            }
                            const editor = window['CodeMirror'](
                                htmlElement,
                                config,
                            )
                            editor.refresh()
                        },
                    }
                },
            },
        ]
    }
}
