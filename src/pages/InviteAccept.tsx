import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [linkInfo, setLinkInfo] = useState<{
    familyName: string;
    roleScope: string;
    expiresAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setIsValidating(false);
      return;
    }

    // We don't validate immediately, just show the accept screen
    setIsValidating(false);
  }, [token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const { data, error } = await supabase.functions.invoke('magic-link-validate', {
        body: { token },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to validate link');
      }

      // Store guest session in localStorage
      localStorage.setItem('guest_session', JSON.stringify({
        token: data.session.token,
        familyId: data.session.familyId,
        familyName: data.session.familyName,
        roleScope: data.session.roleScope,
        expiresAt: data.session.expiresAt,
      }));

      toast({
        title: "Access granted!",
        description: `You now have ${data.session.roleScope} access to ${data.session.familyName}`,
      });

      // Navigate to the family home
      navigate(`/family/${data.session.familyId}`);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'Failed to accept invitation');
      toast({
        title: "Failed to accept invitation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" data-test="invite-accept-page">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            Family Invitation
          </CardTitle>
          <CardDescription>
            You've been invited to access a family space
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>By accepting this invitation, you'll get guest access to view and interact with family content.</p>
          </div>
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full"
            data-test="accept-invite-button"
          >
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}