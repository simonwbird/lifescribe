import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PrintScope, PrintLayout, PrintConfig } from '@/lib/print/printTypes';
import { BookOpen, Calendar, User, Package } from 'lucide-react';

interface PrintScopeSelectProps {
  config: PrintConfig;
  onConfigChange: (config: PrintConfig) => void;
  onNext: () => void;
}

export function PrintScopeSelect({ config, onConfigChange, onNext }: PrintScopeSelectProps) {
  const [selectedScope, setSelectedScope] = useState<PrintScope>(config.scope);

  const handleScopeChange = (scope: PrintScope) => {
    setSelectedScope(scope);
    onConfigChange({ ...config, scope });
  };

  const scopes = [
    { value: 'person' as PrintScope, label: 'Person', icon: User, description: 'Create a tribute book for someone' },
    { value: 'event' as PrintScope, label: 'Event', icon: Calendar, description: 'Document an event or gathering' },
    { value: 'dateRange' as PrintScope, label: 'Date Range', icon: Calendar, description: 'Stories from a time period' },
    { value: 'collection' as PrintScope, label: 'Collection', icon: Package, description: 'Custom selection of content' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Choose Your Book Scope
        </CardTitle>
        <CardDescription>What would you like to create a book about?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedScope} onValueChange={(v) => handleScopeChange(v as PrintScope)}>
          <div className="grid gap-4">
            {scopes.map((scope) => {
              const Icon = scope.icon;
              return (
                <div key={scope.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={scope.value} id={scope.value} />
                  <Label
                    htmlFor={scope.value}
                    className="flex items-start gap-3 cursor-pointer flex-1 p-3 rounded-lg hover:bg-accent"
                  >
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium">{scope.label}</div>
                      <div className="text-sm text-muted-foreground">{scope.description}</div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>

        <Button onClick={onNext} className="w-full">
          Next: Choose Layout
        </Button>
      </CardContent>
    </Card>
  );
}
