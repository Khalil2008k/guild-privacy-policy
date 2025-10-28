
// Advanced WalkMe Interactive Guides for User Onboarding
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface WalkMeGuide {
  id: string;
  name: string;
  description: string;
  targetAudience: string[];
  steps: WalkMeStep[];
  trigger: GuideTrigger;
  analytics: GuideAnalytics;
}

export interface WalkMeStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector or component ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  type: 'tooltip' | 'modal' | 'highlight' | 'action';
  actions?: WalkMeAction[];
  conditions?: Record<string, any>;
}

export interface WalkMeAction {
  type: 'click' | 'input' | 'wait' | 'scroll' | 'navigate';
  selector?: string;
  value?: string;
  delay?: number;
}

export interface GuideTrigger {
  event: string;
  conditions?: Record<string, any>;
  delay?: number;
}

export interface GuideAnalytics {
  views: number;
  completions: number;
  dropoffs: Record<string, number>;
  averageTime: number;
  satisfaction: number;
}

export interface WalkMeSession {
  id: string;
  userId: string;
  guideId: string;
  currentStep: number;
  startTime: Date;
  completedSteps: string[];
  status: 'active' | 'completed' | 'abandoned';
}

export class WalkMeGuideService {
  private guides: Map<string, WalkMeGuide> = new Map();
  private sessions: Map<string, WalkMeSession> = new Map();
  private analytics: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultGuides();
  }

  private initializeDefaultGuides() {
    const defaultGuides: WalkMeGuide[] = [
      {
        id: 'profile_setup_guide',
        name: 'Profile Setup Guide',
        description: 'Help users complete their profile setup',
        targetAudience: ['new_users', 'incomplete_profiles'],
        steps: [
          {
            id: 'welcome_step',
            title: 'Welcome!',
            content: "Let's set up your profile to help you find the best opportunities.",
            target: '#profile-welcome',
            position: 'center',
            type: 'modal'
          },
          {
            id: 'name_step',
            title: 'Your Name',
            content: 'Add your full name to build trust with clients.',
            target: '#profile-name-input',
            position: 'right',
            type: 'tooltip',
            actions: [
              {
                type: 'input',
                selector: '#profile-name-input',
                value: 'Enter your name'
              }
            ]
          },
          {
            id: 'skills_step',
            title: 'Your Skills',
            content: 'Add your skills to appear in relevant job searches.',
            target: '#profile-skills-input',
            position: 'right',
            type: 'tooltip',
            actions: [
              {
                type: 'input',
                selector: '#profile-skills-input',
                value: 'JavaScript, React, Node.js'
              }
            ]
          },
          {
            id: 'photo_step',
            title: 'Profile Photo',
            content: 'Add a professional photo to increase your profile views.',
            target: '#profile-photo-upload',
            position: 'top',
            type: 'tooltip',
            actions: [
              {
                type: 'click',
                selector: '#profile-photo-upload'
              }
            ]
          },
          {
            id: 'completion_step',
            title: 'All Set!',
            content: "Your profile is now complete! You're ready to start finding work.",
            target: '#profile-complete',
            position: 'center',
            type: 'modal'
          }
        ],
        trigger: {
          event: 'profile_incomplete',
          conditions: {
            profile_completion: '< 80'
          }
        },
        analytics: {
          views: 0,
          completions: 0,
          dropoffs: {},
          averageTime: 0,
          satisfaction: 0
        }
      },
      {
        id: 'job_posting_guide',
        name: 'Job Posting Guide',
        description: 'Guide users through posting their first job',
        targetAudience: ['new_employers', 'first_time_posters'],
        steps: [
          {
            id: 'job_post_welcome',
            title: 'Post Your First Job',
            content: "Let's walk you through posting your first job on Guild.",
            target: '#post-job-button',
            position: 'bottom',
            type: 'tooltip',
            actions: [
              {
                type: 'click',
                selector: '#post-job-button'
              }
            ]
          },
          {
            id: 'job_title_step',
            title: 'Job Title',
            content: 'Choose a clear, descriptive title for your job.',
            target: '#job-title-input',
            position: 'right',
            type: 'tooltip'
          },
          {
            id: 'job_description_step',
            title: 'Job Description',
            content: 'Provide detailed requirements and expectations.',
            target: '#job-description-input',
            position: 'right',
            type: 'tooltip'
          },
          {
            id: 'budget_step',
            title: 'Budget',
            content: 'Set a fair budget for the work required.',
            target: '#job-budget-input',
            position: 'right',
            type: 'tooltip'
          }
        ],
        trigger: {
          event: 'first_job_post_attempt'
        },
        analytics: {
          views: 0,
          completions: 0,
          dropoffs: {},
          averageTime: 0,
          satisfaction: 0
        }
      }
    ];

    defaultGuides.forEach(guide => {
      this.guides.set(guide.id, guide);
    });
  }

  // Start guide session
  startGuideSession(userId: string, guideId: string): string {
    const guide = this.guides.get(guideId);
    if (!guide) {
      throw new Error('Guide not found');
    }

    const sessionId = `guide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: WalkMeSession = {
      id: sessionId,
      userId,
      guideId,
      currentStep: 0,
      startTime: new Date(),
      completedSteps: [],
      status: 'active'
    };

    this.sessions.set(sessionId, session);

    // Update guide analytics
    guide.analytics.views++;

    console.log('Guide session started', { sessionId, userId, guideId });
    return sessionId;
  }

  // Complete guide step
  completeGuideStep(sessionId: string, stepId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const guide = this.guides.get(session.flowId);
    const step = guide?.steps.find(s => s.id === stepId);

    if (step) {
      session.completedSteps.push(stepId);
      session.currentStep++;

      // Check if guide is completed
      if (session.completedSteps.length === guide!.steps.length) {
        session.status = 'completed';
      }

      // Update analytics
      this.updateGuideAnalytics(guide!.id, stepId);

      console.log('Guide step completed', { sessionId, stepId });
    }
  }

  private updateGuideAnalytics(guideId: string, stepId: string) {
    const guide = this.guides.get(guideId);
    if (guide) {
      guide.analytics.completions++;
    }
  }

  // Track guide abandonment
  abandonGuide(sessionId: string, stepId: string, reason?: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'abandoned';

    // Update dropoff analytics
    const guide = this.guides.get(session.guideId);
    if (guide) {
      guide.analytics.dropoffs[stepId] = (guide.analytics.dropoffs[stepId] || 0) + 1;
    }

    console.log('Guide abandoned', { sessionId, stepId, reason });
  }

  // Get guide analytics
  getGuideAnalytics(guideId?: string): any {
    if (guideId) {
      const guide = this.guides.get(guideId);
      return guide ? guide.analytics : null;
    }

    // Return all guides analytics
    const allAnalytics: Record<string, any> = {};
    this.guides.forEach((guide, id) => {
      allAnalytics[id] = guide.analytics;
    });

    return allAnalytics;
  }

  // Get guides for user
  getGuidesForUser(userId: string, context: Record<string, any>): WalkMeGuide[] {
    return Array.from(this.guides.values()).filter(guide => {
      // Check if user matches target audience
      const matchesAudience = guide.targetAudience.some(audience =>
        context.userType === audience || context[audience] === true
      );

      // Check trigger conditions
      const triggerMatches = this.evaluateTriggerConditions(guide.trigger, context);

      return matchesAudience && triggerMatches;
    });
  }

  private evaluateTriggerConditions(trigger: GuideTrigger, context: Record<string, any>): boolean {
    if (trigger.conditions) {
      return Object.entries(trigger.conditions).every(([key, value]) => {
        return context[key] === value;
      });
    }

    return true;
  }

  // Create custom guide
  createCustomGuide(guide: Omit<WalkMeGuide, 'id' | 'analytics'>): string {
    const guideId = `guide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newGuide: WalkMeGuide = {
      ...guide,
      id: guideId,
      analytics: {
        views: 0,
        completions: 0,
        dropoffs: {},
        averageTime: 0,
        satisfaction: 0
      }
    };

    this.guides.set(guideId, newGuide);

    console.log('Custom guide created', { guideId, name: guide.name });
    return guideId;
  }
}

// WalkMe guide component
export function WalkMeGuide({ guideId, onComplete }: { guideId: string; onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const guide = new WalkMeGuideService().guides.get(guideId);

  if (!guide) {
    return null;
  }

  const step = guide.steps[currentStep];
  const isLast = currentStep === guide.steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setIsVisible(false);
      onComplete?.();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.tooltip, getPositionStyle(step.position)]}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.content}>{step.content}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>
              {isLast ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progress}>
          <Text style={styles.progressText}>
            {currentStep + 1} of {guide.steps.length}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  tooltip: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: '#666',
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  nextText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progress: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#999',
  },
});

function getPositionStyle(position: string) {
  switch (position) {
    case 'top':
      return { marginBottom: 'auto', marginTop: 100 };
    case 'bottom':
      return { marginTop: 'auto', marginBottom: 100 };
    case 'left':
      return { marginRight: 'auto', marginLeft: 50 };
    case 'right':
      return { marginLeft: 'auto', marginRight: 50 };
    default:
      return {};
  }
}

// Export guide service instance
export const walkMeGuideService = new WalkMeGuideService();
