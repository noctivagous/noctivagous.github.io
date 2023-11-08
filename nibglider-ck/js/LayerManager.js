

class LayerManager {
  constructor(app) {
    var layer1 = new Layer();
    this.allLayers = [layer1];
    this.currentLayer = layer1;
    this.backgroundColor = null;
    this.app = app;
  }

  appDidLoad()
  {
    this.backgroundColor = CanvasKit.Color(255, 0, 0, 1.0);
    this.setLayerManagerBackgroundColor(this.backgroundColor);
  }
  
  setLayerManagerBackgroundColor(bgColor)
  {
    this.backgroundColor = bgColor;
        // Create a new paint object with color blue
        this.backgroundColorPaint = new CanvasKit.Paint();
        paint.setColor(bgColor); // RGBA 
        paint.setStyle(CanvasKit.PaintStyle.Fill);
  }


  drawRectOnAllLayers(skCanvas, skRectFloat32Array) {
  
    //skCanvas.drawPaint();  
      skCanvas.drawRect(skRectFloat32Array, this.backgroundColorPaint);


    this.allLayers.forEach(layer => {
      layer.drawLayer(skCanvas);
    });
  }

}


class Layer{
    constructor() {
        this.rBush = new rbush(); // Initialize the rbush tree
        this.drawableObjects = []; // Keep a reference list of drawable objects
    
      this.backgroundColor = null;
      this.backgroundColorPaint = null;
    }
  
    
    setLayerManagerBackgroundColor(bgColor)
    {
      this.backgroundColor = bgColor;
          // Create a new paint object with color blue
          this.backgroundColorPaint = new CanvasKit.Paint();
          paint.setColor(bgColor); // RGBA 
          paint.setStyle(CanvasKit.PaintStyle.Fill);
    
        }

        // Method to draw all objects in the layer
        drawLayer(skCanvas) {
          console.log("layer draw");
            // Perform drawing with CanvasKit on the skCanvas
            this.drawableObjects.forEach(drawable => {
              drawable.draw(skCanvas);
            });
          }

  // Function to add objects to the rbush tree
  addObject(drawable) {
    // Calculate the item's bounding box (assuming drawable has a getBounds method)
    const item = this.convertDrawableToBoundsItem(drawable);
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
  }

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
