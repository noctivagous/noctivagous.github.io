import GridLayoutBox from './GridLayoutBox.js';

class VStackLayoutBox extends GridLayoutBox {
    constructor(parentWidth, parentHeight, controlCount, gutterSize, guiControl = null, parent = null) {
        super(parentWidth, parentHeight, guiControl, parent);

        // Set up as a vertical stack
        this.setVerticalStack(controlCount, gutterSize);
    }
}

export default VStackLayoutBox;