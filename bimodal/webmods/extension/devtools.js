/**
 * KeyPilot DevTools Panel
 * Provides debugging interface in Chrome DevTools
 */

// Create KeyPilot panel in DevTools
chrome.devtools.panels.create(
  'KeyPilot Debug',
  'icons/icon16.png',
  'devtools-panel.html',
  (panel) => {
    console.log('KeyPilot DevTools panel created');
    
    // Panel lifecycle events
    panel.onShown.addListener((window) => {
      console.log('KeyPilot DevTools panel shown');
    });
    
    panel.onHidden.addListener(() => {
      console.log('KeyPilot DevTools panel hidden');
    });
  }
);

// Add sidebar pane to Elements panel
chrome.devtools.panels.elements.createSidebarPane(
  'KeyPilot',
  (sidebar) => {
    // Update sidebar with KeyPilot element information
    const updateSidebar = () => {
      chrome.devtools.inspectedWindow.eval(
        `(function() {
          const selected = $0; // Currently selected element
          if (!selected) return null;
          
          const keypilotData = {
            hasKeypilotAttributes: false,
            attributes: {},
            keypilotRole: null,
            isClickable: false,
            isHighlighted: false
          };
          
          // Check for KeyPilot-specific attributes
          Array.from(selected.attributes).forEach(attr => {
            if (attr.name.startsWith('data-keypilot')) {
              keypilotData.hasKeypilotAttributes = true;
              keypilotData.attributes[attr.name] = attr.value;
            }
          });
          
          // Check if element is in KeyPilot's clickable selectors
          const clickableSelectors = 'a[href], button, input, select, textarea';
          keypilotData.isClickable = selected.matches(clickableSelectors);
          
          // Check if element has KeyPilot highlighting
          keypilotData.isHighlighted = selected.classList.contains('keypilot-highlight') ||
                                      selected.querySelector('.keypilot-highlight') !== null;
          
          return keypilotData;
        })()`,
        (result, isException) => {
          if (!isException && result) {
            sidebar.setObject(result, 'KeyPilot Element Data');
          } else {
            sidebar.setExpression('null');
          }
        }
      );
    };
    
    // Update sidebar when selection changes
    chrome.devtools.panels.elements.onSelectionChanged.addListener(updateSidebar);
    
    // Initial update
    updateSidebar();
  }
);
