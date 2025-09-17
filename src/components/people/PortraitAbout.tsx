import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit2, Save, X, Plus } from 'lucide-react';
import { Person, UserRole, canEdit, initials } from '@/utils/personUtils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { AvatarService } from '@/lib/avatarService';
import maleDefaultAvatar from '@/assets/avatar-male-default.png';
import femaleDefaultAvatar from '@/assets/avatar-female-default.png';
import { getSignedMediaUrl } from '@/lib/media';
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader';
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
  // Individual edit states for each section
  const [editingBio, setEditingBio] = useState(false);
  const [editingHobbies, setEditingHobbies] = useState(false);
  const [editingFavorites, setEditingFavorites] = useState(false);
  
  // Edit values for each section
  const [editBio, setEditBio] = useState(person.bio || '');
  const [editHobbies, setEditHobbies] = useState((person as any).hobbies || []);
  const [editFavorites, setEditFavorites] = useState(person.favorites || {});
  
  // Saving states for each section
  const [savingBio, setSavingBio] = useState(false);
  const [savingHobbies, setSavingHobbies] = useState(false);
  const [savingFavorites, setSavingFavorites] = useState(false);
  
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
  // Save functions for each section
  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const { error } = await supabase.from('people').update({
        bio: editBio.trim() || null
      }).eq('id', person.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Bio updated successfully"
      });
      setEditingBio(false);
      onPersonUpdated();
    } catch (error) {
      console.error('Error updating bio:', error);
      toast({
        title: "Error",
        description: "Failed to update bio",
        variant: "destructive"
      });
    } finally {
      setSavingBio(false);
    }
  };

  const handleSaveHobbies = async () => {
    setSavingHobbies(true);
    try {
      const { error } = await supabase.from('people').update({
        hobbies: editHobbies.filter(h => h.trim())
      } as any).eq('id', person.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Hobbies updated successfully"
      });
      setEditingHobbies(false);
      onPersonUpdated();
    } catch (error) {
      console.error('Error updating hobbies:', error);
      toast({
        title: "Error",
        description: "Failed to update hobbies",
        variant: "destructive"
      });
    } finally {
      setSavingHobbies(false);
    }
  };

  const handleSaveFavorites = async () => {
    setSavingFavorites(true);
    try {
      const { error } = await supabase.from('people').update({
        favorites: editFavorites
      }).eq('id', person.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Favorites updated successfully"
      });
      setEditingFavorites(false);
      onPersonUpdated();
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive"
      });
    } finally {
      setSavingFavorites(false);
    }
  };

  // Cancel functions for each section
  const handleCancelBio = () => {
    setEditBio(person.bio || '');
    setEditingBio(false);
  };

  const handleCancelHobbies = () => {
    setEditHobbies((person as any).hobbies || []);
    setEditingHobbies(false);
  };

  const handleCancelFavorites = () => {
    setEditFavorites(person.favorites || {});
    setEditingFavorites(false);
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

  const addHobby = () => {
    setEditHobbies(prev => [...prev, '']);
  };

  const updateHobby = (index: number, value: string) => {
    setEditHobbies(prev => prev.map((hobby, i) => i === index ? value : hobby));
  };

  const removeHobby = (index: number) => {
    setEditHobbies(prev => prev.filter((_, i) => i !== index));
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {canUserEdit ? (
            <ProfilePhotoUploader
              currentPhotoUrl={avatarSrc}
              fallbackText={initials(person.full_name)}
              onPhotoUploaded={async (newPhotoUrl) => {
                // Update the person's avatar_url in the database
                try {
                  const { error } = await supabase
                    .from('people')
                    .update({ avatar_url: newPhotoUrl })
                    .eq('id', person.id);
                    
                  if (error) throw error;
                  
                  // Get a signed URL for display
                  const signedUrl = await getSignedMediaUrl(newPhotoUrl, (person as any).family_id);
                  setAvatarSrc(signedUrl || newPhotoUrl);
                  onPersonUpdated();
                  
                  toast({
                    title: 'Profile photo updated',
                    description: 'Your photo has been successfully updated.'
                  });
                } catch (error) {
                  console.error('Failed to update avatar:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to update profile photo',
                    variant: 'destructive'
                  });
                }
              }}
              personId={person.id}
              size="lg"
            />
          ) : (
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
          )}
          About {person.given_name || person.full_name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Bio Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Bio</h4>
            {canUserEdit && !editingBio && (
              <Button variant="ghost" size="sm" onClick={() => setEditingBio(true)}>
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {editingBio ? (
            <div className="space-y-3">
              <Textarea 
                value={editBio} 
                onChange={e => setEditBio(e.target.value)} 
                placeholder="Share a bit about this person..." 
                rows={3} 
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" onClick={handleSaveBio} disabled={savingBio}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelBio}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {person.bio || 'No bio added yet.'}
            </p>
          )}
        </div>

        {/* Hobbies & Interests Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Hobbies & Interests</h4>
            {canUserEdit && !editingHobbies && (
              <Button variant="ghost" size="sm" onClick={() => setEditingHobbies(true)}>
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            {editingHobbies && (
              <Button variant="ghost" size="sm" onClick={addHobby}>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
          </div>
          
          {editingHobbies ? (
            <div className="space-y-3">
              <div className="space-y-2">
                {editHobbies.map((hobby: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={hobby}
                      onChange={(e) => updateHobby(index, e.target.value)}
                      placeholder="Add a hobby or interest..."
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHobby(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" onClick={handleSaveHobbies} disabled={savingHobbies}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelHobbies}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {((person as any).hobbies || []).length > 0 ? (
                ((person as any).hobbies || []).map((hobby: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {hobby}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  No hobbies or interests added yet
                </span>
              )}
            </div>
          )}
        </div>

        {/* Favorites Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Favorites</h4>
            {canUserEdit && !editingFavorites && (
              <Button variant="ghost" size="sm" onClick={() => setEditingFavorites(true)}>
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {editingFavorites && (
            <div className="mb-4 flex gap-2 justify-end">
              <Button size="sm" onClick={handleSaveFavorites} disabled={savingFavorites}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelFavorites}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
          
          <div className="space-y-4">
            {FAVORITE_CATEGORIES.map(({
            key,
            label
          }) => {
            const items = (editingFavorites ? editFavorites : person.favorites)?.[key] || [];
            return <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-muted-foreground">{label}</h5>
                    {editingFavorites && <Button variant="ghost" size="sm" onClick={() => addFavoriteItem(key)}>
                        <Plus className="h-3 w-3" />
                      </Button>}
                  </div>
                  
                  {editingFavorites ? <div className="space-y-2">
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