// Manage the drawing states

import { PathManipulator, NGPath } from './PathManipulator.js';
import LineDrawingEntity from './LineDrawingEntity.js';
import { RectangleDrawingEntity, ArcDrawingEntity } from './DrawingEntity.js';
class DrawingEntityManager {
  constructor(app) {
    this.app = app;
    this.pathManipulator = app.pathManipulator;
    this.paintManager = app.paintManager;
    this.layerManager = app.layerManager;
    this.cursorManager = app.cursorManager;
    this.entities = null
    this.currentEntity = null; // The entity currently being used

    this.isInDrawing = false;
  }

  initializeDrawingEntities()
  {
    this.entities = {
      line: new LineDrawingEntity(app,this),
      rectangle: new RectangleDrawingEntity(app,this),
      arc: new ArcDrawingEntity(app.this),
      // Add other entities...
    };

  }

  switchEntity(entityName) {
    if (this.entities[entityName]) {
      this.currentEntity = this.entities[entityName];
    } else {
      console.error(`Drawing entity ${entityName} not found`);
    }
  }

  getCurrentPoint() {
    return this.cursorManager.currentPoint;
  }
  // called by cursormanager
  currentPointDidUpdate(newCurrentPoint) {
    if (this.isInDrawing) {

      this.pathManipulator.currentPointDidUpdate(newCurrentPoint);
    }
  }

  setIsInDrawing(bool) {
    this.isInDrawing = bool;
    if (this.isInDrawing = false) {
      this.pathManipulator.resetPath();
    }
  }

  setCurrentDrawingEntity(entity)
  {
    this.currentEntity = entity;
    this.currentEntity.isCurrentEntity = false;
    entity.isCurrentEntity = true;
  }

  // ------------------------
  // line drawing keys
  // ------------------------
  hardCorner() {

    if (this.isInDrawing && (this.currentEntity == this.entities.line)) 
    {
      this.entities.line.hardCorner();

    }
    else if (this.isInDrawing && (this.currentEntity != this.entities.line)) 
    {
      this.end();
      this.setIsInDrawing(false);
     this.setCurrentDrawingEntity(this.entities.line);
      this.setIsInDrawing(true);
    }
    else
    {
      this.setCurrentDrawingEntity(this.entities.line);
      this.setIsInDrawing(true);
      this.entities.line.hardCorner();
    }


  }


  // ------------------------
  // drawing sequence commands
  // ------------------------
  end() {
    if (this.isInDrawing) {
      this.pathManipulator.addLivePathToCurrentLayer();
      this.setIsInDrawing(false);
    }

  }

  endOperations()
  {
    this.end();
  }

  closePathAndEnd() {
    if (this.isInDrawing) {
      this.pathManipulator.closePath();
      this.pathManipulator.addLivePathToCurrentLayer();
      this.setIsInDrawing(false);
    }


  }

  cancelOperations() {

    if (this.isInDrawing) {
      setIsInDrawing(false);
      alert('f');
      this.pathManipulator.resetPath();

    }
  }


  // ------------------------
  // Styling commands
  // ------------------------
  thickenStroke() {
    this.paintManager.thickenStroke();
  }

  thinStroke() {
    this.paintManager.thinStroke();
  }

  makePaintStyleFill() {
    this.paintManager.makePaintStyleFill();
  }

  makePaintStyleStroke() {
    this.paintManager.makePaintStyleStroke();
  }




  // ------------------------
  // Drawing order commands
  // ------------------------
  bringSelectionToFront() {
    this.layerManager.bringSelectionToFront();
  }

  sendSelectionToBack() {
    this.layerManager.sendSelectionToBack();
  }

  bringSelectionForward() {
    this.layerManager.bringSelectionForward();
  }

  sendSelectionBackward() {
    this.layerManager.sendSelectionBackward();
  }




    // ------------------------
  // Events
  // ------------------------

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

  draw(skCanvas) {
    if (this.isInDrawing) {
      this.pathManipulator.drawLivePathDrawable();
    }
  }






  // ------------------------------------------------
  // TRANSFORMATION OPERATIONS
  // ------------------------------------------------
  scaleUp() {

    this.layerManager.scaleCurrentSelection(1.1);
  }

  scaleDown() {
    this.layerManager.scaleCurrentSelection(1 / 1.1);

  }


  scaleUpUpper1() {

    this.layerManager.scaleCurrentSelection(1.3);
  }

  scaleDownUpper1() {
    this.layerManager.scaleCurrentSelection(1 / 1.3);

  }




  scaleUpUpper2() {

    this.layerManager.scaleCurrentSelection(1.4);
  }

  scaleDownUpper2() {
    this.layerManager.scaleCurrentSelection(1 / 1.4);

  }






  scaleUpLower1() {

    this.layerManager.scaleCurrentSelection(1.05);
  }

  scaleDownLower1() {
    this.layerManager.scaleCurrentSelection(1 / 1.05);

  }

  scaleUpLower2() {

    this.layerManager.scaleCurrentSelection(1.015);
  }

  scaleDownLower2() {

    this.layerManager.scaleCurrentSelection(1 / 1.015);

  }

  liveScaling() {

  }

  liveXOrYScaling() {

  }

  liveShearing() {

  }


  rotateClockwise() {
    this.layerManager.rotateCurrentSelection(15);
  }


  rotateCounterclockwise() {
    this.layerManager.rotateCurrentSelection(-15);

  }

  rotateClockwiseUpper1() {
    this.layerManager.rotateCurrentSelection(45);
  }


  rotateCounterclockwiseUpper1() {
    this.layerManager.rotateCurrentSelection(-45);

  }



  rotateClockwiseUpper2() {
    this.layerManager.rotateCurrentSelection(90);
  }


  rotateCounterclockwiseUpper2() {
    this.layerManager.rotateCurrentSelection(-90);

  }


  rotateClockwiseLower1() {
    this.layerManager.rotateCurrentSelection(5);
  }


  rotateCounterclockwiseLower1() {
    this.layerManager.rotateCurrentSelection(-5);

  }

  rotateClockwiseLower2() {
    this.layerManager.rotateCurrentSelection(1);
  }


  rotateCounterclockwiseLower2() {
    this.layerManager.rotateCurrentSelection(-1);

  }

  // Move selection up by 10 units
  arrowUp() {
    this.layerManager.moveCurrentSelection(270, 10);
  }

  // Move selection down by 10 units
  arrowDown() {
    this.layerManager.moveCurrentSelection(90, 10);
  }

  // Move selection left by 10 units
  arrowLeft() {
    this.layerManager.moveCurrentSelection(180, 10);
  }

  // Move selection right by 10 units
  arrowRight() {
    this.layerManager.moveCurrentSelection(0, 10);
  }

  // Move selection up by 20 units (with Shift)
  arrowUpUpper1() {
    this.layerManager.moveCurrentSelection(270, 20);
  }

  // Move selection down by 20 units (with Shift)
  arrowDownUpper1() {
    this.layerManager.moveCurrentSelection(90, 20);
  }

  // Move selection left by 20 units (with Shift)
  arrowLeftUpper1() {
    this.layerManager.moveCurrentSelection(180, 20);
  }

  // Move selection right by 20 units (with Shift)
  arrowRightUpper1() {
    this.layerManager.moveCurrentSelection(0, 20);
  }


  // Move selection up by 5 units (with Option)
  arrowUpLower1() {
    this.layerManager.moveCurrentSelection(270, 5);
  }

  // Move selection down by 5 units (with Option)
  arrowDownLower1() {
    this.layerManager.moveCurrentSelection(90, 5);
  }

  // Move selection left by 5 units (with Option)
  arrowLeftLower1() {
    this.layerManager.moveCurrentSelection(180, 5);
  }

  // Move selection right by 5 units (with Option)
  arrowRightLower1() {
    this.layerManager.moveCurrentSelection(0, 5);
  }

  // Move selection up by 40 units (with Ctrl+Shift)
  arrowUpUpper2() {
    this.layerManager.moveCurrentSelection(270, 40);
  }

  // Move selection down by 10 units (with Ctrl+Shift)
  arrowDownUpper2() {
    this.layerManager.moveCurrentSelection(90, 40);
  }

  // Move selection left by 10 units (with Ctrl+Shift)
  arrowLeftUpper2() {
    this.layerManager.moveCurrentSelection(180, 40);
  }

  // Move selection right by 10 units (with Ctrl+Shift)
  arrowRightUpper2() {
    this.layerManager.moveCurrentSelection(0, 40);
  }

  // Move selection up by 5 units (with Ctrl+Option)
  arrowUpLower2() {
    this.layerManager.moveCurrentSelection(270, 1);
  }

  // Move selection down by 5 units (with Ctrl+Option)
  arrowDownLower2() {
    this.layerManager.moveCurrentSelection(90, 1);
  }

  // Move selection left by 5 units (with Ctrl+Option)
  arrowLeftLower2() {
    this.layerManager.moveCurrentSelection(180, 1);
  }

  // Move selection right by 5 units (with Ctrl+Option)
  arrowRightLower2() {
    this.layerManager.moveCurrentSelection(0, 1);
  }


}


export default DrawingEntityManager;