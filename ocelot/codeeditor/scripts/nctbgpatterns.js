/*
nctbgpatterns.js

nctbgpatterns.js is a lightweight, reusable 
JavaScript library for generating and applying 
SVG-based background patterns to HTML elements. 
It supports a variety of pattern presets 
(diagonal lines, dots, cross-hatching, filled squares, etc.) 
and can automatically apply patterns to dynamically added elements 
using a MutationObserver.

---

Features

- Parametric SVG Patterns: Easily generate 
SVG background patterns with customizable color, 
spacing, angle, and more.
- Multiple Presets: Supports diagonal-solid, 
diagonal-dashed, dotted, cross-hatch, and filled-squares out of the box.
- Automatic Application: Use the observer to 
automatically apply patterns to elements matching 
a selector, even as they are added to the DOM.
- Reusable: Designed to be used in any project, 
including code editors, dashboards, and design tools.

---

Usage

1. Include the Library

<script src="nctbgpatterns.js"></script>

2. Generate a Pattern URL

const url = bgPatterns.generatePatternUrl({
  preset: 'diagonal-dashed',
  strokeColor: '#888',
  strokeWidth: 2,
  spacing: 12,
  angle: 45
});
element.style.backgroundImage = url;
element.style.backgroundSize = '12px 12px';

3. Apply a Pattern to an Element

bgPatterns.setElementBackgroundPattern(element, {
  preset: 'dotted',
  strokeColor: '#bdbdbd',
  strokeWidth: 2,
  spacing: 8
});

4. Automatically Apply Patterns to Elements (and Future Elements)
using MutationObserver.

bgPatterns.observe('function, group', {
  preset: 'cross-hatch',
  strokeColor: '#eee',
  strokeWidth: 1,
  spacing: 6
});
This will apply the pattern to all current and future elements matching the selector.

---

API

bgPatterns.generatePatternUrl(options)

Returns a CSS url(...) string for use as a background image.

Options:
- preset (string): Pattern type ('diagonal-solid', 'diagonal-dashed', 'dotted', 'cross-hatch', 'filled-squares')
- strokeColor (string): Line/dot color (default: #000)
- strokeWidth (number): Line thickness or dot radius (default: 1)
- spacing (number): Pattern tile size in px (default: 20)
- angle (number): Rotation angle in degrees (default: 0)
- dashArray (string): Dash array for dashed lines (optional)
- fillColor (string): Fill color for 'filled-squares' (default: #000)
- xOffset, yOffset (number): Optional translation offsets

---

bgPatterns.setElementBackgroundPattern(element, options)

Applies the generated pattern as a background image to the given element.

---

bgPatterns.observe(selector, options)

Automatically applies the pattern to all elements matching the selector, including those added in the future (using MutationObserver).
Returns the observer instance (call .disconnect() to stop observing).

---

Example

// Apply a blue dotted pattern to all <div class="note"> elements, even if added later
bgPatterns.observe('.note', {
  preset: 'dotted',
  strokeColor: 'blue',
  strokeWidth: 1,
  spacing: 5
});

---

Extending

You can add more presets (e.g., random noise, stripes, etc.) by extending the generatePatternUrl function.

---

License

MIT License (or your preferred license)
*/


(function (window) {
    "use strict";
  
    // Create or return the defs container for patterns.
    function getDefsContainer() {
      // Check if the <defs> container already exists.
      let defs = document.getElementById('pattern-defs');
      if (!defs) {
        // Create a hidden SVG for defs if it doesn't exist.
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.position = 'absolute';
        svg.setAttribute('aria-hidden', 'true');
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.id = 'pattern-defs';
        svg.appendChild(defs);
        document.body.appendChild(svg);
      }
      return defs;
    }
  
    /**
     * clonePattern
     *
     * Uses the proven technique from the old bgpatterns.html to create or reuse a <pattern>
     * element based on the given parameters. Returns a pattern id (to be referenced via url(#id)).
     *
     * @param {Object} options
     * @param {'diagonal-solid'|'diagonal-dashed'|'dotted'|'cross-hatch'|'filled-squares'} options.preset
     * @param {number} [options.angle=0]           Rotation angle in degrees
     * @param {string} [options.strokeColor='#000']  Color for lines/circles
     * @param {number} [options.strokeWidth=10]      Line thickness or dot radius
     * @param {number} [options.spacing=20]          Tile size (width = height = spacing)
     * @param {string} [options.dashArray]           e.g. '4,4' for dashed lines
     * @param {string} [options.fillColor='#000']    Color for filled-squares
     * @param {number} [options.xOffset=0]           Optional X offset
     * @param {number} [options.yOffset=0]           Optional Y offset
     */

   
    function clonePattern({
      preset,
      angle = 0,
      strokeColor = '#000',
      strokeWidth = 10,
      spacing = 20,
      dashArray = '',
      fillColor = '#000',
      xOffset = 0,
      yOffset = 0,
    }) {
      const defs = getDefsContainer();
      const id = [
        'pat',
        preset,
        angle,
        strokeColor.replace('#', ''),
        strokeWidth,
        spacing,
        dashArray || 'solid',
        fillColor.replace('#', ''),
        xOffset,
        yOffset
      ].join('-');
  
      // If the pattern already exists, return the id.
      if (document.getElementById(id)) return id;
  
      // Create a new <pattern> element
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      p.id = id;
      p.setAttribute('patternUnits', 'userSpaceOnUse');
      p.setAttribute('patternContentUnits', 'userSpaceOnUse');
      p.setAttribute('width', spacing);
      p.setAttribute('height', spacing);
      p.setAttribute('viewBox', `0 0 ${spacing} ${spacing}`);
      p.setAttribute('preserveAspectRatio', 'none');
  
      // Compose transformation: translate then rotate
      let transform = '';
      if (xOffset || yOffset) transform += `translate(${xOffset},${yOffset}) `;
      if (angle) transform += `rotate(${angle})`;
      if (transform) p.setAttribute('patternTransform', transform.trim());
  
      let shape;
      switch (preset) {
        case 'diagonal-solid':
        case 'diagonal-dashed':
          shape = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          shape.setAttribute('x1', 0);
          shape.setAttribute('y1', spacing / 2);
          shape.setAttribute('x2', spacing);
          shape.setAttribute('y2', spacing / 2);
          shape.setAttribute('stroke', strokeColor);
          shape.setAttribute('stroke-width', strokeWidth);
          if (preset === 'diagonal-dashed') {
            shape.setAttribute('stroke-dasharray', dashArray || `${strokeWidth * 2},${strokeWidth}`);
          }
          p.appendChild(shape);
          break;
  
        case 'dotted':
          shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          shape.setAttribute('cx', spacing / 2);
          shape.setAttribute('cy', spacing / 2);
          shape.setAttribute('r', strokeWidth);
          shape.setAttribute('fill', strokeColor);
          p.appendChild(shape);
          break;
  
        case 'cross-hatch':
          ['horizontal', 'vertical'].forEach(dir => {
            const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            if (dir === 'horizontal') {
              l.setAttribute('x1', 0);
              l.setAttribute('y1', spacing / 2);
              l.setAttribute('x2', spacing);
              l.setAttribute('y2', spacing / 2);
            } else {
              l.setAttribute('x1', spacing / 2);
              l.setAttribute('y1', 0);
              l.setAttribute('x2', spacing / 2);
              l.setAttribute('y2', spacing);
            }
            l.setAttribute('stroke', strokeColor);
            l.setAttribute('stroke-dasharray', dashArray || `${strokeWidth * 2},${strokeWidth}`);
            l.setAttribute('stroke-width', strokeWidth);
            p.appendChild(l);
          });
          break;
  
        case 'filled-squares':
          shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          const sq = spacing / 2;
          shape.setAttribute('x', (spacing - sq) / 2);
          shape.setAttribute('y', (spacing - sq) / 2);
          shape.setAttribute('width', sq);
          shape.setAttribute('height', sq);
          shape.setAttribute('fill', fillColor);
          p.appendChild(shape);
          break;
  
        default:
          console.warn('Unknown preset:', preset);
          return id;
      }
  
      defs.appendChild(p);
      return id;
    }
  
    /**
     * (Optional) A legacy-style function to set the background on an element using clonePattern.
     * This sets the fill of an inner <svg> or other element using the cloned pattern.
     *
     * @param {HTMLElement} elem - The element to receive the pattern.
     * @param {Object} options - The same options accepted by clonePattern.
     */
    function setElementBackgroundPatternUsingClone(elem, options = {}) {
      if (!elem || typeof options !== "object" || !options.preset) return;
      const patternId = clonePattern(options);
      // For an SVG element inside `elem`, set the fill attribute:
      // (Your usage may vary; you might set the background image style if using CSS)
      elem.style.backgroundImage = `url(#${patternId})`; 
    }
    
    function generatePatternUrl({
        preset,
        angle = 0,
        strokeColor = '#000',
        strokeWidth = 10,
        spacing = 20,
        dashArray = '',
        fillColor = '#000',
        xOffset = 0,
        yOffset = 0,
        backgroundColor = '#fff',
        width, 
        height,
        density,
  dotSize,
  noiseColor,
  noiseBackground,
  seed,
        edgeLength
      } = {}) {
        width = width || spacing;
        height = height || spacing;
        edgeLength = edgeLength || spacing;

        let svgContent = '';
        switch (preset) {
          case 'diagonal-solid':
            svgContent = `<line x1="0" y1="${spacing/2}" x2="${spacing}" y2="${spacing/2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
            break;
          case 'diagonal-dashed':
            svgContent = `<line x1="0" y1="${spacing/2}" x2="${spacing}" y2="${spacing/2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray || `${strokeWidth*2},${strokeWidth}`}" />`;
            break;
          case 'dotted':
            svgContent = `<circle cx="${spacing/2}" cy="${spacing/2}" r="${strokeWidth}" fill="${strokeColor}" />`;
            break;
          case 'cross-hatch':
            svgContent = `
              <line x1="0" y1="${spacing/2}" x2="${spacing}" y2="${spacing/2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray || `${strokeWidth*2},${strokeWidth}`}" />
              <line x1="${spacing/2}" y1="0" x2="${spacing/2}" y2="${spacing}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray || `${strokeWidth*2},${strokeWidth}`}" />
            `;
            break;
          case 'filled-squares':
            const sq = spacing / 2;
            svgContent = `<rect x="${(spacing-sq)/2}" y="${(spacing-sq)/2}" width="${sq}" height="${sq}" fill="${fillColor}" />`;
            break;
            case 'equilateral-triangle-vertical': {
                // Vertical grid of equilateral triangles (pointing up/down)
                const h = edgeLength * Math.sqrt(3) / 2;
                // Upward triangle
                svgContent = `
                  <polygon points="0,${h} ${edgeLength/2},0 ${edgeLength},${h}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                  <polygon points="0,${h} ${edgeLength},${h} ${edgeLength/2},${2*h}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                `;
                spacing = edgeLength;
                height = 2 * h;
                width = edgeLength;
                break;
              }
          case 'equilateral-triangle-horizontal': {
  // Horizontal grid of equilateral triangles (pointing left/right)
  const h = edgeLength * Math.sqrt(3) / 2;
  // Right-pointing triangle
  svgContent = `
    <polygon points="0,0 ${h},${edgeLength/2} 0,${edgeLength}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
    <polygon points="${h},${edgeLength/2} 0,${edgeLength} ${h},${edgeLength*1.5}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
  `;
  spacing = h ;
  
//  width = edgeLength;
 // height = edgeLength * 1.5;
  break;
}
case 'random-noise': {
  const _density = typeof density === 'number' ? density : 0.15;
  const _dotSize = typeof dotSize === 'number' ? dotSize : 1.5;
  const _noiseColor = noiseColor || strokeColor;
  const _noiseBg = noiseBackground || backgroundColor;
  const _seed = typeof seed === 'number' ? seed : Math.floor(Math.random() * 1000000);

  function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }
  const rand = mulberry32(_seed);

  // Use the element's width/height for the tile size
  spacing = width;
  const area = width * height;
  const numDots = Math.floor(area * _density);
  let dots = '';
  for (let i = 0; i < numDots; ++i) {
    const x = rand() * width;
    const y = rand() * height;
    dots += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${_dotSize}" fill="${_noiseColor}" />`;
  }
  svgContent = `<rect width="100%" height="100%" fill="${_noiseBg}" />${dots}`;
  break;
}
          default:
            svgContent = '';
        }
      
       // Compose pattern transform
  let patternTransform = '';
  if (xOffset || yOffset) patternTransform += `translate(${xOffset},${yOffset}) `;
  if (angle) patternTransform += `rotate(${angle})`;

  // SVG pattern definition
  const patternDef = `
    <pattern id="pat" patternUnits="userSpaceOnUse"
      width="${spacing}" height="${spacing}"
      viewBox="0 0 ${spacing} ${spacing}"
      ${patternTransform ? `patternTransform="${patternTransform.trim()}"` : ''}>
      ${svgContent}
    </pattern>
  `;

  // The SVG root, with a rect using the pattern fill
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>${patternDef}</defs>
    <rect width="100%" height="100%" fill="${backgroundColor}" />
    <rect width="100%" height="100%" fill="url(#pat)" />
  </svg>`;

  const minSvg = svg.replace(/\s+/g, ' ').trim();
  return `url("data:image/svg+xml,${encodeURIComponent(minSvg)}")`;
}
      

    // Expose both techniques in the bgPatterns API.
    window.bgPatterns = {
        generatePatternUrl: generatePatternUrl,
        setElementBackgroundPattern: function (elem, options = {}) {
          // Remove any previous observer to avoid duplicates
          if (elem._bgPatternResizeObserver) {
              elem._bgPatternResizeObserver.disconnect();
              elem._bgPatternResizeObserver = null;
          }
          // Create a new ResizeObserver for this element
          elem._bgPatternResizeObserver = new ResizeObserver(() => {
              const rect = elem.getBoundingClientRect();
              const width = Math.round(rect.width);
              const height = Math.round(rect.height);
              if (width > 0 && height > 0) {
                  elem.style.backgroundImage = generatePatternUrl({ ...options, width, height });
                  elem.style.backgroundSize = `${width}px ${height}px`;
              }
          });
          elem._bgPatternResizeObserver.observe(elem);
      
          // Initial application (in case element is already visible)
          const rect = elem.getBoundingClientRect();
          const width = Math.round(rect.width);
          const height = Math.round(rect.height);
          if (width > 0 && height > 0) {
              elem.style.backgroundImage = generatePatternUrl({ ...options, width, height });
              elem.style.backgroundSize = `${width}px ${height}px`;
          }
      },
        observe: function (selector, options) {
          document.querySelectorAll(selector).forEach(el => this.setElementBackgroundPattern(el, options));
          const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
              mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.matches(selector)) {
                  this.setElementBackgroundPattern(node, options);
                }
              });
            });
          });
          observer.observe(document.body, { childList: true, subtree: true });
          return observer;
        },
        // Expose clonePattern if needed for legacy SVG usage
        clonePattern: clonePattern
      };


  })(window);

