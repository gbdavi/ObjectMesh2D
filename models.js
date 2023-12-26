
/** Helper class to manipulate the HTMLCanvasElement.  */
class Canvas2D {
	constructor(canvasElementId, width, height) {		
		this.canvas = document.getElementById(canvasElementId);
		this.canvas.width = width;
		this.canvas.height = height;
		this.context = this.canvas.getContext("2d");

		/** Elements to manipulate in the Canvas. */
		this.elements = [];
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
		for (const element of this.elements) {
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

/** Class with general appearence/manipulate methods for Shapes and Entities. */
class Style {
	style = {
		fill:true, hidden:false, bgColor:"transparent", lineWidth:1
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
			console.log("%c" + container.constructor.name + " isn't a valid container to align an element!", "background: #222; color: #ff4444; font-size: 24px; font-weight: bold;");
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

	get fill() { return this.style.fill }
	get hidden() { return this.style.hidden }
	get bgColor() { return this.style.bgColor }
	get lineWidth() { return this.style.lineWidth }

	set fill(fill) { this.style.fill = fill === true ? true : false }
	set hidden(value) { this.style.hidden = value === false ? false : true }
	set bgColor(color) { this.style.bgColor = typeof(color) === "string" ? color : "transparent" }
	set lineWidth(size) { this.style.lineWidth = typeof(size) === "number" ? size : 1 }
}

/** Generic class for Entities. */
class Entity extends Style {
	static idCount = 0;
	/** A custom unity of measure. (ratio in pixel) */ measureSize;
	position = {
		/** The quantity of the custom unity of measure on the X axis. */ measureX: 0, 
		/** The quantity of the custom unity of measure on the Y axis. */ measureY: 0,
		/** Margin X in pixel. */ marginX: 0,
		/** Margin Y in pixel. */ marginY: 0
	}

	constructor(measureSize, measureX, measureY, marginX, marginY) {
		super();
		Entity.idCount++;

		this.id = Entity.idCount;
		this.measureSize = (measureSize ?? {value:1});
		this.measureX = (measureX ?? 0);
		this.measureY = (measureY ?? 0);
		this.marginX = (marginX ?? 0);
		this.marginY = (marginY ?? 0);
	}

	/** Coordinates in pixels in the X axis */
	get x() { return (this.position.measureX*this.measureSize.value) + this.position.marginX }
	/** Coordinates in pixels in the Y axis */
	get y() { return (this.position.measureY*this.measureSize.value) + this.position.marginY }

	get measureX() { return this.position.measureX }
	get measureY() { return this.position.measureY }
	get marginX() { return this.position.marginX }
	get marginY() { return this.position.marginY }

	set measureX(position) { this.position.measureX = position ?? this.measureX }
	set measureY(position) { this.position.measureY = position ?? this.measureY }
	set marginX(pixels) { this.position.marginX = pixels ?? this.marginX }
	set marginY(pixels) { this.position.marginY = pixels ?? this.marginY }

	create(context) {
		console.log("%c" + this.constructor.name + " don't have a create method!", "background: #222; color: #ff4444; font-size: 24px; font-weight: bold;")
	}

	move(measureX, measureY, marginX, marginY) {
		console.log("%c" + this.constructor.name + " don't have a move method!", "background: #222; color: #ff4444; font-size: 24px; font-weight: bold;")
	}

	hasCollision(measureX, measureY) {
		console.log("%c" + this.constructor.name + " don't have a hasCollision method!", "background: #222; color: #ff4444; font-size: 24px; font-weight: bold;")
	}
	
	align(alignDirection, container) {
		Style.align(alignDirection, this, container);
	}
}

/** Generic class for Shapes. */
class Shape extends Style {
	static idCount = 0;
	/** A custom unity of measure. (ratio in pixel) */ measureSize;
	position = {
		/** The quantity of the custom unity of measure on the X axis. */ measureX: 0, 
		/** The quantity of the custom unity of measure on the Y axis. */ measureY: 0,
		/** Margin X in pixel. */ marginX: 0,
		/** Margin Y in pixel. */ marginY: 0
	}

	constructor(measureSize, measureX, measureY, marginX, marginY, width, height, bgColor) {
		super();
		Shape.idCount++;

		this.id = Shape.idCount;
		this.measureSize = (measureSize ?? {value:1});
		this.measureX = (measureX ?? 0);
		this.measureY = (measureY ?? 0);
		this.marginX = (marginX ?? 0);
		this.marginY = (marginY ?? 0);

		this.width = (width ?? 0);
		this.height = (height ?? 0);
		this.bgColor = bgColor;
	}

	/** Coordinates in pixels in the X axis */
	get x() { return (this.position.measureX*this.measureSize.value) + this.position.marginX }
	/** Coordinates in pixels in the Y axis */
	get y() { return (this.position.measureY*this.measureSize.value) + this.position.marginY }

	get measureX() { return this.position.measureX }
	get measureY() { return this.position.measureY }
	get marginX() { return this.position.marginX }
	get marginY() { return this.position.marginY }

	set measureX(position) { this.position.measureX = position ?? this.measureX }
	set measureY(position) { this.position.measureY = position ?? this.measureY }
	set marginX(pixels) { this.position.marginX = pixels ?? this.marginX }
	set marginY(pixels) { this.position.marginY = pixels ?? this.marginY }

	/** Returns the absolute value of the width or the first value if setted an Object.  */
	get width() {
		if (this.style.width instanceof Object) {
			for (const key in this.style.width) {
				if (this.style.width[key] instanceof Function) {
					return this.style.width[key]();
				}
				return this.style.width[key];
			}
		}
		return this.style.width
	}

	/** Returns the absolute value of the height or the first value if setted an Object.  */
	get height() {
		if (this.style.height instanceof Object) {
			for (const key in this.style.height) {
				if (this.style.height[key] instanceof Function) {
					return this.style.height[key]();
				}
				return this.style.height[key];
			}
		}
		return this.style.height
	}

	set width(size) { this.style.width = size }
	set height(size) { this.style.height = size }
	
	align(alignDirection, container) {
		Style.align(alignDirection, this, container);
	}

	create(context) {
		console.log("%c" + this.constructor.name + " don't have a create method!", "background: #222; color: #ff4444; font-size: 24px; font-weight: bold;");
	}

	move(measureX, measureY, marginX, marginY) {
		console.log("%c" + this.constructor.name + " don't have a move method!", "background: #222; color: #ff4444; font-size: 24px; font-weight: bold;");
	}

	/** Returns the coordinates (y) of the top border of Shape. */
	offsetTop() {
		return this.y;
	}
	
	/** Returns the coordinates (y) of the bottom border of Shape. */
	offsetBottom() {
		return this.y + this.height;
	}
	
	/** Returns the coordinates (x) of the left border of Shape. */
	offsetLeft() {
		return this.x;
	}
	
	/** Returns the coordinates (x) of the right border of Shape. */
	offsetRight() {
		return this.x + this.width;
	}   
}

/** Shape class for Rectangles. */
class Rectangle extends Shape {	
	constructor (measureSize, measureX, measureY, marginX, marginY, width, height, bgColor, round) {
		super(measureSize, measureX, measureY, marginX, marginY, width, height, bgColor);
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
	move(measureX=0, measureY=0, marginX=0, marginY=0) {
		this.measureX += measureX;
		this.measureY += measureY;
		this.marginX += marginX;
		this.marginY += marginY;
	}

	/** Set the border rounding for the Rectangle. */
	get round() { return this.style.round }
	set round(round) { this.style.round = round ?? [0] }
}

/** Container to group Shapes.
 **  Note that Shapes will have their position relative to the ComplexObject position. */
class ComplexObject extends Rectangle {

	/** Groupped Shapes */
	shapes = [];

	constructor(measureSize, measureX, measureY, marginX, marginY, width, height, shapes) {
		super(measureSize, measureX, measureY, marginX, marginY, width, height, "transparent", 1);
		this.addShapes(shapes ?? []);
		this.showDisplayArea = false;
		this.bgColor = "pink";
		this.fill = false;
	}

	/** Show the ComplexObject display area.
	 ** Note that the Shapes will be hidden.
	 ** Use the bgColor method to change the display area color.
	 */
	get showDisplayArea() { return this.style.showDisplayArea }
	set showDisplayArea(value) { this.style.showDisplayArea = value !== false ? true : false }
		
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
	move(measureX=0, measureY=0, marginX=0, marginY=0) {
		super.move(measureX, measureY, marginX, marginY);
		for (const shape of this.shapes) {
			shape.move(measureX, measureY, marginX, marginY);
		}
	}

	/** Add a list of Shapes to the ComplexObject. */
	addShapes(shapes, reverse=false, unshift=false) {
		if (reverse) shapes.reverse();
		if (unshift) {
			for (const shape of shapes) {
				shape.move(this.measureX, this.measureY, this.marginX, this.marginY);
				this.shapes.unshift(shape);
			}
		} else {
			for (const shape of shapes) {
				shape.move(this.measureX, this.measureY, this.marginX, this.marginY);
				this.shapes.push(shape);
			}
		}
	}
}

/** Shape class for images. */
class Img extends Shape {
	constructor(imgSrc, measureSize, measureX, measureY, marginX, marginY, width, height) {
		super(measureSize, measureX, measureY, marginX, marginY, width, height, "");
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
	move(measureX=0, measureY=0, marginX=0, marginY=0) {
		this.measureX += measureX;
		this.measureY += measureY;
		this.marginX += marginX;
		this.marginY += marginY;
	}
}

/** Shape class for text. */
class CText extends Shape {
	constructor(measureSize, x, y, marginX, marginY, maxWidth, text, color, bgColor, fontSize, fontWeight, fontFamily) {
		super(measureSize, x, y, marginX, marginY, maxWidth, undefined, bgColor);
		this.text = text ?? "";
		this.fontSize = fontSize;

		this.color = color;
		this.fontWeight = fontWeight;
		this.fontFamily = fontFamily;
		
		this.bg = new Rectangle(measureSize, x, y, marginX, marginY, this.width, this.height, this.bgColor);
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
	get fontSize() { return this.style.fontSize }
	get color() { return this.style.color }
	get fontWeight() { return this.style.fontWeight }
	get fontFamily() { return this.style.fontFamily }

	
	set width(width) { this.style.width = typeof(width) === "number" ? width : undefined }
	set height(height) { this.style.height = typeof(height) === "number" ? height : this.height }
	// set fontSize(size) { this.style.fontSize = typeof(size) === "number" ? size : 16 }
	set fontSize(fontSize) {
		const newFontSize = typeof(fontSize) === "number" ? fontSize : 16;
		this.yCorrection(this.style.fontSize, newFontSize);
		this.style.fontSize = newFontSize;
	}
	set color(color) { this.style.color = color ?? "black" }
	set fontWeight(fontWeight) { this.style.fontWeight = fontWeight ?? "normal" }
	set fontFamily(family) { this.style.fontFamily = family ?? "sans-serif" }	

	/** Create the CText in Canvas context. */
	create(context) {
		this.bg.create(context);
		context.font = this.style.fontWeight + " " + this.style.fontSize + "px " + this.style.fontFamily;
		context.fillStyle = this.style.color;
		context.textBaseline = "bottom";
		context.fillText( this.text, this.x, this.y );
	}

	/** Increment the CText coordinates. */
	move(measureX=0, measureY=0, marginX=0, marginY=0) {
		this.measureX += measureX;
		this.measureY += measureY;
		this.marginX += marginX;
		this.marginY += marginY;
		this.bg.move(measureX, measureY, marginX, marginY);
	}

	/** Recalculate values when font size change. */
	yCorrection(currentFontSize, newFontSize) {
		const currentTotalLines = this.style.width ? Math.ceil((this.text.length*currentFontSize) / this.width) : 1;
		const newTotalLines = this.style.width ? Math.ceil((this.text.length*newFontSize) / this.height) : 1;
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
