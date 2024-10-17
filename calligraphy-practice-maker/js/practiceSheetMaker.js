

document.addEventListener('DOMContentLoaded', function () {
    // Initialize and add event listeners
    init();


});

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

    generatedThumb.addEventListener('mousedown', onGeneratedThumbMouseDown);
    generatedWorksheetArea.addEventListener('scroll', updateGeneratedThumbPosition);
    window.addEventListener('resize', updateGeneratedThumbPosition);

    updateGeneratedThumbPosition();
});

document.getElementById('uploadFont').addEventListener('click', function () {
    document.getElementById('fontFileInput').click();
});

document.getElementById('fontFileInput').addEventListener('change', function (event) {
    var file = event.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            opentype.load(e.target.result, function (err, loadedFont) {
                if (err) {
                    alert('Could not load font: ' + err);
                } else {
                    font = loadedFont;
                    makeWorksheetPages();
                }
            });
        };
        reader.readAsArrayBuffer(file);
    }
});


function init() {
    // Add event listeners to controls
    // Select all input, select, and textarea elements within #controls, but exclude those with the class '.notWorksheetGenerating'
    var controls = document.querySelectorAll(
        '#controls input:not(.notWorksheetGenerating), #controls select:not(.notWorksheetGenerating), #controls textarea:not(.notWorksheetGenerating)'
    );

    controls.forEach(function (control) {
        control.addEventListener('change', function () { makeWorksheetPages(); });
    });


    //  document.getElementById('downloadPdfButton').addEventListener('click', downloadPdf);


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







    // Initial grid drawing
    makeWorksheetPages();
}

async function downloadPdf() {
    // Import jsPDF and svg2pdf modules
    const { jsPDF } = window.jspdf;

    // Create a new jsPDF instance
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [paperSize[0], paperSize[1]], // Example paper size corresponding to SVG size
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
            console.log('Text elements have been converted to paths.');
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


async function convertTextToPathsWithKerning(svgElement) {
    const fontUrl = 'fonts/noto-sans.regular.ttf'; // Update with your font file location
    const font = await opentype.load(fontUrl);

    const textElements = svgElement.querySelectorAll('text');
    textElements.forEach(textElement => {
        const text = textElement.textContent;
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

// GLOBALS
var mmToPt = 2.83465;    // Conversion factor from mm to pt

// SETTINGS WITH DEFAULTS
var nibWidthMm = 3.8;
var nibWidth = nibWidthMm * mmToPt; // Nib width in points
var xHeightNibWidths = 4;
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

var paperSize = document.getElementById('paperSize').value.split(',').map(Number);
var orientation = 'portrait';

var marginHorizontalInches = 0.4;
var marginVerticalInches = 0.4;

var marginHorizontal = 2 * marginHorizontalInches * 72; // Convert inches to points
var marginVertical = 2 * marginVerticalInches * 72;     // Convert inches to points

var fontScaleFactor = 0.5;
var spacingForCharacters = 30; // Space between characters


async function loadFontAndMakeWorksheetPages() {
    try {
        showFont = document.getElementById('showFont').checked;

        if (!showFont) {
            makeWorksheetPages();
            return;
        }

        const fontSelect = document.getElementById('fontForWorksheetPages');
        const fontName = fontSelect.value;
        const fontUrl = getFontUrl(fontName);

        // Load the font asynchronously
        font = await loadFontAsync(fontUrl).then(result => {
            console.log(result);  // Outputs: "Operation successful"
        });


        //charsPerLineGlobal = calculateCharsPerLine();

        //console.log("charsPerLineGlobal:" + charsPerLineGlobal);


        fontWasLoadedForShowFont = true;
        makeWorksheetPages();  // Only called once the font is fully loaded
    } catch (error) {
        console.error(error);
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
                console.log("Font loaded successfully.");
                console.log("Ascender:", loadedFont.ascender);
                console.log("Descender:", loadedFont.descender);
                console.log("Units per EM:", loadedFont.unitsPerEm);
                resolve(loadedFont);
            }
        });
    });
}



async function makeWorksheetPages() {
    pullPaperSizeFromFormFields();

    emptyWorksheetArea();

    await loadFont(async function () {
        emptyWorksheetArea();

        // Determine the number of pages based on user selections
        var numberOfPages = calculateNumberOfPages();

        for (var i = 0; i < numberOfPages; i++) {
            // Create SVG element
            var svg = createSVGElement();

            // Append SVG to worksheetPagesContainer
            var container = document.getElementById('worksheetPagesContainer');
            container.appendChild(svg);

            // Call drawWorksheet(svg, i)
            await drawWorksheet(svg, i);  // Ensure it waits for rendering to complete
        }
    });
}


var charsPerLineGlobal = 5;

function calculateNumberOfPages() {
    // If no font practice is required, just return 1 page
    if (showFont == false) {
        return 1;
    }

    // Get number of lines per page
    var linesPerPage = calculateAvailableLinesPerPage();

    // Get number of characters per line
    charsPerLineGlobal = calculateCharsPerLine();

    // Calculate total characters needed
    var totalCharacters = getTotalCharacters();

    // Calculate number of characters per page
    var charsPerPage = linesPerPage * charsPerLineGlobal;

    // Calculate number of pages needed
    var numberOfPages = Math.ceil(totalCharacters / charsPerPage);

    // Debugging logs
    console.log("----calculateNumberOfPages()----");
    console.log("Total Characters: " + totalCharacters);
    console.log("Characters Per Page: " + charsPerPage);
    console.log("Number of Pages: " + numberOfPages);

    return numberOfPages;
}

function getTotalCharacters() {
    // Calculate total number of characters based on user input settings
    const selectedValue = document.getElementById("caseSelection").value;
    const includeNumbers = document.getElementById("includeNumberCharacters").checked;

    let selectedCharacters = [];

    if (selectedValue === "lowercaseOnly") {
        selectedCharacters = lowercaseAlphabet;
    } else if (selectedValue === "uppercaseOnly") {
        selectedCharacters = uppercaseAlphabet;
    } else if (selectedValue === "bothUppercaseAndLowercase") {
        selectedCharacters = lowercaseAlphabet.concat(uppercaseAlphabet);
    } else if (selectedValue === "customText") {
        const customText = document.getElementById("customPracticeText").value;
        selectedCharacters = customText.split('').filter(char => char.trim() !== ''); // Exclude empty characters
    }

    if (includeNumbers && selectedValue !== "customText") {
        selectedCharacters = selectedCharacters.concat(numberCharacters);
    }

    return selectedCharacters.length;
}

function createSVGElement() {
    // Create SVG element
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'worksheetPage');

    // Adjust paper width and height for margin
    var width = paperSize[0] - marginHorizontal;
    var height = paperSize[1] - marginVertical;

    // Swap width and height if landscape orientation is selected
    if (orientation === 'landscape') {
        [width, height] = [height, width];
    }

    svg.setAttribute('width', width + 'pt');
    svg.setAttribute('height', height + 'pt');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

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
    paperSize = document.getElementById('paperSize').value.split(',').map(Number);
    orientation = document.querySelector('input[name="orientation"]:checked').value;

    marginHorizontalInches = 0.4;
    marginVerticalInches = 0.4;

    marginHorizontal = 2 * marginHorizontalInches * 72; // Convert inches to points
    marginVertical = 2 * marginVerticalInches * 72;     // Convert inches to points
}



function drawWorksheet(svg, pageIndex) {
    // Get the width and height from the svg attributes
    var width = parseFloat(svg.getAttribute('width'));
    var height = parseFloat(svg.getAttribute('height'));

    // Create the main group for the worksheet
    var worksheetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    worksheetGroup.setAttribute('class', 'worksheetGroup');
    svg.appendChild(worksheetGroup);

    // Define stroke width in points
    var strokeWidth = 0.6;

    // Draw outer rectangle
    drawOuterRectangle(worksheetGroup, width, height, strokeWidth);

    // Draw background horizontal lines at every nib width
    var backgroundLinesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    backgroundLinesGroup.setAttribute("class", "backgroundLines");
    worksheetGroup.appendChild(backgroundLinesGroup);

    // Draw slant guides if selected
    if (showVerticalLines) {
        var slantGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        slantGroup.setAttribute("class", "verticalLines");
        worksheetGroup.appendChild(slantGroup);

        drawSlantGuides(slantGroup, width, height, strokeWidth);
    }



    // Fetch characters to render for this page
    var charactersForPage;

    charactersForPage = getCharactersForPage(pageIndex);

    drawPracticeBlocks(worksheetGroup, backgroundLinesGroup, width, height, strokeWidth, charactersForPage);
}


// CHARACTERS FOR PRACTICE FONT TO PLACE IN WORKSHEET
// Define the character arrays
const lowercaseAlphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
const uppercaseAlphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
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
    // Map font names to URLs
    var fontUrls = {
        //                'Drafting': 'fonts/drafting.ttf',
        'BreitkopfFraktur': 'fonts/BreitkopfFraktur.ttf',
        //              'Blackletter': 'fonts/blackletter.ttf',
        //            'Uncial': 'fonts/uncial.ttf'
    };
    return fontUrls[fontName];
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
    var verticalLineSpacing = nibWidth * verticalLineSpacingMultiplier;

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

    // Calculate total nib height per block
    var nibHeight = nibWidth; // For clarity
    var nibRectWidth = nibWidth;
    var xHeight = xHeightNibWidths * nibHeight;
    var ascenderNibWidths = xHeightNibWidths; // Assuming ascender height equal to x-height
    var capitalNibWidths = xHeightNibWidths * 0.7; // For example, 70% of x-height
    var descenderNibWidths = xHeightNibWidths; // Assuming descender height equal to x-height

    var ascenderHeight = ascenderMultiplier * xHeight;
    var capitalHeight = capitalMultiplier * xHeight;
    var descenderHeight = descenderMultiplier * xHeight;

    // totalSectionHeight
    var totalBlockHeight = ascenderHeight + capitalHeight + xHeight + descenderHeight;

    var yPosition = 0;
    var charIndex = 0;

    while (yPosition <= (height - totalBlockHeight)) {
        var charactersForLine = [""];
        if (showFont == true) {
            //console.log(charIndex);
            charactersForLine = getCharactersForLine(charactersForPage, charIndex, width);

        }
        drawPracticeBlockLines(worksheetGroup, backgroundLinesGroup, yPosition, width, strokeWidth, nibHeight, xHeight, ascenderHeight, capitalHeight, descenderHeight, charactersForLine);
        drawPracticeBlockChars(worksheetGroup, backgroundLinesGroup, yPosition, width, strokeWidth, nibHeight, xHeight, ascenderHeight, capitalHeight, descenderHeight, charactersForLine);
        yPosition += totalBlockHeight + nibHeight; // Move y to next block, adding a nibHeight gap
        charIndex += charactersForLine.length;
    }
}



function drawPracticeBlockLines(worksheetGroup, backgroundLinesGroup, y, width, strokeWidth, nibHeight, xHeight, ascenderHeight, capitalHeight, descenderHeight, charactersForLine) {
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
    console.log("shadeXHeightArea: " + y);
    shadeXHeightArea(practiceBlocksGroup, y, width, xHeight, ascenderHeight, capitalHeight);

    fillGapBetweenBlocks(practiceBlocksGroup, descenderY, width, nibHeight);


    // Draw guide lines
    drawGuideLines(practiceBlocksGroup, width, strokeWidth, ascenderY, capitalY, waistlineY, midlineY, baselineY, descenderY);

    // Draw horizontal lines
    drawHorizontalLines(backgroundLinesGroup, width, strokeWidth, nibWidth, baselineY, ascenderY, descenderY);

    // Draw nib guide if selected
    if (showNibSquares) {
        drawNibGuide(practiceBlocksGroup, ascenderY, waistlineY, baselineY, descenderY, nibHeight, nibWidth);
    }

    // Draw nib guideline labels if selected
    if (showNibGuidelineLabels) {
        drawNibGuidelineLabels(practiceBlocksGroup, ascenderY, capitalY, waistlineY, baselineY, descenderY);
    }


    worksheetGroup.appendChild(practiceBlocksGroup);

    //console.log(practiceBlocksGroup);
}

function drawPracticeBlockChars(worksheetGroup, backgroundLinesGroup, y, width, strokeWidth, nibHeight, xHeight, ascenderHeight, capitalHeight, descenderHeight, charactersForLine) {
    // Variables for line positions
    var ascenderY = y;
    var capitalY = ascenderY + ascenderHeight;
    var waistlineY = capitalY + capitalHeight;
    var baselineY = waistlineY + xHeight;
    var descenderY = baselineY + descenderHeight;
    var midlineY = waistlineY + xHeight / 2;

    // Draw practice blocks with x-height area shaded
    var practiceBlocksGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    practiceBlocksGroup.setAttribute("class", "practiceBlocksCharacters");

    // After drawing guidelines, render the characters
    renderCharacters(practiceBlocksGroup, charactersForLine, xHeight, ascenderHeight, capitalHeight, baselineY, y);
    console.log("renderCharacters: " + y);

    worksheetGroup.appendChild(practiceBlocksGroup);

    //console.log(practiceBlocksGroup);
}

function renderCharacters(group, characters, xHeight, ascenderHeight, capitalHeight, baselineY, blockY) {
    var practiceArrangement = document.getElementById('practiceCharactersArrangement').value;

    if (!showFont || !font) return;

    // Calculate scaling factor to fit font into x-height
    var fontUnitsPerEm = font.unitsPerEm;
    fontScaleFactor = xHeight / getSXHeight();

    // Set initial x position
    var xPosition = 50; // Adjust as needed


    var index = 0;
    characters.forEach(function (char) {
        var glyph = font.charToGlyph(char);
        if (glyph) {
            // console.log(`Rendering glyph for character: ${char}`);
        }
        var path = glyph.getPath(0, 0, font.unitsPerEm);

        // Create SVG path element
        var svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        svgPath.setAttribute("d", path.toPathData(5));
        svgPath.setAttribute("fill", "#000"); // Set desired color

        // Calculate transformation to position the character
        var x = xPosition;
        var y = baselineY + blockY;

        var transform = `translate(${x}, ${y}) scale(${fontScaleFactor}, ${fontScaleFactor})`;
        svgPath.setAttribute("transform", transform);

        group.appendChild(svgPath);

        // console.log(`Rendering character ${index + 1}: ${char} at X: ${xPosition}, Y: ${baselineY}`);


        xPosition += (glyph.advanceWidth * fontScaleFactor) + spacingForCharacters;
        index = index + 1;
    });
}


function getCharactersForPage(pageIndex) {
    showFont = document.getElementById('showFont').checked;
    if (!showFont) return [];

    const selectedValue = document.getElementById("caseSelection").value;
    var includeNumbers = document.getElementById('includeNumberCharacters').checked;

    var practiceArrangement = document.getElementById('practiceCharactersArrangement').value;
    var customText = document.getElementsByName('customPracticeText')[0].value.trim();


    var characters = [""];


   
        if (selectedValue === 'lowercaseOnly') {
            characters = lowercaseAlphabet;
        }
        if (selectedValue === 'uppercaseOnly') {
            characters = uppercaseAlphabet;
        }
        else if (selectedValue === "bothUppercaseAndLowercase") {
            characters = lowercaseAlphabet.concat(uppercaseAlphabet);
        }

        if (includeNumbers) {
            characters = characters.concat(numberCharacters);;
        }

        if (selectedValue === "customText") {
            // Get custom practice text from the textarea
            const customText = document.getElementById("customPracticeText").value;
            // Convert custom text to an array of characters
            characters = customText.split('').filter(char => char.trim() !== ''); // Exclude empty characters
        }


    

    // Calculate total pages
    var linesPerPage = calculateAvailableLinesPerPage();
    var charsPerPage = linesPerPage * charsPerLineGlobal;

    // Slice characters for current page
    var startIndex = pageIndex * charsPerPage;
    var endIndex = startIndex + charsPerPage;
    return characters.slice(startIndex, endIndex);
}

function getCharactersForLine(characters, charIndex, width) {
    var practiceArrangement = document.getElementById('practiceCharactersArrangement').value;
    var maxCharsPerLine = charsPerLineGlobal;

    var charsForLine = characters.slice(charIndex, charIndex + maxCharsPerLine);
    return charsForLine;
}

function calculateAvailableLinesPerPage() {
    // Calculate nib height in points
    var nibHeight = nibWidth;

    // Calculate various heights based on multipliers and x-height
    var xHeight = xHeightNibWidths * nibHeight;
    var ascenderHeight = ascenderMultiplier * xHeight;
    var capitalHeight = capitalMultiplier * xHeight;
    var descenderHeight = descenderMultiplier * xHeight;

    // Calculate total height of each practice block (including ascender, descender, etc.)
    var totalBlockHeight = ascenderHeight + capitalHeight + xHeight + descenderHeight;

    // Adjust the height of the page to take margins into account
    var height = paperSize[1] - marginVertical;

    // Calculate how many lines can fit on one page
    var totalLinesPerPage = Math.floor(height / (totalBlockHeight + nibHeight));

    // Check the practice characters arrangement
    var practiceArrangement = document.getElementById('practiceCharactersArrangement').value;
    var availableLinesPerPage;

    // If the arrangement is 'Rows of Characters', skip every alternate line
    if (practiceArrangement === 'RowsOfCharacters') {
        availableLinesPerPage = Math.floor(totalLinesPerPage / 2) + (totalLinesPerPage % 2); // Add 1 if there's an extra line left for even total lines
    } else {
        availableLinesPerPage = totalLinesPerPage;
    }

    // Debugging logs
    console.log("----calculateAvailableLinesPerPage()----");
    console.log("Height Available: " + height);
    console.log("Total Block Height: " + totalBlockHeight);
    console.log("Total Lines Per Page: " + totalLinesPerPage);
    console.log("Available Lines Per Page (after adjustment): " + availableLinesPerPage);

    return availableLinesPerPage;
}



function getSXHeight() {

    var estimatedXHeight = (font.tables.os2.sTypoAscender - font.tables.os2.sTypoDescender) / 2;
    var sxHeight = font.tables.os2.sxHeight || estimatedXHeight;

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
    var xHeight = xHeightNibWidths * nibWidth;

    // Font scale factor to fit the font within x-height
    var fontScaleFactor = xHeight / getSXHeight();

    // Get the actual characters selected from the form fieldset for practice
    var selectedCharacters = getSelectedCharacters();
    if (selectedCharacters.length === 0) {
        console.error("No characters selected for practice. Using default sample set.");
        selectedCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
    }

    // Calculate an average character width in points using the selected characters
    let avgCharWidth = 0;
    selectedCharacters.forEach(char => {
        let glyph = font.charToGlyph(char);
        if (glyph) {
            avgCharWidth += glyph.advanceWidth;
        }
    });

    // Calculate the average character width and apply scaling
    avgCharWidth = (avgCharWidth / selectedCharacters.length) * fontScaleFactor;

    // Define spacing between characters
    spacingForCharacters = 30; // Adjust this value to modify the spacing between characters

    // Determine available width for character placement, considering margins
    var width = paperSize[0] - marginHorizontal; // Subtract horizontal margins from the paper width

    // Calculate the number of characters that can fit within the available width
    charsPerLineGlobal = Math.floor(width / (avgCharWidth + spacingForCharacters));

    // Log values for debugging purposes
    console.log("----calculateCharsPerLine()----");
    console.log("Width Available: " + width);
    console.log("Font Scale Factor: " + fontScaleFactor);
    console.log("Calculated Average Character Width (Scaled): " + avgCharWidth);
    console.log("Characters Per Line: " + charsPerLineGlobal);

    return charsPerLineGlobal;
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
    } else if (selectedValue === "bothUppercaseAndLowercase") {
        selectedCharacters = lowercaseAlphabet.concat(uppercaseAlphabet);
    } else if (selectedValue === "customText") {
        // Get custom practice text from the textarea
        const customText = document.getElementById("customPracticeText").value;
        // Convert custom text to an array of characters, excluding empty spaces
        selectedCharacters = customText.split('').filter(char => char.trim() !== '');
    }

    // Include numbers if the checkbox is checked
    if (includeNumbers && selectedValue !== "customText") {
        selectedCharacters = selectedCharacters.concat(numberCharacters);
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

function fillGapBetweenBlocks(practiceBlocksGroup, descenderY, width, nibHeight) {
    var gapRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    gapRect.setAttribute("x", 0);
    gapRect.setAttribute("y", descenderY);
    gapRect.setAttribute("width", width);
    gapRect.setAttribute("height", nibHeight);
    gapRect.setAttribute("fill", "#333");
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

function drawHorizontalLines(backgroundLinesGroup, width, strokeWidth, nibWidth, baselineY, ascenderY, descenderY) {
    // From baseline to ascender line
    for (var y = baselineY; y > ascenderY; y -= nibWidth) {
        drawLine(backgroundLinesGroup, 0, y, width, y, strokeWidth, "#eee");
    }

    // From baseline to descender line
    for (var y = baselineY; y < descenderY; y += nibWidth) {
        drawLine(backgroundLinesGroup, 0, y, width, y, strokeWidth, "#eee");
    }
}

function drawNibGuide(practiceBlocksGroup, ascenderY, waistlineY, baselineY, descenderY, nibHeight, nibWidth) {
    var nibGuideGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    practiceBlocksGroup.appendChild(nibGuideGroup);

    var nibX = 0; // Position from left edge
    var nibRectWidth = nibWidth;

    // Ascending blocks from baseline
    var nibCount = (baselineY - ascenderY) / nibHeight; // Number of squares to draw
    for (var i = 0; i < nibCount; i++) {
        var col = i % 2; // Alternate columns
        var yPosition = Math.ceil(baselineY - (i + 1) * nibHeight);
        var rectHeight = nibHeight;
        var rectY = yPosition;

        var fillColor = "#000";

        if (yPosition < waistlineY) {
            fillColor = "#999";
        }

        if (yPosition <= ascenderY) {
            var diff = ascenderY - yPosition;
            rectY = yPosition + diff;
            rectHeight = nibHeight - diff;
        }

        drawRect(nibGuideGroup, nibX + col * nibRectWidth, rectY, nibRectWidth, rectHeight, fillColor);

        if (yPosition < waistlineY && (yPosition + nibHeight - 1) > waistlineY) {
            var rectHeightSplit = (yPosition + nibHeight) - waistlineY;
            drawRect(nibGuideGroup, nibX + col * nibRectWidth, waistlineY, nibRectWidth, rectHeightSplit, "#000");
        }
    }

    // Descender blocks
    nibCount = (descenderY - baselineY) / nibHeight;
    var nibYStart = baselineY;
    for (var i = 0; i < nibCount; i++) {
        var col = 1 - (i % 2); // Alternate columns
        var yPosition = nibYStart + i * nibHeight;
        var rectHeight = nibHeight;
        if ((yPosition + nibHeight) > descenderY) {
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
    var labelX = showNibSquares ? (nibWidth * 2) + nibWidth / 2 : 2; // Depends on whether nibSquares are shown
    var fontSize = (nibWidthMm < 3) ? (9 * nibWidthMm / 3) + "px" : "9px"; // Scale when below 3mm nibWidth
    var labelColor = "#444"; // Dark gray
    var fontFamily = "Helvetica, sans-serif";

    if (ascenderMultiplier > 0) {
        // Ascender Label
        drawText(practiceBlocksGroup, labelX, ascenderY - 1 + nibWidth, fontSize, "#9c9c9c", "Ascender Line⬏ ", fontFamily);
    }

    if (capitalMultiplier > 0) {
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


// Setter for X-Height
function setXHeight(value) {
    // Ensure value is valid
    if (isNaN(value) || value <= 0) {
        console.error("Invalid xHeight value. Reverting to default.");
        value = 4; // Default fallback value
    }

    xHeightNibWidths = value; // Update global variable
    document.getElementById('xHeight').value = value; // Update text field
    console.log("X-Height updated to: " + value);
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
    console.log("Ascender Height updated to: " + value);
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
    console.log("Capital Height updated to: " + value);
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
    console.log("Descender Depth updated to: " + value);
}

// Setter for Nib Width
function setNibWidth(value) {
    // Ensure value is valid
    if (isNaN(value) || value <= 0) {
        console.error("Invalid nibWidth value. Reverting to default.");
        value = 3.8; // Default fallback value
    }

    nibWidthMm = value; // Update global variable
    nibWidth = nibWidthMm * mmToPt; // Convert to points
    document.getElementById('nibWidth').value = value; // Update text field
    console.log("Nib Width updated to: " + value);
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
    console.log("X-Height Opacity updated to: " + value);
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
    console.log("Vertical Slant Angle updated to: " + value);
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
    console.log("Vertical Line Spacing Multiplier updated to: " + value);
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
    console.log("Paper Size updated to: " + value);
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
    console.log("Orientation updated to: " + value);
}

// Event listeners to update the values using setters when the user changes the input fields
document.getElementById('xHeight').addEventListener('change', function () {
    const value = parseFloat(this.value);
    setXHeight(value);
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

document.getElementById('nibWidth').addEventListener('change', function () {
    const value = parseFloat(this.value);
    setNibWidth(value);
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
    console.log("Show Font updated to: " + showFont);
});

document.getElementById('showNibGuidelineLabels').addEventListener('change', function () {
    showNibGuidelineLabels = this.checked;
    console.log("Show Nib Guideline Labels updated to: " + showNibGuidelineLabels);
});

document.getElementById('showNibSquares').addEventListener('change', function () {
    showNibSquares = this.checked;
    console.log("Show Nib Squares updated to: " + showNibSquares);
});

document.getElementById('verticalLines').addEventListener('change', function () {
    showVerticalLines = this.checked;
    console.log("Show Vertical Lines updated to: " + showVerticalLines);
});
