

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

function handleFontFileUpload(file) {
    if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            // Store the font as Base64
            const binary = new Uint8Array(e.target.result);
            let binaryString = '';
            for (let i = 0; i < binary.byteLength; i++) {
                binaryString += String.fromCharCode(binary[i]);
            }
            const base64String = btoa(binaryString);

            // Create a new option element for the font
            const fontName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
            const newOption = document.createElement('option');
            newOption.value = fontName;
            newOption.textContent = fontName;
            newOption.setAttribute('fontData', base64String);
            newOption.setAttribute('fontXHeightTweak', '0'); // Default tweak is 0
            newOption.setAttribute('brushWidthOfFont', '30'); // Default brush width
            newOption.setAttribute('ascenderRatio', '0.45');
            newOption.setAttribute('capHeightRatio', '0.6');
            newOption.setAttribute('descenderDepthRatio', '0.45');

            // Add the new option to the <select> dropdown
            const fontSelect = document.getElementById('fontForWorksheetPages');
            fontSelect.appendChild(newOption);

            // Set the newly uploaded font as selected
            fontSelect.value = fontName;
            showHideSections();
            loadFontAndMakeWorksheetPages();
        };
        reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
    }
}

// Handling the drag-and-drop functionality for "Drop file here" area
const dropArea = document.getElementById('dropArea');

dropArea.addEventListener('dragover', function (event) {
    event.preventDefault();
    dropArea.style.backgroundColor = '#666'; // Change style to indicate it's ready for drop
});

dropArea.addEventListener('dragleave', function () {
    dropArea.style.backgroundColor = '#494949'; // Revert style after drag leaves
});

dropArea.addEventListener('drop', function (event) {
    event.preventDefault();
    dropArea.style.backgroundColor = '#494949'; // Revert style after file is dropped

    const file = event.dataTransfer.files[0];
    handleFontFileUpload(file);
});



function init() {
   
    setDefaults();
    
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

        // Safari-specific action
        // Place your desired code here
        console.log("This is Safari; running alternative code.");
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
        showFont = document.getElementById('showFont').checked;

        if (!showFont) {
            makeWorksheetPages();
            return;
        }

        const fontSelect = document.getElementById('fontForWorksheetPages');
        const fontName = fontSelect.value;
        const fontUrl = getFontUrl(fontName);
        const selectedOption = fontSelect.options[fontSelect.selectedIndex];

        const fontData = selectedOption.getAttribute('fontData'); // Assume stored as base64

        
        if(fontData)
        {
            document.getElementById('nibWidthsTall').disabled = false;
        }

        // Load the font asynchronously

        if (fontData) {
            // Decode the base64-encoded fontData into an ArrayBuffer
            const byteString = atob(fontData);
            const byteArray = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                byteArray[i] = byteString.charCodeAt(i);
            }
            const arrayBuffer = byteArray.buffer;

            // Load the font using opentype.parse()
            font = opentype.parse(arrayBuffer);
            ////
        } else if (fontUrl) {
            // Load the font asynchronously using opentype.load()
            font = await loadFontAsync(fontUrl);
            makeFontMetrics();
            ////
        } else {
            throw new Error("No valid font source found (URL or fontData missing).");
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


function makeFontMetrics()
{
    
    if (showFont && font) {
        var fontSelect = document.getElementById('fontForWorksheetPages');
        // Get the selected <option> element
        const selectedOption = fontSelect.options[fontSelect.selectedIndex];

        // Pull ascender, capital height, and descender ratios from the <option>
        let ascenderRatio = parseFloat(selectedOption.getAttribute('ascenderRatio')) || 0.45;
        let capHeightRatio = parseFloat(selectedOption.getAttribute('capHeightRatio')) || 0.45;
        let descenderDepthRatio = parseFloat(selectedOption.getAttribute('descenderDepthRatio')) || 0.45;
        let brushWidthOfFontNibMultiplier = parseFloat(selectedOption.getAttribute('brushWidthOfFontNibMultiplier')) || 2; // Default value if not provided


        // Pull the user's nib width
        let nibWidthPt = getNibWidthPt();// parseFloat(document.getElementById('nibWidthMm').value); // Assuming you have a nibWidthPt input element

        
        // Calculate font scaling factor based on the nib width and brushWidthOfFont
        let fontScaleFactorToMakeXHeight = brushWidthOfFontNibMultiplier / nibWidthPt;

        // The width of the font is given.  What it takes to make the X-Height nib guide blocks the same
        // approximate width of the overall brushstroke width of the font's design.
        //setNibWidthsTall((brushWidthOfFontNibMultiplier / nibWidthPt).toFixed(2));
 
        // Set the nibWidthsTall to reflect the adjusted x-height
        setNibWidthsTall((nibWidthPt * fontScaleFactorToMakeXHeight ).toFixed(2));
        
        

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
    //    brushWidthOfFontGlobal = brushWidthOfFont;
}


async function makeWorksheetPages() {
    showHideSections();

    setNibWidthPtFromMM(document.getElementById("nibWidthMm").value);

    pullPaperSizeFromFormFields();

    emptyWorksheetArea();

    

    const rowsWithCharactersArray = generateRowsOfCharacters(); // Get the rows of characters


    // Determine the number of pages based on the rows of characters
    var numberOfPages = calculateNumberOfPages(rowsWithCharactersArray);

    if ((showFont == false) || !font) {
        
        numberOfPages = 1;
        document.getElementById('nibWidthsTall').disabled = false;
    }

    

    if(showFont && font)
    {
        const fontSelect = document.getElementById('fontForWorksheetPages');
        const fontName = fontSelect.value;
        const fontUrl = getFontUrl(fontName);
        const selectedOption = fontSelect.options[fontSelect.selectedIndex];

        const fontData = selectedOption.getAttribute('fontData'); // Assume stored as base64

        // don't allow adjustments of x-height (nibWidthsTall)
        // if the font was not uploaded by the user.
        if(fontData)
        {
            document.getElementById('nibWidthsTall').disabled = false;

        }
        else // uses fontData
        {
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

    //generateScrollbarThumbnailForWorksheetArea();
    updateGeneratedThumbPosition();
}


async function makeWorksheetPagesOLD() {
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


function calculateNumberOfPagesOLD() {
    // If no font practice is required, just return 1 page
    if (showFont == false) {
        return 1;
    }

    // Get number of lines per page
    var linesPerPage = calculateAvailableLinesPerPage();

    // Get number of characters per line
    var charsPerLine = calculateCharsPerLine();

    // Calculate total characters needed
    var totalCharacters = getTotalCharacters();

    // Calculate number of characters per page
    var charsPerPage = linesPerPage * charsPerLine;

    // Calculate number of pages needed
    var numberOfPages = Math.ceil(totalCharacters / charsPerPage);

    // Debugging logs
    ////
    ////
    ////
    ////

    return numberOfPages;
}




function generateRowsOfCharacters() {
    //
    //

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
    const characters = getSelectedCharacters();
    const linesPerPage = calculateTotalLinesPerPage();
    let charIndex = 0;

    //
    //
    //

    // Step 1: Generate an array of character rows without any empty lines
    if (arrangement === "RowsOfCharacters") {
        const [paperWidthOrientedRaw, paperHeightOrientedRaw] = getPaperSizeOriented();
        const width = paperWidthOrientedRaw - marginHorizontal - (0.25 * spacingForCharacters);

        //

        while (charIndex < characters.length) {
            let currentRow = [];
            let currentLineWidth = 0;

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
                    const charWidthWithSpacing = (glyph.advanceWidth * getFontScaleFactor()) + spacingForCharacters;

                    if (currentLineWidth + charWidthWithSpacing <= width) {
                        currentRow.push(char);
                        currentLineWidth += charWidthWithSpacing;
                        //
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

    } else if (arrangement === "singleCharacterAtLeft") {
        // Each row gets one character for "singleCharacterAtLeft"
        while (charIndex < characters.length) {
            characterRows.push([characters[charIndex]]);
            //
            charIndex++;
        }
    }

    //

    // Step 2: Generate a new array based on pages and number of lines per page
    let finalRows = [];

    for (let i = 0; i < characterRows.length; i++) {
        // Add the character row to the final rows array
        finalRows.push(characterRows[i]);

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









function getFontScaleFactor() {
            // Calculate the x-height in points based on user input and nib width
            var xHeight = getXHeightPt();

            // Font scale factor to fit the font within x-height
            var fontScaleFactor = xHeight / getFontSXHeight();

            return fontScaleFactor;
            
    /*// Example of using the nib width and the brush width multiplier to determine the scale factor
    const selectedOption = document.getElementById('fontForWorksheetPages').selectedOptions[0];
    const brushWidthOfFontNibMultiplier = parseFloat(selectedOption.getAttribute('brushWidthOfFontNibMultiplier')) || 30;
    let nibWidth = parseFloat(document.getElementById('nibWidthMm').value);

    const scaleFactor = nibWidth / brushWidthOfFontNibMultiplier;
    ////

    
    return scaleFactor;*/
}


function generateRowsOfCharactersOLD() {

    let rows = [];

    if (!showFont) {
        for (let i = 0; i < calculateTotalLinesPerPage(); i++) {
            rows.push("");

        }
        return rows;
    }

    const arrangement = document.getElementById('practiceCharactersArrangement').value;
    const characters = getSelectedCharacters();  // Gets the set of characters to use in the worksheet

    if (arrangement === "RowsOfCharacters") {
        // Use calculateCharsPerLine() to determine how many characters per row
        const charsPerLine = calculateCharsPerLine();

        let charIndex = 0;
        while (charIndex < characters.length) {
            // Create a row of characters
            let row = [];
            for (let i = 0; i < charsPerLine && charIndex < characters.length; i++) {
                row.push(characters[charIndex]);
                charIndex++;
            }
            rows.push(row); // Add a row with characters

            rows.push([]);  // Add an empty row for practice
        }

    } else if (arrangement === "singleCharacterAtLeft") {
        // Each row gets one character
        characters.forEach(char => {
            rows.push([char]);
        });
    }

    return rows;
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


function drawWorksheetOLD(svg, pageIndex) {
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

    if (font) {
        charactersForPage = getCharactersForPage(pageIndex);
    }
    drawPracticeBlocks(worksheetGroup, backgroundLinesGroup, width, height, strokeWidth, charactersForPage);
}


// CHARACTERS FOR PRACTICE FONT TO PLACE IN WORKSHEET
// Define the character arrays
const lowercaseAlphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
const uppercaseAlphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const mixedCasePairsLowerFirst = ["aA", "bB", "cC", "dD", "eE", "fF"];
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
    // If we are using "RowsOfCharacters" arrangement, draw characters on every other line
    // except the last line (to leave it blank for practice)
    if (arrangement === "RowsOfCharacters") {
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

function drawPracticeBlockChars(group, yPosition, width, strokeWidth, nibHeightPt, xHeight, ascenderHeight, capitalHeight, descenderHeight, charactersForLine) {
    if (!showFont || !font) return;

    // Calculate scaling factor to fit font into x-height
    var fontUnitsPerEm = font.unitsPerEm;
    var fontScaleFactor = (xHeight / getFontSXHeight()).toFixed(3);

    ////

    let xPosition = (nibWidthPt * 4) - 3; // Initial position to start drawing characters

    // Iterate through each character in charactersForLine and draw it
    charactersForLine.forEach(char => {
        const glyph = font.charToGlyph(char);
        if (glyph) {
            const path = glyph.getPath(0, 0, font.unitsPerEm);
            const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            svgPath.setAttribute("class", "practiceSheetGlyph");
            svgPath.setAttribute("d", path.toPathData(5));
            svgPath.setAttribute("fill", "#000");


            const transform = `translate(${xPosition}, ${yPosition + ascenderHeight + capitalHeight + xHeight}) scale(${fontScaleFactor}, ${fontScaleFactor})`; // Example scale and position
            svgPath.setAttribute("transform", transform);
            group.appendChild(svgPath);
            xPosition += (glyph.advanceWidth * fontScaleFactor) + spacingForCharacters;

        }
    });
}


function renderCharacters(group, characters, xHeight, ascenderHeight, capitalHeight, baselineY, blockY) {
    var practiceArrangement = document.getElementById('practiceCharactersArrangement').value;

    if (!showFont || !font) return;

    // Calculate scaling factor to fit font into x-height
    var fontUnitsPerEm = font.unitsPerEm;
    fontScaleFactor = xHeight / getFontSXHeight();

    // Set initial x position
    var xPosition = 50; // Adjust as needed


    var index = 0;
    characters.forEach(function (char) {
        var glyph = font.charToGlyph(char);
        if (glyph) {
            
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


    var characters = getSelectedCharacters();



    // Calculate total pages
    var linesPerPage = calculateAvailableLinesPerPage();
    var charsPerPage = linesPerPage * calculateCharsPerLine();

    // Slice characters for current page
    var startIndex = pageIndex * charsPerPage;
    var endIndex = startIndex + charsPerPage;
    return characters.slice(startIndex, endIndex);
}

function getCustomText()
{
    var customText = document.getElementById("customPracticeText").value;
    if (customText === "") {
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
        if (practiceArrangement === 'RowsOfCharacters') {
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

    // Check if the currently loaded font is an uploaded font
    const fontSelect = document.getElementById('fontForWorksheetPages');
    const selectedOption = fontSelect.options[fontSelect.selectedIndex];
    if (selectedOption.hasAttribute('fontData')) {
        // Retrieve fontXHeightTweak for uploaded fonts
        let fontXHeightTweak = parseFloat(selectedOption.getAttribute('fontXHeightTweak')) || 0;
        ////
        sxHeight += (-100 * fontXHeightTweak); // Apply the tweak
    }

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
    var fontScaleFactor = xHeight / getFontSXHeight();

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
    spacingForCharacters = 30; // Adjust this value to modify the spacing between characters

    const [paperWidthOrientedRaw, paperHeightOrientedRaw] = getPaperSizeOriented();

    // Determine available width for character placement, considering margins
    var width = paperWidthOrientedRaw - marginHorizontal - spacingForCharacters; // Subtract horizontal margins from the paper width


    // Calculate the number of characters that can fit within the available width
    //var charsPerLine = Math.floor(width / (avgCharWidth + spacingForCharacters));

    var charsPerLine = 4;


    charsPerLine = Math.floor(width / (avgCharWidth + spacingForCharacters));



    // Log values for debugging purposes
  //  ////
  
   
  //  ////
    //////

    return charsPerLine;
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

