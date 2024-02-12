import { AppState } from '../../app-state'

export const navigation = (_appState: AppState) => ({
    name: 'Backends',
    icon: {
        tag: 'div',
        class: 'fas fa-server mx-2',
    },
})
