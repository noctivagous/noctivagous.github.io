


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




function toggleSubnodes(elem) {
  const subnodes = Array.from(elem.children).filter(child => {
    const tagName = child.tagName.toLowerCase();
    return tagName === 'function' || tagName === 'method' || tagName === 'variable'; // Add other subnode types if needed
  });

  if (subnodes.length > 0) {
    const shouldCollapse = !subnodes[0].classList.contains('collapsed'); // Check the state of the first subnode

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