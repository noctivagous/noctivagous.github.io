class LayoutBox {
    constructor(parentWidthPassed, parentHeightPassed, guiControl = null, parent = null) {
        this.parentWidth = parentWidthPassed;
        this.parentHeight = parentHeightPassed;

        this.pullAwayFromEdges = null; // { "topEdgeByRatio": 0.33, "leftEdgeByPt": 10 }
        // { "allEdgesPt": 10 } for a uniform margin
        this.extrude = null; // { "fromTopEdgeByRatio": 0.33, "fromLeftEdgeByPt": 300 }
        this.adhereToEdges = []; // ["rightEdge", "leftEdge"]
        this.adhereToCorners = []; // ["bottomLeftCorner", "bottomRightCorner"]

        this.guiControl = guiControl;
        this.children = [];
        this.parent = parent;
    }


    // Method to associate a GUIControl
    setGUIControl(guiControl) {
        this.guiControl = guiControl;
    }

    updateDimensions(parentWidthPassed, parentHeightPassed) {
        this.parentWidth = parentWidthPassed;
        this.parentHeight = parentHeightPassed;

        // Recalculate dimensions based on new parent size
        this.calculateDimensions(this.parentWidth, this.parentHeight);

        // Callback to the associated GUIControl
        if (this.guiControl) {
            this.guiControl.layoutBoxDidUpdate(this);
        }

    }

    calculateDimensions(parentWidth, parentHeight) {
        let width = parentWidth
        let height = parentHeight
        let x = 0
        let y = 0;



        var xyWHRectAsObj = { x, y, width, height };

        xyWHRectAsObj = this.calculateDimensionsFromPullAwayFromEdges(xyWHRectAsObj,parentWidth,parentHeight);

        xyWHRectAsObj = this.calculateDimensionsFromExtrude(xyWHRectAsObj,parentWidth,parentHeight);

        xyWHRectAsObj = this.calculateDimensionsFromAdhereToEdges(xyWHRectAsObj,parentWidth,parentHeight);

        xyWHRectAsObj = this.calculateDimensionsAdhereToCorners(xyWHRectAsObj,parentWidth,parentHeight);



        return [xyWHRectAsObj];
    }

    calculateDimensionsFromPullAwayFromEdges(xyWHRectAsObj,parentWidth,parentHeight) {

        let x = xyWHRectAsObj.x;
        let y = xyWHRectAsObj.y;
        let width = xyWHRectAsObj.width;
        let height = xyWHRectAsObj.height;

        // Calculate initial insets
        if (this.pullAwayFromEdges) {
            // Handle uniform insets for all edges
            if (this.pullAwayFromEdges.allEdgesPt !== undefined) {
                x = y = this.pullAwayFromEdges.allEdgesPt;
                width -= this.pullAwayFromEdges.allEdgesPt * 2;
                height -= this.pullAwayFromEdges.allEdgesPt * 2;
            } else if (this.pullAwayFromEdges.allEdgesRatio !== undefined) {
                const insetVal = parentWidth * this.pullAwayFromEdges.allEdgesRatio;
                x = y = insetVal;
                width -= insetVal * 2;
                height -= insetVal * 2;
            } else {
                // Top edge
                if (this.pullAwayFromEdges.topEdgeByRatio !== undefined) {
                    y += parentHeight * this.pullAwayFromEdges.topEdgeByRatio;
                    height -= parentHeight * this.pullAwayFromEdges.topEdgeByRatio;
                } else if (this.pullAwayFromEdges.topEdgeByPt !== undefined) {
                    y += this.pullAwayFromEdges.topEdgeByPt;
                    height -= this.pullAwayFromEdges.topEdgeByPt;
                }

                // Right edge
                if (this.pullAwayFromEdges.rightEdgeByRatio !== undefined) {
                    width -= parentWidth * this.pullAwayFromEdges.rightEdgeByRatio;
                } else if (this.pullAwayFromEdges.rightEdgeByPt !== undefined) {
                    width -= this.pullAwayFromEdges.rightEdgeByPt;
                }

                // Bottom edge
                if (this.pullAwayFromEdges.bottomEdgeByRatio !== undefined) {
                    height -= parentHeight * this.pullAwayFromEdges.bottomEdgeByRatio;
                } else if (this.pullAwayFromEdges.bottomEdgeByPt !== undefined) {
                    height -= this.pullAwayFromEdges.bottomEdgeByPt;
                }

                // Left edge
                if (this.pullAwayFromEdges.leftEdgeByRatio !== undefined) {
                    x += parentWidth * this.pullAwayFromEdges.leftEdgeByRatio;
                    width -= parentWidth * this.pullAwayFromEdges.leftEdgeByRatio;
                } else if (this.pullAwayFromEdges.leftEdgeByPt !== undefined) {
                    x += this.pullAwayFromEdges.leftEdgeByPt;
                    width -= this.pullAwayFromEdges.leftEdgeByPt;
                }
            }
        }

        return { x, y, width, height };
    }


    calculateDimensionsFromExtrude(xyWHRectAsObj,parentWidth,parentHeight) {

        let x = xyWHRectAsObj.x;
        let y = xyWHRectAsObj.y;
        let width = xyWHRectAsObj.width;
        let height = xyWHRectAsObj.height;


        // Calculate width and height based on extrude
        if (this.extrude) {
            // Top edge
            if (this.extrude.fromTopEdgeByRatio !== undefined) {
                height *= this.extrude.fromTopEdgeByRatio;
            } else if (this.extrude.fromTopEdgeByPt !== undefined) {
                height = this.extrude.fromTopEdgeByPt;
            }

            // Right edge
            if (this.extrude.fromRightEdgeByRatio !== undefined) {
                width = parentWidth * (1 - this.extrude.fromRightEdgeByRatio);
            } else if (this.extrude.fromRightEdgeByPt !== undefined) {
                width = parentWidth - this.extrude.fromRightEdgeByPt;
            }

            // Bottom edge
            if (this.extrude.fromBottomEdgeByRatio !== undefined) {
                height = parentHeight * (1 - this.extrude.fromBottomEdgeByRatio);
            } else if (this.extrude.fromBottomEdgeByPt !== undefined) {
                height = parentHeight - this.extrude.fromBottomEdgeByPt;
            }

            // Left edge
            if (this.extrude.fromLeftEdgeByRatio !== undefined) {
                width *= this.extrude.fromLeftEdgeByRatio;
            } else if (this.extrude.fromLeftEdgeByPt !== undefined) {
                width = this.extrude.fromLeftEdgeByPt;
            }
        }


        return { x, y, width, height };

    }


    calculateDimensionsFromAdhereToEdges(xyWHRectAsObj,parentWidth,parentHeight) {


        let x = xyWHRectAsObj.x;
        let y = xyWHRectAsObj.y;
        let width = xyWHRectAsObj.width;
        let height = xyWHRectAsObj.height;

        // Calculate x and y based on adhereToEdges and adhereToCorners
        // Note: This part depends on how you define the adherence logic.
        // Example: If adhering to the right edge, adjust x accordingly.
        // Calculate x and y based on adhereToEdges and adhereToCorners
        if (this.adhereToEdges.includes("rightEdge")) {
            x = parentWidth - width;
        }
        // The 'left' case is handled by default with x = 0

        if (this.adhereToEdges.includes("bottomEdge")) {
            y = parentHeight - height;
        }
        // The 'top' case is handled by default with y = 0

        // Handle the case when the box adheres to both left and right edges
        if (this.adhereToEdges.includes("leftEdge") && this.adhereToEdges.includes("rightEdge")) {
            x = 0; // Starts from the left edge
            width = parentWidth; // Stretches to the right edge
        }

        // Handle the case when the box adheres to both top and bottom edges
        if (this.adhereToEdges.includes("topEdge") && this.adhereToEdges.includes("bottomEdge")) {
            y = 0; // Starts from the top edge
            height = parentHeight; // Stretches to the bottom edge
        }

        return { x, y, width, height };


    }

    calculateDimensionsAdhereToCorners(xyWHRectAsObj,parentWidth,parentHeight) {

        let isStretched = false;

        let x = xyWHRectAsObj.x
        let y = xyWHRectAsObj.y
        let width = xyWHRectAsObj.width
        let height = xyWHRectAsObj.height

        // Prioritizing corners based on order
        if (this.adhereToCorners.length > 0) {
            const firstCorner = this.adhereToCorners[0];
            switch (firstCorner) {
                case "topLeftEdge":
                    x = 0; y = 0;
                    break;
                case "topRightEdge":
                    x = parentWidth - width; y = 0;
                    break;
                case "bottomLeftEdge":
                    x = 0; y = parentHeight - height;
                    break;
                case "bottomRightEdge":
                    x = parentWidth - width; y = parentHeight - height;
                    break;
                // Add cases for other corners if needed
            }
        }

        // Stretching to fit multiple corners
        if (this.adhereToCorners.includes("topLeftCorner") && this.adhereToCorners.includes("bottomRightCorner")) {
            x = 0; y = 0;
            width = parentWidth; height = parentHeight;
            isStretched = true;
        } else if (this.adhereToCorners.includes("topRightCorner") && this.adhereToCorners.includes("bottomLeftCorner")) {
            x = parentWidth - width; y = 0;
            height = parentHeight;
            isStretched = true;
            // Additional logic for other combinations of opposite corners
        }
        if (this.adhereToCorners.includes("topLeftCorner") && this.adhereToCorners.includes("bottomRightCorner")) {
            x = 0; y = 0;
            width = parentWidth; height = parentHeight;
            isStretched = true;
        } else if (this.adhereToCorners.includes("topRightCorner") && this.adhereToCorners.includes("bottomLeftCorner")) {
            x = parentWidth - width; y = 0;
            width = parentWidth; height = parentHeight;
            isStretched = true;
            // Additional logic for other combinations of opposite corners
        } else if (this.adhereToCorners.includes("topLeftCorner") && this.adhereToCorners.includes("bottomLeftCorner")) {
            x = 0; y = 0;
            width = width; height = parentHeight;
            isStretched = true;
        } else if (this.adhereToCorners.includes("topRightCorner") && this.adhereToCorners.includes("bottomRightCorner")) {
            x = parentWidth - width; y = 0;
            width = width; height = parentHeight;
            isStretched = true;
        }

        // Handling individual corners if not stretched
        if (!isStretched) {
            if (this.adhereToCorners.includes("topLeftCorner")) {
                x = 0; y = 0;
            } else if (this.adhereToCorners.includes("topRightCorner")) {
                x = parentWidth - width; y = 0;
            } else if (this.adhereToCorners.includes("bottomLeftCorner")) {
                x = 0; y = parentHeight - height;
            } else if (this.adhereToCorners.includes("bottomRightCorner")) {
                x = parentWidth - width; y = parentHeight - height;
            }
        }

        return { x, y, width, height };

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
        this.pullAwayFromEdges = { "allEdgesPt": 0 };
        this.extrude = null; // Use parent's full dimensions
        this.adhereToEdges = [];
        this.adhereToCorners = [];
    }

    // Center Box
    // A function to place the box at the center of the parent container with specified width and height.
    setCenterBox(width, height) {
        this.pullAwayFromEdges = null;
        this.extrude = { "fromTopEdgeByPt": height, "fromLeftEdgeByPt": width };
        this.adhereToEdges = [];
        this.adhereToCorners = [];
    }

    //Align to a Specific Corner (Fixed Box Dimensions)
    // A function to align the box to a specified corner with given width and height.
    alignToCornerFixedDims(corner, width, height) {
        this.pullAwayFromEdges = null;
        this.extrude = { "fromTopEdgeByPt": height, "fromLeftEdgeByPt": width };
        this.adhereToEdges = [];
        this.adhereToCorners = [corner];
    }


    // Fixed Margin Box
    // A function to create a box with fixed margins from all sides.
    setFixedMarginBox(margin) {
        this.pullAwayFromEdges = { "allEdgesPt": margin };
        this.extrude = null; // Adjust based on margins
        this.adhereToEdges = [];
        this.adhereToCorners = [];
    }





    // Add a child LayoutBox
    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }

    // Remove a child LayoutBox
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
    }

    // Handle mouse click events
    handleClick(event) {
        // Handle click event for this box
        // Propagate to children if necessary
        this.children.forEach(child => child.handleClick(event));
    }

    // Handle key events
    handleKey(event) {
        // Handle key event for this box
        // Propagate to children if necessary
        this.children.forEach(child => child.handleKey(event));
    }


}

export default LayoutBox;
