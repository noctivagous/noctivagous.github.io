
// GLOBAL CONSTANTS
const mmToPt = 2.83465;    // Conversion factor from mm to pt

// SETTINGS WITH DEFAULTS
var nibWidthMmDefault = 2.8;

// Globals
var nibWidthMm = 2.8;
var nibWidthPt = nibWidthMm * mmToPt; // Nib width in points
var nibWidthsTall = document.getElementById('nibWidthsTall').value;

function setDefaults() {
    setNibWidthPtFromMM(nibWidthMmDefault);

    loadSelectedFontOptionSettingsIntoFields();

    if (isSafari()) {
        document.getElementById('printButton').style.display = 'none';
    }
}

// Load selected font attributes into the form fields
function loadSelectedFontOptionSettingsIntoFields() {
    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];



    const fontGlyphNibWidthInputField = document.getElementById('fontGlyphNibWidth');
    const fontGlyphNibWidthEnclosure = document.getElementById('fontGlyphNibWidthEnclosure');
    
    fontGlyphNibWidthInputField.value = parseFloat(selectedOption.getAttribute('fontGlyphNibWidth')) || 5;

    const xHeightFontScaleFactorField = document.getElementById('xHeightFontScaleFactor');
    const xHeightFontScaleFactorEnclosure = document.getElementById('xHeightFontScaleFactorEnclosure');
    xHeightFontScaleFactorField.value = parseFloat(selectedOption.getAttribute('xHeightFontScaleFactor')) || 1;

    const ascenderField = document.getElementById('ascenderHeight');
    ascenderField.value = parseFloat(selectedOption.getAttribute('ascenderRatio')) || 0.45;

    const capHeightField = document.getElementById('capitalHeight');
    capHeightField.value = parseFloat(selectedOption.getAttribute('capHeightRatio')) || 0.6;

    const descenderDepthField = document.getElementById('descenderDepth');
    descenderDepthField.value = parseFloat(selectedOption.getAttribute('descenderDepthRatio')) || 0.45;

    const fontYOffsetField = document.getElementById('fontYOffset');
    const fontYOffsetEnclosure = document.getElementById('fontYOffsetEnclosure');
    fontYOffsetField.value  = parseFloat(selectedOption.getAttribute('fontYOffset')) || 0.0;

    if (selectedOption.hasAttribute('fontFileData')) {
        // Show the tweak enclosure for uploaded fonts
        fontGlyphNibWidthEnclosure.style.display = 'block';
        xHeightFontScaleFactorEnclosure.style.display = 'block';
        fontYOffsetEnclosure.style.display = 'block';
    } else if (selectedOption.hasAttribute('fontURL')) {
        // Hide the tweak enclosure for default fonts
        fontGlyphNibWidthEnclosure.style.display = 'none';
        xHeightFontScaleFactorEnclosure.style.display = 'none';
       fontYOffsetEnclosure.style.display = 'none';
    }
}

function loadSelectedFontOptionSettingsIntoFieldsOLD() {
    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];
    const fontGlyphNibWidthInputField = document.getElementById('fontGlyphNibWidth');
    fontGlyphNibWidthInputField.value = parseFloat(selectedOption.getAttribute('fontGlyphNibWidth')) || 1;
    const fontGlyphNibWidthEnclosure = document.getElementById('fontGlyphNibWidthEnclosure');


    const xHeightFontScaleFactorField = document.getElementById('xHeightFontScaleFactor');
    const xHeightFontScaleFactorEnclosure = document.getElementById('xHeightFontScaleFactorEnclosure');


    fontGlyphNibWidthInputField.value = parseFloat(selectedOption.getAttribute('fontGlyphNibWidth')) || 0;

    xHeightFontScaleFactorField.value = parseFloat(selectedOption.getAttribute('xHeightFontScaleFactor')) || 1;
    //alert(selectedOption.getAttribute('fontGlyphNibWidth'));

    // return;


}

function getNibWidthPt() {
    return nibWidthMm * mmToPt
}

function getXHeightPt() {
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
    const maxVal = parseFloat(document.getElementById('nibWidthMm').max) || 200;
    const minVal = parseFloat(document.getElementById('nibWidthMm').min) || 0.5;
    // Ensure value is valid
    if (isNaN(value) || value < minVal || value > maxVal) {


        if (value > maxVal) {
            alert("Value exceeds maximum of " + maxVal);
        }

        else if (value < minVal) {
            alert("Value minimum is: " + minVal);
        }
        else {
            alert("Invalid nib width value. Reverting to default.");
        }

        console.error("Invalid nibWidth value. Reverting to default.");
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




// Update fontGlyphNibWidth from user input
document.getElementById('fontGlyphNibWidth').addEventListener('input', function () {
    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];
    const fontGlyphNibWidthInputField = document.getElementById('fontGlyphNibWidth');

    selectedOption.setAttribute('fontGlyphNibWidth', parseFloat(fontGlyphNibWidthInputField.value) || 1);
    //console.log("fontGlyphNibWidth updated to:", this.value);

    makeFontMetrics();

    // Regenerate the worksheet pages to apply the new X-Height tweak
    makeWorksheetPages();
    /*
        // Only update tweak if the font was uploaded (has fontFileData attribute)
        if (selectedOption.hasAttribute('fontFileData')) {
    
    
    
            
        } else {
            console.warn("Font X-Height Tweak is only applicable for uploaded fonts.");
        }*/
});



// Update visibility of the X-Height tweak enclosure based on selected font
document.getElementById('fontForWorksheetPages').addEventListener('change', function () {
    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];

    const tweakInputField = document.getElementById('fontGlyphNibWidth');


    loadSelectedFontOptionSettingsIntoFields();


});


document.getElementById('fontGlyphNibWidth').addEventListener('change', function () {
    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];
    const tweakEnclosure = document.getElementById('fontXHeightTweakEnclosure');
    const fontGlyphNibWidthInputField = document.getElementById('fontGlyphNibWidth');

    selectedOption.setAttribute('fontGlyphNibWidth', fontGlyphNibWidthInputField.value);

    makeWorksheetPages();
    if (selectedOption.hasAttribute('fontFileData')) {
        // Show the tweak enclosure for uploaded fonts
        //        tweakEnclosure.style.display = 'block';

        //        tweakInputField.value = parseFloat(selectedOption.getAttribute('fontGlyphNibWidth')) || 0;

        // Default brush width
        //selectedOption.value = parseFloat(selectedOption.getAttribute('fontGlyphNibWidth')) || 1;


    } else if (selectedOption.hasAttribute('fontURL')) {
        // Hide the tweak enclosure for default fonts
        //  tweakEnclosure.style.display = 'none';
    }
});


document.getElementById('xHeightFontScaleFactor').addEventListener('change', function () {
    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];
    const tweakEnclosure = document.getElementById('xHeightFontScaleFactorEnclosure');
    const tweakInputField = document.getElementById('xHeightFontScaleFactor');

    selectedOption.setAttribute('xHeightFontScaleFactor', tweakInputField.value);

    makeWorksheetPages();
    if (selectedOption.hasAttribute('fontFileData')) {
        // Show the tweak enclosure for uploaded fonts
        //        tweakEnclosure.style.display = 'block';

        //        tweakInputField.value = parseFloat(selectedOption.getAttribute('fontGlyphNibWidth')) || 0;

        // Default brush width
        //selectedOption.value = parseFloat(selectedOption.getAttribute('fontGlyphNibWidth')) || 1;


    } else if (selectedOption.hasAttribute('fontURL')) {
        // Hide the tweak enclosure for default fonts
        //  tweakEnclosure.style.display = 'none';
    }
});


function showHideSections() {

    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];
    const tweakEnclosure = document.getElementById('fontGlyphNibWidthEnclosure');

    //   const tweakInputField = document.getElementById('fontGlyphNibWidth');
    // tweakInputField.value = parseFloat(selectedOption.getAttribute('fontGlyphNibWidth'));

    if (selectedOption.hasAttribute('fontFileData')) {

        // tweakEnclosure.style.display = 'block';
    } else if (selectedOption.hasAttribute('fontURL')) {
        //  tweakEnclosure.style.display = 'none';
    }




    const customPracticeTextEnclosure = document.getElementById('customPracticeTextEnclosure');

    const includeNumberCharactersEnclosure = document.getElementById('includeNumberCharactersEnclosure');

    const selectedCharactersValue = document.getElementById("caseSelection").value;

    if (selectedCharactersValue == "customText") {
        includeNumberCharactersEnclosure.style.display = 'none';
        customPracticeTextEnclosure.style.display = 'block';
    }
    else {
        includeNumberCharactersEnclosure.style.display = 'block';
        customPracticeTextEnclosure.style.display = 'none';
    }

    const fieldsetContentsForFont = document.getElementById('practiceFontCharactersFieldsetContents');
    const practiceCharactersLegend = document.getElementById('practiceCharactersLegend');
    const showFontSwitch = document.getElementById('showFont');

    const currentHeight = fieldsetContentsForFont.clientHeight;


    if (showFontSwitch.checked == true) {
        if (currentHeight == 0) {
            blindDown(fieldsetContentsForFont);

            // eliminates artifacts when unchecked
            // and this sets it back to normal
            practiceCharactersLegend.style.borderBottomLeftRadius = '0pt';
            practiceCharactersLegend.style.borderBottomRightRadius = '0pt';


        }
        //      fieldsetContentsForFont.style.display = 'block';
    } else if (showFontSwitch.checked == false) {
        if (currentHeight > 0) {
            // eliminates overflow artificacts when unchecked
            // and this sets the border radius
            practiceCharactersLegend.style.borderBottomLeftRadius = '8pt';
            practiceCharactersLegend.style.borderBottomRightRadius = '8pt';

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

function blindUp(element, duration = 100) {
    element.style.height = `${element.scrollHeight}px`;
    element.style.transition = `height ${duration}ms linear`;

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
    return function (...args) {
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

function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

}


// JavaScript to handle the selection
const selectControl = document.getElementById('nibWidthStaticSelect');
const nibWidthMmTextField = document.getElementById('nibWidthMm');

selectControl.addEventListener('change', function () {
    // Push the selected value to the text field
    //  nibWidthMmTextField.value = selectControl.value;

    setNibWidthPtFromMM(parseFloat(selectControl.value));
    makeFontMetrics();
    makeWorksheetPages();
    // Reset the select to its default state
    selectControl.selectedIndex = 0;

});


/* INDEXDB */

// IndexedDB Setup
const dbName = "FontDatabase";
const storeName = "UploadedFonts";

// Initialize IndexedDB
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "name" });
            }
        };

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject("IndexedDB error: " + event.target.error);
        };
    });
}

// Add "Uploaded" optgroup if not present
function ensureUploadedOptgroupExists() {
    const fontSelect = document.getElementById('fontForWorksheetPages');
    let uploadedOptgroup = document.getElementById('uploadedOptgroup');

    if (!uploadedOptgroup) {
        uploadedOptgroup = document.createElement('optgroup');
        uploadedOptgroup.label = "Uploaded";
        uploadedOptgroup.id = "uploadedOptgroup";
        fontSelect.appendChild(uploadedOptgroup);
    }

    return uploadedOptgroup;
}

// Save uploaded font attributes to IndexedDB
async function saveFontToIndexedDB(fontName, attributes) {
    const db = await initIndexedDB();
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    const fontDataToStore = { name: fontName, ...attributes };
    const request = store.put(fontDataToStore);

    request.onsuccess = function() {
        console.log("Font attributes saved to IndexedDB:", fontName);
    };
    request.onerror = function(event) {
        console.error("Failed to save font:", event.target.error);
    };
}

// Load fonts from IndexedDB and add them to the "Uploaded" optgroup
async function loadFontsFromIndexedDB() {
    const db = await initIndexedDB();
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);

    const request = store.getAll();
    request.onsuccess = function(event) {
        const fonts = event.target.result;

        if (fonts.length > 0) {
            const uploadedOptgroup = document.createElement('optgroup');
            uploadedOptgroup.label = "Uploaded";
            uploadedOptgroup.id = "uploadedOptgroup";

            fonts.forEach(font => {
                const newOption = document.createElement("option");
                newOption.value = font.name;
                newOption.textContent = font.name;
                for (const [key, value] of Object.entries(font)) {
                    if (key !== 'name') newOption.setAttribute(key, value);
                }
                uploadedOptgroup.appendChild(newOption);
            });

            document.getElementById('fontForWorksheetPages').appendChild(uploadedOptgroup);
        }
    };
}

// Clear fonts from IndexedDB and update the font dropdown
async function clearFontsFromIndexedDB() {
    const db = await initIndexedDB();
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    const fontSelect = document.getElementById('fontForWorksheetPages');
    const previousSelectedFont = fontSelect.value;

        // Check if the previously selected font was in the "Uploaded" optgroup
    const wasUploadedFont = document.querySelector(`#uploadedOptgroup option[value='${previousSelectedFont}']`);


    const request = store.clear();
    request.onsuccess = function() {
        console.log("All fonts cleared from IndexedDB.");
        // Remove "Uploaded" optgroup if it exists
        const uploadedOptgroup = document.getElementById('uploadedOptgroup');
        if (uploadedOptgroup) {
            uploadedOptgroup.remove();
        }

        // Reset font selection
        resetFontSelection(previousSelectedFont,wasUploadedFont);
    };
    request.onerror = function(event) {
        console.error("Failed to clear fonts:", event.target.error);
    };
}

// Clear fonts from IndexedDB and update the font dropdown
async function clearFontsFromIndexedDBOLD() {
    const db = await initIndexedDB();
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    const fontSelect = document.getElementById('fontForWorksheetPages');
    const previousSelectedFont = fontSelect.value;

    const request = store.clear();
    request.onsuccess = function() {
        console.log("All fonts cleared from IndexedDB.");
        // Clear "Uploaded" optgroup
        const uploadedOptgroup = document.getElementById('uploadedOptgroup');
        if (uploadedOptgroup) {
            uploadedOptgroup.innerHTML = '';
        }

        // Reset selection to the first font in the first optgroup if needed
        resetFontSelection(previousSelectedFont);
    };
    request.onerror = function(event) {
        console.error("Failed to clear fonts:", event.target.error);
    };
}


// Reset font selection after clearing IndexedDB
function resetFontSelection(previousSelectedFont, wasUploadedFont) {
    const fontSelect = document.getElementById('fontForWorksheetPages');


    if (wasUploadedFont) {
        // If previously selected font was uploaded, select the first font in the first optgroup
        const firstOptgroup = fontSelect.querySelector('optgroup');
        const firstFontOption = firstOptgroup ? firstOptgroup.querySelector('option') : null;

        if (firstFontOption) {
            fontSelect.value = firstFontOption.value;
        }
    } else {
        // Otherwise, reselect the previously selected font
        fontSelect.value = previousSelectedFont;
    }

    loadSelectedFontOptionSettingsIntoFields();
    loadFontAndMakeWorksheetPages();
}

// Update font attributes in IndexedDB and <option> when changed
function updateFontAttributesInOption() {
    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];

    const fontGlyphNibWidthInputField = document.getElementById('fontGlyphNibWidth').value;
    const xHeightFontScaleFactorField = document.getElementById('xHeightFontScaleFactor').value;
    const ascenderField = document.getElementById('ascenderHeight').value;
    const capHeightField = document.getElementById('capitalHeight').value;
    const descenderDepthField = document.getElementById('descenderDepth').value;
    const fontYOffsetField = document.getElementById('fontYOffset').value;


    selectedOption.setAttribute('fontGlyphNibWidth', fontGlyphNibWidthInputField);
    selectedOption.setAttribute('xHeightFontScaleFactor', xHeightFontScaleFactorField);
    selectedOption.setAttribute('ascenderRatio', ascenderField);
    selectedOption.setAttribute('capHeightRatio', capHeightField);
    selectedOption.setAttribute('descenderDepthRatio', descenderDepthField);
    selectedOption.setAttribute('fontYOffset', fontYOffsetField);

    // Save updated attributes to IndexedDB
    const attributes = {
        fontGlyphNibWidth: fontGlyphNibWidthInputField,
        xHeightFontScaleFactor: xHeightFontScaleFactorField,
        ascenderRatio: ascenderField,
        capHeightRatio: capHeightField,
        descenderDepthRatio: descenderDepthField,
        fontYOffset: fontYOffsetField,
        fontFileData: selectedOption.getAttribute('fontFileData')
    };
    saveFontToIndexedDB(selectedOption.value, attributes);
}

// Add event listener to inputs with the .fontAttribute class
document.querySelectorAll('.fontAttribute').forEach(input => {
    input.addEventListener('change', updateFontAttributesInOption);
});


document.addEventListener('DOMContentLoaded', () => {
    // Get the select element
    const effectSelect = document.getElementById('effectSelect');

    // Add an event listener to the select element
    effectSelect.addEventListener('change', function () {
        applyCurrentGlyphFilter();
    });


});



function applyCurrentGlyphFilter() {
    // Query all the SVGs that have the 'worksheetPage' class
    const svgElements = document.querySelectorAll('svg.worksheetPage');

    // Loop through each SVG and apply the filter
    svgElements.forEach(svg => {
        const glyphs = svg.querySelectorAll('.practiceSheetGlyph'); // Find glyphs inside each SVG
       console.log(glyphs);
       const effectSelect = document.getElementById('effectSelect');
       const selectedEffect = effectSelect.options[effectSelect.selectedIndex];

        applyFilterToGlyphs(glyphs, selectedEffect.value);
    });
}


// Function to apply the filter to a given set of glyphs
function applyFilterToGlyphs(glyphElements, filterId) {
    glyphElements.forEach(glyph => {
        if (filterId) {
            glyph.setAttribute('filter', `url(#${filterId})`);
        } else {
            glyph.removeAttribute('filter');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Get the select element
    const effectSelect = document.getElementById('effectSelect');
  
    // Add an event listener to the select element
    effectSelect.addEventListener('change', function() {
      // Query all the SVGs that have the 'worksheetPage' class
      const svgElements = document.querySelectorAll('svg.worksheetPage');
      
      applyFilterToGlyphs();
      // Loop through each SVG and apply the filter
      svgElements.forEach(svg => {
        const glyphs = svg.querySelectorAll('.practiceSheetGlyph'); // Find glyphs inside each SVG
        console.log(glyphs);
        const selectedEffect = this.value;
        applyFilterToGlyphs(glyphs, selectedEffect);
      });
   
    });
  
    
  });
  



  // Initial values for dynamic variables
let outlineRadius = 20;
let outlineColor = 'cyan';
let dropShadowStdDeviation = 30;
let dropShadowDx = 4;
let dropShadowDy = 4;
let glowStdDeviation = 25;
let glowColor = 'cyan';
let glowOpacity = 0.9;

// Function to generate the SVG filters template
function getSvgFilters() {
  return `
    <defs>
      <!-- Outline Effect -->
      <filter id="outline">
        <feMorphology operator="dilate" radius="${outlineRadius}" in="SourceAlpha" result="thickened" />
        <feFlood flood-color="${outlineColor}" result="outlineColor" />
        <feComposite in="outlineColor" in2="thickened" operator="in" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Drop Outline Effect -->
      <filter id="dropOutline">
        <feMorphology operator="dilate" radius="${outlineRadius}" in="SourceAlpha" result="thickened" />
        <feFlood flood-color="${outlineColor}" result="outlineColor" />
        <feComposite in="outlineColor" in2="thickened" operator="in" />
        <feOffset dx="${outlineRadius}" dy="${outlineRadius}" result="offset1" /> 
        <feMerge>
          <feMergeNode />
          <feMergeNode in="offset1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Drop Shadow Effect -->
      <filter id="dropShadow">
        <feGaussianBlur in="SourceAlpha" stdDeviation="${dropShadowStdDeviation}" result="blur" />
        <feOffset in="blur" dx="${dropShadowDx}" dy="${dropShadowDy}" result="offsetBlur" />
        <feFlood flood-color="black" flood-opacity="0.5" />
        <feComposite in2="offsetBlur" operator="in" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Glow Effect -->
      <filter id="glow">
        <feGaussianBlur in="SourceAlpha" stdDeviation="${glowStdDeviation}" result="blur" />
        <feFlood flood-color="${glowColor}" flood-opacity="${glowOpacity}" />
        <feComposite in2="blur" operator="in" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Bevel Effect -->
      <filter id="bevel">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.75" specularExponent="20" lighting-color="white" result="specOut">
          <fePointLight x="50" y="50" z="200" />
        </feSpecularLighting>
        <feComposite in="specOut" in2="SourceAlpha" operator="in" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  `;
}


// Function to add filters to the SVG
function addFiltersToSVG(svgElement) {
  svgElement.insertAdjacentHTML('afterbegin', getSvgFilters());
}



  