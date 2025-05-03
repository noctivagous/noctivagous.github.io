let bracketDragSource = null; // The element(s) being dragged
let bracketDragLine = null;   // The SVG or canvas line element

// Track mouse position globally
window.mouseX = 0;
window.mouseY = 0;

document.addEventListener('mousemove', (e) => {
  window.mouseX = e.clientX + window.scrollX; // Include scroll offset for accurate positioning
  window.mouseY = e.clientY + window.scrollY;
});



let currentlyHoveredElem = null;

class CodeEditorStateSet {
    constructor() {
      this.states = {};
    }
  
    // Set a state to true or false
    setState(stateName, value) {
      this.states[stateName] = value;
      this.onStateChange(stateName, value);
    }
  
    // Get the current value of a state
    getState(stateName) {
      return this.states[stateName] || false;
    }
  
    // Toggle a state (true -> false, false -> true)
    toggleState(stateName) {
      const newValue = !this.getState(stateName);
      this.setState(stateName, newValue);
      return newValue;
    }
  
    // Hook for state change (can be overridden)
    onStateChange(stateName, value) {
      console.log(`State "${stateName}" changed to: ${value}`);
    }
  }

  const keyCommandsStateSet = new CodeEditorStateSet();

// Define initial states
keyCommandsStateSet.setState('insertionAllowed', true);
keyCommandsStateSet.setState('selectionActive', false);
keyCommandsStateSet.setState('dragging', false);
keyCommandsStateSet.setState('editing', false);
keyCommandsStateSet.setState('grouping', false);
keyCommandsStateSet.setState('bracketDragging', false);



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

let pendingInsert = null;

document.addEventListener('keydown', (e) => {
  
  if (!currentlyHoveredElem) return;

  const behaviors = getTagBehaviors(currentlyHoveredElem);
  
  // Handle shift + arrow keys for moving elements
 // if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {

    if ((e.key === '[' || e.key === ']')) {
        e.preventDefault();
      
        let selected = Array.from(document.querySelectorAll('.selected'));
        let elemToMove;
      
        if (selected.length > 1) {
          // Only move if all selected have the same parent and are contiguous
          const parent = selected[0].parentNode;
          const allSameParent = selected.every(el => el.parentNode === parent);
          const siblings = Array.from(parent.children).filter(child => child.nodeType === 1 && getTagBehaviors(child).draggable);
          const indices = selected.map(el => siblings.indexOf(el)).sort((a, b) => a - b);
          const contiguous = indices.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1);
      
          if (allSameParent && contiguous) {
            elemToMove = selected;
          } else {
            // Not contiguous or not same parent: do nothing or show warning
            return;
          }
        } else if (selected.length === 1) {
          elemToMove = selected[0];
        } else {
          elemToMove = currentlyHoveredElem;
        }
      
        if (elemToMove) {
          handleMoveElement(elemToMove, e.key);
        }
        return;
      }


   // Insert menu logic
   if (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'v') {
    e.preventDefault();
    pendingInsert = {
      position: e.key.toLowerCase() === 'c' ? 'before' : 'after',
      target: currentlyHoveredElem
    };
    
    showInsertMenu(e); // Show your custom insert menu UI here
    return;
  }



  // If insert menu is active, handle secondary key
  if (pendingInsert) {
    if (e.key.toLowerCase() === 'f') {
      insertCodeElement('function', pendingInsert.position, pendingInsert.target);
      pendingInsert = null;
      hideInsertMenu();
      return;
    }
    if (e.key.toLowerCase() === 'i') {
      insertCodeElement('integer', pendingInsert.position, pendingInsert.target);
      pendingInsert = null;
      hideInsertMenu();
      return;
    }
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
      /*
      case 'f':
        
        if (!keyCommandsStateSet.getState('bracketDragging')) {
          startBracketDrag();
        } else {
          finishBracketDrag();
        }
        break;*/
     case 'h':
        if (currentlyHoveredElem) {
            toggleSubnodes(currentlyHoveredElem);
          }
          break;
    case 'e':
      handleInsertCodeElementInside();
      break;
    case 'r':
      handleEditName(currentlyHoveredElem);
      break;
    case 'backspace':
      handleDelete(currentlyHoveredElem);
      break;
    case 'delete':
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


// Example insert function
function insertCodeElement(type, position, refElem) {
    let newElem;
    if (type === 'function') {
      newElem = document.createElement('function');
      newElem.innerHTML = '<name>New Function</name><codebody></codebody>';
    } else if (type === 'integer') {
      newElem = document.createElement('variable');
      newElem.innerHTML = '<type><typeName>int</typeName></type><name>newInt</name>';
    }
  
    if (position === 'before') {
      refElem.parentNode.insertBefore(newElem, refElem);
    } else if (position === 'after') {
      refElem.parentNode.insertBefore(newElem, refElem.nextSibling);
    } else if (position === 'inside') {
      refElem.appendChild(newElem);
    }
  
    documentUIDidChange && documentUIDidChange();
  }
  
  function handleMoveElement(elem, direction) {
    if (!elem) return;
    const parent = elem.parentNode;
    if (!parent) return;
  
    // Allow move if parent is .sortable-container, codebody, or statement
    const parentTag = parent.tagName ? parent.tagName.toLowerCase() : '';
    if (
      !parent.classList.contains('sortable-container') &&
      parentTag !== 'codebody' &&
      parentTag !== 'statement'
    ) return;
  
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
  
    setTimeout(() => {
      elem.style.transform = '';
      if (direction === '[') {
        parent.insertBefore(elem, targetElem);
      } else {
        parent.insertBefore(targetElem, elem);
      }
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

  if (keyCommandsStateSet.getState('bracketDragging')) {
    cancelBracketDrag();
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

function handleInsertCodeElementInside() {
  
  // Handle 'E' key for inserting inside the codebody
  
    const codeBody = currentlyHoveredElem.querySelector(':scope > codebody');
    if (codeBody) {
      // Expand the element if it is collapsed
      if (currentlyHoveredElem.getAttribute('collapsed') === 'true') {
        handleCollapseExpand(currentlyHoveredElem);
      }

      // Insert a new code element inside the codebody
      insertCodeElement('function', 'inside', codeBody);
    }
  


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
      commands.push("<kbd>Tab</kbd><!--/<kbd>F</kbd>--> - Select");
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
    

    if (keyCommandsStateSet.getState('insertionAllowed')) 
        {

    commands.push("<hr/>");
    commands.push("Insert Code Element:");
    commands.push("<kbd>C</kbd> - Before");
    commands.push("<kbd>V</kbd> - After");
    commands.push("<kbd>E</kbd> - Inside");
    commands.push("<hr/>");
    }

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
  



/*
  Show Insert Menu: Renders a floating menu near the hovered element for code insertion.
  Call showInsertMenu() to display, and hideInsertMenu() to remove.
*/
function showInsertMenu() {
    hideInsertMenu(); // Remove any existing menu
  
    // Find the hovered element
    const refElem = currentlyHoveredElem;
    if (!refElem) return;
  
    // Sample elements to insert (extend as needed)
    const insertOptions = [
      { type: 'function', label: 'Function', shortcut: 'F' },
      { type: 'variable', label: 'Integer Variable', shortcut: 'I' },
      { type: 'loop', label: 'Loop', shortcut: 'L' },
      { type: 'conditional', label: 'If/Else', shortcut: 'C' }
    ];
  
    // Create menu container
    const menu = document.createElement('div');
    menu.id = 'insert-menu';
    menu.style.position = 'absolute';
    menu.style.zIndex = 10000;
    menu.style.background = '#222';
    menu.style.color = '#ffe082';
    menu.style.border = '2px solid #986300';
    menu.style.borderRadius = '8px';
    menu.style.padding = '10px 18px';
    menu.style.boxShadow = '0 4px 24px #000a';
    menu.style.fontFamily = 'monospace';
    menu.style.fontSize = '15px';
    menu.style.minWidth = '180px';
  
    // Position menu at the cursor's location (origin of the crosshair)
    menu.style.top = `${window.mouseY}px`;
    menu.style.left = `${window.mouseX}px`;
  
    // Build menu HTML
    menu.innerHTML = `
      <div style="font-weight:bold; margin-bottom:8px;">Insert Code Element</div>
      ${insertOptions.map(opt =>
        `<div class="insert-menu-item" data-type="${opt.type}" style="margin:6px 0;cursor:pointer;">
          <kbd>${opt.shortcut}</kbd> - ${opt.label}
        </div>`
      ).join('')}
      <div style="margin-top:10px; color:#888; font-size:12px;">Press key or click to insert</div>
    `;
  
    // Click handler for menu items
    menu.addEventListener('click', function(e) {
      const item = e.target.closest('.insert-menu-item');
      if (item) {
        window.insertCodeElement && window.insertCodeElement(item.dataset.type, window.pendingInsert?.position, window.pendingInsert?.target);
        window.pendingInsert = null;
        hideInsertMenu();
      }
    });
  
    // Keyboard handler for menu shortcuts
    function keyHandler(e) {
      const key = e.key.toUpperCase();
      const found = insertOptions.find(opt => opt.shortcut === key);
      if (found) {
        window.insertCodeElement && window.insertCodeElement(found.type, window.pendingInsert?.position, window.pendingInsert?.target);
        window.pendingInsert = null;
        hideInsertMenu();
        e.preventDefault();
      }
      if (e.key === "Escape") {
        hideInsertMenu();
        window.pendingInsert = null;
      }
    }
    document.addEventListener('keydown', keyHandler, { once: true });
  
    document.body.appendChild(menu);
    window._insertMenuKeyHandler = keyHandler;
  }
  // Remove the insert menu from the DOM
  function hideInsertMenu() {
    const menu = document.getElementById('insert-menu');
    if (menu) menu.remove();
    if (window._insertMenuKeyHandler) {
      document.removeEventListener('keydown', window._insertMenuKeyHandler, { once: true });
      window._insertMenuKeyHandler = null;
    }
  }


  function startBracketDrag() {
  keyCommandsStateSet.setState('bracketDragging', true);
  const selected = Array.from(document.querySelectorAll('.selected'));
  if (selected.length > 0) {
    bracketDragSource = selected;
  } else {
    bracketDragSource = currentlyHoveredElem;
  }
  drawBracketLine();
  document.body.style.cursor = 'crosshair';
}
  
function finishBracketDrag() {
    keyCommandsStateSet.setState('bracketDragging', false);
    if (bracketDragSource && currentlyHoveredElem && currentlyHoveredElem !== bracketDragSource) {
      if (Array.isArray(bracketDragSource)) {
        // Insert all selected after the hovered element, in order
        const parent = currentlyHoveredElem.parentNode;
        let ref = currentlyHoveredElem.nextSibling;
        bracketDragSource.forEach(elem => {
          parent.insertBefore(elem, ref);
        });
      } else {
        currentlyHoveredElem.parentNode.insertBefore(bracketDragSource, currentlyHoveredElem.nextSibling);
      }
    }
    removeBracketLine();
    bracketDragSource = null;
    document.body.style.cursor = '';
  }
  
  function cancelBracketDrag() {
    keyCommandsStateSet.setState('bracketDragging', false);
    removeBracketLine();
    bracketDragSource = null;
    document.body.style.cursor = '';
  }
  function drawBracketLine() {
    removeBracketLine();
    if (!bracketDragSource) {
      console.log("drawBracketLine: No bracketDragSource, aborting.");
      return;
    }
    // Get bounding rect of source
    const rect = bracketDragSource.getBoundingClientRect();
    console.log("drawBracketLine: Source rect", rect);
  
    // Create SVG line
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "fixed";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = 99999;
    svg.width = window.innerWidth;
    svg.height = window.innerHeight;
    svg.id = "bracket-drag-line";
  
    // Bracket start: right edge, vertical center of source
    const x1 = rect.right;
    const y1 = rect.top + rect.height / 2;
    // Bracket end: mouse position
    const x2 = window.mouseX;
    const y2 = window.mouseY;
    console.log(`drawBracketLine: Start (${x1}, ${y1}), End (${x2}, ${y2})`);
  
    // Draw a bracket-like path
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke", "#ffe082");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("fill", "none");
    path.setAttribute("d", `M${x1},${y1} L${x1+24},${y1} L${x2-24},${y2} L${x2},${y2}`);
  
    svg.appendChild(path);
    svg.style.zIndex = 99999;
    document.body.appendChild(svg);
    bracketDragLine = svg;
  
    console.log("drawBracketLine: SVG appended to DOM", svg);
  }
  
  // Remove the bracket line
  function removeBracketLine() {
    if (bracketDragLine) {
      bracketDragLine.remove();
      bracketDragLine = null;
    }
  }

  document.addEventListener('mousemove', () => {
    if (keyCommandsStateSet.getState('bracketDragging')) {
      drawBracketLine();
    }
  });