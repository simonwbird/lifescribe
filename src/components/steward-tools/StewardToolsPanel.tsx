import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  MessageSquare, 
  GitMerge, 
  FileText, 
  Download,
  Clock
} from 'lucide-react';
import { GuestbookModerationQueue } from '@/components/guestbook';
import { ChangeSuggestionsPanel } from './ChangeSuggestionsPanel';
import { DuplicateMergePanel } from './DuplicateMergePanel';
import { AuditLogPanel } from './AuditLogPanel';
import { ExportToolsPanel } from './ExportToolsPanel';
import { useChangeSuggestions } from '@/hooks/useChangeSuggestions';
import { useGuestbookModerationQueue } from '@/hooks/useGuestbookModeration';
import { cn } from '@/lib/utils';

interface StewardToolsPanelProps {
  personId: string;
  familyId: string;
  personName: string;
  onClose?: () => void;
}

export function StewardToolsPanel({ personId, familyId, personName, onClose }: StewardToolsPanelProps) {
  const [activeTab, setActiveTab] = useState('approvals');

  // Get counts for badges
  const { data: suggestions = [] } = useChangeSuggestions(personId);
  const { data: moderationQueue = [] } = useGuestbookModerationQueue(familyId);

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending').length;
  const pendingModeration = moderationQueue.length;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-6 bg-muted/50">
        <h2 className="text-2xl font-bold mb-2">Steward Tools</h2>
        <p className="text-sm text-muted-foreground">
          Manage content, approvals, and maintain {personName}'s page
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5 m-6 mb-0">
          <TabsTrigger value="approvals" className="relative">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Approvals</span>
            {(pendingSuggestions + pendingModeration) > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {pendingSuggestions + pendingModeration}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="guestbook">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Guestbook</span>
            {pendingModeration > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingModeration}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="duplicates">
            <GitMerge className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Duplicates</span>
          </TabsTrigger>

          <TabsTrigger value="audit">
            <Clock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>

          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-6">
          <TabsContent value="approvals" className="mt-0">
            <ChangeSuggestionsPanel
              personId={personId}
              familyId={familyId}
            />
          </TabsContent>

          <TabsContent value="guestbook" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Guestbook Moderation</CardTitle>
                <CardDescription>
                  Review and approve guestbook entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GuestbookModerationQueue familyId={familyId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="duplicates" className="mt-0">
            <DuplicateMergePanel
              personId={personId}
              familyId={familyId}
            />
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <AuditLogPanel
              personId={personId}
              familyId={familyId}
            />
          </TabsContent>

          <TabsContent value="export" className="mt-0">
            <ExportToolsPanel
              personId={personId}
              personName={personName}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
