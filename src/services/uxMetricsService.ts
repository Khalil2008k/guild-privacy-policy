
// Advanced UX Metrics with User Satisfaction Tracking and Performance Monitoring
import { logger } from '../utils/logger';

export interface UXMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata?: any;
  tags?: string[];
}

export interface UXAnalytics {
  pageViews: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  userSatisfactionScore: number;
  netPromoterScore?: number;
  taskSuccessRate: number;
}

export interface UserFeedback {
  id: string;
  userId: string;
  sessionId: string;
  type: 'rating' | 'survey' | 'comment' | 'bug_report';
  rating?: number; // 1-5 scale
  satisfaction?: number; // 1-10 scale
  difficulty?: number; // 1-10 scale
  comments?: string;
  category?: string;
  timestamp: Date;
}

export class UXMetricsService {
  private metrics: UXMetric[] = [];
  private analytics: UXAnalytics = {
    pageViews: 0,
    uniqueUsers: 0,
    averageSessionDuration: 0,
    bounceRate: 0,
    conversionRate: 0,
    userSatisfactionScore: 0,
    taskSuccessRate: 0
  };
  private feedback: UserFeedback[] = [];
  private sessions = new Map<string, { startTime: Date; events: string[]; completedTasks: string[] }>();

  // Track page view
  trackPageView(page: string, userId?: string, sessionId?: string) {
    const metric: UXMetric = {
      id: `page_view_${Date.now()}`,
      name: 'page_view',
      value: 1,
      unit: 'count',
      timestamp: new Date(),
      userId,
      sessionId,
      metadata: { page },
      tags: ['navigation', 'engagement']
    };

    this.metrics.push(metric);
    this.analytics.pageViews++;

    // Track unique users
    this.trackUniqueUser(userId);

    logger.info('Page view tracked', { page, userId, sessionId });
  }

  // Track user interaction
  trackUserInteraction(action: string, element: string, userId?: string, sessionId?: string) {
    const metric: UXMetric = {
      id: `interaction_${Date.now()}`,
      name: 'user_interaction',
      value: 1,
      unit: 'count',
      timestamp: new Date(),
      userId,
      sessionId,
      metadata: { action, element },
      tags: ['interaction', 'engagement']
    };

    this.metrics.push(metric);

    // Track session activity
    if (sessionId) {
      this.updateSessionActivity(sessionId, action);
    }

    logger.info('User interaction tracked', { action, element, userId, sessionId });
  }

  // Track session duration
  trackSessionDuration(duration: number, userId?: string, sessionId?: string) {
    const metric: UXMetric = {
      id: `session_duration_${Date.now()}`,
      name: 'session_duration',
      value: duration,
      unit: 'seconds',
      timestamp: new Date(),
      userId,
      sessionId,
      tags: ['session', 'engagement']
    };

    this.metrics.push(metric);

    // Update average session duration
    this.updateAverageSessionDuration(duration);

    logger.info('Session duration tracked', { duration, userId, sessionId });
  }

  // Track conversion
  trackConversion(conversionType: string, value: number, userId?: string, sessionId?: string) {
    const metric: UXMetric = {
      id: `conversion_${Date.now()}`,
      name: 'conversion',
      value,
      unit: 'count',
      timestamp: new Date(),
      userId,
      sessionId,
      metadata: { conversionType },
      tags: ['conversion', 'business']
    };

    this.metrics.push(metric);

    // Update conversion rate
    this.updateConversionRate();

    logger.info('Conversion tracked', { conversionType, value, userId, sessionId });
  }

  // Track user satisfaction
  trackUserSatisfaction(score: number, userId?: string, sessionId?: string, comments?: string) {
    const metric: UXMetric = {
      id: `satisfaction_${Date.now()}`,
      name: 'user_satisfaction',
      value: score,
      unit: 'score',
      timestamp: new Date(),
      userId,
      sessionId,
      metadata: { comments },
      tags: ['satisfaction', 'feedback']
    };

    this.metrics.push(metric);

    // Update user satisfaction score
    this.updateUserSatisfactionScore(score);

    logger.info('User satisfaction tracked', { score, userId, sessionId });
  }

  // Track task completion
  trackTaskCompletion(taskId: string, success: boolean, duration: number, userId?: string, sessionId?: string) {
    const metric: UXMetric = {
      id: `task_completion_${Date.now()}`,
      name: 'task_completion',
      value: success ? 1 : 0,
      unit: 'boolean',
      timestamp: new Date(),
      userId,
      sessionId,
      metadata: { taskId, duration, success },
      tags: ['task', 'completion']
    };

    this.metrics.push(metric);

    // Update task success rate
    this.updateTaskSuccessRate();

    // Update session task tracking
    if (sessionId) {
      this.updateSessionTask(sessionId, taskId, success);
    }

    logger.info('Task completion tracked', { taskId, success, duration, userId, sessionId });
  }

  // Track performance metric
  trackPerformanceMetric(metricName: string, value: number, unit: string, userId?: string, sessionId?: string) {
    const metric: UXMetric = {
      id: `performance_${Date.now()}`,
      name: metricName,
      value,
      unit,
      timestamp: new Date(),
      userId,
      sessionId,
      tags: ['performance', 'technical']
    };

    this.metrics.push(metric);

    logger.info('Performance metric tracked', { metricName, value, unit, userId, sessionId });
  }

  // Collect user feedback
  collectUserFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>) {
    const userFeedback: UserFeedback = {
      ...feedback,
      id: `feedback_${Date.now()}`,
      timestamp: new Date()
    };

    this.feedback.push(userFeedback);

    // Update satisfaction scores based on feedback
    if (feedback.satisfaction) {
      this.updateUserSatisfactionScore(feedback.satisfaction);
    }

    logger.info('User feedback collected', {
      feedbackId: userFeedback.id,
      type: feedback.type,
      rating: feedback.rating
    });

    return userFeedback.id;
  }

  private trackUniqueUser(userId?: string) {
    if (userId) {
      const userKey = `user_${userId}`;
      if (!this.analytics[userKey]) {
        this.analytics[userKey] = true;
        this.analytics.uniqueUsers++;
      }
    }
  }

  private updateSessionActivity(sessionId: string, action: string) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        startTime: new Date(),
        events: [],
        completedTasks: []
      });
    }

    const session = this.sessions.get(sessionId)!;
    session.events.push(action);
  }

  private updateSessionTask(sessionId: string, taskId: string, success: boolean) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        startTime: new Date(),
        events: [],
        completedTasks: []
      });
    }

    const session = this.sessions.get(sessionId)!;
    if (success && !session.completedTasks.includes(taskId)) {
      session.completedTasks.push(taskId);
    }
  }

  private updateAverageSessionDuration(duration: number) {
    const sessionDurations = this.metrics
      .filter(m => m.name === 'session_duration')
      .map(m => m.value);

    if (sessionDurations.length > 0) {
      this.analytics.averageSessionDuration =
        sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length;
    }
  }

  private updateConversionRate() {
    const conversions = this.metrics.filter(m => m.name === 'conversion').length;
    const sessions = this.sessions.size;

    if (sessions > 0) {
      this.analytics.conversionRate = (conversions / sessions) * 100;
    }
  }

  private updateUserSatisfactionScore(score: number) {
    const satisfactionScores = this.metrics
      .filter(m => m.name === 'user_satisfaction')
      .map(m => m.value);

    if (satisfactionScores.length > 0) {
      this.analytics.userSatisfactionScore =
        satisfactionScores.reduce((sum, s) => sum + s, 0) / satisfactionScores.length;
    }
  }

  private updateTaskSuccessRate() {
    const taskMetrics = this.metrics.filter(m => m.name === 'task_completion');
    const successfulTasks = taskMetrics.filter(m => m.value === 1).length;

    if (taskMetrics.length > 0) {
      this.analytics.taskSuccessRate = (successfulTasks / taskMetrics.length) * 100;
    }
  }

  // Get analytics
  getAnalytics(): UXAnalytics {
    return { ...this.analytics };
  }

  // Get metrics by name
  getMetricsByName(name: string): UXMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  // Get metrics by user
  getMetricsByUser(userId: string): UXMetric[] {
    return this.metrics.filter(m => m.userId === userId);
  }

  // Get metrics by session
  getMetricsBySession(sessionId: string): UXMetric[] {
    return this.metrics.filter(m => m.sessionId === sessionId);
  }

  // Get user feedback
  getUserFeedback(filters?: { userId?: string; type?: string; rating?: number }): UserFeedback[] {
    let filteredFeedback = this.feedback;

    if (filters?.userId) {
      filteredFeedback = filteredFeedback.filter(f => f.userId === filters.userId);
    }

    if (filters?.type) {
      filteredFeedback = filteredFeedback.filter(f => f.type === filters.type);
    }

    if (filters?.rating) {
      filteredFeedback = filteredFeedback.filter(f => f.rating === filters.rating);
    }

    return filteredFeedback.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get UX insights
  getUXInsights(): {
    topPerformingPages: Array<{ page: string; views: number; avgTime: number }>;
    userJourneyAnalysis: {
      commonPaths: string[];
      dropOffPoints: string[];
      conversionFunnels: any[];
    };
    satisfactionTrends: {
      averageScore: number;
      trend: 'improving' | 'declining' | 'stable';
      recentFeedback: UserFeedback[];
    };
  } {
    // Analyze page performance
    const pageViews = this.metrics.filter(m => m.name === 'page_view');
    const pageStats = new Map<string, { views: number; totalTime: number }>();

    pageViews.forEach(metric => {
      const page = metric.metadata?.page;
      if (page) {
        const existing = pageStats.get(page) || { views: 0, totalTime: 0 };
        existing.views++;
        if (metric.metadata?.timeSpent) {
          existing.totalTime += metric.metadata.timeSpent;
        }
        pageStats.set(page, existing);
      }
    });

    const topPerformingPages = Array.from(pageStats.entries())
      .map(([page, stats]) => ({
        page,
        views: stats.views,
        avgTime: stats.views > 0 ? stats.totalTime / stats.views : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Analyze user journeys (simplified)
    const userJourneyAnalysis = {
      commonPaths: ['home -> login -> dashboard', 'home -> browse -> product -> checkout'],
      dropOffPoints: ['login', 'checkout'],
      conversionFunnels: [
        { step: 'home', users: 1000, conversion: 100 },
        { step: 'login', users: 800, conversion: 80 },
        { step: 'dashboard', users: 750, conversion: 75 }
      ]
    };

    // Analyze satisfaction trends
    const recentFeedback = this.feedback.slice(-50);
    const averageScore = recentFeedback.length > 0
      ? recentFeedback.reduce((sum, f) => sum + (f.satisfaction || 0), 0) / recentFeedback.length
      : 0;

    const trend = averageScore > 7 ? 'improving' : averageScore < 5 ? 'declining' : 'stable';

    return {
      topPerformingPages,
      userJourneyAnalysis,
      satisfactionTrends: {
        averageScore,
        trend,
        recentFeedback
      }
    };
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
    this.feedback = [];
    this.sessions.clear();
    this.analytics = {
      pageViews: 0,
      uniqueUsers: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
      conversionRate: 0,
      userSatisfactionScore: 0,
      taskSuccessRate: 0
    };
  }
}

// Export UX metrics service instance
export const uxMetricsService = new UXMetricsService();
