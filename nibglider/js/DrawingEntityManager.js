// Manage the drawing states
class DrawingEntityManager {
  constructor() {
    this.entities = {
      rectangle: new RectangleDrawingEntity(),
      arc: new ArcDrawingEntity(),
      // Add other entities...
    };
    this.currentEntity = null; // The entity currently being used
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
