/**
 * Utility functions for Discovery Mode
 */

export function filterContentForDiscoveryMode<T extends { privacy?: string }>(
  items: T[],
  isDiscoveryMode: boolean
): T[] {
  if (!isDiscoveryMode) return items;
  
  // In discovery mode, only show public content
  return items.filter((item) => {
    // If privacy is not set, assume it's public (for backward compatibility)
    if (!item.privacy) return true;
    
    // Only include public items
    return item.privacy === 'public' || item.privacy === 'family';
  });
}

export function getDiscoveryModeReactions() {
  // Simplified emoji-only reactions for discovery mode
  return ['❤️', '👍', '😊', '🎉', '👏', '🤗'];
}

export function shouldHideInDiscovery(privacy?: string): boolean {
  if (!privacy) return false;
  return privacy === 'private' || privacy === 'invite_only';
}
