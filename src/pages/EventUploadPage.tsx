import { useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Check, X, Image as ImageIcon, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function EventUploadPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });

    if (validFiles.length !== files.length) {
      toast({
        title: 'Some files skipped',
        description: 'Only photos and videos are accepted',
        variant: 'destructive',
      });
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleUpload = async () => {
    if (!token || !eventId || selectedFiles.length === 0) return;
    if (!contributorName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      let completed = 0;

      for (const file of selectedFiles) {
        // Upload to storage
        const filePath = `events/${eventId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get family_id from event
        const { data: event } = await supabase
          .from('events')
          .select('family_id')
          .eq('id', eventId)
          .single();

        if (!event) throw new Error('Event not found');

        // Record upload in database
        const { error: dbError } = await supabase
          .from('event_uploads')
          .insert({
            event_id: eventId,
            family_id: event.family_id,
            upload_token_id: token,
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            contributor_name: contributorName.trim(),
            contributor_email: contributorEmail.trim() || null,
          });

        if (dbError) throw dbError;

        completed++;
        setUploadProgress((completed / totalFiles) * 100);
        setUploadedFiles((prev) => [...prev, file.name]);
      }

      toast({
        title: 'Upload complete!',
        description: `Successfully uploaded ${totalFiles} ${totalFiles === 1 ? 'file' : 'files'}`,
      });

      setSelectedFiles([]);
      setContributorName('');
      setContributorEmail('');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Upload Event Photos & Videos
          </CardTitle>
          <CardDescription>
            Share your photos and videos from this event (no login required)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contributor Info */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={contributorEmail}
                onChange={(e) => setContributorEmail(e.target.value)}
                disabled={uploading}
              />
            </div>
          </div>

          {/* File Selection */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full gap-2 border-dashed"
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
              Select Photos & Videos
            </Button>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({selectedFiles.length})</Label>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-accent/50"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 shrink-0" />
                      ) : (
                        <Video className="h-4 w-4 shrink-0" />
                      )}
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Label>Uploading...</Label>
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground text-center">
                {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-success">
                <Check className="h-4 w-4" />
                Uploaded ({uploadedFiles.length})
              </Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {uploadedFiles.map((name, index) => (
                  <div
                    key={index}
                    className="text-sm text-muted-foreground p-2 rounded-lg bg-success/10"
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0 || !contributorName.trim()}
            className="w-full"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'File' : 'Files'}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
