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


  // called by cursormanager
  currentPointDidUpdate(newCurrentPoint)
  {
    if(this.isInDrawing)
    {
      this.pathManipulator.currentPointDidUpdate(newCurrentPoint);
    }
  }

setIsInDrawing(bool)
{
  this.isInDrawing = bool;
  if(this.isInDrawing = false)
  {
    this.pathManipulator.resetPath();
  }
}
  
scaleUp()
{
  
  this.layerManager.scaleCurrentSelection(1.1);
}

scaleDown()
{
  this.layerManager.scaleCurrentSelection(1/1.1);

}


scaleUpUpper1()
{
  
  this.layerManager.scaleCurrentSelection(1.6);
}

scaleDownUpper1()
{
  this.layerManager.scaleCurrentSelection(1/1.6);

}

scaleUpLower1()
{
  
  this.layerManager.scaleCurrentSelection(1.05);
}

scaleDownLower1()
{
  this.layerManager.scaleCurrentSelection(1/1.05);

}

scaleUpLower2()
{
  
  this.layerManager.scaleCurrentSelection(1.02);
}

scaleDownLower2()
{
  this.layerManager.scaleCurrentSelection(1/1.02);

}


rotateClockwise()
{
  this.layerManager.rotateCurrentSelection(15);
}


rotateCounterclockwise()
{
  this.layerManager.rotateCurrentSelection(-15);

}

rotateClockwiseUpper1()
{
  this.layerManager.rotateCurrentSelection(45);
}


rotateCounterclockwiseUpper1()
{
  this.layerManager.rotateCurrentSelection(-45);

}

rotateClockwiseLower1()
{
  this.layerManager.rotateCurrentSelection(5);
}


rotateCounterclockwiseLower1()
{
  this.layerManager.rotateCurrentSelection(-5);

}

rotateClockwiseLower2()
{
  this.layerManager.rotateCurrentSelection(1);
}


rotateCounterclockwiseLower2()
{
  this.layerManager.rotateCurrentSelection(-1);

}

end()
{
  if(this.isInDrawing)
  {
    this.pathManipulator.addLivePathToCurrentLayer();
    this.setIsInDrawing(false);
  }

}

closePathAndEnd()
{
  if(this.isInDrawing)
  {
    this.pathManipulator.closePath();
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