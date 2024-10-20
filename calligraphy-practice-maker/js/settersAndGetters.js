
// GLOBALS
const mmToPt = 2.83465;    // Conversion factor from mm to pt

// SETTINGS WITH DEFAULTS
var nibWidthMm = 2;
var nibWidthPt = nibWidthMm * mmToPt; // Nib width in points
var nibWidthsTall = document.getElementById('nibWidthsTall').value;

function setDefaults()
{
    setNibWidthPtFromMM(2);

    if(isSafari())
    {
        document.getElementById('printButton').style.display = 'none';
    }
}

function getNibWidthPt()
{
    return nibWidthMm * mmToPt
}

function getXHeightPt()
{
    return nibWidthsTall * nibWidthPt;
}

var xHeightColor = document.getElementById('xHeightColor').value;
var xHeightOpacity = 0.4;

var showNibGuidelineLabels = true;
var showNibSquares = true;
var showVerticalLines = false;
var verticalSlantAngle = 15;
var verticalLineSpacingMultiplier = 2;
var ascenderMultiplier = 0.5;
var descenderMultiplier = 0.6;
var capitalMultiplier = 0.4;
var showFont = false;
var fontWasLoadedForShowFont = false;
var documentWidthPt = 500;
var documentHeightPt = 500;

var pageOrientation = 'portrait';
var orientation = 'portrait';

var marginHorizontalInches = 0.4;
var marginVerticalInches = 0.4;

var marginHorizontal = 2 * marginHorizontalInches * 72; // Convert inches to points
var marginVertical = 2 * marginVerticalInches * 72;     // Convert inches to points

var fontScaleFactor = 0.5;
var spacingForCharacters = 30; // Space between characters

var paperSizeWithoutOrientation = [];

function getPaperSizeOriented() {
    // Fetch paper size from the form field
    const paperSizeValue = document.getElementById('paperSize').value.split(',').map(Number);
    let [width, height] = paperSizeValue;

    // Fetch the current orientation from the form
    const orientationValue = document.querySelector('input[name="orientation"]:checked').value;

    // Swap width and height if orientation is landscape
    if (orientationValue === 'landscape') {
        [width, height] = [height, width];
    }

    return [width, height];
}


// Setter for X-Height
function setNibWidthsTall(value) {
    // Ensure value is valid
    if (isNaN(value) || value <= 0) {
        console.error("Invalid nibWidthsTall value. Reverting to default.");
        value = 4; // Default fallback value
    }

    nibWidthsTall = value; // Update global variable
    document.getElementById('nibWidthsTall').value = value; // Update text field
    //console.log("nibWidthsTall updated to: " + value);
}

// Setter for Ascender Height
function setAscenderHeight(value) {
    // Ensure value is valid
    if (isNaN(value) || value < 0) {
        console.error("Invalid ascenderHeight value. Reverting to default.");
        value = 0.5; // Default fallback value
    }

    ascenderMultiplier = value; // Update global variable
    document.getElementById('ascenderHeight').value = value; // Update text field
    //console.log("Ascender Height updated to: " + value);
}

// Setter for Capital Height
function setCapitalHeight(value) {
    // Ensure value is valid
    if (isNaN(value) || value < 0) {
        console.error("Invalid capitalHeight value. Reverting to default.");
        value = 0.4; // Default fallback value
    }

    capitalMultiplier = value; // Update global variable
    document.getElementById('capitalHeight').value = value; // Update text field
    //console.log("Capital Height updated to: " + value);
}

// Setter for Descender Height
function setDescenderHeight(value) {
    // Ensure value is valid
    if (isNaN(value) || value < 0) {
        console.error("Invalid descenderHeight value. Reverting to default.");
        value = 0.6; // Default fallback value
    }

    descenderMultiplier = value; // Update global variable
    document.getElementById('descenderDepth').value = value; // Update text field
    //console.log("Descender Depth updated to: " + value);
}

// Setter for Nib Width
function setNibWidthPtFromMM(value) {
    // Ensure value is valid
    if (isNaN(value) || value <= 0) {
        console.error("Invalid nibWidthPt value. Reverting to default.");
        value = 3.8; // Default fallback value
    }

    nibWidthMm = value; // Update global variable
    nibWidthPt = nibWidthMm * mmToPt; // Convert to points
    document.getElementById('nibWidthMm').value = value; // Update text field
    document.getElementById('nibWidthInPtDisplay').innerText = nibWidthPt.toFixed(2); // Update text field
    
    //console.log("Nib Width updated to: " + value);
}

// Setter for X-Height Opacity
function setXHeightOpacity(value) {
    // Ensure value is valid
    if (isNaN(value) || value < 0 || value > 1) {
        console.error("Invalid xHeightOpacity value. Reverting to default.");
        value = 0.4; // Default fallback value
    }

    xHeightOpacity = value; // Update global variable
    document.getElementById('xHeightOpacity').value = value; // Update text field
    //console.log("X-Height Opacity updated to: " + value);
}

// Setter for Vertical Slant Angle
function setVerticalSlantAngle(value) {
    // Ensure value is valid
    if (isNaN(value) || value < 0 || value > 60) {
        console.error("Invalid verticalSlantAngle value. Reverting to default.");
        value = 0; // Default fallback value
    }

    verticalSlantAngle = value; // Update global variable
    document.getElementById('verticalSlantAngle').value = value; // Update text field
    //console.log("Vertical Slant Angle updated to: " + value);
}

// Setter for Vertical Line Spacing Multiplier
function setVerticalLineSpacingMultiplier(value) {
    // Ensure value is valid
    if (isNaN(value) || value <= 0.5) {
        console.error("Invalid verticalLineSpacingMultiplier value. Reverting to default.");
        value = 2; // Default fallback value
    }

    verticalLineSpacingMultiplier = value; // Update global variable
    document.getElementById('verticalLineSpacing').value = value; // Update text field
    //console.log("Vertical Line Spacing Multiplier updated to: " + value);
}

// Setter for Paper Size
function setPaperSize(value) {
    // Ensure value is an array of numbers with two elements
    if (!Array.isArray(value) || value.length !== 2 || value.some(isNaN)) {
        console.error("Invalid paperSize value. Reverting to default.");
        value = [500, 700]; // Default fallback value
    }

    paperSize = value; // Update global variable
    document.getElementById('paperSize').value = value.join(','); // Update text field
    //console.log("Paper Size updated to: " + value);
}

// Setter for Orientation
function setOrientation(value) {
    // Ensure value is either 'portrait' or 'landscape'
    if (value !== 'portrait' && value !== 'landscape') {
        console.error("Invalid orientation value. Reverting to default.");
        value = 'portrait'; // Default fallback value
    }

    orientation = value; // Update global variable
    const orientationInput = document.querySelector(`input[name="orientation"][value="${value}"]`);
    if (orientationInput) {
        orientationInput.checked = true; // Update radio button field
    }
    //console.log("Orientation updated to: " + value);
}

// Event listeners to update the values using setters when the user changes the input fields
document.getElementById('nibWidthsTall').addEventListener('change', function () {
    const value = parseFloat(this.value);
    setNibWidthsTall(value);
});

document.getElementById('ascenderHeight').addEventListener('change', function () {
    const value = parseFloat(this.value);
    setAscenderHeight(value);
});

document.getElementById('capitalHeight').addEventListener('change', function () {
    const value = parseFloat(this.value);
    setCapitalHeight(value);
});

document.getElementById('descenderDepth').addEventListener('change', function () {
    const value = parseFloat(this.value);
    setDescenderHeight(value);
});

document.getElementById('nibWidthMm').addEventListener('change', function () {
    const value = parseFloat(this.value);
    setNibWidthPtFromMM(value);
});

document.getElementById('xHeightOpacity').addEventListener('change', function () {
    const value = parseFloat(this.value);
    setXHeightOpacity(value);
});

document.getElementById('verticalSlantAngle').addEventListener('change', function () {
    const value = parseFloat(this.value);
    setVerticalSlantAngle(value);
});

document.getElementById('verticalLineSpacing').addEventListener('change', function () {
    const value = parseFloat(this.value);
    setVerticalLineSpacingMultiplier(value);
});

document.getElementById('paperSize').addEventListener('change', function () {
    const value = this.value.split(',').map(Number);
    setPaperSize(value);
});

document.querySelectorAll('input[name="orientation"]').forEach(function (element) {
    element.addEventListener('change', function () {
        setOrientation(this.value);
    });
});

document.getElementById('showFont').addEventListener('change', function () {
    showFont = this.checked;
    //console.log("Show Font updated to: " + showFont);
});

document.getElementById('showNibGuidelineLabels').addEventListener('change', function () {
    showNibGuidelineLabels = this.checked;
    //console.log("Show Nib Guideline Labels updated to: " + showNibGuidelineLabels);
});

document.getElementById('showNibSquares').addEventListener('change', function () {
    showNibSquares = this.checked;
    //console.log("Show Nib Squares updated to: " + showNibSquares);
});

document.getElementById('verticalLines').addEventListener('change', function () {
    showVerticalLines = this.checked;
    //console.log("Show Vertical Lines updated to: " + showVerticalLines);
});



    // Event listeners for input fields to allow manual modification when showFont is false
    document.getElementById('ascenderHeight').addEventListener('input', function () {
        ascenderMultiplier = parseFloat(this.value);
    });
    document.getElementById('capitalHeight').addEventListener('input', function () {
        capitalMultiplier = parseFloat(this.value);
    });
    document.getElementById('descenderDepth').addEventListener('input', function () {
        descenderMultiplier = parseFloat(this.value);
    });


// Add event listeners to controls
    // Select all input, select, and textarea elements within #controls, but exclude those with the class '.notWorksheetGenerating'
    var controls = document.querySelectorAll(
        '#controls input:not(.notWorksheetGenerating), #controls select:not(.notWorksheetGenerating), #controls textarea:not(.notWorksheetGenerating)'
    );

    controls.forEach(function (control) {
       control.addEventListener('change', function () { makeWorksheetPages(); });
    });



    // Update fontXHeightTweak from user input
document.getElementById('fontXHeightTweak').addEventListener('input', function () {
    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];

    // Only update tweak if the font was uploaded (has fontData attribute)
    if (selectedOption.hasAttribute('fontData')) {
        selectedOption.setAttribute('fontXHeightTweak', parseFloat(this.value) || 0);
        //console.log("fontXHeightTweak updated to:", this.value);

        // Optionally, regenerate the worksheet pages to apply the new X-Height tweak
        makeWorksheetPages();
        
    } else {
        console.warn("Font X-Height Tweak is only applicable for uploaded fonts.");
    }
});



// Update visibility of the X-Height tweak enclosure based on selected font
document.getElementById('fontForWorksheetPages').addEventListener('change', function () {
    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];
    const tweakEnclosure = document.getElementById('fontXHeightTweakEnclosure');

    if (selectedOption.hasAttribute('fontData')) {
        // Show the tweak enclosure for uploaded fonts
        tweakEnclosure.style.display = 'block';
    } else if (selectedOption.hasAttribute('fontURL')) {
        // Hide the tweak enclosure for default fonts
        tweakEnclosure.style.display = 'none';
    }
});


function showHideSections()
{

    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];
    const tweakEnclosure = document.getElementById('fontXHeightTweakEnclosure');
    
    if (selectedOption.hasAttribute('fontData')) {
        
        tweakEnclosure.style.display = 'block';
    } else if (selectedOption.hasAttribute('fontURL')) {
        tweakEnclosure.style.display = 'none';
    }


    const customPracticeTextEnclosure = document.getElementById('customPracticeTextEnclosure');
    
    const includeNumberCharactersEnclosure = document.getElementById('includeNumberCharactersEnclosure');

    const selectedCharactersValue = document.getElementById("caseSelection").value;

    if(selectedCharactersValue == "customText")
    {
        includeNumberCharactersEnclosure.style.display = 'none';
        customPracticeTextEnclosure.style.display = 'block';
    }
    else
    {
        includeNumberCharactersEnclosure.style.display = 'block';
        customPracticeTextEnclosure.style.display = 'none';
    }

    const fieldsetContentsForFont = document.getElementById('practiceFontCharactersFieldsetContents');
    const showFontSwitch = document.getElementById('showFont');

    const currentHeight = fieldsetContentsForFont.clientHeight;

    
    if (showFontSwitch.checked == true) {
        if(currentHeight == 0)
        {
            blindDown(fieldsetContentsForFont);    
        }
  //      fieldsetContentsForFont.style.display = 'block';
    } else if (showFontSwitch.checked == false) {
        if(currentHeight > 0)
            {
        blindUp(fieldsetContentsForFont);
//        fieldsetContentsForFont.style.display = 'none';
            }
    }

    

}

function blindToggle(element, duration = 400) {
    // Get the current height of the element
    const currentHeight = element.clientHeight;
    
    // If the element is visible (height > 0), we collapse it ("blind up")
    if (currentHeight > 0) {
        blindUp(element, duration);
    } else {
        blindDown(element, duration);
    }
}

function blindUp(element, duration = 400) {
    element.style.height = `${element.scrollHeight}px`;
    element.style.transition = `height ${duration}ms ease-out`;
    
    // Trigger reflow to ensure the transition happens
    element.offsetHeight;
    
    // Start the "blind up" transition
    element.style.height = '0';
    
    // Clean up styles after transition
    setTimeout(() => {
        element.style.display = 'none';
        element.style.height = '';
        element.style.transition = '';
    }, duration);
}

function blindDown(element, duration = 400) {
    element.style.display = 'block';
    const targetHeight = element.scrollHeight;
    
    // Set initial height to 0 to start the "blind down" transition
    element.style.height = '0';
    element.style.transition = `height ${duration}ms ease-out`;
    
    // Trigger reflow
    element.offsetHeight;

    // Start the "blind down" transition
    element.style.height = `${targetHeight}px`;

    // Clean up styles after transition
    setTimeout(() => {
        element.style.height = '';
        element.style.transition = '';
    }, duration);
}


// Initial setup: Hide or show tweak enclosure based on the default selection
document.addEventListener('DOMContentLoaded', function () {

    showHideSections();

});

// Debounce function to limit the rate of execution
function debounce(func, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Example function to call on each character input
  function handleCustomTextInput(event) {
    makeWorksheetPages();
  }

  // Get the textarea element
  const textarea = document.getElementById('customPracticeText');

  // Add the debounced input event listener
  textarea.addEventListener('input', debounce(handleCustomTextInput, 300));

  function isSafari()
  {
      return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
  }
