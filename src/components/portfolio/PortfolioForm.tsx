import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, FileUp, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';

const subjects = [
  'Math', 'Science', 'English', 'History', 'Geography',
  'Art', 'Music', 'Physical Education', 'Technology',
  'Foreign Language', 'Life Skills', 'Other'
];

const portfolioSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  completedAt: z.date(),
  skills: z.string().optional(),
  learningObjectives: z.string().optional(),
  reflection: z.string().optional(),
  isHighlight: z.boolean().default(false),
});

type PortfolioFormData = z.infer<typeof portfolioSchema>;

interface PortfolioFormProps {
  personId: string;
  familyId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PortfolioForm({ personId, familyId, onSuccess, onCancel }: PortfolioFormProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      completedAt: new Date(),
      isHighlight: false,
    }
  });

  const createPortfolioMutation = useMutation({
    mutationFn: async (data: PortfolioFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Parse skills from comma-separated string
      const skillsArray = data.skills 
        ? data.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const { data: portfolio, error } = await supabase
        .from('portfolios' as any)
        .insert({
          family_id: familyId,
          person_id: personId,
          created_by: user.id,
          title: data.title,
          description: data.description,
          subject: data.subject,
          completed_at: format(data.completedAt, 'yyyy-MM-dd'),
          skills: skillsArray,
          learning_objectives: data.learningObjectives,
          reflection: data.reflection,
          is_highlight: data.isHighlight,
        })
        .select()
        .single();

      if (error) throw error;

      const portfolioData = portfolio as any;

      // Upload attachments if any
      if (attachments.length > 0 && portfolioData) {
        for (const file of attachments) {
          const fileName = `${portfolioData.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('portfolio-attachments')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            continue;
          }

          await supabase
            .from('portfolio_attachments' as any)
            .insert({
              portfolio_id: portfolioData.id,
              file_name: file.name,
              file_path: fileName,
              file_type: file.type,
              file_size: file.size,
              uploaded_by: user.id,
            });
        }
      }

      return portfolioData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios', familyId, personId] });
      toast({
        title: 'Portfolio entry created',
        description: 'Your learning artifact has been saved.'
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error creating portfolio:', error);
      toast({
        title: 'Error',
        description: 'Could not create portfolio entry.',
        variant: 'destructive'
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: PortfolioFormData) => {
    createPortfolioMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Portfolio Entry</CardTitle>
        <CardDescription>
          Document learning achievements and artifacts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Volcano Science Project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="completedAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Completed Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the learning activity or project..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills Demonstrated</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Critical thinking, Research, Presentation (comma-separated)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Separate multiple skills with commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="learningObjectives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Objectives</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What were the learning goals?"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reflection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reflection</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What did you learn? What went well? What would you do differently?"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isHighlight"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      Mark as Highlight
                    </FormLabel>
                    <FormDescription>
                      Feature this entry in term reports
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* File attachments */}
            <div className="space-y-2">
              <FormLabel>Evidence/Attachments</FormLabel>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Add Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf,.doc,.docx"
                />
              </div>
              {attachments.length > 0 && (
                <div className="space-y-2 mt-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={createPortfolioMutation.isPending}>
                {createPortfolioMutation.isPending ? 'Saving...' : 'Save Portfolio Entry'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
