// Base class for all drawing entities
class DrawingEntity {
  constructor() {
    // Common properties for all drawing entities
  }

  onMouseDown(event) {
    // Common mouse down behavior
  }

  onMouseDrag(event) {
    // Common mouse drag behavior
  }

  onMouseUp(event) {
    // Common mouse up behavior
  }

  // Other common methods...
}

// Specific drawing entity
class RectangleDrawingEntity extends DrawingEntity {
  constructor() {
    super();
    // Rectangle-specific properties
  }

  // Rectangle-specific methods...
}

// Specific drawing entity
class ArcDrawingEntity extends DrawingEntity {
    constructor() {
      super();
      // Rectangle-specific properties
    }
  
    // Rectangle-specific methods...
  }
