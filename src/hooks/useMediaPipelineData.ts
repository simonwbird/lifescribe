import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from './useAnalytics';
import { toast } from '@/components/ui/use-toast';
import type { 
  MediaPipelineJob, 
  MediaPipelineMetrics,
  MediaVendorStatus,
  PipelineOverviewStats,
  PipelineStageStats,
  MediaPipelineStage
} from '@/lib/mediaPipelineTypes';

export const useMediaPipelineJobs = (filters?: { status?: string; stage?: string }) => {
  return useQuery({
    queryKey: ['media-pipeline-jobs', filters],
    queryFn: async () => {
      let query = supabase
        .from('media_pipeline_jobs')
        .select(`
          *,
          media:media(file_name, mime_type, file_size)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.status) {
        query = query.eq('status', filters.status as any);
      }
      if (filters?.stage) {
        query = query.eq('stage', filters.stage as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as any[]).map(item => ({
        ...item,
        media: item.media || null
      })) as MediaPipelineJob[];
    },
  });
};

export const useFailedJobs = () => {
  return useQuery({
    queryKey: ['failed-media-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_pipeline_jobs')
        .select(`
          *,
          media:media(file_name, mime_type, file_size)
        `)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data as any[]).map(item => ({
        ...item,
        media: item.media || null
      })) as MediaPipelineJob[];
    },
  });
};

export const usePipelineOverviewStats = () => {
  return useQuery({
    queryKey: ['pipeline-overview-stats'],
    queryFn: async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString();

      // Get queue depth (pending + in_progress jobs)
      const { data: queueData } = await supabase
        .from('media_pipeline_jobs')
        .select('id')
        .in('status', ['pending', 'in_progress']);

      // Get failures in last 24h
      const { data: failuresData } = await supabase
        .from('media_pipeline_jobs')
        .select('id')
        .eq('status', 'failed')
        .gte('created_at', yesterdayStr);

      // Get costs and processing time from metrics
      const { data: metricsData } = await supabase
        .from('media_pipeline_metrics')
        .select('total_cost_usd, p95_processing_time_ms')
        .gte('date', yesterday.toISOString().split('T')[0]);

      // Get storage usage (approximate from media table)
      const { data: storageData } = await supabase
        .from('media')
        .select('file_size');

      const totalStorageBytes = storageData?.reduce((sum, item) => sum + (item.file_size || 0), 0) || 0;
      const totalCost24h = metricsData?.reduce((sum, item) => sum + (parseFloat(item.total_cost_usd.toString()) || 0), 0) || 0;
      const p95Time = metricsData?.reduce((max, item) => Math.max(max, item.p95_processing_time_ms || 0), 0) || 0;

      return {
        total_queue_depth: queueData?.length || 0,
        failures_24h: failuresData?.length || 0,
        total_cost_24h: totalCost24h,
        p95_processing_time: p95Time,
        storage_gb_used: totalStorageBytes / (1024 * 1024 * 1024),
        transcription_minutes_24h: 0 // Would need to calculate from actual job data
      } as PipelineOverviewStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const usePipelineStageStats = () => {
  return useQuery({
    queryKey: ['pipeline-stage-stats'],
    queryFn: async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString();

      const stages: Array<{ stage: string; queue_depth: number; success_rate_24h: number; avg_processing_time: number; total_cost_24h: number }> = [];

      const stageNames: MediaPipelineStage[] = ['upload', 'virus_scan', 'ocr', 'asr', 'index'];

      for (const stage of stageNames) {
        // Get queue depth for this stage
        const { data: queueData } = await supabase
          .from('media_pipeline_jobs')
          .select('id')
          .eq('stage', stage)
          .in('status', ['pending', 'in_progress']);

        // Get success rate for last 24h
        const { data: allJobsData } = await supabase
          .from('media_pipeline_jobs')
          .select('status')
          .eq('stage', stage)
          .gte('created_at', yesterdayStr);

        const successfulJobs = allJobsData?.filter(job => job.status === 'completed').length || 0;
        const totalJobs = allJobsData?.length || 0;
        const successRate = totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0;

        // Get metrics from aggregated table
        const { data: metricsData } = await supabase
          .from('media_pipeline_metrics')
          .select('avg_processing_time_ms, total_cost_usd')
          .eq('stage', stage)
          .gte('date', yesterday.toISOString().split('T')[0])
          .maybeSingle();

        stages.push({
          stage,
          queue_depth: queueData?.length || 0,
          success_rate_24h: successRate,
          avg_processing_time: metricsData?.avg_processing_time_ms || 0,
          total_cost_24h: parseFloat(metricsData?.total_cost_usd?.toString() || '0')
        });
      }

      return stages as PipelineStageStats[];
    },
    refetchInterval: 30000,
  });
};

export const useVendorStatus = () => {
  return useQuery({
    queryKey: ['vendor-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_vendor_status')
        .select('*')
        .order('vendor_type')
        .order('vendor_name');

      if (error) throw error;
      return data as MediaVendorStatus[];
    },
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useRetryJob = () => {
  const queryClient = useQueryClient();
  const { track } = useAnalytics();

  return useMutation({
    mutationFn: async ({ 
      jobId, 
      switchVendor 
    }: { 
      jobId: string; 
      switchVendor?: string;
    }) => {
      // Get current job details
      const { data: job, error: jobError } = await supabase
        .from('media_pipeline_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Update job status and retry count
      const updates: any = {
        status: 'pending',
        retry_count: (job.retry_count || 0) + 1,
        error_message: null,
        error_details: {},
        started_at: null,
        completed_at: null
      };

      if (switchVendor) {
        updates.vendor_used = switchVendor;
      }

      const { data, error } = await supabase
        .from('media_pipeline_jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['media-pipeline-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['failed-media-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-stage-stats'] });
      
      track('MEDIA_JOB_RETRIED', {
        job_id: variables.jobId,
        vendor_switched: !!variables.switchVendor,
        new_vendor: variables.switchVendor
      });

      if (variables.switchVendor) {
        track('MEDIA_VENDOR_SWITCHED', {
          job_id: variables.jobId,
          new_vendor: variables.switchVendor
        });
      }

      toast({
        title: 'Job Retried',
        description: 'The failed job has been queued for retry.'
      });
    },
    onError: (error) => {
      console.error('Job retry failed:', error);
      toast({
        title: 'Retry Failed',
        description: 'Failed to retry the job. Please try again.',
        variant: 'destructive'
      });
    }
  });
};

export const useDownloadRawOutput = () => {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data: job, error } = await supabase
        .from('media_pipeline_jobs')
        .select('raw_output, stage, media_id')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      // Create a blob with the raw output data
      const blob = new Blob([JSON.stringify(job.raw_output, null, 2)], {
        type: 'application/json'
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raw-output-${job.stage}-${job.media_id}-${jobId.slice(0, 8)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return job;
    },
    onSuccess: () => {
      toast({
        title: 'Download Started',
        description: 'Raw output data is being downloaded.'
      });
    },
    onError: (error) => {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download raw output. Please try again.',
        variant: 'destructive'
      });
    }
  });
};