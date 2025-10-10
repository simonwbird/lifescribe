import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share, Eye, MoreHorizontal, Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToast } from '@/hooks/use-toast';
import EnhancedReactionBar from './EnhancedReactionBar';
import { InteractiveCommentField } from './InteractiveCommentField';
import { formatForUser, getCurrentUserRegion } from '@/utils/date';
import AdminFeedActions from '@/components/admin/AdminFeedActions';
import { supabase } from '@/integrations/supabase/client';
interface ActivityItem {
  id: string;
  type: 'story' | 'comment' | 'invite' | 'photo';
  actor: string;
  action: string;
  target: string;
  snippet?: string;
  time: string;
  unread: boolean;
  author_id?: string;
  content_type?: 'text' | 'photo' | 'audio' | 'video';
  created_at?: string;
  full_content?: string;
  media_count?: number;
  has_audio?: boolean;
  reactions_count?: number;
  comments_count?: number;
}
interface EnhancedFeedItemProps {
  activity: ActivityItem;
  familyId: string;
  userProfile?: {
    avatar_url?: string;
    full_name?: string;
  };
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onNavigate?: () => void;
  compact?: boolean;
  showAdminActions?: boolean;
  onAdminAction?: (action: string, storyId: string) => void;
}
export function EnhancedFeedItem({
  activity,
  familyId,
  userProfile,
  isExpanded = false,
  onToggleExpand,
  onNavigate,
  compact = false,
  showAdminActions = false,
  onAdminAction
}: EnhancedFeedItemProps) {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(activity.reactions_count || 0);
  const [commentCount, setCommentCount] = useState(activity.comments_count || 0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<Array<{ url: string; type: string; mimeType: string }>>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const {
    track
  } = useAnalytics();
  const {
    toast
  } = useToast();

  // Load media for this story
  useEffect(() => {
    const loadMedia = async () => {
      if (activity.type !== 'story') return;
      
      setLoadingMedia(true);
      try {
        const storyId = activity.id.replace('story-', '');
        const { data: media } = await supabase
          .from('media')
          .select('*')
          .eq('story_id', storyId)
          .order('created_at')
          .limit(3); // Limit to first 3 media items for preview

        if (media) {
          const urls = await Promise.all(
            media.map(async (item) => {
              const { data: { signedUrl } } = await supabase.storage
                .from('media')
                .createSignedUrl(item.file_path, 3600);
              
              return {
                url: signedUrl || '',
                type: item.mime_type?.startsWith('image/') ? 'image' : 
                      item.mime_type?.startsWith('video/') ? 'video' : 'audio',
                mimeType: item.mime_type || ''
              };
            })
          );
          setMediaUrls(urls.filter(u => u.url));
        }
      } catch (error) {
        console.error('Error loading media:', error);
      } finally {
        setLoadingMedia(false);
      }
    };

    loadMedia();
  }, [activity.id, activity.type]);
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    track('activity_clicked', {
      story_id: activity.id,
      family_id: familyId,
      reaction: 'like',
      action: newLiked ? 'add' : 'remove'
    });
    toast({
      title: newLiked ? "Story liked! ❤️" : "Like removed",
      description: newLiked ? "Thanks for the love!" : ""
    });
  };
  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(!showComments);
    track('activity_clicked', {
      story_id: activity.id,
      family_id: familyId,
      expanded: !showComments
    });
  };
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/stories/${activity.id.replace('story-', '')}`;
    try {
      if (navigator.share && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
        await navigator.share({
          title: activity.target,
          text: activity.snippet,
          url: shareUrl
        });
        toast({
          title: "Story shared! 📤",
          description: "Thanks for spreading the love"
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied! 📋",
          description: "Story link copied to clipboard"
        });
      }
      track('activity_clicked', {
        story_id: activity.id,
        family_id: familyId,
        method: navigator.share ? 'native' : 'clipboard'
      });
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share right now.",
        variant: "destructive"
      });
    }
  };
  const handleAudioToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(!isPlayingAudio);

    // Simulate audio playback
    if (!isPlayingAudio) {
      setTimeout(() => setIsPlayingAudio(false), 3000);
    }
    track('activity_clicked', {
      story_id: activity.id,
      action: isPlayingAudio ? 'pause' : 'play'
    });
  };
  const onCommentAdded = () => {
    setCommentCount(prev => prev + 1);
    toast({
      title: "Comment added! 💬",
      description: "Your comment has been shared with the family."
    });
  };
  const getContentPreview = () => {
    if (activity.full_content) {
      const maxLength = isExpanded ? 500 : 150;
      if (activity.full_content.length <= maxLength) return activity.full_content;
      return activity.full_content.substring(0, maxLength) + '...';
    }
    return activity.snippet;
  };
  if (compact) {
    return <Card className="w-full hover:shadow-sm transition-all duration-200">
        <CardContent className="p-3 space-y-3 cursor-pointer" onClick={onNavigate || onToggleExpand || (() => {})}>
          {/* Compact Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-1 ring-primary/20">
                <AvatarImage src={userProfile?.avatar_url} alt={activity.actor} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {activity.actor.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{activity.actor}</p>
                  {activity.unread && <Badge variant="destructive" className="text-xs animate-pulse">NEW</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activity.action} {activity.target} • {formatForUser(activity.created_at || activity.time, 'relative', getCurrentUserRegion())}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {showAdminActions && (
                <div onClick={(e) => e.stopPropagation()}>
                  <AdminFeedActions 
                    storyId={activity.id.replace('story-', '')} 
                    onAction={onAdminAction} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Compact Content */}
          {getContentPreview() && (
            <p className={cn(
              "text-sm leading-relaxed text-muted-foreground",
              !isExpanded && "line-clamp-2"
            )} aria-expanded={isExpanded}>
              {getContentPreview()}
            </p>
          )}

          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="space-y-2">
              {mediaUrls.map((media, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  {media.type === 'image' && (
                    <img 
                      src={media.url} 
                      alt="Story media" 
                      className="w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.();
                      }}
                    />
                  )}
                  {media.type === 'video' && (
                    <video 
                      src={media.url} 
                      controls 
                      className="w-full max-h-48 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  {media.type === 'audio' && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <audio 
                        src={media.url} 
                        controls 
                        className="w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              ))}
              {activity.media_count && activity.media_count > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{activity.media_count - 3} more
                </p>
              )}
            </div>
          )}

          {/* Compact Actions */}
          <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleLike} className={cn("flex items-center gap-1 h-7 px-2 hover:bg-red-50 hover:text-red-600", isLiked && "text-red-500 bg-red-50")}>
                <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
                <span className="text-xs">{likeCount > 0 ? likeCount : 'Like'}</span>
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleComment} className="flex items-center gap-1 h-7 px-2 hover:bg-blue-50 hover:text-blue-600">
                <MessageCircle className="h-3 w-3" />
                <span className="text-xs">{commentCount > 0 ? commentCount : 'Comment'}</span>
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleShare} className="flex items-center gap-1 h-7 px-2 hover:bg-green-50 hover:text-green-600">
                <Share className="h-3 w-3" />
                <span className="text-xs">Share</span>
              </Button>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onToggleExpand || (() => {})} className="flex items-center gap-1 h-7 px-2">
              <Eye className="h-3 w-3" />
              <span className="text-xs">
                {isExpanded ? 'Less' : 'More'}
              </span>
            </Button>
          </div>

          {/* Enhanced Reactions in Compact Mode */}
          <div onClick={(e) => e.stopPropagation()}>
            <EnhancedReactionBar targetType="story" targetId={activity.id.replace('story-', '')} familyId={familyId} compact={true} />
          </div>

          {/* Comment Section in Compact Mode */}
          {showComments && <div className="space-y-3 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
              <InteractiveCommentField storyId={activity.id.replace('story-', '')} familyId={familyId} onCommentAdded={onCommentAdded} compact={true} />
            </div>}
        </CardContent>
      </Card>;
  }
  return <Card className="w-full hover:shadow-md transition-all duration-200">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={userProfile?.avatar_url} alt={activity.actor} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {activity.actor.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{activity.actor}</p>
                {activity.unread && <Badge variant="destructive" className="text-xs animate-pulse">NEW</Badge>}
                {activity.content_type && <Badge variant="outline" className="text-xs capitalize">
                    {activity.content_type}
                  </Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {activity.action} {activity.target} • {formatForUser(activity.created_at || activity.time, 'relative', getCurrentUserRegion())}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showAdminActions && <AdminFeedActions storyId={activity.id.replace('story-', '')} onAction={onAdminAction} />}
            
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {getContentPreview() && <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {getContentPreview()}
            </p>}
          
          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="space-y-2">
              {mediaUrls.map((media, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  {media.type === 'image' && (
                    <img 
                      src={media.url} 
                      alt="Story media" 
                      className="w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.();
                      }}
                    />
                  )}
                  {media.type === 'video' && (
                    <video 
                      src={media.url} 
                      controls 
                      className="w-full max-h-64 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  {media.type === 'audio' && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <audio 
                        src={media.url} 
                        controls 
                        className="w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              ))}
              {activity.media_count && activity.media_count > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{activity.media_count - 3} more • Click to view all
                </p>
              )}
            </div>
          )}
          
          {activity.content_type === 'audio' && activity.has_audio && <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Button variant="ghost" size="sm" onClick={handleAudioToggle} className="h-10 w-10 p-0 rounded-full bg-primary/10 hover:bg-primary/20">
                {isPlayingAudio ? <Pause className="h-5 w-5 text-primary" /> : <Play className="h-5 w-5 text-primary" />}
              </Button>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Voice Recording</span>
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div className={cn("bg-primary rounded-full h-2 transition-all duration-300", isPlayingAudio ? "w-1/3" : "w-0")} />
                </div>
              </div>
            </div>}
          
          {activity.media_count && activity.media_count > 0 && <div className="grid grid-cols-3 gap-2">
              {Array.from({
            length: Math.min(activity.media_count, 3)
          }).map((_, i) => <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    📸
                  </div>
                </div>)}
              {activity.media_count > 3 && <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-xs font-medium">
                  +{activity.media_count - 3}
                </div>}
            </div>}

          {activity.full_content && activity.full_content.length > 150 && !isExpanded && <Button variant="link" size="sm" onClick={onToggleExpand} className="h-auto p-0 text-primary">
              Read more
            </Button>}
        </div>

        {/* Enhanced Interaction Bar */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleLike} className={cn("flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-colors", isLiked && "text-red-500 bg-red-50")}>
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              <span className="text-sm font-medium">{likeCount > 0 ? likeCount : 'Like'}</span>
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleComment} className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{commentCount > 0 ? commentCount : 'Comment'}</span>
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleShare} className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 transition-colors">
              <Share className="h-4 w-4" />
              <span className="text-sm font-medium">Share</span>
            </Button>
          </div>
          
          {onToggleExpand && <Button variant="ghost" size="sm" onClick={onToggleExpand} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isExpanded ? 'Collapse' : 'Expand'}
              </span>
            </Button>}
        </div>

        {/* Enhanced Reactions */}
        <EnhancedReactionBar targetType="story" targetId={activity.id.replace('story-', '')} familyId={familyId} compact={false} />

        {/* Comment Section */}
        {showComments && <div className="space-y-4 pt-4 border-t">
            <InteractiveCommentField storyId={activity.id.replace('story-', '')} familyId={familyId} onCommentAdded={onCommentAdded} compact={false} />
          </div>}
      </CardContent>
    </Card>;
}