import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  HardDrive, 
  Mic, 
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle,
  Server
} from 'lucide-react';
import { 
  usePipelineOverviewStats, 
  usePipelineStageStats, 
  useVendorStatus 
} from '@/hooks/useMediaPipelineData';
import { PipelineMetricsCards } from './PipelineMetricsCards';
import { FailedJobsTable } from './FailedJobsTable';

const stageIcons = {
  upload: HardDrive,
  virus_scan: CheckCircle,
  ocr: Activity,
  asr: Mic,
  index: Zap
};

const stageNames = {
  upload: 'Upload',
  virus_scan: 'Virus Scan',
  ocr: 'OCR',
  asr: 'Transcription',
  index: 'Indexing'
};

export function MediaPipelineMonitor() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  
  const { data: overviewStats, isLoading: overviewLoading } = usePipelineOverviewStats();
  const { data: stageStats, isLoading: stageLoading } = usePipelineStageStats();
  const { data: vendorStatus, isLoading: vendorLoading } = useVendorStatus();

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'outage': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'degraded': return AlertTriangle;
      case 'outage': return XCircle;
      default: return Server;
    }
  };

  if (overviewLoading || stageLoading || vendorLoading) {
    return <div className="p-6">Loading pipeline monitor...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Pipeline Monitor</h1>
          <p className="text-muted-foreground">
            Monitor ingestion, transcription, and OCR health across the pipeline
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            System Operational
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stages">Pipeline Stages</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Status</TabsTrigger>
          <TabsTrigger value="failures">Failed Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PipelineMetricsCards stats={overviewStats} />
          
          {/* Pipeline Flow Visualization */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Pipeline Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between space-x-4">
                {stageStats?.map((stage, index) => {
                  const Icon = stageIcons[stage.stage as keyof typeof stageIcons];
                  const isLast = index === stageStats.length - 1;
                  
                  return (
                    <div key={stage.stage} className="flex items-center">
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-3 rounded-full ${
                          stage.success_rate_24h >= 95 ? 'bg-green-100 text-green-600' :
                          stage.success_rate_24h >= 80 ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-sm">
                            {stageNames[stage.stage as keyof typeof stageNames]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Queue: {stage.queue_depth}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stage.success_rate_24h.toFixed(1)}% success
                          </p>
                        </div>
                      </div>
                      
                      {!isLast && (
                        <div className="flex-1 h-px bg-border mx-4 min-w-[40px]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stages">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stageStats?.map((stage) => {
              const Icon = stageIcons[stage.stage as keyof typeof stageIcons];
              
              return (
                <Card key={stage.stage}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stageNames[stage.stage as keyof typeof stageNames]}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Queue Depth</span>
                          <span className="font-mono">{stage.queue_depth}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Success Rate (24h)</span>
                          <span className="font-mono">{stage.success_rate_24h.toFixed(1)}%</span>
                        </div>
                        <Progress value={stage.success_rate_24h} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Avg Time</span>
                        <span className="font-mono">
                          {stage.avg_processing_time < 1000 
                            ? `${stage.avg_processing_time}ms`
                            : `${(stage.avg_processing_time / 1000).toFixed(1)}s`
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Cost (24h)</span>
                        <span className="font-mono text-green-600">
                          ${stage.total_cost_24h.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="vendors">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorStatus?.map((vendor) => {
              const HealthIcon = getHealthIcon(vendor.health_status);
              
              return (
                <Card key={vendor.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {vendor.vendor_name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">
                        {vendor.vendor_type.replace('_', ' ')}
                      </p>
                    </div>
                    <HealthIcon className={`h-4 w-4 ${getHealthColor(vendor.health_status)}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Status</span>
                        <Badge 
                          variant={vendor.health_status === 'healthy' ? 'default' : 'destructive'}
                          className={vendor.health_status === 'healthy' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {vendor.health_status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Error Rate (24h)</span>
                        <span className="font-mono">{vendor.error_rate_24h.toFixed(2)}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Avg Response</span>
                        <span className="font-mono">{vendor.avg_response_time_ms}ms</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Cost per {vendor.unit_type}</span>
                        <span className="font-mono text-green-600">
                          ${vendor.cost_per_unit.toFixed(6)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Last Check</span>
                        <span className="text-muted-foreground">
                          {new Date(vendor.last_health_check).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="failures">
          <FailedJobsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}