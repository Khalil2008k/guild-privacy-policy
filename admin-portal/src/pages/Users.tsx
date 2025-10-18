import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search,
  Download,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  AlertCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon
} from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, getCountFromServer } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { handleError, showErrorNotification } from '../utils/errorHandler';
import { cache, CacheKeys } from '../utils/cache';
import './Users.css';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profileImage?: string;
  location?: { address: string };
  skills?: string[];
  rank?: string;
  guild?: string | null;
  guildRole?: string | null;
  status: 'active' | 'suspended' | 'banned';
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  completedJobs?: number;
  earnings?: number;
  joinDate?: any;
  createdAt?: any;
}

const UsersPage: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthorized } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    verified: 0,
    suspended: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 20;

  useEffect(() => {
    loadUsers();
    loadUserStats();
  }, [filterStatus, filterVerification, currentPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Build query with filters
      let q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(itemsPerPage)
      );

      // Apply status filter
      if (filterStatus !== 'all') {
        q = query(
          collection(db, 'users'),
          where('status', '==', filterStatus),
          orderBy('createdAt', 'desc'),
          limit(itemsPerPage)
        );
      }

      // Apply verification filter
      if (filterVerification !== 'all') {
        q = query(
          collection(db, 'users'),
          where('verificationStatus', '==', filterVerification),
          orderBy('createdAt', 'desc'),
          limit(itemsPerPage)
        );
      }

      const snapshot = await getDocs(q);
      const usersData: UserProfile[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserProfile));

      setUsers(usersData);
    } catch (error) {
      const errorResponse = handleError(error, 'User Loading');
      console.error('Error loading users:', errorResponse.message);
      
      // Show user-friendly error notification
      showErrorNotification(error, 'Failed to load users');
      
      // Show mock data if Firebase fails
      setUsers(getMockUsers());
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Try cache first
      const cachedStats = cache.get<typeof userStats>(CacheKeys.users.stats());
      if (cachedStats) {
        console.log('📦 Loading user stats from cache');
        setUserStats(cachedStats);
        return;
      }

      // Parallelize all queries for better performance
      const [totalSnapshot, activeSnapshot, verifiedSnapshot, suspendedSnapshot] = await Promise.all([
        getCountFromServer(query(collection(db, 'users'))),
        getCountFromServer(query(collection(db, 'users'), where('status', '==', 'active'))),
        getCountFromServer(query(collection(db, 'users'), where('verificationStatus', '==', 'verified'))),
        getCountFromServer(query(collection(db, 'users'), where('status', '==', 'suspended')))
      ]);

      const total = totalSnapshot.data().count;
      const active = activeSnapshot.data().count;
      const verified = verifiedSnapshot.data().count;
      const suspended = suspendedSnapshot.data().count;

      const stats = {
        total,
        active,
        verified,
        suspended
      };
      
      // Cache for 3 minutes
      cache.set(CacheKeys.users.stats(), stats, 3 * 60 * 1000);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Use mock stats if Firebase fails
      setUserStats({
        total: 1247,
        active: 1150,
        verified: 890,
        suspended: 12
      });
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    if (!isAuthorized('users.write')) {
      alert('You do not have permission to perform this action');
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      
      switch (action) {
        case 'verify':
          await updateDoc(userRef, { verificationStatus: 'verified' });
          break;
        case 'suspend':
          await updateDoc(userRef, { status: 'suspended' });
          break;
        case 'activate':
          await updateDoc(userRef, { status: 'active' });
          break;
        case 'ban':
          await updateDoc(userRef, { status: 'banned' });
          break;
      }

      // Invalidate cache and reload
      cache.invalidatePattern('users:.*');
      await Promise.all([loadUsers(), loadUserStats()]);
    } catch (error) {
      const errorResponse = handleError(error, `User Action: ${action}`);
      console.error(`Error performing ${action}:`, errorResponse.message);
      alert(`Failed to ${action} user: ${errorResponse.message}`);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      loadUsers();
      return;
    }

    // Simple client-side search
    const filtered = users.filter(user =>
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm)
    );
    setUsers(filtered);
  };

  const getMockUsers = (): UserProfile[] => {
    // Fallback mock data for development
    return [
      {
        id: '1',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
        rank: 'A',
        guild: 'Tech Masters',
        guildRole: 'Member',
        status: 'active',
        verificationStatus: 'verified',
        completedJobs: 45,
        earnings: 12500,
        skills: ['React', 'Node.js', 'TypeScript']
      },
      {
        id: '2',
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        phoneNumber: '+1234567891',
        rank: 'S',
        guild: 'Design Guild',
        guildRole: 'Guild Master',
        status: 'active',
        verificationStatus: 'verified',
        completedJobs: 78,
        earnings: 28900,
        skills: ['UI/UX', 'Figma', 'Adobe XD']
      },
      {
        id: '3',
        fullName: 'Mike Johnson',
        email: 'mike.j@example.com',
        phoneNumber: '+1234567892',
        rank: 'B',
        status: 'active',
        verificationStatus: 'pending',
        completedJobs: 12,
        earnings: 3400,
        skills: ['Python', 'Data Analysis']
      },
    ];
  };

  const filteredUsers = users;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00ff88';
      case 'suspended': return '#ffaa00';
      case 'banned': return '#ff4444';
      default: return theme.textPrimary;
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return '#00ff88';
      case 'pending': return '#ffaa00';
      case 'rejected': return '#ff4444';
      default: return theme.textPrimary;
    }
  };

  return (
    <div style={{ padding: '24px', color: theme.textPrimary }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <UsersIcon size={32} color={theme.primary} />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>User Management</h1>
        </div>
        <p style={{ color: theme.textSecondary, margin: 0 }}>
          Manage and monitor all platform users
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {[
          { label: 'Total Users', value: userStats.total, icon: UsersIcon, color: theme.primary },
          { label: 'Active Users', value: userStats.active, icon: CheckCircle, color: '#00ff88' },
          { label: 'Verified Users', value: userStats.verified, icon: Shield, color: '#4a9eff' },
          { label: 'Suspended', value: userStats.suspended, icon: Ban, color: '#ffaa00' }
        ].map((stat, index) => (
          <div
            key={index}
            style={{
              backgroundColor: theme.surface,
              padding: '20px',
              borderRadius: '12px',
              border: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div style={{
              backgroundColor: `${stat.color}20`,
              padding: '12px',
              borderRadius: '10px'
            }}>
              <stat.icon size={24} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {stat.value.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div style={{
        backgroundColor: theme.surface,
        padding: '20px',
        borderRadius: '12px',
        border: `1px solid ${theme.border}`,
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.textSecondary
              }}
            />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
              backgroundColor: theme.background,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              color: theme.textPrimary,
              fontSize: '14px'
            }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 16px',
              backgroundColor: theme.background,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              color: theme.textPrimary,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>

          {/* Verification Filter */}
          <select
            value={filterVerification}
            onChange={(e) => setFilterVerification(e.target.value)}
            style={{
              padding: '10px 16px',
              backgroundColor: theme.background,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              color: theme.textPrimary,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="unverified">Unverified</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Export Button */}
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: theme.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '12px',
        border: `1px solid ${theme.border}`,
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: theme.textSecondary }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '16px' }}>Loading users...</p>
          </div>
        ) : currentUsers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: theme.textSecondary }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No users found matching your criteria</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.background }}>
                    <th style={headerStyle}>User</th>
                    <th style={headerStyle}>Contact</th>
                    <th style={headerStyle}>Rank</th>
                    <th style={headerStyle}>Guild</th>
                    <th style={headerStyle}>Jobs</th>
                    <th style={headerStyle}>Earnings</th>
                    <th style={headerStyle}>Status</th>
                    <th style={headerStyle}>Verification</th>
                    <th style={headerStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: `1px solid ${theme.border}`,
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: theme.primary + '40',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: theme.primary
                          }}>
                            {user.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500' }}>{user.fullName || 'Unknown'}</div>
                            <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                              ID: {user.id.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ fontSize: '14px' }}>{user.email}</div>
                        <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                          {user.phoneNumber || 'No phone'}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          backgroundColor: `${theme.primary}20`,
                          color: theme.primary,
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {user.rank || 'F'}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        {user.guild ? (
                          <div>
                            <div style={{ fontWeight: '500' }}>{user.guild}</div>
                            <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                              {user.guildRole || 'Member'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: theme.textSecondary }}>No guild</span>
                        )}
                      </td>
                      <td style={cellStyle}>{user.completedJobs || 0}</td>
                      <td style={cellStyle}>
                        <span style={{ fontWeight: '500', color: '#00ff88' }}>
                          ${(user.earnings || 0).toLocaleString()}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: `${getStatusColor(user.status)}20`,
                          color: getStatusColor(user.status)
                        }}>
                          {user.status}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: `${getVerificationColor(user.verificationStatus)}20`,
                          color: getVerificationColor(user.verificationStatus)
                        }}>
                          {user.verificationStatus}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            title="View Details"
                            style={actionButtonStyle(theme.primary)}
                          >
                            <Eye size={16} />
                          </button>
                          {isAuthorized('users.write') && (
                            <>
                              <button
                                title="Edit User"
                                style={actionButtonStyle('#4a9eff')}
                              >
                                <Edit size={16} />
                              </button>
                              {user.verificationStatus !== 'verified' && (
                                <button
                                  onClick={() => handleUserAction(user.id, 'verify')}
                                  title="Verify User"
                                  style={actionButtonStyle('#00ff88')}
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              {user.status === 'active' ? (
                                <button
                                  onClick={() => handleUserAction(user.id, 'suspend')}
                                  title="Suspend User"
                                  style={actionButtonStyle('#ffaa00')}
                                >
                                  <Ban size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                  title="Activate User"
                                  style={actionButtonStyle('#00ff88')}
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: '16px',
                borderTop: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ color: theme.textSecondary, fontSize: '14px' }}>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of{' '}
                  {filteredUsers.length} users
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: theme.background,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '6px',
                      color: theme.textPrimary,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ padding: '8px 16px', color: theme.textPrimary }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: theme.background,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '6px',
                      color: theme.textPrimary,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const headerStyle = {
  padding: '16px',
  textAlign: 'left' as const,
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px'
};

const cellStyle = {
  padding: '16px',
  fontSize: '14px'
};

const actionButtonStyle = (color: string) => ({
  padding: '6px',
  backgroundColor: `${color}20`,
  border: 'none',
  borderRadius: '6px',
  color: color,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
});

export default UsersPage;
