// Manage all input events
class EventManager {
  constructor(app, keyboardMappingManager, drawingEntityManager) {
    this.keyboardMappingManager = keyboardMappingManager;
    this.drawingEntityManager = drawingEntityManager;
    this.layerManager = app.layerManager;
    this.cursorManager = app.cursorManager;
    this.htmlCanvas = app.htmlCanvas;
    this.app = app;

    //      this.drawables = this.layerManager.getCurrentLayerDrawables(); // This is an array or another data structure containing all drawable objects

    this.setupEventListeners();
    //  this.bindEvents();

  }

  setupEventListeners() {
    // Existing mouse event listeners
    this.htmlCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.htmlCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.htmlCanvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Bind keyboard events
    window.addEventListener('keydown', function (event) {
      if (event.key === ' ' || event.key === 'Tab') {
        event.preventDefault();
      }
    });

    document.addEventListener('keydown', (event) => this.keyboardMappingManager.handleKeyPress(event));

    document.addEventListener('keyup', (event) => this.keyboardMappingManager.handleKeyUp(event));

    // Wheel event listener for handling scroll wheel interactions
    //this.htmlCanvas.addEventListener('wheel', this.handleWheelEvent.bind(this));
    //this.htmlCanvas.addEventListener('wheel', this.handleTrackpadGesture.bind(this));


    /*
    // Touch event listeners for gestures
    this.htmlCanvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.htmlCanvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.htmlCanvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Optional: Prevent scrolling when touching the canvas
    this.htmlCanvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
   */
  
  }


  handleMouseMove(event) {

    /* if (!event.pressure) {
       return;
     }*/

    this.app.mouseX = event.offsetX;
    this.app.mouseY = event.offsetY;


    this.cursorManager.updateCursorPosition(this.app.mouseX, this.app.mouseY);

    if(this.layerManager.handleMouseMove(event))
    {

    }


  }

  copy(){


  }

  paste()
  {


  }


  handleMouseDown(event) {

    this.app.mouseX = event.offsetX;
    this.app.mouseY = event.offsetY;

    this.cursorManager.updateCursorPosition(this.app.mouseX, this.app.mouseY);

    // in the future,
    // different keys for selecting points on objects vs. 
    // the objects themselves.
    // and also different uses of a hitTest on the currentLayer
    this.layerManager.selectionHitTestOnCurrentLayer(event.offsetX, event.offsetY);


  }


  handleMouseUp(event) {
    // This would end the dragging process

    this.app.mouseX = event.offsetX;
    this.app.mouseY = event.offsetY;

    this.cursorManager.updateCursorPosition(this.app.mouseX, this.app.mouseY);

  }


  handleTrackpadGesture(event) {
    // also could be called handleWheelInteraction

       /*
    When a user performs a two-finger swipe on a trackpad, the browser interprets this as a scroll action and fires wheel events.

The properties deltaX, deltaY, and deltaZ of the wheel event object give information about the direction and intensity of the swipe:

deltaX gives horizontal scroll information (left/right).
deltaY gives vertical scroll information (up/down).
deltaZ is less commonly used but can indicate scroll depth in some contexts.

The intensity of the swipe is represented by the magnitude of deltaX and deltaY. Larger values indicate faster swipes.
The sign (+ or -) of these values indicates direction.
*/

    if (event.ctrlKey) {
      // Handle zooming (pinch gesture)
      this.handleZoomGesture(event);
    } else {
      // Handle scrolling/panning
      this.handleScrollOrPanGesture(event);
    }
  }

  handleZoomGesture(event) {
    event.preventDefault();
    // Implement zooming logic here based on event.deltaY

     // Example: Zooming based on deltaY
    // You might want to scale these values or implement additional logic for smoother zooming
    if (deltaY < 0) {
      console.log('Zooming in');
      // Implement zoom-in logic
    } else if (deltaY > 0) {
      console.log('Zooming out');
      // Implement zoom-out logic
    }

    /*
    ZOOM
    Using the wheel Event with a Control Modifier: 
    Some browsers send a wheel event with a special 
    modifier when a pinch gesture is performed. 
    You can check for the ctrlKey property of the wheel 
    event to distinguish between regular scrolling and 
    pinch-to-zoom gestures.
    */
    if (event.ctrlKey) { // Check if the control key is pressed during the wheel event

      const delta = event.deltaY;

      if (delta < 0) {
        // Implement zoom-in logic
      } else {
        // Implement zoom-out logic
      }
    }


  }

  handleScrollOrPanGesture(event) {
    event.preventDefault();
 
    // Access the scroll delta values
    const deltaX = event.deltaX;
    const deltaY = event.deltaY;
    const deltaZ = event.deltaZ;

    // Handle the wheel event, e.g., for zooming or scrolling in the canvas
    // ...

  }


 

  // Example handler functions for touch events
  handleTouchStart(event) {
    // Handle touch start
    // You can use event.touches to access touch points
  }

  handleTouchMove(event) {
    // Handle touch move
    // You can use event.touches to access touch points
  }

  handleTouchEnd(event) {
    // Handle touch end
  }



  handleImageDrop(event) {
    const dataTransfer = event.dataTransfer;
    const { files } = dataTransfer;

    if (files.length > 0) {
      const file = files[0];
      const imageType = /image.*/;
      const svgType = /image\/svg\+xml/;

      if (file.type.match(svgType)) {
        const reader = new FileReader();
        reader.onload = function (e) {

          /*
          //--- convert from paperjs:

             paper.project.importSVG(e.target.result, function (item) {
               // SVG has been imported, you can manipulate it here
               item.position = new paper.Point(event.layerX, event.layerY);
             });
          */

        };
        reader.readAsText(file);
      } else if (file.type.match(imageType)) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const image = new Image();
          image.onload = function () {

            /*
            //---- convert from
            // Create a Paper.js Raster item from the image
            const raster = new paper.Raster(image);
            raster.position = new paper.Point(event.layerX, event.layerY);
          */

          };
          image.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  }

}



export default EventManager;  