
/** Helper class to manipulate the HTMLCanvasElement. */
class Canvas2D {
	constructor(canvasElementId, width, height) {		
		this.canvas = document.getElementById(canvasElementId);
		this.canvas.width = width;
		this.canvas.height = height;
		this.context = this.canvas.getContext("2d");

		/** Background elements */
		this.backLayer = [];
		
		/** Foreground elements */
		this.mainLayer = [];
		
		/** Overlay elements */
		this.frontLayer = [];
	}

	get x() { return this.canvas.style.left }
	get y() { return this.canvas.style.top }
	get width() { return this.canvas.width }
	get height() { return this.canvas.height }

	set x(position) { this.canvas.style.left = position }
	set y(position) { this.canvas.style.top = position }
	set width(size) { this.canvas.width = size }
	set height(size) { this.canvas.height = size }

	/** Rewrite each element from elements. */
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

	/** Returns a blank context. */
	static getNewStandardContext() {
		return document.createElement("Canvas").getContext("2d");
	}
}

/** Custom measure in pixels */
class Measure {
	constructor(measureValue, baseMeasure) {
		this.measure = {  _onChangeFunctions: [] };

		if (typeof(measureValue) === "number") {
			this.value = measureValue;
		} else if (measureValue instanceof Function && baseMeasure instanceof Measure) {
			this.value = measureValue(baseMeasure);
			baseMeasure.addOnChangeFunction(measureValue);
		} else {
			this.value = 1;
		}
	}

	addOnChangeFunction(onChangeFunction) {
		if (onChangeFunction instanceof Function)
			this.measure._onChangeFunctions.push(onChangeFunction);
	}

	valueOf() {
		return this.measure._value;	
	}
	
	set value(value) {
		if (typeof(value) === "number") {
			const oldValue = this.measure._value;
			this.measure._value = value;
			for (const func of this.measure._onChangeFunctions) 
				func(oldValue, value);
		} else {
			console.error("Value must be a number!");
		}
	}	
}

/** Class with general appearence/manipulate methods for Shapes and Entities. */
class Style {
	style = {
		_measure: new Measure(1), _marginMeasureX: 0, _marginMeasureY: 0, _marginX: 0, _marginY: 0,
		_fill: true, _hidden: false, _bgColor:"transparent", _lineWidth:1
	};

	/** Align a Shape with it's container or another element. */
	static align(alignDirection, element, container) {
		let cWidth;
		let cHeight;
		let cX;
		let cY;

		if (container instanceof Canvas2D) {
			cWidth = container.width;
			cHeight = container.height;
			cX = 0;
			cY = 0;
		} else if (container instanceof Shape) {
			cWidth = container.width;
			cHeight = container.height;
			cX = container.x;
			cY = container.y;
		} else if (container instanceof Entity) {
			cWidth = 0;
			cHeight = 0;
			cX = container.x;
			cY = container.y;
		} else {
			console.error("%c" + container.constructor.name + " isn't a valid container to align an element!", "color: #ff4444; font-size: 24px; font-weight: bold;");
			return;
		}

		let biasX = 0;
		let biasY = 0;
		if (element instanceof CText) {
			biasY += element.style.fontSize;
		}
		
        switch (alignDirection) {
			case "top":
				element.move(0, 0, 0, (cY-element.y) + biasY);
				break;
			case "left":
				element.move(0, 0, (cX-element.x) + biasX, 0);
				break;
            case "centerX":		
				element.move(0, 0, ((cWidth - element.width)/2) - (element.x - cX) + biasX, 0);				
                break;
			case "centerY":
				element.move(0, 0, 0, ((cHeight - element.height)/2) - (element.y - cY) + biasY);
				break;
			case "right":
				element.move(0, 0, (cWidth - element.width) + (cX - element.x) + biasX, 0);
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

	get fill() { return this.style._fill }
	get hidden() { return this.style._hidden }
	get bgColor() { return this.style._bgColor }
	get lineWidth() { return this.style._lineWidth }

	set measure(measure) { this.style._measure = measure instanceof Measure || typeof(measure) === "number" ? measure : this.style._measure }
	set marginMeasureX(measurePosition) { this.style._marginMeasureX = typeof(measurePosition) === "number" ? measurePosition : this.style._marginMeasureX }
	set marginMeasureY(measurePosition) { this.style._marginMeasureY = typeof(measurePosition) === "number" ? measurePosition : this.style._marginMeasureY }
	set marginX(pixels) { this.style._marginX = typeof(pixels) === "number" ? pixels : this.style._marginX }
	set marginY(pixels) { this.style._marginY = typeof(pixels) === "number" ? pixels : this.style._marginY }

	set fill(fill) { this.style._fill = fill === true ? true : false }
	set hidden(value) { this.style._hidden = value === false ? false : true }
	set bgColor(color) { this.style._bgColor = typeof(color) === "string" ? color : "transparent" }
	set lineWidth(size) { this.style._lineWidth = typeof(size) === "number" ? size : 1 }
}

/** Generic class for Entities. */
class Entity extends Style {
	static idCount = 0;

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

	create(context) {
		console.error("%c" + this.constructor.name + " don't have a create method!", "color: #ff4444; font-size: 24px; font-weight: bold;");
	}

	move(marginMeasureX, marginMeasureY, marginX, marginY) {
		console.error("%c" + this.constructor.name + " don't have a move method!", "color: #ff4444; font-size: 24px; font-weight: bold;");
	}

	hasCollision(marginMeasureX, marginMeasureY) {
		console.error("%c" + this.constructor.name + " don't have a hasCollision method!", "color: #ff4444; font-size: 24px; font-weight: bold;");
	}
	
	align(alignDirection, container) {
		Style.align(alignDirection, this, container);
	}
}

/** Generic class for Shapes. */
class Shape extends Style {
	static idCount = 0;

	constructor(measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height, bgColor) {
		super();
		Shape.idCount++;

		this.id = Shape.idCount;
		this.measure = measure;
		this.marginMeasureX = marginMeasureX;
		this.marginMeasureY = marginMeasureY;
		this.marginX = marginX;
		this.marginY = marginY;

		this.width = width;
		this.height = height;
		this.bgColor = bgColor;
	}

	/** Returns the absolute value of the width in pixels.  */
	get width() {
		if (this.style._width instanceof Measure) {
			return this.style._width.valueOf();
		}
		return this.style._width;
	}

	/** Returns the absolute value of the height in pixels.  */
	get height() {
		if (this.style._height instanceof Measure) {
			return this.style._height.valueOf();
		}
		return this.style._height;
	}

	set width(size) { this.style._width = size ?? 0 }
	set height(size) { this.style._height = size ?? 0 }
	
	align(alignDirection, container) {
		Style.align(alignDirection, this, container);
	}

	create(context) {
		console.error("%c" + this.constructor.name + " don't have a create method!", "color: #ff4444; font-size: 24px; font-weight: bold;");
	}

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
	constructor (measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height, bgColor, round) {
		super(measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height, bgColor);
		this.round = round;
	}
	
	/** Create the Rectangle in Canvas context. */
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

	/** Set the border rounding for the Rectangle. */
	get round() { return this.style._round }
	set round(round) { this.style._round = round ?? [0] }
}

/** Container to group Shapes.
 **  Note that Shapes will have their position relative to the ComplexObject position. */
class ComplexObject extends Rectangle {

	/** Groupped Shapes */
	shapes = [];

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
	 */
	get showDisplayArea() { return this.style._showDisplayArea }
	set showDisplayArea(value) { this.style._showDisplayArea = value !== false ? true : false }
		
	/** Create the ComplexObject Shapes in Canvas context. */
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

	/** Add a list of Shapes to the ComplexObject. */
	addShapes(shapes, reverse=false, unshift=false) {
		if (reverse) shapes.reverse();
		if (unshift) {
			for (const shape of shapes) {
				shape.move(0, 0, this.x, this.y);
				this.shapes.unshift(shape);
			}
		} else {
			for (const shape of shapes) {
				shape.move(0, 0, this.x, this.y);
				this.shapes.push(shape);
			}
		}
	}
}

/** Shape class for images. */
class Img extends Shape {
	constructor(imgSrc, measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height) {
		super(measure, marginMeasureX, marginMeasureY, marginX, marginY, width, height, "");
		this.img = new Image(width, height);
		this.img.src = imgSrc;
	}

	/** Create the Img in Canvas context. */
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
	constructor(measure, x, y, marginX, marginY, maxWidth, text, color, bgColor, fontSize, fontWeight, fontFamily) {
		super(measure, x, y, marginX, marginY, maxWidth, undefined, bgColor);
		this.text = text ?? "";
		this.fontSize = fontSize;

		this.color = color;
		this.fontWeight = fontWeight;
		this.fontFamily = fontFamily;
		
		this.bg = new Rectangle(measure, x, y, marginX, marginY, this.width, this.height, this.bgColor);
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

	/** Create the CText in Canvas context. */
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

	/** Recalculate values when font size change. */
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

	constructor(x, y, width, height, shapes) {
		super(x, y, width, height, shapes);
	}

	/** Action when Interactive object is clicked. */
	onClick = () => {}

	/** Action when mouse button down over the Interactive object. */
	onMouseDown = () => {}

	/** Action when mouse button up over the Interactive object. */
	onMouseUp = () => {}

	/** Action when hovering over the Interactive object. */
	onMouseOver = () => {}

	/** Action when mouse out the Interactive object. */
	onMouseOut = () => {}
	
	// onLoad = () => {}	
}
