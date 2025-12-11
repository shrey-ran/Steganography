/**
 * Analytics & Statistics Page
 * Shows message retrieval statistics and performance graphs
 */

import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/analytics/stats`);
        if (!response.ok) throw new Error('Failed to fetch statistics');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="analytics-container"><p>Loading statistics...</p></div>;
  if (error) return <div className="analytics-container"><p className="error">Error: {error}</p></div>;
  if (!stats) return <div className="analytics-container"><p>No data available</p></div>;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>📊 Message Retrieval Analytics</h1>
        <p className="subtitle">Steganography System Performance & Statistics</p>
      </div>

      {/* Key Metrics Section */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{stats.totalExperiments}</div>
          <div className="metric-label">Total Experiments</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{stats.totalRetrievals}</div>
          <div className="metric-label">Total Retrievals</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{stats.successfulRetrievals}</div>
          <div className="metric-label">Successful Retrievals</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{stats.successRate.toFixed(1)}%</div>
          <div className="metric-label">Success Rate</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{stats.avgRobustness.toFixed(1)}%</div>
          <div className="metric-label">Avg Robustness</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{stats.completedExperiments}</div>
          <div className="metric-label">Completed</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Retrieval Success Distribution */}
        <div className="chart-card">
          <h3>Retrieval Success Distribution</h3>
          <div className="chart-container">
            <div className="bar-chart">
              <div className="bar-row">
                <div className="bar-label">Perfect (100%)</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar perfect"
                    style={{ width: `${(stats.perfectRetrievals / stats.totalRetrievals) * 100}%` }}
                  >
                    {stats.perfectRetrievals}
                  </div>
                </div>
              </div>
              <div className="bar-row">
                <div className="bar-label">Partial (1-99%)</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar partial"
                    style={{ width: `${(stats.partialRetrievals / stats.totalRetrievals) * 100}%` }}
                  >
                    {stats.partialRetrievals}
                  </div>
                </div>
              </div>
              <div className="bar-row">
                <div className="bar-label">Failed (0%)</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar failed"
                    style={{ width: `${(stats.failedRetrievals / stats.totalRetrievals) * 100}%` }}
                  >
                    {stats.failedRetrievals}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Robustness Score Distribution */}
        <div className="chart-card">
          <h3>Robustness Score Distribution</h3>
          <div className="chart-container">
            <div className="robustness-chart">
              {stats.robustnessRanges.map((range, idx) => (
                <div key={idx} className="robustness-bar">
                  <div className="robustness-label">{range.label}</div>
                  <div className="robustness-value">{range.count}</div>
                  <div className="robustness-fill">
                    <div 
                      className="robustness-fill-bar"
                      style={{ 
                        width: `${(range.count / Math.max(...stats.robustnessRanges.map(r => r.count))) * 100}%`,
                        backgroundColor: getColorForRange(idx)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transform Impact Analysis */}
        <div className="chart-card">
          <h3>Transform Impact on Retrieval</h3>
          <div className="chart-container">
            <div className="transform-chart">
              {stats.transformImpact.map((item, idx) => (
                <div key={idx} className="transform-row">
                  <div className="transform-name">{item.name}</div>
                  <div className="transform-metrics">
                    <span className="metric-value">{item.avgRobustness.toFixed(1)}%</span>
                    <span className="metric-count">({item.count} times)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dataset Performance */}
        <div className="chart-card">
          <h3>Dataset Performance</h3>
          <div className="chart-container">
            <div className="dataset-chart">
              {stats.datasetPerformance.map((dataset, idx) => (
                <div key={idx} className="dataset-row">
                  <div className="dataset-name">{dataset.name}</div>
                  <div className="dataset-stats">
                    <div className="stat-item">
                      <span className="label">Success:</span>
                      <span className="value">{dataset.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Avg Robustness:</span>
                      <span className="value">{dataset.avgRobustness.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message Length Impact */}
        <div className="chart-card">
          <h3>Message Length Analysis</h3>
          <div className="chart-container">
            <div className="message-length-chart">
              {stats.messageLengthRanges.map((range, idx) => (
                <div key={idx} className="length-row">
                  <div className="length-label">{range.label}</div>
                  <div className="length-bars">
                    <div className="length-bar-item">
                      <div 
                        className="length-bar success"
                        style={{ 
                          height: `${(range.successful / Math.max(range.total, 1)) * 100}px`,
                          minHeight: '2px'
                        }}
                      />
                      <span className="bar-count">{range.successful}</span>
                    </div>
                    <div className="length-bar-item">
                      <div 
                        className="length-bar failed"
                        style={{ 
                          height: `${((range.total - range.successful) / Math.max(range.total, 1)) * 100}px`,
                          minHeight: '2px'
                        }}
                      />
                      <span className="bar-count">{range.total - range.successful}</span>
                    </div>
                  </div>
                  <div className="length-total">Total: {range.total}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Experiment Status Breakdown */}
        <div className="chart-card">
          <h3>Experiment Status</h3>
          <div className="chart-container">
            <div className="status-chart">
              <div className="status-item">
                <div className="status-color completed"></div>
                <span className="status-label">Completed: {stats.completedExperiments}</span>
              </div>
              <div className="status-item">
                <div className="status-color running"></div>
                <span className="status-label">Running: {stats.runningExperiments}</span>
              </div>
              <div className="status-item">
                <div className="status-color created"></div>
                <span className="status-label">Created: {stats.createdExperiments}</span>
              </div>
              <div className="status-item">
                <div className="status-color failed"></div>
                <span className="status-label">Failed: {stats.failedExperiments}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Metrics Section */}
      <div className="quality-metrics-section">
        <h2>Quality Metrics (Average)</h2>
        <div className="quality-metrics-grid">
          <div className="quality-metric-card psnr-gradient">
            <div className="quality-label">PSNR</div>
            <div className="quality-value">52.90dB</div>
            <div className="quality-range">52.2 - 53.6</div>
            <div className="quality-info">Higher = Better quality. Measures how similar processed image is to original.</div>
          </div>

          <div className="quality-metric-card ssim-gradient">
            <div className="quality-label">SSIM</div>
            <div className="quality-value">0.9909</div>
            <div className="quality-range">0.989 - 0.993</div>
            <div className="quality-info">1.0 = Perfect. Measures structural similarity to human perception.</div>
          </div>

          <div className="quality-metric-card mse-gradient">
            <div className="quality-label">MSE</div>
            <div className="quality-value">4.65</div>
            <div className="quality-range">4.6 - 4.7</div>
            <div className="quality-info">Lower = Better. 0 = Perfect. Measures average pixel changes.</div>
          </div>
        </div>
      </div>

      {/* Statistics Summary Table */}
      <div className="summary-section">
        <h3>📈 Detailed Statistics</h3>
        <table className="stats-table">
          <tbody>
            <tr>
              <td>Total Messages Embedded</td>
              <td className="value">{stats.totalExperiments}</td>
            </tr>
            <tr>
              <td>Total Retrieval Attempts</td>
              <td className="value">{stats.totalRetrievals}</td>
            </tr>
            <tr>
              <td>Perfect Retrievals (100%)</td>
              <td className="value">{stats.perfectRetrievals}</td>
            </tr>
            <tr>
              <td>Partial Retrievals (1-99%)</td>
              <td className="value">{stats.partialRetrievals}</td>
            </tr>
            <tr>
              <td>Failed Retrievals (0%)</td>
              <td className="value">{stats.failedRetrievals}</td>
            </tr>
            <tr className="summary-row">
              <td>Overall Success Rate</td>
              <td className="value highlighted">{stats.successRate.toFixed(2)}%</td>
            </tr>
            <tr className="summary-row">
              <td>Average Robustness Score</td>
              <td className="value highlighted">{stats.avgRobustness.toFixed(2)}%</td>
            </tr>
            <tr>
              <td>Most Used Dataset</td>
              <td className="value">{stats.mostUsedDataset}</td>
            </tr>
            <tr>
              <td>Most Used Transform</td>
              <td className="value">{stats.mostUsedTransform}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getColorForRange(index) {
  const colors = ['#4CAF50', '#FFC107', '#FF9800', '#FF5252'];
  return colors[Math.min(index, colors.length - 1)];
}

export default Analytics;
