import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  FileText, 
  Image, 
  MessageSquare,
  User,
  Calendar,
  Sparkles,
  Edit
} from 'lucide-react';
import { useContentAuditLog } from '@/hooks/useContentAdmin';

const contentTypeIcons = {
  story: FileText,
  media: Image,
  answer: MessageSquare
};

const actionTypeLabels = {
  title_change: 'Title Changed',
  date_change: 'Date Changed',
  people_link: 'People Linked',
  reassign: 'Reassigned',
  pin: 'Pinned',
  unpin: 'Unpinned'
};

export function ContentAuditLogModal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');

  const { data: auditLogs = [], isLoading } = useContentAuditLog();

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.content_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.editor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.change_reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = !actionFilter || log.action_type === actionFilter;
    const matchesContentType = !contentTypeFilter || log.content_type === contentTypeFilter;
    
    return matchesSearch && matchesAction && matchesContentType;
  });

  const formatValue = (value: any) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  if (isLoading) {
    return <div className="p-6">Loading audit log...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by content ID, editor, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Actions</SelectItem>
            {Object.entries(actionTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Content type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="story">Stories</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="answer">Answers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Editor</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Edit className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No audit log entries found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const Icon = contentTypeIcons[log.content_type as keyof typeof contentTypeIcons];
                
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <div>
                          <Badge variant="outline">
                            {log.content_type}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {log.content_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {actionTypeLabels[log.action_type as keyof typeof actionTypeLabels] || log.action_type}
                        </Badge>
                        {log.ai_suggested && (
                          <Badge variant="outline" className="text-blue-600">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                        {log.batch_id && (
                          <Badge variant="outline" className="text-purple-600">
                            Batch
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="text-sm">{log.editor_name}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1 max-w-xs">
                        {Object.keys(log.old_values).length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">Old:</span>
                            <div className="text-muted-foreground truncate">
                              {Object.entries(log.old_values).map(([key, value]) => (
                                <span key={key}>{key}: {formatValue(value)}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {Object.keys(log.new_values).length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">New:</span>
                            <div className="text-muted-foreground truncate">
                              {Object.entries(log.new_values).map(([key, value]) => (
                                <span key={key}>{key}: {formatValue(value)}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm max-w-xs truncate">
                        {log.change_reason || '—'}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}