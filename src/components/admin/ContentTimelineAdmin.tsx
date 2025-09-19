import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search,
  Filter,
  Edit,
  Calendar,
  Users,
  Pin,
  PinOff,
  FileText,
  Image,
  MessageSquare,
  Sparkles,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ContentSearchTable } from './ContentSearchTable';
import { ContentSuggestionsPanel } from './ContentSuggestionsPanel';
import { BulkEditModal } from './BulkEditModal';
import { ContentAuditLogModal } from './ContentAuditLogModal';
import { useContentSearch, useContentSuggestions } from '@/hooks/useContentAdmin';
import type { ContentSearchFilters, ContentType } from '@/lib/contentAdminTypes';

const contentTypeIcons = {
  story: FileText,
  media: Image,
  answer: MessageSquare
};

const contentTypeLabels = {
  story: 'Stories',
  media: 'Media',
  answer: 'Answers'
};

export function ContentTimelineAdmin() {
  const [filters, setFilters] = useState<ContentSearchFilters>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: contentItems = [], isLoading } = useContentSearch({
    ...filters,
    search_term: searchTerm
  });
  
  const { data: allSuggestions = [] } = useContentSuggestions();

  const handleFilterChange = (key: keyof ContentSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleContentTypeFilter = (type: ContentType, checked: boolean) => {
    const currentTypes = filters.content_type || [];
    if (checked) {
      setFilters(prev => ({ 
        ...prev, 
        content_type: [...currentTypes, type] 
      }));
    } else {
      setFilters(prev => ({ 
        ...prev, 
        content_type: currentTypes.filter(t => t !== type) 
      }));
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSelectedItems([]);
  };

  const pendingSuggestionsCount = allSuggestions.filter(s => s.status === 'pending').length;

  if (isLoading) {
    return <div className="p-6">Loading content admin...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content & Timeline Admin</h1>
          <p className="text-muted-foreground">
            Search, edit, and manage content metadata across families
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {pendingSuggestionsCount > 0 && (
            <Badge variant="outline" className="text-blue-600">
              <Sparkles className="w-3 h-3 mr-1" />
              {pendingSuggestionsCount} AI suggestions
            </Badge>
          )}
          
          {selectedItems.length > 0 && (
            <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
              <DialogTrigger asChild>
                <Button>
                  Bulk Edit ({selectedItems.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Edit Content</DialogTitle>
                </DialogHeader>
                <BulkEditModal 
                  selectedItemIds={selectedItems}
                  contentItems={contentItems.filter(item => selectedItems.includes(item.id))}
                  onClose={() => {
                    setShowBulkEdit(false);
                    setSelectedItems([]);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
          
          <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Audit Log
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Content Audit Log</DialogTitle>
              </DialogHeader>
              <ContentAuditLogModal />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList>
          <TabsTrigger value="search">Search & Edit</TabsTrigger>
          <TabsTrigger value="suggestions">
            AI Suggestions
            {pendingSuggestionsCount > 0 && (
              <Badge className="ml-2 bg-blue-100 text-blue-800">
                {pendingSuggestionsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search titles, content, filenames..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              {/* Content Type Filters */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Content Types:</span>
                {Object.entries(contentTypeLabels).map(([type, label]) => {
                  const Icon = contentTypeIcons[type as ContentType];
                  const isChecked = filters.content_type?.includes(type as ContentType) ?? false;
                  
                  return (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          handleContentTypeFilter(type as ContentType, !!checked)
                        }
                      />
                      <label htmlFor={type} className="flex items-center gap-1 text-sm cursor-pointer">
                        <Icon className="w-4 h-4" />
                        {label}
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Additional Filters */}
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-suggestions"
                    checked={filters.has_suggestions || false}
                    onCheckedChange={(checked) => 
                      handleFilterChange('has_suggestions', !!checked)
                    }
                  />
                  <label htmlFor="has-suggestions" className="text-sm cursor-pointer">
                    Has AI suggestions
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-pinned"
                    checked={filters.is_pinned || false}
                    onCheckedChange={(checked) => 
                      handleFilterChange('is_pinned', !!checked)
                    }
                  />
                  <label htmlFor="is-pinned" className="text-sm cursor-pointer">
                    Pinned highlights
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Search Results ({contentItems.length})
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {selectedItems.length > 0 && `${selectedItems.length} selected`}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ContentSearchTable
                items={contentItems}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
                suggestions={allSuggestions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions">
          <ContentSuggestionsPanel suggestions={allSuggestions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}