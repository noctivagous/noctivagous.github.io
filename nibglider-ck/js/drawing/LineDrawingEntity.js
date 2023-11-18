import { DrawingEntity } from "./DrawingEntity.js";
// Specific drawing entity
class LineDrawingEntity extends DrawingEntity {
    constructor(app, drawingEntityManager, paintManager, pathManipulator) {
        super(app, drawingEntityManager, paintManager, pathManipulator);

    }

    hardCorner() {

        if (this.isInDrawing) {
            this.pathManipulator.addHardCorner(this.app.mouseX, this.app.mouseY);
        }
        else {
            if (this.pathManipulator == null) {
                this.pathManipulator = this.app.pathManipulator;
            }
            this.isInDrawing = true;
            this.pathManipulator.resetPath();
            this.pathManipulator.addHardCorner(this.app.mouseX, this.app.mouseY);
        }
        this.app.invalidateEntireCanvas();

    }


}

export default LineDrawingEntity;