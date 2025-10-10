import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  Shield, 
  Mail, 
  Calendar, 
  User,
  FileText,
  RefreshCw 
} from 'lucide-react';

interface WaitlistEntry {
  id: string;
  email: string;
  role_intent: string;
  notes: string | null;
  status: string;
  created_at: string;
  user_id: string | null;
  family_id: string | null;
}

export default function AdminSafeBoxWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    contacted: 0,
    byRole: {
      owner: 0,
      executor: 0,
      guardian: 0,
      beneficiary: 0,
    },
  });

  useEffect(() => {
    loadWaitlist();
  }, []);

  const loadWaitlist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('safebox_waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEntries(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter(e => e.status === 'pending').length || 0;
      const contacted = data?.filter(e => e.status === 'contacted').length || 0;
      const byRole = {
        owner: data?.filter(e => e.role_intent === 'owner').length || 0,
        executor: data?.filter(e => e.role_intent === 'executor').length || 0,
        guardian: data?.filter(e => e.role_intent === 'guardian').length || 0,
        beneficiary: data?.filter(e => e.role_intent === 'beneficiary').length || 0,
      };

      setStats({ total, pending, contacted, byRole });
    } catch (error: any) {
      console.error('Error loading waitlist:', error);
      toast.error('Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('safebox_waitlist')
        .update({ 
          status: newStatus,
          contacted_at: newStatus === 'contacted' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Status updated to ${newStatus}`);
      loadWaitlist();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'contacted': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'approved': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Shield className="h-4 w-4" />;
      case 'executor': return <FileText className="h-4 w-4" />;
      case 'guardian': return <User className="h-4 w-4" />;
      case 'beneficiary': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SafeBox Waitlist</h1>
          <p className="text-muted-foreground">
            Manage early access requests for SafeBox
          </p>
        </div>
        <Button onClick={loadWaitlist} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Signups</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="text-3xl font-bold">{stats.contacted}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">By Role</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Owner</span>
                  <span className="font-medium">{stats.byRole.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span>Executor</span>
                  <span className="font-medium">{stats.byRole.executor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guardian</span>
                  <span className="font-medium">{stats.byRole.guardian}</span>
                </div>
                <div className="flex justify-between">
                  <span>Beneficiary</span>
                  <span className="font-medium">{stats.byRole.beneficiary}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waitlist Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Entries</CardTitle>
          <CardDescription>
            {entries.length} total entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No waitlist entries yet
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.email}</span>
                        {entry.user_id && (
                          <Badge variant="secondary" className="text-xs">
                            Registered User
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getRoleIcon(entry.role_intent)}
                        <span className="capitalize">{entry.role_intent}</span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(entry.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status}
                    </Badge>
                  </div>

                  {entry.notes && (
                    <div className="pl-6 text-sm text-muted-foreground border-l-2 border-muted">
                      {entry.notes}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {entry.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(entry.id, 'contacted')}
                        >
                          Mark as Contacted
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(entry.id, 'approved')}
                        >
                          Approve
                        </Button>
                      </>
                    )}
                    {entry.status === 'contacted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(entry.id, 'approved')}
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}