
// Advanced Intercom Chatbots for User Engagement
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface ChatbotConfig {
  appId: string;
  apiKey: string;
  workspaceId: string;
  enabled: boolean;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  features: {
    typingIndicators: boolean;
    readReceipts: boolean;
    fileSharing: boolean;
    screenSharing: boolean;
  };
}

export interface ChatbotMessage {
  id: string;
  type: 'text' | 'image' | 'file' | 'quick_reply' | 'carousel';
  content: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatbotFlow {
  id: string;
  name: string;
  trigger: {
    event: string;
    conditions?: Record<string, any>;
  };
  steps: ChatbotStep[];
  fallback?: string;
}

export interface ChatbotStep {
  id: string;
  type: 'message' | 'question' | 'action' | 'condition';
  content: string;
  nextSteps?: string[];
  conditions?: Record<string, any>;
  actions?: ChatbotAction[];
}

export interface ChatbotAction {
  type: 'send_message' | 'transfer_to_agent' | 'collect_data' | 'trigger_event';
  params: Record<string, any>;
}

export class IntercomChatbotService {
  private config: ChatbotConfig;
  private messages: ChatbotMessage[] = [];
  private flows: Map<string, ChatbotFlow> = new Map();
  private activeConversations: Map<string, any> = new Map();

  constructor(config: ChatbotConfig) {
    this.config = config;
    this.initializeChatbot();
  }

  private initializeChatbot() {
    // Initialize Intercom widget
    if (typeof window !== 'undefined') {
      (window as any).Intercom = (window as any).Intercom || {};
      (window as any).Intercom('boot', {
        app_id: this.config.appId,
        api_base: 'https://widget.intercom.io',
        api_base_upload: 'https://uploads.intercomcdn.com',
      });
    }

    // Set up default chatbot flows
    this.setupDefaultFlows();
  }

  private setupDefaultFlows() {
    const defaultFlows: ChatbotFlow[] = [
      {
        id: 'welcome_flow',
        name: 'Welcome Flow',
        trigger: {
          event: 'user_first_visit',
        },
        steps: [
          {
            id: 'welcome_message',
            type: 'message',
            content: 'Welcome to Guild! 👋 I'm here to help you get started. What can I assist you with today?',
            nextSteps: ['welcome_options']
          },
          {
            id: 'welcome_options',
            type: 'question',
            content: 'Choose what you'd like to do:',
            actions: [
              {
                type: 'send_message',
                params: { text: 'Find a freelancer' }
              },
              {
                type: 'send_message',
                params: { text: 'Post a job' }
              },
              {
                type: 'send_message',
                params: { text: 'Learn about Guild' }
              }
            ]
          }
        ]
      },
      {
        id: 'support_flow',
        name: 'Support Flow',
        trigger: {
          event: 'user_support_request',
        },
        steps: [
          {
            id: 'support_options',
            type: 'question',
            content: 'How can I help you today?',
            actions: [
              {
                type: 'transfer_to_agent',
                params: { department: 'technical' }
              },
              {
                type: 'transfer_to_agent',
                params: { department: 'billing' }
              },
              {
                type: 'send_message',
                params: { text: 'Check our help center: https://help.guild.com' }
              }
            ]
          }
        ]
      },
      {
        id: 'onboarding_flow',
        name: 'Onboarding Flow',
        trigger: {
          event: 'user_signup',
        },
        steps: [
          {
            id: 'onboarding_welcome',
            type: 'message',
            content: 'Great choice joining Guild! Let me help you set up your profile for the best experience.',
            nextSteps: ['profile_setup']
          },
          {
            id: 'profile_setup',
            type: 'action',
            content: 'Would you like me to guide you through setting up your profile?',
            actions: [
              {
                type: 'send_message',
                params: { text: 'Yes, guide me!' }
              },
              {
                type: 'send_message',
                params: { text: 'I'll do it later' }
              }
            ]
          }
        ]
      }
    ];

    defaultFlows.forEach(flow => {
      this.flows.set(flow.id, flow);
    });
  }

  // Send message to chatbot
  async sendMessage(conversationId: string, message: string, userId?: string): Promise<ChatbotMessage[]> {
    try {
      const userMessage: ChatbotMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        content: message,
        sender: 'user',
        timestamp: new Date(),
        metadata: { userId }
      };

      this.messages.push(userMessage);

      // Process message and get bot response
      const botResponses = await this.processMessage(conversationId, message, userId);

      return [userMessage, ...botResponses];

    } catch (error: any) {
      console.error('Failed to send chatbot message:', error);
      throw error;
    }
  }

  private async processMessage(conversationId: string, message: string, userId?: string): Promise<ChatbotMessage[]> {
    // Determine which flow to use based on message content and user context
    const relevantFlow = this.findRelevantFlow(message, userId);

    if (relevantFlow) {
      return await this.executeFlow(relevantFlow, conversationId, message, userId);
    } else {
      // Default response
      return [{
        id: `bot_${Date.now()}`,
        type: 'text',
        content: 'I understand. Let me connect you with a human agent who can help.',
        sender: 'bot',
        timestamp: new Date(),
        actions: [{
          type: 'transfer_to_agent',
          params: { reason: 'complex_query' }
        }]
      }];
    }
  }

  private findRelevantFlow(message: string, userId?: string): ChatbotFlow | null {
    // Simple keyword-based flow matching
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return this.flows.get('support_flow') || null;
    }

    if (lowerMessage.includes('welcome') || lowerMessage.includes('start')) {
      return this.flows.get('welcome_flow') || null;
    }

    if (lowerMessage.includes('profile') || lowerMessage.includes('setup')) {
      return this.flows.get('onboarding_flow') || null;
    }

    return null;
  }

  private async executeFlow(flow: ChatbotFlow, conversationId: string, message: string, userId?: string): Promise<ChatbotMessage[]> {
    const responses: ChatbotMessage[] = [];

    // Execute each step in the flow
    for (const step of flow.steps) {
      if (step.type === 'message') {
        responses.push({
          id: `bot_${Date.now()}_${step.id}`,
          type: 'text',
          content: step.content,
          sender: 'bot',
          timestamp: new Date()
        });
      } else if (step.type === 'question') {
        // Send question with quick reply options
        responses.push({
          id: `bot_${Date.now()}_${step.id}`,
          type: 'quick_reply',
          content: step.content,
          sender: 'bot',
          timestamp: new Date(),
          metadata: {
            quickReplies: step.actions?.map(action => action.params.text) || []
          }
        });
        break; // Stop after sending question
      }
    }

    return responses;
  }

  // Track conversation events
  trackConversationEvent(event: string, conversationId: string, metadata?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).Intercom) {
      (window as any).Intercom('trackEvent', event, {
        conversationId,
        ...metadata
      });
    }

    console.log('Chatbot event tracked:', { event, conversationId, metadata });
  }

  // Update user profile in Intercom
  updateUserProfile(userId: string, profile: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).Intercom) {
      (window as any).Intercom('update', {
        user_id: userId,
        ...profile
      });
    }

    console.log('User profile updated in Intercom:', { userId, profile });
  }

  // Show Intercom widget
  showWidget() {
    if (typeof window !== 'undefined' && (window as any).Intercom) {
      (window as any).Intercom('show');
    }
  }

  // Hide Intercom widget
  hideWidget() {
    if (typeof window !== 'undefined' && (window as any).Intercom) {
      (window as any).Intercom('hide');
    }
  }

  // Get conversation analytics
  getConversationAnalytics(): {
    totalConversations: number;
    activeConversations: number;
    averageResponseTime: number;
    satisfactionScore: number;
    topTopics: string[];
  } {
    // In a real implementation, this would query Intercom API
    return {
      totalConversations: this.activeConversations.size,
      activeConversations: Array.from(this.activeConversations.values()).filter(c => c.status === 'active').length,
      averageResponseTime: 45, // seconds
      satisfactionScore: 4.2, // out of 5
      topTopics: ['job_posting', 'profile_setup', 'payment_issues']
    };
  }
}

// Intercom chatbot component
export function IntercomChatbot({ config }: { config: ChatbotConfig }) {
  const chatbotRef = useRef<IntercomChatbotService | null>(null);

  useEffect(() => {
    chatbotRef.current = new IntercomChatbotService(config);

    // Load Intercom script
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="intercom"]')) {
      const script = document.createElement('script');
      script.src = 'https://widget.intercom.io/widget/' + config.appId;
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup
    };
  }, [config]);

  const handleChatClick = () => {
    if (chatbotRef.current) {
      chatbotRef.current.showWidget();
    }
  };

  return (
    <TouchableOpacity style={styles.chatButton} onPress={handleChatClick}>
      <Text style={styles.chatButtonText}>💬 Chat</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Export chatbot service instance
export const intercomChatbotService = new IntercomChatbotService({
  appId: process.env.INTERCOM_APP_ID || 'your-intercom-app-id',
  apiKey: process.env.INTERCOM_API_KEY || 'your-intercom-api-key',
  workspaceId: process.env.INTERCOM_WORKSPACE_ID || 'your-workspace-id',
  enabled: true,
  position: 'bottom-right',
  theme: 'auto',
  features: {
    typingIndicators: true,
    readReceipts: true,
    fileSharing: true,
    screenSharing: false
  }
});
