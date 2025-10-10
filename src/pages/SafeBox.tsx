import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Shield, 
  Lock, 
  Clock, 
  FileText, 
  Users, 
  Eye, 
  CheckCircle2,
  Sparkles 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEventTracking } from '@/hooks/useEventTracking';

export default function SafeBox() {
  const [email, setEmail] = useState('');
  const [roleIntent, setRoleIntent] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { trackCustomEvent } = useEventTracking();

  useEffect(() => {
    trackCustomEvent('safebox.view', {
      timestamp: new Date().toISOString(),
    });
  }, [trackCustomEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !roleIntent) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safebox-waitlist-join', {
        body: {
          email,
          roleIntent,
          notes,
        },
      });

      if (error) throw error;

      if (data?.alreadyJoined) {
        toast.info('You are already on the waitlist!');
      } else {
        toast.success('Successfully joined the SafeBox waitlist!');
        setSubmitted(true);

        trackCustomEvent('safebox.join_waitlist', {
          role_intent: roleIntent,
          has_notes: !!notes,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Error joining waitlist:', error);
      toast.error(error.message || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Coming Soon</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            SafeBox
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Secure storage for your most important documents, with time-locked access and trusted guardians
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2">
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Important Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Store wills, advance directives, property deeds, insurance policies, and final wishes in one secure location.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Trusted Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Assign executors, guardians, and beneficiaries with specific access permissions to your documents.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <Clock className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Time-Locked Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Set conditions for when documents become accessible, ensuring your wishes are honored.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Privacy & Security */}
        <Card className="mb-12">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle>Privacy & Security First</CardTitle>
            </div>
            <CardDescription>
              Your most sensitive documents deserve the highest level of protection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-medium mb-1">End-to-End Encryption</p>
                <p className="text-sm text-muted-foreground">
                  All documents are encrypted before leaving your device. Only you and your designated recipients can decrypt them.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-medium mb-1">Zero-Knowledge Architecture</p>
                <p className="text-sm text-muted-foreground">
                  We cannot read your documents. Not even our team has access to your encrypted data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-medium mb-1">Auditable Access</p>
                <p className="text-sm text-muted-foreground">
                  Every access attempt is logged and visible to you, with tamper-proof audit trails.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Waitlist Form */}
        {!submitted ? (
          <Card className="max-w-2xl mx-auto border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Join the Waitlist</CardTitle>
              <CardDescription>
                Be among the first to access SafeBox when it launches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">I'm interested as a... *</Label>
                  <Select value={roleIntent} onValueChange={setRoleIntent} required>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner (storing my documents)</SelectItem>
                      <SelectItem value="executor">Executor (managing someone's estate)</SelectItem>
                      <SelectItem value="guardian">Guardian (caring for dependents)</SelectItem>
                      <SelectItem value="beneficiary">Beneficiary (receiving inheritance)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Tell us about your specific needs or use case..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading ? 'Joining...' : 'Join Waitlist'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By joining, you'll be notified when SafeBox launches and may be invited to early access.
                </p>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto border-2 border-primary/20 text-center">
            <CardContent className="py-12">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
              <p className="text-muted-foreground mb-6">
                We'll notify you at <strong>{email}</strong> when SafeBox is ready.
              </p>
              <p className="text-sm text-muted-foreground">
                Keep an eye on your inbox for early access invitations and updates.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}