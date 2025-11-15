/**
 * Date formatting utilities
 * 
 * Provides consistent date formatting across the admin panel
 */

/**
 * Format a date string to local date-time string
 * Shows both date and time in the user's local timezone
 * 
 * @param dateString - ISO date string from API
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date-time string (e.g., "12/25/2024, 3:45:30 PM")
 */
export function formatDateTime(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return 'N/A';
  
  try {
    // Parse the date - JavaScript Date automatically converts UTC to local time
    // If the string has 'Z' or timezone offset, it will be converted
    // If not, we need to ensure it's treated as UTC from the server
    let date: Date;
    
    // Check if date string has timezone information
    const hasTimezone = dateString.includes('Z') || 
                       dateString.match(/[+-]\d{2}:\d{2}$/) !== null ||
                       dateString.match(/[+-]\d{4}$/) !== null;
    
    if (hasTimezone) {
      // Has timezone info, parse directly (will auto-convert to local)
      date = new Date(dateString);
    } else {
      // No timezone info - assume it's UTC from the server
      // If it's a full ISO-like string (has time), append 'Z' for UTC
      if (dateString.includes('T') && dateString.match(/\d{2}:\d{2}/)) {
        date = new Date(dateString + 'Z');
      } else {
        // Just a date, parse as-is
        date = new Date(dateString);
      }
    }
    
    // Verify the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid Date';
    }
    
    // Get user's local timezone
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Default options: show date and time with seconds in local timezone
    // Force numeric month/day format (not abbreviated month names)
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',  // Use numeric month (01-12), not abbreviated name
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // 12-hour format with AM/PM
      timeZone: localTimezone, // Explicitly use local timezone
      ...options,
    };
    
    // Format in local timezone - this will show the converted local time
    return date.toLocaleString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'Invalid Date';
  }
}

/**
 * Format a date string to local date string only (no time)
 * 
 * @param dateString - ISO date string from API
 * @returns Formatted date string (e.g., "12/25/2024")
 */
export function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a date string to local time string only (no date)
 * 
 * @param dateString - ISO date string from API
 * @returns Formatted time string (e.g., "3:45:30 PM")
 */
export function formatTimeOnly(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
}

/**
 * Format a date string with relative time (e.g., "2 hours ago", "3 days ago")
 * Falls back to full date-time if more than 7 days ago
 * 
 * @param dateString - ISO date string from API
 * @returns Relative time string or formatted date-time
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      // More than 7 days, show full date-time
      return formatDateTime(dateString);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
}

