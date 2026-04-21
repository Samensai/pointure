/* ── Pointure · app.js · Router & Init ── */

const App = {
  currentPage: 'camera',

  init() {
    this.bindNav();
    this.bindSettings();
    console.log('%cPointure v0.1 — PWA prototype', 'color:#c9920a;font-family:serif;font-size:14px;');
  },

  bindNav() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const page = tab.dataset.page;
        this.navigate(page);
      });
    });
  },

  navigate(page) {
    if (page === this.currentPage) return;

    document.querySelector('.page.active')?.classList.remove('active');
    document.querySelector(`#page-${page}`)?.classList.add('active');

    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.page === page);
    });

    this.currentPage = page;

    // lazy-init modules on first visit
    if (page === 'library' && !Library._initialized) Library.init();
    if (page === 'colors' && !ColorMixer._initialized) ColorMixer.init();
  },

  bindSettings() {
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      alert('Paramètres — à venir dans une prochaine version.');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/public/sw.js').catch(() => {});
  });
}
