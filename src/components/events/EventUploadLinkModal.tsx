import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Link as LinkIcon, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EventUploadLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  familyId: string;
}

export function EventUploadLinkModal({
  open,
  onOpenChange,
  eventId,
  familyId,
}: EventUploadLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUploads, setMaxUploads] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateLink = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-event-upload-link', {
        body: {
          eventId,
          familyId,
          expiresInDays,
          maxUploads,
        },
      });

      if (error) throw error;

      setUploadUrl(data.uploadUrl);
      setExpiresAt(data.expiresAt);
      toast.success('Upload link created successfully!');
    } catch (error: any) {
      console.error('Error creating upload link:', error);
      toast.error(error.message || 'Failed to create upload link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uploadUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleClose = () => {
    setUploadUrl('');
    setExpiresAt('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Share Upload Link
          </DialogTitle>
        </DialogHeader>

        {!uploadUrl ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expires">Link expires in (days)</Label>
              <Input
                id="expires"
                type="number"
                min="1"
                max="30"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUploads">Maximum uploads (optional)</Label>
              <Input
                id="maxUploads"
                type="number"
                min="1"
                max="100"
                placeholder="Unlimited"
                value={maxUploads || ''}
                onChange={(e) =>
                  setMaxUploads(e.target.value ? Number(e.target.value) : null)
                }
              />
              <p className="text-sm text-muted-foreground">
                Leave empty for unlimited uploads
              </p>
            </div>

            <Button
              onClick={handleCreateLink}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Upload Link'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Upload Link</Label>
              <div className="flex gap-2">
                <Input value={uploadUrl} readOnly className="font-mono text-sm" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <p>
                <strong>Expires:</strong>{' '}
                {new Date(expiresAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p>
                <strong>Max uploads:</strong> {maxUploads || 'Unlimited'}
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Share this link with guests to allow them to upload photos and memories
              to this event. No login required.
            </p>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}