import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import BackendMonitorPage from '../BackendMonitor';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock Sentry
jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
}));

// Mock WebSocket
const mockWebSocket = {
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

// Mock fetch
global.fetch = jest.fn();

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data }: any) => <div data-testid="line-chart">{JSON.stringify(data)}</div>,
  Bar: ({ data }: any) => <div data-testid="bar-chart">{JSON.stringify(data)}</div>,
}));

// Mock Chart.js registration
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
}));

const mockTheme = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  textTertiary: '#666666',
  primary: '#00ff88',
  secondary: '#ff6b6b',
  info: '#4ecdc4',
  success: '#00ff88',
  warning: '#ffa500',
  error: '#ff4444',
  border: '#333333',
};

const mockUser = {
  id: '1',
  email: 'admin@example.com',
  displayName: 'Admin User',
  role: 'super_admin',
  permissions: ['*'],
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('BackendMonitorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        errors: [],
        users: [],
        stats: null,
        metrics: []
      })
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders without crashing', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    expect(screen.getByText('Backend Monitor')).toBeInTheDocument();
  });

  it('displays loading state initially', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('loads initial data on mount', async () => {
    const mockData = {
      errors: [
        {
          id: '1',
          message: 'Test error',
          file: 'test.ts',
          line: 10,
          level: 'error',
          timestamp: Date.now(),
          count: 1
        }
      ],
      users: [
        {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          lastSeen: Date.now(),
          location: 'Test Location',
          device: 'Test Device',
          status: 'online'
        }
      ],
      stats: {
        totalRequests: 1000,
        errorRate: 2.5,
        avgResponseTime: 200,
        activeConnections: 10,
        uptime: 3600,
        memoryUsage: 50,
        cpuUsage: 30
      },
      metrics: []
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/monitoring/sentry-errors');
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/analytics/users/live');
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/monitoring/backend-stats');
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/monitoring/system-metrics');
    });
  });

  it('handles WebSocket connection', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3001/backend-monitor');
  });

  it('displays system status cards', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
      expect(screen.getByText('Connections')).toBeInTheDocument();
      expect(screen.getByText('Uptime')).toBeInTheDocument();
    });
  });

  it('displays charts when data is available', async () => {
    const mockMetrics = Array.from({ length: 10 }, (_, i) => ({
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100,
      timestamp: Date.now() - (i * 60000)
    }));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ metrics: mockMetrics })
    });

    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('handles time range selection', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    const timeSelect = screen.getByDisplayValue('Last Hour');
    fireEvent.change(timeSelect, { target: { value: '24h' } });

    expect(timeSelect).toHaveValue('24h');
  });

  it('handles refresh button click', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('displays error banner when there is an error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load monitoring data')).toBeInTheDocument();
    });
  });

  it('displays connection status', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('handles WebSocket message processing', async () => {
    const mockMessage = {
      type: 'system_metrics',
      metrics: {
        cpu: 50,
        memory: 60,
        disk: 40,
        network: 30,
        timestamp: Date.now()
      }
    };

    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    // Simulate WebSocket message
    const wsInstance = (global.WebSocket as jest.Mock).mock.results[0].value;
    const onMessage = wsInstance.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )?.[1];

    if (onMessage) {
      act(() => {
        onMessage({ data: JSON.stringify(mockMessage) });
      });
    }

    // Verify the message was processed
    expect(wsInstance.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('formats uptime correctly', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    // The component should display formatted uptime
    await waitFor(() => {
      expect(screen.getByText(/0d 0h 0m/)).toBeInTheDocument();
    });
  });

  it('displays recent errors section', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    expect(screen.getByText('Recent Errors')).toBeInTheDocument();
  });

  it('displays live users section', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    expect(screen.getByText('Live Users')).toBeInTheDocument();
  });

  it('handles empty state for errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ errors: [] })
    });

    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('No errors detected')).toBeInTheDocument();
    });
  });

  it('handles empty state for users', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users: [] })
    });

    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('No live users')).toBeInTheDocument();
    });
  });

  it('applies correct theme colors', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    const statusCards = screen.getAllByRole('generic').filter(
      el => el.className.includes('status-card')
    );

    expect(statusCards.length).toBeGreaterThan(0);
  });

  it('handles component unmounting', async () => {
    const { unmount } = await act(async () => {
      return render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    await act(async () => {
      unmount();
    });

    // Verify cleanup
    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  it('displays system metrics chart with correct data', async () => {
    const mockMetrics = [
      { cpu: 50, memory: 60, disk: 40, network: 30, timestamp: Date.now() - 60000 },
      { cpu: 55, memory: 65, disk: 45, network: 35, timestamp: Date.now() }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ metrics: mockMetrics })
    });

    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      const lineChart = screen.getByTestId('line-chart');
      expect(lineChart).toBeInTheDocument();
      
      const chartData = JSON.parse(lineChart.textContent || '{}');
      expect(chartData.labels).toBeDefined();
      expect(chartData.datasets).toBeDefined();
    });
  });

  it('displays error rate chart with correct data', async () => {
    const mockMetrics = [
      { cpu: 50, memory: 60, disk: 40, network: 30, timestamp: Date.now() - 60000 },
      { cpu: 55, memory: 65, disk: 45, network: 35, timestamp: Date.now() }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ metrics: mockMetrics })
    });

    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toBeInTheDocument();
      
      const chartData = JSON.parse(barChart.textContent || '{}');
      expect(chartData.labels).toBeDefined();
      expect(chartData.datasets).toBeDefined();
    });
  });

  it('handles WebSocket connection errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    // Simulate WebSocket error
    const wsInstance = (global.WebSocket as jest.Mock).mock.results[0].value;
    const onError = wsInstance.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )?.[1];

    if (onError) {
      act(() => {
        onError(new Error('WebSocket error'));
      });
    }

    expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('handles WebSocket close event', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    // Simulate WebSocket close
    const wsInstance = (global.WebSocket as jest.Mock).mock.results[0].value;
    const onClose = wsInstance.addEventListener.mock.calls.find(
      call => call[0] === 'close'
    )?.[1];

    if (onClose) {
      act(() => {
        onClose();
      });
    }

    expect(wsInstance.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('displays correct status colors based on thresholds', async () => {
    const mockStats = {
      totalRequests: 1000,
      errorRate: 15, // High error rate
      avgResponseTime: 2500, // High response time
      activeConnections: 10,
      uptime: 3600,
      memoryUsage: 95, // High memory usage
      cpuUsage: 85 // High CPU usage
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stats: mockStats })
    });

    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('15.0%')).toBeInTheDocument();
      expect(screen.getByText('2500ms')).toBeInTheDocument();
      expect(screen.getByText('95.0%')).toBeInTheDocument();
      expect(screen.getByText('85.0%')).toBeInTheDocument();
    });
  });

  it('handles auto-refresh functionality', async () => {
    jest.useFakeTimers();

    await act(async () => {
      render(
        <TestWrapper>
          <BackendMonitorPage />
        </TestWrapper>
      );
    });

    // Fast-forward time to trigger auto-refresh
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });
});








