import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import Webcam from 'react-webcam';
import './DecisionComponent.css'; // Import your CSS file

function DecisionComponent() {
  const [model, setModel] = useState(null);
  const [classificationResult, setClassificationResult] = useState(null);
  const webcamRef = useRef(null);
  const [imageData, setImageData] = useState(null);

  useEffect(() => {
    async function loadModel() {
      const loadedModel = await mobilenet.load();
      setModel(loadedModel);
    }

    loadModel();
  }, []);

  async function makeDecision(imageData) {
    if (model) {
      const imageElement = new Image();
      imageElement.src = imageData;
      await imageElement.decode();

      const predictions = await model.classify(imageElement);
      const topPrediction = predictions[0];
      setClassificationResult(topPrediction);

      if (topPrediction.probability > 0.8) {
        console.log('Positive decision:', topPrediction.className);
      } else {
        console.log('Negative decision');
      }
    }
  }

  function handleWebcamCapture() {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImageData(imageSrc);
      makeDecision(imageSrc);
    }
  }

function handleFileInputChange(event) {
  const selectedFile = event.target.files[0];

  if (selectedFile) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const imageSrc = e.target.result;
      setImageData(imageSrc);
      makeDecision(imageSrc);
      
      // Stop the webcam when a file is chosen
      if (webcamRef.current) {
        webcamRef.current.video.srcObject.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };

    reader.readAsDataURL(selectedFile);
  }
}

  return (
    <div className="decision-container">
      <header className="header">
        <div className="logo-container">
          <img src="google-logo.png" alt="Google Logo" className="logo" />
        </div>
        <h1 className="title">Decision Maker</h1>
      </header>

      <main className="main-content">
        <div className="button-container">
          <button className="capture-button" onClick={handleWebcamCapture}>Capture from Webcam</button>
          <label className="file-input-label">
            <input type="file" accept="image/*" onChange={handleFileInputChange} />
            Choose File
          </label>
        </div>

        {classificationResult && (
          <div className="result-container">
            <h2>Classification Result</h2>
            <p>Class: {classificationResult.className}</p>
            <p>Probability: {classificationResult.probability.toFixed(4)}</p>
          </div>
        )}

        {imageData && (
          <div className="image-container">
            <h2>Captured Image</h2>
            <img src={imageData} alt="Captured" className="captured-image" />
          </div>
        )}

        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="webcam" />
      </main>

      <footer className="footer">
        <p>&copy; 2023 Decision Maker</p>
      </footer>
    </div>
  );
}

export default DecisionComponent;
