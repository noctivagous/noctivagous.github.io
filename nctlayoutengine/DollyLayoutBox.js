class DollyLayoutBox extends LayoutBox {
    constructor() {
        super();
        this.trackStart = 0; // Starting point of the track
        this.trackEnd = 1; // Ending point of the track
        this.currentPosition = 0; // Current position of the dolly on the track
        this.orientation = 'horizontal'; // 'horizontal' or 'vertical'


        // In modern scrollbars, the size of the dolly 
        // (or thumb) often represents the proportion of the 
        // visible area relative to the total content length. 
        this.contentLength = 1; // Total length of the content, for a scrollbar
        this.visibleLength = 1; // Length of the visible content, for a scrollbar

    }

    // For scrollbars:
    // Set the total content length
    setContentLength(length) {
        this.contentLength = length;
    }

    // Set the visible content length
    setVisibleLength(length) {
        this.visibleLength = length;
    }



    // Method to update the position of the dolly
    updatePosition(newPosition) {
        // Ensure the new position is within the track bounds
        this.currentPosition = Math.min(Math.max(newPosition, this.trackStart), this.trackEnd);
    }

    // Method to set orientation
    setOrientation(orientation) {
        this.orientation = orientation;
    }

    calculateDimensions(parentWidth, parentHeight) {
        // Calculate the dolly's size as a proportion of the content that's visible
        const proportionVisible = this.visibleLength / this.contentLength;
        
        // Use the base class to calculate the overall dimensions
        const baseDimensions = super.calculateDimensions(parentWidth, parentHeight)[0];

        let dollyPosition, dollySize;

        if (this.orientation === 'horizontal') {
            dollySize = baseDimensions.width * proportionVisible;
            dollyPosition = baseDimensions.x + (baseDimensions.width - dollySize) * this.currentPosition;
            return {
                x: dollyPosition,
                y: baseDimensions.y,
                width: dollySize,
                height: baseDimensions.height
            };
        } else {
            dollySize = baseDimensions.height * proportionVisible;
            dollyPosition = baseDimensions.y + (baseDimensions.height - dollySize) * this.currentPosition;
            return {
                x: baseDimensions.x,
                y: dollyPosition,
                width: baseDimensions.width,
                height: dollySize
            };
        }
    }
    
    calculateDimensions(parentWidth, parentHeight) {

       // Calculate the dolly's size as a proportion of the content that's visible
       const proportionVisible = this.visibleLength / this.contentLength;
        
        // Use the base class to calculate the overall dimensions
        const baseDimensions = super.calculateDimensions(parentWidth, parentHeight)[0];


       let dollyPosition, dollySize;



        if (this.orientation === 'horizontal') {
            // Horizontal track
            dollyPosition = baseDimensions.x + (baseDimensions.width * this.currentPosition);
            return {
                x: dollyPosition,
                y: baseDimensions.y,
                width: baseDimensions.width, // Width of the dolly, adjust as needed
                height: baseDimensions.height
            };
        } else {
            // Vertical track
            dollyPosition = baseDimensions.y + (baseDimensions.height * this.currentPosition);
            return {
                x: baseDimensions.x,
                y: dollyPosition,
                width: baseDimensions.width,
                height: baseDimensions.height // Height of the dolly, adjust as needed
            };
        }
    }
}

/*
For a scrollbar:

let dollyBox = new DollyLayoutBox();
dollyBox.setOrientation('vertical');
dollyBox.setContentLength(1000); // Total length of the content
dollyBox.setVisibleLength(200); // Length of the visible content
dollyBox.updatePosition(0.3); // Set position along the track

let dollyDimensions = dollyBox.calculateDimensions(parentWidth, parentHeight);
// This will give the position and size of the dolly, proportionate to the visible content

*/


class ProgressBarBox extends LayoutBox {
    constructor() {
        super();
        this.progress = 0; // Progress percentage (0 to 1)
        this.orientation = 'horizontal'; // Default to horizontal
    }

    // Set progress
    setProgress(progress) {
        this.progress = Math.max(0, Math.min(progress, 1)); // Clamp between 0 and 1
    }

    calculateDimensions(parentWidth, parentHeight) {
        const baseDimensions = super.calculateDimensions(parentWidth, parentHeight)[0];

        let dollySize;

        if (this.orientation === 'horizontal') {
            dollySize = baseDimensions.width * this.progress;
            return {
                x: baseDimensions.x, // Fixed at start of track
                y: baseDimensions.y,
                width: dollySize,
                height: baseDimensions.height
            };
        } else {
            dollySize = baseDimensions.height * this.progress;
            return {
                x: baseDimensions.x,
                y: baseDimensions.y, // Fixed at start of track
                width: baseDimensions.width,
                height: dollySize
            };
        }
    }
}

/*
USAGE

let progressBar = new ProgressBarBox();
progressBar.setProgress(0.5); // Set to 50% progress
progressBar.setOrientation('horizontal'); // Optional, default is horizontal

let progressBarDimensions = progressBar.calculateDimensions(parentWidth, parentHeight);
// This gives the dimensions of the progress bar at 50% completion


The setProgress method is used to update the progress percentage. It clamps the value between 0 and 1 to ensure valid progress values.
The calculateDimensions method calculates the size of the dolly (progress bar fill) based on the progress percentage.
For a horizontal progress bar, the width of the dolly changes with progress. For a vertical progress bar, the height changes.

*/