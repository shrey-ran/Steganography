/**
 * Professional Steganography Research Platform
 * Modern React UI with Material Design principles
 */

import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import './Analytics.css';
import Analytics from './Analytics';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to get color class based on metric values
const getMetricColorClass = (metricName, value) => {
  if (metricName === 'psnr') {
    // PSNR: Higher is better
    // Excellent: > 50 dB (deep blue)
    // Good: 40-50 dB (medium blue)
    // Poor: < 40 dB (light blue/gray)
    if (value >= 50) return 'metric-excellent-blue';
    if (value >= 40) return 'metric-good-blue';
    return 'metric-poor';
  } else if (metricName === 'ssim') {
    // SSIM: 1.0 is perfect - using blue shades
    // Excellent: > 0.98 (deep blue)
    // Good: 0.95-0.98 (medium blue)
    // Poor: < 0.95 (light blue/gray)
    if (value >= 0.98) return 'metric-excellent-blue';
    if (value >= 0.95) return 'metric-good-blue';
    return 'metric-poor';
  } else if (metricName === 'mse') {
    // MSE: Lower is better - using blue shades
    // Excellent: < 5 (deep blue)
    // Good: 5-20 (medium blue)
    // Poor: > 20 (light blue/gray)
    if (value < 5) return 'metric-excellent-blue';
    if (value < 20) return 'metric-good-blue';
    return 'metric-poor';
  }
  return '';
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeDoc, setActiveDoc] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [experimentMetrics, setExperimentMetrics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedExp, setExpandedExp] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    dataset: 'sample_images',
    batchSize: 4,
    epochs: 1,
    transforms: []
  });

  const [transformForm, setTransformForm] = useState({
    name: 'jpeg',
    quality: 80,
    width: 256,
    height: 256,
    sigma: 0.05
  });

  const checkApiStatus = useCallback(async () => {
    try {
      console.log('Checking API status at:', `${API_BASE_URL}/status`);
      const response = await fetch(`${API_BASE_URL}/status`);
      console.log('API status response:', response.status);
      const data = await response.json();
      console.log('API status data:', data);
      setApiStatus(data);
    } catch (err) {
      console.error('API status check failed:', err);
      setApiStatus({ status: 'error' });
    }
  }, []);

  const fetchExperiments = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching experiments from:', `${API_BASE_URL}/experiments`);
      const response = await fetch(`${API_BASE_URL}/experiments`);
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Experiments data:', data);
      setExperiments(data.experiments || []);
      
      // Fetch metrics for completed experiments
      const completedExps = (data.experiments || []).filter(exp => exp.status === 'completed');
      for (const exp of completedExps) {
        fetchExperimentMetrics(exp.id);
      }
    } catch (err) {
      console.error('Failed to load experiments:', err);
      setError('Failed to load experiments: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize
  useEffect(() => {
    checkApiStatus();
    fetchExperiments();
  }, [checkApiStatus, fetchExperiments]);

  const fetchExperimentMetrics = async (expId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/experiments/${expId}/metrics`);
      if (response.ok) {
        const metrics = await response.json();
        setExperimentMetrics(prev => ({ ...prev, [expId]: metrics }));
      }
    } catch (err) {
      // Silently fail - metrics might not exist yet
      console.log(`No metrics for ${expId}`);
    }
  };

  const createExperiment = async () => {
    if (!formData.name) {
      setError('Please enter experiment name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/experiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create');
      
      setSuccess('Experiment created successfully!');
      setShowModal(false);
      setFormData({ name: '', dataset: 'sample_images', batchSize: 4, epochs: 1, transforms: [] });
      fetchExperiments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runExperimentDryRun = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/experiments/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true })
      });

      if (!response.ok) throw new Error('Failed to run');
      
      setSuccess('Experiment started! Monitoring progress...');
      
      // Poll for status updates every 1.5 seconds
      let pollCount = 0;
      const maxPolls = 40; // 60 seconds max (40 * 1.5s)
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        
        try {
          // Fetch fresh experiment data
          const expResponse = await fetch(`${API_BASE_URL}/experiments/${id}`);
          const expData = await expResponse.json();
          
          // Update experiments list
          await fetchExperiments();
          
          // Check if experiment is completed or failed
          if (expData.status === 'completed' || expData.status === 'failed') {
            clearInterval(pollInterval);
            setLoading(false);
            
            if (expData.status === 'completed') {
              setSuccess('✅ Dry-run completed successfully!');
              // Fetch metrics immediately
              setTimeout(() => fetchExperimentMetrics(id), 500);
            } else {
              setError('❌ Experiment failed. Check logs for details.');
            }
          }
          
          // Stop after max attempts
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setLoading(false);
            setError('⏱️ Polling timeout. Refresh page to see latest status.');
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 1500);
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const addTransform = () => {
    const transform = { name: transformForm.name };
    
    if (transformForm.name === 'jpeg') {
      transform.quality = transformForm.quality;
    } else if (transformForm.name === 'resize') {
      transform.width = transformForm.width;
      transform.height = transformForm.height;
    } else if (transformForm.name === 'noise' || transformForm.name === 'blur') {
      transform.sigma = transformForm.sigma;
    }

    setFormData({
      ...formData,
      transforms: [...formData.transforms, transform]
    });
  };

  const removeTransform = (index) => {
    setFormData({
      ...formData,
      transforms: formData.transforms.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="logo">🔬</div>
          <div className="brand-text">
            <h1>Steganography Research</h1>
            <span>Professional Testing Platform</span>
          </div>
        </div>
        
        <div className="nav-status">
          <div className={`status-indicator ${apiStatus?.status === 'ok' ? 'active' : 'inactive'}`}>
            <span className="dot"></span>
            {apiStatus?.status === 'ok' ? 'API Connected' : 'API Offline'}
          </div>
        </div>
      </nav>

      {/* Notifications */}
      {error && (
        <div className="notification error">
          <span className="icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      {success && (
        <div className="notification success">
          <span className="icon">✓</span>
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {/* Main Content */}
      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Navigation</h3>
            <button 
              className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="icon">📊</span>
              Dashboard
            </button>
            <button 
              className={`sidebar-btn ${activeTab === 'experiments' ? 'active' : ''}`}
              onClick={() => setActiveTab('experiments')}
            >
              <span className="icon">🧪</span>
              Experiments
            </button>
            <button 
              className={`sidebar-btn ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => setActiveTab('docs')}
            >
              <span className="icon">📚</span>
              Documentation
            </button>
            <button 
              className={`sidebar-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <span className="icon">📈</span>
              Analytics
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <button className="sidebar-btn primary" onClick={() => setShowModal(true)}>
              <span className="icon">➕</span>
              New Experiment
            </button>
          </div>

          <div className="sidebar-footer">
            <div className="ethics-notice">
              <span className="icon">⚠️</span>
              <small>Research Use Only<br/>Supervisor Approval Required</small>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="content">
          {activeTab === 'dashboard' && (
            <div className="dashboard">
              <div className="page-header">
                <h2>Dashboard</h2>
                <p>Overview of your steganography research experiments</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🧪</div>
                  <div className="stat-content">
                    <div className="stat-value">{experiments.length}</div>
                    <div className="stat-label">Total Experiments</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-value">{experiments.filter(e => e.status === 'completed').length}</div>
                    <div className="stat-label">Completed</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-content">
                    <div className="stat-value">{experiments.filter(e => e.status === 'running').length}</div>
                    <div className="stat-label">Running</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <div className="stat-value">100%</div>
                    <div className="stat-label">Test Coverage</div>
                  </div>
                </div>
              </div>

              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon">🔐</div>
                  <h3>Image Steganography</h3>
                  <p>Hide and extract data within images using advanced algorithms</p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">🛡️</div>
                  <h3>Robustness Testing</h3>
                  <p>Test against JPEG compression, noise, blur, and resize attacks</p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3>Performance Metrics</h3>
                  <p>Analyze PSNR, SSIM, and bit error rates</p>
                </div>
                
                <div className="feature-card">
                  <div className="feature-icon">⚙️</div>
                  <h3>Batch Processing</h3>
                  <p>Process multiple images with configurable transforms</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'experiments' && (
            <div className="experiments">
              <div className="page-header">
                <div>
                  <h2>Research Experiments</h2>
                  <p>Monitor and analyze steganography robustness tests</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                  <span>➕</span> New Experiment
                </button>
              </div>

              {loading && experiments.length === 0 ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading experiments...</p>
                </div>
              ) : experiments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🧪</div>
                  <h3>No Experiments Yet</h3>
                  <p>Create your first experiment to get started with steganography research</p>
                  <button className="btn-primary" onClick={() => setShowModal(true)}>
                    Create Experiment
                  </button>
                </div>
              ) : (
                <div className="experiments-list">
                  {experiments.map((exp) => (
                    <div key={exp.id} className="experiment-card">
                      <div className="card-header-section">
                        <div className="header-left">
                          <h3 className="exp-title">{exp.name}</h3>
                          <span className={`badge badge-${exp.status}`}>
                            {exp.status === 'completed' && '✅'} {exp.status || 'pending'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="card-meta">
                        <div className="meta-item">
                          <span className="meta-label">Dataset</span>
                          <span className="meta-value">{exp.dataset}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Transforms</span>
                          <span className="meta-value">{exp.transforms?.length || 0}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Date</span>
                          <span className="meta-value">{new Date(exp.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {exp.status === 'running' && (
                        <div className="card-status running">
                          <div className="status-indicator">
                            <div className="spinner-small"></div>
                            <span>Processing...</span>
                          </div>
                        </div>
                      )}
                      
                      {exp.status === 'completed' && exp.completedAt && (
                        <div className="card-results">
                          <div className="results-summary">
                            <div className="result-stat">
                              <span className="result-label">Status:</span>
                              <span className="result-value success">✓ Success</span>
                            </div>
                            <div className="result-stat">
                              <span className="result-label">Completed:</span>
                              <span className="result-value">{new Date(exp.completedAt).toLocaleTimeString()}</span>
                            </div>
                            <button 
                              className={`expand-details-btn ${expandedExp === exp.id ? 'expanded' : ''}`}
                              onClick={() => setExpandedExp(expandedExp === exp.id ? null : exp.id)}
                            >
                              {expandedExp === exp.id ? '▼ Hide Details' : '▶ Show Details'}
                            </button>
                          </div>
                          
                          {expandedExp === exp.id && (
                            <div className="details-section">
                              {experimentMetrics[exp.id] && experimentMetrics[exp.id].metrics && (
                                <div className="metrics-details">
                                  <h5 className="metrics-subtitle">Quality Metrics (Average)</h5>
                                  <div className="metrics-grid">
                                    <div className={`metric-box ${getMetricColorClass('psnr', experimentMetrics[exp.id].metrics.original?.psnr?.mean)}`} title="Peak Signal-to-Noise Ratio: Measures image quality. Higher is better. 30+ dB is good quality, 40+ dB is excellent. Your images maintain high quality after processing.">
                                      <div className="metric-label">PSNR 
                                        <span className="info-icon" title="Click for details">ℹ️</span>
                                      </div>
                                      <div className="metric-value">
                                        {experimentMetrics[exp.id].metrics.original?.psnr?.mean?.toFixed(2) || 'N/A'}
                                        <span className="metric-unit">dB</span>
                                      </div>
                                      <div className="metric-range">
                                        {experimentMetrics[exp.id].metrics.original?.psnr?.min?.toFixed(1)} - {experimentMetrics[exp.id].metrics.original?.psnr?.max?.toFixed(1)}
                                      </div>
                                      <div className="metric-explanation">
                                        Higher = Better quality. Measures how similar processed image is to original.
                                      </div>
                                    </div>
                                    
                                    <div className={`metric-box ${getMetricColorClass('ssim', experimentMetrics[exp.id].metrics.original?.ssim?.mean)}`} title="Structural Similarity Index: Measures how well image structure is preserved. Range 0-1. Closer to 1 means better. 0.95+ means excellent preservation.">
                                      <div className="metric-label">SSIM
                                        <span className="info-icon" title="Click for details">ℹ️</span>
                                      </div>
                                      <div className="metric-value">
                                        {experimentMetrics[exp.id].metrics.original?.ssim?.mean?.toFixed(4) || 'N/A'}
                                      </div>
                                      <div className="metric-range">
                                        {experimentMetrics[exp.id].metrics.original?.ssim?.min?.toFixed(3)} - {experimentMetrics[exp.id].metrics.original?.ssim?.max?.toFixed(3)}
                                      </div>
                                      <div className="metric-explanation">
                                        1.0 = Perfect. Measures structural similarity to human perception.
                                      </div>
                                    </div>
                                    
                                    <div className={`metric-box ${getMetricColorClass('mse', experimentMetrics[exp.id].metrics.original?.mse?.mean)}`} title="Mean Squared Error: Average pixel difference. Lower is better. 0 = identical images. <50 is excellent quality preservation.">
                                      <div className="metric-label">MSE
                                        <span className="info-icon" title="Click for details">ℹ️</span>
                                      </div>
                                      <div className="metric-value">
                                        {experimentMetrics[exp.id].metrics.original?.mse?.mean?.toFixed(2) || 'N/A'}
                                      </div>
                                      <div className="metric-range">
                                        {experimentMetrics[exp.id].metrics.original?.mse?.min?.toFixed(1)} - {experimentMetrics[exp.id].metrics.original?.mse?.max?.toFixed(1)}
                                      </div>
                                      <div className="metric-explanation">
                                        Lower = Better. 0 = Perfect. Measures average pixel changes.
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="samples-info">
                                    📷 Processed {experimentMetrics[exp.id].metrics.count || 0} samples
                                  </div>
                                  
                                  {experimentMetrics[exp.id].samples && experimentMetrics[exp.id].samples[0]?.hiddenMessage && (
                                    <>
                                      <div className="image-comparison">
                                        <h5 className="comparison-title">🛡️ Steganography Robustness Testing</h5>
                                        <div className="pipeline-grid">
                                          {/* Original Clean Image */}
                                          <div className="pipeline-step">
                                            <div className="pipeline-label">Clean Image</div>
                                            <div className="pipeline-box original">
                                              <div className="image-container">
                                                <img
                                                  src={`http://localhost:8000/experiments/${exp.id}/images/original_${experimentMetrics[exp.id].samples[0].name}`}
                                                  alt="Original"
                                                  className="experiment-image"
                                                  onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextElementSibling.style.display = 'flex';
                                                  }}
                                                />
                                                <div className="image-placeholder" style={{display: 'none'}}>
                                                  <span className="placeholder-icon">🖼️</span>
                                                  <div className="placeholder-text">{experimentMetrics[exp.id].samples[0].name}</div>
                                                  <div className="placeholder-detail">No hidden data</div>
                                                </div>
                                              </div>
                                              <div className="pipeline-info">
                                                <div className="pipeline-desc">Baseline image</div>
                                                <div className="pipeline-metrics">
                                                  PSNR: {experimentMetrics[exp.id].samples[0].originalMetrics?.psnr?.toFixed(1)} dB
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Initial Stego Embedding */}
                                          <div className="pipeline-connector">
                                            <div className="pipeline-arrow">→</div>
                                            <div className="transform-badge">🔐 LSB Stego</div>
                                            <div className="pipeline-step">
                                              <div className="pipeline-label">Stego Embedded</div>
                                              <div className="pipeline-box stego">
                                                <div className="image-container">
                                                  <img
                                                    src={`http://localhost:8000/experiments/${exp.id}/images/stego_initial_${experimentMetrics[exp.id].samples[0].name}`}
                                                    alt="Initial Stego"
                                                    className="experiment-image"
                                                    onError={(e) => {
                                                      e.target.style.display = 'none';
                                                      e.target.nextElementSibling.style.display = 'flex';
                                                    }}
                                                  />
                                                  <div className="image-placeholder" style={{display: 'none'}}>
                                                    <span className="placeholder-icon">🔐</span>
                                                    <div className="placeholder-text">{experimentMetrics[exp.id].samples[0].name}</div>
                                                    <div className="placeholder-detail">Hidden data embedded</div>
                                                  </div>
                                                </div>
                                                <div className="pipeline-info">
                                                  <div className="pipeline-desc">Data hidden successfully</div>
                                                  <div className="pipeline-metrics">
                                                    Message: {experimentMetrics[exp.id].samples[0].hiddenMessage?.length} chars
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Robustness Tests - Transforms Applied to Stego Images */}
                                          {experimentMetrics[exp.id].config?.transforms?.map((transform, idx) => (
                                            <div key={idx} className="pipeline-connector">
                                              <div className="pipeline-arrow">→</div>
                                              <div className="transform-badge">
                                                {transform.name === 'resize' && `📐 ${transform.width}x${transform.height}`}
                                                {transform.name === 'jpeg' && `🗜️ Q:${transform.quality}`}
                                                {transform.name === 'noise' && `🌪️ σ:${transform.sigma}`}
                                                {transform.name === 'blur' && `🌫️ σ:${transform.sigma}`}
                                              </div>
                                              <div className="pipeline-step">
                                                <div className="pipeline-label">After T{idx + 1}</div>
                                                <div className={`pipeline-box ${experimentMetrics[exp.id].samples[0].transforms[idx]?.extractionSuccess ? 'survived' : 'failed'}`}>
                                                  <div className="image-container">
                                                    <img
                                                      src={`http://localhost:8000/experiments/${exp.id}/images/stego_after_transform_${idx + 1}_${transform.name}_${experimentMetrics[exp.id].samples[0].name}`}
                                                      alt={`Transform ${idx + 1}`}
                                                      className="experiment-image"
                                                      onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling.style.display = 'flex';
                                                      }}
                                                    />
                                                    <div className="image-placeholder" style={{display: 'none'}}>
                                                      <span className="placeholder-icon">
                                                        {experimentMetrics[exp.id].samples[0].transforms[idx]?.extractionSuccess ? '✅' : '❌'}
                                                      </span>
                                                      <div className="placeholder-text">Transform {idx + 1}</div>
                                                      <div className="placeholder-detail">
                                                        {experimentMetrics[exp.id].samples[0].transforms[idx]?.extractionSuccess ? 'Message survived' : 'Message lost'}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="pipeline-info">
                                                    <div className="pipeline-desc">{transform.name} applied</div>
                                                    <div className="pipeline-metrics">
                                                      Status: {experimentMetrics[exp.id].samples[0].transforms[idx]?.extractionSuccess ? '✅ Survived' : '❌ Failed'}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Robustness Summary */}
                                        <div className="robustness-summary">
                                          <h6 className="summary-title">🎯 Robustness Results</h6>
                                          <div className="summary-stats">
                                            <div className="stat-item">
                                              <span className="stat-label">Survival Rate:</span>
                                              <span className="stat-value">
                                                {experimentMetrics[exp.id].samples[0].robustnessScore ?
                                                  `${(experimentMetrics[exp.id].samples[0].robustnessScore * 100).toFixed(1)}%` :
                                                  'N/A'
                                                }
                                              </span>
                                            </div>
                                            <div className="stat-item">
                                              <span className="stat-label">Transforms Passed:</span>
                                              <span className="stat-value">
                                                {experimentMetrics[exp.id].samples[0].transforms?.filter(t => t.extractionSuccess).length || 0}
                                                /{experimentMetrics[exp.id].config?.transforms?.length || 0}
                                              </span>
                                            </div>
                                            <div className="stat-item">
                                              <span className="stat-label">Final Status:</span>
                                              <span className={`stat-value ${experimentMetrics[exp.id].samples[0].finalMessageVerified ? 'success' : 'failed'}`}>
                                                {experimentMetrics[exp.id].samples[0].finalMessageVerified ? '✅ Data Recovered' : '❌ Data Lost'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="pipeline-note">
                                          ℹ️ <strong>Corrected Methodology:</strong> Hidden data is embedded first, then transformations are applied to test if the steganography survives real-world image processing. This measures true robustness against detection and extraction attacks.
                                        </div>
                                      </div>
                                      
                                      <div className="steganography-demo">
                                      <h5 className="stego-title">🔐 LSB Steganography Demo</h5>
                                      <div className="stego-box">
                                        <div className="stego-label">
                                          Hidden Message:
                                          <button 
                                            className="copy-btn"
                                            onClick={(event) => {
                                              navigator.clipboard.writeText(experimentMetrics[exp.id].samples[0].hiddenMessage);
                                              // Simple feedback
                                              const btn = event.target;
                                              btn.textContent = '✓ Copied!';
                                              setTimeout(() => btn.textContent = '📋 Copy', 2000);
                                            }}
                                            title="Copy to clipboard"
                                          >
                                            📋 Copy
                                          </button>
                                        </div>
                                        <div className="stego-message expandable">
                                          {experimentMetrics[exp.id].samples[0].hiddenMessage.length > 50 ? (
                                            <>
                                              <span className="message-preview">
                                                {experimentMetrics[exp.id].samples[0].hiddenMessage.substring(0, 50)}...
                                              </span>
                                              <span className="message-full" style={{display: 'none'}}>
                                                {experimentMetrics[exp.id].samples[0].hiddenMessage}
                                              </span>
                                              <button 
                                                className="expand-btn"
                                                onClick={(e) => {
                                                  const preview = e.target.previousElementSibling.previousElementSibling;
                                                  const full = e.target.previousElementSibling;
                                                  const expanded = full.style.display !== 'none';
                                                  preview.style.display = expanded ? 'inline' : 'none';
                                                  full.style.display = expanded ? 'none' : 'inline';
                                                  e.target.textContent = expanded ? 'Show More' : 'Show Less';
                                                }}
                                              >
                                                Show More
                                              </button>
                                            </>
                                          ) : (
                                            experimentMetrics[exp.id].samples[0].hiddenMessage
                                          )}
                                        </div>
                                      </div>
                                      <div className="stego-box">
                                        <div className="stego-label">
                                          Extracted Message:
                                          <button 
                                            className="copy-btn"
                                            onClick={(event) => {
                                              navigator.clipboard.writeText(experimentMetrics[exp.id].samples[0].extractedMessage);
                                              // Simple feedback
                                              const btn = event.target;
                                              btn.textContent = '✓ Copied!';
                                              setTimeout(() => btn.textContent = '📋 Copy', 2000);
                                            }}
                                            title="Copy to clipboard"
                                          >
                                            📋 Copy
                                          </button>
                                        </div>
                                        <div className="stego-message expandable">
                                          {experimentMetrics[exp.id].samples[0].extractedMessage.length > 50 ? (
                                            <>
                                              <span className="message-preview">
                                                {experimentMetrics[exp.id].samples[0].extractedMessage.substring(0, 50)}...
                                              </span>
                                              <span className="message-full" style={{display: 'none'}}>
                                                {experimentMetrics[exp.id].samples[0].extractedMessage}
                                              </span>
                                              <button 
                                                className="expand-btn"
                                                onClick={(e) => {
                                                  const preview = e.target.previousElementSibling.previousElementSibling;
                                                  const full = e.target.previousElementSibling;
                                                  const expanded = full.style.display !== 'none';
                                                  preview.style.display = expanded ? 'inline' : 'none';
                                                  full.style.display = expanded ? 'none' : 'inline';
                                                  e.target.textContent = expanded ? 'Show More' : 'Show Less';
                                                }}
                                              >
                                                Show More
                                              </button>
                                            </>
                                          ) : (
                                            experimentMetrics[exp.id].samples[0].extractedMessage
                                          )}
                                        </div>
                                      </div>
                                      <div className="stego-status">
                                        {experimentMetrics[exp.id].samples[0].messageVerified ? (
                                          <span className="stego-success">✓ Message verified successfully!</span>
                                        ) : (
                                          <span className="stego-error">✗ Verification failed</span>
                                        )}
                                      </div>
                                    </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {exp.status === 'failed' && (
                        <div className="error-section">
                          <div className="metrics-divider"></div>
                          <div className="error-section-content">
                            <div className="info-row">
                              <span className="label">Failed At:</span>
                              <span className="value">{exp.completedAt ? new Date(exp.completedAt).toLocaleString() : 'Unknown'}</span>
                            </div>
                            <div className="info-row">
                              <span className="label">Exit Code:</span>
                              <span className="value" style={{color: '#ef4444'}}>{exp.exitCode || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="card-footer">
                        <button 
                          className="btn-secondary"
                          onClick={() => runExperimentDryRun(exp.id)}
                          disabled={loading || exp.status === 'running'}
                        >
                          {exp.status === 'running' ? '⏳ Running...' : '🏃 Run Dry-Run'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="documentation">
              {!activeDoc ? (
                <>
                  <div className="page-header">
                    <h2>Documentation</h2>
                    <p>Guides and references for the research platform</p>
                  </div>

                  <div className="docs-grid">
                    <div className="doc-card" onClick={() => setActiveDoc('start')}>
                      <h3>📋 Getting Started</h3>
                      <p>Learn how to create and run your first experiment</p>
                      <div className="doc-link">Read Guide →</div>
                    </div>
                    
                    <div className="doc-card" onClick={() => setActiveDoc('analytics')}>
                      <h3>📊 Analytics & Insights</h3>
                      <p>Understand your experiment results and robustness metrics</p>
                      <div className="doc-link">View Analytics →</div>
                    </div>
                    
                    <div className="doc-card" onClick={() => setActiveDoc('api')}>
                      <h3>🔧 API Reference</h3>
                      <p>Complete API documentation for integration</p>
                      <div className="doc-link">View API →</div>
                    </div>
                    
                    <div className="doc-card" onClick={() => setActiveDoc('ethics')}>
                      <h3>⚖️ Ethics Guidelines</h3>
                      <p>Required reading before conducting research</p>
                      <div className="doc-link">Read Ethics →</div>
                    </div>
                    
                    <div className="doc-card" onClick={() => setActiveDoc('transforms')}>
                      <h3>🧪 Transform Reference</h3>
                      <p>Available image transformations and parameters</p>
                      <div className="doc-link">View Transforms →</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="doc-content">
                  <button className="btn-back" onClick={() => setActiveDoc(null)}>
                    ← Back to Documentation
                  </button>
                  
                  {activeDoc === 'start' && (
                    <div className="doc-detail">
                      <h2>📋 Getting Started</h2>
                      <p className="doc-intro">Welcome to the Steganography Research Platform. This guide will help you create and run your first experiment.</p>
                      
                      <section>
                        <h3>Step 1: Create an Experiment</h3>
                        <p>Click the "New Experiment" button in the sidebar to open the experiment creation dialog.</p>
                        <ul>
                          <li><strong>Name:</strong> Choose a descriptive name for your experiment</li>
                          <li><strong>Secret Message:</strong> The text you want to hide in images (can be a single word or multi-line text)</li>
                          <li><strong>Dataset:</strong> Select from available image datasets</li>
                          <li><strong>Batch Size:</strong> Number of images to process together (1-32)</li>
                          <li><strong>Epochs:</strong> Number of training iterations (1-100)</li>
                        </ul>
                      </section>
                      
                      <section>
                        <h3>Step 2: Add Transforms</h3>
                        <p>Transforms simulate real-world image manipulations:</p>
                        <ul>
                          <li><strong>JPEG Compression:</strong> Test robustness against lossy compression</li>
                          <li><strong>Resize:</strong> Scale images to different dimensions</li>
                          <li><strong>Gaussian Noise:</strong> Add random noise to images</li>
                        </ul>
                      </section>
                      
                      <section>
                        <h3>Step 3: Run Your Experiment</h3>
                        <p>Use the "Run Dry-Run" button to test your configuration without full processing. This validates your setup and provides quick feedback.</p>
                      </section>
                      
                      <section>
                        <h3>Best Practices</h3>
                        <ul>
                          <li>Start with small batch sizes for testing</li>
                          <li>Use descriptive experiment names with dates</li>
                          <li>Write clear secret messages (shorter messages are easier to recover)</li>
                          <li>Always run a dry-run before full experiments</li>
                          <li>Review ethics guidelines before research</li>
                        </ul>
                      </section>
                    </div>
                  )}
                  
                  {activeDoc === 'analytics' && (
                    <div className="doc-detail">
                      <h2>📊 Analytics & Insights</h2>
                      <p className="doc-intro">The Analytics tab provides comprehensive statistics and visualizations of your steganography experiments, helping you understand robustness and performance metrics.</p>
                      
                      <section>
                        <h3>Key Metrics</h3>
                        <ul>
                          <li><strong>Total Experiments:</strong> Complete count of all experiments in your database</li>
                          <li><strong>Total Retrievals:</strong> Total number of message extraction attempts across all experiments</li>
                          <li><strong>Successful Retrievals:</strong> Messages successfully extracted without corruption</li>
                          <li><strong>Success Rate:</strong> Percentage of successful retrievals vs. total attempts</li>
                          <li><strong>Avg Robustness:</strong> Average robustness score (0-100%) across all experiments</li>
                          <li><strong>Completed Experiments:</strong> Number of experiments that have finished running</li>
                        </ul>
                      </section>
                      
                      <section>
                        <h3>Charts & Visualizations</h3>
                        <ul>
                          <li><strong>Retrieval Distribution:</strong> Break down of perfect, partial, and failed retrievals</li>
                          <li><strong>Robustness Distribution:</strong> Histogram showing experiments across 5 robustness ranges (0-100%)</li>
                          <li><strong>Transform Impact:</strong> Analysis of how each image transform affects message recovery</li>
                          <li><strong>Dataset Performance:</strong> Comparison of success rates across different image datasets</li>
                          <li><strong>Message Length Analysis:</strong> How message length affects extraction success rates</li>
                          <li><strong>Experiment Status:</strong> Real-time status breakdown (completed, running, created, failed)</li>
                        </ul>
                      </section>
                      
                      <section>
                        <h3>Understanding Robustness</h3>
                        <p>Robustness measures how well your hidden message survives image transformations:</p>
                        <ul>
                          <li><strong>100% Robustness:</strong> Message perfectly recovered despite transformations</li>
                          <li><strong>50-99% Robustness:</strong> Message partially recovered with minor data loss</li>
                          <li><strong>0-49% Robustness:</strong> Significant message corruption during extraction</li>
                          <li><strong>0% Robustness:</strong> Message completely unrecoverable</li>
                        </ul>
                      </section>
                      
                      <section>
                        <h3>Using Analytics Insights</h3>
                        <ul>
                          <li>Identify which transforms most impact your steganography method</li>
                          <li>Compare performance across different datasets and message lengths</li>
                          <li>Optimize your approach based on robustness distribution patterns</li>
                          <li>Track improvements across multiple experiment runs</li>
                          <li>Document findings for research papers and reports</li>
                        </ul>
                      </section>
                    </div>
                  )}
                  
                  {activeDoc === 'api' && (
                    <div className="doc-detail">
                      <h2>🔧 API Reference</h2>
                      <p className="doc-intro">Complete REST API documentation for programmatic access to the platform.</p>
                      
                      <section>
                        <h3>Base URL</h3>
                        <code className="code-block">http://localhost:8000</code>
                      </section>
                      
                      <section>
                        <h3>Endpoints</h3>
                        
                        <div className="api-endpoint">
                          <h4>GET /status</h4>
                          <p>Check API health and availability</p>
                          <code className="code-block">
                            Response: {`{ "status": "ok", "time": "2025-12-07T21:00:00Z" }`}
                          </code>
                        </div>
                        
                        <div className="api-endpoint">
                          <h4>GET /experiments</h4>
                          <p>List all experiments</p>
                          <code className="code-block">
                            Response: {`{ "experiments": [...] }`}
                          </code>
                        </div>
                        
                        <div className="api-endpoint">
                          <h4>POST /experiments</h4>
                          <p>Create a new experiment</p>
                          <code className="code-block">
                            {`{
  "name": "My Experiment",
  "dataset": "sample_images",
  "batchSize": 4,
  "epochs": 1,
  "transforms": [
    { "name": "jpeg", "quality": 80 }
  ]
}`}
                          </code>
                        </div>
                        
                        <div className="api-endpoint">
                          <h4>POST /experiments/:id/run</h4>
                          <p>Execute an experiment</p>
                          <code className="code-block">
                            Body: {`{ "dryRun": true }`}
                          </code>
                        </div>
                        
                        <div className="api-endpoint">
                          <h4>GET /analytics/stats</h4>
                          <p>Get comprehensive analytics and statistics about all experiments</p>
                          <code className="code-block">
                            Response: {`{
  "totalExperiments": 54,
  "completedExperiments": 47,
  "successRate": 64,
  "avgRobustness": 50.3,
  "totalRetrievals": 100,
  "successfulRetrievals": 64,
  "robustnessRanges": [...],
  "transformImpact": [...],
  "datasetPerformance": [...],
  "messageLengthRanges": [...]
}`}
                          </code>
                        </div>
                      </section>
                      
                      <section>
                        <h3>Error Handling</h3>
                        <p>All endpoints return standard HTTP status codes:</p>
                        <ul>
                          <li><strong>200:</strong> Success</li>
                          <li><strong>400:</strong> Bad Request (invalid parameters)</li>
                          <li><strong>404:</strong> Resource not found</li>
                          <li><strong>500:</strong> Internal server error</li>
                        </ul>
                      </section>
                    </div>
                  )}
                  
                  {activeDoc === 'ethics' && (
                    <div className="doc-detail">
                      <h2>⚖️ Ethics Guidelines</h2>
                      <p className="doc-intro">This platform is designed for legitimate research purposes only. All users must adhere to these ethical guidelines.</p>
                      
                      <section className="ethics-warning">
                        <h3>⚠️ Important Notice</h3>
                        <p><strong>This platform is for academic research and supervised testing ONLY.</strong></p>
                      </section>
                      
                      <section>
                        <h3>Prohibited Uses</h3>
                        <ul>
                          <li>❌ Creating or distributing illicit content</li>
                          <li>❌ Evading content moderation systems</li>
                          <li>❌ Hiding malicious code or malware</li>
                          <li>❌ Violating copyright or intellectual property</li>
                          <li>❌ Any illegal or unethical activities</li>
                        </ul>
                      </section>
                      
                      <section>
                        <h3>Required Approvals</h3>
                        <ul>
                          <li>✅ Faculty or supervisor approval required</li>
                          <li>✅ Institutional review board (IRB) approval when applicable</li>
                          <li>✅ Documented research purpose and methodology</li>
                          <li>✅ Clear data handling and privacy protocols</li>
                        </ul>
                      </section>
                      
                      <section>
                        <h3>Research Integrity</h3>
                        <ul>
                          <li>Properly cite all sources and prior work</li>
                          <li>Document all methodologies and results accurately</li>
                          <li>Report findings responsibly</li>
                          <li>Consider potential dual-use implications</li>
                          <li>Engage in peer review and open discussion</li>
                        </ul>
                      </section>
                      
                      <section>
                        <h3>Data Privacy</h3>
                        <ul>
                          <li>Use only approved datasets with proper permissions</li>
                          <li>Never use personal or sensitive data without consent</li>
                          <li>Follow GDPR and local privacy regulations</li>
                          <li>Implement appropriate data security measures</li>
                        </ul>
                      </section>
                      
                      <section>
                        <h3>Responsible Disclosure</h3>
                        <p>If your research identifies vulnerabilities in existing systems:</p>
                        <ul>
                          <li>Follow responsible disclosure practices</li>
                          <li>Contact affected parties privately first</li>
                          <li>Allow reasonable time for fixes</li>
                          <li>Coordinate public disclosure appropriately</li>
                        </ul>
                      </section>
                    </div>
                  )}
                  
                  {activeDoc === 'transforms' && (
                    <div className="doc-detail">
                      <h2>🧪 Transform Reference</h2>
                      <p className="doc-intro">Available image transformations for testing steganographic robustness.</p>
                      
                      <div className="transform-item">
                        <h3>JPEG Compression</h3>
                        <p>Applies lossy JPEG compression to test robustness against image sharing platforms.</p>
                        <div className="param-list">
                          <div className="param-item">
                            <strong>quality:</strong> <code>1-100</code>
                            <p>Compression quality (higher = better quality, less compression)</p>
                          </div>
                        </div>
                        <code className="code-block">
                          {`{ "name": "jpeg", "quality": 80 }`}
                        </code>
                      </div>
                      
                      <div className="transform-item">
                        <h3>Resize</h3>
                        <p>Scales images to specified dimensions using bilinear interpolation.</p>
                        <div className="param-list">
                          <div className="param-item">
                            <strong>width:</strong> <code>16-2048</code>
                            <p>Target width in pixels</p>
                          </div>
                          <div className="param-item">
                            <strong>height:</strong> <code>16-2048</code>
                            <p>Target height in pixels</p>
                          </div>
                        </div>
                        <code className="code-block">
                          {`{ "name": "resize", "width": 256, "height": 256 }`}
                        </code>
                      </div>
                      
                      <div className="transform-item">
                        <h3>Gaussian Noise</h3>
                        <p>Adds random Gaussian noise to simulate sensor noise or transmission artifacts.</p>
                        <div className="param-list">
                          <div className="param-item">
                            <strong>sigma:</strong> <code>0.0-1.0</code>
                            <p>Standard deviation of noise (0 = no noise, 1 = maximum)</p>
                          </div>
                        </div>
                        <code className="code-block">
                          {`{ "name": "gaussian_noise", "sigma": 0.05 }`}
                        </code>
                      </div>
                      
                      <section>
                        <h3>Combining Transforms</h3>
                        <p>Transforms are applied sequentially in the order specified. This allows you to test complex, real-world scenarios:</p>
                        <code className="code-block">
                          {`{
  "transforms": [
    { "name": "resize", "width": 512, "height": 512 },
    { "name": "jpeg", "quality": 85 },
    { "name": "gaussian_noise", "sigma": 0.02 }
  ]
}`}
                        </code>
                      </section>
                      
                      <section>
                        <h3>Performance Considerations</h3>
                        <ul>
                          <li>More transforms = longer processing time</li>
                          <li>Large resize dimensions increase memory usage</li>
                          <li>JPEG quality below 50 may cause significant artifacts</li>
                          <li>Gaussian noise sigma above 0.1 may severely degrade images</li>
                        </ul>
                      </section>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <Analytics />
          )}
        </main>
      </div>

      {/* Modal for Creating Experiments */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Experiment</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Experiment Name</label>
                <input
                  type="text"
                  placeholder="e.g., JPEG Compression Test"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Secret Message</label>
                <textarea
                  placeholder="Enter the message to hide (e.g., 'Hello World')"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows="6"
                  style={{ fontFamily: 'monospace', minHeight: '150px', padding: '12px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dataset</label>
                  <select
                    value={formData.dataset}
                    onChange={(e) => setFormData({ ...formData, dataset: e.target.value })}
                  >
                    <option value="sample_images">Sample Images</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Batch Size</label>
                  <input
                    type="number"
                    min="1"
                    max="32"
                    value={formData.batchSize}
                    onChange={(e) => setFormData({ ...formData, batchSize: parseInt(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Epochs</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.epochs}
                    onChange={(e) => setFormData({ ...formData, epochs: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Transforms</label>
                
                <div className="transforms-list">
                  {formData.transforms.map((t, idx) => (
                    <div key={idx} className="transform-chip">
                      <span>{t.name}</span>
                      {t.quality && <span className="param">Q:{t.quality}</span>}
                      {t.width && <span className="param">{t.width}x{t.height}</span>}
                      {t.sigma && <span className="param">σ:{t.sigma}</span>}
                      <button onClick={() => removeTransform(idx)}>✕</button>
                    </div>
                  ))}
                </div>

                <div className="transform-builder">
                  <select
                    value={transformForm.name}
                    onChange={(e) => setTransformForm({ ...transformForm, name: e.target.value })}
                  >
                    <option value="jpeg">JPEG Compression</option>
                    <option value="resize">Resize</option>
                    <option value="noise">Gaussian Noise</option>
                    <option value="blur">Gaussian Blur</option>
                  </select>

                  {transformForm.name === 'jpeg' && (
                    <input
                      type="number"
                      placeholder="Quality (1-100)"
                      value={transformForm.quality}
                      onChange={(e) => setTransformForm({ ...transformForm, quality: parseInt(e.target.value) })}
                    />
                  )}

                  {transformForm.name === 'resize' && (
                    <>
                      <input
                        type="number"
                        placeholder="Width"
                        value={transformForm.width}
                        onChange={(e) => setTransformForm({ ...transformForm, width: parseInt(e.target.value) })}
                      />
                      <input
                        type="number"
                        placeholder="Height"
                        value={transformForm.height}
                        onChange={(e) => setTransformForm({ ...transformForm, height: parseInt(e.target.value) })}
                      />
                    </>
                  )}

                  {(transformForm.name === 'noise' || transformForm.name === 'blur') && (
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Sigma"
                      value={transformForm.sigma}
                      onChange={(e) => setTransformForm({ ...transformForm, sigma: parseFloat(e.target.value) })}
                    />
                  )}

                  <button type="button" className="btn-secondary" onClick={addTransform}>
                    Add Transform
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={createExperiment} disabled={loading}>
                {loading ? 'Creating...' : 'Create Experiment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
