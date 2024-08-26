require('./style.css')
export {}
import * as webpmClient from '@youwol/webpm-client'

import { setup } from '../auto-generated'

const mkdocsVersion = setup.runTimeDependencies.externals['@youwol/mkdocs-ts']

await setup.installMainModule({
    cdnClient: webpmClient,
    installParameters: {
        css: [
            'bootstrap#5.3.3~bootstrap.min.css',
            'bootstrap#5.3.3~bootstrap-utilities.min.css',
            'fontawesome#5.12.1~css/all.min.css',
            '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
            `@youwol/mkdocs-ts#${mkdocsVersion}~assets/mkdocs-light.css`,
        ],
        displayLoadingScreen: true,
    },
})

await import('./on-load')
