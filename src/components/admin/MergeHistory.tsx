import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Undo2 } from "lucide-react";
import { format } from "date-fns";

export function MergeHistory({ familyId }: { familyId: string }) {
  const [merges, setMerges] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadMerges();
  }, [familyId]);

  const loadMerges = async () => {
    const { data } = await supabase
      .from('person_merges')
      .select('*')
      .eq('family_id', familyId)
      .order('merged_at', { ascending: false })
      .limit(20);
    setMerges(data || []);
  };

  const handleUndo = async (mergeId: string) => {
    try {
      const { error } = await supabase.functions.invoke('undo-merge', {
        body: { mergeId },
      });
      if (error) throw error;
      toast({ title: "Merge undone", description: "Records restored successfully" });
      loadMerges();
    } catch (error: any) {
      toast({ title: "Undo failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merge History</CardTitle>
      </CardHeader>
      <CardContent>
        {merges.map((merge) => {
          const canUndo = merge.can_undo && !merge.undone_at && new Date(merge.undo_expires_at) > new Date();
          return (
            <div key={merge.id} className="border-b last:border-0 py-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">
                  Merged {format(new Date(merge.merged_at), 'MMM d, yyyy')}
                </p>
                {merge.undone_at && <Badge variant="secondary">Undone</Badge>}
              </div>
              {canUndo && (
                <Button size="sm" variant="outline" onClick={() => handleUndo(merge.id)}>
                  <Undo2 className="h-4 w-4 mr-2" />
                  Undo
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}