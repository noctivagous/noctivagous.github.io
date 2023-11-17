
  window.keyMappings = {
    'Tab': {
      "defaultText": "Select Objects",
      "defaultFunctionString": "select",
      "defaultDescription": "Select an item",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",

      "selectionStateText": "Tab Selection",

    },
    'Backslash': {
      "defaultText": "Hide/Show Keyboard",
      "defaultFunctionString": "toggleKeyboardPanel",
      "defaultDescription": "Slides the keyboard off and on screen",
      "defaultButtonBackgroundColor": "rgb(0,0,0)",
      "defaultFontColor": "rgb(155,155,155)",

    },
    '^Backslash': {
      "defaultText": "Hide/Show Both Keyboards",
      "defaultFunctionString": "toggleBothKeyboardPanels",
      "defaultDescription": "Slides the keyboard off and on screen",
      "defaultButtonBackgroundColor": "rgb(0,0,0)",
      "defaultFontColor": "rgb(155,155,155)",

    },
    
    'KeyA': {
      "defaultText": "End",
      "defaultFunctionString": "end",
      "description": "End current drawing or selection",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",

      "selectionStateText": "Tab Selection",

    },
    'KeyF': {
      "defaultText": "Hard Corner",
      "defaultFunctionString": "hardCorner",
      "defaultDescription": "Perform hard corner action",
      "defaultButtonBackgroundColor": "var(--color-drawingButton-bg)",
      "defaultFontColor": "var(--color-drawingButton-font)",
      "selectionStateText": "Hard Corner Selection",
    },
    'KeyQ': {
      "defaultText": "Lasso",
      "defaultFunctionString": "hardCorner",
      "defaultDescription": "Perform hard corner action",
      "defaultButtonBackgroundColor": "var(--color-selectAndDrag-bg)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Hard Corner Selection",
    },

    'CapsLock': {
      "defaultText": "Paint Palette Keyboard Mode",
      "defaultFunctionString": "hardCorner",
      "defaultDescription": "Perform hard corner action",
      "defaultButtonBackgroundColor": "rgb(100,100,100)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Hard Corner Selection",
    },
    'KeyR': {
      "defaultText": "Close Path End",
      "defaultFunctionString": "closePathEnd",
      "defaultDescription": "close live path",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "close live path",
    },

    'KeyC': {
      "defaultText": "Stroke Width <br/>-1",
      "defaultFunctionString": "thinStroke",
      "defaultDescription": "thin stroke",
      "defaultButtonBackgroundColor": "rgb(0,0,0)",
      "defaultFontColor": "rgb(120,120,120)",
      "selectionStateText": "thin stroke",
    },
    '~KeyC': {
      "defaultText": "Stroke Width <br/>-0.5",
      "defaultFunctionString": "thinStroke",
      "defaultDescription": "thin stroke",
      "defaultButtonBackgroundColor": "rgb(0,0,0)",
      "defaultFontColor": "rgb(120,120,120)",
      "selectionStateText": "thin stroke",
    },


    '$KeyC': {
      "defaultText": "Stroke Width <br/>-5",
      "defaultFunctionString": "thinStrokeUpper1",
      "defaultDescription": "thin stroke",
      "defaultButtonBackgroundColor": "rgb(0,0,0)",
      "defaultFontColor": "rgb(120,120,120)",
      "selectionStateText": "thin stroke",
    },
    '$^KeyC': {
      "defaultText": "Stroke Width <br/>-10",
      "defaultFunctionString": "thinStrokeUpper2",
      "defaultDescription": "thin stroke",
      "defaultButtonBackgroundColor": "rgb(0,0,0)",
      "defaultFontColor": "rgb(120,120,120)",
      "selectionStateText": "thin stroke",
    },

    'KeyV': {
      "defaultText": "Stroke Width <br/>+1",
      "defaultFunctionString": "thickenStroke",
      "defaultDescription": "thicken stroke",
      "defaultButtonBackgroundColor": "rgb(10,10,10)",
      "defaultFontColor": "rgb(120,120,120)",
      "selectionStateText": "thicken stroke",
    },
    '~KeyV': {
      "defaultText": "Stroke Width <br/>+0.5",
      "defaultFunctionString": "thickenStroke",
      "defaultDescription": "thicken stroke",
      "defaultButtonBackgroundColor": "rgb(0,0,0)",
      "defaultFontColor": "rgb(120,120,120)",
      "selectionStateText": "thin stroke",
    },
    '$KeyV': {
      "defaultText": "Stroke Width <br/>+5",
      "defaultFunctionString": "thinStrokeUpper1",
      "defaultDescription": "thicken stroke",
      "defaultButtonBackgroundColor": "rgb(0,0,0)",
      "defaultFontColor": "rgb(120,120,120)",
      "selectionStateText": "thin stroke",
    },
    '$^KeyV': {
      "defaultText": "Stroke Width <br/>+10",
      "defaultFunctionString": "thickenStrokeUpper",
      "defaultDescription": "thicken stroke",
      "defaultButtonBackgroundColor": "rgb(0,0,0)",
      "defaultFontColor": "rgb(120,120,120)",
      "selectionStateText": "thin stroke",
    },

    'Mac@KeyC': {
      "defaultText": "Copy",
      "defaultFunctionString": "copyToClipboard",
      "defaultDescription": "copy",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "copy selected obj",
    },

    'PC^KeyC': {
      "defaultText": "Copy",
      "defaultFunctionString": "copyToClipboard",
      "defaultDescription": "copy",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "copy selected obj",
    },

    '^KeyF': {
      "defaultText": "Bring Selection to Front",
      "defaultFunctionString": "bringSelectionToFront",
      "defaultDescription": "Bring selected objects to the front",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Bring selected objects to the front",
    },
    'KeyZ': {
      "defaultText": "Arc By Three Points",
      "defaultFunctionString": "arcByThreePoints",
      "defaultDescription": "Make an arc from three points",
      "defaultButtonBackgroundColor": "var(--color-drawingButton-bg)",
      "defaultFontColor": "var(--color-drawingButton-font)",

    },
    'KeyD': {
      "defaultText": "Round Corner",
      "defaultFunctionString": "roundCorner",
      "defaultDescription": "Make roundCorner point",
      "defaultButtonBackgroundColor": "var(--color-drawingButton-bg)",
      "defaultFontColor": "var(--color-drawingButton-font)",
      
      "selectionStateText": "",
    },
    'KeyE': {
      "defaultText": "BSpline",
      "defaultFunctionString": "bspline",
      "defaultDescription": "Make bspline point",
      "defaultButtonBackgroundColor": "var(--color-drawingButton-bg)",
      "defaultFontColor": "var(--color-drawingButton-font)",

    },
    'KeyN': {
      "defaultText": "Nozzle Subtract",
      "defaultFunctionString": "nozzleSubtract",
      "defaultDescription": "Subtract",
      "defaultButtonBackgroundColor": "rgb(0,148,17",
      "defaultFontColor": "rgb(64,255,64",

    },
    'KeyM': {
      "defaultText": "Nozzle Add",
      "defaultFunctionString": "nozzleAdd",
      "defaultDescription": "Activate nozzle and add (e.g. particles)",
      "defaultButtonBackgroundColor": "rgb(0,148,17",
      "defaultFontColor": "rgb(64,255,64",

    },
    '^KeyB': {
      "defaultText": "Send Selection to Back",
      "defaultFunctionString": "sendSelectionToBack",
      "defaultDescription": "Send selected objects to the back",
      "defaultButtonBackgroundColor": "rgb(0,148,17",
      "defaultFontColor": "rgb(64,255,64",
      "selectionStateText": "Send selected objects to the back",
    },
    '^ArrowUp': {
      "defaultText": "Bring Selection Forward",
      "defaultFunctionString": "bringSelectionForward",
      "defaultDescription": "Bring selected objects forward by one step",
      "defaultButtonBackgroundColor": "rgb(17,0,148",
      "defaultFontColor": "rgb(64,64,255)",
      "selectionStateText": "Bring selected objects forward by one step",
    },
    '^ArrowDown': {
      "defaultText": "Send Selection Backward",
      "defaultFunctionString": "sendSelectionBackward",
      "defaultDescription": "Send selected objects backward by one step",
      "defaultButtonBackgroundColor": "rgb(148,148,148",
      "defaultFontColor": "rgb(0,0,0)",
      "selectionStateText": "Send selected objects backward by one step",
    },

    'KeyG': {
      "defaultText": "Bowed Line <br/>&#10227;",
      "defaultFunctionString": "bowedLineCClockwise",
      "defaultDescription": "bowed line c",
      "defaultButtonBackgroundColor": "var(--color-drawingButton-bg)",
      "defaultFontColor": "var(--color-drawingButton-font)",

    },


    'KeyH': {
      "defaultText": "Bowed Line <br/> &#10226;",
      "defaultFunctionString": "bowedLineCClockwise",
      "defaultDescription": "bowed line c",
      "defaultButtonBackgroundColor": "var(--color-drawingButton-bg)",
      "defaultFontColor": "var(--color-drawingButton-font)",

    },



    'Mac@KeyV': {
      "defaultText": "Paste",
      "defaultFunctionString": "pasteFromClipboard",
      "defaultDescription": "paste",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "paste",
    },

    'PC^KeyV': {
      "defaultText": "Paste",
      "defaultFunctionString": "pasteFromClipboard",
      "defaultDescription": "paste",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "paste",
    },

    'Mac@KeyZ': {
      "defaultText": "Undo",
      "defaultFunctionString": "undo",
      "defaultDescription": "undo",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "undo",
    },

    'Mac@KeyX': {
      "defaultText": "Redo",
      "defaultFunctionString": "redo",
      "defaultDescription": "redo",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "redo",
    },

    'PC^KeyZ': {
      "defaultText": "Undo",
      "defaultFunctionString": "undo",
      "defaultDescription": "undo",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "undo",
    },

    'PC^KeyX': {
      "defaultText": "Redo",
      "defaultFunctionString": "redo",
      "defaultDescription": "redo",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "redo",
    },

    'BracketRight': {

      "defaultText": "Scale Up <br/>10%",
      "defaultFunctionString": "scaleUp",
      "defaultDescription": "Scale up an object",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Scale up selection",

    },
    'BracketLeft': {

      "defaultText": "Scale Down <br/>10%",
      "defaultFunctionString": "scaleDown",
      "defaultDescription": "Scale down an object",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Scale down selection",

    },
    '$BracketLeft': {
      "defaultText": "Scale Down 30%",
      "defaultFunctionString": "scaleDownUpper1",
      "defaultDescription": "Scale down an object with Shift",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Shift + Bracket Left Selection",

    },
    '$BracketRight': {
      "defaultText": "Scale Up 30%",
      "defaultFunctionString": "scaleUpUpper1",
      "defaultDescription": "Scale up an object with Shift",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Shift + Bracket Right Selection",

    },
    '$^BracketLeft': {
      "defaultText": "Scale Down 40%",
      "defaultFunctionString": "scaleDownUpper2",
      "defaultDescription": "Scale down an object with Shift",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Shift + Bracket Left Selection",

    },
    '$^BracketRight': {
      "defaultText": "Scale Up 40%",
      "defaultFunctionString": "scaleUpUpper2",
      "defaultDescription": "Scale up an object with Shift",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Shift + Bracket Right Selection",

    },
    '~BracketLeft': {
      "defaultText": "Scale Down <br/>5%",
      "defaultFunctionString": "scaleDownLower1",
      "defaultDescription": "Scale down an object by a smaller amount.",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Tilde + Bracket Left Selection",
    },
    '~BracketRight': {
      "defaultText": "Scale Up <br/>5%",
      "defaultFunctionString": "scaleUpLower1",
      "defaultDescription": "Scale up an object with Tilde",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Tilde + Bracket Right Selection",

    },
    '^BracketRight': {
      "defaultText": "Live Scaling",
      "defaultFunctionString": "liveScaling",
      "defaultDescription": "Perform live X or Y scaling",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Live X/Y Scaling Selection",
    },
    '$~BracketRight': {
      "defaultText": "Live X Or Y Scaling",
      "defaultFunctionString": "liveXOrYScaling",
      "defaultDescription": "Perform live X or Y scaling",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Live X/Y Scaling Selection",
    },
    '^BracketLeft': {
      "defaultText": "Live Shearing",
      "defaultFunctionString": "liveShearing",
      "defaultDescription": "Perform live shearing action",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Live Shearing Selection",
    },
    '^~BracketLeft': {
      "defaultText": "Scale Down <br/>1.5%",
      "defaultFunctionString": "scaleDownLower2",
      "defaultDescription": "Scale down an object ",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Scale Down Lower2",
    },
    '^~BracketRight': {
      "defaultText": "Scale Up <br/>1.5%",
      "defaultFunctionString": "scaleUpLower2",
      "defaultDescription": "Scale up an object ",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Scale up Lower2",
    },
    'Semicolon': {
      "defaultText": "Rotate -15°",
      "defaultFunctionString": "rotateCounterclockwise",
      "defaultDescription": "Rotate counterclockwise",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Semicolon Selection",
    },
    'Quote': {
      "defaultText": "Rotate  <br/>15°",
      "defaultFunctionString": "rotateClockwise",
      "defaultDescription": "Rotate clockwise",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Quote Selection",
    },
    '$Semicolon': {
      "defaultText": "Rotate <br/>-45°",
      "defaultFunctionString": "rotateCounterclockwiseUpper1",
      "defaultDescription": "Rotate counterclockwise with Shift",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Shift + Semicolon Selection",
    },
    '$Quote': {
      "defaultText": "Rotate 45°",
      "defaultFunctionString": "rotateClockwiseUpper1",
      "defaultDescription": "Rotate clockwise with Shift",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Shift + Quote Selection",
    },

    '$^Semicolon': {
      "defaultText": "Rotate -90°",
      "defaultFunctionString": "rotateCounterclockwiseUpper2",
      "defaultDescription": "Rotate counterclockwise with Shift",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Shift + Semicolon Selection",
    },
    '$^Quote': {
      "defaultText": "Rotate 90°",
      "defaultFunctionString": "rotateClockwiseUpper2",
      "defaultDescription": "Rotate clockwise with Shift",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Shift + Quote Selection",
    },

    '~Semicolon': {
      "defaultText": "Rotate -5°",
      "defaultFunctionString": "rotateCounterclockwiseLower1",
      "defaultDescription": "Rotate counterclockwise by a smaller amount.",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Tilde + Semicolon Selection",
    },
    '~Quote': {
      "defaultText": "Rotate 5°",
      "defaultFunctionString": "rotateClockwiseLower1",
      "defaultDescription": "Rotate clockwise by a smaller amount.",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Tilde + Quote Selection",
    },
    '^~Semicolon': {
      "defaultText": "Rotate -1°",
      "defaultFunctionString": "rotateCounterclockwiseLower2",
      "defaultDescription": "Rotate counterclockwise by a smaller amount with Ctrl+Alt",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Ctrl+Shift + Semicolon Selection",
    },
    '^~Quote': {
      "defaultText": "Rotate 1°",
      "defaultFunctionString": "rotateClockwiseLower2",
      "defaultDescription": "Rotate clockwise by a smaller amount with Ctrl+Alt",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "Ctrl+Shift + Quote Selection",
    },
    'ArrowUp': {
      "defaultText": "Arrow Up",
      "defaultFunctionString": "arrowUp",
      "defaultDescription": "Perform Arrow Up action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Arrow Up Selection"
    },
    'ArrowDown': {
      "defaultText": "Arrow Down",
      "defaultFunctionString": "arrowDown",
      "defaultDescription": "Perform Arrow Down action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Arrow Down Selection"
    },
    'ArrowLeft': {
      "defaultText": "Arrow Left",
      "defaultFunctionString": "arrowLeft",
      "defaultDescription": "Perform Arrow Left action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Arrow Left Selection"
    },
    'ArrowRight': {
      "defaultText": "Arrow Right",
      "defaultFunctionString": "arrowRight",
      "defaultDescription": "Perform Arrow Right action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Arrow Right Selection"
    },

    '$ArrowUp': {
      "defaultText": "Shift + Arrow Up",
      "defaultFunctionString": "arrowUpUpper1",
      "defaultDescription": "Perform Shift + Arrow Up action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Shift + Arrow Up Selection"
    },
    '$ArrowDown': {
      "defaultText": "Shift + Arrow Down",
      "defaultFunctionString": "arrowDownUpper1",
      "defaultDescription": "Perform Shift + Arrow Down action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Shift + Arrow Down Selection"
    },
    '$ArrowLeft': {
      "defaultText": "Shift + Arrow Left",
      "defaultFunctionString": "arrowLeftUpper1",
      "defaultDescription": "Perform Shift + Arrow Left action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Shift + Arrow Left Selection"
    },
    '$ArrowRight': {
      "defaultText": "Shift + Arrow Right",
      "defaultFunctionString": "arrowRightUpper1",
      "defaultDescription": "Perform Shift + Arrow Right action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Shift + Arrow Right Selection"
    },

    '$^ArrowUp': {
      "defaultText": "Shift + Arrow Up",
      "defaultFunctionString": "arrowUpUpper2",
      "defaultDescription": "Perform Shift + Arrow Up action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Shift + Arrow Up Selection"
    },
    '$^ArrowDown': {
      "defaultText": "Shift + Arrow Down",
      "defaultFunctionString": "arrowDownUpper2",
      "defaultDescription": "Perform Shift + Arrow Down action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Shift + Arrow Down Selection"
    },
    '$^ArrowLeft': {
      "defaultText": "Shift + Arrow Left",
      "defaultFunctionString": "arrowLeftUpper2",
      "defaultDescription": "Perform Shift + Arrow Left action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Shift + Arrow Left Selection"
    },
    '$^ArrowRight': {
      "defaultText": "Shift + Arrow Right",
      "defaultFunctionString": "arrowRightUpper2",
      "defaultDescription": "Perform Shift + Arrow Right action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Shift + Arrow Right Selection"
    },


    '~ArrowUp': {
      "defaultText": "Arrow Up Lower",
      "defaultFunctionString": "arrowUpLower1",
      "defaultDescription": "Perform Option + Arrow Up action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Option + Arrow Up Selection"
    },
    '~ArrowDown': {
      "defaultText": "Option + Arrow Down",
      "defaultFunctionString": "arrowDownLower1",
      "defaultDescription": "Perform Option + Arrow Down action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Option + Arrow Down Selection"
    },
    '~ArrowLeft': {
      "defaultText": "Option + Arrow Left",
      "defaultFunctionString": "arrowLeftLower1",
      "defaultDescription": "Perform Option + Arrow Left action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Option + Arrow Left Selection"
    },
    '~ArrowRight': {
      "defaultText": "Option + Arrow Right",
      "defaultFunctionString": "arrowRightLower1",
      "defaultDescription": "Perform Option + Arrow Right action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Option + Arrow Right Selection"
    },


    '^~ArrowUp': {
      "defaultText": "Arrow Up Lower",
      "defaultFunctionString": "arrowUpLower2",
      "defaultDescription": "Perform Option + Arrow Up action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Option + Arrow Up Selection"
    },
    '^~ArrowDown': {
      "defaultText": "Option + Arrow Down",
      "defaultFunctionString": "arrowDownLower2",
      "defaultDescription": "Perform Option + Arrow Down action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Option + Arrow Down Selection"
    },
    '^~ArrowLeft': {
      "defaultText": "Option + Arrow Left",
      "defaultFunctionString": "arrowLeftLower2",
      "defaultDescription": "Perform Option + Arrow Left action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Option + Arrow Left Selection"
    },
    '^~ArrowRight': {
      "defaultText": "Option + Arrow Right",
      "defaultFunctionString": "arrowRightLower2",
      "defaultDescription": "Perform Option + Arrow Right action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Option + Arrow Right Selection"
    },

    'Space': {
      "defaultText": "Drag Lock",
      "defaultFunctionString": "cart",
      "description": "Perform cart action",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Space Selection"
    },
    'KeyW': {
      "defaultText": "Stamp",
      "defaultFunctionString": "stamp",
      "defaultDescription": "Perform stamp action",
      "defaultButtonBackgroundColor": "var(--color-selectionOp-bg)",
      "defaultFontColor": "var(--color-selectionOp-font)",
      "selectionStateText": "KeyW Selection"
    },
    'Backspace': {
      "defaultText": "Remove All Selected",
      "defaultFunctionString": "removeAllSelectedItemsAndReset",
      "defaultDescription": "Remove all selected items and reset",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Backspace Selection"
    },
    'Escape': {
      "defaultText": "Cancel",
      "defaultFunctionString": "cancelOperations",
      "description": "Cancel operations",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Escape Selection"
    },
    'Backquote': {
      "defaultText": "Toggle Number Row",
      "defaultFunctionString": "makePaintStyleFill",
      "description": "Make paint style fill",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Digit1 Selection"
    },
    'Digit1': {
      "defaultText": "Set to Fill",
      "defaultFunctionString": "makePaintStyleFill",
      "description": "Make paint style fill",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Digit1 Selection"
    },
    'Digit2': {
      "defaultText": "Set to Stroke",
      "defaultFunctionString": "makePaintStyleStroke",
      "description": "Make paint style fill",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Digit1 Selection"
    },
    '~Digit1': {
      "defaultText": "Pull in Settings",
      "defaultFunctionString": "makePaintStyleFill",
      "description": "Make paint style fill",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Digit1 Selection"
    },
    '~Digit2': {
      "defaultText": "Push Settings",
      "defaultFunctionString": "makePaintStyleStroke",
      "description": "Make paint style fill",
      "defaultButtonBackgroundColor": "rgb(148,17,0)",
      "defaultFontColor": "rgb(255,64,255)",
      "selectionStateText": "Digit1 Selection"
    },

  };


  // Note: functionRegistry
  // provides foundation for
  // scripting commands, e.g.
  // MOVE-RIGHT-72PT
  // ROTATE-ATCENTER-45DEG
  // ROTATE-ATBOTTOMLEFT-45DEG
  // passing vars into the current
  // context


  window.functionRegistry = {
    toggleKeyboardPanel: () => {
      this.toggleKeyboardPanel();
    },
    toggleBothKeyboardPanels: () => {
      this.toggleBothKeyboardPanels();
    },
    select: () => {
      this.select();
    },
    hardCorner: () => {
      this.drawingEntityManager.hardCorner();
    },
    scaleDown: () => {
      this.drawingEntityManager.scaleDown();
    },
    scaleUp: () => {
      this.drawingEntityManager.scaleUp();
    },
    scaleDownUpper1: () => {
      this.drawingEntityManager.scaleDownUpper1();
    },
    scaleUpUpper1: () => {
      this.drawingEntityManager.scaleUpUpper1();
    },
    scaleDownUpper2: () => {
      this.drawingEntityManager.scaleDownUpper2();
    },
    scaleUpUpper2: () => {
      this.drawingEntityManager.scaleUpUpper2();
    },
    scaleDownLower1: () => {
      this.drawingEntityManager.scaleDownLower1();
    },
    scaleUpLower1: () => {
      this.drawingEntityManager.scaleUpLower1();
    },
    scaleDownLower2: () => {
      this.drawingEntityManager.scaleDownLower2();
    },
    scaleUpLower2: () => {
      this.drawingEntityManager.scaleUpLower2();
    },
    liveScaling: () => {
      this.drawingEntityManager.liveScaling();
    },
    liveXOrYScaling: () => {
      this.drawingEntityManager.liveXOrYScaling();
    },
    liveShearing: () => {
      this.drawingEntityManager.liveShearing();
    },
    rotateCounterclockwise: () => {
      this.drawingEntityManager.rotateCounterclockwise();
    },
    rotateClockwise: () => {
      this.drawingEntityManager.rotateClockwise();
    },
    rotateCounterclockwiseUpper1: () => {
      this.drawingEntityManager.rotateCounterclockwiseUpper1();
    },
    rotateClockwiseUpper1: () => {
      this.drawingEntityManager.rotateClockwiseUpper1();
    },
    rotateCounterclockwiseUpper2: () => {
      this.drawingEntityManager.rotateCounterclockwiseUpper2();
    },
    rotateClockwiseUpper2: () => {
      this.drawingEntityManager.rotateClockwiseUpper2();
    },
    rotateCounterclockwiseLower1: () => {
      this.drawingEntityManager.rotateCounterclockwiseLower1();
    },
    rotateClockwiseLower1: () => {
      this.drawingEntityManager.rotateClockwiseLower1();
    },
    rotateCounterclockwiseLower2: () => {
      this.drawingEntityManager.rotateCounterclockwiseLower2();
    },
    rotateClockwiseLower2: () => {
      this.drawingEntityManager.rotateClockwiseLower2();
    },

    thinStroke: () => {
      this.drawingEntityManager.thinStroke(2);
    },

    thickenStroke: () => {
      this.drawingEntityManager.thickenStroke(2);
    },

    thinStrokeUpper1: () => {
      this.drawingEntityManager.thinStroke(5);
    },

    thickenStrokeUpper1: () => {
      this.drawingEntityManager.thickenStroke(5);
    },

    thinStrokeUpper2: () => {
      this.drawingEntityManager.thinStroke(15);
    },

    thickenStrokeUpper2: () => {
      this.drawingEntityManager.thickenStroke(15);
    },

    thinStrokeLower1: () => {
      this.drawingEntityManager.thinStroke(2);
    },

    thickenStrokeLower1: () => {
      this.drawingEntityManager.thickenStroke(2);
    },

    thinStrokeLower2: () => {
      this.drawingEntityManager.thinStroke(1);
    },

    thickenStrokeLower2: () => {
      this.drawingEntityManager.thickenStroke(1);
    },



    copyToClipboard: () => {
      this.app.eventManager.copyToClipboard();
    },
    pasteFromClipboard: () => {
      this.app.eventManager.pasteFromClipboard();
    },
    undo: () => {
      this.app.eventManager.undo();
    },
    redo: () => {
      this.app.eventManager.redo();
    },

    bringSelectionToFront: () => {
      // Call the function to bring selected objects to the front
      this.drawingEntityManager.bringSelectionToFront();
    },

    sendSelectionToBack: () => {
      // Call the function to send selected objects to the back
      this.drawingEntityManager.sendSelectionToBack();
    },

    bringSelectionForward: () => {
      // Call the function to bring selected objects forward by one step
      this.drawingEntityManager.bringSelectionForward();
    },

    sendSelectionBackward: () => {
      // Call the function to send selected objects backward by one step
      this.drawingEntityManager.sendSelectionBackward();
    },

    cart: () => {
      this.cart();
    },
    stamp: () => {
      this.stamp();
    },
    removeAllSelectedItemsAndReset: () => {
      this.layerManager.removeAllSelectedItemsAndReset();
    },
    cancelOperations: () => {
      this.drawingEntityManager.cancelOperations();
      this.layerManager.cancel();
    },
    makePaintStyleFill: () => {
      this.drawingEntityManager.makePaintStyleFill();
    },
    makePaintStyleStroke: () => {
      this.drawingEntityManager.makePaintStyleStroke();
    },
    end: () => {
      this.drawingEntityManager.end();
    },
    closePathEnd: () => {
      this.drawingEntityManager.closePathAndEnd();
    },
    'arrowUp': () => {
      this.drawingEntityManager.arrowUp();
    },
    'arrowDown': () => {
      this.drawingEntityManager.arrowDown();
    },
    'arrowLeft': () => {
      this.drawingEntityManager.arrowLeft();
    },
    'arrowRight': () => {
      this.drawingEntityManager.arrowRight();
    },
    'arrowUpUpper1': () => {
      this.drawingEntityManager.arrowUpUpper1();
    },
    'arrowDownUpper1': () => {
      this.drawingEntityManager.arrowDownUpper1();
    },
    'arrowLeftUpper1': () => {
      this.drawingEntityManager.arrowLeftUpper1();
    },
    'arrowRightUpper1': () => {
      this.drawingEntityManager.arrowRightUpper1();
    },
    'arrowUpLower1': () => {
      this.drawingEntityManager.arrowUpLower1();
    },
    'arrowDownLower1': () => {
      this.drawingEntityManager.arrowDownLower1();
    },
    'arrowLeftLower1': () => {
      this.drawingEntityManager.arrowLeftLower1();
    },
    'arrowRightLower1': () => {
      this.drawingEntityManager.arrowRightLower1();
    },
    'arrowUpUpper2': () => {
      this.drawingEntityManager.arrowUpUpper2();
    },
    'arrowDownUpper2': () => {
      this.drawingEntityManager.arrowDownUpper2();
    },
    'arrowLeftUpper2': () => {
      this.drawingEntityManager.arrowLeftUpper2();
    },
    'arrowRightUpper2': () => {
      this.drawingEntityManager.arrowRightUpper2();
    },
    'arrowUpLower2': () => {
      this.drawingEntityManager.arrowUpLower2();
    },
    'arrowDownLower2': () => {
      this.drawingEntityManager.arrowDownLower2();
    },
    'arrowLeftLower2': () => {
      this.drawingEntityManager.arrowLeftLower2();
    },
    'arrowRightLower2': () => {
      this.drawingEntityManager.arrowRightLower2();
    },

    closePathAndEnd: () => {
      this.drawingEntityManager.closePathAndEnd();
    }
    // ... Other functions can be added here in a similar manner
  };


   window.keyToChar = {
    KeyA: 'a',
    KeyB: 'b',
    KeyC: 'c',
    KeyD: 'd',
    KeyE: 'e',
    KeyF: 'f',
    KeyG: 'g',
    KeyH: 'h',
    KeyI: 'i',
    KeyJ: 'j',
    KeyK: 'k',
    KeyL: 'l',
    KeyM: 'm',
    KeyN: 'n',
    KeyO: 'o',
    KeyP: 'p',
    KeyQ: 'q',
    KeyR: 'r',
    KeyS: 's',
    KeyT: 't',
    KeyU: 'u',
    KeyV: 'v',
    KeyW: 'w',
    KeyX: 'x',
    KeyY: 'y',
    KeyZ: 'z',
    Digit0: '0',
    Digit1: '1',
    Digit2: '2',
    Digit3: '3',
    Digit4: '4',
    Digit5: '5',
    Digit6: '6',
    Digit7: '7',
    Digit8: '8',
    Digit9: '9',
    F1: 'F1',
    F2: 'F2',
    F3: 'F3',
    F4: 'F4',
    F5: 'F5',
    F6: 'F6',
    F7: 'F7',
    F8: 'F8',
    F9: 'F9',
    F10: 'F10',
    F11: 'F11',
    F12: 'F12',
    MacEnter: 'Return',
    PCEnter: 'Enter',
    
    MacBackspace: 'Delete',
    PCBackspace: 'Backspace',
    Backspace: 'Delete',

    Enter: 'Return',
    Space: 'Spacebar',
    BracketLeft: '[',
    BracketRight: ']',
    Semicolon: ';',
    Backslash: '\\',
    Comma: ',',
    Period: '.',
    Slash: '/',
    Tab: 'Tab',
    ShiftLeft: 'Shift',
    ShiftRight: 'Shift',
    CapsLock: 'CapsLock',

    ControlLeft: 'Control',
    ControlRight: 'Control',

    /*
    PCControlLeft: 'Ctrl',
    PCControlRight: 'Ctrl',
*/


    MacMetaLeft: 'Command',
    MacMetaRight: 'Command',
    PCMetaLeft: '⊞',
    PCMetaRight: '⊞',
    MetaLeft: 'Command',
    MetaRight: 'Command',


    MacAltLeft: 'Option',
    MacAltRight: 'Option',
    PCAltLeft: 'Alt',
    PCAltRight: 'Alt',
    AltLeft: 'Option',
    AltRight: 'Option',

    Quote: "'",
    // Add more keys and their values as needed
  };