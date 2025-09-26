import { Button } from '@/components/ui/button'
import { Camera, Upload } from 'lucide-react'
import { type StoryFormData } from '../StoryWizardTypes'
import TeenMediaUploader from '@/components/teen/TeenMediaUploader'

interface StoryWizardStep3Props {
  formData: StoryFormData
  onChange: (updates: Partial<StoryFormData>) => void
  onNext: () => void
  onPrevious: () => void
  isPhotoFirst?: boolean
}

export default function StoryWizardStep3({ 
  formData, 
  onChange, 
  onNext, 
  onPrevious,
  isPhotoFirst = false
}: StoryWizardStep3Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold mb-2 flex items-center gap-2">
          <Camera className="h-6 w-6" />
          Photos & Videos
        </h2>
        <p className="text-muted-foreground">
          Add photos and videos to bring your story to life. They'll be organized with your story.
        </p>
      </div>

      <div className="space-y-4">
        <TeenMediaUploader
          media={formData.media}
          onMediaChange={(media) => onChange({ media })}
          maxFiles={10}
        />

        {formData.media.length === 0 && (
          <div className="bg-muted/30 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-medium mb-2">No media yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Photos and videos help preserve memories and make stories more engaging for family members.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Family photos from the time period</p>
              <p>• Pictures of places mentioned in the story</p>
              <p>• Documents, letters, or artifacts</p>
              <p>• Recent photos of the same people or places</p>
            </div>
          </div>
        )}

        {formData.media.length > 0 && (
          <div className="bg-brand-green/5 border border-brand-green/20 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2 text-brand-green">
              Great! You've added {formData.media.length} {formData.media.length === 1 ? 'file' : 'files'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {formData.media.find(m => m.isCover) 
                ? 'Your cover image is set. You can reorder files by dragging them and add captions to provide context.'
                : 'Consider setting a cover image by clicking the star icon on your favorite photo.'
              }
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        {!isPhotoFirst && (
          <Button variant="outline" onClick={onPrevious}>
            Back to People & Places
          </Button>
        )}
        {isPhotoFirst && <div />} {/* Spacer for photo-first mode */}
        <Button 
          onClick={onNext}
          className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground"
        >
          {isPhotoFirst ? 'Continue to Basics' : 'Continue to Review'}
        </Button>
      </div>
    </div>
  )
}