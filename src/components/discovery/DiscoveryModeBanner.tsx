import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { useDiscoveryMode } from '@/hooks/useDiscoveryMode';
import { useState } from 'react';

interface DiscoveryModeBannerProps {
  isUnder13: boolean;
}

export function DiscoveryModeBanner({ isUnder13 }: DiscoveryModeBannerProps) {
  const { isDiscoveryMode, enableDiscoveryMode } = useDiscoveryMode();
  const [dismissed, setDismissed] = useState(false);

  if (isDiscoveryMode || !isUnder13 || dismissed) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Try Discovery Mode!</h3>
            <p className="text-sm text-muted-foreground">
              A fun, safe way to explore your family stories with larger text and emoji reactions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={enableDiscoveryMode} size="lg">
            Try it now
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
