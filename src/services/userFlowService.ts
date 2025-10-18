
// Advanced User Flows with Analytics and Drop-off Point Identification
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export interface UserFlow {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  completionRate: number;
  averageTime: number;
  dropOffPoints: DropOffPoint[];
  targetAudience?: string[];
  tags?: string[];
}

export interface FlowStep {
  id: string;
  name: string;
  description: string;
  type: 'screen' | 'action' | 'decision' | 'form' | 'confirmation';
  required: boolean;
  estimatedTime: number; // seconds
  nextSteps: string[];
  alternativeSteps?: string[]; // For decision points
  analytics: StepAnalytics;
}

export interface DropOffPoint {
  stepId: string;
  stepName: string;
  dropOffRate: number; // percentage
  commonReasons: string[];
  suggestions: string[];
}

export interface StepAnalytics {
  completionRate: number;
  averageTime: number;
  errorRate: number;
  abandonmentRate: number;
  userFeedback?: {
    satisfaction: number;
    difficulty: number;
    comments?: string[];
  };
}

export interface FlowSession {
  id: string;
  userId: string;
  flowId: string;
  startTime: Date;
  currentStep: string;
  completedSteps: string[];
  timeSpent: number;
  status: 'active' | 'completed' | 'abandoned';
  metadata?: Record<string, any>;
}

export class UserFlowService {
  private flows: Map<string, UserFlow> = new Map();
  private sessions: Map<string, FlowSession> = new Map();
  private analytics: Map<string, any> = new Map();

  constructor() {
    this.initializeFlows();
  }

  private initializeFlows() {
    const flows: UserFlow[] = [
      {
        id: 'user_registration',
        name: 'User Registration Flow',
        description: 'Complete user onboarding and account creation process',
        steps: [
          {
            id: 'welcome_screen',
            name: 'Welcome Screen',
            description: 'Introduction and value proposition',
            type: 'screen',
            required: true,
            estimatedTime: 30,
            nextSteps: ['email_input'],
            analytics: {
              completionRate: 98.5,
              averageTime: 25,
              errorRate: 0.1,
              abandonmentRate: 1.5
            }
          },
          {
            id: 'email_input',
            name: 'Email Input',
            description: 'Email address collection with validation',
            type: 'form',
            required: true,
            estimatedTime: 45,
            nextSteps: ['password_input'],
            analytics: {
              completionRate: 94.2,
              averageTime: 42,
              errorRate: 3.8,
              abandonmentRate: 5.8
            }
          },
          {
            id: 'password_input',
            name: 'Password Creation',
            description: 'Secure password setup with strength requirements',
            type: 'form',
            required: true,
            estimatedTime: 60,
            nextSteps: ['verification'],
            analytics: {
              completionRate: 89.7,
              averageTime: 58,
              errorRate: 7.2,
              abandonmentRate: 10.3
            }
          },
          {
            id: 'verification',
            name: 'Email Verification',
            description: 'Email address verification process',
            type: 'action',
            required: true,
            estimatedTime: 120,
            nextSteps: ['profile_setup'],
            analytics: {
              completionRate: 82.1,
              averageTime: 115,
              errorRate: 12.4,
              abandonmentRate: 17.9
            }
          },
          {
            id: 'profile_setup',
            name: 'Profile Setup',
            description: 'User profile information collection',
            type: 'form',
            required: false,
            estimatedTime: 180,
            nextSteps: ['completion'],
            analytics: {
              completionRate: 76.8,
              averageTime: 175,
              errorRate: 18.9,
              abandonmentRate: 23.2
            }
          },
          {
            id: 'completion',
            name: 'Registration Complete',
            description: 'Success confirmation and next steps',
            type: 'confirmation',
            required: true,
            estimatedTime: 15,
            nextSteps: [],
            analytics: {
              completionRate: 71.4,
              averageTime: 12,
              errorRate: 0.5,
              abandonmentRate: 28.6
            }
          }
        ],
        completionRate: 71.4,
        averageTime: 427,
        dropOffPoints: [
          {
            stepId: 'verification',
            stepName: 'Email Verification',
            dropOffRate: 17.9,
            commonReasons: [
              'Email not received',
              'Verification link expired',
              'Spam folder issues',
              'Technical difficulties'
            ],
            suggestions: [
              'Improve email deliverability',
              'Add verification reminders',
              'Provide alternative verification methods',
              'Clearer instructions'
            ]
          },
          {
            stepId: 'profile_setup',
            stepName: 'Profile Setup',
            dropOffRate: 23.2,
            commonReasons: [
              'Too many fields',
              'Not immediately necessary',
              'Privacy concerns',
              'Time consuming'
            ],
            suggestions: [
              'Make profile setup optional',
              'Progressive profiling',
              'Clear value proposition',
              'Faster completion flow'
            ]
          }
        ],
        targetAudience: ['new_users', 'trial_users'],
        tags: ['onboarding', 'registration', 'conversion']
      }
    ];

    flows.forEach(flow => {
      this.flows.set(flow.id, flow);
    });
  }

  // Start flow session
  startFlowSession(userId: string, flowId: string): string {
    const sessionId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: FlowSession = {
      id: sessionId,
      userId,
      flowId,
      startTime: new Date(),
      currentStep: this.flows.get(flowId)?.steps[0]?.id || '',
      completedSteps: [],
      timeSpent: 0,
      status: 'active'
    };

    this.sessions.set(sessionId, session);

    console.log('Flow session started', { sessionId, userId, flowId });
    return sessionId;
  }

  // Track flow step
  trackFlowStep(sessionId: string, stepId: string, metadata?: Record<string, any>) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const flow = this.flows.get(session.flowId);
    const step = flow?.steps.find(s => s.id === stepId);

    if (step) {
      // Update session
      session.currentStep = stepId;
      session.completedSteps.push(stepId);
      session.timeSpent = Date.now() - session.startTime.getTime();

      // Update analytics
      this.updateStepAnalytics(flow!.id, stepId, metadata);

      console.log('Flow step tracked', { sessionId, stepId, timeSpent: session.timeSpent });
    }
  }

  // Complete flow
  completeFlow(sessionId: string, metadata?: Record<string, any>) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'completed';
    session.timeSpent = Date.now() - session.startTime.getTime();

    // Update flow analytics
    this.updateFlowAnalytics(session.flowId, session.timeSpent, metadata);

    console.log('Flow completed', { sessionId, timeSpent: session.timeSpent });
  }

  // Abandon flow
  abandonFlow(sessionId: string, reason?: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'abandoned';
    session.timeSpent = Date.now() - session.startTime.getTime();

    // Identify drop-off point
    this.identifyDropOffPoint(session.flowId, session.currentStep, reason);

    console.log('Flow abandoned', { sessionId, currentStep: session.currentStep, reason });
  }

  private updateStepAnalytics(flowId: string, stepId: string, metadata?: Record<string, any>) {
    const key = `${flowId}_${stepId}`;
    const existing = this.analytics.get(key) || {
      views: 0,
      completions: 0,
      totalTime: 0,
      errors: 0,
      feedback: []
    };

    existing.views++;
    if (metadata?.completed) {
      existing.completions++;
    }
    if (metadata?.timeSpent) {
      existing.totalTime += metadata.timeSpent;
    }
    if (metadata?.error) {
      existing.errors++;
    }
    if (metadata?.feedback) {
      existing.feedback.push(metadata.feedback);
    }

    this.analytics.set(key, existing);
  }

  private updateFlowAnalytics(flowId: string, timeSpent: number, metadata?: Record<string, any>) {
    const key = `${flowId}_flow`;
    const existing = this.analytics.get(key) || {
      starts: 0,
      completions: 0,
      totalTime: 0,
      abandonmentReasons: []
    };

    existing.starts++;
    if (metadata?.completed) {
      existing.completions++;
    }
    existing.totalTime += timeSpent;
    if (metadata?.abandonmentReason) {
      existing.abandonmentReasons.push(metadata.abandonmentReason);
    }

    this.analytics.set(key, existing);
  }

  private identifyDropOffPoint(flowId: string, currentStep: string, reason?: string) {
    const flow = this.flows.get(flowId);
    if (!flow) return;

    const step = flow.steps.find(s => s.id === currentStep);
    if (!step) return;

    // Update drop-off point analytics
    const dropOffKey = `${flowId}_dropoff_${currentStep}`;
    const existing = this.analytics.get(dropOffKey) || {
      count: 0,
      reasons: []
    };

    existing.count++;
    if (reason) {
      existing.reasons.push(reason);
    }

    this.analytics.set(dropOffKey, existing);
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
        errorRate: stepData.views ? (stepData.errors / stepData.views) * 100 : 0
      };
    });

    return {
      flow,
      analytics: {
        totalSessions: flowAnalytics.starts || 0,
        completedSessions: flowAnalytics.completions || 0,
        completionRate: flowAnalytics.starts ? (flowAnalytics.completions / flowAnalytics.starts) * 100 : 0,
        averageTime: flowAnalytics.starts ? flowAnalytics.totalTime / flowAnalytics.starts : 0,
        abandonmentRate: flowAnalytics.starts ? ((flowAnalytics.starts - flowAnalytics.completions) / flowAnalytics.starts) * 100 : 0,
        stepAnalytics
      }
    };
  }

  // Get drop-off analysis
  getDropOffAnalysis(flowId: string): {
    flow: UserFlow;
    dropOffPoints: Array<{
      stepId: string;
      stepName: string;
      dropOffRate: number;
      reasons: string[];
      impact: 'high' | 'medium' | 'low';
      suggestions: string[];
    }>;
  } {
    const flow = this.flows.get(flowId);
    if (!flow) throw new Error('Flow not found');

    const dropOffPoints = flow.dropOffPoints.map(dropOff => {
      const analytics = this.analytics.get(`${flowId}_dropoff_${dropOff.stepId}`) || {};

      return {
        stepId: dropOff.stepId,
        stepName: dropOff.stepName,
        dropOffRate: (analytics.count || 0) / (flowAnalytics.starts || 1) * 100,
        reasons: analytics.reasons || dropOff.commonReasons,
        impact: dropOff.dropOffRate > 15 ? 'high' : dropOff.dropOffRate > 8 ? 'medium' : 'low',
        suggestions: dropOff.suggestions
      };
    });

    return { flow, dropOffPoints };
  }
}

// User flow component
export function UserFlowComponent({ flowId, stepId, onNext, onPrevious, children }: {
  flowId: string;
  stepId: string;
  onNext: () => void;
  onPrevious: () => void;
  children: React.ReactNode;
}) {
  const navigation = useNavigation();
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Track step view
    const userFlowService = new UserFlowService();
    const sessionId = userFlowService.startFlowSession('current_user', flowId);
    userFlowService.trackFlowStep(sessionId, stepId);

    return () => {
      // Track time spent
      const timeSpent = Date.now() - startTime.current;
      console.log('Step time tracked', { stepId, timeSpent });
    };
  }, [flowId, stepId]);

  return (
    <View style={styles.container}>
      {children}
      <View style={styles.navigation}>
        <TouchableOpacity style={styles.button} onPress={onPrevious}>
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 100
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold'
  }
});

// Export user flow service instance
export const userFlowService = new UserFlowService();
