import { AppState } from '../../app-state'
import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { Navigation, parseMd, Router } from '@youwol/mkdocs-ts'
import { lazyResolver } from '../index'
import { debounceTime } from 'rxjs'
import { map } from 'rxjs/operators'
import { example1 } from './examples'
import { InfoSectionView } from '../../common'

export const navigation = (appState: AppState): Navigation => ({
    name: 'Backends',
    decoration: {
        icon: {
            tag: 'div',
            class: 'fas fa-server mr-2',
        },
    },
    html: ({ router }) => new PageView({ router, appState }),
    '...': appState.cdnState.status$
        .pipe(debounceTime(500))
        .pipe(map((status) => lazyResolver(status, appState, 'backend'))),
})

class PageView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly children: ChildrenLike
    constructor({ router }: { router: Router; appState: AppState }) {
        this.children = [
            parseMd({
                src: `
# Backends

This section gathers the backends components available in your local database. 
<info>
Backends are components installed on your PC that can perform computations in response to HTTP requests.
They are capable of returning responses, including results that can be consumed by web browsers. 
While most actions trigger a single response, it's also possible to generate a continuous stream of results.
For instance, a long-running computation might continuously send convergence results as they are computed.

You have access to utilize any backends within the YouWol ecosystem, provided you have the necessary permissions. 
If these backends are not currently available in your local environment, they will be automatically downloaded and 
installed before they can be utilized.

**Examples**:

Since the majority of custom backends provide a \`/docs\` endpoint (though it's not mandatory, it's highly recommended), 
you can easily access the API documentation for any backends within the YouWol ecosystem that you have permission to 
access. Simply open a URL in the format \`/backends/$NAME/$VERSION/docs\`.
For example, you can view the documentation for a backend named \`demo_yw_backend\` at version \`0.1.0\` by clicking 
on this <a target="_blank" href="/backends/demo_yw_backend/0.1.0/docs">link</a>.

When consuming a backend from JavaScript, a default client is provided to streamline the process of accessing its API.
You can explore an interactive example showcasing the installation and usage of custom backends from JavaScript by 
following this 
<a href="/applications/@youwol/js-playground/latest?content=${encodeURIComponent(example1)}" target="_blank">link</a>.
</info>


`,
                router: router,
                views: {
                    info: (elem: HTMLElement) => {
                        return new InfoSectionView({
                            text: elem.innerHTML,
                            router,
                        })
                    },
                },
            }),
        ]
    }
}
