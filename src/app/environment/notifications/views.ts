import { AnyVirtualDOM } from '@youwol/rx-vdom'

export const installIcon: (statusIcon: AnyVirtualDOM) => AnyVirtualDOM = (
    status: AnyVirtualDOM,
) => ({
    tag: 'div',
    class: 'd-flex align-items-center text-light bg-dark rounded px-1',
    children: [
        {
            tag: 'i',
            class: 'fas fa-plug mr-1',
        },
        {
            tag: 'div',
            style: { fontFamily: 'monospace' },
            innerText: 'Install',
        },
        { tag: 'i', class: 'mx-1' },
        status,
    ],
})
