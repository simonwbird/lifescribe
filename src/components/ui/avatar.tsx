import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { AvatarService } from "@/lib/avatarService";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, alt, ...props }, ref) => {
  const [resolvedSrc, setResolvedSrc] = React.useState<string | undefined>(
    typeof src === 'string' && src ? src : undefined
  );

  React.useEffect(() => {
    let isMounted = true;
    const resolve = async () => {
      if (!src || typeof src !== 'string') return;

      // If not a full URL, try to sign from the media bucket
      if (!src.startsWith('http')) {
        try {
          const { data } = await supabase.storage.from('media').createSignedUrl(src, 3600);
          if (isMounted) setResolvedSrc(data?.signedUrl || src);
          return;
        } catch (e) {
          // fall through to original src
        }
      }

      // If it's a Supabase signed URL, ensure it's valid/refresh if needed
      const valid = await AvatarService.getValidAvatarUrl(src);
      if (isMounted) setResolvedSrc(valid || src);
    };
    resolve();
    return () => { isMounted = false; };
  }, [src]);

  const handleError = async () => {
    if (!src || typeof src !== 'string') return;
    // Attempt a refresh for signed URLs
    const refreshed = await AvatarService.refreshSignedUrl(src);
    if (refreshed) setResolvedSrc(refreshed);
  };

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={resolvedSrc}
      alt={alt || 'User avatar'}
      onError={handleError}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
