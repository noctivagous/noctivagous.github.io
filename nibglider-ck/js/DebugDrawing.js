class DebugDrawing {
   constructor(app) {
    this.app = app;
    this.CanvasKit = app.CanvasKit;
   }

    
   resolutions = [
    { width: 7680, height: 4320, label: "8K UHD" },   // 8K Ultra HD
    { width: 5120, height: 2880, label: "5K" },       // 5K
    { width: 3840, height: 2160, label: "4K UHD" },   // 4K Ultra HD
    { width: 2560, height: 1440, label: "2K QHD" },   // 2K Quad HD
    { width: 1920, height: 1080, label: "1080p" }, // Full HD
    { width: 1600, height: 900, label: "900p" },  // HD+
    { width: 1366, height: 768, label: "768p" },  // Common Laptop
    { width: 1280, height: 720, label: "720p" },  // HD
    { width: 1024, height: 600, label: "Netbook" } // Netbook Size
 ];

 draw(skCanvas) {
   const paint = new CanvasKit.Paint();
   paint.setColor(CanvasKit.Color(0, 0, 255)); // Blue color
   paint.setStyle(CanvasKit.PaintStyle.Stroke);
   paint.setStrokeWidth(2);

   const font = new CanvasKit.Font(null, 16); // Default font with size 16
   const textPaint = new CanvasKit.Paint();
   textPaint.setColor(CanvasKit.Color(0, 0, 0)); // Black color

   this.resolutions.forEach(res => {
      const rect = CanvasKit.XYWHRect(0, 0, res.width, res.height);
      skCanvas.drawRect(rect, paint);

      const textWidth = font.measureText(res.label);
      skCanvas.drawText(res.label, rect[2] - textWidth - 5, 20, textPaint, font);
   });

   // Cleanup
   paint.delete();
   //font.delete();
   textPaint.delete();
}

}

export default DebugDrawing;
