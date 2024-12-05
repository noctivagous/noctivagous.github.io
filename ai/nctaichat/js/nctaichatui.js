$(function () {
    // Initialize jQuery UI Tabs for both panels
    $("#leftTabs").tabs();
    $("#rightTabs").tabs();

    // Initialize Accordion for chat output
    $("#chatOutputAccordion").accordion({
        collapsible: true,
        active: false,
        heightStyle: "content",
    });

    // Function to dynamically add accordion items
    function addResponseToAccordion(responseText) {
        const newItemHeader = $("<h3>").text(`Chat Response ${$("#chatOutputAccordion > h3").length + 1}`);
        const newItemContent = $("<div>").append(
            $("<p>").text(responseText),
            $("<button>")
                .text("Delete")
                .click(function () {
                    newItemHeader.remove();
                    newItemContent.remove();
                    $("#chatOutputAccordion").accordion("refresh");
                })
        );
        $("#chatOutputAccordion").append(newItemHeader, newItemContent);
        $("#chatOutputAccordion").accordion("refresh");
    }

    // Example usage for the accordion
    for (i = 0; i < 2; i++) {

        addResponseToAccordion("Q:? \n R: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum..");
    }

    $(document).on("keydown", function (e) {
        if (e.shiftKey && e.ctrlKey && e.key === "Delete") {
            e.preventDefault();

            // Get the currently active accordion item
            const activeIndex = $("#chatOutputAccordion").accordion("option", "active");
            if (activeIndex !== false) {
                // Remove the active accordion header and content
                const headerToRemove = $("#chatOutputAccordion > h3").eq(activeIndex);
                const contentToRemove = $("#chatOutputAccordion > div").eq(activeIndex);
                headerToRemove.remove();
                contentToRemove.remove();

                // Refresh the accordion
                $("#chatOutputAccordion").accordion("refresh");
                //    alert(`Accordion item ${activeIndex + 1} deleted.`);
            } else {
                alert("No accordion item is currently open.");
            }
        }
    });

});


            // Temporary flag to switch Alt shortcuts to Control on macOS
            const useControlForAltOnMac = true;



$(function () {
    // Function to convert shortcut notation to a readable format
    function formatShortcut(shortcut) {

       
        const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

        
        return shortcut

            .replace('@', isMac ? '⌘' : 'win-') // Command/Windows key
            .replace('^', '^') // Control key
            .replace('$', 'Shift-') // Shift key
            .replace('~', isMac ? (useControlForAltOnMac ? 'Ctrl-' : 'Opt-') : 'Alt-'); // Alt/Option key
        }

        /*
    // Append shortcuts to the titles of elements with a "shortcut" attribute
    $("[shortcut]").each(function () {
        const $element = $(this);
        const shortcut = $element.attr("shortcut");

        // Check if the element is a textarea
        if ($(this).is("textarea") == false) {



            if (shortcut) {
                const formattedShortcut = formatShortcut(shortcut);
                const originalTitle = $element.text();
                $element.text(`${originalTitle} (${formattedShortcut})`);
            }

        }
    });
*/

    // Append shortcuts to the titles of elements with a "shortcut" attribute
   // Insert shortcut for each element with the "shortcut" attribute
   $("[shortcut]").each(function () {
    const $element = $(this);
    const shortcut = $element.attr("shortcut");

    if (shortcut) {
        const formattedShortcut = formatShortcut(shortcut);
        const shortcutHtml = `<span class="shortcut-box">${formattedShortcut}</span>`;  // Styled shortcut box

        // Check if the element is a textarea, and dynamically add the shortcut box
        if ($element.is("textarea")) {
            // Insert the shortcut box outside the textarea
            const $shortcutBox = $("<div class='textarea-shortcut'></div>").html(shortcutHtml);
            $element.parent().append($shortcutBox);  // Append the shortcut box next to the textarea

            // Position the shortcut box relative to the textarea
            $shortcutBox.css({
                position: 'absolute',
                top: $element.position().top + 10,  // Adjust positioning as needed
                right: 17,
                zIndex: 10,
            });
        } else {
            // For other elements, insert the shortcut inside them
            const originalText = $element.text();
            $element.html(`${originalText} ${shortcutHtml}`);
        }
    }
});


    // Bind keyboard shortcuts to actions
    $(document).on("keydown", function (e) {


        const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

        const keyMap = {
            '@': isMac ? e.metaKey : e.ctrlKey, // Command on Mac, Ctrl on Windows/Linux
            '^': e.ctrlKey,                     // Control key
            '$': e.shiftKey,                    // Shift key
            '~': useControlForAltOnMac && isMac ? e.ctrlKey : e.altKey, // Switch Alt to Control on Mac if flag is true
        };



        // Iterate over elements with shortcuts
        $("[shortcut]").each(function () {
            const shortcut = $(this).attr("shortcut");
            if (!shortcut) return;

            const key = shortcut.slice(-1).toLowerCase();

            const modifiers = shortcut.slice(0, -1).split("");

            // Check if all modifiers are active
            const modifiersActive = modifiers.every((mod) => keyMap[mod]);

            if (modifiersActive) {

                console.log(e.key.toLowerCase());


            }

            // Check if the key matches
            if (modifiersActive && (e.key.toLowerCase() === key)) {
                e.preventDefault();


                // Check if the element is a textarea
                if ($(this).is("textarea")) {
                    $(this).focus(); // Focus on the textarea
                } else {

                    $(this).trigger("click"); // Trigger the click event for other elements

                }
            }

        });
    });

    // Example action to test functionality
    $("[shortcut]").on("click", function () {
        //   alert(`Shortcut activated for: ${$(this).text()}`);
    });


    // Initialize tabs and accordion
    $("#leftTabs, #rightTabs").tabs();
    $("#chatOutputAccordion").accordion({
        collapsible: true,
        active: false,
        heightStyle: "content",
    });
});




$(function () {
    // Initialize Controlgroup
    $("#chatControls").controlgroup();

    // Autosave Checkbox Default State
    let isAutosaveEnabled = false;

    $("#autosave").on("change", function () {
        isAutosaveEnabled = $(this).is(":checked");
        //  alert(`Autosave is now ${isAutosaveEnabled ? "enabled" : "disabled"}.`);
    });

    // Display Style Radio Buttons
    $("input[name='displayStyle']").on("change", function () {
        const selectedStyle = $(this).val();

        // Handle different display styles
        switch (selectedStyle) {
            case "accordion":
                $("#chatOutputAccordion").show();
                $("#chatOutputAccordion").accordion("refresh");
                $("#listView, #gridView").remove(); // Remove other styles
                break;

            case "list":
                $("#chatOutputAccordion").hide();
                renderListView(); // Show List View
                break;

            case "grid":
                $("#chatOutputAccordion").hide();
                renderGridView(); // Show Grid View
                break;
        }
    });

    // Function to render list view
    function renderListView() {
        // Remove existing grid or list views if present
        $("#listView, #gridView").remove();

        // Create a list view container
        const listView = $("<ul>", { id: "listView", class: "list-view" });
        $("#chatOutputAccordion").children("h3").each(function (index) {
            const content = $(this).next("div").text();
            listView.append($("<li>").text(content));
        });

        $("#chatOutputAccordion").after(listView);
    }

    // Function to render grid view
    function renderGridView() {
        // Remove existing grid or list views if present
        $("#listView, #gridView").remove();

        // Create a grid view container
        const gridView = $("<div>", { id: "gridView", class: "grid-view" });
        $("#chatOutputAccordion").children("h3").each(function (index) {
            const content = $(this).next("div").text();
            const gridItem = $("<div>", { class: "grid-item" }).text(content);
            gridView.append(gridItem);
        });

        $("#chatOutputAccordion").after(gridView);
    }
});


$(function () {
    // Initialize the menu with jQuery UI
    $(".menu").menu();

    // Position and show the menu overlay when the button is clicked
    $("#activateMenuButton").on("click", function () {
        const $textarea = $("#textChatInput");
        const offset = $textarea.offset();
        $("#menuOverlay").css({
            top: offset.top,
            left: offset.left,
            width: $textarea.outerWidth(), // Match width of the textarea
        }).show();
    });

    // Hide the menu overlay when Escape is pressed
    $(document).on("keydown", function (e) {
        if (e.code === "Escape") {
            $("#menuOverlay").hide();
        }
    });

    // Handle menu item clicks
    $(".menu").on("click", "li", function () {
        const text = $(this).text().trim(); // Get the clicked item's text and trim whitespace
        const $textarea = $("#textChatInput");

        // Insert the text into the textarea at the current cursor position
        const cursorPos = $textarea.prop("selectionStart");
        const value = $textarea.val();
        const newValue =
            value.slice(0, cursorPos) + text + value.slice(cursorPos);
        $textarea.val(newValue);

        // Set the cursor position after the inserted text
        const newCursorPos = cursorPos + text.length;
        $textarea[0].setSelectionRange(newCursorPos, newCursorPos);

        // Bring focus back to the textarea
        $textarea.focus();

        // Hide the menu overlay after selection
        $("#menuOverlay").hide();
    });


    // Monitor for large pasted text
    $("#textChatInput").on("paste", function (e) {
        const clipboardData = e.originalEvent.clipboardData || window.clipboardData;
        const pastedText = clipboardData.getData("text");

        // Define the size threshold for "large" text
        const LARGE_TEXT_THRESHOLD = 50;

        // Check if the pasted text is considered large
        if (pastedText.length > LARGE_TEXT_THRESHOLD) {
            // Append the large pasted text to the "Pasted Text" list
            const dataType = detectDataType(pastedText); // Example function for determining type
            const listItem = `
                <li style="border-bottom: 1px solid #ddd; padding: 5px;">
                    <strong>Type:</strong> ${dataType} <br>
                    <strong>Content:</strong> ${pastedText}
                </li>`;
            $("#pastedTextList").append(listItem);

            // Prevent default paste if necessary (optional)
            // e.preventDefault();
        }
    });

    // Example function to detect data type (simple heuristic)
    function detectDataType(text) {
        if (text.startsWith("http://") || text.startsWith("https://")) {
            return "URL";
        } else if (/^\d+$/.test(text)) {
            return "Number";
        } else if (text.includes("@")) {
            return "Email";
        } else {
            return "Text";
        }
    }
});


// Clear Textbox functionality when button is clicked
$("#clearTextbox").on("click", function () {
    $("#textChatInput").val(""); // Clear the textarea
});
