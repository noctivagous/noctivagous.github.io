import GridLayoutBox from './GridLayoutBox.js';
import LayoutBox from './LayoutBox.js';

var arrayOfLayoutBoxes = [];

const canvas = document.getElementById('guiCanvas');


var parentWidth = window.innerWidth;
var parentHeight = window.innerHeight;

canvas.width = parentWidth;
canvas.height = parentHeight;

/*
A GUI control carries its own LayoutBox or
subclass like GridLayoutBox and interacts with it.


generate in markup with ids then let gui controls
find what they are in a registry made from it

*/

// Create instances of LayoutBox with desired settings
let box1 = new LayoutBox(parentWidth,parentHeight);
box1.pullAwayFromEdges = { "topEdgeByPt": 0, "leftEdgeByPt": 20 };
box1.extrude = { "fromTopEdgeByPt": 200, "fromLeftEdgeByPt": 300 };
arrayOfLayoutBoxes.push(box1);

let box2 = new LayoutBox(parentWidth,parentHeight);
box2.pullAwayFromEdges = { "topEdgeByFrac": 0.1, "leftEdgeByFrac": 0.2 };
box2.extrude = { "fromTopEdgeByFrac": 0.5, "fromLeftEdgeByFrac": 0.4 };
arrayOfLayoutBoxes.push(box2);

let box3 = new LayoutBox(parentWidth,parentHeight);
box3.pullAwayFromEdges = { "topEdgeByPt": 15, "leftEdgeByFrac": 0.25 };
box3.extrude = { "fromTopEdgeByFrac": 0.6, "fromLeftEdgeByPt": 250 };
arrayOfLayoutBoxes.push(box3);

let box4 = new LayoutBox(parentWidth,parentHeight);
box4.pullAwayFromEdges = { "topEdgeByFrac": 0.05, "leftEdgeByPt": 30 };
box4.extrude = { "fromTopEdgeByPt": 180, "fromLeftEdgeByFrac": 0.3 };
arrayOfLayoutBoxes.push(box4);

let hStackBox = new GridLayoutBox(parentWidth,parentHeight);
hStackBox.pullAwayFromEdges = { "allEdgesByPt": 15 };//.pullAwayFromEdges = { "topEdgeByFrac": 0.01};
hStackBox.setHorizontalStack(6, 20);
arrayOfLayoutBoxes.push(hStackBox);


let twGrid = new GridLayoutBox(parentWidth,parentHeight);
twGrid.pullAwayFromEdges = { "allEdgesByPt": 15 };//.pullAwayFromEdges = { "topEdgeByFrac": 0.01};
twGrid.setGrid(9, 9, 5, 5);
//arrayOfLayoutBoxes.push(twGrid);


// for a box of buttons:
//.setGrid(30, 30, 3, 3);


//arrayOfLayoutBoxes.push(grid1);



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
grid3.cellSizeFracs = [
    { widthFrac: 0.25, heightFrac: 0.5 },
    { widthFrac: 0.25, heightFrac: 0.5 },
    { widthFrac: 0.25, heightFrac: 0.5 },
    { widthFrac: 0.25, heightFrac: 0.5 },
    // Second row cells
    { widthFrac: 0.15, heightFrac: 0.5 },
    { widthFrac: 0.35, heightFrac: 0.5 },
    { widthFrac: 0.25, heightFrac: 0.5 },
    { widthFrac: 0.25, heightFrac: 0.5 }
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
        //canvas.width = window.innerWidth;
        //canvas.height = window.innerHeight;

    // Iterate through arrayOfLayoutBoxes and draw each box
    for (let i = 0; i < arrayOfLayoutBoxes.length; i++) {
        arrayOfLayoutBoxes[i].drawOutline(ctx);
    }
        
    }
}

// Function to update dimensions of each box based on window size
function updateParentDimensions() {



    const canvas = document.getElementById('guiCanvas');
    if (canvas.getContext) {
        const ctx = canvas.getContext('2d');

    }

    for (let i = 0; i < arrayOfLayoutBoxes.length; i++) {
        // Assuming each box has a method `updateDimensions` 
        // that takes the new parent dimensions
        arrayOfLayoutBoxes[i].updateDimensions(canvas.width, canvas.height);
    }
}


window.onload = function () {
    updateParentDimensions();
    draw();
};

// Add event listener for window resize
window.onresize = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateParentDimensions();
    draw();
};