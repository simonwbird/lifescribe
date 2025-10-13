import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RSVPResponse, RSVPCounts } from '@/lib/events/eventTypes';
import { Check, X, HelpCircle, Users } from 'lucide-react';
import { useState } from 'react';

interface RSVPSectionProps {
  myResponse: RSVPResponse | null;
  counts: RSVPCounts;
  onUpdate: (data: { response: RSVPResponse; notes?: string; guestCount?: number }) => void;
  isUpdating: boolean;
}

export function RSVPSection({ myResponse, counts, onUpdate, isUpdating }: RSVPSectionProps) {
  const [notes, setNotes] = useState('');
  const [guestCount, setGuestCount] = useState(1);

  const handleRSVP = (response: RSVPResponse) => {
    onUpdate({ response, notes, guestCount });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>RSVP</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <Users className="h-4 w-4" />
            <span className="text-muted-foreground">
              {counts.yes} attending · {counts.maybe} maybe
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* RSVP Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={myResponse === 'yes' ? 'default' : 'outline'}
            onClick={() => handleRSVP('yes')}
            disabled={isUpdating}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Yes
          </Button>
          <Button
            variant={myResponse === 'maybe' ? 'default' : 'outline'}
            onClick={() => handleRSVP('maybe')}
            disabled={isUpdating}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Maybe
          </Button>
          <Button
            variant={myResponse === 'no' ? 'default' : 'outline'}
            onClick={() => handleRSVP('no')}
            disabled={isUpdating}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            No
          </Button>
        </div>

        {/* Guest Count */}
        {(myResponse === 'yes' || myResponse === 'maybe') && (
          <div>
            <Label htmlFor="guest-count">Number of Guests</Label>
            <Input
              id="guest-count"
              type="number"
              min="1"
              max="20"
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <Label htmlFor="rsvp-notes">Additional Notes (optional)</Label>
          <Textarea
            id="rsvp-notes"
            placeholder="Dietary restrictions, questions, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Counts Summary */}
        <div className="flex gap-2 pt-2 border-t">
          <Badge variant="outline" className="gap-1">
            <Check className="h-3 w-3 text-success" />
            {counts.yes} Yes
          </Badge>
          <Badge variant="outline" className="gap-1">
            <HelpCircle className="h-3 w-3 text-warning" />
            {counts.maybe} Maybe
          </Badge>
          <Badge variant="outline" className="gap-1">
            <X className="h-3 w-3 text-destructive" />
            {counts.no} No
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
