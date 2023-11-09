// Manage all input events
class EventManager {
    constructor(app,keyboardMappingManager, drawingEntityManager) {
      this.keyboardMappingManager = keyboardMappingManager;
      this.drawingEntityManager = drawingEntityManager;
      this.layerManager = app.layerManager;
    
      this.htmlCanvas = app.htmlCanvas;
      this.app = app;
      
//      this.drawables = this.layerManager.getCurrentLayerDrawables(); // This is an array or another data structure containing all drawable objects
 
this.attachEventListeners();
//  this.bindEvents();

    }

attachEventListeners() {

  // Listen for events on the canvas, not individual drawables
  this.htmlCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
  this.htmlCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
  this.htmlCanvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

  // Bind keyboard events
  document.addEventListener('keydown', (event) => this.keyboardMappingManager.handleKeyPress(event));
}

handleMouseDown(event) {
  this.layerManager.detectHitOnCurrentLayer(event.offsetX, event.offsetY);

}

handleMouseMove(event) {
  // This would be called only if dragging is in progress
}

handleMouseUp(event) {
  // This would end the dragging process
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