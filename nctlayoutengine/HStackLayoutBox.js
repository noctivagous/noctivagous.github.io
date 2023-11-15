import GridLayoutBox from './GridLayoutBox.js';

class HStackLayoutBox extends GridLayoutBox {
    constructor(parentWidth, parentHeight, controlCount, gutterSize, guiControl = null, parent = null) {
        super(parentWidth, parentHeight, guiControl, parent);

        // Set up as a horizontal stack
        this.setHorizontalStack(controlCount, gutterSize);
    }
}

export default HStackLayoutBox;