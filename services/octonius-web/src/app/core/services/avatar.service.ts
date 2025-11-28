import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  
  /**
   * Get user initials from first and last name, with fallback to email
   */
  getUserInitials(user: any): string {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    } else if (user.first_name) {
      return user.first_name[0].toUpperCase();
    } else if (user.last_name) {
      return user.last_name[0].toUpperCase();
    } else if (user.email) {
      // Use first two characters of email for initials
      return user.email.substring(0, 2).toUpperCase();
    } else if (user.displayName) {
      // Fallback to displayName
      const names = user.displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    } else if (user.name) {
      // Fallback to name
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    } else {
      return 'U';
    }
  }

  /**
   * Get user display name with proper fallbacks
   */
  getUserDisplayName(user: any): string {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.last_name) {
      return user.last_name;
    } else if (user.displayName) {
      return user.displayName;
    } else if (user.name) {
      return user.name;
    } else if (user.full_name) {
      return user.full_name;
    } else {
      return user.email || 'Unknown User';
    }
  }

  /**
   * Get avatar URL if available
   */
  getAvatarUrl(user: any): string | null {
    return user.avatar_url || user.avatarUrl || null;
  }

  /**
   * Check if user has a custom avatar (not the default one)
   */
  hasCustomAvatar(user: any): boolean {
    const avatarUrl = this.getAvatarUrl(user);
    return !!(avatarUrl && !avatarUrl.includes('icon_avatar.svg'));
  }

  /**
   * Generate initials from any name string
   */
  getInitialsFromName(name: string): string {
    if (!name) return 'U';
    
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  /**
   * Check if a string is a valid URL
   */
  isValidUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.startsWith('http') || url.startsWith('/') || url.includes('.');
  }
}
