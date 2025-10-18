
// Advanced GrowthBook Experiments for Feature Optimization
import { logger } from '../utils/logger';

export interface GrowthBookExperiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  type: 'feature_flag' | 'ab_test' | 'multivariate';
  target: ExperimentTarget;
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  schedule: ExperimentSchedule;
  results?: ExperimentResults;
}

export interface ExperimentTarget {
  segments: string[];
  filters: ExperimentFilter[];
  trafficAllocation: number;
}

export interface ExperimentFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
  description?: string;
}

export interface ExperimentMetric {
  name: string;
  type: 'conversion' | 'revenue' | 'engagement' | 'retention';
  event: string;
  property?: string;
  goal?: 'increase' | 'decrease';
}

export interface ExperimentSchedule {
  startDate: Date;
  endDate?: Date;
  duration?: number;
}

export interface ExperimentResults {
  winner?: string;
  confidence: number;
  improvement: number;
  significance: 'significant' | 'not_significant' | 'inconclusive';
  sampleSize: number;
  variantResults: Record<string, VariantResult>;
}

export interface VariantResult {
  users: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  averageRevenue: number;
  standardDeviation: number;
}

export class GrowthBookExperimentService {
  private experiments: Map<string, GrowthBookExperiment> = new Map();
  private userAssignments: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultExperiments();
  }

  private initializeDefaultExperiments() {
    const defaultExperiments: GrowthBookExperiment[] = [
      {
        id: 'signup_flow_optimization',
        name: 'Signup Flow Optimization',
        description: 'Test different signup flow variations',
        status: 'running',
        type: 'ab_test',
        target: {
          segments: ['new_users'],
          filters: [],
          trafficAllocation: 100
        },
        variants: [
          {
            id: 'control',
            name: 'Control (Single Step)',
            weight: 50,
            config: {
              signupSteps: 1,
              showProgress: false,
              requireVerification: true
            }
          },
          {
            id: 'variant_a',
            name: 'Multi-Step with Progress',
            weight: 50,
            config: {
              signupSteps: 3,
              showProgress: true,
              requireVerification: true
            }
          }
        ],
        metrics: [
          {
            name: 'signup_completion',
            type: 'conversion',
            event: 'user_signup_completed',
            goal: 'increase'
          },
          {
            name: 'signup_time',
            type: 'engagement',
            event: 'signup_duration',
            goal: 'decrease'
          }
        ],
        schedule: {
          startDate: new Date(),
          duration: 30
        }
      }
    ];

    defaultExperiments.forEach(experiment => {
      this.experiments.set(experiment.id, experiment);
    });
  }

  // Assign user to experiment variant
  assignUserToExperiment(experimentId: string, userId: string, context: Record<string, any>): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    if (this.userAssignments.has(`${experimentId}_${userId}`)) {
      return this.userAssignments.get(`${experimentId}_${userId}`) || null;
    }

    if (!this.userMatchesTarget(experiment.target, userId, context)) {
      return null;
    }

    const variantId = this.selectVariant(experiment.variants);
    this.userAssignments.set(`${experimentId}_${userId}`, variantId);

    logger.info('User assigned to experiment', { experimentId, userId, variantId });
    return variantId;
  }

  private userMatchesTarget(target: ExperimentTarget, userId: string, context: Record<string, any>): boolean {
    const userSegments = context.segments || [];
    const matchesSegment = target.segments.length === 0 ||
      target.segments.some(segment => userSegments.includes(segment));

    if (!matchesSegment) return false;

    return target.filters.every(filter => {
      const fieldValue = this.getFieldValue(userId, filter.field, context);
      return this.evaluateFilter(fieldValue, filter.operator, filter.value);
    });
  }

  private getFieldValue(userId: string, field: string, context: Record<string, any>): any {
    switch (field) {
      case 'plan_type':
        return context.planType || 'free';
      case 'signup_date':
        return context.signupDate || new Date();
      default:
        return context[field];
    }
  }

  private evaluateFilter(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return value === expected;
      case 'contains':
        return String(value).includes(String(expected));
      case 'greater_than':
        return Number(value) > Number(expected);
      case 'less_than':
        return Number(value) < Number(expected);
      case 'in':
        return Array.isArray(expected) && expected.includes(value);
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(value);
      default:
        return false;
    }
  }

  private selectVariant(variants: ExperimentVariant[]): string {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant.id;
      }
    }

    return variants[0].id;
  }

  // Track experiment events
  trackExperimentEvent(experimentId: string, event: string, userId: string, value?: number) {
    logger.info('Experiment event tracked', { experimentId, event, userId, value });
  }

  // Get experiment results
  getExperimentResults(experimentId: string): ExperimentResults | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    // Simulate results
    return {
      winner: 'variant_a',
      confidence: 95,
      improvement: 15.2,
      significance: 'significant',
      sampleSize: 10000,
      variantResults: {
        control: {
          users: 5000,
          conversions: 2450,
          conversionRate: 49,
          revenue: 122500,
          averageRevenue: 50,
          standardDeviation: 25
        },
        variant_a: {
          users: 5000,
          conversions: 2875,
          conversionRate: 57.5,
          revenue: 143750,
          averageRevenue: 50,
          standardDeviation: 22
        }
      }
    };
  }

  // Get all experiments
  getAllExperiments(): GrowthBookExperiment[] {
    return Array.from(this.experiments.values());
  }
}

export const growthBookExperimentService = new GrowthBookExperimentService();
