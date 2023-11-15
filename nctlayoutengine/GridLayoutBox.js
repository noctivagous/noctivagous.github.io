import LayoutBox from './LayoutBox.js';

class GridLayoutBox extends LayoutBox {

    constructor(parentWidthPassed, parentHeightPassed, guiControl = null, parent = null) {
        
        super(parentWidthPassed, parentHeightPassed);

        // Grid configuration properties
        this.gridRows = 3;
        this.gridColumns = 3;
        this.horizontalGutterSize = 10;
        this.verticalGutterSize = 10;
        this.stretchToFit = false;

        // Flexible sizing (example: using ratios)
        this.cellSizeRatios = []; // Array of size ratios for each cell

        this.children = null;

    }



    // ------- GRIDS, ROW STACKS, COLUMN STACKS

    // GridLayoutBox can generate and maintain grids
    // because it is a property possessed by any GUIControl for
    // determining the bounds of its drawing, including a GridControl
    // that simply queries the GridLayoutBox for
    // dimensions and locations of its various boxes.

    // Method to calculate grid cell properties
    calculateGridCellProperties(parentWidth, parentHeight, gutterSize, row, column) {
        const cellWidth = (parentWidth - gutterSize.horizontal * (this.gridColumns - 1)) / this.gridColumns;
        const cellHeight = (parentHeight - gutterSize.vertical * (this.gridRows - 1)) / this.gridRows;

        const leftInset = (cellWidth + gutterSize.horizontal) * column;
        const topInset = (cellHeight + gutterSize.vertical) * row;

        return new GridLayoutBox({
            insetStarts: { "topEdgePt": topInset, "leftEdgePt": leftInset },
            extrude: { "fromTopEdgePt": cellHeight, "fromLeftEdgePt": cellWidth }
        });
    }


    calculateRowStackProperties(parentWidth, parentHeight, controlCount, gutterSize) {
        const controlWidth = (parentWidth - gutterSize * (controlCount - 1)) / controlCount;
        const controlHeight = parentHeight;

        const controlsProperties = [];
        for (let i = 0; i < controlCount; i++) {
            controlsProperties.push(new GridLayoutBox({
                insetStarts: { "leftEdgePt": (controlWidth + gutterSize) * i, "topEdgePt": 0 },
                extrude: { "fromTopEdgePt": controlHeight, "fromLeftEdgePt": controlWidth }
            }));
        }
        return controlsProperties;
    }


    calculateColumnStackProperties(parentWidth, parentHeight, controlCount, gutterSize) {
        const controlWidth = parentWidth;
        const controlHeight = (parentHeight - gutterSize * (controlCount - 1)) / controlCount;

        const controlsProperties = [];
        for (let i = 0; i < controlCount; i++) {
            controlsProperties.push(new GridLayoutBox({
                insetStarts: { "topEdgePt": (controlHeight + gutterSize) * i, "leftEdgePt": 0 },
                extrude: { "fromTopEdgePt": controlHeight, "fromLeftEdgePt": controlWidth }
            }));
        }
        return controlsProperties;
    }


    // Method for calculating grid cell properties with flexible sizing
    calculateGridCellPropertiesWithFlexibleSizing(parentWidth, parentHeight) {
        const controlsProperties = [];
        for (let row = 0; row < this.gridRows; row++) {
            for (let column = 0; column < this.gridColumns; column++) {
                let cellWidth, cellHeight;

                // Calculate cell size based on content or predefined ratios
                if (this.cellSizeRatios.length > 0) {
                    const ratio = this.cellSizeRatios[row * this.gridColumns + column];
                    cellWidth = parentWidth * ratio.widthRatio;
                    cellHeight = parentHeight * ratio.heightRatio;
                } else {
                    // Default to equal sizing
                    cellWidth = (parentWidth - this.horizontalGutterSize * (this.gridColumns - 1)) / this.gridColumns;
                    cellHeight = (parentHeight - this.verticalGutterSize * (this.gridRows - 1)) / this.gridRows;
                }

                const leftInset = (cellWidth + this.horizontalGutterSize) * column;
                const topInset = (cellHeight + this.verticalGutterSize) * row;

                controlsProperties.push(new GridLayoutBox({
                    insetStarts: { "topEdgePt": topInset, "leftEdgePt": leftInset },
                    extrude: { "fromTopEdgePt": cellHeight, "fromLeftEdgePt": cellWidth }
                }));
            }
        }
        return controlsProperties;
    }

    calculateDimensions(parentWidth, parentHeight) {
        // First, get the overall bounds for the grid using LayoutBox's calculateDimensions
        const overallBounds = super.calculateDimensions(parentWidth, parentHeight)[0];

        let gridDimensions = [];
        for (let row = 0; row < this.gridRows; row++) {
            for (let column = 0; column < this.gridColumns; column++) {
                let cellWidth, cellHeight, x, y;

                // Calculate cell size based on content or predefined ratios within overall bounds
                if (this.cellSizeRatios && this.cellSizeRatios.length > 0) {
                    const ratio = this.cellSizeRatios[row * this.gridColumns + column];
                    cellWidth = overallBounds.width * ratio.widthRatio;
                    cellHeight = overallBounds.height * ratio.heightRatio;
                } else {
                    // Default to equal sizing within overall bounds
                    cellWidth = (overallBounds.width - this.horizontalGutterSize * (this.gridColumns - 1)) / this.gridColumns;
                    cellHeight = (overallBounds.height - this.verticalGutterSize * (this.gridRows - 1)) / this.gridRows;
                }

                // Calculate x and y positions for each cell within overall bounds
                x = overallBounds.x + (cellWidth + this.horizontalGutterSize) * column;
                y = overallBounds.y + (cellHeight + this.verticalGutterSize) * row;

                gridDimensions.push({ x, y, width: cellWidth, height: cellHeight });
            }
        }
        return gridDimensions;
    }

    drawOutline(context) {
        this.drawOutlineRecursive(context, this);
    }

    drawOutlineRecursive(context, layoutBox) {
        if (layoutBox.isGridOrStack()) {
            // Get the dimensions of each cell or stack element
            const elements = layoutBox.calculateDimensions(layoutBox.parentWidth, layoutBox.parentHeight);

            // Iterate over the elements and draw each one's outline
            elements.forEach((elem) => {
                context.strokeStyle = 'black';
                context.strokeRect(elem.x, elem.y, elem.width, elem.height);
            });

            if(layoutBox.children)
         {
         layoutBox.children.forEach(child => {
            this.drawOutlineRecursive(context, child);
        });
        }
           
        } else {
            // Draw a single outline for non-grid instances
            const dims = layoutBox.calculateDimensions(layoutBox.parentWidth, layoutBox.parentHeight);
            context.strokeStyle = 'black';
            context.strokeRect(dims.x, dims.y, dims.width, dims.height);
        }


    }

    // Helper method to determine if the layout is a grid or a stack
    isGridOrStack() {
        return this.isGrid() || this.isRowStack() || this.isColumnStack();
    }

    isGrid() {
        return this.gridRows > 1 && this.gridColumns > 1;
    
    }
 
    isRowStack() {
        return this.gridRows == 1 && this.gridColumns > 1;
    
    }
 
    isColumnStack() {
        return this.gridRows > 1 && this.gridColumns == 1;
    
    }
 

// CONVENIENCE FUNCTIONS

/*

Usage Examples

let hStackBox = new GridLayoutBox();
hStackBox.setHorizontalStack(5, 10); // 5 controls in a row with 10px gutter

let vStackBox = new GridLayoutBox();
vStackBox.setVerticalStack(3, 15); // 3 controls in a column with 15px gutter

let gridBox = new GridLayoutBox();
gridBox.setGrid(3, 3, 10, 10); // 3x3 grid with 10px gutters

*/

// Horizontal Stack (hstack)
// This method will set up a horizontal stack layout, distributing controls equally across the horizontal space.
setHorizontalStack(controlCount, gutterSize) {

    if(controlCount < 2)
    {
        controlCount = 2;
    }

    this.gridRows = 1;
    this.gridColumns = controlCount;
    this.horizontalGutterSize = gutterSize;
    this.verticalGutterSize = 0; // No vertical gutter for horizontal stack
    this.cellSizeRatios = []; // Equal sizing by default
}

//Vertical Stack (vstack)
//This method will set up a vertical stack layout, distributing controls equally across the vertical space.
setVerticalStack(controlCount, gutterSize) {
    this.gridRows = controlCount;
    this.gridColumns = 1;
    this.horizontalGutterSize = 0; // No horizontal gutter for vertical stack
    this.verticalGutterSize = gutterSize;
    this.cellSizeRatios = []; // Equal sizing by default
}

// Grid
// This method will set up a grid layout with specified rows, columns, and gutter sizes.
setGrid(rows, columns, horizontalGutterSize, verticalGutterSize) {
    this.gridRows = rows;
    this.gridColumns = columns;
    this.horizontalGutterSize = horizontalGutterSize;
    this.verticalGutterSize = verticalGutterSize;
    this.cellSizeRatios = []; // Equal sizing by default or can be customized
}


}

export default GridLayoutBox;