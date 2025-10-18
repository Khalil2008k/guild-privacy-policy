import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { adminPerformanceMonitoring } from './services/performanceMonitoring';
import { adminAppCheckService } from './services/appCheck';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import UsersPage from './pages/Users';
import GuildsPage from './pages/Guilds';
import JobsPage from './pages/Jobs';
import JobApprovalPage from './pages/JobApproval';
import AnalyticsPage from './pages/Analytics';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';
// import ApiConfigPage from './pages/ApiConfig'; // Temporarily disabled - uses MUI
import BackendMonitorPage from './pages/BackendMonitor';
import AdvancedMonitoringPage from './pages/AdvancedMonitoring';
import SystemControlPage from './pages/SystemControl';
import AuditLogsPage from './pages/AuditLogs';
import DemoModeController from './pages/DemoModeController';
import FatoraPaymentsPage from './pages/FatoraPayments';
import ContractTermsPage from './pages/ContractTermsPage';
import ManualPaymentsPage from './pages/ManualPaymentsPage';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize performance monitoring and app check
    adminPerformanceMonitoring.initialize();
    adminAppCheckService.initialize();
    
    // Show loading screen for 2500ms (2.5 seconds)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Layout />
                </AuthGuard>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="guilds" element={<GuildsPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="job-approval" element={<JobApprovalPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              {/* <Route path="api-config" element={<ApiConfigPage />} /> */}
              <Route path="backend-monitor" element={<BackendMonitorPage />} />
              <Route path="advanced-monitoring" element={<AdvancedMonitoringPage />} />
              <Route path="system-control" element={<SystemControlPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="demo-mode" element={<DemoModeController />} />
              <Route path="fatora-payments" element={<FatoraPaymentsPage />} />
              <Route path="contract-terms" element={<ContractTermsPage />} />
              <Route path="manual-payments" element={<ManualPaymentsPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

