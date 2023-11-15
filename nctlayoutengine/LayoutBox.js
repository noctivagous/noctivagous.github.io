class LayoutBox {
    constructor(parentWidthPassed, parentHeightPassed) {
        this.parentWidth = parentWidthPassed;
        this.parentHeight = parentHeightPassed;

        this.initialInsets = null; // { "topEdgeRatio": 0.33, "leftEdgeFixedPt": 10 }
        // { "allEdgesFixedPt": 10 } for a uniform margin
        this.dimensionsByInsetting = null; // { "fromTopEdgeRatio": 0.33, "fromLeftEdgeFixedPt": 300 }
        this.adhereToEdges = []; // ["right", "left"]
        this.adhereToCorners = []; // ["bottomLeft", "bottomRight"]

    }


    updateDimensions(parentWidthPassed,parentHeightPassed)
    {
        this.parentWidth = parentWidthPassed;
        this.parentHeight = parentHeightPassed;
    }

    calculateDimensions(parentWidth, parentHeight) {
        let width = parentWidth, height = parentHeight, x = 0, y = 0;
        let isStretched = false;

        // Calculate initial insets
        if (this.initialInsets) {
            // Top edge
            if (this.initialInsets.topEdgeRatio !== undefined) {
                y += parentHeight * this.initialInsets.topEdgeRatio;
                height -= parentHeight * this.initialInsets.topEdgeRatio;
            } else if (this.initialInsets.topEdgeFixedPt !== undefined) {
                y += this.initialInsets.topEdgeFixedPt;
                height -= this.initialInsets.topEdgeFixedPt;
            }

            // Right edge
            if (this.initialInsets.rightEdgeRatio !== undefined) {
                width -= parentWidth * this.initialInsets.rightEdgeRatio;
            } else if (this.initialInsets.rightEdgeFixedPt !== undefined) {
                width -= this.initialInsets.rightEdgeFixedPt;
            }

            // Bottom edge
            if (this.initialInsets.bottomEdgeRatio !== undefined) {
                height -= parentHeight * this.initialInsets.bottomEdgeRatio;
            } else if (this.initialInsets.bottomEdgeFixedPt !== undefined) {
                height -= this.initialInsets.bottomEdgeFixedPt;
            }

            // Left edge
            if (this.initialInsets.leftEdgeRatio !== undefined) {
                x += parentWidth * this.initialInsets.leftEdgeRatio;
                width -= parentWidth * this.initialInsets.leftEdgeRatio;
            } else if (this.initialInsets.leftEdgeFixedPt !== undefined) {
                x += this.initialInsets.leftEdgeFixedPt;
                width -= this.initialInsets.leftEdgeFixedPt;
            }
        }

        // Calculate width and height based on dimensionsByInsetting
        if (this.dimensionsByInsetting) {
            // Top edge
            if (this.dimensionsByInsetting.fromTopEdgeRatio !== undefined) {
                height *= this.dimensionsByInsetting.fromTopEdgeRatio;
            } else if (this.dimensionsByInsetting.fromTopEdgeFixedPt !== undefined) {
                height = this.dimensionsByInsetting.fromTopEdgeFixedPt;
            }

            // Right edge
            if (this.dimensionsByInsetting.fromRightEdgeRatio !== undefined) {
                width = parentWidth * (1 - this.dimensionsByInsetting.fromRightEdgeRatio);
            } else if (this.dimensionsByInsetting.fromRightEdgeFixedPt !== undefined) {
                width = parentWidth - this.dimensionsByInsetting.fromRightEdgeFixedPt;
            }

            // Bottom edge
            if (this.dimensionsByInsetting.fromBottomEdgeRatio !== undefined) {
                height = parentHeight * (1 - this.dimensionsByInsetting.fromBottomEdgeRatio);
            } else if (this.dimensionsByInsetting.fromBottomEdgeFixedPt !== undefined) {
                height = parentHeight - this.dimensionsByInsetting.fromBottomEdgeFixedPt;
            }

            // Left edge
            if (this.dimensionsByInsetting.fromLeftEdgeRatio !== undefined) {
                width *= this.dimensionsByInsetting.fromLeftEdgeRatio;
            } else if (this.dimensionsByInsetting.fromLeftEdgeFixedPt !== undefined) {
                width = this.dimensionsByInsetting.fromLeftEdgeFixedPt;
            }
        }

        // Calculate x and y based on adhereToEdges and adhereToCorners
        // Note: This part depends on how you define the adherence logic.
        // Example: If adhering to the right edge, adjust x accordingly.
        // Calculate x and y based on adhereToEdges and adhereToCorners
        if (this.adhereToEdges.includes("right")) {
            x = parentWidth - width;
        }
        // The 'left' case is handled by default with x = 0

        if (this.adhereToEdges.includes("bottom")) {
            y = parentHeight - height;
        }
        // The 'top' case is handled by default with y = 0

        // Handle the case when the box adheres to both left and right edges
        if (this.adhereToEdges.includes("left") && this.adhereToEdges.includes("right")) {
            x = 0; // Starts from the left edge
            width = parentWidth; // Stretches to the right edge
        }

        // Handle the case when the box adheres to both top and bottom edges
        if (this.adhereToEdges.includes("top") && this.adhereToEdges.includes("bottom")) {
            y = 0; // Starts from the top edge
            height = parentHeight; // Stretches to the bottom edge
        }


        // Prioritizing corners based on order
        if (this.adhereToCorners.length > 0) {
            const firstCorner = this.adhereToCorners[0];
            switch (firstCorner) {
                case "topLeft":
                    x = 0; y = 0;
                    break;
                case "topRight":
                    x = parentWidth - width; y = 0;
                    break;
                case "bottomLeft":
                    x = 0; y = parentHeight - height;
                    break;
                case "bottomRight":
                    x = parentWidth - width; y = parentHeight - height;
                    break;
                // Add cases for other corners if needed
            }
        }

        // Stretching to fit multiple corners
        if (this.adhereToCorners.includes("topLeft") && this.adhereToCorners.includes("bottomRight")) {
            x = 0; y = 0;
            width = parentWidth; height = parentHeight;
            isStretched = true;
        } else if (this.adhereToCorners.includes("topRight") && this.adhereToCorners.includes("bottomLeft")) {
            x = parentWidth - width; y = 0;
            height = parentHeight;
            isStretched = true;
            // Additional logic for other combinations of opposite corners
        }

        // Handling individual corners if not stretched
        if (!isStretched) {
            if (this.adhereToCorners.includes("topLeft")) {
                x = 0; y = 0;
            } else if (this.adhereToCorners.includes("topRight")) {
                x = parentWidth - width; y = 0;
            } else if (this.adhereToCorners.includes("bottomLeft")) {
                x = 0; y = parentHeight - height;
            } else if (this.adhereToCorners.includes("bottomRight")) {
                x = parentWidth - width; y = parentHeight - height;
            }
        }

        return [{ x, y, width, height }];
    }



    drawOutline(context, parentWidthSpecified = 0, parentHeightSpecified = 0) {
        const elements = this.calculateDimensions(this.parentWidth, this.parentHeight);

        // Iterate over the elements and draw each one's outline
        elements.forEach((elem) => {
            context.strokeStyle = 'black';
            context.strokeRect(elem.x, elem.y, elem.width, elem.height);
        });
    }






    // Convenience functions

    // Full Stretch
    // A function to make the box stretch fully to the parent container's bounds.
    setFullStretch() {
        this.initialInsets = { "allEdgesFixedPt": 0 };
        this.dimensionsByInsetting = null; // Use parent's full dimensions
        this.adhereToEdges = [];
        this.adhereToCorners = [];
    }

    // Center Box
    // A function to place the box at the center of the parent container with specified width and height.
    setCenterBox(width, height) {
        this.initialInsets = null;
        this.dimensionsByInsetting = { "fromTopEdgeFixedPt": height, "fromLeftEdgeFixedPt": width };
        this.adhereToEdges = [];
        this.adhereToCorners = [];
    }

    //Align to a Specific Corner (Fixed Box Dimensions)
    // A function to align the box to a specified corner with given width and height.
    alignToCornerFixedDims(corner, width, height) {
        this.initialInsets = null;
        this.dimensionsByInsetting = { "fromTopEdgeFixedPt": height, "fromLeftEdgeFixedPt": width };
        this.adhereToEdges = [];
        this.adhereToCorners = [corner];
    }


    // Fixed Margin Box
    // A function to create a box with fixed margins from all sides.
    setFixedMarginBox(margin) {
        this.initialInsets = { "allEdgesFixedPt": margin };
        this.dimensionsByInsetting = null; // Adjust based on margins
        this.adhereToEdges = [];
        this.adhereToCorners = [];
    }


}

export default LayoutBox;
