
// Advanced Onboarding with Interactive Flows and Completion Rate Tracking
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ComponentType<any> | string;
  image?: string;
  action?: string;
  skipable: boolean;
  required: boolean;
  estimatedTime: number; // seconds
  completionCriteria?: string[];
}

export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  completionRate: number;
  averageTime: number;
  targetAudience?: string[];
  prerequisites?: string[];
}

export interface OnboardingSession {
  id: string;
  userId: string;
  flowId: string;
  currentStep: number;
  completedSteps: number[];
  startTime: Date;
  lastActivity: Date;
  timeSpent: number;
  status: 'active' | 'completed' | 'abandoned' | 'skipped';
  feedback?: {
    rating?: number;
    comments?: string;
    difficulty?: number;
  };
}

export class OnboardingService {
  private flows: Map<string, OnboardingFlow> = new Map();
  private sessions: Map<string, OnboardingSession> = new Map();
  private analytics: Map<string, any> = new Map();

  constructor() {
    this.initializeFlows();
  }

  private initializeFlows() {
    const flows: OnboardingFlow[] = [
      {
        id: 'user_onboarding',
        name: 'User Onboarding',
        description: 'Complete user onboarding and account creation process',
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Guild',
            description: 'Your platform for connecting with skilled professionals',
            content: 'WelcomeContent',
            skipable: false,
            required: true,
            estimatedTime: 30,
            completionCriteria: ['view_welcome']
          },
          {
            id: 'profile_setup',
            title: 'Set Up Your Profile',
            description: 'Tell us about yourself and your skills',
            content: 'ProfileSetupContent',
            skipable: true,
            required: false,
            estimatedTime: 180,
            completionCriteria: ['complete_profile', 'add_skills']
          },
          {
            id: 'preferences',
            title: 'Set Your Preferences',
            description: 'Customize your experience',
            content: 'PreferencesContent',
            skipable: true,
            required: false,
            estimatedTime: 120,
            completionCriteria: ['set_preferences']
          },
          {
            id: 'permissions',
            title: 'Grant Permissions',
            description: 'Allow notifications and location access',
            content: 'PermissionsContent',
            skipable: false,
            required: true,
            estimatedTime: 60,
            completionCriteria: ['grant_notifications', 'grant_location']
          },
          {
            id: 'completion',
            title: "You're All Set!",
            description: 'Start exploring opportunities',
            content: 'CompletionContent',
            skipable: false,
            required: true,
            estimatedTime: 15,
            completionCriteria: ['view_completion']
          }
        ],
        completionRate: 85,
        averageTime: 300,
        targetAudience: ['new_users'],
        prerequisites: []
      }
    ];

    flows.forEach(flow => {
      this.flows.set(flow.id, flow);
    });
  }

  // Start onboarding session
  startOnboardingSession(userId: string, flowId: string): string {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error('Flow not found');
    }

    const sessionId = `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: OnboardingSession = {
      id: sessionId,
      userId,
      flowId,
      currentStep: 0,
      completedSteps: [],
      startTime: new Date(),
      lastActivity: new Date(),
      timeSpent: 0,
      status: 'active'
    };

    this.sessions.set(sessionId, session);

    console.log('Onboarding session started', { sessionId, userId, flowId });
    return sessionId;
  }

  // Track step completion
  completeOnboardingStep(sessionId: string, stepId: string, metadata?: Record<string, any>) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const flow = this.flows.get(session.flowId);
    const step = flow?.steps.find(s => s.id === stepId);

    if (step) {
      // Update session
      session.completedSteps.push(stepId);
      session.lastActivity = new Date();
      session.timeSpent = Date.now() - session.startTime.getTime();

      // Check if all steps completed
      if (session.completedSteps.length === flow!.steps.length) {
        session.status = 'completed';
      }

      // Update analytics
      this.updateStepAnalytics(flow!.id, stepId, metadata);

      console.log('Onboarding step completed', { sessionId, stepId, timeSpent: session.timeSpent });
    }
  }

  // Skip onboarding step
  skipOnboardingStep(sessionId: string, stepId: string, reason?: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.lastActivity = new Date();
    session.timeSpent = Date.now() - session.startTime.getTime();

    // Update analytics for skip
    this.updateSkipAnalytics(session.flowId, stepId, reason);

    console.log('Onboarding step skipped', { sessionId, stepId, reason });
  }

  // Complete onboarding
  completeOnboarding(sessionId: string, feedback?: OnboardingSession['feedback']) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'completed';
    session.timeSpent = Date.now() - session.startTime.getTime();
    if (feedback) {
      session.feedback = feedback;
    }

    // Update flow analytics
    this.updateFlowAnalytics(session.flowId, session.timeSpent, feedback);

    console.log('Onboarding completed', { sessionId, timeSpent: session.timeSpent, feedback });
  }

  private updateStepAnalytics(flowId: string, stepId: string, metadata?: Record<string, any>) {
    const key = `${flowId}_${stepId}`;
    const existing = this.analytics.get(key) || {
      views: 0,
      completions: 0,
      totalTime: 0,
      skips: 0
    };

    existing.views++;
    if (metadata?.completed) {
      existing.completions++;
    }
    if (metadata?.timeSpent) {
      existing.totalTime += metadata.timeSpent;
    }
    if (metadata?.skipped) {
      existing.skips++;
    }

    this.analytics.set(key, existing);
  }

  private updateSkipAnalytics(flowId: string, stepId: string, reason?: string) {
    const key = `${flowId}_${stepId}_skip`;
    const existing = this.analytics.get(key) || {
      count: 0,
      reasons: []
    };

    existing.count++;
    if (reason) {
      existing.reasons.push(reason);
    }

    this.analytics.set(key, existing);
  }

  private updateFlowAnalytics(flowId: string, timeSpent: number, feedback?: OnboardingSession['feedback']) {
    const key = `${flowId}_flow`;
    const existing = this.analytics.get(key) || {
      starts: 0,
      completions: 0,
      totalTime: 0,
      feedback: []
    };

    existing.starts++;
    if (feedback) {
      existing.completions++;
      existing.feedback.push(feedback);
    }
    existing.totalTime += timeSpent;

    this.analytics.set(key, existing);
  }

  // Get flow analytics
  getFlowAnalytics(flowId: string): any {
    const flow = this.flows.get(flowId);
    if (!flow) return null;

    const flowAnalytics = this.analytics.get(`${flowId}_flow`) || {};
    const stepAnalytics = flow.steps.map(step => {
      const stepData = this.analytics.get(`${flowId}_${step.id}`) || {};
      return {
        stepId: step.id,
        stepName: step.name,
        views: stepData.views || 0,
        completions: stepData.completions || 0,
        completionRate: stepData.views ? (stepData.completions / stepData.views) * 100 : 0,
        averageTime: stepData.views ? stepData.totalTime / stepData.views : 0,
        skipRate: stepData.views ? (stepData.skips / stepData.views) * 100 : 0
      };
    });

    return {
      flow,
      analytics: {
        totalSessions: flowAnalytics.starts || 0,
        completedSessions: flowAnalytics.completions || 0,
        completionRate: flowAnalytics.starts ? (flowAnalytics.completions / flowAnalytics.starts) * 100 : 0,
        averageTime: flowAnalytics.starts ? flowAnalytics.totalTime / flowAnalytics.starts : 0,
        stepAnalytics
      }
    };
  }

  // Get onboarding insights
  getOnboardingInsights(): {
    overallCompletionRate: number;
    averageTimeToComplete: number;
    mostSkippedSteps: Array<{ stepId: string; skipRate: number; reasons: string[] }>;
    userSatisfaction: {
      averageRating: number;
      commonFeedback: string[];
    };
  } {
    const flows = Array.from(this.flows.values());
    const totalSessions = flows.reduce((sum, flow) => {
      const analytics = this.analytics.get(`${flow.id}_flow`) || {};
      return sum + (analytics.starts || 0);
    }, 0);

    const completedSessions = flows.reduce((sum, flow) => {
      const analytics = this.analytics.get(`${flow.id}_flow`) || {};
      return sum + (analytics.completions || 0);
    }, 0);

    const overallCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const totalTime = flows.reduce((sum, flow) => {
      const analytics = this.analytics.get(`${flow.id}_flow`) || {};
      return sum + (analytics.totalTime || 0);
    }, 0);

    const averageTimeToComplete = totalSessions > 0 ? totalTime / totalSessions : 0;

    // Find most skipped steps
    const skipData: Array<{ stepId: string; skipRate: number; reasons: string[] }> = [];
    flows.forEach(flow => {
      flow.steps.forEach(step => {
        const skipAnalytics = this.analytics.get(`${flow.id}_${step.id}_skip`) || {};
        const stepAnalytics = this.analytics.get(`${flow.id}_${step.id}`) || {};
        const skipRate = stepAnalytics.views ? (skipAnalytics.count / stepAnalytics.views) * 100 : 0;

        if (skipRate > 0) {
          skipData.push({
            stepId: step.id,
            skipRate,
            reasons: skipAnalytics.reasons || []
          });
        }
      });
    });

    const mostSkippedSteps = skipData
      .sort((a, b) => b.skipRate - a.skipRate)
      .slice(0, 5);

    // Calculate user satisfaction
    const allFeedback = flows.reduce((acc: any[], flow) => {
      const analytics = this.analytics.get(`${flow.id}_flow`) || {};
      return acc.concat(analytics.feedback || []);
    }, []);

    const averageRating = allFeedback.length > 0
      ? allFeedback.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / allFeedback.length
      : 0;

    const commonFeedback = allFeedback
      .filter((f: any) => f.comments)
      .map((f: any) => f.comments)
      .slice(0, 10);

    return {
      overallCompletionRate,
      averageTimeToComplete,
      mostSkippedSteps,
      userSatisfaction: {
        averageRating,
        commonFeedback
      }
    };
  }
}

// Onboarding step component
export function OnboardingStepComponent({
  step,
  onNext,
  onPrevious,
  onSkip,
  isFirst,
  isLast,
  sessionId
}: {
  step: OnboardingStep;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
  sessionId: string;
}) {
  const [timeSpent, setTimeSpent] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Date.now() - startTime.current);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    // Track step completion
    const onboardingService = new OnboardingService();
    onboardingService.completeOnboardingStep(sessionId, step.id, {
      timeSpent,
      completed: true
    });
    onNext();
  };

  const handleSkip = () => {
    // Track step skip
    const onboardingService = new OnboardingService();
    onboardingService.skipOnboardingStep(sessionId, step.id, 'user_skipped');
    onSkip();
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.content}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>

        {typeof step.content === 'string' ? (
          <Text style={styles.contentText}>{step.content}</Text>
        ) : (
          <step.content />
        )}

        <Text style={styles.timeEstimate}>
          Estimated time: {Math.ceil(step.estimatedTime / 60)} minutes
        </Text>
      </View>

      <View style={styles.actions}>
        {!isFirst && (
          <TouchableOpacity style={styles.previousButton} onPress={onPrevious}>
            <Text style={styles.previousButtonText}>Previous</Text>
          </TouchableOpacity>
        )}

        <View style={styles.primaryActions}>
          {step.skipable && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Onboarding flow component
export function OnboardingFlowComponent({ flowId }: { flowId: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const flow = new OnboardingService().flows.get(flowId);

  useEffect(() => {
    if (flow && !sessionId) {
      const onboardingService = new OnboardingService();
      const newSessionId = onboardingService.startOnboardingSession('current_user', flowId);
      setSessionId(newSessionId);
    }
  }, [flow, sessionId]);

  if (!flow) {
    return <Text>Onboarding flow not found</Text>;
  }

  const step = flow.steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === flow.steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (sessionId) {
        const onboardingService = new OnboardingService();
        onboardingService.completeOnboarding(sessionId);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (sessionId) {
      const onboardingService = new OnboardingService();
      onboardingService.skipOnboardingStep(sessionId, step.id);
    }
    handleNext();
  };

  return (
    <OnboardingStepComponent
      step={step}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSkip={handleSkip}
      isFirst={isFirst}
      isLast={isLast}
      sessionId={sessionId || ''}
    />
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    marginBottom: 20
  },
  contentText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20
  },
  timeEstimate: {
    fontSize: 12,
    color: '#999',
    marginTop: 20
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  previousButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  previousButtonText: {
    color: '#666',
    fontSize: 16
  },
  primaryActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  skipButton: {
    padding: 12,
    marginRight: 16
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16
  },
  nextButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 100
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});

// Export onboarding service instance
export const onboardingService = new OnboardingService();
