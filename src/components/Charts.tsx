import React from 'react';
import './Charts.css';

const Charts: React.FC = () => {
  return (
    <div className="charts">
      <div className="chart-card">
        <h3>Project Health Overview</h3>
        <div className="health-chart">
          <div className="circular-chart">
            <div className="chart-segment green" style={{ width: '70%' }}></div>
            <div className="chart-segment yellow" style={{ width: '20%' }}></div>
            <div className="chart-segment red" style={{ width: '10%' }}></div>
          </div>
        </div>
      </div>
      <div className="chart-card">
        <h3>Weekly Metrics</h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-color defect"></span> Defects
          </span>
          <span className="legend-item">
            <span className="legend-color test-case"></span> TestCases
          </span>
        </div>
        <div className="weekly-metrics">
          <div className="bar-chart">
            <div className="bar defect" style={{ height: '30%' }}></div>
            <div className="bar test-case" style={{ height: '60%' }}></div>
            <span>Mon</span>
          </div>
          <div className="bar-chart">
            <div className="bar defect" style={{ height: '40%' }}></div>
            <div className="bar test-case" style={{ height: '50%' }}></div>
            <span>Tue</span>
          </div>
          <div className="bar-chart">
            <div className="bar defect" style={{ height: '30%' }}></div>
            <div className="bar test-case" style={{ height: '70%' }}></div>
            <span>Wed</span>
          </div>
          <div className="bar-chart">
            <div className="bar defect" style={{ height: '20%' }}></div>
            <div className="bar test-case" style={{ height: '60%' }}></div>
            <span>Thu</span>
          </div>
          <div className="bar-chart">
            <div className="bar defect" style={{ height: '40%' }}></div>
            <div className="bar test-case" style={{ height: '80%' }}></div>
            <span>Fri</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;