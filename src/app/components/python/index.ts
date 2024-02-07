import { AppState } from '../../app-state'

export const navigation = (_appState: AppState) => ({
    name: 'Python',
    withIcon: {
        tag: 'div',
        class: 'fas fa-code mx-2',
    },
})
