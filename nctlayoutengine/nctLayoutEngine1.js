import GridLayoutBox from './GridLayoutBox.js';
import LayoutBox from './LayoutBox.js';

var arrayOfLayoutBoxes = [];

let parentWidth = window.innerWidth;
let parentHeight = window.innerHeight;

/*
A GUI control carries its own LayoutBox or
subclass like GridLayoutBox and interacts with it.


generate in markup with ids then let gui controls
find what they are in a registry made from it

*/

// Create instances of LayoutBox with desired settings
let box1 = new LayoutBox(parentWidth,parentHeight);
box1.initialInsets = { "topEdgeFixedPt": 10, "leftEdgeFixedPt": 20 };
box1.dimensionsByInsetting = { "fromTopEdgeFixedPt": 200, "fromLeftEdgeFixedPt": 300 };
arrayOfLayoutBoxes.push(box1);

let box2 = new LayoutBox(parentWidth,parentHeight);
box2.initialInsets = { "topEdgeRatio": 0.1, "leftEdgeRatio": 0.2 };
box2.dimensionsByInsetting = { "fromTopEdgeRatio": 0.5, "fromLeftEdgeRatio": 0.4 };
arrayOfLayoutBoxes.push(box2);

let box3 = new LayoutBox(parentWidth,parentHeight);
box3.initialInsets = { "topEdgeFixedPt": 15, "leftEdgeRatio": 0.25 };
box3.dimensionsByInsetting = { "fromTopEdgeRatio": 0.6, "fromLeftEdgeFixedPt": 250 };
arrayOfLayoutBoxes.push(box3);

let box4 = new LayoutBox(parentWidth,parentHeight);
box4.initialInsets = { "topEdgeRatio": 0.05, "leftEdgeFixedPt": 30 };
box4.dimensionsByInsetting = { "fromTopEdgeFixedPt": 180, "fromLeftEdgeRatio": 0.3 };
arrayOfLayoutBoxes.push(box4);

let hStackBox = new GridLayoutBox();
hStackBox.setHorizontalStack(5, 10)
//grid1.setGridWithRatios([[1, 2, 1], [3, 4, 5], [6, 1]], parentWidth, parentHeight, { horizontal: 10, vertical: 15 }); // Creates a grid with specified ratios

arrayOfLayoutBoxes.push(hStackBox);

/*

let grid1 = new GridLayoutBox();
grid1.gridRows = 3;
grid1.gridColumns = 3;
grid1.horizontalGutterSize = 10;
grid1.verticalGutterSize = 10;
let grid1Cells = grid1.calculateGridCellPropertiesWithFlexibleSizing(window.innerWidth, window.innerHeight);

let grid2 = new GridLayoutBox();
grid2.gridRows = 4;
grid2.gridColumns = 2;
grid2.horizontalGutterSize = 20;
grid2.verticalGutterSize = 10;
let grid2Cells = grid2.calculateGridCellPropertiesWithFlexibleSizing(parentWidth, parentHeight);

let grid3 = new GridLayoutBox();
grid3.gridRows = 2;
grid3.gridColumns = 4;
grid3.cellSizeRatios = [
    { widthRatio: 0.25, heightRatio: 0.5 },
    { widthRatio: 0.25, heightRatio: 0.5 },
    { widthRatio: 0.25, heightRatio: 0.5 },
    { widthRatio: 0.25, heightRatio: 0.5 },
    // Second row cells
    { widthRatio: 0.15, heightRatio: 0.5 },
    { widthRatio: 0.35, heightRatio: 0.5 },
    { widthRatio: 0.25, heightRatio: 0.5 },
    { widthRatio: 0.25, heightRatio: 0.5 }
];
let grid3Cells = grid3.calculateGridCellPropertiesWithFlexibleSizing(parentWidth, parentHeight);


let grid4 = new GridLayoutBox();
grid4.gridRows = 5;
grid4.gridColumns = 5;
grid4.stretchToFit = true; // Stretch grid to fill the entire parent container
let grid4Cells = grid4.calculateGridCellPropertiesWithFlexibleSizing(parentWidth, parentHeight);
*/


// Draw boxes on the canvas
function draw() {
    const canvas = document.getElementById('guiCanvas');
    if (canvas.getContext) {
        const ctx = canvas.getContext('2d');

        // Resize canvas to full window size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

    // Iterate through arrayOfLayoutBoxes and draw each box
    for (let i = 0; i < arrayOfLayoutBoxes.length; i++) {
        arrayOfLayoutBoxes[i].drawOutline(ctx);
    }
        
    }
}

// Function to update dimensions of each box based on window size
function updateParentDimensions() {
    for (let i = 0; i < arrayOfLayoutBoxes.length; i++) {
        // Assuming each box has a method `updateDimensions` 
        // that takes the new parent dimensions
        arrayOfLayoutBoxes[i].updateDimensions(window.innerWidth, window.innerHeight);
    }
}


window.onload = function () {
    updateParentDimensions();
    draw();
};

// Add event listener for window resize
window.onresize = function () {
    updateParentDimensions();
    draw();
};