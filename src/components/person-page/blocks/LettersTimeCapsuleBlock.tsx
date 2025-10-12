import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Mail, Lock, Calendar as CalendarIcon, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

type LetterVisibility = 'only_me' | 'inner_circle' | 'family' | 'public';

type Letter = {
  id: string;
  title: string;
  to?: string;
  body: string;
  visibility: LetterVisibility;
  unlock_at?: string;
};

type Content = {
  letters?: Letter[];
};

interface LettersTimeCapsuleBlockProps {
  personId: string;
  familyId: string;
  blockContent?: Content;
  canEdit: boolean;
  onUpdate?: (content: Content) => void;
}

export default function LettersTimeCapsuleBlock({
  blockContent,
  canEdit,
  onUpdate,
}: LettersTimeCapsuleBlockProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const letters: Letter[] = blockContent?.letters || [];

  const addLetter = () => {
    const newLetter: Letter = {
      id: crypto.randomUUID(),
      title: '',
      body: '',
      visibility: 'only_me',
    };
    const updatedLetters = [...letters, newLetter];
    onUpdate?.({ letters: updatedLetters });
    setEditingId(newLetter.id);
  };

  const updateLetter = (idx: number, patch: Partial<Letter>) => {
    const updatedLetters = [...letters];
    updatedLetters[idx] = { ...updatedLetters[idx], ...patch };
    onUpdate?.({ letters: updatedLetters });
  };

  const deleteLetter = (idx: number) => {
    const updatedLetters = letters.filter((_, i) => i !== idx);
    onUpdate?.({ letters: updatedLetters });
    setEditingId(null);
  };

  const isLocked = (letter: Letter) => {
    if (!letter.unlock_at) return false;
    return new Date(letter.unlock_at) > new Date();
  };

  const canViewLetter = (letter: Letter) => {
    if (canEdit) return true;
    return !isLocked(letter);
  };

  const visibilityLabels: Record<LetterVisibility, string> = {
    only_me: 'Only Me',
    inner_circle: 'Inner Circle',
    family: 'Family',
    public: 'Public',
  };

  return (
    <Card id="letters">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Letters & Time Capsules
            </CardTitle>
            <CardDescription>
              Write letters to loved ones or your future self, with optional unlock dates.
            </CardDescription>
          </div>
          {canEdit && (
            <Button onClick={addLetter} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Letter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {letters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {canEdit 
              ? "No letters yet. Create your first letter or time capsule."
              : "No letters available to view."}
          </div>
        ) : (
          <div className="space-y-4">
            {letters.map((letter, idx) => {
              const isEditing = editingId === letter.id;
              const showLetter = canViewLetter(letter);
              const locked = isLocked(letter);

              return (
                <Card key={letter.id} className={cn(
                  "overflow-hidden",
                  locked && !canEdit && "opacity-60"
                )}>
                  <CardContent className="p-4 space-y-3">
                    {canEdit && isEditing ? (
                      // Edit mode
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`title-${letter.id}`}>Title</Label>
                          <Input
                            id={`title-${letter.id}`}
                            placeholder="Letter title"
                            value={letter.title}
                            onChange={(e) => updateLetter(idx, { title: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`to-${letter.id}`}>To (optional)</Label>
                          <Input
                            id={`to-${letter.id}`}
                            placeholder="Recipient name"
                            value={letter.to || ''}
                            onChange={(e) => updateLetter(idx, { to: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`body-${letter.id}`}>Letter</Label>
                          <Textarea
                            id={`body-${letter.id}`}
                            placeholder="Write your letter..."
                            value={letter.body}
                            onChange={(e) => updateLetter(idx, { body: e.target.value })}
                            rows={8}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Unlock Date (optional)</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !letter.unlock_at && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {letter.unlock_at
                                    ? format(new Date(letter.unlock_at), "PPP")
                                    : "No unlock date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={letter.unlock_at ? new Date(letter.unlock_at) : undefined}
                                  onSelect={(date) => {
                                    updateLetter(idx, {
                                      unlock_at: date ? date.toISOString() : undefined,
                                    });
                                  }}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                            {letter.unlock_at && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateLetter(idx, { unlock_at: undefined })}
                                className="w-full"
                              >
                                Clear date
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Visibility</Label>
                            <Select
                              value={letter.visibility}
                              onValueChange={(value) =>
                                updateLetter(idx, { visibility: value as LetterVisibility })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="only_me">Only Me</SelectItem>
                                <SelectItem value="inner_circle">Inner Circle</SelectItem>
                                <SelectItem value="family">Family</SelectItem>
                                <SelectItem value="public">Public</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="flex-1"
                          >
                            Done
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteLetter(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      // View mode
                      <>
                        {showLetter ? (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                {letter.to && (
                                  <div className="text-sm text-muted-foreground mb-1">
                                    To {letter.to}
                                  </div>
                                )}
                                <h3 className="font-semibold text-lg">
                                  {letter.title || "Untitled Letter"}
                                </h3>
                              </div>
                              <div className="flex gap-2">
                                {locked && (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    Locked
                                  </Badge>
                                )}
                                <Badge variant="outline">
                                  {visibilityLabels[letter.visibility]}
                                </Badge>
                              </div>
                            </div>

                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {letter.body || "No content yet."}
                            </p>

                            {letter.unlock_at && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {locked
                                  ? `Unlocks ${format(new Date(letter.unlock_at), "PPP")}`
                                  : `Unlocked on ${format(new Date(letter.unlock_at), "PPP")}`}
                              </div>
                            )}

                            {canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingId(letter.id)}
                                className="w-full"
                              >
                                Edit Letter
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-3 py-4">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {letter.title || "Locked Letter"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Unlocks on {format(new Date(letter.unlock_at!), "PPP")}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
