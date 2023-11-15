import GridLayoutBox from '../GridLayoutBox.js';
import LayoutBox from '../LayoutBox.js';

var arrayOfLayoutBoxes = [];
        
let parentWidth = 500;
let parentHeight = 500;


/*<LayoutBox 
insetStart="
topEdgePt:10;
leftEdgePt:20" 

extrude="
fromTopEdgePt:200;
fromLeftEdgePt:300
">
</LayoutBox>*/


var box1LayoutBoxes = [];
var box2LayoutBoxes = [];
var box3LayoutBoxes = [];
var box4LayoutBoxes = [];
var hStackBoxes = [];
var twBoxes = [];

// Create instances of LayoutBox with desired settings
let box1 = new LayoutBox(parentWidth,parentHeight);
box1.insetStarts = { "topEdgePt": 10, "leftEdgePt": 20 };
box1.extrude = { "fromTopEdgePt": 200, "fromLeftEdgePt": 300 };
box1LayoutBoxes.push(box1);

let box2 = new LayoutBox(parentWidth,parentHeight);
box2.insetStarts = { "topEdgeRatio": 0.1, "leftEdgeRatio": 0.2 };
box2.extrude = { "fromTopEdgeRatio": 0.5, "fromLeftEdgeRatio": 0.4 };
box2LayoutBoxes.push(box2);



let box3 = new LayoutBox(parentWidth,parentHeight);
box3.insetStarts = { "topEdgePt": 15, "leftEdgeRatio": 0.25 };
box3.extrude = { "fromTopEdgeRatio": 0.6, "fromLeftEdgePt": 50 };
box3LayoutBoxes.push(box3);



let box4 = new LayoutBox(parentWidth,parentHeight);
box4.insetStarts = { "topEdgeRatio": 0.05, "leftEdgePt": 30 };
box4.extrude = { "fromTopEdgePt": 180, "fromLeftEdgeRatio": 0.3 };
box4LayoutBoxes.push(box4);




let hStackBox = new GridLayoutBox(parentWidth,parentHeight);
hStackBox.insetStarts = { "allEdgesPt": 15 };
hStackBox.setHorizontalStack(6, 20);
hStackBoxes.push(hStackBox);



let twGrid = new GridLayoutBox(parentWidth,parentHeight);
twGrid.insetStarts = { "allEdgesPt": 15 };
twGrid.setGrid(9, 9, 5, 5);
twBoxes.push(twGrid);


// Draw boxes on the canvas
function draw(canvas) {

    if (canvas.getContext) {
        const ctx = canvas.getContext('2d');

        // Resize canvas to full window size
        //canvas.width = parentWidth;
       // canvas.height = parentHeight;

        // Iterate through arrayOfLayoutBoxes and draw each box
        for (let i = 0; i < arrayOfLayoutBoxes.length; i++) {
            arrayOfLayoutBoxes[i].drawOutline(ctx);
        }
    }
}

// Function to update dimensions of each box based on window size
function updateParentDimensions() {
    for (let i = 0; i < box1LayoutBoxes.length; i++) {
        // Assuming each box has a method `updateDimensions` 
        // that takes the new parent dimensions
        box1LayoutBoxes[i].updateDimensions(parentWidth, parentWidth);
    }
}

function drawBox1() {
    const canvas = document.getElementById('box1Canvas');
    if (canvas.getContext) {
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Iterate through box1LayoutBoxes and draw each box
        for (let i = 0; i < box1LayoutBoxes.length; i++) {
            box1LayoutBoxes[i].drawOutline(ctx);
        }
    }
}

function drawBox2() {
    const canvas = document.getElementById('box2Canvas');
    if (canvas.getContext) {
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Iterate through box2LayoutBoxes and draw each box
        for (let i = 0; i < box2LayoutBoxes.length; i++) {
            box2LayoutBoxes[i].drawOutline(ctx);
        }
    }
}

function drawBox3() {
    const canvas = document.getElementById('box3Canvas');
    if (canvas.getContext) {
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Iterate through box2LayoutBoxes and draw each box
        for (let i = 0; i < box3LayoutBoxes.length; i++) {
            box3LayoutBoxes[i].drawOutline(ctx);
        }
    }
}

function drawBox4() {
    const canvas = document.getElementById('box4Canvas');
    if (canvas.getContext) {
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Iterate through box2LayoutBoxes and draw each box
        for (let i = 0; i < box4LayoutBoxes.length; i++) {
            box4LayoutBoxes[i].drawOutline(ctx);
        }
    }
}

function drawHBoxes()
{
    const canvas = document.getElementById('hStackBoxCanvas');
    if (canvas.getContext) {
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Iterate through box2LayoutBoxes and draw each box
        for (let i = 0; i < hStackBoxes.length; i++) {
            hStackBoxes[i].drawOutline(ctx);
        }
    }
}

function drawTwBoxes()
{
    const canvas = document.getElementById('twGridCanvas');
    if (canvas.getContext) {
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Iterate through box2LayoutBoxes and draw each box
        for (let i = 0; i < twBoxes.length; i++) {
            twBoxes[i].drawOutline(ctx);
        }
    }
}

// Repeat this for other canvases (box3, box4, hStackBox, twGrid, etc.)


window.onload = function () {
    updateParentDimensions();
    drawBox1(); // Call the drawBox1 function
    drawBox2(); // Call the drawBox2 function
    drawBox3(); // Call the drawBox2 function
    drawBox4(); // Call the drawBox2 function
    drawHBoxes();
    drawTwBoxes();

    // Call other draw functions as needed
};

// Add event listener for window resize
window.onresize = function () {
    updateParentDimensions();
};

// Function to resize canvas based on container size
function resizeCanvas() {
    const canvasContainers = document.querySelectorAll('.canvas-container');

    canvasContainers.forEach((container) => {
        const canvas = container.querySelector('canvas');
        const containerStyle = getComputedStyle(container);

        // Get the computed width and height of the container
        const containerWidth = parseInt(containerStyle.width, 10);
        const containerHeight = parseInt(containerStyle.height, 10);

        // Set canvas dimensions to match the container
        canvas.width = containerWidth;
        canvas.height = containerHeight;
    });
}

// Attach a resize event listener to the window
window.addEventListener('resize', resizeCanvas);

// Call the resizeCanvas function initially to set canvas sizes
resizeCanvas();

