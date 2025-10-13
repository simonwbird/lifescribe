import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ComposerFooterProps {
  isSubmitting: boolean
  hasContent: boolean
  onSaveDraft: () => void
  onPublish: () => void
  onCancel: () => void
}

export function ComposerFooter({
  isSubmitting,
  hasContent,
  onSaveDraft,
  onPublish,
  onCancel
}: ComposerFooterProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-10">
      <div className="container max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <div className="flex gap-3">
            {hasContent && (
              <Button
                type="button"
                variant="secondary"
                onClick={onSaveDraft}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </Button>
            )}
            <Button
              type="button"
              onClick={onPublish}
              disabled={isSubmitting || !hasContent}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
