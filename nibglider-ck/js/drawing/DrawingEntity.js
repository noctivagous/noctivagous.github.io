// Base class for all drawing entities
export class DrawingEntity {
  constructor(app,drawingEntityManager) {
    this.app = window.app;
    this.drawingEntityManager = drawingEntityManager;
    
    this.paintManager = window.app.paintManager;
    this.pathManipulator = window.app.pathManipulator;
    this.isCurrentEntity = false;
    // Common properties for all drawing entities
  }

  getCurrentPoint()
  {
    return this.drawingEntityManager.getCurrentPoint();
  }

  mouseMoved()
  {

  }

  mouseDown(event) {
    // Common mouse down behavior
  }

  mouseDrag(event) {
    // Common mouse drag behavior
  }

  mouseUp(event) {
    // Common mouse up behavior
  }

  // Other common methods...
}




// Specific drawing entity
export class RectangleDrawingEntity extends DrawingEntity {
  constructor() {
    super();
    // Rectangle-specific properties
  }

  // Rectangle-specific methods...
}

// Specific drawing entity
export class ArcDrawingEntity extends DrawingEntity {
    constructor() {
      super();
      // Rectangle-specific properties
    }
  
    // Rectangle-specific methods...
  }

  