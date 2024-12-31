
/** Manage state events. */
class StateManager {
    /** @private */
    _states = {};

    /** Create state. 
     * @param {string} state State name.
     * @param {Function} setStateEvent Event function (oldValue, newValue) when state value is setted.
     * @param {*} initialValue Initial value.
    */
    createState(state, setStateEvent, initialValue) {
        if (this._states[state])
            return false;

        this._states[state] = {
            setStateEvent,
            value: initialValue ?? undefined
        }
        return true;
    }
    
    /** Get state value. 
     * @param {string} state State name.
    */
    getState(state) {
        if (!this._states[state])
            return null;
        return this._states[state].value;
    }

    /** Set state value.
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

/** Manage routine executions. */
class RoutineManager {
    /** @private */
    _routines = {};
    /** @private */
    _intervalExecutions = {};

    /**
     * Create new routine. 
     * @param {string} name 
     * @param {Function} routineFunction
     * @param {number} interval
     * @param {number} executionOrder
     * @param {boolean} isEnabled
     */
    createRoutine(name, routineFunction, interval, executionOrder, isEnabled) {
        if (this._routines[name])
            return false;

        const routine = {
            routineFunction,
            interval,
            executionOrder: executionOrder ?? 1,
            isEnabled: isEnabled ?? true
        }
        this._routines[name] = routine;
        if (!this._intervalExecutions[interval])
            this._intervalExecutions[interval] = {interval, routines: []};
        this._intervalExecutions[interval].routines.push(routine);
        this._intervalExecutions[interval].routines.sort((a, b) => a.executionOrder - b.executionOrder);
        return true;
    }

    /**
     * Enable/disable routine.
     * @param {boolean} state 
     */
    setRoutineState(routine, state) {
        if (!this._routines[routine])
            return false;

        this._routines[routine].isEnabled = state;
        return true;
    }

    /** Start all routines. */
    startRoutines() {
        for (const execution of Object.values(this._intervalExecutions)) {
            if (execution.id)
                continue;

            execution.id = setInterval(() => {
                for (const routine of execution.routines) {
                    if (routine.isEnabled) {
                        routine.routineFunction();
                    }
                }
            }, execution.interval);
        }
    }

    /** Stop all routines. */
    stopRoutines() {
        for (const execution of Object.values(this._intervalExecutions)) {
            if (execution.id) {
                clearInterval(execution.id);
                execution.id = undefined;
            }
        }
    }

}
