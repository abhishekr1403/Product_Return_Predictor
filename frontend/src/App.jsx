import { useState } from 'react';
import './index.css';
import { predictReturn } from './api';
import PredictionForm from './components/PredictionForm';
import ResultPanel from './components/ResultPanel';
import ModelInfoBanner from './components/ModelInfoBanner';

export default function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (payload) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await predictReturn(payload);
      setResult(data);
      setTimeout(() => {
        document.getElementById('result-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Prediction failed. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="app-bg" />

      <div className="app-wrapper">
        {/* Header */}
        <header className="header">
          <div className="header-brand">
            <div className="header-logo">📦</div>
            <span className="header-title">ReturnIQ</span>
          </div>
          <span className="header-badge">ML-Powered · v1.0</span>
        </header>

        {/* Hero */}
        <section className="hero">
          <div className="hero-eyebrow">AI Return Predictor</div>
          <h1 className="hero-title">
            Know Before You Ship<br />
            <span>Return Risk, Predicted.</span>
          </h1>
          <p className="hero-desc">
            Fill in your product and order details below. Our machine learning model analyses
            dozens of signals to estimate the probability that this order will be returned.
          </p>
        </section>



        {/* Form */}
        <PredictionForm onSubmit={handleSubmit} isLoading={isLoading} />

        {/* Error */}
        {error && (
          <div className="error-banner" role="alert">
            <span className="error-icon">⚠️</span>
            <div className="error-text">
              <strong>Prediction Error</strong>
              {error}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div id="result-anchor" style={{ marginTop: 40 }}>
            <ResultPanel result={result} onReset={handleReset} />
          </div>
        )}

        {/* Model info banner */}
        <ModelInfoBanner />

        {/* Footer */}
        <footer className="footer">
          <p>ReturnIQ · Product Return Predictor · Built with React & FastAPI</p>
          <p style={{ marginTop: 6 }}>
            For more information{' '}
            <a href="https://github.com/abhishekr1403/Product_Return_Predictor" target="_blank" rel="noreferrer">
              Abhishek - GitHub Profile
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
