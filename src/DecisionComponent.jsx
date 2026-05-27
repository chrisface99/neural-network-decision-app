import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import Webcam from 'react-webcam';
import './DecisionComponent.css';

const TOP_K = 5;

function ConfidenceBar({ probability, index }) {
  const pct = (probability * 100).toFixed(1);
  return (
    <div className="conf-bar-wrap" style={{ '--delay': `${index * 80}ms` }}>
      <div
        className="conf-bar-fill"
        style={{ '--pct': `${pct}%`, '--hue': `${160 + index * 30}` }}
      />
    </div>
  );
}

function NeuralNodes() {
  const nodes = Array.from({ length: 18 }, (_, i) => i);
  return (
    <svg className="neural-bg" viewBox="0 0 400 300" aria-hidden="true">
      {nodes.map((i) => {
        const x = 30 + (i % 6) * 68;
        const y = 40 + Math.floor(i / 6) * 110;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" className="node" style={{ '--d': `${i * 0.3}s` }} />
            {i % 6 < 5 && (
              <line
                x1={x} y1={y}
                x2={x + 68} y2={40 + Math.floor(i / 6) * 110}
                className="edge"
                style={{ '--d': `${i * 0.2}s` }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function DecisionComponent() {
  const [model, setModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [classifying, setClassifying] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [mode, setMode] = useState('upload'); // 'upload' | 'webcam'
  const [dragging, setDragging] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await tf.ready();
        const m = await mobilenet.load({ version: 2, alpha: 1.0 });
        if (!cancelled) { setModel(m); setModelLoading(false); }
      } catch (e) {
        if (!cancelled) { setModelError(e.message); setModelLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const classify = useCallback(async (src) => {
    if (!model) return;
    setClassifying(true);
    setPredictions([]);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const preds = await model.classify(img, TOP_K);
      setPredictions(preds);
    } catch (e) {
      console.error('Classification error:', e);
    } finally {
      setClassifying(false);
    }
  }, [model]);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target.result);
      classify(e.target.result);
    };
    reader.readAsDataURL(file);
  }, [classify]);

  const handleFileInput = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleCapture = () => {
    if (!webcamRef.current) return;
    const src = webcamRef.current.getScreenshot();
    if (src) { setImageData(src); classify(src); }
  };

  const top = predictions[0];
  const isPositive = top && top.probability > 0.5;

  return (
    <div className="app">
      <NeuralNodes />

      <header className="header">
        <div className="header-inner">
          <div className="logo-mark">
            <span className="logo-dot" />
            <span className="logo-dot" />
            <span className="logo-dot" />
          </div>
          <div>
            <h1 className="title">NeuralEye</h1>
            <p className="subtitle">MobileNet v2 · Image Classifier</p>
          </div>
          <div className={`model-status ${modelLoading ? 'loading' : modelError ? 'error' : 'ready'}`}>
            <span className="status-dot" />
            {modelLoading ? 'Loading model…' : modelError ? 'Model error' : 'Model ready'}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="mode-tabs">
          <button
            className={`tab ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => setMode('upload')}
          >
            Upload / Drop
          </button>
          <button
            className={`tab ${mode === 'webcam' ? 'active' : ''}`}
            onClick={() => setMode('webcam')}
          >
            Live Camera
          </button>
        </div>

        <div className="workspace">
          {/* LEFT: input panel */}
          <div className="panel input-panel">
            {mode === 'upload' ? (
              <div
                className={`dropzone ${dragging ? 'dragging' : ''} ${imageData ? 'has-image' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Drop image or click to upload"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
                {imageData ? (
                  <img src={imageData} alt="Uploaded" className="preview-img" />
                ) : (
                  <div className="dropzone-hint">
                    <div className="drop-icon">⊕</div>
                    <p>Drop an image here</p>
                    <p className="hint-small">or click to browse</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="webcam-wrap">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="webcam"
                  onUserMedia={() => setWebcamReady(true)}
                />
                {imageData && (
                  <img src={imageData} alt="Snapshot" className="snapshot-overlay" />
                )}
              </div>
            )}

            {mode === 'webcam' && (
              <button
                className="btn-primary"
                onClick={handleCapture}
                disabled={!model || !webcamReady || classifying}
              >
                {classifying ? 'Analysing…' : 'Capture & Classify'}
              </button>
            )}

            {mode === 'upload' && imageData && (
              <button
                className="btn-secondary"
                onClick={() => { setImageData(null); setPredictions([]); }}
              >
                Clear image
              </button>
            )}
          </div>

          {/* RIGHT: results panel */}
          <div className="panel results-panel">
            {modelLoading && (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading MobileNet…</p>
                <p className="hint-small">First load may take a few seconds</p>
              </div>
            )}

            {modelError && (
              <div className="error-state">
                <p>⚠ Model failed to load</p>
                <code>{modelError}</code>
              </div>
            )}

            {!modelLoading && !modelError && !predictions.length && !classifying && (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <p>No image analysed yet.</p>
                <p className="hint-small">Drop an image or capture from camera.</p>
              </div>
            )}

            {classifying && (
              <div className="loading-state">
                <div className="spinner" />
                <p>Running inference…</p>
              </div>
            )}

            {!classifying && predictions.length > 0 && (
              <div className="predictions">
                <div className={`verdict ${isPositive ? 'positive' : 'uncertain'}`}>
                  <span className="verdict-icon">{isPositive ? '✓' : '?'}</span>
                  <div>
                    <p className="verdict-label">{isPositive ? 'High confidence' : 'Low confidence'}</p>
                    <p className="verdict-class">{top.className.split(',')[0]}</p>
                  </div>
                  <span className="verdict-pct">{(top.probability * 100).toFixed(1)}%</span>
                </div>

                <h3 className="pred-heading">Top {TOP_K} predictions</h3>
                <ul className="pred-list">
                  {predictions.map((p, i) => (
                    <li key={p.className} className="pred-item" style={{ '--i': i }}>
                      <div className="pred-top-row">
                        <span className="pred-rank">#{i + 1}</span>
                        <span className="pred-name">{p.className.split(',')[0]}</span>
                        <span className="pred-prob">{(p.probability * 100).toFixed(2)}%</span>
                      </div>
                      <ConfidenceBar probability={p.probability} index={i} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Powered by TensorFlow.js · MobileNet v2 · 1000 ImageNet classes</p>
      </footer>
    </div>
  );
}
