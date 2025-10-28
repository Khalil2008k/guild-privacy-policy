/**
 * Admin Chat Service
 * Integrates admin support into the existing chat system
 * Creates a permanent "GUILD Support" chat for every user
 */

import { auth } from '../config/firebase';
import chatService from './chatService';

// System admin user ID (this should be a real admin account in Firebase)
const SYSTEM_ADMIN_ID = 'system_admin_guild';
const SYSTEM_ADMIN_NAME = 'GUILD Support';

class AdminChatService {
  /**
   * Create welcome chat for new user
   * Called automatically when user signs up
   */
  static async createWelcomeChat(userId: string, userName: string): Promise<string> {
    try {
      console.log(`Creating welcome chat for user: ${userId}`);

      // Create direct chat with system admin
      const chat = await chatService.createDirectChat(SYSTEM_ADMIN_ID);
      
      if (!chat || !chat.id) {
        throw new Error('Failed to create chat');
      }

      // Send welcome message
      await this.sendWelcomeMessage(chat.id, userName);

      console.log(`Welcome chat created: ${chat.id}`);
      return chat.id;
    } catch (error) {
      console.error('Error creating welcome chat:', error);
      throw error;
    }
  }

  /**
   * Send welcome message to new user
   */
  private static async sendWelcomeMessage(chatId: string, userName: string): Promise<void> {
    const welcomeMessageEn = `👋 Welcome to GUILD, ${userName}!

We're excited to have you join our community of skilled professionals and clients.

🎯 **What you can do:**
• Find and apply for jobs
• Create your own job postings
• Join or create guilds
• Earn and manage coins
• Build your professional reputation

💬 **Need help?**
Feel free to message us anytime! We're here to help you succeed.

📚 **Getting Started:**
1. Complete your profile
2. Browse available jobs
3. Connect with professionals
4. Start earning!

Good luck on your GUILD journey! 🚀`;

    const welcomeMessageAr = `👋 مرحباً بك في GUILD يا ${userName}!

نحن متحمسون لانضمامك إلى مجتمعنا من المحترفين المهرة والعملاء.

🎯 **ما يمكنك فعله:**
• البحث عن الوظائف والتقدم لها
• إنشاء إعلانات وظائف خاصة بك
• الانضمام إلى النقابات أو إنشائها
• كسب وإدارة العملات
• بناء سمعتك المهنية

💬 **تحتاج مساعدة؟**
لا تتردد في مراسلتنا في أي وقت! نحن هنا لمساعدتك على النجاح.

📚 **البدء:**
1. أكمل ملفك الشخصي
2. تصفح الوظائف المتاحة
3. تواصل مع المحترفين
4. ابدأ في الكسب!

حظاً موفقاً في رحلتك مع GUILD! 🚀`;

    try {
      // Send English message
      await chatService.sendMessage(chatId, {
        text: welcomeMessageEn,
        senderId: SYSTEM_ADMIN_ID,
        senderName: SYSTEM_ADMIN_NAME,
        type: 'text',
        isSystemMessage: true
      });

      // Send Arabic message
      await chatService.sendMessage(chatId, {
        text: welcomeMessageAr,
        senderId: SYSTEM_ADMIN_ID,
        senderName: SYSTEM_ADMIN_NAME,
        type: 'text',
        isSystemMessage: true
      });
    } catch (error) {
      console.error('Error sending welcome message:', error);
      // Don't throw - chat is created, message failure is not critical
    }
  }

  /**
   * Get or create admin chat for current user
   * Used when user wants to contact support
   */
  static async getOrCreateAdminChat(): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Try to find existing chat with admin
      const chats = await chatService.getUserChats();
      const adminChat = chats.find(chat => 
        chat.participants?.includes(SYSTEM_ADMIN_ID)
      );

      if (adminChat) {
        return adminChat.id;
      }

      // Create new chat if doesn't exist
      const chat = await chatService.createDirectChat(SYSTEM_ADMIN_ID);
      return chat.id;
    } catch (error) {
      console.error('Error getting/creating admin chat:', error);
      throw error;
    }
  }

  /**
   * Check if a chat is with admin
   */
  static isAdminChat(chat: any): boolean {
    return chat.participants?.includes(SYSTEM_ADMIN_ID);
  }

  /**
   * Send announcement to all users
   * Admin function - creates a message in every user's admin chat
   */
  static async sendAnnouncementToAll(
    title: string,
    message: string,
    adminId: string
  ): Promise<void> {
    try {
      // This would be called from admin portal
      // Implementation would query all users and send message to each
      console.log('Sending announcement to all users:', title);
      
      // TODO: Implement in admin portal
      // For now, just log
      console.warn('sendAnnouncementToAll not yet implemented - requires admin portal');
    } catch (error) {
      console.error('Error sending announcement:', error);
      throw error;
    }
  }

  /**
   * Send update to specific user
   * System function - sends automated messages
   */
  static async sendUpdateToUser(
    userId: string,
    message: string,
    relatedJobId?: string
  ): Promise<void> {
    try {
      // Find user's admin chat
      const chats = await chatService.getUserChats();
      const adminChat = chats.find(chat => 
        chat.participants?.includes(SYSTEM_ADMIN_ID) &&
        chat.participants?.includes(userId)
      );

      if (!adminChat) {
        console.warn(`No admin chat found for user ${userId}`);
        return;
      }

      // Send message
      await chatService.sendMessage(adminChat.id, {
        text: message,
        senderId: SYSTEM_ADMIN_ID,
        senderName: SYSTEM_ADMIN_NAME,
        type: 'text',
        isSystemMessage: true,
        metadata: relatedJobId ? { jobId: relatedJobId } : undefined
      });
    } catch (error) {
      console.error('Error sending update to user:', error);
      throw error;
    }
  }

  /**
   * Get system admin ID
   */
  static getSystemAdminId(): string {
    return SYSTEM_ADMIN_ID;
  }

  /**
   * Get system admin name
   */
  static getSystemAdminName(): string {
    return SYSTEM_ADMIN_NAME;
  }
}

export default AdminChatService;