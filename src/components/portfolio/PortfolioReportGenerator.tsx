import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Printer, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const subjects = [
  'Math', 'Science', 'English', 'History', 'Geography',
  'Art', 'Music', 'Physical Education', 'Technology',
  'Foreign Language', 'Life Skills', 'Other'
];

interface PortfolioReportGeneratorProps {
  personId: string;
  personName: string;
  familyId: string;
}

export default function PortfolioReportGenerator({ 
  personId, 
  personName, 
  familyId 
}: PortfolioReportGeneratorProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const { toast } = useToast();

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) {
        throw new Error('Please select start and end dates');
      }

      const { data, error } = await supabase.rpc('generate_portfolio_report' as any, {
        p_family_id: familyId,
        p_person_id: personId,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd'),
        p_subjects: selectedSubjects.length > 0 ? selectedSubjects : null
      } as any);

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setReportData(data);
      toast({
        title: 'Report generated',
        description: 'Portfolio report is ready to view and print.'
      });
    },
    onError: (error) => {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Could not generate report.',
        variant: 'destructive'
      });
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Generate Term Report</CardTitle>
          <CardDescription>
            Create a printable portfolio report for {personName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span>Pick end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date > new Date() || (startDate && date < startDate)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Filter by Subjects (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {subjects.map(subject => (
                <Badge
                  key={subject}
                  variant={selectedSubjects.includes(subject) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleSubject(subject)}
                >
                  {subject}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={() => generateReportMutation.mutate()}
            disabled={!startDate || !endDate || generateReportMutation.isPending}
            className="w-full"
          >
            <FileText className="mr-2 h-4 w-4" />
            {generateReportMutation.isPending ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
        <>
          <div className="print:hidden flex gap-2">
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>

          {/* Printable Report */}
          <div className="print:block">
            <Card className="border-2">
              <CardHeader className="text-center border-b">
                <CardTitle className="text-2xl">Portfolio Term Report</CardTitle>
                <CardDescription className="text-lg">{personName}</CardDescription>
                <p className="text-sm text-muted-foreground">
                  {format(startDate!, 'MMMM d, yyyy')} - {format(endDate!, 'MMMM d, yyyy')}
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{reportData.total_items}</div>
                    <div className="text-sm text-muted-foreground">Total Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{reportData.skills_count}</div>
                    <div className="text-sm text-muted-foreground">Skills Covered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {Object.keys(reportData.subject_breakdown || {}).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Subjects</div>
                  </div>
                </div>

                {/* Subject Breakdown */}
                {reportData.subject_breakdown && Object.keys(reportData.subject_breakdown).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Subject Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(reportData.subject_breakdown).map(([subject, data]: [string, any]) => (
                        <div key={subject} className="flex items-center justify-between p-3 border rounded">
                          <div className="space-y-1">
                            <div className="font-medium">{subject}</div>
                            <div className="text-xs text-muted-foreground">
                              {data.skills.length} skills: {data.skills.join(', ')}
                            </div>
                          </div>
                          <Badge variant="secondary">{data.count} entries</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Summary */}
                {reportData.skills_covered && reportData.skills_covered.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Skills Demonstrated</h3>
                    <div className="flex flex-wrap gap-2">
                      {reportData.skills_covered.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {reportData.highlights && reportData.highlights.length > 0 && (
                  <div className="space-y-3 page-break-before">
                    <h3 className="text-lg font-semibold">Notable Achievements</h3>
                    <div className="space-y-3">
                      {reportData.highlights.map((highlight: any) => (
                        <Card key={highlight.id} className="border-amber-500/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="text-amber-500">★</span>
                              {highlight.title}
                            </CardTitle>
                            <CardDescription>
                              {highlight.subject} - {format(new Date(highlight.completed_at), 'MMMM d, yyyy')}
                            </CardDescription>
                          </CardHeader>
                          {highlight.description && (
                            <CardContent>
                              <p className="text-sm">{highlight.description}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
