// Stroke and style
var globalStrokeWidth = 4.0;
var maxStrokeWidth = 40.0;
var lastCenterlineWidth = 80;
var splineTensionDefault = 0.4;
var splineTension = 0.4;

var globalStrokeColor = '#107cff';  // FIXED: valid 6-digit hex color
var globalFillColor = '#000000';
window.globalStrokeColor = '#107cff';  // FIXED: valid 6-digit hex color
window.globalFillColor = '#000000';

var strokeEnabled = true;
var fillEnabled = false;




// Inner shape parameters
var innerShapeType = 'polygon';  // 'none', 'circle', 'polygon', 'supershape'
var innerShapeParams = {
  sides: 6,     // for polygon
  m: 3,         // for supershape
  n1: 0.2,
  n2: 1.7,
  n3: 1.7
};

// Circle-specific inner shape
var circleInnerShapeType = 'polygon';
var circleInnerShapeParams = {
  sides: 6,
  m: 3,
  n1: 0.2,
  n2: 1.7,
  n3: 1.7
};


function changeStrokeWidth(strokeVal) {
  var localStrokeVal = strokeVal;

  if (localStrokeVal < 1) {
    localStrokeVal = 1;
  }
  if (localStrokeVal > maxStrokeWidth) {
    localStrokeVal = maxStrokeWidth;
  }

  globalStrokeWidth = localStrokeVal;
  updateTextContent();  // Always update display

  // SYNC: UI slider and display if exist
  var slider = document.getElementById('strokeWidthSlider');
  var display = document.getElementById('strokeWidthDisplay');
  if (slider) slider.value = localStrokeVal;
  if (display) display.textContent = localStrokeVal.toFixed(1) + ' pt';

  // Apply current styles respecting flags
  window.updateCurrentDrawingStyles();  // Applies strokeEnabled ? global : 0
}

function changeStrokeColor(colorVal) {
  window.globalStrokeColor = colorVal;
  // SYNC: UI color well if exists
  var colorWell = document.getElementById('strokeColorWell');
  if (colorWell) colorWell.value = window.globalStrokeColor;  // FIXED: now valid hex
  updateTextContent();

  // Apply current styles respecting flags
  window.updateCurrentDrawingStyles();
}

function changeFillColor(colorVal) {
  window.globalFillColor = colorVal;
  // SYNC: UI color well if exists
  var fillWell = document.getElementById('fillColorWell');
  if (fillWell) fillWell.value = window.globalFillColor;
  updateTextContent();

  // Apply current styles respecting flags
  window.updateCurrentDrawingStyles();
}

function thinStrokeWidth() {
  changeStrokeWidth(globalStrokeWidth - 1);
}

function thickenStrokeWidth() {
  changeStrokeWidth(globalStrokeWidth + 1);
}


// NEW: Helper to apply current control panel styles (add after changeFillColor)
function applyCurrentStyles(item) {
  item.strokeColor = strokeEnabled ? window.globalStrokeColor : null;
  item.strokeWidth = strokeEnabled ? globalStrokeWidth : 0;
  item.fillColor = fillEnabled ? window.globalFillColor : null;
  item.strokeCap = 'round';
  item.strokeJoin = 'round';
}

