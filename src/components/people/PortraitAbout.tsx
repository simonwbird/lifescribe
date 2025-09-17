import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit2, Save, X, Plus } from 'lucide-react';
import { Person, UserRole, canEdit, initials } from '@/utils/personUtils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { AvatarService } from '@/lib/avatarService';
import maleDefaultAvatar from '@/assets/avatar-male-default.png';
import femaleDefaultAvatar from '@/assets/avatar-female-default.png';
import { getSignedMediaUrl } from '@/lib/media';
interface PortraitAboutProps {
  person: Person;
  userRole: UserRole;
  onPersonUpdated: () => void;
}
const FAVORITE_CATEGORIES = [{
  key: 'music',
  label: 'Music'
}, {
  key: 'foods',
  label: 'Foods'
}, {
  key: 'places',
  label: 'Places'
}, {
  key: 'books',
  label: 'Books'
}, {
  key: 'sports',
  label: 'Sports'
}] as const;
export function PortraitAbout({
  person,
  userRole,
  onPersonUpdated
}: PortraitAboutProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(person.bio || '');
  const [editFavorites, setEditFavorites] = useState(person.favorites || {});
  const [saving, setSaving] = useState(false);
  const [setPhotoOpen, setSetPhotoOpen] = useState(false);
  const [photoInput, setPhotoInput] = useState('');
  const {
    toast
  } = useToast();
  const canUserEdit = canEdit(userRole);

  // Resolve best avatar to show (prefer real profile photo when viewing own page)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(person.avatar_url || null);

  // Get default avatar based on gender
  const getDefaultAvatar = () => {
    if (person.gender?.toLowerCase() === 'female' || person.gender?.toLowerCase() === 'f') {
      return femaleDefaultAvatar;
    }
    return maleDefaultAvatar; // Default to male avatar for unknown/male genders
  };

  // Prefer current user's auth/profile photo when this page belongs to them
  useEffect(() => {
    let cancelled = false;
    const resolveAvatar = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user && person.claimed_by_profile_id === user.id) {
          const authAvatar = (user.user_metadata as any)?.avatar_url || (user.user_metadata as any)?.picture || null;
          if (!cancelled && authAvatar) {
            setAvatarSrc(authAvatar);
            return;
          }
        }
        // Resolve from person's stored avatar (supports raw path or signed URL)
        const raw = person.avatar_url || null;
        if (!raw) {
          if (!cancelled) setAvatarSrc(null);
          return;
        }
        if (raw.startsWith('http')) {
          const fp = AvatarService.extractFilePath(raw);
          if (fp) {
            const proxied = await getSignedMediaUrl(fp, (person as any).family_id);
            if (!cancelled && proxied) {
              setAvatarSrc(proxied);
              return;
            }
          }
          if (!cancelled) {
            setAvatarSrc(raw);
            return;
          }
        }
        // Raw storage path -> sign via media-proxy
        const proxied = await getSignedMediaUrl(raw, (person as any).family_id);
        if (!cancelled) setAvatarSrc(proxied || null);
      } catch {
        if (!cancelled) setAvatarSrc(person.avatar_url || null);
      }
    };
    resolveAvatar();
    return () => {
      cancelled = true;
    };
  }, [person.id, person.avatar_url, person.claimed_by_profile_id]);
  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        error
      } = await supabase.from('people').update({
        bio: editBio.trim() || null,
        favorites: editFavorites
      }).eq('id', person.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      setIsEditing(false);
      onPersonUpdated();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const handleCancel = () => {
    setEditBio(person.bio || '');
    setEditFavorites(person.favorites || {});
    setIsEditing(false);
  };
  const addFavoriteItem = (category: string) => {
    setEditFavorites(prev => ({
      ...prev,
      [category]: [...(prev[category as keyof typeof prev] || []), '']
    }));
  };
  const updateFavoriteItem = (category: string, index: number, value: string) => {
    setEditFavorites(prev => ({
      ...prev,
      [category]: (prev[category as keyof typeof prev] || []).map((item, i) => i === index ? value : item)
    }));
  };
  const removeFavoriteItem = (category: string, index: number) => {
    setEditFavorites(prev => ({
      ...prev,
      [category]: (prev[category as keyof typeof prev] || []).filter((_, i) => i !== index)
    }));
  };
  return <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage key={avatarSrc || 'default'} alt={`${person.full_name} profile photo`} src={avatarSrc || getDefaultAvatar()} onError={async e => {
            const target = e.currentTarget as HTMLImageElement;

            // If we have a signed or http URL, try to refresh/sign
            if (avatarSrc && avatarSrc.startsWith('http')) {
              const refreshedUrl = await AvatarService.refreshSignedUrl(avatarSrc);
              if (refreshedUrl && refreshedUrl !== avatarSrc) {
                target.onerror = null;
                target.src = refreshedUrl;
                setAvatarSrc(refreshedUrl);
                return;
              }
              const filePath = AvatarService.extractFilePath(avatarSrc);
              if (filePath) {
                const proxied = await getSignedMediaUrl(filePath, (person as any).family_id);
                if (proxied) {
                  target.onerror = null;
                  target.src = proxied;
                  setAvatarSrc(proxied);
                  return;
                }
              }
            }

            // If stored value is a raw path, sign it via proxy
            if (person.avatar_url && !person.avatar_url.startsWith('http')) {
              const proxied = await getSignedMediaUrl(person.avatar_url as any, (person as any).family_id);
              if (proxied) {
                target.onerror = null;
                target.src = proxied;
                setAvatarSrc(proxied);
                return;
              }
            }

            // Fall back to gender default
            target.onerror = null;
            target.src = getDefaultAvatar();
          }} />
                
            <AvatarFallback className="text-lg">
              {initials(person.full_name)}
            </AvatarFallback>
          </Avatar>
          About {person.given_name || person.full_name}
        </CardTitle>
        
        {canUserEdit && !isEditing && <div className="flex items-center gap-2">
            <Dialog open={setPhotoOpen} onOpenChange={setSetPhotoOpen}>
              <DialogTrigger asChild>
                
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Paste family tree image URL</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Paste Supabase media URL or storage path" value={photoInput} onChange={e => setPhotoInput(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSetPhotoOpen(false)}>Cancel</Button>
                    <Button size="sm" onClick={async () => {
                  try {
                    const raw = photoInput.trim();
                    if (!raw) return;
                    const filePath = raw.startsWith('http') ? AvatarService.extractFilePath(raw) || '' : raw;
                    if (!filePath) throw new Error('Invalid Supabase URL');
                    const {
                      error
                    } = await supabase.from('people').update({
                      avatar_url: filePath
                    }).eq('id', person.id);
                    if (error) throw error;
                    const proxied = await getSignedMediaUrl(filePath, (person as any).family_id);
                    if (proxied) setAvatarSrc(proxied);
                    setSetPhotoOpen(false);
                    setPhotoInput('');
                    onPersonUpdated();
                    toast({
                      title: 'Photo updated'
                    });
                  } catch (err) {
                    console.error('Failed to set photo', err);
                    toast({
                      title: 'Failed to set photo',
                      variant: 'destructive'
                    });
                  }
                }}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>}
        
        {isEditing && <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Bio Section */}
        <div>
          <h4 className="font-medium mb-2">Bio</h4>
          {isEditing ? <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Share a bit about this person..." rows={3} /> : <p className="text-muted-foreground">
              {person.bio || 'No bio added yet.'}
            </p>}
        </div>

        {/* Favorites Section */}
        <div>
          <h4 className="font-medium mb-4">Favorites</h4>
          <div className="space-y-4">
            {FAVORITE_CATEGORIES.map(({
            key,
            label
          }) => {
            const items = (isEditing ? editFavorites : person.favorites)?.[key] || [];
            return <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-muted-foreground">{label}</h5>
                    {isEditing && <Button variant="ghost" size="sm" onClick={() => addFavoriteItem(key)}>
                        <Plus className="h-3 w-3" />
                      </Button>}
                  </div>
                  
                  {isEditing ? <div className="space-y-2">
                      {items.map((item: string, index: number) => <div key={index} className="flex gap-2">
                          <Input value={item} onChange={e => updateFavoriteItem(key, index, e.target.value)} placeholder={`Add ${label.toLowerCase()}...`} />
                          <Button variant="ghost" size="sm" onClick={() => removeFavoriteItem(key, index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>)}
                    </div> : <div className="flex flex-wrap gap-2">
                      {items.length > 0 ? items.map((item: string, index: number) => <Badge key={index} variant="secondary">
                            {item}
                          </Badge>) : <span className="text-sm text-muted-foreground">
                          No {label.toLowerCase()} added yet
                        </span>}
                    </div>}
                </div>;
          })}
          </div>
        </div>
      </CardContent>
    </Card>;
}