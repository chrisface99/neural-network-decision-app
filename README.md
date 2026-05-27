# NeuralEye 🧠

Real-time image classifier built with **React 18 + Vite** and **TensorFlow.js**, powered by **MobileNet v2** (1,000 ImageNet classes). Runs 100% in the browser — no server, no backend.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

> **First load:** MobileNet weights (~16 MB) are fetched from the TF Hub CDN and cached by the browser. Subsequent loads are near-instant.

## Features

- **Drag-and-drop** or click-to-upload image classification
- **Live webcam** capture and classify
- **Top-5 predictions** with animated confidence bars
- High-confidence (>50%) vs uncertain verdict
- Proper loading, error and empty states
- Responsive two-column layout, dark theme

## Why Vite instead of Create React App?

CRA (`react-scripts`) is no longer maintained and `npm audit fix --force` will break it by downgrading it to `0.0.0`. Vite is the modern replacement: faster dev server, smaller builds, zero legacy vulnerabilities.

## Project structure

```
neuraleye/
├── index.html               # Vite entry point
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx             # React root
    ├── App.jsx              # Thin wrapper
    ├── index.css            # Global reset
    ├── DecisionComponent.jsx  # All classifier logic + UI
    └── DecisionComponent.css  # Styles (CSS variables)
```

## How it works

1. **Model load** — `mobilenet.load()` fetches MobileNet v2 (α=1.0) from TF Hub and compiles a TF.js graph model inside a Web Worker thread.
2. **Inference** — The image is decoded into pixels; `model.classify(imgEl, 5)` runs a forward pass and returns the top-5 class probabilities.
3. **Verdict** — Top prediction probability > 50% → *high confidence*; otherwise → *uncertain*.

## Tech stack

| Layer | Library |
|---|---|
| UI | React 18 |
| Bundler | Vite 5 |
| Neural Network | TensorFlow.js 4 + MobileNet v2 |
| Camera | react-webcam |
| Styling | CSS custom properties |

## License

MIT
