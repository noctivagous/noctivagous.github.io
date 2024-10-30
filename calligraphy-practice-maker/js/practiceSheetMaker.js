

document.addEventListener('DOMContentLoaded', function () {
    // Initialize and add event listeners
    init();



});

function generateScrollbarThumbnailForWorksheetArea() {
    const worksheetArea = document.getElementById('generatedWorksheetArea');
    const scrollbarContainer = document.getElementById('worksheetAreaScrollbar');

    // Clear existing content
    scrollbarContainer.innerHTML = '';

    // Create a canvas for generating the thumbnail of the entire worksheet area
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions proportional to the worksheet area size
    const scaleFactor = 0.1; // Adjust to control the size of the thumbnail
    canvas.width = worksheetArea.offsetWidth * scaleFactor;
    canvas.height = worksheetArea.offsetHeight * scaleFactor;

    // Loop through each SVG inside the worksheet area to render them on the canvas
    const svgElements = worksheetArea.querySelectorAll('svg.worksheetPage');

    svgElements.forEach((svg, index) => {
        // Serialize the SVG into a string
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function () {
            // Calculate positioning based on index and canvas scaling
            const xPosition = 0;
            const yPosition = index * canvas.height / svgElements.length;

            // Draw the SVG onto the canvas
            ctx.drawImage(img, xPosition, yPosition, canvas.width, canvas.height / svgElements.length);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    });

    // Append canvas to the scrollbar container
    scrollbarContainer.appendChild(canvas);
}


/* SCROLLBARS */

// Initialize the scrollbars for #generatedWorksheetArea



document.addEventListener('DOMContentLoaded', function () {
    // Initialize the scrollbars for #controls
    const controls = document.getElementById('controls');
    const controlsScrollbar = document.getElementById('controlsScrollbar');
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    controlsScrollbar.appendChild(thumb);

    function updateThumbPosition() {
        const scrollHeight = controls.scrollHeight - controls.clientHeight;
        const thumbHeight = Math.max(30, (controls.clientHeight / controls.scrollHeight) * controlsScrollbar.clientHeight);
        thumb.style.height = (thumbHeight - 5) + 'px';
        const scrollRatio = controls.scrollTop / scrollHeight;
        const thumbTop = scrollRatio * (controlsScrollbar.clientHeight - thumbHeight);
        thumb.style.top = thumbTop + 'px';
    }

    function onThumbMouseDown(event) {
        event.preventDefault();
        const startY = event.clientY;
        const startTop = parseInt(thumb.style.top, 10) || 0;

        function onMouseMove(event) {
            const deltaY = event.clientY - startY;
            const newTop = Math.min(
                Math.max(0, startTop + deltaY),
                controlsScrollbar.clientHeight - thumb.clientHeight
            );
            thumb.style.top = newTop + 'px';

            const scrollHeight = controls.scrollHeight - controls.clientHeight;
            const scrollRatio = newTop / (controlsScrollbar.clientHeight - thumb.clientHeight);
            controls.scrollTop = scrollHeight * scrollRatio;
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    thumb.addEventListener('mousedown', onThumbMouseDown);
    controls.addEventListener('scroll', updateThumbPosition);
    window.addEventListener('resize', updateThumbPosition);

    updateThumbPosition();


    // Initialize the scrollbars for #generatedWorksheetArea
    const generatedWorksheetArea = document.getElementById('generatedWorksheetArea');
    const worksheetAreaScrollbar = document.getElementById('worksheetAreaScrollbar');
    const generatedThumb = document.createElement('div');
    generatedThumb.id = "generatedThumb";
    generatedThumb.className = 'thumb';
    worksheetAreaScrollbar.appendChild(generatedThumb);

    function updateGeneratedThumbPosition() {
        const scrollHeight = generatedWorksheetArea.scrollHeight - generatedWorksheetArea.clientHeight;
        const thumbHeight = Math.max(30, (generatedWorksheetArea.clientHeight / generatedWorksheetArea.scrollHeight) * worksheetAreaScrollbar.clientHeight);
        generatedThumb.style.height = thumbHeight + 'px';
        const scrollRatio = generatedWorksheetArea.scrollTop / scrollHeight;
        const thumbTop = scrollRatio * (worksheetAreaScrollbar.clientHeight - thumbHeight);
        generatedThumb.style.top = thumbTop + 'px';
    }

    function onGeneratedThumbMouseDown(event) {
        event.preventDefault();
        const startY = event.clientY;
        const startTop = parseInt(generatedThumb.style.top, 10) || 0;

        function onMouseMove(event) {
            const deltaY = event.clientY - startY;
            const newTop = Math.min(
                Math.max(0, startTop + deltaY),
                worksheetAreaScrollbar.clientHeight - generatedThumb.clientHeight
            );
            generatedThumb.style.top = newTop + 'px';

            const scrollHeight = generatedWorksheetArea.scrollHeight - generatedWorksheetArea.clientHeight;
            const scrollRatio = newTop / (worksheetAreaScrollbar.clientHeight - generatedThumb.clientHeight);
            generatedWorksheetArea.scrollTop = scrollHeight * scrollRatio;
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    // Define a globally accessible proxy to the function
    window.updateGeneratedThumbPosition = updateGeneratedThumbPosition;


    generatedThumb.addEventListener('mousedown', onGeneratedThumbMouseDown);
    generatedWorksheetArea.addEventListener('scroll', updateGeneratedThumbPosition);
    window.addEventListener('resize', updateGeneratedThumbPosition);

    updateGeneratedThumbPosition();
});
document.getElementById('uploadFont').addEventListener('click', function () {
    document.getElementById('fontFileInput').click();
});

document.getElementById('fontFileInput').addEventListener('change', function (event) {
    handleFontFileUpload(event.target.files[0]);
});


// Function to handle font file upload and save all attributes
function handleFontFileUpload(file) {

    dropArea.style.color = '#999';

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const binary = new Uint8Array(e.target.result);
            let binaryString = '';
            for (let i = 0; i < binary.byteLength; i++) {
                binaryString += String.fromCharCode(binary[i]);
            }
            const base64String = btoa(binaryString);
            const fontName = file.name.replace(/\.[^/.]+$/, "");

            if (isFontInSelectControlList(fontName)) {
                return;
            }

            const uploadedOptgroup = ensureUploadedOptgroupExists();
            const newOption = document.createElement('option');
            newOption.value = fontName;
            newOption.textContent = fontName;
            newOption.setAttribute('fontFileData', base64String);
            newOption.setAttribute('fontGlyphNibWidth', '5'); // Default value
            newOption.setAttribute('ascenderRatio', '0.45'); // Default value
            newOption.setAttribute('capHeightRatio', '0.6'); // Default value
            newOption.setAttribute('descenderDepthRatio', '0.45'); // Default value
            newOption.setAttribute('fontGlyphScaleFactor', '1.0'); // Default value
            newOption.setAttribute('fontYOffset', '0.0'); // Default value

            uploadedOptgroup.appendChild(newOption);
            document.getElementById('fontForWorksheetPages').value = fontName;

            // Save all attributes to IndexedDB
            const attributes = {
                fontFileData: base64String,
                fontGlyphNibWidth: '5',
                ascenderRatio: '0.45',
                capHeightRatio: '0.6',
                descenderDepthRatio: '0.45',
                fontGlyphScaleFactor: '1.0',
                fontYOffset: '0.0'
            };
            saveFontToIndexedDB(fontName, attributes);

            loadSelectedFontOptionSettingsIntoFields();
            loadFontAndMakeWorksheetPages();
        };
        reader.readAsArrayBuffer(file);
    }
}


function isFontInSelectControlList(fontName) {
    const fontSelect = document.getElementById('fontForWorksheetPages');

    // Check if the font has already been uploaded
    let fontExists = false;
    for (let i = 0; i < fontSelect.options.length; i++) {
        if (fontSelect.options[i].value === fontName) {
            alert(`The font '${fontName}' has already been uploaded.`);
            fontExists = true;
            break;
        }
    }

    return fontExists
}

// Handling the drag-and-drop functionality for "Drop file here" area
const dropArea = document.getElementById('dropArea');

dropArea.addEventListener('dragover', function (event) {
    event.preventDefault();
    dropArea.style.backgroundColor = '#999'; // Change style to indicate it's ready for drop
    dropArea.style.color = '#333';
});

dropArea.addEventListener('dragleave', function () {
    dropArea.style.backgroundColor = '#494949'; // Revert style after drag leaves
    dropArea.style.color = '#999';
});

dropArea.addEventListener('drop', function (event) {
    event.preventDefault();
    dropArea.style.backgroundColor = '#494949'; // Revert style after file is dropped
    dropArea.style.color = '#999';
    const file = event.dataTransfer.files[0];
    handleFontFileUpload(file);
});



function init() {

    setDefaults();
    loadFontsFromIndexedDB();  // Load fonts at initialization


    var fontChangingControls = document.querySelectorAll('#showFont, #fontForWorksheetPages');

    fontChangingControls.forEach(function (fontRelatedControl) {
        fontRelatedControl.addEventListener('change', function () {
            if (document.getElementById('showFont').checked) {
                loadFontAndMakeWorksheetPages();
            } else {
                makeWorksheetPages(); // Generate without loading a new font
            }
        });
    });

    // Initial call to generate worksheet pages
    if (document.getElementById('showFont').checked) {
        loadFontAndMakeWorksheetPages();
    } else {
        makeWorksheetPages(); // Generate without loading a new font
    }
}

async function downloadPDF() {
    // Import jsPDF and svg2pdf modules
    const { jsPDF } = window.jspdf;

    // Create a new jsPDF instance
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: getPaperSizeOriented(), // Example paper size corresponding to SVG size
    });

    // Get all SVG elements representing the worksheet pages
    const svgElements = document.querySelectorAll('.worksheetPage');

    for (let i = 0; i < svgElements.length; i++) {
        if (i > 0) {
            // Add a new page for each SVG
            pdf.addPage();
        }

        // Get the SVG element
        const svgElement = svgElements[i];


        try {
            // Use await to ensure that the conversion is completed before continuing
            await convertTextToPathsWithKerning(svgElement);
            ////
        } catch (error) {
            console.error('Error converting text to paths:', error);
        }

        // Directly use svg2pdf to convert the SVG to PDF
        await svg2pdf(svgElement, pdf, {
            xOffset: marginHorizontal / 2,
            yOffset: marginVertical / 2,
            scale: 1, // Adjust scale as needed
        });
    }

    // Save the PDF
    pdf.save('worksheet.pdf');

}


async function printPDF() {

    // Check if the browser is Safari.
    // When Safari prints, it scales the SVG up

    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (!isSafari) {
        // If not Safari, invoke the print function
        window.print();
    } else {

        // Safari-specific action


        // Determine the selected orientation
        const selectedOrientation = document.querySelector('input[name="orientation"]:checked').value;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: selectedOrientation,
            unit: 'pt',
            format: getPaperSizeOriented(), // Paper size oriented from your form
        });

        const svgElements = document.querySelectorAll('.worksheetPage');

        for (let i = 0; i < svgElements.length; i++) {
            if (i > 0) {
                pdf.addPage();
            }

            const svgElement = svgElements[i];

            try {
                // Ensure that text is converted to paths
                await convertTextToPathsWithKerning(svgElement);
            } catch (error) {
                console.error('Error converting text to paths:', error);
            }

            await svg2pdf(svgElement, pdf, {
                xOffset: marginHorizontal / 2,
                yOffset: marginVertical / 2,
                scale: 1,
            });
        }

        // Open the print dialog with the generated PDF content
        window.open(pdf.output('bloburl'));


    }
}


async function convertTextToPathsWithKerning(svgElement) {
    const fontUrl = 'fonts/noto-sans.regular.ttf'; // Update with your font file location
    const font = await opentype.load(fontUrl);

    const textElements = svgElement.querySelectorAll('text');
    textElements.forEach(textElement => {
        var text = textElement.textContent;

        // Use replace to remove the specific symbols
        text = text.replace(/[⬏⬎]/g, '');

        const fontSize = parseFloat(textElement.getAttribute('font-size')) || 16;
        const x = parseFloat(textElement.getAttribute('x')) || 0;
        const y = parseFloat(textElement.getAttribute('y')) || 0;

        let currentX = x;
        let pathData = "";

        // Get the glyphs and apply kerning manually
        const glyphs = font.stringToGlyphs(text);
        for (let i = 0; i < glyphs.length; i++) {
            const glyph = glyphs[i];
            const glyphPath = glyph.getPath(currentX, y, fontSize);
            pathData += glyphPath.toPathData();

            // Move to the next position based on the width of the current glyph
            currentX += glyph.advanceWidth * (fontSize / font.unitsPerEm);

            // Apply kerning between the current glyph and the next one
            if (i < glyphs.length - 1) {
                const kerningValue = font.getKerningValue(glyph, glyphs[i + 1]);
                currentX += kerningValue * (fontSize / font.unitsPerEm);
            }
        }

        // Create a new path element
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', pathData);
        pathElement.setAttribute('fill', textElement.getAttribute('fill') || 'black');

        // Replace text element with path element
        textElement.parentNode.replaceChild(pathElement, textElement);
    });
}

async function loadFontAndMakeWorksheetPages() {
    try {


        loadSelectedFontOptionSettingsIntoFields();

        showFont = document.getElementById('showFont').checked;


        if (!showFont) {
            makeWorksheetPages();
            return;
        }



        const fontSelect = document.getElementById('fontForWorksheetPages');
        const fontName = fontSelect.value;
        const fontUrl = getFontUrl(fontName);
        const selectedOption = fontSelect.options[fontSelect.selectedIndex];

        const fontFileData = selectedOption.getAttribute('fontFileData'); // Assume stored as base64


        if (fontFileData) {
            document.getElementById('nibWidthsTall').disabled = false;
        }

        // Load the font asynchronously

        if (fontFileData) {
            // Decode the base64-encoded fontFileData into an ArrayBuffer
            const byteString = atob(fontFileData);
            const byteArray = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                byteArray[i] = byteString.charCodeAt(i);
            }
            const arrayBuffer = byteArray.buffer;

            // Load the font using opentype.parse()
            font = opentype.parse(arrayBuffer);
            makeFontMetrics();
        } else if (fontUrl) {
            // Load the font asynchronously using opentype.load()
            font = await loadFontAsync(fontUrl);
            makeFontMetrics();
            ////
        } else {
            throw new Error("No valid font source found (URL or fontFileData missing).");
        }



        fontWasLoadedForShowFont = true;
        makeWorksheetPages();  // Only called once the font is fully loaded
    } catch (error) {
        console.error("Error loading font:", error);
        alert('Could not load font: ' + error);
        fontWasLoadedForShowFont = false;
    }
}




function loadFontAsync(fontUrl) {
    return new Promise((resolve, reject) => {
        opentype.load(fontUrl, function (err, loadedFont) {
            if (err) {
                console.error("Error loading font:", err);
                reject('Could not load font: ' + err);
            } else {
                ////
                ////
                ////
                ////
                resolve(loadedFont);
            }
        });
    });
}


function makeFontMetrics() {

    if (showFont && font) {
        var fontSelect = document.getElementById('fontForWorksheetPages');
        // Get the selected <option> element
        const selectedOption = fontSelect.options[fontSelect.selectedIndex];

        // Pull ascender, capital height, and descender ratios from the <option>
        let ascenderRatio = parseFloat(selectedOption.getAttribute('ascenderRatio'));
        ascenderRatio = isNaN(ascenderRatio) ? 0.45 : ascenderRatio;

        let capHeightRatio = parseFloat(selectedOption.getAttribute('capHeightRatio'));
        capHeightRatio = isNaN(capHeightRatio) ? 0.45 : capHeightRatio;

        let descenderDepthRatio = parseFloat(selectedOption.getAttribute('descenderDepthRatio'));
        descenderDepthRatio = isNaN(descenderDepthRatio) ? 0.45 : descenderDepthRatio;

        let fontGlyphNibWidth = parseFloat(selectedOption.getAttribute('fontGlyphNibWidth')); // Default value if not provided
        fontGlyphNibWidth = isNaN(fontGlyphNibWidth) ? 0.45 : fontGlyphNibWidth;


        // Pull the user's nib width
        let nibWidthPt = getNibWidthPt();// parseFloat(document.getElementById('nibWidthMm').value); // Assuming you have a nibWidthPt input element


        // Calculate font scaling factor based on the nib width and fontGlyphNibWidth
        let fontScaleFactorToMakeXHeight = fontGlyphNibWidth / nibWidthPt;

        // The width of the font is given.  What it takes to make the X-Height nib guide blocks the same
        // approximate width of the overall brushstroke width of the font's design.
        //setNibWidthsTall((fontGlyphNibWidth / nibWidthPt).toFixed(2));

        // Set the nibWidthsTall to reflect the adjusted x-height
        setNibWidthsTall((nibWidthPt * fontScaleFactorToMakeXHeight).toFixed(2));



        // Update the metrics using the calculated scaling factors
        setFontMetrics(ascenderRatio, capHeightRatio, descenderDepthRatio);

        // Debugging logs for insight
        //        ////
        ////
        ////
        ////
    }
}

var brushWidthOfFontGlobal = 10;

function setFontMetrics(ascenderRatio, capitalRatio, descenderRatio) {
    // Update the values for ascender, capital, and descender heights
    document.getElementById('ascenderHeight').value = ascenderRatio.toFixed(2);
    document.getElementById('capitalHeight').value = capitalRatio.toFixed(2);
    document.getElementById('descenderDepth').value = descenderRatio.toFixed(2);

    // Optionally, update the internal variables if needed
    ascenderMultiplier = ascenderRatio;
    capitalMultiplier = capitalRatio;
    descenderMultiplier = descenderRatio;
    //    brushWidthOfFontGlobal = fontGlyphNibWidth;
}

function checkForUIBoundaries() {
    /*
    const arrangement = document.getElementById('practiceCharactersArrangement').value;

    // Check if "rowsOfSingleCharacter" is selected
    if (arrangement === "rowsOfSingleCharacter") {
        const characterSelect = document.getElementById('caseSelection');

        // If "customText" is currently selected, deselect it and select the first option
        if (characterSelect.value === "customText") {
            characterSelect.selectedIndex = 0; // Select the first option
        }
    }*/

}

async function makeWorksheetPages() {

    // falert();

    showHideSections();

    setNibWidthPtFromMM(document.getElementById("nibWidthMm").value);

    pullPaperSizeFromFormFields();

    emptyWorksheetArea();

    checkForUIBoundaries();

    //const numberOfPages = Math.ceil(rowsWithCharactersArray.length / calculateTotalLinesPerPage());


    // Generate rows of characters based on the arrangement
    const rowsWithCharactersArray = generateRowsOfCharacters(); // Get the rows of characters


    // Calculate the total number of pages
    // Determine the number of pages based on the rows of characters
    var numberOfPages = calculateNumberOfPages(rowsWithCharactersArray);

    // Update the page count span
    updatePageCountDisplay(numberOfPages);



    if ((showFont == false) || !font) {

        numberOfPages = 1;
        document.getElementById('nibWidthsTall').disabled = false;
    }



    if (showFont && font) {
        const fontSelect = document.getElementById('fontForWorksheetPages');
        const fontName = fontSelect.value;
        const fontUrl = getFontUrl(fontName);
        const selectedOption = fontSelect.options[fontSelect.selectedIndex];

        const fontFileData = selectedOption.getAttribute('fontFileData'); // Assume stored as base64

        // don't allow adjustments of x-height (nibWidthsTall)
        // if the font is built-in.
        if (fontFileData) {
            // fontFileData is an uploaded font
            document.getElementById('nibWidthsTall').disabled = false;

        }
        else {
            // fontURL is a built-in font
            document.getElementById('nibWidthsTall').disabled = true;
        }

    }


    for (let i = 0; i < numberOfPages; i++) {
        const svg = createSVGElement();

        // Append SVG to worksheetPagesContainer
        const container = document.getElementById('worksheetPagesContainer');
        container.appendChild(svg);

        // Call drawWorksheet(svg, i)
        await drawWorksheet(svg, i, rowsWithCharactersArray);  // Pass the rows array to drawWorksheet
    }

    applyCurrentGlyphFilter();

    updateGeneratedThumbPosition();
}


function updatePageCountDisplay(numberOfPages) {
    const pageCountSpan = document.getElementById('outputPageCount');

    if (numberOfPages === 1) {
        pageCountSpan.textContent = '(1 Page)';
    } else {
        pageCountSpan.textContent = `(${numberOfPages} Pages)`;
    }
}


function calculateNumberOfPages(rows) {
    // Get the number of lines per page
    const linesPerPage = calculateTotalLinesPerPage();//calculateAvailableLinesPerPage();

    // Calculate the number of pages needed to render all rows
    const numberOfPages = Math.ceil(rows.length / linesPerPage);

    ////
    ////
    ////
    ////

    return numberOfPages;
}





var fontCharactersSpacing = 0; //parseFloat(document.getElementById('fontCharactersSpacing').value || 30.0);

var fontSpacingMultipliers = {
    rowsOfCharacters: 1.0,            // Row: Sequence With Blank Row
    rowsOfCharactersSpaced: 2.0,      // Row: Sequence With 2X Spacing
    rowOfSingleCharacter: 1.0,        // Row: Character - Repeat
    pageOfSingleCharacter: 0.0,       // Row: Character - Single
    singleCharacterAtLeft: 1.0        // Column of Sequence
};

var fontSpacingFixedDefaultValues = {
    rowsOfCharacters: 30,            // Row: Sequence With Blank Row
    rowsOfCharactersSpaced: 60,      // Row: Sequence With 2X Spacing
    rowOfSingleCharacter: 1.0,        // Row: Character - Repeat
    pageOfSingleCharacter: 0.0,       // Row: Character - Single
    singleCharacterAtLeft: 1.0        // Column of Sequence
};

var fontSpacingFixedDefaultValues = {
    lowercaseOnly: 30,                     // Lowercase Set
    uppercaseOnly: 60,                    // Uppercase Set
    bothUppercaseAndLowercase: 1.0,        // Lowercase + Uppercase Sets
    mixedCasePairsLowerFirst: 0.0,        // Pairs: Lowercase-Uppercase
    customText: 0.0,
};

var fontSpacingFixedDefaultValuesPermutations = {
    "rowsOfCharacterslowercaseOnly": 30,
    "rowsOfCharactersuppercaseOnly": 30,
    "rowsOfCharactersbothUppercaseAndLowercase": 30,
    "rowsOfCharactersmixedCasePairsLowerFirst": 10,
    "rowsOfCharacterscustomText": 0,

    "rowsOfCharactersSpacedlowercaseOnly": 90,
    "rowsOfCharactersSpaceduppercaseOnly": 90,
    "rowsOfCharactersSpacedbothUppercaseAndLowercase": 90,
    "rowsOfCharactersSpacedmixedCasePairsLowerFirst": 90,
    "rowsOfCharactersSpacedcustomText": 90,

    "rowOfSingleCharacterlowercaseOnly": 30,
    "rowOfSingleCharacteruppercaseOnly": 30,
    "rowOfSingleCharacterbothUppercaseAndLowercase": 30,
    "rowOfSingleCharactermixedCasePairsLowerFirst": 30,
    "rowOfSingleCharactercustomText": 0,

    "pageOfSingleCharacterlowercaseOnly": 90,
    "pageOfSingleCharacteruppercaseOnly": 90,
    "pageOfSingleCharacterbothUppercaseAndLowercase": 90,
    "pageOfSingleCharactermixedCasePairsLowerFirst": 90,
    "pageOfSingleCharactercustomText": 90,

    "singleCharacterAtLeftlowercaseOnly": 30,
    "singleCharacterAtLeftuppercaseOnly": 30,
    "singleCharacterAtLeftbothUppercaseAndLowercase": 30,
    "singleCharacterAtLeftmixedCasePairsLowerFirst": 30,
    "singleCharacterAtLeftcustomText": 0

};




function getFontCharactersSpacingFixed() {

    const arrangement = document.getElementById('practiceCharactersArrangement').value;
    const caseSelection = document.getElementById('caseSelection').value;

    var permutationStringKey = `${arrangement}${caseSelection}`;

    var value = fontSpacingFixedDefaultValuesPermutations[permutationStringKey];

    //console.log(`${permutationStringKey}: ${value}`);

    //    fontCharactersSpacing = parseFloat(document.getElementById('fontCharactersSpacing').value || 30.0);

    return value;//fontCharactersSpacing;
}

function setFontCharactersSpacingFixed(spacing) {

    const arrangement = document.getElementById('practiceCharactersArrangement').value;
    const caseSelection = document.getElementById('caseSelection').value;
    const permutationStringKey = `${arrangement}${caseSelection}`;

  
    if (typeof fontSpacingFixedDefaultValuesPermutations[permutationStringKey] !== 'undefined') {
        fontSpacingFixedDefaultValuesPermutations[permutationStringKey] = spacing;
    } else {
        console.log(`The key "${permutationStringKey}" is undefined.`);
    }
    fontCharactersSpacing = spacing;

}

document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('fontCharactersSpacing').addEventListener('input', function () {
        const value = parseFloat(this.value);
        setFontCharactersSpacingFixed(value);
    });

});

function getFontCharactersSpacing() {
    // Get the base spacing value from the input or default
    var fontSpacingFixed = getFontCharactersSpacingFixed();

    // Get the arrangement type
    var arrangement = document.getElementById('practiceCharactersArrangement').value;



    // Get the multiplier for the selected arrangement type
    var multiplier = fontSpacingMultipliers[arrangement] || 1.0;

    // Calculate the adjusted spacing
    var spacingMultipied = baseSpacing * multiplier;

    return spacingMultipied;
}


function generateRowsOfCharacters() {



    let characterRows = [];

    // If the font is not to be displayed, generate blank rows for all lines
    if (!showFont) {
        for (let i = 0; i < calculateTotalLinesPerPage(); i++) {
            characterRows.push("");
        }
        //
        return characterRows;
    }

    const arrangement = document.getElementById('practiceCharactersArrangement').value;
    var characters = getSelectedCharacters();
    const linesPerPage = calculateTotalLinesPerPage();
    let charIndex = 0;

    //
    //
    //

    const [paperWidthOrientedRaw, paperHeightOrientedRaw] = getPaperSizeOriented();

    const width = paperWidthOrientedRaw - marginHorizontal - getInitialXPositionToStartGlyphs();




    // Step 1: Generate an array of character rows without any empty lines
    if (arrangement === "rowsOfCharacters") {

        fontCharactersSpacing = getFontCharactersSpacingFixed();

        while (charIndex < characters.length) {
            let currentRow = [];
            let currentLineWidth = 0;
            let lastCharLowerCase = false;


            while (charIndex < characters.length) {
                const char = characters[charIndex];

                // If a newline character is encountered, break and start a new row
                if (char === '\n') {
                    //
                    charIndex++;
                    break;
                }

                const glyph = font.charToGlyph(char);

                if (glyph) {
                    
                    const charWidthWithSpacing = (glyph.advanceWidth * getFontScaleFactor()) + getFontCharactersSpacingFixed();

                    if (currentLineWidth + charWidthWithSpacing <= width) {
                        lastCharLowerCase = /[a-z]/.test(char);  // Check if last char is lowercase

                        currentRow.push(char);
                        currentLineWidth += charWidthWithSpacing;

                        charIndex++;
                    }

                    else {
                        //
                        break;
                    }
                } else {
                    console.warn(`Glyph not found for character: ${char}`);
                    charIndex++;
                }
            }

            if (currentRow.length > 0) {
                characterRows.push(currentRow);
                //
            }
        }

    }
    else if (arrangement === "rowsOfCharactersSpaced") {
        //alert(arrangement);

        const [paperWidthOrientedRaw, paperHeightOrientedRaw] = getPaperSizeOriented();


        while (charIndex < characters.length) {
            let currentRow = [];
            let currentLinePosition = 0;
            let lastCharLowerCase = false;



            while (charIndex < characters.length) {
                const char = characters[charIndex];

                // If a newline character is encountered, break and start a new row
                if (char === '\n') {
                    //
                    charIndex++;
                    break;
                }

                const glyph = font.charToGlyph(char);

                // console.log(`paperWidthOrientedRaw: ${paperWidthOrientedRaw}`);
                if (glyph) {

                    //var charWidthWithSpacing = (glyph.advanceWidth * getFontScaleFactor()) * 4;

                    const avgCharWidthOfFont = getAverageCharWidthNoScaling(font,characters);
                    const glyphAdvanceForChar = glyph.advanceWidth;
                    const upperBoundCharWidth = getUpperBoundCharWidthNoScaling(font,characters);

                    const charSpacing1 =  avgCharWidthOfFont * getFontScaleFactor();



                    const charWidthWithSpacing = glyphAdvanceForChar + getFontCharactersSpacingFixed();



                    if ((currentLinePosition + charWidthWithSpacing) <= (width)) {
                        lastCharLowerCase = /[a-z]/.test(char);  // Check if last char is lowercase

                        //console.log(`${char}:  + ${currentLinePosition} + ${charWidthWithSpacing} = (${ charWidthWithSpacing + currentLinePosition}) <= ${width - getInitialXPositionToStartGlyphs()}`);

                        currentRow.push(char);
                        currentLinePosition += charWidthWithSpacing;

                        charIndex++;
                    } else {
                        //
                        break;
                    }
                } else {
                    console.warn(`Glyph not found for character: ${char}`);
                    charIndex++;
                }
            }

            if (currentRow.length > 0) {
                characterRows.push(currentRow);
                //
            }
        }

    }

    else if (arrangement === "singleCharacterAtLeft") {

        const selectedValue = document.getElementById("caseSelection").value;
        if (selectedValue == "mixedCasePairsLowerFirst") {

            characters = mixedCasePairsString.replace(/\s+/g, '').substring(0, 65);
            characters = Array.from(characters);

        }

        // Each row gets one character for "singleCharacterAtLeft"
        while (charIndex < characters.length) {
            characterRows.push([characters[charIndex]]);
            //
            charIndex++;
        }
    }
    // Handle "rowOfSingleCharacter" arrangement
    else if (arrangement === "rowOfSingleCharacter" && characters.length > 0) {
        const [paperWidthOrientedRaw, paperHeightOrientedRaw] = getPaperSizeOriented();

        const selectedValue = document.getElementById("caseSelection").value;
        if (selectedValue === "customText") {
            // Remove all spaces and limit length to 30 characters
            characters = characters.replace(/\s+/g, '').substring(0, 30);
            characters = Array.from(characters);
        } else if (selectedValue === "mixedCasePairsLowerFirst") {
            // Adjust for mixed case pairs
            characters = mixedCasePairsString.replace(/\s+/g, '').substring(0, 65);
            characters = Array.from(characters);
        }

        // Iterate through each character to generate one row of repeated characters
        characters.forEach(characterToRepeat => {
            // Get the glyph for the character
            const glyph = font.charToGlyph(characterToRepeat);

            if (glyph) {
                const charWidth = glyph.advanceWidth * getFontScaleFactor();
                const charSpacing = charWidth * 3.0; // Set spacing to 3.0 character width
                fontCharactersSpacing = charSpacing; // Update global spacing
                const totalCharWidth = charWidth + charSpacing;

                // Create a single row for the current character
                let currentRow = [];
                let currentLineWidth = 0;

                // Fill the row with repeated characters
                while (currentLineWidth + totalCharWidth <= width) {
                    currentRow.push(characterToRepeat);
                    currentLineWidth += totalCharWidth;
                }

                // Add the last character if there's space for its width
                if (currentLineWidth + charWidth <= width) {
                    currentRow.push(characterToRepeat);
                }

                // Add the row to the main array
                characterRows.push(currentRow);
            } else {
                console.warn(`Glyph not found for character: ${characterToRepeat}`);
            }
        });
    }



    // Handle "pageOfSingleCharacter" arrangement
    else if (arrangement === "pageOfSingleCharacter" && characters.length > 0) {
        const [paperWidthOrientedRaw, paperHeightOrientedRaw] = getPaperSizeOriented();


        const selectedValue = document.getElementById("caseSelection").value;
        if (selectedValue == "customText") {
            // Remove all spaces and limit length to 30 characters
            characters = characters.replace(/\s+/g, '').substring(0, 30);
            characters = Array.from(characters);

        }
        else if (selectedValue == "mixedCasePairsLowerFirst") {

            characters = mixedCasePairsString.replace(/\s+/g, '').substring(0, 65);
            characters = Array.from(characters);

        }




        // Iterate through each character to generate a full page of rows
        characters.forEach(characterToRepeat => {
            let charRowsForPage = [];
            let charIndex = 0;

            // Get the glyph for the character
            const glyph = font.charToGlyph(characterToRepeat);

            if (glyph) {
                const charWidth = glyph.advanceWidth * getFontScaleFactor();
                const charSpacing = charWidth * 3.0; // Set spacing to 2.0x character width
                fontCharactersSpacing = charSpacing; // Update global spacing
                const totalCharWidth = charWidth + charSpacing;


                // Create a page of rows for the current character
                while (charIndex < linesPerPage) {
                    let currentRow = [];
                    let currentLineWidth = 0;

                    // Fill the line with repeated characters
                    while (currentLineWidth + totalCharWidth <= width) {
                        currentRow.push(characterToRepeat);
                        currentLineWidth += totalCharWidth;
                    }

                    // Add the last character if there's space for its width
                    if (currentLineWidth + (charWidth) <= width) {
                        currentRow.push(characterToRepeat);
                        currentLineWidth += charWidth;
                    }

                    // Add the row to the current character's page
                    charRowsForPage.push(currentRow);
                    charIndex++;
                }

                // Add the completed page of rows for this character to the main array
                characterRows.push(...charRowsForPage);
            } else {
                console.warn(`Glyph not found for character: ${characterToRepeat}`);
            }
        });
    }

    //

    // Step 2: Generate a new array based on pages and number of lines per page
    let finalRows = [];

    for (let i = 0; i < characterRows.length; i++) {
        // Add the character row to the final rows array
        finalRows.push(characterRows[i]);

        if (arrangement === "rowsOfCharacters") {
            // If there is still space on the current page, add an empty row for practice
            if ((finalRows.length % linesPerPage) !== 0) {
                finalRows.push([]);
            }


            // If the page is filled but a character row falls on the last line, 
            // push it to the next page to ensure there is a practice row after it
            if ((finalRows.length % linesPerPage) === 0 && i !== characterRows.length - 1) {
                if (finalRows[finalRows.length - 1].length > 0) {
                    //

                    const lastRow = finalRows.pop();
                    finalRows.push([]);  // Add an empty row to complete the page
                    finalRows.push(lastRow);  // Move character row to the new page
                    finalRows.push([]);
                }
            }
        }


    }

    // If there are any remaining rows that didn't fill a complete page, add empty rows to fill the page
    const remainingLines = linesPerPage - (finalRows.length % linesPerPage);
    if (remainingLines < linesPerPage) {
        for (let i = 0; i < remainingLines; i++) {
            finalRows.push([]);
        }
    }

    //
    //
    return finalRows;
}





function getFontYOffset() {
    const fontYOffsetField = document.getElementById('fontYOffset');
    const selectedOption = document.getElementById('fontForWorksheetPages').selectedOptions[0];

    return parseFloat(selectedOption.getAttribute('fontYOffset') || 0.0);

}


function getFontScaleFactor() {
    // Calculate the x-height in points based on user input and nib width
    var xHeight = getXHeightPt();

    // Font scale factor to fit the font within x-height
    var fontScaleFactor = xHeight / getFontSXHeight();



    // Example of using the nib width and the brush width multiplier to determine the scale factor
    const selectedOption = document.getElementById('fontForWorksheetPages').selectedOptions[0];
    const fontGlyphScaleFactor = parseFloat(selectedOption.getAttribute('fontGlyphScaleFactor')) || 1;

    if (parseFloat(selectedOption.getAttribute('fontGlyphScaleFactor'))) {
        //alert(parseFloat(selectedOption.getAttribute('fontGlyphScaleFactor')));
        let nibWidth = parseFloat(document.getElementById('nibWidthMm').value);

        const scaleFactor = fontGlyphScaleFactor;

        return scaleFactor * fontScaleFactor;
    }
    else {
        //return fontScaleFactor;
    }

    return fontScaleFactor;
}




function getTotalCharacters() {
    // Calculate total number of characters based on user input settings

    let selectedCharacters = getSelectedCharacters();

    return selectedCharacters.length;
}

function createSVGElement() {
    // Create SVG element
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'worksheetPage');

    const [paperWidthOrientedRaw, paperHeightOrientedRaw] = getPaperSizeOriented();


    // Adjust paper width and height for margin
    var width = paperWidthOrientedRaw - marginHorizontal;
    var height = paperHeightOrientedRaw - marginVertical;




    svg.setAttribute('width', width + 'pt');
    svg.setAttribute('height', height + 'pt');

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    svg.setAttribute('preserveAspectRatio', `xMidYMid meet`);

    addFiltersToSVG(svg);

    // Create background rectangle
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', 'white');
    svg.appendChild(rect);

    svg.classList.add("worksheetPage");


    // Apply padding to SVG

    svg.style.paddingLeft = `${marginHorizontal / 2 - 1}pt`;
    svg.style.paddingRight = `${marginHorizontal / 2}pt`;
    svg.style.paddingTop = `${marginVertical / 2}pt`;
    svg.style.paddingBottom = `${marginVertical / 2}pt`;

    return svg;
}

function emptyWorksheetArea() {
    var container = document.getElementById('worksheetPagesContainer');
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}





function pullPaperSizeFromFormFields() {
    // Get selected paper size and orientation
    paperSizeWithoutOrientation = document.getElementById('paperSize').value.split(',').map(Number);
    pageOrientation = document.querySelector('input[name="orientation"]:checked').value;
    orientation = document.querySelector('input[name="orientation"]:checked').value;

    marginHorizontalInches = 0.4;
    marginVerticalInches = 0.4;

    marginHorizontal = 2 * marginHorizontalInches * 72; // Convert inches to points
    marginVertical = 2 * marginVerticalInches * 72;     // Convert inches to points
}

function drawWorksheet(svg, pageIndex, rows) {
    // Get the width and height from the svg attributes
    const width = parseFloat(svg.getAttribute('width'));
    const height = parseFloat(svg.getAttribute('height'));

    // Create the main group for the worksheet
    const worksheetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    worksheetGroup.setAttribute('class', 'worksheetGroup');
    svg.appendChild(worksheetGroup);

    // Define stroke width in points
    const strokeWidth = 0.6;

    // Draw outer rectangle
    drawOuterRectangle(worksheetGroup, width, height, strokeWidth);

    // Draw background horizontal lines at every nib width
    const backgroundLinesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    backgroundLinesGroup.setAttribute("class", "backgroundLines");
    worksheetGroup.appendChild(backgroundLinesGroup);

    // Draw slant guides if selected
    if (showVerticalLines) {
        const slantGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        slantGroup.setAttribute("class", "verticalLines");
        worksheetGroup.appendChild(slantGroup);
        drawSlantGuides(slantGroup, width, height, strokeWidth);
    }

    // Calculate lines per page
    const linesPerPage = calculateTotalLinesPerPage();
    const startIndex = pageIndex * linesPerPage;
    const endIndex = Math.min(startIndex + linesPerPage, rows.length);
    const rowsForPage = rows.slice(startIndex, endIndex);

    // Draw practice blocks for each row on the page
    let yPosition = 0;
    const nibHeightPt = getNibWidthPt();
    const xHeightPt = getXHeightPt();
    const ascenderHeight = ascenderMultiplier * xHeightPt;
    const capitalHeight = capitalMultiplier * xHeightPt;
    const descenderHeight = descenderMultiplier * xHeightPt;
    const totalBlockHeight = ascenderHeight + capitalHeight + xHeightPt + descenderHeight;

    rowsForPage.forEach(row => {
        // Always draw practice block lines
        drawPracticeBlockLines(
            worksheetGroup,
            backgroundLinesGroup,
            yPosition,
            width,
            strokeWidth,
            nibHeightPt,
            xHeightPt,
            ascenderHeight,
            capitalHeight,
            descenderHeight
        );

        // Draw the practice characters conditionally
        if (showFont && row.length > 0) {
            drawPracticeBlockChars(
                worksheetGroup,
                yPosition,
                width,
                strokeWidth,
                nibHeightPt,
                xHeightPt,
                ascenderHeight,
                capitalHeight,
                descenderHeight,
                row
            );
        }

        // Update y position for the next block
        yPosition += totalBlockHeight + nibHeightPt;
    });
}




// CHARACTERS FOR PRACTICE FONT TO PLACE IN WORKSHEET
// Define the character arrays
const lowercaseAlphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
const uppercaseAlphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

const mixedCasePairsString = "aA bB cC dD eE fF gG hH iI jJ kK lL mM nN oO pP qQ rR sS tT uU vV wW xX yY zZ";
const mixedCasePairsLowerFirst = Array.from(mixedCasePairsString);




const numberCharacters = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

var font; // Global variable to hold the loaded font

function loadFont(callback) {
    
    if (showFont == false) {
        callback();
        return;
    }

    var fontSelect = document.getElementById('fontForWorksheetPages');
    var fontName = fontSelect.value;

    // For custom fonts, you might handle file uploads
    var fontUrl = getFontUrl(fontName);

    opentype.load(fontUrl, function (err, loadedFont) {
        if (err) {
            fontWasLoadedForShowFont = false;
            alert('Could not load font: ' + err);
            callback();
        } else {
            font = loadedFont;
            fontWasLoadedForShowFont = true;
            callback();
        }
    });
}


function getFontUrl(fontName) {

    // Get the font select element by its ID
    const fontSelect = document.getElementById('fontForWorksheetPages');

    // Iterate through the options to find the one that matches the fontName
    let fontUrl = null;
    for (let i = 0; i < fontSelect.options.length; i++) {
        const option = fontSelect.options[i];
        if (option.value === fontName) {
            fontUrl = option.getAttribute('fontURL');
            break;
        }
    }


    // If no matching font name was found, use the first <option> as fallback
    if (!fontUrl) {
        const fallbackOption = fontSelect.options[0];
        fontUrl = fallbackOption.getAttribute('fontURL');
        if (!fontUrl) {
            fontURL = 'fonts/BreitkopfFraktur.ttf';
        }
    }


    return fontUrl;
}

function drawOuterRectangle(group, width, height, strokeWidth) {
    var outerRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    outerRect.setAttribute("x", 0);
    outerRect.setAttribute("y", 0);
    outerRect.setAttribute("width", width);
    outerRect.setAttribute("height", height);
    outerRect.setAttribute("fill", "none");
    outerRect.setAttribute("stroke", "#000");
    outerRect.setAttribute("stroke-width", strokeWidth);
    group.appendChild(outerRect);
}

function drawSlantGuides(slantGroup, width, height, strokeWidth) {
    var angleRadians = verticalSlantAngle * Math.PI / 180;
    var tanAngle = Math.tan(angleRadians); // Slope of the slant lines

    // Spacing between slant lines
    var verticalLineSpacing = nibWidthPt * verticalLineSpacingMultiplier;

    // For vertical lines (90 degrees), handle separately
    if (verticalSlantAngle !== 90) {
        // Starting x position for slant lines
        var xStart = -height * tanAngle;
        var xEnd = width + height * tanAngle;
        for (var x = xStart; x <= xEnd; x += verticalLineSpacing) {
            var x1 = x;
            var y1 = 0;
            var x2 = x - height * tanAngle;
            var y2 = height;

            // Clip the line to the bounds of the document
            var clippedLine = clipLineToRect(x1, y1, x2, y2, 0, 0, width, height);
            if (clippedLine) {
                var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", clippedLine.x1);
                line.setAttribute("y1", clippedLine.y1);
                line.setAttribute("x2", clippedLine.x2);
                line.setAttribute("y2", clippedLine.y2);
                line.setAttribute("stroke", "#ccc");
                line.setAttribute("stroke-width", strokeWidth);
                slantGroup.appendChild(line);
            }
        }
    }
}


function drawPracticeBlocks(worksheetGroup, backgroundLinesGroup, width, height, strokeWidth, charactersForPage) {
    // Settings for block dimensions
    var nibHeightPt = nibWidthPt;
    var xHeight = getXHeightPt();
    var ascenderHeight = ascenderMultiplier * xHeight;
    var capitalHeight = capitalMultiplier * xHeight;
    var descenderHeight = descenderMultiplier * xHeight;
    var totalBlockHeight = ascenderHeight + capitalHeight + xHeight + descenderHeight;

    var yPosition = 0;
    var charIndex = 0;

    // Calculate total number of blocks that fit
    const totalLines = Math.floor(height / (totalBlockHeight + nibHeightPt));
    const arrangement = document.getElementById('practiceCharactersArrangement').value;

    for (let lineIndex = 0; lineIndex < totalLines; lineIndex++) {
        var charactersForLine = [""];

        // Decide if this line should have characters
        if (shouldDrawCharacters(lineIndex, totalLines, arrangement)) {
            if (showFont) {
                charactersForLine = getCharactersForLine(charactersForPage, charIndex, width);
            }
        }

        // Draw the practice block lines - always
        drawPracticeBlockLines(
            worksheetGroup,
            backgroundLinesGroup,
            yPosition,
            width,
            strokeWidth,
            nibHeightPt,
            xHeight,
            ascenderHeight,
            capitalHeight,
            descenderHeight
        );

        if (showFont) {
            // Draw the practice characters conditionally
            if (charactersForLine.length > 0 && shouldDrawCharacters(lineIndex, totalLines, arrangement)) {
                drawPracticeBlockChars(
                    worksheetGroup,
                    yPosition,
                    width,
                    strokeWidth,
                    nibHeightPt,
                    xHeight,
                    ascenderHeight,
                    capitalHeight,
                    descenderHeight,
                    charactersForLine
                );
                // Increment charIndex for the next character set
                charIndex += charactersForLine.length;
            }
        }

        // Move yPosition to the next block
        yPosition += totalBlockHeight + nibHeightPt;
    }
}



function shouldDrawCharacters(lineIndex, totalLines, arrangement) {
    // If we are using "rowsOfCharacters" arrangement, draw characters on every other line
    // except the last line (to leave it blank for practice)
    if (arrangement === "rowsOfCharacters") {
        return lineIndex % 2 === 0 && lineIndex < totalLines - 1;
    }

    // If we are in "SingleCharacterAtLeft", always draw characters
    return true;
}


function drawPracticeBlockLines(worksheetGroup, backgroundLinesGroup, y, width, strokeWidth, nibHeightPt, xHeight, ascenderHeight, capitalHeight, descenderHeight, charactersForLine) {
    // Variables for line positions
    var ascenderY = y;
    var capitalY = ascenderY + ascenderHeight;
    var waistlineY = capitalY + capitalHeight;
    var baselineY = waistlineY + xHeight;
    var descenderY = baselineY + descenderHeight;
    var midlineY = waistlineY + xHeight / 2;

    // Draw practice blocks with x-height area shaded
    var practiceBlocksGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    practiceBlocksGroup.setAttribute("class", "practiceBlocks");


    // Shade x-height area
    ////
    shadeXHeightArea(practiceBlocksGroup, y, width, xHeight, ascenderHeight, capitalHeight);

    fillGapBetweenBlocks(practiceBlocksGroup, descenderY, width, nibHeightPt);


    // Draw guide lines
    drawGuideLines(practiceBlocksGroup, width, strokeWidth, ascenderY, capitalY, waistlineY, midlineY, baselineY, descenderY);

    // Draw horizontal lines
    drawHorizontalLines(backgroundLinesGroup, width, strokeWidth, nibWidthPt, baselineY, ascenderY, descenderY);

    // Draw nib guide if selected
    if (showNibSquares) {
        drawNibGuide(practiceBlocksGroup, ascenderY, waistlineY, baselineY, descenderY, nibHeightPt, nibWidthPt);
    }

    // Draw nib guideline labels if selected
    if (showNibGuidelineLabels) {
        drawNibGuidelineLabels(practiceBlocksGroup, ascenderY, capitalY, waistlineY, baselineY, descenderY);
    }


    worksheetGroup.appendChild(practiceBlocksGroup);

    //////
}


function getInitialXPositionToStartGlyphs() {
    return (nibWidthPt * 4); // Initial position to start drawing characters
}

function drawPracticeBlockChars(group, yPosition, width, strokeWidth, nibHeightPt, xHeight, ascenderHeight, capitalHeight, descenderHeight, charactersForLine) {
    if (!showFont || !font) return;



    // Calculate initial positions and dimensions
    const initialXPos = getInitialXPositionToStartGlyphs();
    const [paperWidthOrientedRaw, paperHeightOrientedRaw] = getPaperSizeOriented();
    const usableWidth = paperWidthOrientedRaw - marginHorizontal - getInitialXPositionToStartGlyphs();



    // Draw debug data at the top of the page
    drawTopDebugData(group, "Initial X Position", initialXPos, 0, 0);
    drawTopDebugData(group, "Paper Width Oriented", paperWidthOrientedRaw, 10, 40);
    drawTopDebugData(group, "Paper Height Oriented", paperHeightOrientedRaw, 10, 60);
    drawTopDebugData(group, "Usable Width", usableWidth, 10, 80);


    // Calculate scaling factor to fit font into x-height
    var fontUnitsPerEm = font.unitsPerEm;
    var fontScaleFactor = getFontScaleFactor();
    var fontYOffset = getFontYOffset();

    let xPosition = getInitialXPositionToStartGlyphs(); // Initial position to start drawing characters
    let yPositionWithOffset = yPosition + (-1 * fontYOffset);

    // Draw the red bounding box (glyph shape only)
    drawDebugBoundingBox(group, xPosition, yPosition, usableWidth, 20, "orange", 2);


    // Iterate through each character in charactersForLine and draw it
    charactersForLine.forEach(char => {
        const glyph = font.charToGlyph(char);
        if (glyph) {
            const path = glyph.getPath(0, 0, font.unitsPerEm);
            const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            svgPath.setAttribute("class", "practiceSheetGlyph");
            svgPath.setAttribute("d", path.toPathData(5));
            svgPath.setAttribute("fill", "#000");

            // Calculate the original bounding box (for glyph shape)
            const bbox = glyph.getBoundingBox();
            const boxX = xPosition + (bbox.x1 * fontScaleFactor);
            const boxY = yPositionWithOffset + (ascenderHeight + capitalHeight + xHeight) - (bbox.y2 * fontScaleFactor);
            const boxWidth = (bbox.x2 - bbox.x1) * fontScaleFactor;
            const boxHeight = (bbox.y2 - bbox.y1) * fontScaleFactor;

            // Calculate the bounding box for the total space including advance width
            const totalBoxWidth = glyph.advanceWidth * fontScaleFactor;


            const baselineY = yPositionWithOffset + ascenderHeight + capitalHeight + xHeight;

            // Calculate transformation for the glyph
            var transformString = `translate(${xPosition}, ${baselineY}) scale(${fontScaleFactor}, ${fontScaleFactor})`;

            //-------------
            //-----SHEAR---
            //-------------
            // Adjust centerY based on the inverted Y-coordinate system
            // CenterY should be the "bottom" center of the glyph because of the inverted coordinate system

            // Initial translate and scale
            const translateX = xPosition;
            const translateY = baselineY;
            const scale = fontScaleFactor;

            // Shear values
            const shearX = -1 * (transformConfig.shearX) / 100;
            const shearY = -1 * (transformConfig.shearY) / 100;

            // Center the glyph for correct shearing
            const centerX = translateX + (glyph.advanceWidth * scale) / 2;
            // Adjust centerY based on the glyph's bounding box 
            const glyphHeight = boxHeight;//(bbox.y2 - bbox.y1) * scale;
            const centerY = translateY - (boxHeight / 2);


            // Calculate the full transformation matrix
            const a = fontScaleFactor;  // Scale X
            const b = shearY;//shearY * scale;  // Shear Y
            const c = shearX;//shearX * scale;  // Shear X
            const d = fontScaleFactor;  // Scale Y
            const e = xPosition; //translateX + ((glyph.advanceWidth * scale) / 2) * (1 - a) - centerY * c;  // Adjust for shear and scale
            const f = baselineY; //centerY * (1 - d) - ((translateX + (glyph.advanceWidth * scale) / 2) * b);  // Adjust for shear and scale

            transformString = `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;

            //------------
            //------------
            //------------   

            svgPath.setAttribute("transform", transformString);

            group.appendChild(svgPath);


            // Draw the red bounding box (glyph shape only)
            drawDebugBoundingBox(group, boxX, boxY, boxWidth, boxHeight, "red");

            // Draw the green bounding box (including advance width)
            drawDebugBoundingBox(group, xPosition, boxY, totalBoxWidth + getFontCharactersSpacingFixed(), boxHeight, "green");

            // Draw debug text for bounding box information
            drawDebugText(group, boxX, boxY, boxWidth, boxHeight);

            // Update the xPosition for the next character
            xPosition += totalBoxWidth + getFontCharactersSpacingFixed();
        }
    });
}


var debugPage = 0;
// Function to draw a text label at the top of the page
function drawTopDebugText(group, textContent, x, y) {
    const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textElement.setAttribute("x", x);
    textElement.setAttribute("y", y);
    textElement.setAttribute("fill", "blue");
    textElement.setAttribute("font-size", "12");
    textElement.textContent = textContent;
    group.appendChild(textElement);
}

// Function to draw background rectangle for top debug text
function drawTopDebugBackground(group, x, y, textContent) {
    const textWidth = textContent.length * 6; // Approximate width calculation
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x - 2);
    rect.setAttribute("y", y - 12); // Adjust to place background behind text
    rect.setAttribute("width", textWidth + 4);
    rect.setAttribute("height", 14);
    rect.setAttribute("fill", "rgba(255, 255, 0, 0.4)"); // Semi-transparent yellow
    rect.setAttribute("stroke", "none");
    group.appendChild(rect);
}

// Function to place a labeled debug text with background at the top of the page
function drawTopDebugData(group, label, value, x, y) {
    if (!debugPage) {
        return;
    }
    const textContent = `${label}: ${value.toFixed(1)}`;
    drawTopDebugBackground(group, x, y, textContent);
    drawTopDebugText(group, textContent, x, y);
}
// Function to draw a bounding box around the glyph or its total space
function drawDebugBoundingBox(group, x, y, width, height, color, strokeWidth = 0.5) {
    if (!debugPage) {
        return;
    }
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", color);
    rect.setAttribute("stroke-width", strokeWidth);
    group.appendChild(rect);
}
// Function to draw text labels showing bounding box info with a white background
function drawDebugText(group, x, y, width, height) {
    if (!debugPage) {
        return;
    }

    // Draw x at the origin (top-left corner)
    const xText = createTextElement(`x:${x.toFixed(1)}`, x, y + 5 + height, "blue");
    group.appendChild(drawTextBackground(xText));
    group.appendChild(xText);

    // Draw y beneath x
    const yText = createTextElement(`y:${y.toFixed(1)}`, x, y + 5 + height + 10, "blue");
    group.appendChild(drawTextBackground(yText));
    group.appendChild(yText);

    // Draw width (w) at the top of the bounding box
    const widthText = createTextElement(`w:${width.toFixed(1)}`, x + width / 2, y - 3, "blue", "middle");
    group.appendChild(drawTextBackground(widthText));
    group.appendChild(widthText);

    // Draw height (h) rotated 90 degrees CW on the left side of the bounding box
    const heightText = createTextElement(`h:${height.toFixed(1)}`, x - 8, y + height / 2, "blue", "middle", true);
    group.appendChild(drawTextBackground(heightText));
    group.appendChild(heightText);
}

// Helper function to create a text element
function createTextElement(content, x, y, color, anchor = "start", rotate = false) {
    const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textElement.setAttribute("x", x);
    textElement.setAttribute("y", y);
    textElement.setAttribute("fill", color);
    textElement.setAttribute("font-size", "10");
    textElement.setAttribute("text-anchor", anchor);
    textElement.textContent = content;

    // Apply rotation if needed
    if (rotate) {
        const rotationCenterX = x;
        const rotationCenterY = y;
        textElement.setAttribute("transform", `rotate(90, ${rotationCenterX}, ${rotationCenterY})`);
    }

    return textElement;
}

// Function to create a white background rectangle for text
function drawTextBackground(textElement) {
    const bbox = textElement.getBBox(); // Get bounding box of the text
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", bbox.x - 2); // Adjust to add padding around the text
    rect.setAttribute("y", bbox.y - 1);
    rect.setAttribute("width", bbox.width + 4);
    rect.setAttribute("height", bbox.height + 2);
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke", "none");

    return rect; // Return the rectangle to be appended to the group
}



function getCharactersForPage(pageIndex) {
    showFont = document.getElementById('showFont').checked;
    if (!showFont) return [];

    const selectedValue = document.getElementById("caseSelection").value;
    var includeNumbers = document.getElementById('includeNumberCharacters').checked;

    var practiceArrangement = document.getElementById('practiceCharactersArrangement').value;
    var customText = document.getElementsByName('customPracticeText')[0].value.trim();


    var characters = getSelectedCharacters();



    // Calculate total pages
    var linesPerPage = calculateAvailableLinesPerPage();
    var charsPerPage = linesPerPage * calculateCharsPerLine();

    // Slice characters for current page
    var startIndex = pageIndex * charsPerPage;
    var endIndex = startIndex + charsPerPage;
    return characters.slice(startIndex, endIndex);
}

function getCustomText() {
    var customText = document.getElementById("customPracticeText").value;
    if (customText === "") {
        customText = "enter\ncustom\ntext";
    }

    // contains only new lines
    if (/^\n*$/.test(customText)) {
        customText = "enter\ncustom\ntext";
    }

    return customText;//.split('').filter(char => char.trim() !== ''); // Exclude empty characters
}

function getCharactersForLine(characters, charIndex, width) {
    var practiceArrangement = document.getElementById('practiceCharactersArrangement').value;
    var maxCharsPerLine = calculateCharsPerLine();

    var charsForLine = characters.slice(charIndex, charIndex + maxCharsPerLine);
    return charsForLine;
}

function calculateTotalLinesPerPage() {
    // Calculate nib height in points
    var nibHeightPt = nibWidthPt;

    // Calculate various heights based on multipliers and x-height
    var xHeight = getXHeightPt();
    var ascenderHeight = ascenderMultiplier * xHeight;
    var capitalHeight = capitalMultiplier * xHeight;
    var descenderHeight = descenderMultiplier * xHeight;

    // Calculate total height of each practice block (including ascender, descender, etc.)
    var totalBlockHeight = ascenderHeight + capitalHeight + xHeight + descenderHeight;

    const [paperWidthOrientedRaw, paperHeightOrientedRaw] = getPaperSizeOriented();


    // Adjust the height of the page to take margins into account
    var height = paperHeightOrientedRaw - marginVertical;

    // Calculate how many lines can fit on one page
    var totalLinesPerPage = Math.floor(height / (totalBlockHeight + nibHeightPt));

    return totalLinesPerPage;
}

function calculateAvailableLinesPerPage() {
    // Calculate nib height in points
    var nibHeightPt = nibWidthPt;

    // Calculate various heights based on multipliers and x-height
    var xHeight = getXHeightPt();
    var ascenderHeight = ascenderMultiplier * xHeight;
    var capitalHeight = capitalMultiplier * xHeight;
    var descenderHeight = descenderMultiplier * xHeight;

    // Calculate total height of each practice block (including ascender, descender, etc.)
    var totalBlockHeight = ascenderHeight + capitalHeight + xHeight + descenderHeight;

    const [paperWidthOrientedRaw, paperHeightOrientedRaw] = getPaperSizeOriented();


    // Adjust the height of the page to take margins into account
    var height = paperHeightOrientedRaw - marginVertical;

    // Calculate how many lines can fit on one page
    var totalLinesPerPage = Math.floor(height / (totalBlockHeight + nibHeightPt));

    // Check the practice characters arrangement
    var practiceArrangement = document.getElementById('practiceCharactersArrangement').value;
    var availableLinesPerPage;

    if (showFont) {
        // If the arrangement is 'Rows of Characters', skip every alternate line
        if (practiceArrangement === 'rowsOfCharacters') {
            availableLinesPerPage = Math.floor(totalLinesPerPage / 2) + (totalLinesPerPage % 2); // Add 1 if there's an extra line left for even total lines
        } else {

            availableLinesPerPage = totalLinesPerPage;
        }
    }
    else {
        availableLinesPerPage = totalLinesPerPage;
    }

    // Debugging logs
    ////
    ////
    ////
    ////
    ////

    return availableLinesPerPage;
}



function getFontSXHeight() {
    // Calculate the estimated X-Height if it's not available in the font metadata
    let estimatedXHeight = (font.tables.os2.sTypoAscender - font.tables.os2.sTypoDescender) / 2;
    let sxHeight = font.tables.os2.sxHeight || estimatedXHeight;

    return sxHeight;
}


function calculateCharsPerLine() {
    // Pull practice arrangement from UI
    var practiceArrangement = document.getElementById('practiceCharactersArrangement').value;

    // Special case for single character arrangement
    if (practiceArrangement === 'singleCharacterAtLeft') {
        return 1;
    }

    // Calculate the x-height in points based on user input and nib width
    var xHeight = getXHeightPt();

    // Font scale factor to fit the font within x-height
    var fontScaleFactor = getFontScaleFactor();//xHeight / getFontSXHeight();

    // Get the actual characters selected from the form fieldset for practice
    var selectedCharactersToUse = getSelectedCharacters();
    if (selectedCharactersToUse.length === 0) {
        console.error("No characters selected for practice. Using default sample set.");
        selectedCharactersToUse = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
    }




    // Calculate an average character width in points using the selected characters
    let avgCharWidth = 0;
    if (document.getElementById("caseSelection").value.includes("A")) {
        selectedCharactersToUse = uppercaseAlphabet;
    }
    else {

    }

    selectedCharactersToUse.forEach(char => {
        let glyph = font.charToGlyph(char);
        if (glyph) {
            avgCharWidth += glyph.advanceWidth;
        }
    });


    // Calculate the average character width and apply scaling
    avgCharWidth = (avgCharWidth / selectedCharactersToUse.length) * fontScaleFactor;

    // Calculate the upper bound character width in points using the selected characters
    let upperBoundCharWidth = 0;
    selectedCharactersToUse.forEach(char => {

        let glyph = font.charToGlyph(char);
        if (glyph) {
            // Find the maximum character width (advanceWidth)
            if (glyph.advanceWidth > upperBoundCharWidth) {
                upperBoundCharWidth = glyph.advanceWidth;
            }


        }
    });
    // Apply the scaling factor to the upper bound character width
    upperBoundCharWidth = upperBoundCharWidth * fontScaleFactor;



    // Define spacing between characters

    const [paperWidthOrientedRaw, paperHeightOrientedRaw] = getPaperSizeOriented();

    // Determine available width for character placement, considering margins
    var width = paperWidthOrientedRaw - marginHorizontal - getInitialXPositionToStartGlyphs(); // Subtract horizontal margins from the paper width



    var charsPerLine = 4;


    charsPerLine = Math.floor(width / (avgCharWidth + getFontCharactersSpacingFixed()));



    // Log values for debugging purposes
    //  ////


    //  ////
    //////

    return charsPerLine;
}

function getUpperBoundCharWidthNoScaling(font,characterSet = bothUppercaseAndLowercase)
{
    // Calculate the upper bound character width in points using the selected characters
    let upperBoundCharWidth = 0;
    characterSet.forEach(char => {

        let glyph = font.charToGlyph(char);
        if (glyph) {
            // Find the maximum character width (advanceWidth)
            if (glyph.advanceWidth > upperBoundCharWidth) {
                upperBoundCharWidth = glyph.advanceWidth;
            }


        }
    });
    // Apply the scaling factor to the upper bound character width
    //upperBoundCharWidth = upperBoundCharWidth * fontScaleFactor;

    return upperBoundCharWidth;
}

function getAverageCharWidthNoScaling(font,characterSet = bothUppercaseAndLowercase)
{
    try
    {
        let avgCharWidth = 0;

        characterSet.forEach(char => {
            let glyph = font.charToGlyph(char);
            if (glyph) {
                avgCharWidth += glyph.advanceWidth;
            }
        });
    
    }
    catch(error)
    {
//        falert("err: getAverageCharWidthNoScaling")
//        alert("err: getAverageCharWidthNoScaling");
    }

    // Calculate the average character width and apply scaling
    avgCharWidth = (avgCharWidth / characterSet.length);// * fontScaleFactor;

}

/*
To get the actual set of characters that are selected 
by the user, we will use a helper function called getSelectedCharacters(). 
This function will return the characters based on the current settings, 
such as "Lowercase Only," "Uppercase Only," "Both Lowercase and Uppercase," 
or "Custom Practice Text."
*/

function getSelectedCharacters() {
    const selectedValue = document.getElementById("caseSelection").value;
    const includeNumbers = document.getElementById("includeNumberCharacters").checked;
    let selectedCharacters = [];

    // Determine the selected characters based on the dropdown value
    if (selectedValue === "lowercaseOnly") {
        selectedCharacters = lowercaseAlphabet;
    } else if (selectedValue === "uppercaseOnly") {
        selectedCharacters = uppercaseAlphabet;

    }
    else if (selectedValue === "mixedCasePairsLowerFirst") {
        selectedCharacters = mixedCasePairsLowerFirst;

    }
    else if (selectedValue === "bothUppercaseAndLowercase") {
        selectedCharacters = lowercaseAlphabet.concat('\n').concat(uppercaseAlphabet);

    } else if (selectedValue === "customText") {
        // Get custom practice text from the textarea

        // Convert custom text to an array of characters, excluding empty spaces
        selectedCharacters = getCustomText();
    }

    // Include numbers if the checkbox is checked
    if (includeNumbers && selectedValue !== "customText") {
        selectedCharacters = selectedCharacters.concat('\n').concat(numberCharacters);
    }

    return selectedCharacters;
}



function shadeXHeightArea(practiceBlocksGroup, y, width, xHeight, ascenderHeight, capitalHeight) {
    var xHeightRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    xHeightRect.setAttribute("x", 0);
    xHeightRect.setAttribute("y", y + ascenderHeight + capitalHeight);
    xHeightRect.setAttribute("width", width);
    xHeightRect.setAttribute("height", xHeight);
    xHeightRect.setAttribute("fill", xHeightColor);
    xHeightRect.setAttribute("fill-opacity", xHeightOpacity);
    practiceBlocksGroup.appendChild(xHeightRect);
}

function fillGapBetweenBlocks(practiceBlocksGroup, descenderY, width, nibHeightPt) {
    var gapRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    gapRect.setAttribute("x", 0);
    gapRect.setAttribute("y", descenderY);
    gapRect.setAttribute("width", width);
    gapRect.setAttribute("height", nibHeightPt);
    gapRect.setAttribute("fill", "#444");
    practiceBlocksGroup.appendChild(gapRect);
}

function drawGuideLines(practiceBlocksGroup, width, strokeWidth, ascenderY, capitalY, waistlineY, midlineY, baselineY, descenderY) {
    // Ascender line (dashed)
    drawLine(practiceBlocksGroup, 0, ascenderY, width, ascenderY, strokeWidth, "#000", "6,2");

    // Capital line (dashed)
    drawLine(practiceBlocksGroup, 0, capitalY, width, capitalY, strokeWidth, "#000", "4,2");

    // Waistline (solid)
    drawLine(practiceBlocksGroup, 0, waistlineY, width, waistlineY, strokeWidth, "#000");

    // Midline (dashed)
    drawLine(practiceBlocksGroup, 0, midlineY, width, midlineY, strokeWidth, "#ccc", "2,2");

    // Baseline (solid)
    drawLine(practiceBlocksGroup, 0, baselineY, width, baselineY, strokeWidth, "#000");

    // Descender line (dashed)
    drawLine(practiceBlocksGroup, 0, descenderY, width, descenderY, strokeWidth, "#000", "6,2");
}

function drawLine(group, x1, y1, x2, y2, strokeWidth, strokeColor, dashArray) {
    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", strokeColor);
    line.setAttribute("stroke-width", strokeWidth);
    if (dashArray) {
        line.setAttribute("stroke-dasharray", dashArray);
    }
    group.appendChild(line);
}

function drawHorizontalLines(backgroundLinesGroup, width, strokeWidth, nibWidthPt, baselineY, ascenderY, descenderY) {
    // From baseline to ascender line
    for (var y = baselineY; y > ascenderY; y -= nibWidthPt) {
        drawLine(backgroundLinesGroup, 0, y, width, y, strokeWidth, "#eee");
    }

    // From baseline to descender line
    for (var y = baselineY; y < descenderY; y += nibWidthPt) {
        drawLine(backgroundLinesGroup, 0, y, width, y, strokeWidth, "#eee");
    }
}

function drawNibGuide(practiceBlocksGroup, ascenderY, waistlineY, baselineY, descenderY, nibHeightPt, nibWidthPt) {
    var nibGuideGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    practiceBlocksGroup.appendChild(nibGuideGroup);

    var nibX = 0; // Position from left edge
    var nibRectWidth = nibWidthPt;

    // Ascending blocks from baseline
    var nibCount = (baselineY - ascenderY) / nibHeightPt; // Number of squares to draw
    for (var i = 0; i < nibCount; i++) {
        var col = i % 2; // Alternate columns
        var yPosition = Math.ceil(baselineY - (i + 1) * nibHeightPt);
        var rectHeight = nibHeightPt;
        var rectY = yPosition;

        var fillColor = "#000";

        if (yPosition < waistlineY) {
            fillColor = "#999";
        }

        if (yPosition <= ascenderY) {
            var diff = ascenderY - yPosition;
            rectY = yPosition + diff;
            rectHeight = nibHeightPt - diff;
        }

        drawRect(nibGuideGroup, nibX + col * nibRectWidth, rectY, nibRectWidth, rectHeight, fillColor);

        if (yPosition < waistlineY && (yPosition + nibHeightPt - 1) > waistlineY) {
            var rectHeightSplit = (yPosition + nibHeightPt) - waistlineY;
            drawRect(nibGuideGroup, nibX + col * nibRectWidth, waistlineY, nibRectWidth, rectHeightSplit, "#000");
        }
    }

    // Descender blocks
    nibCount = (descenderY - baselineY) / nibHeightPt;
    var nibYStart = baselineY;
    for (var i = 0; i < nibCount; i++) {
        var col = 1 - (i % 2); // Alternate columns
        var yPosition = nibYStart + i * nibHeightPt;
        var rectHeight = nibHeightPt;
        if ((yPosition + nibHeightPt) > descenderY) {
            rectHeight = descenderY - yPosition;
        }
        drawRect(nibGuideGroup, nibX + col * nibRectWidth, yPosition, nibRectWidth, rectHeight, "#999");
    }
}

function drawRect(group, x, y, width, height, fillColor) {
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", fillColor);
    group.appendChild(rect);
}

function drawNibGuidelineLabels(practiceBlocksGroup, ascenderY, capitalY, waistlineY, baselineY, descenderY) {
    var labelX = showNibSquares ? (nibWidthPt * 2) + nibWidthPt / 2 : 2; // Depends on whether nibSquares are shown
    var fontSize = (nibWidthMm < 3) ? (9 * nibWidthMm / 3) + "px" : "9px"; // Scale when below 3mm nibWidthPt
    var labelColor = "#444"; // Dark gray
    var fontFamily = "Helvetica, sans-serif";

    if (ascenderMultiplier > 0) {
        // Ascender Label
        drawText(practiceBlocksGroup, labelX, ascenderY - 1 + nibWidthPt, fontSize, "#9c9c9c", "Ascender Line⬏ ", fontFamily);
    }



    if ((capitalMultiplier > 0) && ((capitalY - ascenderY) > 12)) {
        // Capital Label
        drawText(practiceBlocksGroup, labelX, capitalY - 2, fontSize, "#9c9c9c", "Capital Line⬎", fontFamily);
    }

    // Waistline Label
    drawText(practiceBlocksGroup, labelX, waistlineY - 2, fontSize, "#9c9c9c", "Waist Line⬎", fontFamily);


    // Baseline Label
    drawText(practiceBlocksGroup, labelX, baselineY - 2, fontSize, labelColor, "Base Line⬎", fontFamily);

    if (descenderMultiplier > 0) {
        // Descender Label
        drawText(practiceBlocksGroup, labelX, descenderY - 2, fontSize, "#9c9c9c", "Descender Line⬎", fontFamily);
    }
}

function drawText(group, x, y, fontSize, fillColor, textContent, fontFamily) {
    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("fill", fillColor);
    text.setAttribute("font-size", fontSize);
    text.setAttribute("font-family", fontFamily);
    text.textContent = textContent;
    group.appendChild(text);
}

// Function to clip a line segment to a rectangle using the Liang-Barsky algorithm
function clipLineToRect(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
    var dx = x2 - x1;
    var dy = y2 - y1;

    var p = [-dx, dx, -dy, dy];
    var q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];

    var u1 = 0;
    var u2 = 1;

    for (var i = 0; i < 4; i++) {
        if (p[i] === 0) {
            if (q[i] < 0) {
                return null; // Line is outside the rectangle
            }
        } else {
            var u = q[i] / p[i];
            if (p[i] < 0) {
                if (u > u2) {
                    return null; // Line is outside the rectangle
                }
                if (u > u1) {
                    u1 = u;
                }
            } else if (p[i] > 0) {
                if (u < u1) {
                    return null; // Line is outside the rectangle
                }
                if (u < u2) {
                    u2 = u;
                }
            }
        }
    }

    if (u1 > u2) {
        return null; // Line is outside the rectangle
    }

    var clippedX1 = x1 + u1 * dx;
    var clippedY1 = y1 + u1 * dy;
    var clippedX2 = x1 + u2 * dx;
    var clippedY2 = y1 + u2 * dy;

    return { x1: clippedX1, y1: clippedY1, x2: clippedX2, y2: clippedY2 };
}

