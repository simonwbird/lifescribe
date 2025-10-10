import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Link2 } from "lucide-react";

interface MagicLinkCreatorProps {
  familyId: string;
  onLinkCreated?: () => void;
}

export function MagicLinkCreator({ familyId, onLinkCreated }: MagicLinkCreatorProps) {
  const [roleScope, setRoleScope] = useState<'read-only' | 'read-react' | 'read-comment'>('read-only');
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCreateLink = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('magic-link-create', {
        body: {
          familyId,
          roleScope,
          maxUses,
          expiresInDays,
        },
      });

      if (error) throw error;

      setGeneratedLink(data.joinUrl);
      toast({
        title: "Magic link created",
        description: "Share this link to grant access to your family space.",
      });
      onLinkCreated?.();
    } catch (error) {
      console.error('Error creating magic link:', error);
      toast({
        title: "Failed to create link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast({
      title: "Link copied",
      description: "Magic link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGeneratedLink(null);
    setCopied(false);
  };

  if (generatedLink) {
    return (
      <Card data-test="magic-link-created">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Magic Link Created
          </CardTitle>
          <CardDescription>
            Share this link to grant {roleScope} access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              readOnly
              value={generatedLink}
              className="font-mono text-sm"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="icon"
              data-test="copy-magic-link"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Maximum uses: {maxUses}</p>
            <p>• Expires in: {expiresInDays} days</p>
            <p>• Access level: {roleScope}</p>
          </div>
          <Button onClick={handleReset} variant="outline" className="w-full">
            Create Another Link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-test="magic-link-creator">
      <CardHeader>
        <CardTitle>Create Magic Link</CardTitle>
        <CardDescription>
          Generate a shareable link for guest access to your family space
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role-scope">Access Level</Label>
          <Select value={roleScope} onValueChange={(value: any) => setRoleScope(value)}>
            <SelectTrigger id="role-scope" data-test="role-scope-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read-only">Read Only - Can view content</SelectItem>
              <SelectItem value="read-react">Read & React - Can view and add reactions</SelectItem>
              <SelectItem value="read-comment">Read & Comment - Can view and comment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-uses">Maximum Uses</Label>
          <Input
            id="max-uses"
            type="number"
            min={1}
            max={10}
            value={maxUses}
            onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
            data-test="max-uses-input"
          />
          <p className="text-xs text-muted-foreground">
            How many times this link can be used (1-10)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expires-in">Expires In (days)</Label>
          <Input
            id="expires-in"
            type="number"
            min={1}
            max={30}
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
            data-test="expires-input"
          />
          <p className="text-xs text-muted-foreground">
            Link will expire after this many days
          </p>
        </div>

        <Button
          onClick={handleCreateLink}
          disabled={isCreating}
          className="w-full"
          data-test="create-magic-link"
        >
          {isCreating ? "Creating..." : "Create Magic Link"}
        </Button>
      </CardContent>
    </Card>
  );
}