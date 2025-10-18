import React from 'react';
import { Shield } from 'lucide-react';
import './LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <Shield size={80} color="#00FF88" strokeWidth={2.5} />
        </div>
        <h2 className="loading-title">GUILD ADMIN</h2>
        <div className="loading-spinner"></div>
        <p className="loading-text">Initializing Portal...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

