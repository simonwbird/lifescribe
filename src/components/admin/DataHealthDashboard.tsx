import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDataHealth } from '@/hooks/useDataHealth';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  FileQuestion, 
  Users, 
  ImageOff, 
  XCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/lib/routes';

interface DataHealthDashboardProps {
  familyId: string;
}

interface HealthMetric {
  label: string;
  count: number;
  icon: any;
  color: string;
  route: string;
  description: string;
}

export function DataHealthDashboard({ familyId }: DataHealthDashboardProps) {
  const { data: health, isLoading } = useDataHealth(familyId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Data Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!health) return null;

  const totalIssues = 
    health.uncitedStories + 
    health.duplicates + 
    health.orphanMedia + 
    health.failedImports + 
    health.untaggedFaces;

  const metrics: HealthMetric[] = [
    {
      label: 'Orphan Media',
      count: health.orphanMedia,
      icon: ImageOff,
      color: 'text-destructive',
      route: routes.searchOrphan(),
      description: 'Media without context',
    },
    {
      label: 'Untagged Faces',
      count: health.untaggedFaces,
      icon: Users,
      color: 'text-warning',
      route: routes.searchUntaggedFaces(),
      description: 'Photos with unidentified people',
    },
    {
      label: 'Duplicates',
      count: health.duplicates,
      icon: Users,
      color: 'text-warning',
      route: routes.adminMergePeople(),
      description: 'Potential duplicate people',
    },
  ];

  // Add header button for overall data health
  const handleViewAll = () => {
    navigate(routes.adminDataHealth());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <button
            onClick={handleViewAll}
            className="text-left hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary rounded"
            aria-label="View full data health dashboard"
          >
            <CardTitle className="text-sm flex items-center gap-2">
              {totalIssues === 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Data Health
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Data Health
                </>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              {totalIssues === 0 
                ? 'All looking good!' 
                : `${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} to review`
              }
            </CardDescription>
          </button>
          {totalIssues > 0 && (
            <Badge variant="outline" className="text-warning border-warning">
              {totalIssues}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          
          if (metric.count === 0) return null;

          return (
            <button
              key={metric.label}
              onClick={() => navigate(metric.route)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon className={`h-4 w-4 ${metric.color} shrink-0`} />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium text-sm">{metric.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {metric.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary">{metric.count}</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </button>
          );
        })}

        {totalIssues === 0 && (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Your data is in great shape!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
