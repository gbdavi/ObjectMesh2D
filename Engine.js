

class StateManager {
    /** @private */
    _states = {};

    /** Create state. 
     * @param {string} state State name.
     * @param {Function} setStateEvent Event function (oldValue, newValue) when state value is setted5.
     * @param {*} initialValue Initial value.
    */
    createState(state, setStateEvent, initialValue) {
        if (this._states[state])
            return false;

        this._states[state] = {
            setStateEvent,
            value: initialValue ?? undefined
        }
    }
    
    /** Get state value. 
     * @param {string} state State name.
    */
    getState(state) {
        if (!this._states[state])
            return null;
        return this._states[state].value;
    }

    /** Set state value 
     * @param {string} state State name.
     * @param {*} value New value.
    */
    setState(state, value) {
        if (!this._states[state] || value === null)
            return null;

        const oldValue = this._states[state].value;
        if (oldValue !== value) {
            this._states[state].value = value;
            this._states[state].setStateEvent(oldValue, value);
        }
        return oldValue;
    }
}
