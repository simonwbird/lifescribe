import { memo } from 'react'
import { cn } from '@/lib/utils'

interface AppFooterProps {
  className?: string
}

export const AppFooter = memo(function AppFooter({ className }: AppFooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer 
      className={cn(
        "mt-auto border-t bg-muted/30 px-6 py-8",
        className
      )}
      role="contentinfo"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-h6 font-serif font-semibold">Lifescribe</h3>
            <p className="text-body-sm text-muted-foreground">
              Preserve your family's stories for generations to come.
            </p>
          </div>

          {/* Stories */}
          <div className="space-y-3">
            <h4 className="text-body font-medium">Stories</h4>
            <nav className="space-y-2" aria-label="Stories navigation">
              <a href="/prompts" className="block text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                Prompts
              </a>
              <a href="/voice" className="block text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                Quick Voice
              </a>
              <a href="/create" className="block text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                Create Story
              </a>
            </nav>
          </div>

          {/* Family */}
          <div className="space-y-3">
            <h4 className="text-body font-medium">Family</h4>
            <nav className="space-y-2" aria-label="Family navigation">
              <a href="/people" className="block text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                People
              </a>
              <a href="/family-tree" className="block text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                Family Tree
              </a>
              <a href="/my-life-page" className="block text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                My Life Page
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-body font-medium">Legal</h4>
            <nav className="space-y-2" aria-label="Legal navigation">
              <a href="/privacy" className="block text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="block text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="/support" className="block text-body-sm text-muted-foreground hover:text-foreground transition-colors">
                Support
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50">
          <p className="text-meta text-muted-foreground text-center">
            © {currentYear} Lifescribe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
})