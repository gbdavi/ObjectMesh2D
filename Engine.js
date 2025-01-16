
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
     * @param {Canvas2D} canvas
     * @param {PhysicsController} physicsController
     */
    constructor(config, canvas, physicsController) {
        /** @type {Canvas2D} */
        this._canvas = canvas;

        /** @type {PhysicsController} */
        this.physicsController = physicsController;

        this._routines.createRoutine("frameUpdate", () => { this._canvas.refresh() }, 1000/(config?.framerate ?? 30), 10000, config?.framerate !== 0);
        this._config.createState("framerate", (_, newValue) => {
            this._routines.setRoutineInterval("frameUpdate", 1000/newValue);
            this._routines.setRoutineState("frameUpdate", newValue !== 0);
        }, config?.framerate ?? 30);

    }

    /**
     * Set config value.
     * @param {string} config
     * @param {*} value
     */
    setConfig(config, value) {
        return this._config.setState(config, value);
    }

    /**
     * Start engine operation.
     */
    start() {
        this._routines.startRoutines();
        this.physicsController.start();
    }
    
    /**
     * Stop engine operation.
    */
   stop() {
        this.physicsController.stop();
        this._routines.stopRoutines();
    }
}

class AudioManager {
    audioLibrary = {};
    /** @type {{[id: number]: {id: number, audioElement: HTMLAudioElement}}} */
    _audioInstances = {};
    _idGenerator = (function* () { for (let id = 1; true; id++) yield id })();
    
    /**
     * Provide audio to library.
     * @param {string} name Audio name in library.
     * @param {string} src Media address or URL.
     */
    provideAudio(name, src) {
        if (name && src) {
            this.audioLibrary[name] = src;
        }
    }

    /**
     * Create audio instance.
     * @param {string} audioName 
     * @param {keyof HTMLAudioElement} attributes
     */
    createInstance(audioName, attributes) {
        if (!this.audioLibrary[audioName])
            return false;

        const id = this._idGenerator.next().value;
        const audioElement = document.createElement("audio");
        audioElement.src = this.audioLibrary[audioName];
        audioElement.preload = "auto";
        this._audioInstances[id] = {
            id,
            audioElement
        };
        this.setInstanceAttributes(id, attributes);
        return id;
    }

    /**
     * Delete audio instance.
     * @param {number} instanceId
     */
    deleteInstance(instanceId) {
        if (!this._audioInstances[instanceId])
            return false;

        this.stopInstance(instanceId);
        delete this._audioInstances[instanceId];
        return true;
    }

    /**
     * Set instance attributes value.
     * @param {number} instanceId 
     * @param {keyof HTMLAudioElement} attributes
     */
    setInstanceAttributes(instanceId, attributes) {
        if (!this._audioInstances[instanceId])
            return false;

        const { audioElement } = this._audioInstances[instanceId];
        for (const attribute in attributes) {
            audioElement[attribute] = attributes[attribute];
        }
        return true;
    }

    /**
     * @param {number} instanceId
     */
    playInstance(instanceId) {
        return this._audioInstances[instanceId]?.audioElement.play();
    }
    
    /**
     * @param {number} instanceId
     */
    pauseInstance(instanceId) {
        this._audioInstances[instanceId]?.audioElement.pause();
    }

    /**
     * @param {number} instanceId
     */
    resetInstance(instanceId) {
        if (this._audioInstances[instanceId]) {
            this._audioInstances[instanceId].audioElement.currentTime = 0;
            return true;
        }
        return false;
    }

    /**
     * @param {number} instanceId
     */
    stopInstance(instanceId) {
        this.pauseInstance(instanceId);
        this.resetInstance(instanceId);
    }

    /**
     * Stop all instances.
     */
    stopAll() {
        for (const instanceId in this._audioInstances) {
            this.stopInstance(instanceId);
        }
    }
}

class PhysicsController {
    _routines = new RoutineManager();
    _config = new StateManager();
    _metadata = {};
	/** @type {PhysicsActor[]} */
	_actors = [];

    constructor(config) {
        const stepRate = config?.stepRate ?? 300;
        this._routines.createRoutine("stepForward", () => { 
            const timeStep = this._metadata.stepRate.interval
            for (const actor of this._actors) {
                actor.stepVelocity(timeStep);
            }

            const collidableActorsOrdered = this._actors
                .filter(actor => actor.flags.hasCollision)
                .map(actor => ({actor, score: Math.abs(actor.velocityX) + Math.abs(actor.velocityY)}))
                .sort(({score: scoreA}, {score: scoreB}) => scoreB - scoreA)
                .map(({actor}) => actor);

            for (const actor of this._actors) {
                const deltaPosX = actor.velocityX * timeStep;
                const deltaPosY = actor.velocityY * timeStep;
                
                const collisionElement = collidableActorsOrdered.find(comparedActor => actor !== comparedActor 
                    && PhysicsController.projectCollision(actor._targetElement, comparedActor._targetElement, deltaPosX, deltaPosY));

                if (collisionElement) {
                    actor.onInitCollision?.(collisionElement);
                    collisionElement.onCollisionTaken?.(actor);
                } else {
                    actor._targetElement.move(0, 0, deltaPosX, deltaPosY);
                }
            }
        }, 1000/stepRate, 10000, stepRate !== 0);

        this._metadata.stepRate = {interval: 1/stepRate};
        this._config.createState("stepRate", (_, newValue) => {
            this._metadata.stepRate.interval = 1/newValue;
            this._routines.setRoutineInterval("stepForward", 1000/newValue);
            this._routines.setRoutineState("stepForward", newValue !== 0);
        }, stepRate);
    }

    /**
     * 
     * @param {Shape | Entity} stepObject
     * @param {Shape | Entity} comparedObject
     * @param {number} deltaPosX
     * @param {number} deltaPosY
     */
    static projectCollision(stepObject, comparedObject, deltaPosX, deltaPosY) {
        
        let collisionShapesA = [];
        if (stepObject instanceof Shape)
            collisionShapesA.push(stepObject);
        if (stepObject instanceof Entity)
            collisionShapesA.push(...stepObject.collisionShapes);

        let collisionShapesB = [];
        if (comparedObject instanceof Shape)
            collisionShapesB.push(comparedObject);
        if (comparedObject instanceof Entity)
            collisionShapesB.push(...comparedObject.collisionShapes);

        if (collisionShapesA.length === 0 || collisionShapesB.length === 0)
            return false;

        if (collisionShapesB.length < collisionShapesA.length) {
            const temp = collisionShapesA;
            collisionShapesA = collisionShapesB;
            collisionShapesB = temp;
            deltaPosX = -deltaPosX;
            deltaPosY = -deltaPosY;
        }
        
        return collisionShapesA.some(shapeA => {
            const nextPosLeft = shapeA.x + deltaPosX;
            const nextPosTop = shapeA.y + deltaPosY;
            const nextPosRight = nextPosLeft + shapeA.width;
            const nextPosBottom = nextPosTop + shapeA.height;

            return collisionShapesB.some(shapeB => {
                return shapeB.isAt(nextPosLeft, nextPosTop)
                    || shapeB.isAt(nextPosRight, nextPosTop)
                    || shapeB.isAt(nextPosLeft, nextPosBottom)
                    || shapeB.isAt(nextPosRight, nextPosBottom);
            });
        });        
    }
	
	/**
	 * 
	 * @param {PhysicsActor} actor 
	 */
	addActor(actor) {
		if (!this._actors.includes(actor)) {
			this._actors.push(actor);
			return true;
		}
		return false;
	}

    /**
     * Set config value.
     * @param {string} config
     * @param {*} value
     */
    setConfig(config, value) {
        return this._config.setState(config, value);
    }

    /**
     * Start actors physics.
     */
    start() {
        this._routines.startRoutines();
    }
    
    /**
     * Stop actors physics.
     */
    stop() {
        this._routines.stopRoutines();
    }
}

class PhysicsActor {

    /** @type {Style} */
	_targetElement;
	_physicsController;

	/**
	 * 
	 * @param {Entity | Shape} targetElement
	 * @param {PhysicsController} physicsController
	 */
	constructor(targetElement, physicsController) {
		if (targetElement.physicsActor) {
			throw Error("The target element is already attached!");
		}

		this._targetElement = targetElement;
		targetElement.physicsActor = this;

		this._physicsController = physicsController;
		physicsController.addActor(this);
	}
	
	flags = {
		hasCollision: true
	};

    /**
     * @type {function (PhysicsActor) | undefined}
     */
    onInitCollision;
    
    /**
     * @type {function (PhysicsActor) | undefined}
     */
    onCollisionTaken;
	
	/**
	 * Acceleration X in pixels per second.
	 * @type {(number | Measure)[]}
	 */
	accelerationXAgents = [];
	/**
	 * Acceleration Y in pixels per second.
	 * @type {(number | Measure)[]}
	 */
	accelerationYAgents = [];
	/** Resultant acceleration X in pixels per second. */
	get accelerationX() {
        let total = 0; 
        for (const agent of this.accelerationXAgents) 
            total += agent; 
        return total;
    }
	/** Resultant acceleration Y in pixels per second. */
	get accelerationY() {
        let total = 0; 
        for (const agent of this.accelerationYAgents) 
            total += agent; 
        return total;
    }

	/**
	 * Velocity X in pixels per second.
	 * @type {number}
	 */
	velocityX = 0;
	/**
	 * Velocity Y in pixels per second.
	 * @type {number}
	 */
	velocityY = 0;
	
	/**
	 * Terminal velocity in pixels per second.
	 * @type {number}
	 */
	terminalVelocity = Number.POSITIVE_INFINITY;

	/**
	 * Step velocity by time in seconds.
	 * @param {number} timeStep 
	 */
	stepVelocity(timeStep) {
		const accelerationStepX = this.accelerationX * timeStep;
		if (Math.abs(this.velocityX + accelerationStepX) < this.terminalVelocity) {
			this.velocityX += accelerationStepX;
		} else {
			this.velocityX = accelerationStepX > 0 ? this.terminalVelocity : -this.terminalVelocity;
		}

		const accelerationStepY = this.accelerationY * timeStep;
		if (Math.abs(this.velocityY + accelerationStepY) < this.terminalVelocity) {
			this.velocityY += accelerationStepY;
		} else {
			this.velocityY = accelerationStepY > 0 ? this.terminalVelocity : -this.terminalVelocity;
		}
	}
}