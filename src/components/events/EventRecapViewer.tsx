import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Calendar, Users, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EventRecapViewerProps {
  eventId: string;
  onClose?: () => void;
}

export function EventRecapViewer({ eventId, onClose }: EventRecapViewerProps) {
  const [loading, setLoading] = useState(true);
  const [recap, setRecap] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadRecap();
  }, [eventId]);

  const loadRecap = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_recaps')
        .select('*, life_events(title, event_date, event_type)')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setRecap(data);
    } catch (error: any) {
      console.error('Error loading recap:', error);
      toast.error('Failed to load recap');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecap = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-event-recap', {
        body: { eventId },
      });

      if (error) throw error;

      toast.success('Recap generated successfully!');
      await loadRecap();
    } catch (error: any) {
      console.error('Error generating recap:', error);
      toast.error(error.message || 'Failed to generate recap');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!recap) return;

    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-event-pdf', {
        body: { recapId: recap.id },
      });

      if (error) throw error;

      // In production, this would trigger a PDF download
      toast.success('PDF export started!');
      console.log('PDF HTML:', data.htmlContent);
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast.error(error.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!recap) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Recap</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No recap available yet. Generate one to see all the highlights!
          </p>
          <Button onClick={handleGenerateRecap} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Recap'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const content = recap.content || {};
  const stats = content.stats || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{recap.title}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalPhotos || 0}</div>
              <div className="text-sm text-muted-foreground">Photos</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalGuests || 0}</div>
              <div className="text-sm text-muted-foreground">Contributors</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalNotes || 0}</div>
              <div className="text-sm text-muted-foreground">Messages</div>
            </div>
          </div>

          {/* Memorable Quotes */}
          {content.quotes && content.quotes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Memorable Quotes</h3>
              <div className="space-y-3">
                {content.quotes.slice(0, 5).map((quote: any, idx: number) => (
                  <div
                    key={idx}
                    className="border-l-4 border-primary pl-4 py-2 italic"
                  >
                    <p className="text-foreground">"{quote.text}"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      - {quote.author}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Preview */}
          {content.timeline && content.timeline.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Event Timeline</h3>
              <div className="space-y-2">
                {content.timeline.slice(0, 5).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 text-sm border-l-2 border-muted pl-3 py-1"
                  >
                    <span className="text-muted-foreground">
                      {new Date(item.time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}