// Manage the drawing states

import  {PathManipulator, NGPath}  from './PathManipulator.js';

class DrawingEntityManager {
  constructor(app) {
    this.app = app;
    this.pathManipulator = app.pathManipulator;
    this.layerManager = app.layerManager;
    this.entities = {
      rectangle: new RectangleDrawingEntity(),
      arc: new ArcDrawingEntity(),
      // Add other entities...
    };
    this.currentEntity = null; // The entity currently being used

    this.isInDrawing = false;
  }


setIsInDrawing(bool)
{
  this.isInDrawing = bool;
  if(this.isInDrawing = false)
  {
    this.pathManipulator.resetPath();
  }
}
  


end()
{
  if(this.isInDrawing)
  {
    this.pathManipulator.addLivePathToCurrentLayer();
    this.setIsInDrawing(false);
  }

}

  cancelOperations()
  {
    if (this.isInDrawing) {
      setIsInDrawing(false);

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

  draw(skCanvas)
  {
    if (this.isInDrawing) {
      this.pathManipulator.drawLivePathDrawable(); 
    }
  }




  hardCorner()
  {
    if (this.isInDrawing) {
      this.pathManipulator.addHardCorner(this.app.mouseX,this.app.mouseY);
    }
    else
    {
      if(this.pathManipulator == null)
      {
      this.pathManipulator = this.app.pathManipulator
      }
      this.isInDrawing = true;
      this.pathManipulator.resetPath();
      this.pathManipulator.addHardCorner(this.app.mouseX,this.app.mouseY);
    }
    this.app.invalidateEntireCanvas();

  }

  // Other methods...
}


export default DrawingEntityManager;