import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AITask {
  id: string;
  bug_report_id: string;
  status: 'pending' | 'submitted' | 'completed' | 'failed';
  loveable_task_id?: string;
  loveable_response?: any;
  result_type?: 'pr' | 'patch';
  github_pr_url?: string;
  inline_patch?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export const useAITaskPolling = (bugReportId: string, enabled: boolean = true) => {
  const [aiTasks, setAiTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationRef = useRef<Set<string>>(new Set());

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_tasks')
        .select('*')
        .eq('bug_report_id', bugReportId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasks = (data || []) as AITask[];
      
      // Check for newly completed tasks to show notifications
      tasks.forEach(task => {
        if (
          task.status === 'completed' && 
          !lastNotificationRef.current.has(task.id)
        ) {
          lastNotificationRef.current.add(task.id);
          
          if (task.result_type === 'pr') {
            toast({
              title: "🎉 Loveable fix complete!",
              description: `GitHub PR created: ${task.loveable_response?.title || 'Fix ready for review'}`,
            });
          } else if (task.result_type === 'patch') {
            toast({
              title: "🎉 Loveable fix complete!",
              description: "Inline patch generated and ready to apply",
            });
          }
        } else if (
          task.status === 'failed' && 
          !lastNotificationRef.current.has(task.id)
        ) {
          lastNotificationRef.current.add(task.id);
          toast({
            title: "Loveable task failed",
            description: task.error_message || "The AI task encountered an error",
            variant: "destructive"
          });
        }
      });
      
      setAiTasks(tasks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching AI tasks:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchTasks();

    // Set up polling for active tasks
    const hasActiveTasks = () => aiTasks.some(task => 
      task.status === 'pending' || task.status === 'submitted'
    );

    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        fetchTasks();
      }, 10000); // Poll every 10 seconds
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Start polling if there are active tasks
    if (hasActiveTasks()) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [bugReportId, enabled, aiTasks]);

  // Set up real-time subscription for task updates
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`ai_tasks_${bugReportId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_tasks',
          filter: `bug_report_id=eq.${bugReportId}`,
        },
        (payload) => {
          console.log('AI task update:', payload);
          fetchTasks(); // Refetch when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bugReportId, enabled]);

  return {
    aiTasks,
    loading,
    refetch: fetchTasks,
    hasActiveTasks: aiTasks.some(task => 
      task.status === 'pending' || task.status === 'submitted'
    ),
    completedTasks: aiTasks.filter(task => task.status === 'completed'),
    failedTasks: aiTasks.filter(task => task.status === 'failed')
  };
};