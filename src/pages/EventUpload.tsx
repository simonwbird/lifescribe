import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function EventUpload() {
  const { eventId, token } = useParams<{ eventId: string; token: string }>();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [guestName, setGuestName] = useState('');
  const [guestNote, setGuestNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    validateToken();
  }, [eventId, token]);

  const validateToken = async () => {
    if (!eventId || !token) return;

    setValidating(true);
    try {
      // Verify token exists and is valid
      const { data, error } = await supabase
        .from('event_upload_tokens')
        .select('*, life_events(id, title, event_date, event_type)')
        .eq('token', token)
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error('Invalid or expired upload link');
        setValidToken(false);
        return;
      }

      // Check expiration
      if (new Date(data.expires_at) < new Date()) {
        toast.error('This upload link has expired');
        setValidToken(false);
        return;
      }

      // Check max uploads
      if (data.max_uploads && data.current_uploads >= data.max_uploads) {
        toast.error('Maximum uploads reached for this link');
        setValidToken(false);
        return;
      }

      setEventDetails(data.life_events);
      setValidToken(true);
    } catch (error: any) {
      console.error('Error validating token:', error);
      toast.error('Failed to validate upload link');
      setValidToken(false);
    } finally {
      setValidating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !token || !eventId) return;

    setLoading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];

        const { data, error } = await supabase.functions.invoke('upload-to-event', {
          body: {
            token,
            eventId,
            guestName: guestName || 'Anonymous Guest',
            guestNote,
            fileData: base64Data,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
          },
        });

        if (error) throw error;

        setUploaded(true);
        toast.success('Photo uploaded successfully!');

        // Reset form
        setTimeout(() => {
          setSelectedFile(null);
          setPreviewUrl('');
          setGuestNote('');
          setUploaded(false);
        }, 3000);
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validating upload link...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invalid Upload Link</CardTitle>
            <CardDescription>
              This upload link is invalid, expired, or has reached its maximum number of
              uploads.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {eventDetails?.title || 'Event Upload'}
            </CardTitle>
            <CardDescription>
              Share your photos and memories from this special event
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {uploaded ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upload Successful!</h3>
                <p className="text-muted-foreground mb-4">
                  Your photo has been added to the event album
                </p>
                <Button onClick={() => setUploaded(false)}>Upload Another</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Add a Note (optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Share a memory or message..."
                    value={guestNote}
                    onChange={(e) => setGuestNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Photo</Label>
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full rounded-lg max-h-96 object-contain"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl('');
                        }}
                        className="absolute top-2 right-2"
                      >
                        Change Photo
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and
                          drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, HEIC up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    'Uploading...'
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}