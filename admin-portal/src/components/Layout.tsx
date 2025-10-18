import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Briefcase, 
  BarChart3, 
  FileText, 
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  Search,
  ChevronDown,
  CheckCircle,
  Server,
  Activity,
  Terminal,
  FileSearch,
  DollarSign,
  Scale,
  FileCheck,
  Megaphone
} from 'lucide-react';
import './Layout.css';

const Layout: React.FC = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: '*' },
    { path: '/users', label: 'Users', icon: Users, permission: '*' },
    { path: '/guilds', label: 'Guilds', icon: Shield, permission: '*' },
    { path: '/jobs', label: 'Jobs', icon: Briefcase, permission: '*' },
    { path: '/job-approval', label: 'Job Approval', icon: CheckCircle, permission: '*' },
    { path: '/contract-terms', label: 'Contract Terms', icon: Scale, permission: '*' },
    { path: '/manual-payments', label: 'Manual Payments', icon: DollarSign, permission: '*' },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, permission: '*' },
    { path: '/reports', label: 'Reports', icon: FileText, permission: '*' },
    { path: '/demo-mode', label: 'Demo Mode', icon: DollarSign, permission: '*' },
    { path: '/backend-monitor', label: 'Backend Monitor', icon: Server, permission: '*' },
    { path: '/advanced-monitoring', label: 'Advanced Monitoring', icon: Activity, permission: '*' },
    { path: '/system-control', label: 'System Control', icon: Terminal, permission: '*' },
    { path: '/audit-logs', label: 'Audit Logs', icon: FileSearch, permission: '*' },
    { path: '/settings', label: 'Settings', icon: Settings, permission: '*' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout" style={{ backgroundColor: theme.background }}>
      {/* Sidebar */}
      <aside 
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
        style={{ backgroundColor: theme.surface }}
      >
        <div className="sidebar-header">
          <div className="logo">
            <Shield size={32} color={theme.primary} />
            {sidebarOpen && <span className="logo-text">GUILD ADMIN</span>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: theme.textSecondary }}
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Show all items when user has wildcard permission or specific permission
            if (!user?.permissions.includes('*') && !user?.permissions.includes(item.permission)) {
              return null;
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
                style={{
                  backgroundColor: isActive(item.path) ? theme.primary + '20' : 'transparent',
                  color: isActive(item.path) ? theme.primary : theme.textSecondary,
                }}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item logout-btn"
            onClick={handleSignOut}
            style={{ color: theme.error }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header" style={{ backgroundColor: theme.surface }}>
          <div className="header-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: theme.textPrimary }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="search-bar" style={{ backgroundColor: theme.background }}>
              <Search size={20} color={theme.textSecondary} />
              <input
                type="text"
                placeholder="Search..."
                style={{ 
                  backgroundColor: 'transparent',
                  color: theme.textPrimary 
                }}
              />
            </div>
          </div>

          <div className="header-right">
            <button
              className="icon-btn"
              onClick={toggleTheme}
              style={{ color: theme.textPrimary }}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              className="icon-btn notification-btn"
              style={{ color: theme.textPrimary }}
            >
              <Bell size={20} />
              {/* <span className="notification-badge">3</span> */}
            </button>

            <div className="profile-dropdown">
              <button
                className="profile-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{ backgroundColor: theme.background }}
              >
                <div className="profile-avatar" style={{ backgroundColor: theme.primary }}>
                  {user?.email?.[0].toUpperCase()}
                </div>
                <div className="profile-info">
                  <span className="profile-name" style={{ color: theme.textPrimary }}>
                    {user?.displayName || user?.email?.split('@')[0]}
                  </span>
                  <span className="profile-role" style={{ color: theme.textSecondary }}>
                    {user?.role?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <ChevronDown size={16} color={theme.textSecondary} />
              </button>

              {profileDropdownOpen && (
                <div 
                  className="dropdown-menu"
                  style={{ 
                    backgroundColor: theme.surface,
                    borderColor: theme.border 
                  }}
                >
                  <Link 
                    to="/settings" 
                    className="dropdown-item"
                    style={{ color: theme.textPrimary }}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <button 
                    className="dropdown-item"
                    onClick={handleSignOut}
                    style={{ color: theme.error }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="mobile-menu"
            style={{ backgroundColor: theme.surface }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-menu-header">
              <div className="logo">
                <Shield size={32} color={theme.primary} />
                <span className="logo-text">GUILD ADMIN</span>
              </div>
              <button
                className="close-btn"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: theme.textPrimary }}
              >
                <X size={24} />
              </button>
            </div>

            <nav className="mobile-nav">
              {menuItems.map((item) => {
                const Icon = item.icon;
                // Show all items when user has wildcard permission or specific permission
                if (!user?.permissions.includes('*') && !user?.permissions.includes(item.permission)) {
                  return null;
                }
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      backgroundColor: isActive(item.path) ? theme.primary + '20' : 'transparent',
                      color: isActive(item.path) ? theme.primary : theme.textPrimary,
                    }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

