class SnappingManager {
    constructor() {
        this.angleSnapping = false;
        this.lengthSnapping = false;
        this.gridSnapping = false;
        this.pointSnapping = false;
        this.pathSegmentSnapping = false;
    }

    // Angle Snapping
    setAngleSnapping(enabled) {
        this.angleSnapping = enabled;
    }

    getAngleSnapping() {
        return this.angleSnapping;
    }

    // Length Snapping
    setLengthSnapping(enabled) {
        this.lengthSnapping = enabled;
    }

    getLengthSnapping() {
        return this.lengthSnapping;
    }

    // Grid Snapping
    setGridSnapping(enabled) {
        this.gridSnapping = enabled;
    }

    getGridSnapping() {
        return this.gridSnapping;
    }

    // Point Snapping
    setPointSnapping(enabled) {
        this.pointSnapping = enabled;
    }

    getPointSnapping() {
        return this.pointSnapping;
    }

    // Path Segment Snapping
    setPathSegmentSnapping(enabled) {
        this.pathSegmentSnapping = enabled;
    }

    getPathSegmentSnapping() {
        return this.pathSegmentSnapping;
    }

    // You can add additional methods or logic as needed
}

export default SnappingManager;
