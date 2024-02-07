import { AppState } from '../app-state'

/**
 * @category State
 */
export class State {
    /**
     * @group States
     */
    public readonly appState: AppState

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
    }
}
