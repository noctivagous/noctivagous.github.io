class LayoutBox {
    constructor(parentWidthPassed, parentHeightPassed, guiControl = null, parent = null) {
        this.parentWidth = parentWidthPassed;
        this.parentHeight = parentHeightPassed;

        this.insetStarts = null; // { "topEdgeRatio": 0.33, "leftEdgePt": 10 }
        // { "allEdgesPt": 10 } for a uniform margin
        this.extrude = null; // { "fromTopEdgeRatio": 0.33, "fromLeftEdgePt": 300 }
        this.adhereToEdges = []; // ["right", "left"]
        this.adhereToCorners = []; // ["bottomLeft", "bottomRight"]

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
        let width = parentWidth, height = parentHeight, x = 0, y = 0;
        let isStretched = false;

        // Calculate initial insets
        if (this.insetStarts) {
            // Handle uniform insets for all edges
            if (this.insetStarts.allEdgesPt !== undefined) {
                x = y = this.insetStarts.allEdgesPt;
                width -= this.insetStarts.allEdgesPt * 2;
                height -= this.insetStarts.allEdgesPt * 2;
            } else if (this.insetStarts.allEdgesRatio !== undefined) {
                const insetVal = parentWidth * this.insetStarts.allEdgesRatio;
                x = y = insetVal;
                width -= insetVal * 2;
                height -= insetVal * 2;
            } else {
                // Top edge
                if (this.insetStarts.topEdgeRatio !== undefined) {
                    y += parentHeight * this.insetStarts.topEdgeRatio;
                    height -= parentHeight * this.insetStarts.topEdgeRatio;
                } else if (this.insetStarts.topEdgePt !== undefined) {
                    y += this.insetStarts.topEdgePt;
                    height -= this.insetStarts.topEdgePt;
                }

                // Right edge
                if (this.insetStarts.rightEdgeRatio !== undefined) {
                    width -= parentWidth * this.insetStarts.rightEdgeRatio;
                } else if (this.insetStarts.rightEdgePt !== undefined) {
                    width -= this.insetStarts.rightEdgePt;
                }

                // Bottom edge
                if (this.insetStarts.bottomEdgeRatio !== undefined) {
                    height -= parentHeight * this.insetStarts.bottomEdgeRatio;
                } else if (this.insetStarts.bottomEdgePt !== undefined) {
                    height -= this.insetStarts.bottomEdgePt;
                }

                // Left edge
                if (this.insetStarts.leftEdgeRatio !== undefined) {
                    x += parentWidth * this.insetStarts.leftEdgeRatio;
                    width -= parentWidth * this.insetStarts.leftEdgeRatio;
                } else if (this.insetStarts.leftEdgePt !== undefined) {
                    x += this.insetStarts.leftEdgePt;
                    width -= this.insetStarts.leftEdgePt;
                }
            }
        }

        // Calculate width and height based on extrude
        if (this.extrude) {
            // Top edge
            if (this.extrude.fromTopEdgeRatio !== undefined) {
                height *= this.extrude.fromTopEdgeRatio;
            } else if (this.extrude.fromTopEdgePt !== undefined) {
                height = this.extrude.fromTopEdgePt;
            }

            // Right edge
            if (this.extrude.fromRightEdgeRatio !== undefined) {
                width = parentWidth * (1 - this.extrude.fromRightEdgeRatio);
            } else if (this.extrude.fromRightEdgePt !== undefined) {
                width = parentWidth - this.extrude.fromRightEdgePt;
            }

            // Bottom edge
            if (this.extrude.fromBottomEdgeRatio !== undefined) {
                height = parentHeight * (1 - this.extrude.fromBottomEdgeRatio);
            } else if (this.extrude.fromBottomEdgePt !== undefined) {
                height = parentHeight - this.extrude.fromBottomEdgePt;
            }

            // Left edge
            if (this.extrude.fromLeftEdgeRatio !== undefined) {
                width *= this.extrude.fromLeftEdgeRatio;
            } else if (this.extrude.fromLeftEdgePt !== undefined) {
                width = this.extrude.fromLeftEdgePt;
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
        this.insetStarts = { "allEdgesPt": 0 };
        this.extrude = null; // Use parent's full dimensions
        this.adhereToEdges = [];
        this.adhereToCorners = [];
    }

    // Center Box
    // A function to place the box at the center of the parent container with specified width and height.
    setCenterBox(width, height) {
        this.insetStarts = null;
        this.extrude = { "fromTopEdgePt": height, "fromLeftEdgePt": width };
        this.adhereToEdges = [];
        this.adhereToCorners = [];
    }

    //Align to a Specific Corner (Fixed Box Dimensions)
    // A function to align the box to a specified corner with given width and height.
    alignToCornerFixedDims(corner, width, height) {
        this.insetStarts = null;
        this.extrude = { "fromTopEdgePt": height, "fromLeftEdgePt": width };
        this.adhereToEdges = [];
        this.adhereToCorners = [corner];
    }


    // Fixed Margin Box
    // A function to create a box with fixed margins from all sides.
    setFixedMarginBox(margin) {
        this.insetStarts = { "allEdgesPt": margin };
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
