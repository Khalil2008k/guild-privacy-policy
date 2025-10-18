import { BackendAPI } from '@/config/backend';

export interface JobStatus {
  isSaved: boolean;
  isLiked: boolean;
}

export interface SavedJob {
  id: string;
  title: string;
  description: string;
  salary: string;
  location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  status: string;
  createdAt: string;
  company: string;
  skills: string[];
}

export interface LikedJob extends SavedJob {}

class UserPreferencesService {
  /**
   * Save a job to user's saved jobs
   */
  static async saveJob(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await BackendAPI.post('/user-preferences/save-job', {
        jobId
      });
      
      return {
        success: true,
        message: response.data.message || 'Job saved successfully'
      };
    } catch (error: any) {
      console.error('Error saving job:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to save job'
      };
    }
  }

  /**
   * Unsave a job from user's saved jobs
   */
  static async unsaveJob(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await BackendAPI.delete(`/user-preferences/unsave-job/${jobId}`);
      
      return {
        success: true,
        message: response.data.message || 'Job unsaved successfully'
      };
    } catch (error: any) {
      console.error('Error unsaving job:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to unsave job'
      };
    }
  }

  /**
   * Like a job
   */
  static async likeJob(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await BackendAPI.post('/user-preferences/like-job', {
        jobId
      });
      
      return {
        success: true,
        message: response.data.message || 'Job liked successfully'
      };
    } catch (error: any) {
      console.error('Error liking job:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to like job'
      };
    }
  }

  /**
   * Unlike a job
   */
  static async unlikeJob(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await BackendAPI.delete(`/user-preferences/unlike-job/${jobId}`);
      
      return {
        success: true,
        message: response.data.message || 'Job unliked successfully'
      };
    } catch (error: any) {
      console.error('Error unliking job:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to unlike job'
      };
    }
  }

  /**
   * Get user's saved jobs
   */
  static async getSavedJobs(): Promise<{ success: boolean; data: SavedJob[]; message?: string }> {
    try {
      const response = await BackendAPI.get('/user-preferences/saved-jobs');
      
      return {
        success: true,
        data: response.data.data.savedJobs || []
      };
    } catch (error: any) {
      console.error('Error getting saved jobs:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.error || 'Failed to get saved jobs'
      };
    }
  }

  /**
   * Get user's liked jobs
   */
  static async getLikedJobs(): Promise<{ success: boolean; data: LikedJob[]; message?: string }> {
    try {
      const response = await BackendAPI.get('/user-preferences/liked-jobs');
      
      return {
        success: true,
        data: response.data.data.likedJobs || []
      };
    } catch (error: any) {
      console.error('Error getting liked jobs:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.error || 'Failed to get liked jobs'
      };
    }
  }

  /**
   * Check if a job is saved/liked by the current user
   */
  static async getJobStatus(jobId: string): Promise<{ success: boolean; data: JobStatus; message?: string }> {
    try {
      const response = await BackendAPI.get(`/user-preferences/job-status/${jobId}`);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error getting job status:', error);
      return {
        success: false,
        data: { isSaved: false, isLiked: false },
        message: error.response?.data?.error || 'Failed to get job status'
      };
    }
  }

  /**
   * Toggle save status of a job
   */
  static async toggleSaveJob(jobId: string, currentStatus: boolean): Promise<{ success: boolean; message: string }> {
    if (currentStatus) {
      return await this.unsaveJob(jobId);
    } else {
      return await this.saveJob(jobId);
    }
  }

  /**
   * Toggle like status of a job
   */
  static async toggleLikeJob(jobId: string, currentStatus: boolean): Promise<{ success: boolean; message: string }> {
    if (currentStatus) {
      return await this.unlikeJob(jobId);
    } else {
      return await this.likeJob(jobId);
    }
  }
}

export { UserPreferencesService };


