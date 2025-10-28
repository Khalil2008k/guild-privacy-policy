
// Advanced Chameleon Interactive Guides for User Onboarding
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface ChameleonTour {
  id: string;
  name: string;
  description: string;
  targetAudience: string[];
  steps: TourStep[];
  trigger: TourTrigger;
  analytics: TourAnalytics;
  settings: TourSettings;
}

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  type: 'tooltip' | 'modal' | 'spotlight' | 'coachmark';
  actions?: TourAction[];
  conditions?: Record<string, any>;
  media?: {
    image?: string;
    video?: string;
    gif?: string;
  };
}

export interface TourAction {
  type: 'click' | 'input' | 'scroll' | 'wait' | 'navigate';
  selector?: string;
  value?: string;
  delay?: number;
}

export interface TourTrigger {
  event: string;
  conditions?: Record<string, any>;
  delay?: number;
  frequency?: 'once' | 'always' | 'session';
}

export interface TourAnalytics {
  views: number;
  completions: number;
  dropoffs: Record<string, number>;
  averageTime: number;
  satisfaction: number;
  stepAnalytics: Record<string, StepAnalytics>;
}

export interface StepAnalytics {
  views: number;
  completions: number;
  timeSpent: number;
  helpfulness: number;
}

export interface TourSettings {
  allowSkip: boolean;
  showProgress: boolean;
  autoAdvance: boolean;
  dismissible: boolean;
  rememberProgress: boolean;
}

export interface TourSession {
  id: string;
  userId: string;
  tourId: string;
  currentStep: number;
  completedSteps: string[];
  startTime: Date;
  lastActivity: Date;
  status: 'active' | 'completed' | 'abandoned' | 'skipped';
}

export class ChameleonTourService {
  private tours: Map<string, ChameleonTour> = new Map();
  private sessions: Map<string, TourSession> = new Map();
  private analytics: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultTours();
  }

  private initializeDefaultTours() {
    const defaultTours: ChameleonTour[] = [
      {
        id: 'profile_completion_tour',
        name: 'Complete Your Profile',
        description: 'Guide users through completing their profile',
        targetAudience: ['new_users', 'incomplete_profiles'],
        steps: [
          {
            id: 'profile_welcome',
            title: 'Welcome to Your Profile',
            content: "Let's set up your profile to help you find the best opportunities.",
            target: '#profile-section',
            position: 'center',
            type: 'modal'
          },
          {
            id: 'profile_photo',
            title: 'Add Your Photo',
            content: 'A professional photo helps build trust with clients.',
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
            id: 'skills_section',
            title: 'Your Skills',
            content: 'Add your skills to appear in relevant job searches.',
            target: '#skills-input',
            position: 'right',
            type: 'tooltip',
            actions: [
              {
                type: 'input',
                selector: '#skills-input',
                value: 'JavaScript, React, Node.js'
              }
            ]
          },
          {
            id: 'portfolio_link',
            title: 'Portfolio Link',
            content: 'Share your portfolio to showcase your work.',
            target: '#portfolio-input',
            position: 'right',
            type: 'tooltip',
            actions: [
              {
                type: 'input',
                selector: '#portfolio-input',
                value: 'https://your-portfolio.com'
              }
            ]
          },
          {
            id: 'profile_complete',
            title: 'Profile Complete!',
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
          },
          frequency: 'once'
        },
        analytics: {
          views: 0,
          completions: 0,
          dropoffs: {},
          averageTime: 0,
          satisfaction: 0,
          stepAnalytics: {}
        },
        settings: {
          allowSkip: true,
          showProgress: true,
          autoAdvance: false,
          dismissible: true,
          rememberProgress: true
        }
      }
    ];

    defaultTours.forEach(tour => {
      this.tours.set(tour.id, tour);
    });
  }

  // Start tour session
  startTourSession(userId: string, tourId: string): string {
    const tour = this.tours.get(tourId);
    if (!tour) {
      throw new Error('Tour not found');
    }

    const sessionId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: TourSession = {
      id: sessionId,
      userId,
      tourId,
      currentStep: 0,
      completedSteps: [],
      startTime: new Date(),
      lastActivity: new Date(),
      status: 'active'
    };

    this.sessions.set(sessionId, session);
    tour.analytics.views++;

    console.log('Tour session started', { sessionId, userId, tourId });
    return sessionId;
  }

  // Complete tour step
  completeTourStep(sessionId: string, stepId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const tour = this.tours.get(session.tourId);
    const step = tour?.steps.find(s => s.id === stepId);

    if (step) {
      session.completedSteps.push(stepId);
      session.currentStep++;
      session.lastActivity = new Date();

      if (session.completedSteps.length === tour!.steps.length) {
        session.status = 'completed';
      }

      this.updateTourAnalytics(tour!.id, stepId);
      console.log('Tour step completed', { sessionId, stepId });
    }
  }

  private updateTourAnalytics(tourId: string, stepId: string) {
    const tour = this.tours.get(tourId);
    if (tour) {
      tour.analytics.completions++;
    }
  }

  // Get tour analytics
  getTourAnalytics(tourId?: string): any {
    if (tourId) {
      const tour = this.tours.get(tourId);
      return tour ? tour.analytics : null;
    }

    const allAnalytics: Record<string, any> = {};
    this.tours.forEach((tour, id) => {
      allAnalytics[id] = tour.analytics;
    });

    return allAnalytics;
  }

  // Get tours for user
  getToursForUser(userId: string, context: Record<string, any>): ChameleonTour[] {
    return Array.from(this.tours.values()).filter(tour => {
      const matchesAudience = tour.targetAudience.some(audience =>
        context.userType === audience || context[audience] === true
      );

      const triggerMatches = this.evaluateTriggerConditions(tour.trigger, context);

      return matchesAudience && triggerMatches;
    });
  }

  private evaluateTriggerConditions(trigger: TourTrigger, context: Record<string, any>): boolean {
    if (trigger.conditions) {
      return Object.entries(trigger.conditions).every(([key, value]) => {
        return context[key] === value;
      });
    }

    return true;
  }

  // Create custom tour
  createCustomTour(tour: Omit<ChameleonTour, 'id' | 'analytics'>): string {
    const tourId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newTour: ChameleonTour = {
      ...tour,
      id: tourId,
      analytics: {
        views: 0,
        completions: 0,
        dropoffs: {},
        averageTime: 0,
        satisfaction: 0,
        stepAnalytics: {}
      }
    };

    this.tours.set(tourId, newTour);
    console.log('Custom tour created', { tourId, name: tour.name });
    return tourId;
  }
}

// Chameleon tour component
export function ChameleonTour({ tourId, onComplete }: { tourId: string; onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const tour = new ChameleonTourService().tours.get(tourId);

  if (!tour) {
    return null;
  }

  const step = tour.steps[currentStep];
  const isLast = currentStep === tour.steps.length - 1;

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
      <View style={[styles.tourStep, getPositionStyle(step.position)]}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.content}>{step.content}</Text>

        {step.media?.image && (
          <Image source={{ uri: step.media.image }} style={styles.media} />
        )}

        <View style={styles.actions}>
          {tour.settings.allowSkip && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip Tour</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>
              {isLast ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>

        {tour.settings.showProgress && (
          <View style={styles.progress}>
            <Text style={styles.progressText}>
              {currentStep + 1} of {tour.steps.length}
            </Text>
          </View>
        )}
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
  tourStep: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxWidth: 320,
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
  media: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
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

// Export tour service instance
export const chameleonTourService = new ChameleonTourService();
