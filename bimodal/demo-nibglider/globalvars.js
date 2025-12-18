// Global variables for nibglider.js


var shapeWidth = 90;
var maxShapeWidth = 200;
var lastCenterlineWidth = 80;

var splineTensionDefault = 0.4;
var splineTension = 0.4;

// ...existing previews...
previewInner = null;
innerShapeType = 'polygon';  // 'none', 'circle', 'polygon', 'supershape'
innerShapeParams = {
  sides: 6,     // for polygon
  m: 3,         // for supershape
  n1: 0.2,
  n2: 1.7,
  n3: 1.7
};


// Add global:
shapeGuideAngle = 0;


var globalStrokeWidth = 4.0;
var maxStrokeWidth = 40.0;
window.globalStrokeColor = '#107cff';  // FIXED: valid 6-digit hex color
window.globalFillColor = '#000000';
var strokeEnabled = true;
var fillEnabled = false;
var isDrawingPath = false;  // renamed from isDrawing
var mousePt;
var lastMousePt = null;
var path;

var isDrawingShape = false;
var shapeType = null;  // 'circle_radius' or 'circle_diameter'
var shapeStartPoint = null;
var previewShape = null;
var previewLine = null;
var previewPath = null;
var previewRect = null;
var shapePt2 = null;

// New variables for quadrilateral drawing
var isDrawingQuad = false;
var quadPath;
var quadPointCount = 0;

// Variables to track selected items and drag-lock status
var selectedItems = [];

var _isInDragLock = false;

// Mouse and drawing state
var mousePt;
var lastMousePt = null;

// Drawing mode flags
var isDrawingPath = false;
var isDrawingShape = false;
var isDrawingQuad = false;

// Shape drawing state
var shapeType = null;  // 'circle_radius' or 'circle_diameter'
var shapeStartPoint = null;
var shapePt2 = null;
var shapeWidth = 90;
var maxShapeWidth = 200;

// Preview objects
var previewShape = null;
var previewLine = null;
var previewPath = null;
var previewRect = null;
var previewInner = null;

// Path objects
var path;
var quadPath;
var quadPointCount = 0;

// Stroke and style
var globalStrokeWidth = 4.0;
var maxStrokeWidth = 40.0;
var lastCenterlineWidth = 80;
var splineTensionDefault = 0.4;
var splineTension = 0.4;

// Inner shape parameters
var innerShapeType = 'polygon';  // 'none', 'circle', 'polygon', 'supershape'
var innerShapeParams = {
  sides: 6,     // for polygon
  m: 5,         // for supershape
  n1: 0.2,
  n2: 1.7,
  n3: 1.7
};

// Circle-specific inner shape
var circleInnerShapeType = 'polygon';
var circleInnerShapeParams = {
  sides: 6,
  m: 5,
  n1: 0.2,
  n2: 1.7,
  n3: 1.7
};

// Rectangle frame state
var rectangleInnerShapeType = 'rectangle';  // 'rectangle', 'rightTriangle', 'regularTriangle'

// UI elements (circle frame controls)
const circleInnerShapeSelect = document.getElementById('circleInnerShapeSelect');
const circlePolySidesSlider = document.getElementById('circlePolySides');
const circlePolySidesLabel = document.getElementById('circlePolySidesLabel');
const circleFrameControls = document.getElementById('circleFrameControls');

// Selection and interaction
var selectedItems = [];
var _isInDragLock = false;
var shapeGuideAngle = 0;

// Text display
var textItem1;

// Shape preview and drawing state
var previewInner = null;
var previewShape = null;
var previewLine = null;
var previewPath = null;
var previewRect = null;

// Additional drawing state
var isDrawingPath = false;
var isDrawingShape = false;
var isDrawingQuad = false;
var shapeType = null;
var shapeStartPoint = null;
var shapePt2 = null;
var quadPath;
var quadPointCount = 0;
var path;

