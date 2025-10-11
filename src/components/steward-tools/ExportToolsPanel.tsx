import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileText, Printer } from 'lucide-react';

interface ExportToolsPanelProps {
  personId: string;
  personName: string;
}

export function ExportToolsPanel({ personId, personName }: ExportToolsPanelProps) {
  const handleExportJSON = () => {
    // TODO: Implement JSON export
    console.log('Export as JSON');
  };

  const handleExportText = () => {
    // TODO: Implement text export
    console.log('Export as text');
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Export as PDF');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Export Page Content</CardTitle>
          <CardDescription>
            Download {personName}'s page in various formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleExportJSON}
          >
            <FileJson className="h-4 w-4 mr-2" />
            Export as JSON (Full Data)
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleExportText}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as Text (Stories & Bio)
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleExportPDF}
          >
            <Printer className="h-4 w-4 mr-2" />
            Export as PDF (Print Ready)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup & Archive</CardTitle>
          <CardDescription>
            Create a complete backup for safekeeping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="default" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Create Full Backup
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Includes all content, images, and metadata
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
