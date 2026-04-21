/* ── Pointure · camera.js · Calque AR manuel ── */

const Camera = {
  stream: null,
  overlayImage: null,
  opacity: 0.5,
  scale: 1.0,
  ctx: null,
  animFrame: null,
  _initialized: false,

  init() {
    this._initialized = true;
    this.video     = document.getElementById('camera-feed');
    this.canvas    = document.getElementById('overlay-canvas');
    this.ctx       = this.canvas.getContext('2d');
    this.placeholder = document.getElementById('camera-placeholder');
    this.controls  = document.getElementById('camera-controls');
    this.intro     = document.getElementById('camera-intro');

    document.getElementById('btn-start-camera')
      ?.addEventListener('click', () => this.start());

    document.getElementById('btn-pick-image')
      ?.addEventListener('click', () => document.getElementById('file-input').click());

    document.getElementById('file-input')
      ?.addEventListener('change', e => this.loadOverlayImage(e.target.files[0]));

    document.getElementById('slider-opacity')?.addEventListener('input', e => {
      this.opacity = e.target.value / 100;
      document.getElementById('val-opacity').textContent = `${e.target.value}%`;
    });

    document.getElementById('slider-size')?.addEventListener('input', e => {
      this.scale = e.target.value / 100;
      document.getElementById('val-size').textContent = `${e.target.value}%`;
    });

    // Pinch-to-zoom on overlay canvas
    this.initPinch();
  },

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      this.video.srcObject = this.stream;
      await this.video.play();

      this.placeholder.style.display = 'none';
      this.video.style.display = 'block';
      this.canvas.style.display = 'block';
      this.controls.style.display = 'flex';
      this.intro.style.display = 'block';

      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
      this.drawLoop();
    } catch (err) {
      alert("Impossible d'accéder à la caméra. Vérifiez les autorisations dans vos réglages.");
      console.error(err);
    }
  },

  resizeCanvas() {
    const frame = this.canvas.parentElement;
    this.canvas.width  = frame.clientWidth;
    this.canvas.height = frame.clientHeight;
  },

  loadOverlayImage(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      this.overlayImage = img;
      URL.revokeObjectURL(url);
    };
    img.src = url;
  },

  loadOverlayFromURL(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { this.overlayImage = img; };
    img.src = url;
  },

  drawLoop() {
    this.animFrame = requestAnimationFrame(() => this.drawLoop());
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.overlayImage) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const iw = this.overlayImage.width;
    const ih = this.overlayImage.height;

    // Fit image in canvas, then apply user scale
    const fitScale = Math.min(cw / iw, ch / ih);
    const drawW = iw * fitScale * this.scale;
    const drawH = ih * fitScale * this.scale;
    const dx = (cw - drawW) / 2;
    const dy = (ch - drawH) / 2;

    this.ctx.globalAlpha = this.opacity;
    this.ctx.drawImage(this.overlayImage, dx, dy, drawW, drawH);
    this.ctx.globalAlpha = 1;
  },

  initPinch() {
    let initialDist = null;
    let initialScale = 1;
    const slider = document.getElementById('slider-size');

    this.canvas.parentElement.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        initialDist = this.getTouchDist(e.touches);
        initialScale = this.scale;
      }
    }, { passive: true });

    this.canvas.parentElement.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && initialDist) {
        const dist = this.getTouchDist(e.touches);
        const ratio = dist / initialDist;
        this.scale = Math.min(2.0, Math.max(0.2, initialScale * ratio));
        if (slider) {
          slider.value = Math.round(this.scale * 100);
          document.getElementById('val-size').textContent = `${slider.value}%`;
        }
      }
    }, { passive: true });

    this.canvas.parentElement.addEventListener('touchend', () => { initialDist = null; }, { passive: true });
  },

  getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  },

  stop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
  }
};

document.addEventListener('DOMContentLoaded', () => Camera.init());
