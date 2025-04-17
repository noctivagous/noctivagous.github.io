
---

### 1. **HTML Structure**
- **index.html**  
  Contains only the HTML structure and references to external CSS and JS files.  
  Example:  
  ```html
  <link rel="stylesheet" href="styles/editor.css">
  <script src="scripts/editor.js"></script>
  ```

---

### 2. **CSS Styles**
- **styles/editor.css**  
  All your custom tag and UI styles (currently in `<style>` tags) go here.
- **styles/theme-light.css** (optional)  
  Theme-specific overrides for light mode.
- **styles/theme-dark.css** (optional)  
  Theme-specific overrides for dark mode.

---

### 3. **JavaScript Functionality**
- **scripts/editor.js**  
  Main logic for selection, key commands, hover tracking, and UI updates.
- **scripts/behaviors.js**  
  Contains the `tagBehaviors` dictionary and related helpers.
- **scripts/ui-menu.js**  
  Handles the key command menu and persistent area updates.
- **scripts/tabs.js**  
  Handles tabifyingView logic and function tab switching.
- **scripts/collapse.js**  
  Handles collapse/expand logic for functions, groups, etc.
- **scripts/svg-arrows.js**  
  Handles SVG arrow creation and animation for collapsible elements.
- **scripts/init.js**  
  Handles DOMContentLoaded and initialization routines.

---

### 4. **HTML Templates (Optional)**
- **templates/**  
  Store reusable HTML snippets (e.g., for new code elements, modals, overlays).

---

### 5. **Documentation**
- **README.md**  
  Overview, usage, and developer notes.
- **docs/bimodal-control.md**  
  Theory and rationale for bimodal control and UI design.

---

### 6. **Assets**
- **assets/icons/**  
  SVGs or PNGs for UI icons (arrows, collapse, etc.).
- **assets/fonts/**  
  Custom fonts if needed.

---

**Summary Table:**

| File/Folder                | Purpose                                      |
|----------------------------|----------------------------------------------|
| index.html                 | Main HTML structure                          |
| styles/editor.css          | Main CSS styles                              |
| styles/theme-light.css     | Light theme overrides (optional)             |
| styles/theme-dark.css      | Dark theme overrides (optional)              |
| scripts/editor.js          | Main JS logic                                |
| scripts/behaviors.js       | Tag behaviors and helpers                    |
| scripts/ui-menu.js         | Key command menu logic                       |
| scripts/tabs.js            | Tabbed view logic                            |
| scripts/collapse.js        | Collapse/expand logic                        |
| scripts/svg-arrows.js      | SVG arrow logic                              |
| scripts/init.js            | Initialization code                          |
| templates/                 | HTML templates/snippets (optional)           |
| docs/                      | Documentation and theory                     |
| assets/icons/              | UI icons                                     |
| assets/fonts/              | Fonts                                        |

---
