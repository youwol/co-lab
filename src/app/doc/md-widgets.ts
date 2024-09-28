import { AnyVirtualDOM } from '@youwol/rx-vdom'

const inlineBlock = {
    style: {
        display: 'inline-block',
    },
}

export function apiLink(elem: HTMLElement): AnyVirtualDOM {
    const target = ApiLinksDict[elem.getAttribute('target')]
    const href = `@nav/doc/api/${target.path}`
    let text = elem.textContent
    if (text === '') {
        text = href.includes('.')
            ? href.split('.').slice(-1)[0]
            : href.split('/').slice(-1)[0]
    }

    return {
        tag: 'a',
        href,
        class: `mkapi-semantic-flag mkapi-role-${target.role}`,
        style: {
            width: 'fit-content',
            textDecoration: 'none',
        },
        children: [
            {
                tag: 'div',
                innerText: text,
                ...inlineBlock,
            },
            {
                tag: 'i',
                class: 'fas fa-code',
                style: {
                    transform: 'scale(0.6)',
                },
            },
        ],
    }
}

export function navNode(elem: HTMLElement): AnyVirtualDOM {
    const node = NodeLinksDict[elem.getAttribute('target')]
    return {
        tag: 'a',
        href: `@nav/${node.path}`,
        class: 'rounded bg-light px-1',
        children: [
            {
                tag: 'i',
                class: node.icon,
                style: {
                    transform: 'scale(0.8)',
                },
            },
            {
                tag: 'i',
                class: 'mx-1',
            },
            {
                tag: 'div',
                innerText: node.name,
                ...inlineBlock,
            },
        ],
    }
}

export function label(elem: HTMLElement): AnyVirtualDOM {
    return {
        tag: 'div',
        class: 'border px-1',
        ...inlineBlock,
        children: [
            {
                tag: 'i',
                class: elem.getAttribute('icon'),
                style: {
                    transform: 'scale(0.8)',
                },
            },
            {
                tag: 'i',
                class: 'mx-1',
            },
            {
                tag: 'div',
                innerText: elem.textContent,
                ...inlineBlock,
            },
        ],
    }
}

const ApiLinksDict = {
    ProjectsFinder: {
        path: 'youwol/app/environment/models.models_project.ProjectsFinder',
        role: 'class',
    },
    Projects: {
        path: 'youwol/app/environment/models.models_project.Projects',
        role: 'class',
    },
    ProjectsTemplate: {
        path: 'youwol/app/environment/models.models_project.ProjectsTemplate',
        role: 'class',
    },
    pipeline_raw_app: {
        path: 'youwol/pipelines/pipeline_raw_app',
        role: 'module',
    },
    'pipeline_raw_app.template': {
        path: 'youwol/pipelines/pipeline_raw_app.template.template',
        role: 'function',
    },
}

const NodeLinksDict = {
    Projects: {
        path: 'projects',
        name: 'Projects',
        icon: 'fas fa-boxes',
    },
    Backends: {
        path: 'environment/backends',
        name: 'Backends',
        icon: 'fas fa-server',
    },
}
