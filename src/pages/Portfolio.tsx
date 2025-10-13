import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, BookOpen } from 'lucide-react';
import PortfolioForm from '@/components/portfolio/PortfolioForm';
import PortfolioList from '@/components/portfolio/PortfolioList';
import PortfolioReportGenerator from '@/components/portfolio/PortfolioReportGenerator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Portfolio() {
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Parse search params for filtering
  const typeFilter = searchParams.get('type');
  const subjectFilter = searchParams.get('subject');

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: familyMembers } = useQuery<{
    familyId: string;
    people: Array<{ id: string; given_name: string; surname: string | null }>;
  }>({
    queryKey: ['family-members', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return { familyId: '', people: [] };

      const { data: members } = await supabase
        .from('members')
        .select(`
          family_id,
          families!inner(id, name),
          profiles!inner(id, full_name)
        `)
        .eq('profile_id', currentUser.id)
        .limit(1)
        .single();

      if (!members) return { familyId: '', people: [] };

      // Get all people in the family
      const { data: people } = await supabase
        .from('people' as any)
        .select('id, given_name, surname')
        .eq('family_id', members.family_id);

      return {
        familyId: members.family_id,
        people: (people as any[]) || []
      };
    },
    enabled: !!currentUser
  });

  // Apply URL filters
  const activeSubjectFilter = subjectFilter || selectedSubject;

  const selectedPerson = familyMembers?.people?.find(p => p.id === selectedPersonId);
  const personName = selectedPerson 
    ? `${selectedPerson.given_name} ${selectedPerson.surname || ''}`.trim()
    : '';

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Learning Portfolio
          </h1>
          <p className="text-muted-foreground mt-1">
            Document and track learning achievements
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={!selectedPersonId}>
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Person Selector */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
            <SelectTrigger>
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {familyMembers?.people?.map(person => (
                <SelectItem key={person.id} value={person.id}>
                  {person.given_name} {person.surname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={activeSubjectFilter} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All subjects</SelectItem>
              <SelectItem value="Math">Math</SelectItem>
              <SelectItem value="Science">Science</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="History">History</SelectItem>
              <SelectItem value="Geography">Geography</SelectItem>
              <SelectItem value="Art">Art</SelectItem>
              <SelectItem value="Music">Music</SelectItem>
              <SelectItem value="Physical Education">Physical Education</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Foreign Language">Foreign Language</SelectItem>
              <SelectItem value="Life Skills">Life Skills</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedPersonId && familyMembers?.familyId && (
        <Tabs defaultValue="entries" className="space-y-6">
          <TabsList>
            <TabsTrigger value="entries" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Portfolio Entries
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entries">
            <PortfolioList
              personId={selectedPersonId}
              familyId={familyMembers.familyId}
              subjectFilter={activeSubjectFilter}
            />
          </TabsContent>

          <TabsContent value="reports">
            <PortfolioReportGenerator
              personId={selectedPersonId}
              personName={personName}
              familyId={familyMembers.familyId}
            />
          </TabsContent>
        </Tabs>
      )}

      {!selectedPersonId && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Select a student to view their portfolio</p>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Portfolio Entry</DialogTitle>
            <DialogDescription>
              Document a learning achievement or project for {personName}
            </DialogDescription>
          </DialogHeader>
          {selectedPersonId && familyMembers?.familyId && (
            <PortfolioForm
              personId={selectedPersonId}
              familyId={familyMembers.familyId}
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
