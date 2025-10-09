import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserAge() {
  return useQuery({
    queryKey: ['user-age'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single();

      if (!profile?.settings) return null;

      const settings = profile.settings as any;
      const birthDate = settings?.birth_date as string | undefined;
      if (!birthDate) return null;

      const birth = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1;
      }

      return age;
    },
  });
}

export function useIsUnder13() {
  const { data: age } = useUserAge();
  return age !== null && age < 13;
}
