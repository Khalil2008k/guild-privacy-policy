import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Briefcase
} from 'lucide-react';
import { db, auth } from '../utils/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, getDoc, addDoc } from 'firebase/firestore';
import { handleError } from '../utils/errorHandler';
import { cache, CacheKeys } from '../utils/cache';
import { validateRequired, sanitizeString } from '../utils/validation';
import './JobApproval.css';

// Job interface
export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number | { min: number; max: number } | string;
  status: string;
  adminStatus: 'pending_review' | 'approved' | 'rejected' | string;
  createdAt: any;
  location?: string | { address: string };
  employerId?: string;
  clientName?: string;
  isUrgent?: boolean;
  skills?: string[];
  offers?: Array<{
    freelancerName: string;
    amount: number;
    message: string;
    deliveryTime: string;
    createdAt: any;
  }>;
  timeNeeded?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
}

const JobApprovalPage: React.FC = () => {
  const { theme } = useTheme();
  const { user: currentAdmin, isAuthorized } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending_review' | 'all' | 'approved' | 'rejected'>('pending_review');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [jobToReject, setJobToReject] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, [filter]);

  // Helper function to notify user about job approval/rejection
  const notifyUser = async (userId: string, jobTitle: string, type: 'approved' | 'rejected', reason?: string) => {
    try {
      const notificationData = {
        userId,
        type: type === 'approved' ? 'JOB_APPROVED' : 'JOB_REJECTED',
        title: type === 'approved' ? 'Job Approved ✅' : 'Job Rejected',
        message: type === 'approved' 
          ? `Your job "${jobTitle}" has been approved and is now visible to freelancers.`
          : `Your job "${jobTitle}" was rejected. ${reason ? `Reason: ${reason}` : ''}`,
        data: {
          jobTitle,
          status: type,
          reason: reason || null
        },
        isRead: false,
        createdAt: new Date(),
        priority: 'high',
        category: 'jobs'
      };

      await addDoc(collection(db, 'notifications'), notificationData);
      console.log(`✅ Notification sent to user ${userId} about job ${type}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw - notification failure shouldn't block approval/rejection
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      // Try cache first
      const cacheKey = CacheKeys.jobs.list({ filter });
      const cachedJobs = cache.get<Job[]>(cacheKey);
      
      if (cachedJobs) {
        console.log('📦 Loading jobs from cache');
        setJobs(cachedJobs);
        setLoading(false);
        return;
      }
      
      // Build Firebase query
      let jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(50));
      
      if (filter !== 'all') {
        jobsQuery = query(collection(db, 'jobs'), where('adminStatus', '==', filter), orderBy('createdAt', 'desc'), limit(50));
      }

      const snapshot = await getDocs(jobsQuery);
      const jobsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Job));

      // Cache for 3 minutes
      cache.set(cacheKey, jobsList, 3 * 60 * 1000);
      setJobs(jobsList);
    } catch (error) {
      const errorResponse = handleError(error, 'Job Loading');
      console.error('Error loading jobs:', errorResponse.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveJob = async (jobId: string) => {
    if (!currentAdmin || !isAuthorized('jobs.edit')) {
      alert('⚠️ You do not have permission to perform this action');
      return;
    }

    try {
      // Get job details first to get clientId and title
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      
      if (!jobSnap.exists()) {
        alert('❌ Job not found');
        return;
      }

      const jobData = jobSnap.data();
      
      // Deduct coins for promotions if applicable
      if (jobData.promotionCost && jobData.promotionCost > 0) {
        try {
          // Call backend API to deduct coins
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/v1/coins/deduct`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
            },
            body: JSON.stringify({
              userId: jobData.clientId,
              amount: jobData.promotionCost,
              metadata: {
                type: 'job_promotion',
                description: `Promotion cost for job: ${jobData.title}`,
                jobId: jobId
              }
            })
          });

          if (!response.ok) {
            console.error('Failed to deduct coins:', await response.text());
            alert('⚠️ Job approved but failed to deduct promotion coins. Please deduct manually.');
          } else {
            console.log('✅ Coins deducted successfully for promotions');
          }
        } catch (error) {
          console.error('Error deducting coins:', error);
          alert('⚠️ Job approved but failed to deduct promotion coins. Please deduct manually.');
        }
      }
      
      // Update job status
      await updateDoc(jobRef, {
        adminStatus: 'approved',
        approvedBy: currentAdmin.uid,
        approvedAt: new Date(),
        status: 'open' // Also mark as open for applicants
      });
      
      // Notify the job poster
      if (jobData.clientId) {
        await notifyUser(jobData.clientId, jobData.title, 'approved');
      }
      
      // Invalidate cache and reload
      cache.invalidatePattern('jobs:.*');
      await loadJobs();
      
      alert('✅ Job approved successfully!');
    } catch (error) {
      const errorResponse = handleError(error, 'Job Approval');
      console.error('Error approving job:', errorResponse.message);
      alert(`❌ Error approving job: ${errorResponse.message}`);
    }
  };

  const handleRejectJob = async () => {
    if (!currentAdmin || !isAuthorized('jobs.edit')) {
      alert('⚠️ You do not have permission to perform this action');
      return;
    }
    
    if (!jobToReject) {
      alert('⚠️ No job selected');
      return;
    }

    // Validate rejection reason
    const validation = validateRequired(rejectionReason.trim(), 'Rejection reason');
    if (!validation.isValid) {
      alert(`⚠️ ${validation.errors[0]}`);
      return;
    }

    if (rejectionReason.trim().length < 10) {
      alert('⚠️ Rejection reason must be at least 10 characters long');
      return;
    }

    try {
      const sanitizedReason = sanitizeString(rejectionReason);
      
      // Get job details first to get clientId and title
      const jobRef = doc(db, 'jobs', jobToReject);
      const jobSnap = await getDoc(jobRef);
      
      if (!jobSnap.exists()) {
        alert('❌ Job not found');
        return;
      }

      const jobData = jobSnap.data();
      
      // Update job status
      await updateDoc(jobRef, {
        adminStatus: 'rejected',
        rejectedBy: currentAdmin.uid,
        rejectedAt: new Date(),
        rejectionReason: sanitizedReason,
        status: 'rejected'
      });
      
      // Notify the job poster
      if (jobData.clientId) {
        await notifyUser(jobData.clientId, jobData.title, 'rejected', sanitizedReason);
      }
      
      // Invalidate cache and reload
      cache.invalidatePattern('jobs:.*');
      await loadJobs();
      
      setShowRejectionModal(false);
      setJobToReject(null);
      setRejectionReason('');
      
      alert('✅ Job rejected successfully!');
    } catch (error) {
      const errorResponse = handleError(error, 'Job Rejection');
      console.error('Error rejecting job:', errorResponse.message);
      alert(`❌ Error rejecting job: ${errorResponse.message}`);
    }
  };

  const openRejectionModal = (jobId: string) => {
    setJobToReject(jobId);
    setShowRejectionModal(true);
  };

  const viewJobDetails = async (jobId: string) => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      
      if (jobSnap.exists()) {
        setSelectedJob({ id: jobSnap.id, ...jobSnap.data() } as Job);
        setShowJobModal(true);
      }
    } catch (error) {
      console.error('Error loading job details:', error);
    }
  };

  const getStatusBadge = (adminStatus: string, _status: string) => {
    switch (adminStatus) {
      case 'pending_review':
        return (
          <span className="status-badge pending">
            <Clock size={14} />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="status-badge approved">
            <CheckCircle size={14} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="status-badge rejected">
            <XCircle size={14} />
            Rejected
          </span>
        );
      default:
        return (
          <span className="status-badge unknown">
            <AlertTriangle size={14} />
            Unknown
          </span>
        );
    }
  };

  const formatBudget = (budget: Job['budget']): string => {
    if (typeof budget === 'string') {
      return `QAR ${budget}`;
    }
    if (typeof budget === 'number') {
      return `QAR ${budget.toLocaleString()}`;
    }
    if (budget && typeof budget === 'object' && 'min' in budget && 'max' in budget) {
      return `QAR ${budget.min.toLocaleString()} - ${budget.max.toLocaleString()}`;
    }
    return 'Budget not specified';
  };

  const formatLocation = (location: Job['location']): string => {
    if (typeof location === 'string') {
      return location;
    }
    if (location && typeof location === 'object' && 'address' in location) {
      return location.address || 'Location not specified';
    }
    return 'Remote';
  };

  if (loading) {
    return (
      <div className="job-approval-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="job-approval-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ color: theme.textPrimary }}>Job Management & Approval</h1>
          <p style={{ color: theme.textSecondary }}>
            Review and approve job postings before they go live
          </p>
        </div>
        
        <div className="header-filters">
          <select 
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{ 
              backgroundColor: theme.surface,
              color: theme.textPrimary,
              borderColor: theme.border 
            }}
          >
            <option value="pending_review">Pending Review ({jobs.filter(j => j.adminStatus === 'pending_review').length})</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Jobs</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="jobs-grid">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id} className="job-card" style={{ backgroundColor: theme.surface }}>
              <div className="job-header">
                <div className="job-title-section">
                  <h3 style={{ color: theme.textPrimary }}>{job.title}</h3>
                  {getStatusBadge(job.adminStatus, job.status)}
                </div>
                {job.isUrgent && (
                  <div className="urgent-badge" style={{ backgroundColor: theme.error + '20', color: theme.error }}>
                    <AlertTriangle size={14} />
                    Urgent
                  </div>
                )}
              </div>

              <div className="job-meta">
                <div className="meta-item">
                  <User size={16} color={theme.textSecondary} />
                  <span style={{ color: theme.textSecondary }}>{job.clientName}</span>
                </div>
                <div className="meta-item">
                  <DollarSign size={16} color={theme.textSecondary} />
                  <span style={{ color: theme.textSecondary }}>{formatBudget(job.budget)}</span>
                </div>
                <div className="meta-item">
                  <MapPin size={16} color={theme.textSecondary} />
                  <span style={{ color: theme.textSecondary }}>{formatLocation(job.location)}</span>
                </div>
                <div className="meta-item">
                  <Calendar size={16} color={theme.textSecondary} />
                  <span style={{ color: theme.textSecondary }}>
                    {job.createdAt instanceof Date 
                      ? job.createdAt.toLocaleDateString()
                      : new Date(job.createdAt.toDate()).toLocaleDateString()
                    }
                  </span>
                </div>
              </div>

              <div className="job-description">
                <p style={{ color: theme.textSecondary }}>
                  {job.description.length > 150 
                    ? `${job.description.substring(0, 150)}...` 
                    : job.description
                  }
                </p>
              </div>

              <div className="job-skills">
                {job.skills && job.skills.length > 0 ? (
                  <>
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <span 
                        key={index} 
                        className="skill-tag"
                        style={{ 
                          backgroundColor: theme.primary + '20',
                          color: theme.primary 
                        }}
                      >
                        <Tag size={12} />
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <span style={{ color: theme.textSecondary, fontSize: '12px' }}>
                        +{job.skills.length - 3} more
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: theme.textSecondary, fontSize: '12px' }}>No skills specified</span>
                )}
              </div>

              <div className="job-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => viewJobDetails(job.id)}
                  aria-label={`View details for ${job.title}`}
                  style={{ 
                    backgroundColor: theme.background,
                    color: theme.textPrimary,
                    borderColor: theme.border 
                  }}
                >
                  <Eye size={16} aria-hidden="true" />
                  View Details
                </button>

                {job.adminStatus === 'pending_review' && isAuthorized('jobs.edit') && (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApproveJob(job.id)}
                      aria-label={`Approve job: ${job.title}`}
                      style={{ backgroundColor: theme.success, color: 'white' }}
                    >
                      <CheckCircle size={16} aria-hidden="true" />
                      Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => openRejectionModal(job.id)}
                      aria-label={`Reject job: ${job.title}`}
                      style={{ backgroundColor: theme.error, color: 'white' }}
                    >
                      <XCircle size={16} aria-hidden="true" />
                      Reject
                    </button>
                  </>
                )}

                {job.offers && job.offers.length > 0 && (
                  <div className="offers-indicator" style={{ color: theme.info }} aria-label={`${job.offers.length} offers received`}>
                    <MessageSquare size={16} aria-hidden="true" />
                    {job.offers.length} offer{job.offers.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '60px', color: theme.textSecondary }}>
            <Briefcase size={64} color={theme.textSecondary} />
            <h3 style={{ color: theme.textPrimary, marginTop: '16px' }}>No Jobs Found</h3>
            <p>No jobs match the current filter criteria.</p>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowJobModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-modal-title"
        >
          <div 
            className="modal-content job-modal"
            style={{ backgroundColor: theme.surface }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="job-modal-title" style={{ color: theme.textPrimary }}>{selectedJob.title}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowJobModal(false)}
                aria-label="Close job details modal"
                style={{ color: theme.textSecondary }}
              >
                <XCircle size={24} aria-hidden="true" />
              </button>
            </div>

            <div className="modal-body">
              <div className="job-detail-section">
                <h4 style={{ color: theme.textPrimary }}>Job Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span style={{ color: theme.textSecondary }}>Client:</span>
                    <span style={{ color: theme.textPrimary }}>{selectedJob.clientName}</span>
                  </div>
                  <div className="detail-item">
                    <span style={{ color: theme.textSecondary }}>Budget:</span>
                    <span style={{ color: theme.textPrimary }}>{formatBudget(selectedJob.budget)}</span>
                  </div>
                  <div className="detail-item">
                    <span style={{ color: theme.textSecondary }}>Location:</span>
                    <span style={{ color: theme.textPrimary }}>{formatLocation(selectedJob.location)}</span>
                  </div>
                  <div className="detail-item">
                    <span style={{ color: theme.textSecondary }}>Time Needed:</span>
                    <span style={{ color: theme.textPrimary }}>{selectedJob.timeNeeded}</span>
                  </div>
                  <div className="detail-item">
                    <span style={{ color: theme.textSecondary }}>Category:</span>
                    <span style={{ color: theme.textPrimary }}>{selectedJob.category}</span>
                  </div>
                  <div className="detail-item">
                    <span style={{ color: theme.textSecondary }}>Posted:</span>
                    <span style={{ color: theme.textPrimary }}>
                      {selectedJob.createdAt instanceof Date 
                        ? selectedJob.createdAt.toLocaleDateString()
                        : new Date(selectedJob.createdAt.toDate()).toLocaleDateString()
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="job-detail-section">
                <h4 style={{ color: theme.textPrimary }}>Description</h4>
                <p style={{ color: theme.textSecondary, lineHeight: '1.6' }}>
                  {selectedJob.description}
                </p>
              </div>

              <div className="job-detail-section">
                <h4 style={{ color: theme.textPrimary }}>Required Skills</h4>
                <div className="skills-list">
                  {selectedJob.skills && selectedJob.skills.length > 0 ? (
                    selectedJob.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="skill-tag"
                        style={{ 
                          backgroundColor: theme.primary + '20',
                          color: theme.primary 
                        }}
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: theme.textSecondary }}>No skills specified</p>
                  )}
                </div>
              </div>

              {selectedJob.offers && selectedJob.offers.length > 0 && (
                <div className="job-detail-section">
                  <h4 style={{ color: theme.textPrimary }}>Offers ({selectedJob.offers.length})</h4>
                  <div className="offers-list">
                    {selectedJob.offers.map((offer, index) => (
                      <div key={index} className="offer-item" style={{ backgroundColor: theme.background }}>
                        <div className="offer-header">
                          <span style={{ color: theme.textPrimary }}>{offer.freelancerName}</span>
                          <span style={{ color: theme.success, fontWeight: 'bold' }}>
                            QAR {offer.amount}
                          </span>
                        </div>
                        <p style={{ color: theme.textSecondary, fontSize: '14px' }}>
                          {offer.message}
                        </p>
                        <div style={{ color: theme.textSecondary, fontSize: '12px' }}>
                          Delivery: {offer.deliveryTime} • 
                          Posted: {offer.createdAt instanceof Date 
                            ? offer.createdAt.toLocaleDateString()
                            : new Date(offer.createdAt.toDate()).toLocaleDateString()
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedJob.adminStatus === 'pending_review' && isAuthorized('jobs.edit') && (
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowJobModal(false)}
                  style={{ 
                    backgroundColor: theme.background,
                    color: theme.textPrimary,
                    borderColor: theme.border 
                  }}
                >
                  Close
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setShowJobModal(false);
                    openRejectionModal(selectedJob.id);
                  }}
                  style={{ backgroundColor: theme.error, color: 'white' }}
                >
                  <XCircle size={16} />
                  Reject Job
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleApproveJob(selectedJob.id);
                    setShowJobModal(false);
                  }}
                  style={{ backgroundColor: theme.success, color: 'white' }}
                >
                  <CheckCircle size={16} />
                  Approve Job
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowRejectionModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rejection-modal-title"
        >
          <div 
            className="modal-content rejection-modal"
            style={{ backgroundColor: theme.surface }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="rejection-modal-title" style={{ color: theme.textPrimary }}>Reject Job</h3>
              <button 
                className="close-btn"
                onClick={() => setShowRejectionModal(false)}
                aria-label="Close rejection modal"
                style={{ color: theme.textSecondary }}
              >
                <XCircle size={24} aria-hidden="true" />
              </button>
            </div>

            <div className="modal-body">
              <label htmlFor="rejection-reason" style={{ color: theme.textSecondary, marginBottom: '16px', display: 'block' }}>
                Please provide a reason for rejecting this job posting (minimum 10 characters):
              </label>
              <textarea
                id="rejection-reason"
                className="rejection-textarea"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                aria-required="true"
                aria-describedby="rejection-hint"
                minLength={10}
                required
                style={{ 
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                  borderColor: theme.border 
                }}
                rows={4}
              />
              <small id="rejection-hint" style={{ color: theme.textSecondary, fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Characters: {rejectionReason.length} / 10 minimum
              </small>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowRejectionModal(false)}
                style={{ 
                  backgroundColor: theme.background,
                  color: theme.textPrimary,
                  borderColor: theme.border 
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRejectJob}
                disabled={!rejectionReason.trim()}
                style={{ backgroundColor: theme.error, color: 'white' }}
              >
                <XCircle size={16} />
                Reject Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApprovalPage;
