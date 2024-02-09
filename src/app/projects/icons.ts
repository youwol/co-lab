import { Routers } from '@youwol/local-youwol-client'
import { NavIconSvg } from '../common'

export function icon(project: Routers.Projects.Project) {
    const filenames = {
        typescript: 'icon-TS.svg',
        python: 'icon-python.svg',
        javascript: 'icon-js.svg',
    }
    let filename = ''
    if (project.pipeline.tags.includes('typescript')) {
        filename = filenames.typescript
    }
    if (project.pipeline.tags.includes('python')) {
        filename = filenames.python
    }
    if (project.pipeline.tags.includes('javascript')) {
        filename = filenames.javascript
    }
    return new NavIconSvg({
        filename,
    })
}
