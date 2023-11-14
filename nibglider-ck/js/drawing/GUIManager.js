

class GUIManager {
    constructor(app) {
        this.app = app;
        this.layerManager = this.app.layerManager;
       // this.layoutManager = new LayoutManager();
        this.guiElements = []; // Store instances of GUIDrawable
        this.focusedElement = null; // Track the focused GUI element
    }

    
    /*
    
    createGUIElement(elementType) {
        // Factory method to create and return GUI elements
        let element = new GUIDrawable(elementType, ...params);
        this.guiElements.push(element);
        this.layoutManager.addElement(element);
        return element;
    }
    */

    addGUIElement(element) {
        // Factory method to create and return GUI elements
       
        this.guiElements.push(element);
       // this.layoutManager.addElement(element);
        return element;
    }


    drawGUI(skCanvas) {
        //var startingX = 0;
      //  var startingY = 0;
        var bottomScrollbarHeight = 15;
        var rightScrollbarWidth = 15;
        var availableWidth = window.innerWidth - rightScrollbarWidth;
        var availableHeight = window.innerHeight - bottomScrollbarHeight;

        this.guiElements.forEach(element => {
            if (element instanceof LayoutDrawable) {
                element.setLayoutAvailableBounds([0, 0, availableWidth, availableHeight]);
                element.drawLayout(skCanvas);
            } else {
                element.draw(skCanvas);
            }
        });
    }

    handleEvent(event) {
        this.guiElements.forEach(element => {
            if (element instanceof LayoutDrawable) {
                element.handleLayoutEvent(event);
            }
        });
    }

    /*
    drawGUI(skCanvas) {
        this.guiElements.forEach(element => element.draw(skCanvas));
    }

    handleEvent(event) {
        // Distribute events to GUI elements
        if (event.type === 'mouse') {
            let mousePoint = event.mousePoint;
            this.guiElements.forEach(element => {
                if (element.hitTest(mousePoint)) {
                    element.handleMouseEvent(event);
                    if (element.isFocusable) {
                        this.focusedElement = element;
                    }
                }
            });
        } else if (event.type === 'key') {
            if (this.focusedElement && this.focusedElement.isTextField) {
                this.focusedElement.handleKeyEvent(event);
            }
        }
    }

    */

    updateLayout() {
       // this.layoutManager.updateLayout();
        // this.layerManager.app.invalidateEntireCanvas(); // Redraw the canvas if needed
    }

    // Other GUI management methods...
}

export default GUIManager;
