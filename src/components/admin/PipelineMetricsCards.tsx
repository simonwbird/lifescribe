import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  HardDrive, 
  Mic,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import type { PipelineOverviewStats } from '@/lib/mediaPipelineTypes';

interface PipelineMetricsCardsProps {
  stats?: PipelineOverviewStats;
}

export function PipelineMetricsCards({ stats }: PipelineMetricsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({length: 6}).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${(gb * 1024).toFixed(0)}MB`;
    return `${gb.toFixed(1)}GB`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {/* Queue Depth */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Queue Depth</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_queue_depth}</div>
          <p className="text-xs text-muted-foreground">
            Jobs in pipeline
          </p>
          {stats.total_queue_depth > 100 && (
            <Badge variant="outline" className="text-yellow-600 mt-2">
              <AlertTriangle className="w-3 h-3 mr-1" />
              High Queue
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Failures (24h) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failures (24h)</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.failures_24h}</div>
          <p className="text-xs text-muted-foreground">
            Failed jobs today
          </p>
          <div className="mt-2">
            {stats.failures_24h === 0 ? (
              <Badge className="bg-green-100 text-green-800">All Clear</Badge>
            ) : stats.failures_24h < 10 ? (
              <Badge variant="outline" className="text-yellow-600">Low Impact</Badge>
            ) : (
              <Badge variant="destructive">Needs Attention</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* P95 Processing Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">P95 Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(stats.p95_processing_time)}
          </div>
          <p className="text-xs text-muted-foreground">
            95th percentile
          </p>
          <div className="flex items-center mt-2">
            {stats.p95_processing_time < 30000 ? (
              <TrendingDown className="w-3 h-3 text-green-600 mr-1" />
            ) : (
              <TrendingUp className="w-3 h-3 text-red-600 mr-1" />
            )}
            <span className="text-xs text-muted-foreground">vs yesterday</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Cost (24h) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost (24h)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${stats.total_cost_24h.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total spend today
          </p>
          <div className="mt-2">
            <Progress value={Math.min((stats.total_cost_24h / 100) * 100, 100)} className="h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              Budget utilization
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Storage Used */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Storage</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatStorage(stats.storage_gb_used)}
          </div>
          <p className="text-xs text-muted-foreground">
            Media storage used
          </p>
          <div className="mt-2">
            <Progress value={Math.min((stats.storage_gb_used / 1000) * 100, 100)} className="h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              Storage utilization
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transcription Minutes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ASR Minutes</CardTitle>
          <Mic className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.transcription_minutes_24h}
          </div>
          <p className="text-xs text-muted-foreground">
            Transcribed today
          </p>
          <p className="text-xs text-green-600 mt-1">
            ≈ ${(stats.transcription_minutes_24h * 0.006).toFixed(2)} cost
          </p>
        </CardContent>
      </Card>
    </div>
  );
}