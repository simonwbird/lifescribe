import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import VaultDashboard from '@/components/vault/VaultDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Vault() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFamilyId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single();

      if (data) {
        setFamilyId(data.family_id);
      }
      setLoading(false);
    };

    fetchFamilyId();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!familyId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">No Family Found</h2>
          <p className="text-muted-foreground">
            You need to be part of a family to access the vault.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <VaultDashboard familyId={familyId} />
    </div>
  );
}
