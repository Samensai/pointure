# Pointure 🎨 

> L'assistant du peintre — calque AR, mélange de couleurs, bibliothèque d'inspiration.

## Démarrage rapide

```bash
# Cloner le repo
git clone https://github.com/VOTRE_USERNAME/pointure.git
cd pointure

# Tester en local (pas besoin de build tool)
npx serve .
# → ouvrir http://localhost:3000 sur votre iPhone (même réseau WiFi)
```

## Déploiement GitHub Pages (automatique)

1. Créer un repo GitHub `pointure`
2. Pousser le code sur la branche `main`
3. Aller dans **Settings → Pages → Source : GitHub Actions**
4. Le workflow `.github/workflows/deploy.yml` déploie automatiquement

## Clé Unsplash (bibliothèque d'images)

1. Créer un compte sur [unsplash.com/developers](https://unsplash.com/developers)
2. Créer une application → copier la **Access Key**
3. Remplacer `VOTRE_CLE_UNSPLASH_ICI` dans `src/modules/library.js`

Sans clé, la bibliothèque fonctionne en mode démo avec des images Picsum.

## Structure

```
pointure/
├── index.html              ← Point d'entrée
├── src/
│   ├── app.js              ← Router
│   ├── modules/
│   │   ├── camera.js       ← Projection de calque
│   │   ├── colorMixer.js   ← Mélange pigments (Kubelka-Munk simplifié)
│   │   └── library.js      ← Bibliothèque Unsplash
│   ├── data/
│   │   └── pigments.json   ← Base: 50 pigments, 4 marques
│   └── ui/
│       ├── skeu.css        ← Style skeuomorphe
│       └── components.js   ← Helpers UI
└── public/
    ├── manifest.json       ← PWA manifest
    └── sw.js               ← Service worker (offline)
```

## Fonctionnalités V1

- [x] **Projection de calque** : flux caméra + overlay image, opacité & zoom manuels, pinch-to-resize
- [x] **Mélange couleurs** : 50 pigments, 4 marques (W&N, Sennelier, Golden, Lefranc), algo Kubelka-Munk simplifié
- [x] **Bibliothèque** : Unsplash API, catégories prédéfinies, modal pour utiliser comme référence
- [x] **PWA** : installable, offline, manifest

## Roadmap V2

- [ ] Détection automatique des bords du support (OpenCV.js)
- [ ] Pipette réelle sur l'image de référence
- [ ] Plus de marques (Schmincke, Gamblin, Blockx)
- [ ] Favoris persistants
- [ ] Mode abonnement (RevenueCat ou Stripe)

---

*Prototype PWA — migration iOS native avec ARKit prévue en V2.*
