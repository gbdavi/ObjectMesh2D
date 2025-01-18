
const canvasWidth = 900;
const canvasHeight = 600;
const mainCanvas = new Canvas2D("mainCanvas", canvasWidth, canvasHeight);
const engine = new Engine({framerate: 60}, mainCanvas, new PhysicsController());
const audioManager = new AudioManager();
audioManager.provideAudio("Soft Wind", "./assets/audio/Soft Wind.mp3");

const ambientSound = audioManager.createInstance("Soft Wind", {volume: .5});

const borderSize = 4;
const defaultMeasure = new Measure(1);

mainCanvas.backLayer.push(new Rectangle(defaultMeasure, 0, 0, 0, 0, canvasWidth, canvasHeight, "#ccc"));
mainCanvas.backLayer.push(new Rectangle(defaultMeasure, 0, 0, borderSize, borderSize, canvasWidth-borderSize*2, canvasHeight-borderSize*2, "#88ddff"));

const slotSize = new Measure(Math.round( (canvasHeight-borderSize*2)/9 ));
const inventoryContainer = new ComplexObject(slotSize, 0, 8, borderSize, -borderSize, canvasWidth-borderSize*2, slotSize);
inventoryContainer.alignX = "center";
const slotsContainer = (() => {
    const slotsCount = 10;
    const slotsContainerWidth = new Measure((_, newValue) => newValue*slotsCount, slotSize);
    const slotsContainer = new ComplexObject(slotSize, 0, 0, 0, 0, slotsContainerWidth, slotSize);    
    const innerSlotSize = new Measure((_, newValue) => newValue*.8, slotSize);
    for (let slotIndex = 0; slotIndex < slotsCount; slotIndex++) {
        const slot = new ComplexObject(slotSize, slotIndex, 0, 0, 0, slotSize, slotSize);
        slot.bgColor = "#242424";
        slot.fill = true;
        slot.alignX = "center";
        slot.alignY = "center";
    
        const innerSlot = new Interactive(defaultMeasure, 0, 0, 0, 0, innerSlotSize, innerSlotSize, 
            [new Rectangle(defaultMeasure, 0, 0, 0, 0, innerSlotSize, innerSlotSize, "#777777")]
        );
        innerSlot.onClick = () => { 
            console.log(`Slot ${slotIndex} clicked!`);
            audioManager.playInstance(ambientSound);
        };
        innerSlot.onMouseDown = () => {
            console.log(`Slot ${slotIndex} mouse down!`);
            innerSlot.shapes[0].bgColor = "#407070";
        };
        innerSlot.onMouseUp = () => {
            console.log(`Slot ${slotIndex} mouse up!`);
            innerSlot.shapes[0].bgColor = "#999999";
        };
        innerSlot.onMouseEnter = () => { 
            console.log(`Slot ${slotIndex} mouse enter!`);
            innerSlot.shapes[0].bgColor = "#999999";
        };
        innerSlot.onMouseLeave = () => { 
            console.log(`Slot ${slotIndex} mouse leave!`);
            innerSlot.shapes[0].bgColor = "#777777";
        };
        slot.addShapes([innerSlot]);
        
        slotsContainer.addShapes([slot]);
    }
    return slotsContainer;
})();
inventoryContainer.addShapes([slotsContainer]);
mainCanvas.frontLayer.push(inventoryContainer);

const draggable = (() => {
    const draggable = new Interactive(new Measure(25), 5, 5, 10, 10, 100, 100, [
        new Rectangle(new Measure(25), 0, 0, 0, 0, 100, 100, "blue", [5, 5, 5, 5])
    ]);
    
    let lastDrag;
    let lastMouseDown;
    draggable.onMouseDown = (event) => {
        lastMouseDown = event;
        lastDrag = undefined;
        draggable.shapes[0].bgColor = "green";
    };
    document.addEventListener("mouseup", (event) => {
        draggable.shapes[0].bgColor = "blue";
    })
    draggable.onDrag = (event) => {
        if (lastDrag) {
            draggable.move(0, 0, event.clientX - lastDrag.clientX, event.clientY - lastDrag.clientY);
        } else {
            draggable.move(0, 0, event.clientX - lastMouseDown.clientX, event.clientY - lastMouseDown.clientY);
        }
        lastDrag = event;
    }
    return draggable;
})();
const draggablePhysicsActor = new PhysicsActor(draggable, engine.physicsController);
draggablePhysicsActor.accelerationXAgents.push(300);
draggablePhysicsActor.terminalVelocity = 300;
mainCanvas.mainLayer.push(draggable);

const barrier = new Rectangle(new Measure(25), 15, 5, 10, 10, 100, 100, "#781717", [5, 5, 5, 5]);
const barrierPhysicsActor = new PhysicsActor(barrier, engine.physicsController);
mainCanvas.mainLayer.push(barrier);

mainCanvas.updateInteractiveElements();
setTimeout(() => engine.start(), 200);    
