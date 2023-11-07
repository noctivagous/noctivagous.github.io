import { createCenteredRect, fillRect } from "./NGUtils.js";

var CanvasKit = null;

class NibGliderApp {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.canvas = null;
    this.skSurface = null;
    this.skCanvas = null;
    this.context = null;
    this.dirtyRects = [];
    this.layerManager = null;
    this.surface = null;
    this.CanvasKit = null;

    this.offset = 0;
    this.mouseX = -1000;
    this.mouseY = -1000;
    
  }

  async init() {
    CanvasKit = await CanvasKitInit({
      locateFile: (file) => 'https://unpkg.com/canvaskit-wasm@0.19.0/bin/' + file,
      
      //LOCAL CANVASKIT:
      //locateFile: (file) => 'js/canvaskit' + file,
      
    });

    this.CanvasKit = CanvasKit;
    this.appBackgroundColor = CanvasKit.Color(0, 0, 255, 1.0);

    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) {
      alert('Canvas element not found');
      console.error('Canvas element not found');
      return;
    }

    // SETUP PAINT
    this.setupPaint();
    this.setupEventListeners();

    this.setupCanvasSurface();

    this.setupResizeHandling();

    this.layerManager = new LayerManager();
    
    //this.invalidateEntireCanvas();


    this.skCanvas = this.skSurface.getCanvas();


    this.layerManager = new LayerManager();

    this.skSurface.requestAnimationFrame(this.draw);

    // resize the canvas
    this.onResize();

    var resizeTimer = null;


    this.startDrawingIfNeeded();
  }

  fillWithBackgroundColor()
  {
    fillRect(this.CanvasKit, this.skCanvas, this.appBackgroundColor, this.entireCanvasRect());
  }

  draw = () => {
    this.fillWithBackgroundColor();

    this.dirtyRects.forEach((rect) => {


      //this.debugDraw();

      //console.log(rect);
      this.skCanvas.save();
      const rectToClip = rect;
      this.skCanvas.clipRect(rectToClip, this.CanvasKit.ClipOp.Intersect, true);
      
      // Add your drawing code here (draw layers, etc.)
      this.debugDraw();


      this.skCanvas.restore();
    });

   
   /* 
   if (this.dirtyRects.some(rect => rect.width === this.canvas.width && rect.height === this.canvas.height)) {
      // Additional drawing logic for when the entire canvas is dirty
      this.layerManager.drawAllLayers(this.skCanvas);

    }
    */

    // After drawing all dirty rects, reset the list
    this.dirtyRects = [];
    this.drawingInProgress = false;
  
  
  };


  setupEventListeners() {
    // update on mouseMove
    this.canvas.addEventListener('pointermove', (e) => {
      /* if (!e.pressure) {
         return;
       }*/
      this.mouseX = e.offsetX;
      this.mouseY = e.offsetY;

      this.invalidateRect(createCenteredRect(this.CanvasKit, this.mouseX, this.mouseY, 320, 370));
      this.invalidateRect(createCenteredRect(this.CanvasKit, this.mouseX+ 500, this.mouseY, 320, 370));
  //   this.invalidateEntireCanvas();


    });

  }

  setupPaint() {
    this.paint = new this.CanvasKit.Paint();
    this.paint.setColor(this.CanvasKit.Color4f(0.9, 0, 0, 1.0));
    this.paint.setStrokeWidth(10);
    this.paint.setStyle(this.CanvasKit.PaintStyle.Stroke);
    this.paint.setAntiAlias(true);

  }

  setupResizeHandling() {
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(this.onResize.bind(this), 300);
    });
  }


  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width;
    this.canvas.height = height;

    if (!this.setupCanvasSurface()) {
      return;
  
    }

    this.invalidateEntireCanvas();


  }


  setupCanvasSurface() {
    this.skSurface = this.CanvasKit.MakeCanvasSurface(this.canvasId) || this.CanvasKit.MakeWebGLCanvasSurface(this.canvasId);
    if (!this.skSurface) {
      alert('Could not make CanvasKit canvas surface');
      console.error('Could not make CanvasKit canvas surface');
      return false;
    }
    this.skCanvas = this.skSurface.getCanvas();
    return true;
  }




  startDrawingIfNeeded() {
    if (this.dirtyRects.length > 0 && !this.drawingInProgress) {
      this.drawingInProgress = true;
  //    this.skSurface.drawOnce(this.draw);
//      this.skSurface.drawOnce(this.draw);
      this.skSurface.requestAnimationFrame(this.draw);
    }
  }


  invalidateRect(rect) {
    
    this.dirtyRects.push(rect);
    this.startDrawingIfNeeded();
  }

  invalidateEntireCanvas() {
    this.invalidateRect(this.CanvasKit.XYWHRect(0, 0, this.canvas.width, this.canvas.height));
  }

  entireCanvasRect(){
    return this.CanvasKit.XYWHRect(0, 0, this.canvas.width, this.canvas.height) 
  }

  

  debugDraw() {
    // -----
    // DEBUG

    //this.skCanvas.clear(this.CanvasKit.BLUE);

    //CanvasKit.XYWHRect(centerX - halfWidth, centerY - halfHeight, width, height)

    if (this.CanvasKit != null) {
      const rr = this.CanvasKit.RRectXY(        //this.CanvasKit.XYWHRect(this.mouseX - 150, this.mouseY - 150, 300, 300),
        createCenteredRect(this.CanvasKit, this.mouseX, this.mouseY, 300, 300),
        //this.CanvasKit.LTRBRect(this.mouseX, this.mouseY, this.mouseX + 280, this.mouseY + 260),
        15,
        15
      );

      this.skCanvas.drawRRect(rr, this.paint);

    }

  }


}

const nibGliderApp = new NibGliderApp('canvas');
nibGliderApp.init();
