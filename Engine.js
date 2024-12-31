
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
     * @param {string} name Routine name.
     * @param {Function} routineFunction 
     * @param {number} interval
     * @param {number} executionOrder
     * @param {boolean} isEnabled
     */
    createRoutine(name, routineFunction, interval, executionOrder, isEnabled) {
        if (this._routines[name])
            return false;

        const routine = {
            name,
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
     * @param {string} name Routine name.
     * @param {boolean} state 
     */
    setRoutineState(name, state) {
        if (!this._routines[name])
            return false;

        this._routines[name].isEnabled = state;
        return true;
    }
    
    /**
     * Enable/disable routine.
     * @param {string} name Routine name.
     * @param {number} interval
     */
    setRoutineInterval(name, interval) {
        const routine = this._routines[name];
        if (!routine)
            return false;

        const oldExecutionGroup = this._intervalExecutions[routine.interval];
        const executionRoutineIndex = oldExecutionGroup.routines.findIndex(routine => routine.name === name);
        oldExecutionGroup.routines.splice(executionRoutineIndex, 1);

        const newExecutionGroup = this._intervalExecutions[interval];
        newExecutionGroup.routines.push(routine);
        newExecutionGroup.routines.sort((a, b) => a.executionOrder - b.executionOrder);

        routine.interval = interval;

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

/** Core engine. */
class Engine {
    _routines = new RoutineManager();
    _config = new StateManager();
    _metadata = {};
    /**
     * 
     * @param {Canvas2D} canvas
     */
    constructor(canvas, config) {
        /** @type {Canvas2D} */
        this._canvas = canvas;

        this._routines.createRoutine("frameUpdate", () => { this._canvas.refresh() }, 1000/(config?.framerate ?? 30), 10000, config?.framerate !== 0);
        this._config.createState("framerate", (_, newValue) => {
            this._routines.setRoutineInterval("frameUpdate", 1000/newValue);
            this._routines.setRoutineState("frameUpdate", newValue !== 0);
            console.log(`Framerate changed from ${_} to ${newValue}`)
        }, config?.framerate ?? 30);

        this._routines.startRoutines();
    }

    /**
     * Set config value.
     * @param {string} config
     * @param {*} value
     */
    setConfig(config, value) {
        return this._config.setState(config, value);
    }
}