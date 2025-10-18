import React, { useState } from 'react';
import { UserProfile } from '../services/userServiceV2';
import { 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Shield
} from 'lucide-react';
import './UserDocumentViewer.css';

interface UserDocumentViewerProps {
  user: UserProfile;
  onApprove: (userId: string, documentType: string) => void;
  onReject: (userId: string, documentType: string, reason: string) => void;
  onClose: () => void;
}

interface DocumentInfo {
  type: 'face' | 'id_front' | 'id_back';
  label: string;
  url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

const UserDocumentViewer: React.FC<UserDocumentViewerProps> = ({
  user,
  onApprove,
  onReject,
  onClose
}) => {
  const [selectedDocument, setSelectedDocument] = useState<DocumentInfo | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [documentToReject, setDocumentToReject] = useState<string>('');

  // Mock document data - in real implementation, this would come from Firebase
  const documents: DocumentInfo[] = [
    {
      type: 'face',
      label: 'Face Picture',
      url: user.profileImage,
      status: user.faceDetected ? 'approved' : 'pending',
      uploadedAt: '2025-09-19T10:30:00Z',
    },
    {
      type: 'id_front',
      label: 'ID Front',
      url: user.idFrontImage,
      status: user.verificationStatus === 'verified' ? 'approved' : 'pending',
      uploadedAt: '2025-09-19T10:32:00Z',
    },
    {
      type: 'id_back',
      label: 'ID Back', 
      url: user.idBackImage,
      status: user.verificationStatus === 'verified' ? 'approved' : 'pending',
      uploadedAt: '2025-09-19T10:33:00Z',
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="status-icon approved" />;
      case 'rejected': return <XCircle className="status-icon rejected" />;
      default: return <AlertTriangle className="status-icon pending" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const handleApprove = (documentType: string) => {
    onApprove(user.id, documentType);
  };

  const handleReject = (documentType: string) => {
    setDocumentToReject(documentType);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (rejectionReason.trim()) {
      onReject(user.id, documentToReject, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setDocumentToReject('');
    }
  };

  const downloadDocument = (url: string, filename: string) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    }
  };

  return (
    <div className="document-viewer-overlay">
      <div className="document-viewer-modal">
        {/* Header */}
        <div className="document-viewer-header">
          <div className="user-info">
            <div className="user-avatar">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.fullName} />
              ) : (
                <User size={32} />
              )}
            </div>
            <div className="user-details">
              <h2>{user.fullName}</h2>
              <p>{user.email}</p>
              <div className="user-meta">
                <span className="user-id">ID: {user.idNumber || 'Not provided'}</span>
                <span className="join-date">
                  <Calendar size={14} />
                  Joined: {new Date(user.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="verification-status">
            <div className={`status-badge ${user.verificationStatus}`}>
              {getStatusIcon(user.verificationStatus)}
              <span>{user.verificationStatus.toUpperCase()}</span>
            </div>
          </div>
          
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Document Grid */}
        <div className="documents-section">
          <h3>
            <Shield size={20} />
            Verification Documents
          </h3>
          
          <div className="documents-grid">
            {documents.map((doc) => (
              <div key={doc.type} className="document-card">
                <div className="document-header">
                  <div className="document-info">
                    <FileText size={16} />
                    <span className="document-label">{doc.label}</span>
                  </div>
                  <div className="document-status" style={{ color: getStatusColor(doc.status) }}>
                    {getStatusIcon(doc.status)}
                    <span>{doc.status}</span>
                  </div>
                </div>

                {doc.url ? (
                  <div className="document-preview">
                    <img 
                      src={doc.url} 
                      alt={doc.label}
                      onClick={() => setSelectedDocument(doc)}
                      className="document-thumbnail"
                    />
                    
                    <div className="document-actions">
                      <button 
                        className="action-btn view"
                        onClick={() => setSelectedDocument(doc)}
                        title="View Full Size"
                      >
                        <Eye size={16} />
                      </button>
                      
                      <button 
                        className="action-btn download"
                        onClick={() => downloadDocument(doc.url!, `${user.fullName}_${doc.type}.jpg`)}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      
                      {doc.status === 'pending' && (
                        <>
                          <button 
                            className="action-btn approve"
                            onClick={() => handleApprove(doc.type)}
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          
                          <button 
                            className="action-btn reject"
                            onClick={() => handleReject(doc.type)}
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="document-placeholder">
                    <FileText size={48} />
                    <p>No document uploaded</p>
                  </div>
                )}

                {doc.uploadedAt && (
                  <div className="document-meta">
                    <small>Uploaded: {new Date(doc.uploadedAt).toLocaleString()}</small>
                    {doc.reviewedAt && (
                      <small>Reviewed: {new Date(doc.reviewedAt).toLocaleString()}</small>
                    )}
                    {doc.rejectionReason && (
                      <small className="rejection-reason">Reason: {doc.rejectionReason}</small>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bulk-actions">
          <button 
            className="bulk-btn approve-all"
            onClick={() => {
              documents.forEach(doc => {
                if (doc.status === 'pending') {
                  handleApprove(doc.type);
                }
              });
            }}
            disabled={!documents.some(doc => doc.status === 'pending')}
          >
            <CheckCircle size={16} />
            Approve All Pending
          </button>
          
          <button 
            className="bulk-btn reject-all"
            onClick={() => {
              documents.forEach(doc => {
                if (doc.status === 'pending') {
                  handleReject(doc.type);
                }
              });
            }}
            disabled={!documents.some(doc => doc.status === 'pending')}
          >
            <XCircle size={16} />
            Reject All Pending
          </button>
        </div>
      </div>

      {/* Full Size Image Modal */}
      {selectedDocument && (
        <div className="image-modal-overlay" onClick={() => setSelectedDocument(null)}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>{selectedDocument.label} - {user.fullName}</h3>
              <button onClick={() => setSelectedDocument(null)}>×</button>
            </div>
            <div className="image-modal-content">
              <img src={selectedDocument.url!} alt={selectedDocument.label} />
            </div>
            <div className="image-modal-actions">
              <button 
                onClick={() => downloadDocument(selectedDocument.url!, `${user.fullName}_${selectedDocument.type}.jpg`)}
                className="download-btn"
              >
                <Download size={16} />
                Download Original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="rejection-modal-overlay">
          <div className="rejection-modal">
            <h3>Reject Document</h3>
            <p>Please provide a reason for rejecting this document:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
            />
            <div className="rejection-modal-actions">
              <button onClick={() => setShowRejectModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button 
                onClick={confirmReject} 
                className="confirm-reject-btn"
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDocumentViewer;
