const tagBehaviors = {
  'codedocument': { hoverable: true, selectable: false, draggable: false, pasteboardCopyable: false, collapsible: false },
  'function':      { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true },
  'class':         { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true},
  'group':         { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true },
  'constructors':      { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true },
  'variable':      { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: true },
  'statement':     { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
  'functioncall':  { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
  'parameter':     { hoverable: true, selectable: false, draggable: true, pasteboardCopyable: true, collapsible: false },
  'codebody':      { hoverable: false, selectable: false, draggable: true, pasteboardCopyable: true, collapsible: false },
  'return':    { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
  'expression': { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
  'operator': { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
  'literal': { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
  'gui-button': { hoverable: true, selectable: true, draggable: true, pasteboardCopyable: true, collapsible: false },
  // Add more as 
};


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
      handleCollapseExpandChildren(currentlyHoveredElem);
      break;
  }
});

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

  /*
  // ---  trailing outline rectangles effect ---
  const rect = elem.getBoundingClientRect();
  const outlines = [];
  const outlineCount = 4;
  const outlineDelay = 30; // ms between outlines

  for (let i = 0; i < outlineCount; i++) {
    const outline = document.createElement('div');
    outline.className = 'mac-trail-outline';
    outline.style.top = `${rect.top + window.scrollY}px`;
    outline.style.left = `${rect.left + window.scrollX}px`;
    outline.style.width = `${rect.width}px`;
    outline.style.height = `${rect.height}px`;
    outline.style.opacity = `${1 - i * 0.2}`;
    outline.style.transition = `top 200ms cubic-bezier(.4,1.6,.6,1), left 200ms cubic-bezier(.4,1.6,.6,1), opacity 200ms linear`;
    outline.style.position = 'absolute';
    outline.style.pointerEvents = 'none';
    outline.style.zIndex = 9999;
    document.body.appendChild(outline);
    outlines.push(outline);
  }*/

  // Fade out both elements
  const fadeDuration = 100;
  elem.style.transition = `opacity ${fadeDuration}ms ease`;
  targetElem.style.transition = `opacity ${fadeDuration}ms ease`;
  elem.style.opacity = '0.3';
  targetElem.style.opacity = '0.3';

  // Animate outlines trailing to the new position
  const targetRect = targetElem.getBoundingClientRect();
  setTimeout(() => {
    outlines.forEach((outline, i) => {
      setTimeout(() => {
        outline.style.top = `${targetRect.top + window.scrollY}px`;
        outline.style.left = `${targetRect.left + window.scrollX}px`;
        outline.style.opacity = '0';
      }, i * outlineDelay);
    });
  }, fadeDuration);

  // Cleanup after fade out and move
  const cleanup = () => {
    elem.removeEventListener('transitionend', cleanup);

    // Swap the DOM positions.
    if (direction === '[') {
      parent.insertBefore(elem, targetElem);
    } else {
      parent.insertBefore(targetElem, elem);
    }

    elem.style.transition = '';
    targetElem.style.transition = '';

    // Fade back in.
    requestAnimationFrame(() => {
      elem.style.transition = `opacity ${fadeDuration}ms ease`;
      targetElem.style.transition = `opacity ${fadeDuration}ms ease`;
      elem.style.opacity = '1';
      targetElem.style.opacity = '1';
    });

    // Remove outlines after animation
    setTimeout(() => {
      outlines.forEach(outline => outline.remove());
      elem.style.transition = '';
      targetElem.style.transition = '';
      documentUIDidChange();
    }, fadeDuration + outlineCount * outlineDelay + 100);
  };

  elem.addEventListener('transitionend', cleanup);
}


// Function Definitions

function handleEscapeKey() {
  const selected = document.querySelectorAll('.selected');
  if (selected.length) {
    selected.forEach(sel => sel.classList.remove('selected'));
  }
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
  if (elem.matches('function')) {
    const codeBody = elem.querySelector('codeBody');
    if (codeBody) {
      const isCollapsed = codeBody.style.display === 'none';
      codeBody.style.display = isCollapsed ? 'block' : 'none';
    }
  }
}

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

function handleCollapseExpandChildren(elem) {
  if (elem) {
    const children = elem.querySelectorAll(':scope > function, :scope > group');
    if (children.length) {
      const shouldCollapse = !children[0].classList.contains('collapsed');
      children.forEach(child => {
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
  
  // Add move commands if element is moveable
  if (behaviors.draggable) {
    commands.push("<kbd>[ or ]</kbd> - Move Up/Down");  // Updated shortcut display
  }

  if (functionContainer) {
    commands.push("<kbd>Left/Right Arrows</kbd> - Cycle Tabs");
  }


  // Build commands based on behaviors
  if (behaviors.selectable) {
    commands.push("<kbd>Tab</kbd> - Select");
    commands.push("<kbd>F</kbd> - Select &amp; Drag-lock");
  }
  if (behaviors.draggable) {
    commands.push("<kbd>F</kbd> - Drag-lock");
  }
  commands.push("<kbd>D</kbd> - Collapse/Expand");
  commands.push("<kbd>E</kbd> - Insert code element");
  commands.push("<kbd>R</kbd> - Edit name/label");
  commands.push("<kbd>Backspace</kbd> - Delete");
  commands.push("<kbd>G</kbd> - Group/Ungroup");
  commands.push("<kbd>V</kbd> - Change view");
  commands.push("<kbd>H</kbd> - Collapse/Expand Children");

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
  document.querySelectorAll('function').forEach(funcElem => {
    const nameElem = funcElem.querySelector(':scope > name');
    if (!nameElem) return; // Skip if there's no name

    // Create a NEW SVG arrow for each function
    const svgNS = "http://www.w3.org/2000/svg";
    const arrow = document.createElementNS(svgNS, 'svg');
    arrow.setAttribute('width', '24');
    arrow.setAttribute('height', '24');
    arrow.setAttribute('viewBox', '0 0 16 16');
    arrow.style.transition = 'transform 0.3s ease';
    arrow.style.marginLeft = '8px';
    arrow.style.verticalAlign = 'middle';

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M6 4l4 4-4 4z');
    path.setAttribute('fill', '#000');
    arrow.appendChild(path);

    const codeBody = funcElem.querySelector('codeBody');
    if (funcElem.getAttribute('collapsed') === 'true') {
      arrow.style.transform = 'rotate(180deg)';
      if (codeBody) codeBody.style.display = 'none';
    } else {
      arrow.style.transform = 'rotate(90deg)';
    }

    nameElem.appendChild(arrow);

    nameElem.addEventListener('click', () => {
      if (!codeBody) return;
      if (codeBody.style.display === 'none') {
        codeBody.style.display = 'block';
        arrow.style.transform = 'rotate(90deg)';
        funcElem.setAttribute('collapsed', 'false');
      } else {
        codeBody.style.display = 'none';
        arrow.style.transform = 'rotate(180deg)';
        funcElem.setAttribute('collapsed', 'true');
      }
      documentUIDidChange
    });
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
      adjustFunctionContainerHeight(functionContainer);
    }
  });
});

function documentUIDidChange() {
  
  document.querySelectorAll('group[presentation="tabifyingView"]').forEach(group => {
    const functionContainer = group.querySelector('.function-container');
    if (functionContainer) {
      adjustFunctionContainerHeight(functionContainer);
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
    // Gather all immediate function children in the group.
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
          background-color:rgb(247, 198, 39);
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
