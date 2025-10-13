import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Upload, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface EventUploadLinkProps {
  eventId: string;
  uploadToken?: string;
}

export function EventUploadLink({ eventId, uploadToken }: EventUploadLinkProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const uploadUrl = `${window.location.origin}/event/${eventId}/upload?token=${uploadToken}`;

  const copyLink = () => {
    navigator.clipboard.writeText(uploadUrl);
    setCopied(true);
    toast({
      title: 'Link copied',
      description: 'Share this link with attendees to collect photos and videos',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Link
        </CardTitle>
        <CardDescription>
          Share this link to collect photos and videos from attendees (no login required)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="upload-link" className="sr-only">Upload Link</Label>
            <Input
              id="upload-link"
              value={uploadUrl}
              readOnly
              className="font-mono text-sm"
            />
          </div>
          <Button
            onClick={copyLink}
            variant="outline"
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium mb-1">Accepts:</p>
          <ul className="list-disc list-inside text-muted-foreground">
            <li>Photos (JPG, PNG, HEIC)</li>
            <li>Videos (MP4, MOV)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
