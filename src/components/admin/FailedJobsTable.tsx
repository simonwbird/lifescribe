import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  FileText, 
  Image, 
  Mic, 
  Video,
  Search,
  Filter
} from 'lucide-react';
import { useFailedJobs, useRetryJob, useDownloadRawOutput } from '@/hooks/useMediaPipelineData';
import { Textarea } from '@/components/ui/textarea';

const stageNames = {
  upload: 'Upload',
  virus_scan: 'Virus Scan',
  ocr: 'OCR',
  asr: 'Transcription',
  index: 'Indexing'
};

const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return FileText;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('audio/')) return Mic;
  if (mimeType.startsWith('video/')) return Video;
  return FileText;
};

export function FailedJobsTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [retryVendor, setRetryVendor] = useState<string>('');

  const { data: failedJobs = [], isLoading, refetch } = useFailedJobs();
  const retryMutation = useRetryJob();
  const downloadMutation = useDownloadRawOutput();

  const filteredJobs = failedJobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.media?.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.error_message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = !stageFilter || stageFilter === 'all' || job.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const handleRetry = async (jobId: string, switchVendor?: string) => {
    await retryMutation.mutateAsync({ jobId, switchVendor });
    setSelectedJob(null);
    setRetryVendor('');
  };

  const handleDownload = async (jobId: string) => {
    await downloadMutation.mutateAsync(jobId);
  };

  if (isLoading) {
    return <div className="p-6">Loading failed jobs...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Failed Jobs</CardTitle>
              <p className="text-sm text-muted-foreground">
                Jobs that failed processing and require attention
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by filename or error..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="virus_scan">Virus Scan</SelectItem>
                <SelectItem value="ocr">OCR</SelectItem>
                <SelectItem value="asr">Transcription</SelectItem>
                <SelectItem value="index">Indexing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Failed At</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {failedJobs.length === 0 
                            ? "No failed jobs found - system running smoothly!"
                            : "No jobs match your filter criteria"
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => {
                    const FileIcon = getFileIcon(job.media?.mime_type);
                    
                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileIcon className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">
                                {job.media?.file_name || 'Unknown file'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {job.media?.mime_type} • {((job.media?.file_size || 0) / 1024).toFixed(1)}KB
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline">
                            {stageNames[job.stage as keyof typeof stageNames]}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-red-600 truncate">
                              {job.error_message || 'Unknown error'}
                            </p>
                            {job.vendor_used && (
                              <p className="text-xs text-muted-foreground">
                                Vendor: {job.vendor_used}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={job.retry_count > 2 ? 'destructive' : 'secondary'}>
                            {job.retry_count}/3
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <p className="text-sm">
                            {new Date(job.updated_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.updated_at).toLocaleTimeString()}
                          </p>
                        </TableCell>
                        
                        <TableCell>
                          <p className="text-sm font-mono text-green-600">
                            ${job.cost_usd.toFixed(4)}
                          </p>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(job.id)}
                              disabled={downloadMutation.isPending}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={job.retry_count >= 3}
                                  onClick={() => setSelectedJob(job.id)}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Retry Failed Job</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      File: {job.media?.file_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Stage: {stageNames[job.stage as keyof typeof stageNames]}
                                    </p>
                                    <p className="text-sm text-red-600">
                                      Error: {job.error_message}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">
                                      Switch Vendor (Optional)
                                    </label>
                                    <Input
                                      placeholder="e.g., AssemblyAI, OpenAI Whisper"
                                      value={retryVendor}
                                      onChange={(e) => setRetryVendor(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleRetry(job.id, retryVendor || undefined)}
                                      disabled={retryMutation.isPending}
                                    >
                                      Retry Job
                                    </Button>
                                    <Button variant="outline" onClick={() => setSelectedJob(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}