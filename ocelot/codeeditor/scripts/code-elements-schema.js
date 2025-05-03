/*
CODE-ELEMENTS-SCHEMA.JS

Establishes the XML schema for code elements.
Contains the behavior rules (draggable, sortable, etc.) for each element.
Contains the attributes (collapsible).
Is the basis for inserting, reordering, modifying elements.
AskAI: generate schema for all code elements for a programming language and also provide CSS for them.
Is the place where components are loaded, a custom definition for defining the elements
with the accompanying CSS, JS, and behaviors, e.g. an animation curve editor or GUI control.
*/

const tagBehaviors = {
    'codedocument': { hoverable: true, sortable:false, selectable: false, draggable: false, pasteboardCopyable: false, collapsible: false },
    'function':      { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true },
    'class':         { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true},
    'functiongroup':         { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true },
    'constructors':      { hoverable: true, sortable:false, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true },
    'variable':      { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true },
    'statement':     { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
    'functioncall':  { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
    'parameter':     { hoverable: true, sortable:true, selectable: false, draggable: true, pasteboardCopyable: true, collapsible: false },
    'codebody':      { hoverable: false, sortable:false, selectable: false, draggable: true, pasteboardCopyable: true, collapsible: false },
    'return':    { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
    'expression': { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
    'operator': { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
    'literal': { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
    'gui-button': { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
    'guiArea':      { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true },
    'loop':            { hoverable: true,  sortable: true,  selectable: true,  draggable: true,  pasteboardCopyable: true,  collapsible: false },
    'conditional':     { hoverable: true,  sortable: true,  selectable: true,  draggable: true,  pasteboardCopyable: true,  collapsible: false },
    'assignment':      { hoverable: true,  sortable: true,  selectable: true,  draggable: true,  pasteboardCopyable: true,  collapsible: false },
    'comment':         { hoverable: false, sortable: false, selectable: true,  draggable: false, pasteboardCopyable: true,  collapsible: false }

  };
  
  /*
  This helper function getTagBehaviors extracts the behavior properties for an element based on its tag name. 
  */
  function getTagBehaviors(elem) {
    if (!elem) return {};
    const tag = elem.tagName ? elem.tagName.toLowerCase() : elem.nodeName.toLowerCase();
    return tagBehaviors[tag] || {};
  }
    
