import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Shield, Users, Calendar, Search } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { handleError } from '../utils/errorHandler';
import { cache, CacheKeys } from '../utils/cache';

interface Guild {
  id: string;
  name?: string;
  description?: string;
  memberCount?: number;
  createdAt?: any;
  isActive?: boolean;
  guildMaster?: string;
  level?: number;
}

const GuildsPage: React.FC = () => {
  const { theme } = useTheme();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadGuilds();
  }, []);

  const loadGuilds = async () => {
    try {
      setLoading(true);
      
      // Try cache first
      const cachedGuilds = cache.get<Guild[]>(CacheKeys.guilds.list());
      if (cachedGuilds) {
        console.log('📦 Loading guilds from cache');
        setGuilds(cachedGuilds);
        setLoading(false);
        return;
      }
      
      const guildsSnapshot = await getDocs(collection(db, 'guilds'));
      const guildsData: Guild[] = guildsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Guild));
      
      // Cache for 5 minutes
      cache.set(CacheKeys.guilds.list(), guildsData, 5 * 60 * 1000);
      setGuilds(guildsData);
    } catch (error) {
      const errorResponse = handleError(error, 'Guilds Loading');
      console.error('Error loading guilds:', errorResponse.message);
      setGuilds([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuilds = guilds.filter(guild => 
    !searchTerm || 
    guild.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guild.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }} role="status" aria-live="polite">
        <div className="spinner" aria-label="Loading guilds"></div>
      </div>
    );
  }

  return (
    <div className="guilds-page" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: theme.textPrimary, fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            Guild Management
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: '16px' }}>
            Manage and monitor all platform guilds
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={20} style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: theme.textSecondary 
          }} />
          <input
            type="text"
            placeholder="Search guilds by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search guilds"
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              borderRadius: '8px',
              border: `2px solid ${theme.border}`,
              backgroundColor: theme.inputBackground,
              color: theme.textPrimary,
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = theme.primary}
            onBlur={(e) => e.target.style.borderColor = theme.border}
          />
        </div>
      </div>

      {/* Guilds Content */}
      {filteredGuilds.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '24px' 
        }}>
          {filteredGuilds.map((guild) => (
              <div 
                key={guild.id}
                style={{ 
                  backgroundColor: theme.surface,
                  borderRadius: '12px',
                  padding: '24px',
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <Shield size={24} color={theme.primary} style={{ marginRight: '12px' }} />
                  <h3 style={{ color: theme.textPrimary, margin: 0 }}>
                    {guild.name || 'Unnamed Guild'}
                  </h3>
                </div>
                
                <p style={{ color: theme.textSecondary, marginBottom: '16px' }}>
                  {guild.description || 'No description available'}
                </p>
                
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={16} color={theme.textSecondary} />
                    <span style={{ color: theme.textSecondary }}>
                      {guild.memberCount || 0} members
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={16} color={theme.textSecondary} />
                    <span style={{ color: theme.textSecondary }}>
                      {guild.createdAt ? new Date(guild.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px' }} role="status">
          <Shield size={64} color={theme.textSecondary} style={{ marginBottom: '24px' }} aria-hidden="true" />
          <h2 style={{ color: theme.textPrimary, marginBottom: '8px' }}>No Guilds Found</h2>
          <p style={{ color: theme.textSecondary }}>
            {searchTerm ? `No guilds match "${searchTerm}".` : 'No guilds have been created yet.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: theme.primary,
                color: theme.buttonText,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GuildsPage;

