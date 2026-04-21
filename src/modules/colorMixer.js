/* ── Pointure · colorMixer.js · Mélange pigments ── */

const ColorMixer = {
  _initialized: false,
  pigmentDB: null,
  myPaints: [],   // { name, code, rgb, brand }
  targetRGB: { r: 224, g: 96, b: 48 },

  async init() {
    this._initialized = true;
    await this.loadDB();
    this.bindUI();
  },

  async loadDB() {
    try {
      const res = await fetch('src/data/pigments.json');
      this.pigmentDB = await res.json();
    } catch(e) {
      console.error('Impossible de charger la base pigments', e);
    }
  },

  bindUI() {
    // Color picker via spectrum
    const pickerInput = document.getElementById('color-picker-input');
    document.getElementById('btn-open-spectrum')?.addEventListener('click', () => {
      pickerInput?.click();
    });
    pickerInput?.addEventListener('input', e => {
      const hex = e.target.value;
      this.targetRGB = this.hexToRgb(hex);
      this.updateTargetPreview(hex);
      if (this.myPaints.length >= 2) this.computeMix();
    });

    // Pipette on reference image (simplified: open color picker)
    document.getElementById('btn-pick-from-image')?.addEventListener('click', () => {
      alert("Astuce : rendez-vous sur l'onglet Bibliothèque, sélectionnez une image de référence, puis revenez ici pour activer la pipette.");
    });

    // Add pigment
    document.getElementById('btn-add-pigment')?.addEventListener('click', () => this.addPigment());
    document.getElementById('pigment-code')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.addPigment();
    });

    // Brand select
    document.getElementById('brand-select')?.addEventListener('change', e => {
      const val = e.target.value;
      const hint = document.getElementById('pigment-code');
      if (val && val !== 'other' && hint) {
        hint.placeholder = `Code pigment ou nom (ex: Jaune Citron, PY3…)`;
      }
    });
  },

  updateTargetPreview(hex) {
    const preview = document.getElementById('target-color-preview');
    const hexLabel = document.getElementById('target-color-hex');
    if (preview) preview.style.background = hex;
    if (hexLabel) hexLabel.textContent = hex;
  },

  addPigment() {
    const input = document.getElementById('pigment-code');
    const brand = document.getElementById('brand-select')?.value || '';
    const query = input?.value?.trim();
    if (!query || !this.pigmentDB) return;

    const result = this.findPaint(query, brand);
    if (!result) {
      this.flashError(input, `"${query}" introuvable. Essayez un code pigment (ex: PB29) ou un nom de couleur.`);
      return;
    }

    if (this.myPaints.find(p => p.code === result.code && p.brandKey === brand)) {
      this.flashError(input, 'Cette peinture est déjà dans votre liste.');
      return;
    }

    this.myPaints.push({ ...result, brandKey: brand });
    input.value = '';
    this.renderPaintsList();
    if (this.myPaints.length >= 2) this.computeMix();
  },

  findPaint(query, brandKey) {
    const q = query.toUpperCase().trim();
    const db = this.pigmentDB;

    // 1. Exact pigment code match
    if (db.pigments[q]) {
      return { name: db.pigments[q].name, code: q, rgb: db.pigments[q].rgb, lab: db.pigments[q].lab };
    }

    // 2. Search in brand catalog by name or code
    if (brandKey && brandKey !== 'other' && db.brands[brandKey]) {
      const brand = db.brands[brandKey];
      const found = brand.colors.find(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toUpperCase() === q
      );
      if (found) {
        const pig = db.pigments[found.code];
        return { name: found.name, code: found.code, rgb: pig?.rgb || [128,128,128], lab: pig?.lab || [50,0,0] };
      }
    }

    // 3. Fuzzy search across all brands
    for (const bk of Object.keys(db.brands)) {
      const brand = db.brands[bk];
      const found = brand.colors.find(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      );
      if (found) {
        const pig = db.pigments[found.code];
        return { name: found.name, code: found.code, rgb: pig?.rgb || [128,128,128], lab: pig?.lab || [50,0,0] };
      }
    }

    // 4. Partial pigment code
    const partial = Object.keys(db.pigments).find(k => k.startsWith(q.replace(/[^A-Z0-9:]/g, '')));
    if (partial) {
      return { name: db.pigments[partial].name, code: partial, rgb: db.pigments[partial].rgb, lab: db.pigments[partial].lab };
    }

    return null;
  },

  renderPaintsList() {
    const list = document.getElementById('my-paints-list');
    if (!list) return;

    if (this.myPaints.length === 0) {
      list.innerHTML = '<div class="paint-chip-empty">Aucune peinture ajoutée</div>';
      return;
    }

    list.innerHTML = this.myPaints.map((p, i) => `
      <div class="paint-chip" data-index="${i}">
        <div class="paint-chip-dot" style="background: rgb(${p.rgb[0]},${p.rgb[1]},${p.rgb[2]});"></div>
        <span class="paint-chip-name">${p.name}</span>
        <span class="paint-chip-remove" data-remove="${i}">×</span>
      </div>
    `).join('');

    list.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.remove);
        this.myPaints.splice(idx, 1);
        this.renderPaintsList();
        if (this.myPaints.length >= 2) this.computeMix();
        else document.getElementById('mix-result').style.display = 'none';
      });
    });
  },

  // ── Kubelka-Munk simplifié ──
  // On travaille en espace linéaire RGB, simplifié pour un proto
  computeMix() {
    if (this.myPaints.length < 2) return;
    const target = this.targetRGB;

    // Chercher la combinaison de 2-3 peintures qui minimise la distance
    const best = this.findBestMix(target, this.myPaints);
    this.renderMixResult(best);
  },

  findBestMix(target, paints) {
    let bestDist = Infinity;
    let bestResult = null;

    // Try all pairs
    for (let i = 0; i < paints.length; i++) {
      for (let j = i + 1; j < paints.length; j++) {
        for (let t = 0.1; t <= 0.9; t += 0.05) {
          const mixed = this.kmMix(paints[i].rgb, paints[j].rgb, t);
          const dist = this.colorDist(mixed, [target.r, target.g, target.b]);
          if (dist < bestDist) {
            bestDist = dist;
            bestResult = {
              parts: [
                { paint: paints[i], ratio: Math.round((1 - t) * 100) },
                { paint: paints[j], ratio: Math.round(t * 100) }
              ],
              mixed,
              dist
            };
          }
        }
      }
    }

    // Try triplets if we have 3+
    if (paints.length >= 3) {
      for (let i = 0; i < paints.length; i++) {
        for (let j = i + 1; j < paints.length; j++) {
          for (let k = j + 1; k < paints.length; k++) {
            for (let a = 0.1; a <= 0.8; a += 0.1) {
              for (let b = 0.1; b <= (0.9 - a); b += 0.1) {
                const c = 1 - a - b;
                if (c <= 0) continue;
                const ab = this.kmMix(paints[i].rgb, paints[j].rgb, b / (a + b));
                const mixed = this.kmMix(ab, paints[k].rgb, c);
                const dist = this.colorDist(mixed, [target.r, target.g, target.b]);
                if (dist < bestDist) {
                  bestDist = dist;
                  bestResult = {
                    parts: [
                      { paint: paints[i], ratio: Math.round(a * 100) },
                      { paint: paints[j], ratio: Math.round(b * 100) },
                      { paint: paints[k], ratio: Math.round(c * 100) }
                    ],
                    mixed,
                    dist
                  };
                }
              }
            }
          }
        }
      }
    }

    // Normalise ratios to sum 100
    if (bestResult) {
      const total = bestResult.parts.reduce((s, p) => s + p.ratio, 0);
      bestResult.parts.forEach(p => p.ratio = Math.round(p.ratio / total * 100));
      const maxDistPossible = Math.sqrt(3 * 255 * 255);
      bestResult.proximity = Math.round((1 - bestDist / maxDistPossible) * 100);
    }

    return bestResult;
  },

  // Kubelka-Munk: pour un proto on utilise une approximation soustractive
  // k/s coefficient simplifié → mélange dans l'espace sqrt (plus proche du réel que linéaire)
  kmMix(rgb1, rgb2, t) {
    // t = proportion of rgb2
    return [
      Math.round(Math.sqrt((1 - t) * rgb1[0] ** 2 + t * rgb2[0] ** 2)),
      Math.round(Math.sqrt((1 - t) * rgb1[1] ** 2 + t * rgb2[1] ** 2)),
      Math.round(Math.sqrt((1 - t) * rgb1[2] ** 2 + t * rgb2[2] ** 2))
    ];
  },

  colorDist(rgb1, rgb2) {
    return Math.sqrt(
      (rgb1[0] - rgb2[0]) ** 2 +
      (rgb1[1] - rgb2[1]) ** 2 +
      (rgb1[2] - rgb2[2]) ** 2
    );
  },

  renderMixResult(result) {
    if (!result) return;

    const panel = document.getElementById('mix-result');
    const inner = document.getElementById('mix-result-inner');
    const fill  = document.getElementById('proximity-fill');
    const pct   = document.getElementById('proximity-pct');

    inner.innerHTML = result.parts.map(p => `
      <div class="mix-part">
        <div class="mix-swatch" style="background: rgb(${p.paint.rgb[0]},${p.paint.rgb[1]},${p.paint.rgb[2]});"></div>
        <span class="mix-pct-label">${p.ratio}%</span>
        <span class="mix-name-label">${p.paint.name}</span>
      </div>
    `).join(`
      <div style="display:flex;align-items:center;padding:0 4px;color:#8a6a4a;font-size:20px;align-self:center;">+</div>
    `);

    panel.style.display = 'flex';
    setTimeout(() => {
      fill.style.width = `${result.proximity}%`;
      pct.textContent = `${result.proximity}%`;
    }, 50);
  },

  flashError(input, msg) {
    alert(msg);
    input?.focus();
  },

  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }
};
