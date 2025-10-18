import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FileText, AlertTriangle, User, Calendar, Eye, CheckCircle, XCircle } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { handleError } from '../utils/errorHandler';
import { cache } from '../utils/cache';

interface Report {
  id: string;
  type: 'harassment' | 'fraud' | 'inappropriate' | 'other';
  title?: string;
  description: string;
  reportedBy: string;
  reportedUser: string;
  reporterEmail?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  priority?: 'low' | 'medium' | 'high';
  createdAt: any;
}

const ReportsPage: React.FC = () => {
  const { theme } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Try cache first
      const cachedReports = cache.get<Report[]>('reports:list');
      if (cachedReports) {
        console.log('📦 Loading reports from cache');
        setReports(cachedReports);
        setLoading(false);
        return;
      }
      
      // Check for dev bypass mode
      const devBypass = localStorage.getItem('devBypass') === 'true';
      if (devBypass) {
        // Use mock data in dev bypass mode
        const mockReports: Report[] = [
          {
            id: 'mock-1',
            type: 'harassment',
            description: 'Mock harassment report',
            reportedBy: 'user-123',
            reportedUser: 'user-456',
            status: 'pending',
            createdAt: new Date(),
            priority: 'high'
          },
          {
            id: 'mock-2',
            type: 'fraud',
            description: 'Mock fraud report',
            reportedBy: 'user-789',
            reportedUser: 'user-101',
            status: 'resolved',
            createdAt: new Date(Date.now() - 86400000),
            priority: 'medium'
          }
        ];
        setReports(mockReports);
        return;
      }
      
      const reportsSnapshot = await getDocs(
        query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
      );
      const reportsData: Report[] = reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Report));
      
      // Cache for 2 minutes
      cache.set('reports:list', reportsData, 2 * 60 * 1000);
      setReports(reportsData);
    } catch (error) {
      const errorResponse = handleError(error, 'Reports Loading');
      console.error('Error loading reports:', errorResponse.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'harassment': return <AlertTriangle size={20} color={theme.error} />;
      case 'fraud': return <XCircle size={20} color={theme.error} />;
      case 'inappropriate': return <Eye size={20} color={theme.warning} />;
      default: return <FileText size={20} color={theme.info} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }} role="status" aria-live="polite">
        <div className="spinner" aria-label="Loading reports"></div>
      </div>
    );
  }

  return (
    <div className="reports-page" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: theme.textPrimary, fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            Reports & Moderation
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: '16px' }}>
            Review user reports and moderate platform content
          </p>
        </div>
      </div>

      {/* Reports Content */}
      {reports.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map((report) => (
            <div 
              key={report.id}
              style={{ 
                backgroundColor: theme.surface,
                borderRadius: '12px',
                padding: '24px',
                border: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}
            >
              {getReportTypeIcon(report.type)}
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ color: theme.textPrimary, margin: 0 }}>
                    {report.title || 'User Report'}
                  </h3>
                  <span style={{ 
                    color: report.status === 'resolved' ? theme.success : theme.warning,
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {report.status || 'pending'}
                  </span>
                </div>
                
                <p style={{ color: theme.textSecondary, marginBottom: '12px' }}>
                  {report.description || 'No description provided'}
                </p>
                
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={16} color={theme.textSecondary} />
                    <span style={{ color: theme.textSecondary }}>
                      Reported by: {report.reporterEmail || 'Anonymous'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={16} color={theme.textSecondary} />
                    <span style={{ color: theme.textSecondary }}>
                      {report.createdAt ? new Date(report.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: theme.success,
                    color: 'white',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle size={14} style={{ marginRight: '4px' }} />
                  Resolve
                </button>
                <button
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.background,
                    color: theme.textPrimary,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={14} style={{ marginRight: '4px' }} />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px' }} role="status">
          <FileText size={64} color={theme.textSecondary} style={{ marginBottom: '24px' }} aria-hidden="true" />
          <h2 style={{ color: theme.textPrimary, marginBottom: '8px' }}>No Reports</h2>
          <p style={{ color: theme.textSecondary }}>
            No user reports or moderation requests at this time.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

