import { useState } from 'react';
import { Shield, FileText, CreditCard, Users, Plus, Lock, Unlock, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVaultSections, useCreateVaultSection } from '@/hooks/useVault';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VaultSectionView from './VaultSectionView';
import VaultChecklistManager from './VaultChecklistManager';
import VaultAccessLog from './VaultAccessLog';
import { supabase } from '@/integrations/supabase/client';

interface VaultDashboardProps {
  familyId: string;
}

export default function VaultDashboard({ familyId }: VaultDashboardProps) {
  const { data: sections, isLoading } = useVaultSections(familyId);
  const createSection = useCreateVaultSection();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSection, setNewSection] = useState({
    title: '',
    description: '',
    section_type: 'documents' as const,
  });

  const handleCreateSection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await createSection.mutateAsync({
      ...newSection,
      family_id: familyId,
      owner_id: user.id,
    });

    setIsCreating(false);
    setNewSection({ title: '', description: '', section_type: 'documents' });
  };

  const sectionIcons = {
    documents: FileText,
    accounts: CreditCard,
    contacts: Users,
    other: Shield,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            SafeBox Vault
          </h1>
          <p className="text-muted-foreground mt-1">
            Secure important information for when it's needed most
          </p>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Vault Section</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Section Type</Label>
                <Select
                  value={newSection.section_type}
                  onValueChange={(value) => 
                    setNewSection({ ...newSection, section_type: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="accounts">Accounts & Passwords</SelectItem>
                    <SelectItem value="contacts">Important Contacts</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  placeholder="e.g., Legal Documents"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newSection.description}
                  onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                  placeholder="What will you store here?"
                  rows={3}
                />
              </div>

              <Button onClick={handleCreateSection} className="w-full">
                Create Section
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
          <TabsTrigger value="audit">Access Log</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4">
          {!sections || sections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Vault Sections Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first section to start securing important information
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Section
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sections.map((section) => {
                const Icon = sectionIcons[section.section_type];
                return (
                  <Card 
                    key={section.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedSection(section.id)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {section.title}
                      </CardTitle>
                      {section.description && (
                        <CardDescription>{section.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        <span>Protected & Encrypted</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedSection && (
            <Dialog open={!!selectedSection} onOpenChange={() => setSelectedSection(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <VaultSectionView sectionId={selectedSection} familyId={familyId} />
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="checklists">
          <VaultChecklistManager familyId={familyId} />
        </TabsContent>

        <TabsContent value="audit">
          <VaultAccessLog familyId={familyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
