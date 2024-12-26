
/** Helper class to manipulate the HTMLCanvasElement. */
class Canvas2D {
	/**
	 * @param {string} canvasElementId 
	 * @param {number} width 
	 * @param {number} height 
	 */
	constructor(canvasElementId, width, height) {		
		this.canvas = document.getElementById(canvasElementId);
		this.canvas.width = width;
		this.canvas.height = height;
		/** @type {CanvasRenderingContext2D} */
		this.context = this.canvas.getContext("2d");

		/** Background elements */
		this.backLayer = [];
		this._backLayerInteractive = [];
		
		/** Foreground elements */
		this.mainLayer = [];
		this._mainLayerInteractive = [];
		
		/** Overlay elements */
		this.frontLayer = [];
		this._frontLayerInteractive = [];

		const getTargetElement = (x, y) => {
			return this._frontLayerInteractive.findLast((element) => element?.isInside(x, y))
				?? this._mainLayerInteractive.findLast((element) => element?.isInside(x, y))
				?? this._backLayerInteractive.findLast((element) => element?.isInside(x, y));
		}

		const lastEventsTarget = {};
		["click", "mousedown", "mouseup", "mousemove"].map(eventName => 
			this.canvas.addEventListener(eventName, (event) => {
				Canvas2D.onEvent(event, getTargetElement(event.offsetX, event.offsetY), lastEventsTarget);
			})
		);
	}

	get x() { return this.canvas.style.left }
	get y() { return this.canvas.style.top }
	get width() { return this.canvas.width }
	get height() { return this.canvas.height }

	set x(position) { this.canvas.style.left = position }
	set y(position) { this.canvas.style.top = position }
	set width(size) { this.canvas.width = size }
	set height(size) { this.canvas.height = size }

	/** Rewrite each element from Canvas2D layers. */
	refresh() {
		this.clear();
		for (const element of this.backLayer) {
			element.create(this.context);
		}
		for (const element of this.mainLayer) {
			element.create(this.context);
		}
		for (const element of this.frontLayer) {
			element.create(this.context);
		}
	}

	/** Clear all pixels from Canvas. */
	clear() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	/** 
	 * Returns a blank context. 
	 * @returns {CanvasRenderingContext2D}
	 */
	static getNewStandardContext() {
		return document.createElement("Canvas").getContext("2d");
	}

	/** 
	 * Target element event handler. 
	 * @param {Event} event
	 * @param {Interactive} targetElement
	 */
	static onEvent(event, targetElement, lastEventsTarget) {
		switch(event.type) {
			case "click": {
				if (!(targetElement instanceof Interactive))
					return;

				if (targetElement === lastEventsTarget.mouseDown)
					targetElement?.onClick();
				break;			
			}
			case "mousedown": {
				if (!(targetElement instanceof Interactive))
					return;
				
				lastEventsTarget.mouseDown = targetElement;
				targetElement?.onMouseDown();
				break;			
			}
			case "mouseup": {
				if (!(targetElement instanceof Interactive))
					return;
				
				targetElement?.onMouseUp();
				break;			
			}
			case "mousemove": {
				if (lastEventsTarget.mouseEnter !== targetElement) {
					lastEventsTarget.mouseEnter?.onMouseLeave();
					lastEventsTarget.mouseEnter = targetElement;
					targetElement?.onMouseEnter();
				}
				break;
			}
			default: {
				console.error({type: event.type}, "event not implemented!");
			}
		}
	}

	/** Update layers interactive elements. */
	updateInteractiveElements() {
		const flatElements = (element) => {
			if (element instanceof ComplexObject) {
				return [[element], ...element.shapes.map(flatElements)].flat();
			}
			return [element];
		}
		
		this._backLayerInteractive = [];
		for (const element of this.backLayer.map(flatElements).flat()) {
			if (element instanceof Interactive) {
				this._backLayerInteractive.push(element);
			}
		}
		
		this._mainLayerInteractive = [];
		for (const element of this.mainLayer.map(flatElements).flat()) {
			if (element instanceof Interactive) {
				this._mainLayerInteractive.push(element);
			}
		}

		this._frontLayerInteractive = [];
		for (const element of this.frontLayer.map(flatElements).flat()) {
			if (element instanceof Interactive) {
				this._frontLayerInteractive.push(element);
			}
		}
	}
}

/** Custom measure in pixels. */
class Measure {
	/**
	 * Create a base measure passing measureValue as a number or create a relative measure passing measureValue as a Function (oldValue, newValue) and baseMeasure as a Measure.
	 * @param {number | Function} measureValue 
	 * @param {Measure} baseMeasure 
	 */
	constructor(measureValue, baseMeasure) {
		this.measure = {  _onChangeFunctions: [], _dependentObjects: [] };

		if (typeof(measureValue) === "number") {
			this.value = measureValue;
		} else if (measureValue instanceof Function && baseMeasure instanceof Measure) {
			this.value = measureValue(baseMeasure, baseMeasure);
			baseMeasure.addOnChangeFunction((...params) => this.value = measureValue(...params));
		} else {
			this.value = 1;
		}
	}

	/** Add function to call when measure change it's value. */
	addOnChangeFunction(onChangeFunction) {
		if (onChangeFunction instanceof Function)
			this.measure._onChangeFunctions.push(onChangeFunction);
	}

	/** Add Shapes and Entities to update it's styles relative to the parent when measure change it's value. */
	addDependentObject(dependentObject) {
		if (dependentObject instanceof Shape || dependentObject instanceof Entity)
			if (!this.measure._dependentObjects.includes(dependentObject))
				this.measure._dependentObjects.push(dependentObject);
	}

	/** Get measure value in pixels. 
	 * @returns {number}
	*/
	valueOf() {
		return this.measure._value;	
	}
	
	/** Set measure value in pixels. 
	 * @param {number} value 
	*/
	set value(value) {
		if (typeof(value) === "number") {
			const oldValue = this.measure._value;
			this.measure._value = value;
			for (const func of this.measure._onChangeFunctions) 
				func(oldValue, value);
			const dependentObjectsParentElement = this.measure._dependentObjects.filter(object => object.parentElement).map(object => object.parentElement);
			for (const parentElement of dependentObjectsParentElement)
				parentElement.updateChildsRelativePosition();
		} else {
			console.error("Value must be a number!");
		}
	}	
}

/** Class with general appearence/manipulate methods for Shapes and Entities. */
class Style {
	_parentElement;
	style = {
		_measure: new Measure(1), _marginMeasureX: 0, _marginMeasureY: 0, _marginX: 0, _marginY: 0,
		_fill: true, _hidden: false, _bgColor: "transparent", _lineWidth: 1, _zIndex: 1
	};

	/** Align a Shape with another element by X axis. 
	 * @param {"left" | "center" | "right"} alignDirection 
	 * @param {Shape | Entity} element 
	 * @param {Shape | Entity | Canvas2D} container 
	*/
	static alignX(alignDirection, element, container) {
		let cWidth;
		let cX;

		if (container instanceof Canvas2D) {
			cWidth = container.width;
			cX = 0;
		} else if (container instanceof Shape) {
			cWidth = container.width;
			cX = container.x;
		} else if (container instanceof Entity) {
			cWidth = 0;
			cX = container.x;
		} else {
			console.error("%c" + container.constructor.name + " isn't a valid element to align an element!", "color: #ff4444; font-size: 24px; font-weight: bold;");
			return;
		}

        switch (alignDirection) {
			case "left":
				element.move(0, 0, (cX-element.x), 0);
				break;
            case "center":		
				element.move(0, 0, ((cWidth - element.width)/2) - (element.x - cX), 0);				
                break;
			case "right":
				element.move(0, 0, (cWidth - element.width) + (cX - element.x), 0);
				break;
        }
    }

	/** Align a Shape with another element by Y axis. 
	 * @param {"top" | "center" | "bottom"} alignDirection 
	 * @param {Shape | Entity} element 
	 * @param {Shape | Entity | Canvas2D} container 
	*/
	static alignY(alignDirection, element, container) {
		let cHeight;
		let cY;

		if (container instanceof Canvas2D) {
			cHeight = container.height;
			cY = 0;
		} else if (container instanceof Shape) {
			cHeight = container.height;
			cY = container.y;
		} else if (container instanceof Entity) {
			cHeight = 0;
			cY = container.y;
		} else {
			console.error("%c" + container.constructor.name + " isn't a valid element to align an element!", "color: #ff4444; font-size: 24px; font-weight: bold;");
			return;
		}

		let biasY = 0;
		if (element instanceof CText) {
			biasY += element.style.fontSize;
		}
		
        switch (alignDirection) {
			case "top":
				element.move(0, 0, 0, (cY-element.y) + biasY);
				break;
			case "center":
				element.move(0, 0, 0, ((cHeight - element.height)/2) - (element.y - cY) + biasY);
				break;
			case "bottom":
				element.move(0, 0, 0, (cHeight - element.height) + (cY - element.y) + biasY);
				break;
        }
    }
	
	/** Custom measure in pixels. */
	get measure() { return this.style._measure }
	/** Margin X in measure. */
	get marginMeasureX() { return this.style._marginMeasureX }
	/** Margin Y in measure. */
	get marginMeasureY() { return this.style._marginMeasureY }
	/** Margin X in pixel. */ 
	get marginX() { return this.style._marginX }
	/** Margin Y in pixel. */ 
	get marginY() { return this.style._marginY }
	/** Coordinate X in pixels */
	get x() { return (this.marginMeasureX * this.measure) + this.marginX }
	/** Coordinate Y in pixels */
	get y() { return (this.marginMeasureY * this.measure) + this.marginY }

	get parentElement() { return this._parentElement }
	get fill() { return this.style._fill }
	get hidden() { return this.style._hidden }
	get bgColor() { return this.style._bgColor }
	get lineWidth() { return this.style._lineWidth }
	get zIndex() { return this.style._zIndex ?? 1 }

	set measure(measure) { this.style._measure = measure instanceof Measure || typeof(measure) === "number" ? measure : this.style._measure }
	set marginMeasureX(measurePosition) { this.style._marginMeasureX = typeof(measurePosition) === "number" ? measurePosition : this.style._marginMeasureX }
	set marginMeasureY(measurePosition) { this.style._marginMeasureY = typeof(measurePosition) === "number" ? measurePosition : this.style._marginMeasureY }
	set marginX(pixels) { this.style._marginX = typeof(pixels) === "number" ? pixels : this.style._marginX }
	set marginY(pixels) { this.style._marginY = typeof(pixels) === "number" ? pixels : this.style._marginY }

	set parentElement(parentElement) {
		this._parentElement = parentElement instanceof ComplexObject ? parentElement : this._parentElement;
	}
	set fill(fill) { this.style._fill = fill === true ? true : false }
	set hidden(value) { this.style._hidden = value === false ? false : true }
	set bgColor(color) { this.style._bgColor = typeof(color) === "string" ? color : "transparent" }
	set lineWidth(size) { this.style._lineWidth = typeof(size) === "number" ? size : 1 }
	set zIndex(value) { this.style._zIndex = value }
}

/** Generic class for Entities. 
 * @abstract
*/
class Entity extends Style {
	/** @private */
	static idCount = 0;

	/**
	 * @protected
	 * @param {number | Measure} measure Base Measure.
	 * @param {number} marginMeasureX Margin X in Measure.
	 * @param {number} marginMeasureY Margin Y in Measure.
	 * @param {number} marginX Margin X in pixels.
	 * @param {number} marginY Margin Y in pixels.
	 */
	constructor(measure, marginMeasureX, marginMeasureY, marginX, marginY) {
		super();
		Entity.idCount++;

		this.id = Entity.idCount;
		this.measure = measure;
		this.marginMeasureX = marginMeasureX;
		this.marginMeasureY = marginMeasureY;
		this.marginX = marginX;
		this.marginY = marginY;
	}

	/** 
	 * @abstract 
	 * @param {CanvasRenderingContext2D} context 
	 */
	create(context) {
		console.error("%c" + this.constructor.name + " don't have a create method!", "color: #ff4444; font-size: 24px; font-weight: bold;");
	}

	/**
	 * @abstract
	 * @param {number} marginMeasureX Margin X in Measure.
	 * @param {number} marginMeasureY Margin Y in Measure.
	 * @param {number} marginX Margin X in pixels.
	 * @param {number} marginY Margin Y in pixels.
	 */
	move(marginMeasureX, marginMeasureY, marginX, marginY) {
		console.error("%c" + this.constructor.name + " don't have a move method!", "color: #ff4444; font-size: 24px; font-weight: bold;");
	}

	/** 
	 * @abstract 
	 * @param {number} positionX Position X in pixels.
	 * @param {number} positionY Position Y in pixels.
	 */
	hasCollision(positionX, positionY) {
		console.error("%c" + this.constructor.name + " don't have a hasCollision method!", "color: #ff4444; font-size: 24px; font-weight: bold;");
	}
}

/** Generic class for Shapes. 
 * @abstract
*/
class Shape extends Style {
	/** @private */
	static idCount = 0;

	/**
	 * @protected
	 * @param {number | Measure} measure Base Measure
	 * @param {number} marginMeasureX Margin X in Measure.
	 * @param {number} marginMeasureY Margin Y in Measure.
	 * @param {number} marginX Margin X in pixels.
	 * @param {number} marginY Margin Y in pixels.
	 * @param {number} width Width in pixels.
	 * @param {number} height Height in pixels.
	 * @param {string} bgColor Hexadecimal color string.
	 */
	constructor(measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height, bgColor) {
		super();
		Shape.idCount++;

		this.id = Shape.idCount;
		/** @type {Measure} */
		this.measure = measure;
		/** @type {number} */
		this.marginMeasureX = marginMeasureX;
		/** @type {number} */
		this.marginMeasureY = marginMeasureY;
		/** @type {number} */
		this.marginX = marginX;
		/** @type {number} */
		this.marginY = marginY;
		
		/** @type {number} */
		this.width = width;
		/** @type {number} */
		this.height = height;
		/** @type {string} */
		this.bgColor = bgColor;

		for (const value of [...new Set([measure, width, height])]) {
			if (value instanceof Measure)
				value.addDependentObject(this);
		}
	}

	/** Absolute value of width in pixels.  
	 * @returns {number}
	*/
	get width() {
		if (this.style._width instanceof Measure) {
			return this.style._width.valueOf();
		}
		return this.style._width;
	}

	/** Absolute value of height in pixels.  
	 * @returns {number}
	*/
	get height() {
		if (this.style._height instanceof Measure) {
			return this.style._height.valueOf();
		}
		return this.style._height;
	}

	set width(size) { this.style._width = size ?? 0 }
	set height(size) { this.style._height = size ?? 0 }

	/** Create the Shape in Canvas context. 
	 * @abstract
	 * @param {CanvasRenderingContext2D} context 
	 */
	create(context) {
		console.error("%c" + this.constructor.name + " don't have a create method!", "color: #ff4444; font-size: 24px; font-weight: bold;");
	}

	/** Increment the Shape coordinates.
	 * @abstract
	 * @param {number} marginMeasureX Margin X in Measure.
	 * @param {number} marginMeasureY Margin Y in Measure.
	 * @param {number} marginX Margin X in pixels.
	 * @param {number} marginY Margin Y in pixels.
	 */
	move(marginMeasureX, marginMeasureY, marginX, marginY) {
		console.error("%c" + this.constructor.name + " don't have a move method!", "color: #ff4444; font-size: 24px; font-weight: bold;");
	}

	/** Returns the coordinate (y) of the top border of Shape. */
	offsetTop() {
		return this.y;
	}
	
	/** Returns the coordinate (y) of the bottom border of Shape. */
	offsetBottom() {
		return this.y + this.height;
	}
	
	/** Returns the coordinate (x) of the left border of Shape. */
	offsetLeft() {
		return this.x;
	}
	
	/** Returns the coordinate (x) of the right border of Shape. */
	offsetRight() {
		return this.x + this.width;
	}   
}

/** Shape class for Rectangles. */
class Rectangle extends Shape {	
	/**
	 * @param {number | Measure} measure Base Measure
	 * @param {number} marginMeasureX Margin X in Measure.
	 * @param {number} marginMeasureY Margin Y in Measure.
	 * @param {number} marginX Margin X in pixels.
	 * @param {number} marginY Margin Y in pixels.
	 * @param {number} width Width in pixels.
	 * @param {number} height Height in pixels.
	 * @param {string} bgColor Hexadecimal bgColor string.
	 * @param {*} round 
	 */
	constructor (measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height, bgColor, round) {
		super(measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height, bgColor);
		this.round = round;
	}
	
	/** Create the Rectangle in Canvas context. 
	 * @param {CanvasRenderingContext2D} context 
	*/
	create(context) {
		if (!this.hidden) {
			context.beginPath();
			context.lineWidth = this.lineWidth;
			context.roundRect(this.x, this.y, this.width, this.height, this.round);
			
			if (this.fill === true) {
				context.fillStyle = this.bgColor;
				context.fill();
			} else {
				context.strokeStyle = this.bgColor;
				context.stroke();
			}
		}
	}

	/** Increment the Rectangle coordinates. */
	move(marginMeasureX=0, marginMeasureY=0, marginX=0, marginY=0) {
		this.marginMeasureX += marginMeasureX;
		this.marginMeasureY += marginMeasureY;
		this.marginX += marginX;
		this.marginY += marginY;
	}

	/** Border rounding for the Rectangle. */
	get round() { return this.style._round }
	set round(round) { this.style._round = round ?? [0] }
}

/** Container to group Shapes.
 **  Note that Shapes will have their position relative to the ComplexObject position. */
class ComplexObject extends Rectangle {

	/** Groupped Shapes.
	 * @type {Shape[]}
	*/
	shapes = [];

	/**
	 * @param {number | Measure} measure Base Measure
	 * @param {number} marginMeasureX Margin X in Measure.
	 * @param {number} marginMeasureY Margin Y in Measure.
	 * @param {number} marginX Margin X in pixels.
	 * @param {number} marginY Margin Y in pixels.
	 * @param {number} width Width in pixels.
	 * @param {number} height Height in pixels.
	 * @param {Shape[]} shapes Shape list.
	 */
	constructor(measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height, shapes) {
		super(measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height, "transparent", 1);
				
		this.addShapes(shapes ?? []);
		this.showDisplayArea = false;
		this.bgColor = "pink";
		this.fill = false;
	}

	/** Show the ComplexObject display area.
	 ** Note that the Shapes will be hidden.
	 ** Use the bgColor method to change the display area color.
	 * @type {boolean}
	 */
	get showDisplayArea() { return this.style._showDisplayArea }
	set showDisplayArea(value) { this.style._showDisplayArea = value !== false ? true : false }


	get alignX() { return this.style._alignX }
	get alignY() { return this.style._alignY }

	/**
	 * Child shapes align direction.
	 * @param {"left" | "center" | "right"} direction 
	 */
	set alignX(direction) { this.style._alignX = direction }
	/**
	 * Shapes align direction.
	 * @param {"top" | "center" | "bottom"} direction 
	 */
	set alignY(direction) { this.style._alignY = direction }
		
	/** Create the ComplexObject Shapes in Canvas context. 
	 * @type {CanvasRenderingContext2D}
	*/
	create(context) {
		if (this.showDisplayArea) {
			super.create(context);
			return;
		}
		if (this.fill) {
			super.create(context);
		}
		for (const shape of this.shapes) {
			shape.create(context);
		}
	}

	/** Increment the ComplexObject Shapes coordinates. */
	move(marginMeasureX=0, marginMeasureY=0, marginX=0, marginY=0) {
		super.move(marginMeasureX, marginMeasureY, marginX, marginY);
		for (const shape of this.shapes) {
			shape.move(marginMeasureX, marginMeasureY, marginX, marginY);
		}
	}

	/** Add a list of Shapes to the ComplexObject.
	 * @param {Shape[]} shapes 
	 * @param {boolean} reverse 
	 * @param {boolean} unshift 
	 */
	addShapes(shapes, reverse=false, unshift=false) {
		if (reverse) shapes.reverse();
		for (const shape of shapes) {
			shape.parentElement = this;
			shape.move(0, 0, this.alignX ? 0 : this.x, this.alignY ? 0 : this.y);
			Style.alignX(this.style._alignX, shape, this);
			Style.alignY(this.style._alignY, shape, this);
			if (unshift) {
				this.shapes.unshift(shape);
			} else {
				this.shapes.push(shape);
			}
		}
	}

	/** Update shapes relative position. */
	updateChildsRelativePosition() {
		for (const shape of this.shapes) {
			Style.alignX(this.style._alignX, shape, this);
			Style.alignY(this.style._alignY, shape, this);
		}
	}
}

/** Shape class for images. */
class Img extends Shape {
	/**
	 * @param {string} imgSrc Image path.
	 * @param {number | Measure} measure Base Measure
	 * @param {number} marginMeasureX Margin X in Measure.
	 * @param {number} marginMeasureY Margin Y in Measure.
	 * @param {number} marginX Margin X in pixels.
	 * @param {number} marginY Margin Y in pixels.
	 * @param {number} width Width in pixels.
	 * @param {number} height Height in pixels.
	 */
	constructor(imgSrc, measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height) {
		super(measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height, "");
		this.img = new Image(width, height);
		this.img.src = imgSrc;
	}

	/** Create the Img in Canvas context. 
	 * @param {CanvasRenderingContext2D} context 
	*/
	create(context) {
		if (!this.hidden) {
			context.drawImage(this.img, this.x, this.y, this.width, this.height);
		}
	}

	/** Increment the Img coordinates. */
	move(marginMeasureX=0, marginMeasureY=0, marginX=0, marginY=0) {
		this.marginMeasureX += marginMeasureX;
		this.marginMeasureY += marginMeasureY;
		this.marginX += marginX;
		this.marginY += marginY;
	}
}

/** Shape class for text. */
class CText extends Shape {
	/**
	 * @param {number | Measure} measure Base Measure
	 * @param {number} marginMeasureX Margin X in Measure.
	 * @param {number} marginMeasureY Margin Y in Measure.
	 * @param {number} marginX Margin X in pixels.
	 * @param {number} marginY Margin Y in pixels.
	 * @param {number} maxWidth Max width in pixels.
	 * @param {string} text Text to display.
	 * @param {string} color Hexadecimal color string.
	 * @param {string} bgColor Hexadecimal bgColor string.
	 * @param {number} fontSize Text font size.
	 * @param {string} fontWeight Text font weight.
	 * @param {string} fontFamily Text font family.
	 * 
	 */
	constructor(measure, marginMeasureX, marginMeasureY, marginX, marginY, maxWidth, text, color, bgColor, fontSize, fontWeight, fontFamily) {
		super(measure, marginMeasureX, marginMeasureY, marginX, marginY, maxWidth, undefined, bgColor);
		this.text = text ?? "";
		this.fontSize = fontSize;

		this.color = color;
		this.fontWeight = fontWeight;
		this.fontFamily = fontFamily;
		
		this.bg = new Rectangle(measure, marginMeasureX, marginMeasureY, marginX, marginY, this.width, this.height, this.bgColor);
		this.yCorrection(0, this.fontSize);
	}

	get width() {
		if (super.width) {
			return super.width;
		}
		const stdContext = Canvas2D.getNewStandardContext();
		stdContext.font = this.fontWeight + " " + this.fontSize + "px " + this.fontFamily;
		return stdContext.measureText(this.text).width;
	}
	get height() { return this.getLineCount()*this.fontSize }
	get fontSize() { return this.style._fontSize }
	get color() { return this.style._color }
	get fontWeight() { return this.style._fontWeight }
	get fontFamily() { return this.style._fontFamily }

	
	set width(width) { this.style._width = typeof(width) === "number" ? width : undefined }
	set height(height) { this.style._height = typeof(height) === "number" ? height : this.height }
	set fontSize(fontSize) {
		const newFontSize = typeof(fontSize) === "number" ? fontSize : 16;
		this.yCorrection(this.style._fontSize, newFontSize);
		this.style._fontSize = newFontSize;
	}
	set color(color) { this.style._color = color ?? "black" }
	set fontWeight(fontWeight) { this.style._fontWeight = fontWeight ?? "normal" }
	set fontFamily(family) { this.style._fontFamily = family ?? "sans-serif" }	

	/** Create the CText in Canvas context. 
	 * @param {CanvasRenderingContext2D} context 
	*/
	create(context) {
		this.bg.create(context);
		context.font = this.style._fontWeight + " " + this.style._fontSize + "px " + this.style._fontFamily;
		context.fillStyle = this.style._color;
		context.textBaseline = "bottom";
		context.fillText( this.text, this.x, this.y );
	}

	/** Increment the CText coordinates. */
	move(marginMeasureX=0, marginMeasureY=0, marginX=0, marginY=0) {
		this.marginMeasureX += marginMeasureX;
		this.marginMeasureY += marginMeasureY;
		this.marginX += marginX;
		this.marginY += marginY;
		this.bg.move(marginMeasureX, marginMeasureY, marginX, marginY);
	}

	/** Recalculate values when font size change. 
	 * @param {number} currentFontSize 
	 * @param {number} newFontSize 
	*/
	yCorrection(currentFontSize, newFontSize) {
		const currentTotalLines = this.style._width ? Math.ceil((this.text.length*currentFontSize) / this.width) : 1;
		const newTotalLines = this.style._width ? Math.ceil((this.text.length*newFontSize) / this.height) : 1;
		const correction = (newTotalLines*newFontSize) - (currentTotalLines*currentFontSize);
		this.marginX += 2;
		this.marginY += correction + 2;
	}

	/** Returns the quantity of lines of the text. */
	getLineCount() {
		const stdContext = Canvas2D.getNewStandardContext();
		return Math.ceil(
			stdContext.measureText(this.text).width / this.width
		);
	}
}

/** Class for user interaction. */
class Interactive extends ComplexObject {

	/** Action when Interactive object is clicked. */
	onClick = () => {}

	/** Action when mouse button down over the Interactive object. */
	onMouseDown = () => {}

	/** Action when mouse button up over the Interactive object. */
	onMouseUp = () => {}

	/** Action when enter the Interactive object. */
	onMouseEnter = () => {}

	/** Action when mouse leave the Interactive object. */
	onMouseLeave = () => {}
	
	/** 
	 * @abstract 
	 * @param {number} positionX Coordinate X.
	 * @param {number} positionY Coordinate Y.
	 */
	isInside(positionX, positionY) {
		if (positionX < this.offsetLeft() || positionY < this.offsetTop() || 
			positionX > this.offsetRight() || positionY > this.offsetBottom() )	
			return false;
		return true;
	}
}
