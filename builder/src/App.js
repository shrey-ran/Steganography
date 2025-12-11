/**
 * Experiment Builder - Standalone Application
 * Step-by-step wizard for configuring steganography experiments
 */

import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    dataset: 'sample_images',
    batchSize: 4,
    epochs: 1,
    transforms: []
  });
  
  const [currentTransform, setCurrentTransform] = useState({
    name: 'jpeg',
    quality: 80,
    width: 256,
    height: 256,
    sigma: 0.05
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [experimentId, setExperimentId] = useState(null);

  // Auto-dismiss error notifications
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const datasets = [
    { value: 'sample_images', label: 'Sample Images (100 images)', description: 'General purpose test dataset' },
    { value: 'coco_subset', label: 'COCO Subset (500 images)', description: 'Natural scenes and objects' },
    { value: 'imagenet_mini', label: 'ImageNet Mini (1000 images)', description: 'Diverse object categories' },
    { value: 'custom', label: 'Custom Dataset', description: 'Upload your own images' }
  ];

  const transformTypes = [
    { value: 'jpeg', label: 'JPEG Compression', icon: '📷', description: 'Test robustness against lossy compression' },
    { value: 'resize', label: 'Image Resize', icon: '📐', description: 'Scale images to different dimensions' },
    { value: 'gaussian_noise', label: 'Gaussian Noise', icon: '🌫️', description: 'Add random noise to images' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTransformChange = (field, value) => {
    setCurrentTransform(prev => ({ ...prev, [field]: value }));
  };

  const addTransform = () => {
    const transform = { name: currentTransform.name };
    
    if (currentTransform.name === 'jpeg') {
      transform.quality = parseInt(currentTransform.quality);
    } else if (currentTransform.name === 'resize') {
      transform.width = parseInt(currentTransform.width);
      transform.height = parseInt(currentTransform.height);
    } else if (currentTransform.name === 'gaussian_noise') {
      transform.sigma = parseFloat(currentTransform.sigma);
    }

    setFormData(prev => ({
      ...prev,
      transforms: [...prev.transforms, transform]
    }));

    // Reset transform form
    setCurrentTransform({
      name: 'jpeg',
      quality: 80,
      width: 256,
      height: 256,
      sigma: 0.05
    });
  };

  const removeTransform = (index) => {
    setFormData(prev => ({
      ...prev,
      transforms: prev.transforms.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) {
          setError('Please enter an experiment name');
          return false;
        }
        if (!formData.message.trim()) {
          setError('Please enter a message to hide');
          return false;
        }
        return true;
      case 2:
        if (!formData.dataset) {
          setError('Please select a dataset');
          return false;
        }
        return true;
      case 3:
        if (formData.batchSize < 1 || formData.batchSize > 32) {
          setError('Batch size must be between 1 and 32');
          return false;
        }
        if (formData.epochs < 1 || formData.epochs > 100) {
          setError('Epochs must be between 1 and 100');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const submitExperiment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/experiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create experiment');
      }

      const data = await response.json();
      setExperimentId(data.id);
      setSuccess(true);
      setStep(5);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetBuilder = () => {
    setStep(1);
    setFormData({
      name: '',
      message: '',
      dataset: 'sample_images',
      batchSize: 4,
      epochs: 1,
      transforms: []
    });
    setSuccess(false);
    setExperimentId(null);
  };

  const getTransformLabel = (transform) => {
    if (transform.name === 'jpeg') return `JPEG (Q: ${transform.quality})`;
    if (transform.name === 'resize') return `Resize (${transform.width}x${transform.height})`;
    if (transform.name === 'gaussian_noise') return `Noise (σ: ${transform.sigma})`;
    return transform.name;
  };

  return (
    <div className="builder-app">
      {/* Header */}
      <header className="builder-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-icon">🧪</div>
            <div>
              <h1>Experiment Builder</h1>
              <p>Create your steganography research experiment</p>
            </div>
          </div>
        </div>
      </header>

      {/* Error Notification */}
      {error && (
        <div className="builder-notification error">
          <span className="icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }}></div>
        </div>
        <div className="progress-steps">
          {[1, 2, 3, 4, 5].map(num => (
            <div key={num} className={`progress-step ${step >= num ? 'active' : ''} ${step === num ? 'current' : ''}`}>
              <div className="step-circle">{num}</div>
              <div className="step-label">
                {num === 1 && 'Basic Info'}
                {num === 2 && 'Dataset'}
                {num === 3 && 'Parameters'}
                {num === 4 && 'Transforms'}
                {num === 5 && 'Review'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="builder-main">
        <div className="builder-container">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="builder-step">
              <div className="step-header">
                <h2>📝 Basic Information</h2>
                <p>Let's start with the basics of your experiment</p>
              </div>

              <div className="step-content">
                <div className="form-field">
                  <label>Experiment Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., JPEG Robustness Test 2025-12-07"
                    className="input-large"
                  />
                  <small>Choose a descriptive name that includes the test purpose and date</small>
                </div>

                <div className="form-field">
                  <label>Message to Hide (Encrypt) *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Enter the secret message you want to hide in the images..."
                    className="textarea-large"
                    rows="5"
                  />
                  <small>This message will be hidden using LSB steganography and tested for survival through transformations</small>
                </div>

                <div className="info-card">
                  <h3>💡 Important Notes</h3>
                  <ul>
                    <li>Message length affects embedding capacity</li>
                    <li>Longer messages are harder to hide robustly</li>
                    <li>Keep messages under 500 characters for best results</li>
                    <li>The message will be extracted after each transformation to verify survival</li>
                  </ul>
                </div>
              </div>

              <div className="step-actions">
                <button onClick={nextStep} className="btn-primary">
                  Next: Choose Dataset →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Dataset Selection */}
          {step === 2 && (
            <div className="builder-step">
              <div className="step-header">
                <h2>📚 Dataset Selection</h2>
                <p>Choose the image dataset for your experiment</p>
              </div>

              <div className="step-content">
                <div className="dataset-grid">
                  {datasets.map(dataset => (
                    <div
                      key={dataset.value}
                      className={`dataset-card ${formData.dataset === dataset.value ? 'selected' : ''}`}
                      onClick={() => handleInputChange('dataset', dataset.value)}
                    >
                      <div className="dataset-icon">
                        {dataset.value === 'sample_images' && '🖼️'}
                        {dataset.value === 'coco_subset' && '🌍'}
                        {dataset.value === 'imagenet_mini' && '🎯'}
                        {dataset.value === 'custom' && '📁'}
                      </div>
                      <h3>{dataset.label}</h3>
                      <p>{dataset.description}</p>
                      {formData.dataset === dataset.value && (
                        <div className="selected-badge">✓ Selected</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="step-actions">
                <button onClick={prevStep} className="btn-secondary">
                  ← Previous
                </button>
                <button onClick={nextStep} className="btn-primary">
                  Next: Configure Parameters →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Parameters */}
          {step === 3 && (
            <div className="builder-step">
              <div className="step-header">
                <h2>⚙️ Experiment Parameters</h2>
                <p>Configure batch size and training epochs</p>
              </div>

              <div className="step-content">
                <div className="param-grid">
                  <div className="param-card">
                    <label>Batch Size</label>
                    <div className="slider-container">
                      <input
                        type="range"
                        min="1"
                        max="32"
                        value={formData.batchSize}
                        onChange={(e) => handleInputChange('batchSize', parseInt(e.target.value))}
                        className="slider"
                      />
                      <div className="slider-value">{formData.batchSize}</div>
                    </div>
                    <small>Number of images processed together (1-32)</small>
                    <div className="recommendation">
                      💡 Recommended: 4-8 for testing, 16-32 for production
                    </div>
                  </div>

                  <div className="param-card">
                    <label>Training Epochs</label>
                    <div className="slider-container">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={formData.epochs}
                        onChange={(e) => handleInputChange('epochs', parseInt(e.target.value))}
                        className="slider"
                      />
                      <div className="slider-value">{formData.epochs}</div>
                    </div>
                    <small>Number of complete passes through dataset (1-100)</small>
                    <div className="recommendation">
                      💡 Recommended: 1-5 for quick tests, 10-50 for thorough testing
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <h3>📊 Performance Impact</h3>
                  <p><strong>Current Configuration:</strong></p>
                  <ul>
                    <li>Batch Size: {formData.batchSize} → {formData.batchSize < 8 ? 'Lower memory usage, slower' : 'Higher memory usage, faster'}</li>
                    <li>Epochs: {formData.epochs} → Estimated time: ~{formData.epochs * 2} minutes</li>
                  </ul>
                </div>
              </div>

              <div className="step-actions">
                <button onClick={prevStep} className="btn-secondary">
                  ← Previous
                </button>
                <button onClick={nextStep} className="btn-primary">
                  Next: Add Transforms →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Transforms */}
          {step === 4 && (
            <div className="builder-step">
              <div className="step-header">
                <h2>🔧 Image Transforms</h2>
                <p>Add transformations to test robustness (optional)</p>
              </div>

              <div className="step-content">
                {/* Current Transforms */}
                {formData.transforms.length > 0 && (
                  <div className="transforms-list-section">
                    <h3>Added Transforms ({formData.transforms.length})</h3>
                    <div className="transforms-chips">
                      {formData.transforms.map((transform, index) => (
                        <div key={index} className="transform-chip-large">
                          <span className="chip-icon">
                            {transform.name === 'jpeg' && '📷'}
                            {transform.name === 'resize' && '📐'}
                            {transform.name === 'gaussian_noise' && '🌫️'}
                          </span>
                          <span className="chip-label">{getTransformLabel(transform)}</span>
                          <button onClick={() => removeTransform(index)} className="chip-remove">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Transform */}
                <div className="add-transform-section">
                  <h3>Add New Transform</h3>
                  
                  <div className="transform-type-grid">
                    {transformTypes.map(type => (
                      <div
                        key={type.value}
                        className={`transform-type-card ${currentTransform.name === type.value ? 'selected' : ''}`}
                        onClick={() => handleTransformChange('name', type.value)}
                      >
                        <div className="type-icon">{type.icon}</div>
                        <h4>{type.label}</h4>
                        <p>{type.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Transform Parameters */}
                  <div className="transform-params">
                    {currentTransform.name === 'jpeg' && (
                      <div className="param-field">
                        <label>JPEG Quality</label>
                        <div className="slider-container">
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={currentTransform.quality}
                            onChange={(e) => handleTransformChange('quality', e.target.value)}
                            className="slider"
                          />
                          <div className="slider-value">{currentTransform.quality}</div>
                        </div>
                        <small>Higher = better quality (1-100)</small>
                      </div>
                    )}

                    {currentTransform.name === 'resize' && (
                      <div className="param-row">
                        <div className="param-field">
                          <label>Width</label>
                          <input
                            type="number"
                            min="16"
                            max="2048"
                            value={currentTransform.width}
                            onChange={(e) => handleTransformChange('width', e.target.value)}
                          />
                        </div>
                        <div className="param-field">
                          <label>Height</label>
                          <input
                            type="number"
                            min="16"
                            max="2048"
                            value={currentTransform.height}
                            onChange={(e) => handleTransformChange('height', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {currentTransform.name === 'gaussian_noise' && (
                      <div className="param-field">
                        <label>Sigma (Noise Level)</label>
                        <div className="slider-container">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={currentTransform.sigma}
                            onChange={(e) => handleTransformChange('sigma', e.target.value)}
                            className="slider"
                          />
                          <div className="slider-value">{currentTransform.sigma}</div>
                        </div>
                        <small>0 = no noise, 1 = maximum noise</small>
                      </div>
                    )}

                    <button onClick={addTransform} className="btn-add-transform">
                      ➕ Add Transform
                    </button>
                  </div>
                </div>
              </div>

              <div className="step-actions">
                <button onClick={prevStep} className="btn-secondary">
                  ← Previous
                </button>
                <button onClick={nextStep} className="btn-primary">
                  Next: Review & Create →
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {step === 5 && !success && (
            <div className="builder-step">
              <div className="step-header">
                <h2>✅ Review Experiment</h2>
                <p>Verify your configuration before creating</p>
              </div>

              <div className="step-content">
                <div className="review-section">
                  <div className="review-card">
                    <h3>📝 Basic Information</h3>
                    <div className="review-row">
                      <span className="review-label">Name:</span>
                      <span className="review-value">{formData.name}</span>
                    </div>
                  </div>

                  <div className="review-card">
                    <h3>📚 Dataset</h3>
                    <div className="review-row">
                      <span className="review-label">Dataset:</span>
                      <span className="review-value">
                        {datasets.find(d => d.value === formData.dataset)?.label}
                      </span>
                    </div>
                  </div>

                  <div className="review-card">
                    <h3>⚙️ Parameters</h3>
                    <div className="review-row">
                      <span className="review-label">Batch Size:</span>
                      <span className="review-value">{formData.batchSize}</span>
                    </div>
                    <div className="review-row">
                      <span className="review-label">Epochs:</span>
                      <span className="review-value">{formData.epochs}</span>
                    </div>
                  </div>

                  <div className="review-card">
                    <h3>🔧 Transforms ({formData.transforms.length})</h3>
                    {formData.transforms.length === 0 ? (
                      <p className="review-empty">No transforms added</p>
                    ) : (
                      formData.transforms.map((transform, index) => (
                        <div key={index} className="review-row">
                          <span className="review-label">{index + 1}.</span>
                          <span className="review-value">{getTransformLabel(transform)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="step-actions">
                <button onClick={prevStep} className="btn-secondary">
                  ← Previous
                </button>
                <button 
                  onClick={submitExperiment} 
                  className="btn-create"
                  disabled={loading}
                >
                  {loading ? '⏳ Creating...' : '🚀 Create Experiment'}
                </button>
              </div>
            </div>
          )}

          {/* Success State */}
          {step === 5 && success && (
            <div className="builder-step">
              <div className="success-content">
                <div className="success-icon">✅</div>
                <h2>Experiment Created Successfully!</h2>
                <p>Your experiment has been created and is ready to run.</p>

                <div className="success-details">
                  <div className="detail-row">
                    <span className="detail-label">Experiment ID:</span>
                    <span className="detail-value">{experimentId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{formData.name}</span>
                  </div>
                </div>

                <div className="success-actions">
                  <button onClick={resetBuilder} className="btn-primary">
                    ➕ Create Another Experiment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="builder-footer">
        <p>Steganography Research Platform - Experiment Builder v1.0</p>
        <p>Standalone Application - Port 3001</p>
      </footer>
    </div>
  );
}

export default App;
