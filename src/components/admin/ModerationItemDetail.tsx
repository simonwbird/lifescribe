import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Clock, FileText, Image, MessageSquare, User, Eye, EyeOff, AlertCircle, Flag } from 'lucide-react';
import { useModerationItem, useModerationAction } from '@/hooks/useModerationData';
import { Skeleton } from '@/components/ui/skeleton';
import type { ModerationActionType } from '@/lib/moderationTypes';

interface ModerationItemDetailProps {
  itemId: string;
}

export function ModerationItemDetail({ itemId }: ModerationItemDetailProps) {
  const [rationale, setRationale] = useState('');
  const [selectedAction, setSelectedAction] = useState<ModerationActionType | null>(null);
  const [showRedaction, setShowRedaction] = useState(false);

  const { data: item, isLoading } = useModerationItem(itemId);
  const actionMutation = useModerationAction();

  const handleAction = async (actionType: ModerationActionType) => {
    if (!rationale.trim()) {
      return;
    }

    await actionMutation.mutateAsync({
      queueItemId: itemId,
      actionType,
      rationale,
      metadata: { applied_via: 'detail_view' }
    });

    setRationale('');
    setSelectedAction(null);
  };

  const renderItemPreview = () => {
    if (!item?.item_data) {
      return (
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground">Content preview unavailable</p>
          </CardContent>
        </Card>
      );
    }

    const { item_data, item_type } = item;

    switch (item_type) {
      case 'story':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Story Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Title</h4>
                <p className="p-3 bg-muted rounded">{item_data.title || 'Untitled'}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Content</h4>
                <div className="p-3 bg-muted rounded max-h-40 overflow-y-auto">
                  {showRedaction ? (
                    <p className="text-muted-foreground">
                      [REDACTED CONTENT - {item_data.content?.length || 0} characters]
                    </p>
                  ) : (
                    <p>{item_data.content || 'No content'}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => setShowRedaction(!showRedaction)}
                >
                  {showRedaction ? (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Show Content
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Redact Content
                    </>
                  )}
                </Button>
              </div>

              {item_data.transcript_text && (
                <div>
                  <h4 className="font-medium mb-2">Transcript</h4>
                  <div className="p-3 bg-muted rounded max-h-32 overflow-y-auto">
                    <p className="text-sm">{item_data.transcript_text}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'media':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Media Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">File Name:</span>
                  <p className="text-muted-foreground">{item_data.file_name}</p>
                </div>
                <div>
                  <span className="font-medium">MIME Type:</span>
                  <p className="text-muted-foreground">{item_data.mime_type}</p>
                </div>
                <div>
                  <span className="font-medium">File Size:</span>
                  <p className="text-muted-foreground">
                    {(item_data.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div>
                  <span className="font-medium">Uploaded:</span>
                  <p className="text-muted-foreground">
                    {new Date(item_data.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {item_data.transcript_text && (
                <div>
                  <h4 className="font-medium mb-2">Transcript</h4>
                  <div className="p-3 bg-muted rounded max-h-32 overflow-y-auto">
                    <p className="text-sm">{item_data.transcript_text}</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Media content preview disabled for security. File path: {item_data.file_path}
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 'answer':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Answer Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Answer Text</h4>
                <div className="p-3 bg-muted rounded">
                  <p>{item_data.answer_text}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Date:</span>
                  <p className="text-muted-foreground">
                    {item_data.occurred_on ? new Date(item_data.occurred_on).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Approximate:</span>
                  <p className="text-muted-foreground">{item_data.is_approx ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'comment':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comment Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-medium mb-2">Comment Content</h4>
                <div className="p-3 bg-muted rounded">
                  <p>{item_data.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground">Unknown content type</p>
            </CardContent>
          </Card>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Item not found</h3>
          <p className="text-muted-foreground">
            The moderation item could not be loaded.
          </p>
        </CardContent>
      </Card>
    );
  }

  const slaStatus = item.sla_due_at ? (() => {
    const now = new Date();
    const sla = new Date(item.sla_due_at);
    const hoursLeft = (sla.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft < 0) return { status: 'overdue', hours: Math.abs(hoursLeft) };
    if (hoursLeft < 4) return { status: 'urgent', hours: hoursLeft };
    return { status: 'normal', hours: hoursLeft };
  })() : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Moderation Review</h2>
          <p className="text-sm text-muted-foreground">
            {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)} • 
            Created {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={item.status === 'pending' ? 'destructive' : 'secondary'}>
            {item.status}
          </Badge>
          
          {slaStatus && (
            <Badge variant={slaStatus.status === 'overdue' ? 'destructive' : 'outline'}>
              <Clock className="w-3 h-3 mr-1" />
              {slaStatus.status === 'overdue' 
                ? `${Math.round(slaStatus.hours)}h overdue`
                : `${Math.round(slaStatus.hours)}h left`
              }
            </Badge>
          )}
        </div>
      </div>

      {/* Flag Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Flag Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Source:</span>
              <Badge className="ml-2">
                {item.flag?.source.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Severity:</span>
              <Badge variant={item.priority > 3 ? 'destructive' : 'secondary'} className="ml-2">
                {item.priority}/5
              </Badge>
            </div>
          </div>
          
          <div>
            <span className="font-medium">Reason:</span>
            <p className="mt-1 p-3 bg-muted rounded">{item.flag?.reason}</p>
          </div>

          {item.flag?.details && Object.keys(item.flag.details).length > 0 && (
            <div>
              <span className="font-medium">Additional Details:</span>
              <pre className="mt-1 p-3 bg-muted rounded text-sm overflow-x-auto">
                {JSON.stringify(item.flag.details, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Preview */}
      {renderItemPreview()}

      {/* Previous Actions */}
      {item.actions && item.actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {item.actions.map((action: any) => (
                <div key={action.id} className="flex items-start justify-between p-3 bg-muted rounded">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge>{action.action_type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(action.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{action.rationale}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {item.status !== 'resolved' && (
        <Card>
          <CardHeader>
            <CardTitle>Take Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Rationale for action (required)"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button
                onClick={() => handleAction('hide')}
                disabled={!rationale.trim() || actionMutation.isPending}
                variant="destructive"
              >
                <EyeOff className="w-4 h-4 mr-1" />
                Hide
              </Button>
              
              <Button
                onClick={() => handleAction('blur')}
                disabled={!rationale.trim() || actionMutation.isPending}
                variant="secondary"
              >
                Blur
              </Button>
              
              <Button
                onClick={() => handleAction('age_gate')}
                disabled={!rationale.trim() || actionMutation.isPending}
                variant="outline"
              >
                Age Gate
              </Button>
              
              <Button
                onClick={() => handleAction('notify_owner')}
                disabled={!rationale.trim() || actionMutation.isPending}
                variant="outline"
              >
                <User className="w-4 h-4 mr-1" />
                Notify Owner
              </Button>
              
              <Button
                onClick={() => handleAction('escalate')}
                disabled={!rationale.trim() || actionMutation.isPending}
                variant="destructive"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Escalate
              </Button>
              
              <Button
                onClick={() => handleAction('resolve')}
                disabled={!rationale.trim() || actionMutation.isPending}
              >
                Resolve
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}