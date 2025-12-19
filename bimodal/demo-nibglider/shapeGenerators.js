



// NEW: Update SVG preview box for circle frame controls
window.updatePreviewBox = function() {
  const svgPath = document.getElementById('shapePreviewPath');
  const svg = document.getElementById('shapePreview');
  if (!svgPath || !svg) return;
  
  const center = {x: 0, y: 0};
  const radius = 0.9;  // Within -1.2 to 1.2 viewBox
  const steps = 72;    // Smooth enough for preview
  
  let pathData = 'M 0,0';  // Default degenerate path
  
  if (circleInnerShapeType === 'circle') {
    // Full circle
    pathData = `M ${radius},0 A ${radius},${radius} 0 1,1 ${-radius},0 A ${radius},${radius} 0 1,1 ${radius},0 Z`;
  } else if (circleInnerShapeType === 'polygon') {
    // Regular polygon
    const sides = circleInnerShapeParams.sides || 6;
    const angleStep = (Math.PI * 2) / sides;
    pathData = 'M ';
    for (let i = 0; i < sides; i++) {
      const angle = angleStep * i;
      pathData += `${center.x + radius * Math.cos(angle).toFixed(3)},${center.y + radius * Math.sin(angle).toFixed(3)} `;
    }
    pathData += 'Z';
  } else if (circleInnerShapeType === 'supershape') {
    // Supershape
    const { m = 5, n1 = 0.2, n2 = 1.7, n3 = 1.7 } = circleInnerShapeParams;
    pathData = 'M ';
    for (let i = 0; i <= steps; i++) {
      const phi = (i / steps) * Math.PI * 2;
      const r = supershapeRadius(phi, m, n1, n2, n3);
      const scaledR = radius * (r || 0);
      pathData += `${center.x + scaledR * Math.cos(phi).toFixed(3)},${center.y + scaledR * Math.sin(phi).toFixed(3)} `;
    }
    pathData += 'Z';
  }
  
  svgPath.setAttribute('d', pathData);
};





// ADD: Supershape radius calculation function (before createSupershape)
function supershapeRadius(phi, m, n1, n2, n3) {
  const abs = Math.abs;
  const cos = Math.cos;
  const sin = Math.sin;
  const pow = Math.pow;
  
  let r1 = abs(cos(m * phi / 4));
  let r2 = abs(sin(m * phi / 4));
  r1 = pow(r1, n2);
  r2 = pow(r2, n3);
  let r = pow(r1 + r2, -1 / n1);
  
  return r || 0;
}

// Update createSupershape():
function createSupershape(center, radius, params, rotationAngle = 0) {
 
  var rotationRad = rotationAngle * Math.PI / 180;
  const path = new paper.Path();
  const steps = 360;
  const { m = 3, n1 = 0.2, n2 = 1.7, n3 = 1.7 } = params;
  
  for (let i = 0; i <= steps; i++) {
    let phi = (i / steps) * Math.PI * 2;
    
    const r = supershapeRadius(phi, m, n1, n2, n3);
    // FIX: Proper scaling - multiply by radius parameter
    const scaledR = radius * (r || 0);
    path.add(new paper.Point(
      center.x + scaledR * Math.cos(phi + rotationRad),
      center.y + scaledR * Math.sin(phi + rotationRad)
    ));
  }
  path.closed = true;
  path.strokeCap = 'round';
  path.strokeJoin = 'round';
  return path;
}


