import React from 'react'
import { StoriesSubnav, FamilySubnav } from './ContextualSubnav'

/**
 * Navigation Pattern Components
 * 
 * These components provide consistent navigation patterns across the app
 * following Phase 3 navigation simplification requirements.
 */

interface NavigationLayoutProps {
  children: React.ReactNode
  showSubnav?: boolean
  subnavType?: 'stories' | 'family' | 'custom'
  customSubnav?: React.ReactNode
}

export function NavigationLayout({ 
  children, 
  showSubnav = false, 
  subnavType,
  customSubnav 
}: NavigationLayoutProps) {
  return (
    <div className="navigation-layout min-h-screen">
      {/* Header is rendered globally */}
      
      {/* Contextual Subnav */}
      {showSubnav && (
        <div className="subnav-container">
          {customSubnav ? (
            customSubnav
          ) : subnavType === 'stories' ? (
            <StoriesSubnav />
          ) : subnavType === 'family' ? (
            <FamilySubnav />
          ) : null}
        </div>
      )}

      {/* Main Content */}
      <div className="content-container flex-1">
        {children}
      </div>

      {/* Mobile bottom nav is rendered globally */}
    </div>
  )
}

/**
 * Page Layout Components for different sections
 */

export function StoriesPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationLayout showSubnav subnavType="stories">
      {children}
    </NavigationLayout>
  )
}

export function FamilyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationLayout showSubnav subnavType="family">
      {children}
    </NavigationLayout>
  )
}

/**
 * Navigation Patterns Documentation
 * 
 * Usage examples:
 * 
 * // For Stories pages
 * <StoriesPageLayout>
 *   <YourPageContent />
 * </StoriesPageLayout>
 * 
 * // For Family pages  
 * <FamilyPageLayout>
 *   <YourPageContent />
 * </FamilyPageLayout>
 * 
 * // For custom subnav
 * <NavigationLayout 
 *   showSubnav 
 *   customSubnav={<YourCustomSubnav />}
 * >
 *   <YourPageContent />
 * </NavigationLayout>
 */