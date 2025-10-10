import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

interface MagicLink {
  id: string;
  token: string;
  role_scope: string;
  created_at: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
  last_used_at: string | null;
  revoked: boolean;
}

interface MagicLinkManagerProps {
  familyId: string;
  refreshTrigger?: number;
}

export function MagicLinkManager({ familyId, refreshTrigger }: MagicLinkManagerProps) {
  const [links, setLinks] = useState<MagicLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('magic_links')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching magic links:', error);
      toast({
        title: "Failed to load links",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [familyId, refreshTrigger]);

  const handleRevoke = async (linkId: string) => {
    try {
      const { error } = await supabase.functions.invoke('magic-link-revoke', {
        body: { linkId },
      });

      if (error) throw error;

      toast({
        title: "Link revoked",
        description: "The magic link has been revoked and is no longer valid.",
      });
      fetchLinks();
    } catch (error) {
      console.error('Error revoking link:', error);
      toast({
        title: "Failed to revoke link",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading links...</div>;
  }

  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No magic links created yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-test="magic-link-manager">
      <CardHeader>
        <CardTitle>Active Magic Links</CardTitle>
        <CardDescription>
          Manage your shared access links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {links.map((link) => {
          const isExpired = new Date(link.expires_at) < new Date();
          const isMaxedOut = link.current_uses >= link.max_uses;
          const isInactive = link.revoked || isExpired || isMaxedOut;

          return (
            <div
              key={link.id}
              className="border rounded-lg p-4 space-y-2"
              data-test={`magic-link-${link.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={isInactive ? "secondary" : "default"}>
                      {link.role_scope}
                    </Badge>
                    {link.revoked && <Badge variant="destructive">Revoked</Badge>}
                    {isExpired && !link.revoked && <Badge variant="secondary">Expired</Badge>}
                    {isMaxedOut && !link.revoked && <Badge variant="secondary">Max Uses</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Uses: {link.current_uses} / {link.max_uses}</p>
                    <p>Created: {format(new Date(link.created_at), 'MMM d, yyyy')}</p>
                    <p>Expires: {format(new Date(link.expires_at), 'MMM d, yyyy')}</p>
                    {link.last_used_at && (
                      <p>Last used: {format(new Date(link.last_used_at), 'MMM d, yyyy HH:mm')}</p>
                    )}
                  </div>
                </div>
                {!link.revoked && !isExpired && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRevoke(link.id)}
                    data-test={`revoke-link-${link.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}