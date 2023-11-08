

class LayerManager {
  constructor(app) {
    this.layer1 = new Layer(window.CanvasKit);
    this.allLayers = [this.layer1];
    this.currentLayer = this.layer1;
    this.backgroundColor = null;
    this.app = app;

    this.layer1.generateRandomShapes();


  }

  appDidLoad() {
    this.backgroundColor = CanvasKit.Color(255, 0, 0, 1.0);
    this.setLayerManagerBackgroundColor(this.backgroundColor);
  }

  setLayerManagerBackgroundColor(bgColor) {
    this.backgroundColor = bgColor;
    // Create a new paint object with color blue
    this.backgroundColorPaint = new CanvasKit.Paint();
    paint.setColor(bgColor); // RGBA 
    paint.setStyle(CanvasKit.PaintStyle.Fill);
  }


  drawRectOnAllLayers(skCanvas, skRectFloat32Array) {

    //skCanvas.drawPaint();  
    if(this.backgroundColorPaint)
    {
    //skCanvas.drawRect(skRectFloat32Array, this.backgroundColorPaint);
    }
    else
    {
     //   console.log('f');
    }
//    alert('drawAlllayers');

    this.allLayers.forEach(layer => {
      layer.drawLayer(skCanvas, skRectFloat32Array);
    });
    
  }

}


class Layer {
  constructor(canvasKit) {
    this.canvasKit = canvasKit; // Store the CanvasKit instance

    this.rBush = new rbush(); // Initialize the rbush tree
    this.drawableObjects = []; // Keep a reference list of drawable objects

    this.backgroundColor = null;
    this.backgroundColorPaint = null;
  }

  // Method to generate random shapes
  generateRandomShapes(numberOfShapes = 10) {


    for (let i = 0; i < numberOfShapes; i++) {
      const shapeType = Math.floor(Math.random() * 3); // Randomly choose a shape type
      let drawable;
      switch (shapeType) {
        case 0: // Rectangle
          drawable = Drawable.createRectangle(
            this.canvasKit,
            Math.random() * 500, // Random x
            Math.random() * 500, // Random y
            Math.random() * 100 + 20, // Random width
            Math.random() * 100 + 20 // Random height
          );
          break;
        case 1: // Circle
          drawable = Drawable.createCircle(
            this.canvasKit,
            Math.random() * 500, // Random x for center
            Math.random() * 500, // Random y for center
            Math.random() * 50 + 10 // Random radius
          );
          break;
        case 2: // Line
          drawable = Drawable.createLine(
            this.canvasKit,
            Math.random() * 500, // Random x1
            Math.random() * 500, // Random y1
            Math.random() * 500, // Random x2
            Math.random() * 500 // Random y2
          );
          break;
        // Add more shapes if needed
      }
      this.addObject(drawable);
    }
  }


  setLayerManagerBackgroundColor(bgColor) {
    this.backgroundColor = bgColor;
    // Create a new paint object with color blue
    this.backgroundColorPaint = new CanvasKit.Paint();
    paint.setColor(bgColor); // RGBA 
    paint.setStyle(CanvasKit.PaintStyle.Fill);

  }

  // Method to draw all objects in the layer
  drawLayer(skCanvas, skRectFloat32) {
    console.log("layer draw");
    // Perform drawing with CanvasKit on the skCanvas
    this.drawableObjects.forEach(drawable => {
      drawable.draw(skCanvas);
    });
  }


  /*
   // Method to draw all objects in the layer
          //In this code, searchBounds is expected to be an array 
          // of the format [minX, minY, maxX, maxY], representing 
          // the area to draw. If skRectFloat32 is in a different 
          // format, you'll need to adjust the searchArea call accordingly.
          drawLayer(skCanvas, searchBounds) {
            console.log("layer draw");
              
                // Get all drawable objects in the search area
      const drawableObjectsInArea = this.searchArea({
        x: searchBounds[0],
        y: searchBounds[1],
        width: searchBounds[2] - searchBounds[0],
        height: searchBounds[3] - searchBounds[1],
      });
  
      // Perform drawing with CanvasKit on the skCanvas
      drawableObjectsInArea.forEach(drawable => {
        drawable.draw(skCanvas);
      });
    }
    */


  // Function to add objects to the rbush tree
  addObject(drawable) {
    // Calculate the item's bounding box (assuming drawable has a getBounds method)
    const item =  drawable.getBounds();//this.convertDrawableToBoundsItem(drawable);
    // Add the item to the rbush tree
    this.rBush.insert(item);
    // Keep a reference to the drawable object
    this.drawableObjects.push(drawable);
  }

  // Function to remove objects from the rbush tree
  removeObject(drawable) {
    // Find the item in the rbush tree
    const item = this.convertDrawableToBoundsItem(drawable);
    // Remove the item from the rbush tree
    this.rBush.remove(item);
    // Remove the drawable object from the reference list
    this.drawableObjects = this.drawableObjects.filter(obj => obj !== drawable);
  }

  // Function to update the position of objects in the rbush tree
  moveObject(drawable, newPosition) {
    // First remove the old item
    this.removeObject(drawable);
    // Update the drawable's position
    drawable.position = newPosition;
    // Re-add the updated drawable to the rbush tree
    this.addObject(drawable);
  }

  /*
  // Helper function to convert a drawable object to an rbush item
  convertDrawableToBoundsItem(drawable) {
    const bounds = drawable.getBounds(); // Your method to get drawable bounds
    return {
      minX: bounds.left,
      minY: bounds.top,
      maxX: bounds.right,
      maxY: bounds.bottom,
      drawable: drawable // Store reference to the drawable for later retrieval
    };
  }*/

  // Function to search the rbush tree
  searchArea(area) {
    // Convert search area to rbush format
    const searchBounds = {
      minX: area.x,
      minY: area.y,
      maxX: area.x + area.width,
      maxY: area.y + area.height
    };
    // Perform the search on the rbush tree
    return this.rBush.search(searchBounds).map(item => item.drawable);
  }

}
