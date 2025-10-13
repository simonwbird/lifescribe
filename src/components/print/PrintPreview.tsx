import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PrintPage, PrintConfig, BookMetadata } from '@/lib/print/printTypes';
import { PrintPageComponent } from './PrintPage';
import { Download, Eye, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useToast } from '@/hooks/use-toast';

interface PrintPreviewProps {
  pages: PrintPage[];
  config: PrintConfig;
  metadata: BookMetadata;
  onBack: () => void;
}

export function PrintPreview({ pages, config, metadata, onBack }: PrintPreviewProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!printRef.current) return;

    setExporting(true);
    setProgress(0);

    try {
      const element = printRef.current;
      
      const opt = {
        margin: 0,
        filename: `${metadata.title.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: {
          unit: 'in' as const,
          format: config.options.pageSize,
          orientation: config.options.orientation,
        },
        pagebreak: { mode: 'css' as const, after: '.print-page' },
      };

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 200);

      await html2pdf().set(opt).from(element).save();

      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: 'PDF exported successfully!',
        description: `${metadata.pageCount} pages saved`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Preview & Export</span>
            <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
              <Eye className="h-4 w-4" />
              {metadata.pageCount} pages
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generating PDF...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={onBack} variant="outline" disabled={exporting}>
              Back
            </Button>
            <Button onClick={handleExportPDF} disabled={exporting} className="flex-1 gap-2">
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Print Preview */}
      <div className="bg-muted/30 p-8 rounded-lg">
        <div className="max-w-4xl mx-auto">
          <div ref={printRef} className="print-container bg-white shadow-lg">
            {/* Cover Page */}
            {config.options.includeTOC && (
              <div
                className="print-page bg-white flex items-center justify-center"
                style={{
                  width: config.options.pageSize === 'a4' ? '210mm' : '8.5in',
                  height: config.options.pageSize === 'a4' ? '297mm' : '11in',
                  pageBreakAfter: 'always',
                }}
              >
                <div className="text-center space-y-4">
                  <h1 className="text-5xl font-bold">{metadata.title}</h1>
                  {metadata.subtitle && (
                    <p className="text-xl text-muted-foreground">{metadata.subtitle}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(metadata.dateCreated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Content Pages */}
            {pages.map((page) => (
              <PrintPageComponent key={page.pageNumber} page={page} config={config} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .print-page {
            page-break-after: always;
          }
          @page {
            margin: 0;
            size: ${config.options.pageSize} ${config.options.orientation};
          }
        }
      `}</style>
    </div>
  );
}
