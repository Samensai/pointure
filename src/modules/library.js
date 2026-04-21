/* ── Pointure · library.js · Bibliothèque Unsplash ── */

const Library = {
  _initialized: false,
  // Clé Unsplash à remplacer par la vôtre sur https://unsplash.com/developers
  UNSPLASH_KEY: 'VOTRE_CLE_UNSPLASH_ICI',
  currentQuery: 'landscape painting',
  page: 1,

  init() {
    this._initialized = true;
    this.bindUI();
    this.search('landscape painting');
  },

  bindUI() {
    document.getElementById('btn-search-images')
      ?.addEventListener('click', () => {
        const q = document.getElementById('library-search')?.value?.trim();
        if (q) this.search(q);
      });

    document.getElementById('library-search')
      ?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const q = e.target.value.trim();
          if (q) this.search(q);
        }
      });

    document.querySelectorAll('.cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.search(chip.dataset.q);
      });
    });

    document.getElementById('btn-close-modal')
      ?.addEventListener('click', () => this.closeModal());

    document.getElementById('btn-use-as-reference')
      ?.addEventListener('click', () => {
        const src = document.getElementById('modal-img-src')?.src;
        if (src) {
          Camera.loadOverlayFromURL(src);
          this.closeModal();
          App.navigate('camera');
          if (!Camera.stream) {
            setTimeout(() => alert("Image chargée comme calque. Activez la caméra pour la projeter."), 300);
          }
        }
      });

    document.getElementById('image-modal')
      ?.addEventListener('click', e => {
        if (e.target.id === 'image-modal') this.closeModal();
      });
  },

  async search(query) {
    this.currentQuery = query;
    this.page = 1;
    const grid = document.getElementById('image-grid');
    grid.innerHTML = this.renderSkeletons(6);

    try {
      const data = await this.fetchUnsplash(query, 1);
      if (data && data.results && data.results.length > 0) {
        this.renderGrid(data.results);
      } else {
        this.renderFallback(query);
      }
    } catch(e) {
      this.renderFallback(query);
    }
  },

  async fetchUnsplash(query, page) {
    if (this.UNSPLASH_KEY === 'VOTRE_CLE_UNSPLASH_ICI') {
      // Mode démo : retourne des images placeholder
      return this.demoImages(query);
    }

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&page=${page}&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${this.UNSPLASH_KEY}` }
    });
    return res.json();
  },

  demoImages(query) {
    // Images de démonstration via picsum (pas de clé API requise)
    const seeds = [10, 23, 42, 67, 89, 101, 134, 156, 178, 200, 212, 234];
    return {
      results: seeds.map((seed, i) => ({
        id: `demo-${seed}`,
        urls: {
          small: `https://picsum.photos/seed/${seed + query.length}/400/300`,
          regular: `https://picsum.photos/seed/${seed + query.length}/1200/900`
        },
        alt_description: `${query} — référence ${i + 1}`,
        user: { name: 'Picsum Photos' }
      }))
    };
  },

  renderGrid(photos) {
    const grid = document.getElementById('image-grid');
    grid.innerHTML = photos.map(photo => `
      <div class="grid-item" data-url="${photo.urls.regular}" data-small="${photo.urls.small}" data-alt="${photo.alt_description || ''}">
        <img src="${photo.urls.small}" alt="${photo.alt_description || ''}" loading="lazy" />
        <div class="grid-item-overlay">
          <span class="grid-item-label">${photo.alt_description || 'Référence'}</span>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.grid-item').forEach(item => {
      item.addEventListener('click', () => this.openModal(item.dataset.url, item.dataset.alt));
    });
  },

  renderSkeletons(n) {
    return Array.from({ length: n }, () =>
      `<div class="skeleton" style="aspect-ratio:4/3;border-radius:10px;"></div>`
    ).join('');
  },

  renderFallback(query) {
    document.getElementById('image-grid').innerHTML = `
      <div class="grid-placeholder">
        <p>Aucun résultat pour « ${query} ».<br>
        <em>Ajoutez votre clé Unsplash dans library.js pour activer la vraie bibliothèque.</em></p>
      </div>
    `;
  },

  openModal(url, alt) {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('modal-img-src');
    if (img) { img.src = url; img.alt = alt; }
    if (modal) modal.style.display = 'flex';
  },

  closeModal() {
    const modal = document.getElementById('image-modal');
    if (modal) modal.style.display = 'none';
  }
};
