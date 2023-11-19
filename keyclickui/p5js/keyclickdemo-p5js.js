// Global variables for managing state
let shapes = [];
let polylinePoints = [];
let currentShape = null;
let selectedObject = null;
let dragLock = false;
let strokeWeightValue = 1;
let isInDrawing = false;

let currentState = "idle";

function setup() {
    createCanvas(700, 500);
    background(200);
    // Initialize other necessary variables and states
}


function draw() {
    background(200);

    for (let shape of shapes) {
        shape.draw();
    }

    if (isInDrawing && currentShape) {
        currentShape.draw();
    }
  
  let p1 = createVector(25, 25);
let p2 = createVector(50, 50);
let p3 = createVector(75, 75);

    text(currentState, 10, 20);


}




function keyPressed() {
  
  //print(key);
  
    switch(key) {
        case 'f':
            if (!isInDrawing) {
                isInDrawing = true;
                currentShape = new PolylineShape();
                shapes.push(currentShape);
                currentShape.addPoint(mouseX, mouseY);
            }
        
            
            currentShape.addPoint(mouseX, mouseY);
        
            break;
            
        case 'a':
                    isInDrawing = false;

            // End path
            break;
        case 'e':
                    isInDrawing = false;

            // End and fill shape
            break;
        case 'r':
                    isInDrawing = false;

            // End and stroke shape
            break;
        case 's':
                    isInDrawing = false;

            // End, fill and stroke shape
            break;
        case 'TAB':
            // Select object
            break;
        case ' ':
            // Toggle drag lock
            break;
        case 'w':
            // Stamp a selection while dragging
            break;
        case '[':
            // Scale down
            break;
        case ']':
            // Scale up
            break;
        case ';':
            // Rotate left
            break;
        case '\'':
            // Rotate right
            break;
        case 'c':
            // Decrease stroke weight
            break;
        case 'v':
            // Increase stroke weight
            break;
        case 'ESC':
            // Cancel selection and dragging
            break;
    }
}

function mouseMoved() {
  
    // Handle mouse movement for drawing and object manipulation
  

    if (isInDrawing) {
        currentShape.updateLastPoint(mouseX, mouseY);
    }
}


class PolylineShape {
    constructor() {
        this.points = [];
    }

    addPoint(x, y) {
        
        this.points.push(createVector(x, y));
    }

    draw() {
        beginShape();
        for (let pt of this.points) {
            vertex(pt.x, pt.y);
        }
        endShape();
      
      for (let pt of this.points) {
      
          strokeWeight(5);
          point(pt);
        
        }
      
    }
  
  updateLastPoint(x, y) {
    
        if (this.points.length > 0) {
            this.points[this.points.length - 1] = createVector(x, y);
        }
    }
  
}

// Additional functions for drawing shapes, selecting objects, and transforming objects
