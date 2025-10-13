import { DatePrecisionPicker, DatePrecisionValue } from '@/components/DatePrecisionPicker'
import { PeopleTagger, PersonTag } from './PeopleTagger'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { StoryPrivacy } from '@/hooks/useComposerState'

interface ContextPanelProps {
  familyId: string
  dateValue: DatePrecisionValue
  placeText: string
  privacy: StoryPrivacy
  peopleTags: PersonTag[]
  currentUserId?: string
  onDateChange: (value: DatePrecisionValue) => void
  onPlaceChange: (place: string) => void
  onPrivacyChange: (privacy: StoryPrivacy) => void
  onPeopleTagsChange: (tags: PersonTag[]) => void
}

export function ContextPanel({ 
  familyId, 
  dateValue,
  placeText,
  privacy,
  peopleTags,
  currentUserId,
  onDateChange,
  onPlaceChange,
  onPrivacyChange,
  onPeopleTagsChange 
}: ContextPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Context & Tags</h3>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          When was this?
        </label>
        <DatePrecisionPicker value={dateValue} onChange={onDateChange} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Place
        </label>
        <Input
          placeholder="Where was this?"
          value={placeText}
          onChange={(e) => onPlaceChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Free text for now, map integration coming later
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">
          Privacy
        </label>
        <RadioGroup value={privacy} onValueChange={(v) => onPrivacyChange(v as StoryPrivacy)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private" id="privacy-private" />
            <Label htmlFor="privacy-private" className="font-normal cursor-pointer">
              <div className="font-medium">Private (Family only)</div>
              <div className="text-xs text-muted-foreground">Only family members can see</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="link_only" id="privacy-link" />
            <Label htmlFor="privacy-link" className="font-normal cursor-pointer">
              <div className="font-medium">Link-only</div>
              <div className="text-xs text-muted-foreground">Anyone with the link can view</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="privacy-public" />
            <Label htmlFor="privacy-public" className="font-normal cursor-pointer">
              <div className="font-medium">Public (Indexable)</div>
              <div className="text-xs text-muted-foreground">Searchable by anyone</div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Tags
        </label>
        <p className="text-sm text-muted-foreground">
          Coming soon: Add tags to organize your stories
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          People
        </label>
        <PeopleTagger
          familyId={familyId}
          tags={peopleTags}
          onChange={onPeopleTagsChange}
          currentUserId={currentUserId}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Places
        </label>
        <p className="text-sm text-muted-foreground">
          Coming soon: Advanced location tagging
        </p>
      </div>
    </div>
  )
}
