const tagBehaviors = {
  'codedocument': { hoverable: true, sortable:false, selectable: false, draggable: false, pasteboardCopyable: false, collapsible: false },
  'function':      { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true },
  'class':         { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true},
  'group':         { hoverable: true, sortable:true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true },
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
  // Add more as 
};




$(function() {
  $('.sortable-container').sortable({
    items: '> *', // All direct children (your code elements)
    handle: '> name', // Drag by the <name> child if you want
    placeholder: "sortable-placeholder",
    update: function(event, ui) {
      // Optionally call your documentUIDidChange() or similar update routine here
      documentUIDidChange && documentUIDidChange();
    }
  });
});

function getTagBehaviors(elem) {
  if (!elem) return {};
  const tag = elem.tagName ? elem.tagName.toLowerCase() : elem.nodeName.toLowerCase();
  return tagBehaviors[tag] || {};
}



let currentlyHoveredElem = null;

// Build a selector string of all tags where hoverable is true.
const hoverableSelector = Object.keys(tagBehaviors)
  .filter(tag => tagBehaviors[tag].hoverable)
  .join(', ');

  document.addEventListener('mousemove', (e) => {
    const codeElem = e.target.closest(hoverableSelector);
    if (codeElem !== currentlyHoveredElem) {
      if (currentlyHoveredElem) {
        const prevBehaviors = getTagBehaviors(currentlyHoveredElem);
        if (prevBehaviors.hoverable) {
          currentlyHoveredElem.classList.remove('hovered');
        }
      }
      currentlyHoveredElem = codeElem;
      if (currentlyHoveredElem) {
        const behaviors = getTagBehaviors(currentlyHoveredElem);
        if (behaviors.hoverable) {
          currentlyHoveredElem.classList.add('hovered');
        }
      }
      selectionDidChange();
    }
  });

// Update selectionDidChange to control menu visibility and content
function selectionDidChange() {
  updateKeyCommandMenu(currentlyHoveredElem);
  updateSelectionInfoMenu();
  updateHoverInfoMenu();
}

// New: Update the hover info menu (shows info about hovered element)
function updateHoverInfoMenu() {
  const hoverMenu = document.getElementById('hover-info-menu');
  if (!hoverMenu) return;

  if (
    currentlyHoveredElem &&
    getTagBehaviors(currentlyHoveredElem).hoverable
  ) {
    const tag = currentlyHoveredElem.tagName
      ? currentlyHoveredElem.tagName.toLowerCase()
      : currentlyHoveredElem.nodeName.toLowerCase();
    let name = currentlyHoveredElem.querySelector(':scope > name')
      ? currentlyHoveredElem.querySelector(':scope > name').textContent.trim()
      : '';
    const isSelected = currentlyHoveredElem.classList.contains('selected');

    hoverMenu.innerHTML = `
      <div id="hover-info">
        <div id="hover-info-tag">${tag}</div>
        <br/>
        <div id="hover-info-name">${name ? ' <b>' + name + '</b>' : ''}</div>
        ${isSelected ? '<div id="hover-info-selected">(selected)</div>' : ''}
      </div>`;
  } else {
    hoverMenu.innerHTML = '';
  }
}


// Update selection info menu: only visible if there is a selection
function updateSelectionInfoMenu() {
  const list = document.getElementById('selection-info-list');
  const menu = document.getElementById('selection-info-menu');
  if (!list || !menu) return;

  const selected = document.querySelectorAll('.selected');
  if (selected.length === 0) {
    menu.style.display = 'none';
    return;
  }
  menu.style.display = '';

  // Show selected elements info
  let selectedInfo = Array.from(selected).map(elem => {
    const tag = elem.tagName ? elem.tagName.toLowerCase() : elem.nodeName.toLowerCase();
    let name = elem.querySelector(':scope > name') ? elem.querySelector(':scope > name').textContent.trim() : '';
    return `<div>&lt;${tag}&gt;${name ? ': <b>' + name + '</b>' : ''}</div>`;
  }).join('');

  list.innerHTML = selectedInfo;
}


document.addEventListener('mousedown', (e) => {
  // Try to find a code element under the mouse
  const codeElem = e.target.closest(hoverableSelector);
  if (codeElem) {
    // Attempt to collapse/expand if the element is collapsible
    const behaviors = getTagBehaviors(codeElem);
    if (behaviors.collapsible) {
      handleCollapseExpand(codeElem);
      e.preventDefault();
    }
  }
});

document.addEventListener('keydown', (e) => {
  
  if (!currentlyHoveredElem) return;

  const behaviors = getTagBehaviors(currentlyHoveredElem);
  
  // Handle shift + arrow keys for moving elements
 // if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
  if ((e.key === '[' || e.key === ']')) {
    e.preventDefault();
    
    // Use currently hovered element or fallback to selected element
    const elemToMove = currentlyHoveredElem || document.querySelector('.selected');
    if (elemToMove) {
      
      handleMoveElement(elemToMove, e.key);
    }
    return;
  }

  // Ignore if any modifier key is pressed (Cmd, Ctrl, Alt, Shift)
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

  // Escape key should always work, even if not hovering
  if (e.key.toLowerCase() === 'escape') {
    handleEscapeKey();
    return;
  }


  // Check if the hovered element is inside a function-container
  const functionContainer = currentlyHoveredElem.closest('.function-container');
  let tabContainer = null;

  if (functionContainer) {
    // Traverse up to the parent group and then find the sibling tab-container
    const group = functionContainer.closest('group[presentation="tabifyingView"]');
    if (group) {
      tabContainer = group.querySelector('.tab-container');
    }
  }

  if (tabContainer) {
    const tabs = Array.from(tabContainer.querySelectorAll('.tab'));
    const activeTab = tabContainer.querySelector('.tab.active');
    let activeIndex = tabs.indexOf(activeTab);

    if (e.key === 'ArrowLeft') {
      e.preventDefault(); // Prevent scrolling
      activeIndex = (activeIndex - 1 + tabs.length) % tabs.length; // Cycle backwards
      activateTab(tabs[activeIndex]);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); // Prevent scrolling
      activeIndex = (activeIndex + 1) % tabs.length; // Cycle forwards
      activateTab(tabs[activeIndex]);
    }
  }

  switch (e.key.toLowerCase()) {
    case 'd':
      handleCollapseExpand(currentlyHoveredElem);
      break;
    case 'f':
      handleSelect(currentlyHoveredElem);
      break;
    case 'e':
      handleInsertCodeElement();
      break;
    case 'r':
      handleEditName(currentlyHoveredElem);
      break;
    case 'backspace':
      handleDelete(currentlyHoveredElem);
      break;
    case 'tab':
      handleTabKey(e, currentlyHoveredElem, behaviors);
      break;
    case 'g':
      handleGroupUngroup();
      break;
    case 'v':
      handleChangeView();
      break;
    case 'h':
      handleCollapseExpandSubnodes(currentlyHoveredElem);
      break;
  }
});

/*
function handleMoveElement(elem, direction) {
  const parent = elem.parentNode;
  if (!parent) return;

  // Filter siblings based on draggable behavior using tagBehaviors.
  const siblings = Array.from(parent.children).filter(child => {
    if (child.nodeType !== 1) return false;
    const behaviors = getTagBehaviors(child);
    return behaviors.draggable;
  });

  const currentIndex = siblings.indexOf(elem);
  let targetElem;
  
  if (direction === '[' && currentIndex > 0) {
    targetElem = siblings[currentIndex - 1];
  } else if (direction === ']' && currentIndex < siblings.length - 1) {
    targetElem = siblings[currentIndex + 1];
  } else {
    return;
  }

  // Set up a fade-out transition on both elements.
  const fadeDuration = 100; // duration in ms
  elem.style.transition = `opacity ${fadeDuration}ms ease`;
  targetElem.style.transition = `opacity ${fadeDuration}ms ease`;
  
  // Fade both elements out.
  elem.style.opacity = '0.3';
  targetElem.style.opacity = '0.3';
  
  // When the fade-out transition ends, swap the elements and fade them in.
  const cleanup = () => {
    // Remove the listener so that subsequent transitions don't fire cleanup again.
    elem.removeEventListener('transitionend', cleanup);
    
    // Swap the DOM positions.
    if (direction === '[') {
      parent.insertBefore(elem, targetElem);
    } else {
      parent.insertBefore(targetElem, elem);
    }
    
    // Immediately remove the transition to avoid flickering (optional).
    elem.style.transition = '';
    targetElem.style.transition = '';
    
    // Fade back in.
    requestAnimationFrame(() => {
      elem.style.transition = `opacity ${fadeDuration}ms ease`;
      targetElem.style.transition = `opacity ${fadeDuration}ms ease`;
      elem.style.opacity = '1';
      targetElem.style.opacity = '1';
    });
    
    // After fade in is complete, clear the transition styles.
    setTimeout(() => {
      elem.style.transition = '';
      targetElem.style.transition = '';
      documentUIDidChange();
    }, fadeDuration);
  };
  
  // Use one of the element's transitionend event.
  elem.addEventListener('transitionend', cleanup);
}
*/

function handleMoveElement(elem, direction) {
  if (!elem) return;
  const parent = elem.parentNode;
  if (!parent) return;

  if (!parent.classList.contains('sortable-container')) return;

  const siblings = Array.from(parent.children).filter(child => {
    if (child.nodeType !== 1) return false;
    const behaviors = getTagBehaviors(child);
    return behaviors.draggable;
  });

  const currentIndex = siblings.indexOf(elem);
  let targetIndex = -1;

  if (direction === '[' && currentIndex > 0) {
    targetIndex = currentIndex - 1;
  } else if (direction === ']' && currentIndex < siblings.length - 1) {
    targetIndex = currentIndex + 1;
  } else {
    return;
  }

  const targetElem = siblings[targetIndex];

  // Animate the move
  elem.classList.add('moving-animate');
  elem.style.transform = `translateY(${direction === '[' ? '-24px' : '24px'})`;

  // Move in DOM after a short delay to allow the transform to show
  setTimeout(() => {
    elem.style.transform = '';
    if (direction === '[') {
      parent.insertBefore(elem, targetElem);
    } else {
      parent.insertBefore(targetElem, elem);
    }
    // Remove animation class after transition
    setTimeout(() => {
      elem.classList.remove('moving-animate');
    }, 250);
    if (typeof documentUIDidChange === 'function') {
      documentUIDidChange();
    }
  }, 50);
}


// Function Definitions

function handleEscapeKey() {
  const selected = document.querySelectorAll('.selected');
  if (selected.length) {
    selected.forEach(sel => sel.classList.remove('selected'));
  }

  // Update the key-command menu to reflect the cleared selection
  updateKeyCommandMenu(null);
}

function activateTab(tab) {
  // Hide all function wrappers.
  const tabContainer = tab.closest('.tab-container');
  const functionContainer = tabContainer.nextElementSibling;
  functionContainer.querySelectorAll('.function-wrapper').forEach(wrapper => {
    wrapper.style.display = 'none';
  });

  // Show the selected function wrapper.
  const index = tab.dataset.index;
  functionContainer.querySelectorAll('.function-wrapper')[index].style.display = 'block';

  // Update the active tab style.
  tabContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  documentUIDidChange();
}

function handleCollapseExpand(elem) {
  if (!elem) return;
  // Check if the element is collapsible according to tagBehaviors
  const behaviors = getTagBehaviors(elem);
  if (!behaviors.collapsible) return;

  // Find the first child named 'codebody' (case-insensitive)
  let codeBody = elem.querySelector(':scope > codebody');
  if (!codeBody) return;

  // Determine current state
  const isCollapsed = elem.getAttribute('collapsed') === 'true' || codeBody.style.display === 'none';

  // Animate and update attribute
  if (isCollapsed) {
    $(codeBody).stop(true, true).slideDown(125);
    elem.setAttribute('collapsed', 'false');
  } else {
    $(codeBody).stop(true, true).slideUp(125);
    elem.setAttribute('collapsed', 'true');
  }

  // After toggling collapsed attribute
const arrow = elem.querySelector(':scope > name > svg.visibilityArrow');
if (arrow) {
  if (elem.getAttribute('collapsed') === 'true') {
    arrow.style.transform = 'rotate(180deg)'; // left
  } else {
    arrow.style.transform = 'rotate(90deg)'; // down
  }
}

}
/*
function handleCollapseExpand(elem) {
  if (elem.matches('function')) {
    const codeBody = elem.querySelector('codeBody');
    const arrow = elem.querySelector('name > svg');
    if (codeBody) {
      const isCollapsed = codeBody.style.display === 'none' || codeBody.classList.contains('collapsing');
      if (isCollapsed) {
        // Expand with animation
        codeBody.style.display = 'block';
        codeBody.style.height = '0px';
        codeBody.style.overflow = 'hidden';
        const fullHeight = codeBody.scrollHeight;
        requestAnimationFrame(() => {
          codeBody.style.transition = 'height 0.25s cubic-bezier(.4,1.6,.6,1)';
          codeBody.style.height = fullHeight + 'px';
        });
        codeBody.addEventListener('transitionend', function expandEnd(e) {
          if (e.propertyName === 'height') {
            codeBody.style.height = '';
            codeBody.style.overflow = '';
            codeBody.style.transition = '';
            codeBody.classList.remove('collapsing');
            codeBody.removeEventListener('transitionend', expandEnd);
          }
        });
        if (arrow) arrow.style.transform = 'rotate(90deg)';
        elem.setAttribute('collapsed', 'false');
      } else {
        // Collapse with animation
        const fullHeight = codeBody.scrollHeight;
        codeBody.style.height = fullHeight + 'px';
        codeBody.style.overflow = 'hidden';
        codeBody.classList.add('collapsing');
        requestAnimationFrame(() => {
          codeBody.style.transition = 'height 0.25s cubic-bezier(.4,1.6,.6,1)';
          codeBody.style.height = '0px';
        });
        codeBody.addEventListener('transitionend', function collapseEnd(e) {
          if (e.propertyName === 'height') {
            codeBody.style.display = 'none';
            codeBody.style.height = '';
            codeBody.style.overflow = '';
            codeBody.style.transition = '';
            codeBody.classList.remove('collapsing');
            codeBody.removeEventListener('transitionend', collapseEnd);
          }
        });
        if (arrow) arrow.style.transform = 'rotate(180deg)';
        elem.setAttribute('collapsed', 'true');
      }
    }
  }
}
*/

function handleSelect(elem) {
  if (elem.tagName.toLowerCase() === 'codedocument') {
    // Deselect all elements if codeDocument is clicked
    document.querySelectorAll('.selected').forEach(sel => sel.classList.remove('selected'));
  } else {
    clearSelectionsNotAtSameLevel(elem);
    elem.classList.toggle('selected');
  }
  selectionDidChange();
  // Add drag-lock logic here if needed
}

function handleInsertCodeElement() {
  alert('Insert code element (not implemented)');
}

function handleEditName(elem) {
  const nameElem = elem.querySelector(':scope > name');
  if (nameElem) {
    const newName = prompt('Edit name/label:', nameElem.textContent.trim());
    if (newName !== null) nameElem.textContent = newName;
  }
}

function handleDelete(elem) {
  elem.remove();
}

function handleTabKey(e, elem, behaviors) {
  e.preventDefault();
  if (behaviors.selectable) {
    clearSelectionsNotAtSameLevel(elem);
    elem.classList.toggle('selected');
    selectionDidChange();
  } else {
    // If the cursor is over the codeDocument (but not a selectable element), clear selection
    const codeDoc = document.querySelector('codeDocument');
    if (codeDoc && codeDoc.contains(e.target)) {
      document.querySelectorAll('.selected').forEach(sel => sel.classList.remove('selected'));
    }
  }
}

function handleGroupUngroup() {
  alert('Group/Ungroup (not implemented)');
}

function handleChangeView() {
  alert('Change view (not implemented)');
}

function handleCollapseExpandSubnodes(elem) {
  if (elem) {
    const subnodes = elem.querySelectorAll(':scope > function, :scope > group');
    if (subnodes.length) {
      const shouldCollapse = !subnodes[0].classList.contains('collapsed');
      subnodes.forEach(child => {
        if (shouldCollapse) {
          child.classList.add('collapsed');
          child.classList.remove('expanded');
          const codeBody = child.querySelector('codeBody');
          if (codeBody) codeBody.style.display = 'none';
        } else {
          child.classList.remove('collapsed');
          child.classList.add('expanded');
          const codeBody = child.querySelector('codeBody');
          if (codeBody) codeBody.style.display = 'block';
        }
      });
    }
  }
}


// Function to clear selections that are not at the same level as the target element
function clearSelectionsNotAtSameLevel(targetElem) {
  if (!targetElem) return;

  const elementType = targetElem.tagName.toLowerCase();

  document.querySelectorAll('.selected').forEach(sel => {
    if (sel === targetElem) return; // Skip the target element itself

    const selElementType = sel.tagName.toLowerCase();

    // If the selected element is of the same type
    if (selElementType === elementType) {
      // Check if one is a parent of the other
      if (targetElem.contains(sel) || sel.contains(targetElem)) {
        // If they are parent and child, deselect the other one
        sel.classList.remove('selected');
      }
    } else {
      // If the selected element is of a different type, and not at the same level, deselect it
      if (sel.parentElement !== targetElem.parentElement) {
        sel.classList.remove('selected');
      }
    }
  });
}

// Function to update the key command menu based on the currently hovered element
// Function to update the key command menu based on the currently hovered element
function updateKeyCommandMenu(elem) {
  const list = document.getElementById('key-command-list');
  const menu = document.getElementById('key-command-menu');
  menu.querySelector('.key-command-persistent')?.remove();

  const behaviors = getTagBehaviors(elem);

  if (!elem || !behaviors.hoverable) {
    list.innerHTML = "<em>Hover over a code element</em>";
    menu.querySelector('.key-command-header')?.remove();
    addPersistentMenuArea();
    return;
  }

  // Get tag and name (if present)
  const tag = elem.tagName ? elem.tagName.toLowerCase() : elem.nodeName.toLowerCase();
  let name = elem.querySelector(':scope > name') ? elem.querySelector(':scope > name').textContent.trim() : '';
  if (name) name = `: <br/><b>${name}</b>`;

  // Check if the hovered element is inside a function-container
  const functionContainer = elem.closest('.function-container');
  let commands = [];
  

  if (functionContainer) {
    commands.push("<kbd>Left/Right Arrows</kbd> - Cycle Tabs");
  }


  // Build commands based on behaviors
  if (behaviors.selectable) {
    commands.push("<kbd>Tab</kbd> - Select");
   // commands.push("<kbd>F</kbd> - Select &amp; Drag-lock");
  }
  if (behaviors.collapsible)
  {
    commands.push("<kbd>D</kbd> - Collapse/Expand");
  }

  // Add move commands if element is moveable
  if (behaviors.draggable) {
    commands.push("<kbd>[ or ]</kbd> - <span class=\"hoveredText\">Move Up/Down Obj</span>");  // Updated shortcut display
  }

  if (behaviors.draggable) {
  //  commands.push("<kbd>F</kbd> - Drag-lock");
  }
  
  commands.push("<kbd>E</kbd> - Insert code element");
  commands.push("<kbd>R</kbd> - Edit name/label");
  commands.push("<kbd>Backspace</kbd> - Delete");
  commands.push("<kbd>G</kbd> - Group/Ungroup");
  commands.push("<kbd>V</kbd> - Change view");
  commands.push("<kbd>H</kbd> - Collapse/Expand subnodes");

  list.innerHTML = commands.join("<br>");

  addPersistentMenuArea();

  function addPersistentMenuArea() {
    // Add persistent command at the bottom if something is selected
    const selected = document.querySelectorAll('.selected');
    if (selected.length) {
      const persistent = document.createElement('div');
      persistent.className = 'key-command-persistent';
      persistent.style = "margin-top:14px; color:#ffe082; font-weight:bold; border-top:1px solid #444; padding-top:8px;";
      persistent.innerHTML = `<b>Esc</b> - Deselect All (${selected.length} selected)`;
      menu.appendChild(persistent);
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('function, class').forEach(funcElem => {
    const nameElem = funcElem.querySelector(':scope > name');
    if (!nameElem) return; // Skip if there's no name

    // Create a NEW SVG arrow for each function
    const svgNS = "http://www.w3.org/2000/svg";
    const arrow = document.createElementNS(svgNS, 'svg');
    arrow.classList.add('visibilityArrow');
    arrow.setAttribute('width', '24');
    arrow.setAttribute('height', '24');
    arrow.setAttribute('viewBox', '0 0 16 16');
    arrow.style.transition = 'transform 0.3s ease';
    arrow.style.marginLeft = '8px';
    arrow.style.verticalAlign = 'middle';

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M6 4l4 4-4 4z');
    path.setAttribute('fill', '#eee');
    arrow.appendChild(path);

    const codeBody = funcElem.querySelector('codeBody');
    if (funcElem.getAttribute('collapsed') === 'true') {
      arrow.style.transform = 'rotate(180deg)';
      if (codeBody) codeBody.style.display = 'none';
    } else {
      arrow.style.transform = 'rotate(90deg)';
    }

    nameElem.appendChild(arrow);

    
  });
});


          // Function to adjust the height of the function-container to match the tallest <function> element.
  function adjustFunctionContainerHeight(functionContainer) {
  //console.log("adjustFunctionContainerHeight called for:", functionContainer);
  // Query for all <function> elements inside the functionContainer.
  const functions = functionContainer.querySelectorAll('function');
  //console.log("Number of <function> elements found:", functions.length);
  let maxHeight = 0;
  
  functions.forEach(funcElem => {
    // Log the current computed display for the <function> element.
    const currentDisplay = window.getComputedStyle(funcElem).display;
    //console.log("Current display for function:", currentDisplay, funcElem);
    
    // Temporarily force the function element to be visible for measurement.
    funcElem.style.display = 'block';
    funcElem.style.visibility = 'hidden';
    funcElem.style.position = 'absolute';
    
    // Use scrollHeight to capture the full height of the <function> element.
    const height = funcElem.scrollHeight;
    //console.log("Measured height for function using scrollHeight:", height, funcElem);
    if (height > maxHeight) {
      maxHeight = height;
    }
    
    // Restore the original display state.
    if (currentDisplay === 'none') {
      funcElem.style.display = 'none';
      //console.log("Restored display to 'none' for function:", funcElem);
    } else {
      funcElem.style.display = '';
    }
    funcElem.style.visibility = '';
    funcElem.style.position = '';
  });
  
  //console.log("Tallest measured height:", maxHeight);
  functionContainer.style.height = `${maxHeight + 5}pt`;
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('group[presentation="tabifyingView"]').forEach(group => {
    const functionContainer = group.querySelector('.function-container');
    if (functionContainer) {
      //adjustFunctionContainerHeight(functionContainer);
    }
  });
});

function documentUIDidChange() {
  
  document.querySelectorAll('group[presentation="tabifyingView"]').forEach(group => {
    const functionContainer = group.querySelector('.function-container');
    if (functionContainer) {
    //  adjustFunctionContainerHeight(functionContainer);
    }
  });
}

       document.addEventListener('DOMContentLoaded', () => {
  // Observe changes to the codeDocument element: trigger documentDidChange on mutations.
  const codeDoc = document.querySelector('codeDocument');
  if (codeDoc) {
    const observer = new MutationObserver(() => {
      documentUIDidChange();
      });
    observer.observe(codeDoc, { childList: true, subtree: true, characterData: true });
  }

  
  // Process each group element that should use the tabifyingView presentation.
  document.querySelectorAll('group[presentation="tabifyingView"]').forEach(group => {
    // Gather all immediate function subnodes in the group.
    const functions = group.querySelectorAll(':scope > function');
    if (functions.length > 0) {
      // Create a container to hold the tabs.
      const tabContainer = document.createElement('div');
      tabContainer.className = 'tab-container';

      // Create a container to hold the function views.
      const functionContainer = document.createElement('div');
      functionContainer.className = 'function-container';

      // Create a tab for each function.
      functions.forEach((funcElem, index) => {
        const tab = document.createElement('div');
        tab.className = 'tab';
        // Use the text from the <name> element as the tab label. Fallback if not found.
        const nameElem = funcElem.querySelector(':scope > name');
        tab.textContent = (nameElem && nameElem.textContent.trim()) || `Function ${index + 1}`;
        tab.dataset.index = index;

        // Wrap the function in a separate container.
        const funcWrapper = document.createElement('div');
        funcWrapper.className = 'function-wrapper';
        funcWrapper.style.display = index === 0 ? 'block' : 'none'; // Show only the first function by default.
        funcWrapper.appendChild(funcElem);

        // Add the function wrapper to the function container.
        functionContainer.appendChild(funcWrapper);

        // Activate the corresponding function on hover.
        tab.addEventListener('mouseover', () => {
          // Hide all function wrappers.
          functionContainer.querySelectorAll('.function-wrapper').forEach(wrapper => {
            wrapper.style.display = 'none';
          });

          // Show the selected function wrapper.
          funcWrapper.style.display = 'block';

          // Update the active tab style.
          tabContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          documentUIDidChange();
        });

        tabContainer.appendChild(tab);
      });

      // Insert the tab container and function container into the group.
      group.insertBefore(tabContainer, group.firstChild);
      group.appendChild(functionContainer);

       // On page load, set the first tab as active.
       const firstTab = tabContainer.querySelector('.tab');
      if (firstTab) {
        firstTab.classList.add('active');
      }

      
    }
  });
});


class GuiButton extends HTMLElement {
  constructor() {
    super(); // Always call super() first in the constructor.

    // Attach a shadow DOM to encapsulate styles and behavior.
    this.attachShadow({ mode: 'open' });

    // Define the template for the custom element.
    this.shadowRoot.innerHTML = `
      <style>
        /* Custom styles for guibutton */
        :host {
          display: inline-block;
          padding: 8px 12px;
          font-size: 14pt;
          font-family:monospace;
          cursor: pointer;
          background-color:rgb(64, 63, 59);
          color: rgb(202, 89, 89);
          border: none;
          border-radius: 4px;
        }

        :host(:hover) {
          background-color: #367C39;
        }

        button {
          font-size: inherit;
          padding: inherit;
          border: none;
          background: none;
          color: inherit;
          cursor: pointer;
        }
      </style>
      <button><slot></slot></button>
    `;

    this.button = this.shadowRoot.querySelector('button');
    this.button.addEventListener('click', () => {
      this.dispatchEvent(new Event('guibutton-click', { bubbles: true, composed: true }));
    });
  }

  connectedCallback() {
    // Called when the element is inserted into the DOM.
   // console.log('GuiButton added to the DOM');
  }

  disconnectedCallback() {
    // Called when the element is removed from the DOM.
    console.log('GuiButton removed from the DOM');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Called when an attribute is changed, appended, removed, or replaced on the element.
    console.log(`Attribute ${name} has changed from ${oldValue} to ${newValue}`);
  }

  static get observedAttributes() {
    // Specify attributes to be observed.
    return [];
  }
}
customElements.define('gui-button', GuiButton);


// Function to generate an SVG pattern
// Function to generate an SVG pattern with an optional lineAngle parameter
/*function generatePattern(type, options = {}) {
  const {
    color = '#000',
    strokeWidth = 2,
    spacing = 10,
    dashArray = '',
    radius = 2,
    lineAngle = 45, // Default angle for diagonal lines
  } = options;

  let svgContent = '';

  switch (type) {
    case 'diagonal-solid':
      svgContent = `
        <line x1="0" y1="${spacing}" x2="${spacing}" y2="0" 
          stroke="${color}" stroke-width="${strokeWidth}" />
      `;
      break;

    case 'diagonal-dashed':
      svgContent = `
        <line x1="0" y1="${spacing}" x2="${spacing}" y2="0" 
          stroke="${color}" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray}" />
      `;
      break;

    case 'dotted':
      svgContent = `
        <circle cx="${spacing / 2}" cy="${spacing / 2}" r="${radius}" fill="${color}" />
      `;
      break;

    case 'cross-hatch':
      svgContent = `
        <line x1="0" y1="${spacing}" x2="${spacing}" y2="0" 
          stroke="${color}" stroke-width="${strokeWidth}" />
        <line x1="0" y1="0" x2="${spacing}" y2="${spacing}" 
          stroke="${color}" stroke-width="${strokeWidth}" />
      `;
      break;

    default:
      console.error('Unknown pattern type:', type);
      return '';
  }

  // Apply rotation transform if lineAngle is specified
  const rotation = lineAngle !== 45 ? `transform="rotate(${lineAngle} ${spacing / 2} ${spacing / 2})"` : '';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${spacing}" height="${spacing}" viewBox="0 0 ${spacing} ${spacing}">
      <g ${rotation}>
        ${svgContent}
      </g>
    </svg>
  `;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}


// Function to apply patterns to elements based on their tag
function applyPatternToElement(elem) {
  const tag = elem.tagName.toLowerCase();

  switch (tag) {
    case 'codedocument':
      elem.style.backgroundImage = generatePattern('diagonal-solid', {
        color: '#000',
        strokeWidth: 1,
        spacing: 3,
      });
      break;

      

    case 'group':
      elem.style.backgroundImage = generatePattern('dotted', {
        color: '#bdbdbd',
        spacing: 3,
        radius: 1,
        
      });
      break;

     
    case 'function':
      elem.style.backgroundImage = generatePattern('diagonal-solid', {
        color: 'rgb(155,155,155,0.4)',
        strokeWidth: 1,
        spacing: 5,
        dashArray: '3,4',
        
      });
      break;

    

    default:
      // No pattern for other tags
      break;
  }
}

// Apply patterns to existing elements on page load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('codedocument, group, return, function, class').forEach(applyPatternToElement);
});

// Observe the document for dynamically added elements
const observer = new MutationObserver((mutationsList) => {
  mutationsList.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // Apply pattern to the newly added element
        applyPatternToElement(node);
      }
    });
  });
});

// Start observing the document
observer.observe(document.body, { childList: true, subtree: true });

*/

function setCustomCursor(state) {
  const root = document.documentElement;
  switch (state) {
    case 'crosshair':
      root.style.cursor = "var(--crosshair-cursor)";
      break;
    case 'pointer':
      root.style.cursor = "pointer";
      break;
    case 'move':
      root.style.cursor = "move";
      break;
    // Add more states as needed
    default:
      root.style.cursor = "var(--crosshair-cursor)";
  }
}

// Set to crosshair (default)
//setCustomCursor('crosshair');

// Set to pointer on hover over a button
/*document.addEventListener('mouseover', (e) => {
  if (e.target.matches('guiArea button')) {
    setCustomCursor('pointer');
  }
});
document.addEventListener('mouseout', (e) => {
  if (e.target.matches('guiArea button')) {
    setCustomCursor('crosshair');
  }
});

*/


function setCrosshairCursor(size = 35, color = 'black', strokeWidth = 2, shadowColor = 'rgba(0,0,0,0.25)', shadowOffset = 2) {
  const half = size / 2;
  // Draw shadow lines first, then main lines
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
    <line x1='${half + shadowOffset}' y1='${0 + shadowOffset}' x2='${half + shadowOffset}' y2='${size + shadowOffset}' stroke='${shadowColor}' stroke-width='${strokeWidth + 1}'/>
    <line x1='${0 + shadowOffset}' y1='${half + shadowOffset}' x2='${size + shadowOffset}' y2='${half + shadowOffset}' stroke='${shadowColor}' stroke-width='${strokeWidth + 1}'/>
    <line x1='${half}' y1='0' x2='${half}' y2='${size}' stroke='${color}' stroke-width='${strokeWidth}'/>
    <line x1='0' y1='${half}' x2='${size}' y2='${half}' stroke='${color}' stroke-width='${strokeWidth}'/>
  </svg>`;
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${half} ${half}, crosshair`;
  document.documentElement.style.setProperty('--crosshair-cursor', url);
}

// Example usage:
setCrosshairCursor(35, 'black', 2, 'rgba(0,0,0,0.25)', 2); // black crosshair with a subtle shadow
setCrosshairCursor(65, 'blue', 3, 'rgba(193, 193, 228, 0.55)', 2); // blue crosshair with blue shadow