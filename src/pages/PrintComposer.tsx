import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { PrintScopeSelect } from '@/components/print/PrintScopeSelect';
import { PrintLayoutSelect } from '@/components/print/PrintLayoutSelect';
import { PrintPreview } from '@/components/print/PrintPreview';
import { PrintConfig, PrintPage, BookMetadata, PrintContent } from '@/lib/print/printTypes';
import { fetchPrintData } from '@/lib/print/printData';
import { paginateContent } from '@/lib/print/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const defaultConfig: PrintConfig = {
  scope: 'person',
  layout: 'yearbook',
  options: {
    includeTOC: true,
    includePageNumbers: true,
    pageSize: 'letter',
    orientation: 'portrait',
    margins: {
      top: 15,
      right: 15,
      bottom: 15,
      left: 15,
      bleed: 3,
    },
  },
};

export default function PrintComposer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<'scope' | 'layout' | 'preview'>('scope');
  const [config, setConfig] = useState<PrintConfig>(defaultConfig);
  const [pages, setPages] = useState<PrintPage[]>([]);
  const [metadata, setMetadata] = useState<BookMetadata>({
    title: 'My Family Book',
    author: '',
    dateCreated: new Date().toISOString(),
    pageCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (step === 'scope') {
      setStep('layout');
    } else if (step === 'layout') {
      await generatePreview();
    }
  };

  const generatePreview = async () => {
    setLoading(true);
    try {
      const startTime = performance.now();
      
      // Fetch data
      const rawData: any = await fetchPrintData(config);
      
      // Convert to print content
      const content: PrintContent[] = [];
      
      // Handle stories from any source
      const stories = rawData.stories || [];
      stories.forEach((story: any) => {
        content.push({
          type: 'story',
          data: {
            title: story.title || 'Untitled',
            content: story.content || '',
            date: story.occurred_at || story.created_at,
          },
        });
      });
      
      // Handle media from any source
      const media = rawData.media || rawData.uploads || [];
      media.forEach((item: any) => {
        content.push({
          type: 'photo',
          data: {
            url: item.url || item.file_path || '',
            caption: item.caption || item.file_name || '',
          },
        });
      });

      // Paginate
      const paginatedPages = paginateContent(
        content,
        config.layout,
        { width: 8.5, height: 11 }
      );

      setPages(paginatedPages);
      setMetadata((prev) => ({
        ...prev,
        pageCount: paginatedPages.length,
      }));

      const endTime = performance.now();
      const renderTime = (endTime - startTime) / 1000;

      console.log(`Rendered ${paginatedPages.length} pages in ${renderTime.toFixed(2)}s`);

      if (renderTime > 20) {
        toast({
          title: 'Performance Warning',
          description: `Rendering took ${renderTime.toFixed(1)}s. Consider reducing scope.`,
          variant: 'destructive',
        });
      }

      setStep('preview');
    } catch (error) {
      console.error('Preview generation error:', error);
      toast({
        title: 'Preview failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-64 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {step === 'scope' && (
          <PrintScopeSelect
            config={config}
            onConfigChange={setConfig}
            onNext={handleNext}
          />
        )}

        {step === 'layout' && (
          <PrintLayoutSelect
            config={config}
            onConfigChange={setConfig}
            onNext={handleNext}
            onBack={() => setStep('scope')}
          />
        )}

        {step === 'preview' && (
          <PrintPreview
            pages={pages}
            config={config}
            metadata={metadata}
            onBack={() => setStep('layout')}
          />
        )}
      </div>
    </div>
  );
}
