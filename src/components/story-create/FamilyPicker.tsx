import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FamilyPickerProps {
  families: { id: string; name: string }[]
  onSelect: (familyId: string) => void
}

export default function FamilyPicker({ families, onSelect }: FamilyPickerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Family</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          You're a member of multiple families. Which family is this story for?
        </p>
        {families.map((family) => (
          <Button
            key={family.id}
            onClick={() => onSelect(family.id)}
            variant="outline"
            className="w-full justify-start text-left h-auto py-4"
          >
            <div>
              <div className="font-semibold">{family.name}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
