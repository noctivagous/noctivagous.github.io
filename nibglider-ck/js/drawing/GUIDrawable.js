import { Drawable } from './Drawable.js';

export class GUIDrawable extends Drawable {
    constructor() {
        super();

        // Rect to define the size and position of the GUI element
        this.backgroundRect = window.CanvasKit.Rect();
        this.fillsBackground = true;

        // Set up the paint for the GUI element
        this.skPaint = new window.CanvasKit.Paint();
        this.skPaint.setColor(window.CanvasKit.Color(128, 128, 128, 1)); // Gray color
        this.skPaint.setStyle(window.CanvasKit.PaintStyle.Fill);

        // Path for drawing
        this.path = new window.CanvasKit.Path();

        // Additional properties for GUI elements
          this.isFocusable = false; // Default value
          this.isTextField = false; // Default value
    }

     // Method to check if a point is inside the rect
     hitTest(mousePoint) {
        return this.backgroundRect.contains(mousePoint.x, mousePoint.y);
    }

    // Box positioning functions
    setRectOriginPoint(xyPointArray) {
        let [x, y] = xyPointArray;
        let width = this.backgroundRect.width();
        let height = this.backgroundRect.height();
        this.backgroundRect = window.CanvasKit.LTRBRect(x, y, x + width, y + height);
        this.setFromRect(this.backgroundRect);
    }

    setFromRect(skRectFloat32Array) {
        this.path.reset();
        this.path.addRect(skRectFloat32Array);
    }

    setRectWidth(width) {
        let x = this.backgroundRect.left;
        let y = this.backgroundRect.top;
        this.backgroundRect = window.CanvasKit.LTRBRect(x, y, x + width, y + this.backgroundRect.height());
        this.setFromRect(this.backgroundRect);
    }

    setRectHeight(height) {
        let x = this.backgroundRect.left;
        let y = this.backgroundRect.top;
        this.backgroundRect = window.CanvasKit.LTRBRect(x, y, x + this.backgroundRect.width(), y + height);
        this.setFromRect(this.backgroundRect);
    }

    handleKeyEvent(event) {
        // Handle key events
    }

    handleMouseEvent(event) {
        // Implement specific mouse event handling here
        console.log("Mouse event handled by GUI element");
    }

    draw(skCanvas) {
        if (this.matrix) {
          skCanvas.save();
          skCanvas.concat(this.matrix);
        }

        // Draw the background if fillsBackground is true
        if (this.fillsBackground) {
            skCanvas.drawPath(this.path, this.skPaint);
        }

        // Additional drawing logic for selection or other effects
        if (this.isSelected) {
            // Draw selection effect
        }

        if (this.matrix) {
          skCanvas.restore();
        }
    }
}

export class LayoutDrawable extends GUIDrawable {

    constructor() {
        super();
        this.children = []; // Array to store child GUIDrawable elements
        this.layoutAvailableBounds = [0, 0, 300, 300]; // Available space
        this.selfBounds = [0, 0, 100, 100]; // Own bounds within layoutBounds
        this.alignment = 'right'; // Example alignment: 'right', 'left', 'top', 'bottom'
    }

    // all objects in children are positioned relative to
    // the layoutbounds.  so if layoutbounds is set at [10,10,310,310],
    // a button with an origin at [0,0] will start in the absolute
    // of the window viewport at [10,10]
    setLayoutAvailableBounds(skRectFloat32Array) //([x1,y1,x2,y2])
    {
        this.layoutAvailableBounds = skRectFloat32Array;
        this.updatePositionAndChildren();
    }

    updatePositionAndChildren() {
        // Calculate the position based on alignment and set selfBounds
        switch (this.alignment) {
            case 'right':
                this.selfBounds[0] = this.layoutBounds[2] - this.selfBounds[2];
                this.selfBounds[1] = this.layoutBounds[1];
                break;
            // Add cases for 'left', 'top', 'bottom'
        }

        // Update children's positions based on new selfBounds
        this.updateChildrenPositions();
    }

    updateChildrenPositions() {
        // Offset each child's position by selfBounds[0] and selfBounds[1]
        this.children.forEach(child => {
            child.setPosition(this.selfBounds[0] + child.x, this.selfBounds[1] + child.y);
        });
    }


    drawLayout(skCanvas) {
        // Draw the layout container itself
        super.draw(skCanvas);
        // Then draw each child
        this.children.forEach(child => child.draw(skCanvas));
    }

    handleLayoutEvent(event) {
        this.children.forEach(child => {
            // Implement logic to determine which child should handle the event
            // For example, based on hitTest or focus
            child.handleEvent(event);
        });
    }

    // Methods to add/remove child elements
}



export class KeyboardPanel extends LayoutDrawable {
    constructor() {
        super();
        this.alignment = 'bottom-left';
        this.selfBounds = [0, 0, 300, 150]; // Adjust size as needed
        // Initialize keys (You'll need to create a GUIControl or similar for each key)
    }

    // Override updatePositionAndChildren for specific positioning
    updatePositionAndChildren() {
        // Position at the bottom-left corner
        this.selfBounds[0] = this.layoutBounds[0]; // x position
        this.selfBounds[1] = this.layoutBounds[3] - this.selfBounds[3]; // y position
        super.updateChildrenPositions(); // Update keys' positions
    }

    // Method to handle key press events (simulate keys being pressed)
    handleKeyPress(key) {
        // Logic to highlight the pressed key
    }

    // ... other methods ...
}

export class SettingsBar extends LayoutDrawable {
    constructor() {
        super();
        this.alignment = 'top';
        this.selfBounds = [0, 0, 1920, 50]; // Full width and 50pt height
        // Initialize settings controls (e.g., buttons for snapping)
    }

    // Override updatePositionAndChildren for specific positioning
    updatePositionAndChildren() {
        // Position at the top edge
        this.selfBounds[0] = this.layoutBounds[0]; // x position
        this.selfBounds[1] = this.layoutBounds[1]; // y position
        super.updateChildrenPositions(); // Update settings controls' positions
    }

    // ... other methods ...
}
