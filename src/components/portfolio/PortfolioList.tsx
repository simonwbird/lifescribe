import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PortfolioListProps {
  personId: string;
  familyId: string;
  subjectFilter?: string;
}

export default function PortfolioList({ personId, familyId, subjectFilter }: PortfolioListProps) {
  const { data: portfolios, isLoading } = useQuery({
    queryKey: ['portfolios', familyId, personId, subjectFilter],
    queryFn: async () => {
      let query = supabase
        .from('portfolios' as any)
        .select('*')
        .eq('family_id', familyId)
        .eq('person_id', personId)
        .order('completed_at', { ascending: false });

      if (subjectFilter) {
        query = query.eq('subject', subjectFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as any[];
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!portfolios || portfolios.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {subjectFilter 
              ? `No portfolio entries found for ${subjectFilter}`
              : 'No portfolio entries yet. Create your first learning artifact!'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {portfolios.map((portfolio) => (
        <Card key={portfolio.id} className={cn(
          "transition-all hover:shadow-md",
          portfolio.is_highlight && "border-amber-500/50 bg-amber-50/5"
        )}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="flex items-center gap-2">
                  {portfolio.is_highlight && (
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  )}
                  {portfolio.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(portfolio.completed_at), 'MMMM d, yyyy')}
                </CardDescription>
              </div>
              <Badge variant="secondary">{portfolio.subject}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {portfolio.description && (
              <p className="text-sm text-muted-foreground">
                {portfolio.description}
              </p>
            )}

            {portfolio.skills && portfolio.skills.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Skills Demonstrated:</p>
                <div className="flex flex-wrap gap-1">
                  {portfolio.skills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {portfolio.learning_objectives && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Learning Objectives:</p>
                <p className="text-sm">{portfolio.learning_objectives}</p>
              </div>
            )}

            {portfolio.reflection && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Reflection:</p>
                <p className="text-sm italic">{portfolio.reflection}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
