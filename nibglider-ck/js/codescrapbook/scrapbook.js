
/*
// FOR DRAWABLE
drawBoundsCornerHandles(canvas, rect) {
  const handleSize = 10; // Size of the square handle
  const halfHandleSize = handleSize / 2;
  
  // Create a paint object for the handles
  const handlePaint = new CanvasKit.Paint();
  handlePaint.setColor(CanvasKit.Color4f(0, 0, 1, 0.4)); // Blue color for handles
  
  // Positions for handles (corners of the rectangle)
  const positions = [
    { x: rect[0] - halfHandleSize, y: rect[1] - halfHandleSize }, // Top-left
    { x: rect[2] - halfHandleSize, y: rect[1] - halfHandleSize }, // Top-right
    { x: rect[0] - halfHandleSize, y: rect[3] - halfHandleSize }, // Bottom-left
    { x: rect[2] - halfHandleSize, y: rect[3] - halfHandleSize }  // Bottom-right
  ];

  // Draw handles
  positions.forEach(pos => {
    const handleRect = CanvasKit.LTRBRect(pos.x, pos.y, pos.x + handleSize, pos.y + handleSize);
    canvas.drawRect(handleRect, handlePaint);
  });
}
*/