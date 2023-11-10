// Manage the drawing states


class DrawingEntityManager {
  constructor(app) {
    this.app = app;
    this.entities = {
      rectangle: new RectangleDrawingEntity(),
      arc: new ArcDrawingEntity(),
      // Add other entities...
    };
    this.currentEntity = null; // The entity currently being used

    this.isInDrawing = false;
  }


  cancelOperations()
  {
    if (this.isInDrawing) {
      
    }
  }




  switchEntity(entityName) {
    if (this.entities[entityName]) {
      this.currentEntity = this.entities[entityName];
    } else {
      console.error(`Drawing entity ${entityName} not found`);
    }
  }

  // Entity event handlers that delegate to the current entity
  onMouseDown(event) {
    this.currentEntity?.onMouseDown(event);
  }

  onMouseDrag(event) {
    this.currentEntity?.onMouseDrag(event);
  }

  onMouseUp(event) {
    this.currentEntity?.onMouseUp(event);
  }

  // Other methods...
}


export default DrawingEntityManager;