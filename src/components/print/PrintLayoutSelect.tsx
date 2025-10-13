import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrintLayout, PrintConfig } from '@/lib/print/printTypes';
import { BookOpen, Award, Briefcase, GitBranch } from 'lucide-react';

interface PrintLayoutSelectProps {
  config: PrintConfig;
  onConfigChange: (config: PrintConfig) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PrintLayoutSelect({ config, onConfigChange, onNext, onBack }: PrintLayoutSelectProps) {
  const [selectedLayout, setSelectedLayout] = useState<PrintLayout>(config.layout);

  const handleLayoutChange = (layout: PrintLayout) => {
    setSelectedLayout(layout);
    onConfigChange({ ...config, layout });
  };

  const layouts = [
    { value: 'yearbook' as PrintLayout, label: 'Yearbook', icon: BookOpen, description: 'Grid of photos and memories' },
    { value: 'tribute' as PrintLayout, label: 'Tribute', icon: Award, description: 'Elegant memorial or celebration' },
    { value: 'portfolio' as PrintLayout, label: "Kids' Portfolio", icon: Briefcase, description: 'Showcase achievements' },
    { value: 'timeline' as PrintLayout, label: 'Timeline', icon: GitBranch, description: 'Chronological story' },
  ];

  const updateOptions = (key: string, value: any) => {
    onConfigChange({
      ...config,
      options: { ...config.options, [key]: value },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Layout Style</CardTitle>
        <CardDescription>Select how your content will be arranged</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedLayout} onValueChange={(v) => handleLayoutChange(v as PrintLayout)}>
          <div className="grid gap-4">
            {layouts.map((layout) => {
              const Icon = layout.icon;
              return (
                <div key={layout.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={layout.value} id={layout.value} />
                  <Label
                    htmlFor={layout.value}
                    className="flex items-start gap-3 cursor-pointer flex-1 p-3 rounded-lg hover:bg-accent"
                  >
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium">{layout.label}</div>
                      <div className="text-sm text-muted-foreground">{layout.description}</div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>

        {/* Page Options */}
        <div className="space-y-4 pt-4 border-t">
          <Label>Page Options</Label>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="toc"
                checked={config.options.includeTOC}
                onCheckedChange={(checked) => updateOptions('includeTOC', checked)}
              />
              <Label htmlFor="toc" className="cursor-pointer">Include Table of Contents</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="page-numbers"
                checked={config.options.includePageNumbers}
                onCheckedChange={(checked) => updateOptions('includePageNumbers', checked)}
              />
              <Label htmlFor="page-numbers" className="cursor-pointer">Include Page Numbers</Label>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="page-size">Page Size</Label>
            <Select
              value={config.options.pageSize}
              onValueChange={(value) => updateOptions('pageSize', value)}
            >
              <SelectTrigger id="page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="letter">Letter (8.5" × 11")</SelectItem>
                <SelectItem value="a4">A4 (210mm × 297mm)</SelectItem>
                <SelectItem value="legal">Legal (8.5" × 14")</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="orientation">Orientation</Label>
            <Select
              value={config.options.orientation}
              onValueChange={(value) => updateOptions('orientation', value)}
            >
              <SelectTrigger id="orientation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onBack} variant="outline" className="flex-1">
            Back
          </Button>
          <Button onClick={onNext} className="flex-1">
            Next: Preview & Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
