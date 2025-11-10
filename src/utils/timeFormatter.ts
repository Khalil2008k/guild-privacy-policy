/**
 * Advanced Time Formatting Utilities
 * Smart, context-aware time formatting for chat messages
 */

export interface TimeFormatOptions {
  showSeconds?: boolean;
  use24Hour?: boolean;
  showDate?: boolean;
  relative?: boolean;
  language?: 'en' | 'ar';
}

/**
 * Format time for chat list (Just now, 5m, 2h, Yesterday, Mon, 12/25)
 */
export function formatChatTime(date: Date, language: 'en' | 'ar' = 'en'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Just now (< 1 minute)
  if (diffSeconds < 60) {
    return language === 'ar' ? 'الآن' : 'Just now';
  }

  // Minutes ago (< 1 hour)
  if (diffMinutes < 60) {
    return language === 'ar' ? `${diffMinutes}د` : `${diffMinutes}m`;
  }

  // Hours ago (< 24 hours)
  if (diffHours < 24) {
    return language === 'ar' ? `${diffHours}س` : `${diffHours}h`;
  }

  // Yesterday
  if (diffDays === 1) {
    return language === 'ar' ? 'أمس' : 'Yesterday';
  }

  // This week (< 7 days) - show day name
  if (diffDays < 7) {
    const days = language === 'ar' 
      ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }

  // This year - show date without year
  if (date.getFullYear() === now.getFullYear()) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return language === 'ar' ? `${day}/${month}` : `${month}/${day}`;
  }

  // Older - show full date
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear() % 100; // Last 2 digits
  return language === 'ar' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}

/**
 * Format time for message bubbles (12:30 PM, Yesterday 3:45 PM, Dec 25 at 10:00 AM)
 */
export function formatMessageTime(date: Date, language: 'en' | 'ar' = 'en', use24Hour: boolean = false): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  const timeStr = formatTime(date, use24Hour, language);

  // Today - just time
  if (diffDays === 0) {
    return timeStr;
  }

  // Yesterday
  if (diffDays === 1) {
    const yesterday = language === 'ar' ? 'أمس' : 'Yesterday';
    return `${yesterday} ${timeStr}`;
  }

  // This week - day name + time
  if (diffDays < 7) {
    const days = language === 'ar'
      ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    return `${dayName} ${timeStr}`;
  }

  // This year - month day + time
  if (date.getFullYear() === now.getFullYear()) {
    const months = language === 'ar'
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const at = language === 'ar' ? 'في' : 'at';
    return `${monthName} ${day} ${at} ${timeStr}`;
  }

  // Older - full date + time
  const months = language === 'ar'
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const at = language === 'ar' ? 'في' : 'at';
  return `${monthName} ${day}, ${year} ${at} ${timeStr}`;
}

/**
 * Format just the time (12:30 PM or 12:30)
 */
export function formatTime(date: Date, use24Hour: boolean = false, language: 'en' | 'ar' = 'en'): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();

  if (use24Hour) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const period = hours >= 12 ? (language === 'ar' ? 'م' : 'PM') : (language === 'ar' ? 'ص' : 'AM');
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format relative time (5 minutes ago, 2 hours ago, 3 days ago)
 */
export function formatRelativeTime(date: Date, language: 'en' | 'ar' = 'en'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (language === 'ar') {
    if (diffSeconds < 60) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    if (diffWeeks < 4) return `منذ ${diffWeeks} أسبوع`;
    if (diffMonths < 12) return `منذ ${diffMonths} شهر`;
    return `منذ ${diffYears} سنة`;
  }

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
}

/**
 * Get date separator text (Today, Yesterday, Monday, December 25, 2024)
 */
export function getDateSeparator(date: Date, language: 'en' | 'ar' = 'en'): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  // Today
  if (diffDays === 0) {
    return language === 'ar' ? 'اليوم' : 'Today';
  }

  // Yesterday
  if (diffDays === 1) {
    return language === 'ar' ? 'أمس' : 'Yesterday';
  }

  // This week - day name
  if (diffDays < 7) {
    const days = language === 'ar'
      ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  // This year - month day
  if (date.getFullYear() === now.getFullYear()) {
    const months = language === 'ar'
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    return `${monthName} ${day}`;
  }

  // Older - full date
  const months = language === 'ar'
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${monthName} ${day}, ${year}`;
}

/**
 * Format duration (for voice messages, videos)
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `0:${seconds.toString().padStart(2, '0')}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const now = new Date();
  return date.getDate() === now.getDate() &&
         date.getMonth() === now.getMonth() &&
         date.getFullYear() === now.getFullYear();
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
         date.getMonth() === yesterday.getMonth() &&
         date.getFullYear() === yesterday.getFullYear();
}
















