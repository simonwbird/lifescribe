import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Trash2, AlertTriangle, FileText, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { ComplianceService } from '@/lib/complianceService'
import type { RTBFAnalysis, RTBFCompletionReceipt } from '@/lib/complianceTypes'

export default function RTBFCard() {
  const [analysis, setAnalysis] = useState<RTBFAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [checkedWarnings, setCheckedWarnings] = useState<Set<number>>(new Set())
  const [completionReceipt, setCompletionReceipt] = useState<RTBFCompletionReceipt | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleAnalyzeImpact = async () => {
    setIsAnalyzing(true)
    try {
      const result = await ComplianceService.analyzeRTBFImpact()
      setAnalysis(result)
      setCheckedWarnings(new Set())
      setConfirmationCode('')
    } catch (error) {
      console.error('Analysis error:', error)
      toast({
        title: 'Analysis Failed',
        description: 'There was an error analyzing the deletion impact. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExecuteRTBF = async () => {
    if (!analysis || confirmationCode !== 'DELETE_ALL_DATA') return

    setIsDeleting(true)
    try {
      const result = await ComplianceService.executeRTBF(
        confirmationCode,
        analysis.analysis_id,
        checkedWarnings.size === analysis.warnings.length
      )
      
      setCompletionReceipt(result)
      
      if (result.status === 'completed') {
        toast({
          title: 'Account Deleted',
          description: 'Your account and all data have been permanently deleted.',
        })
        
        // Redirect to home after a delay
        setTimeout(() => {
          navigate('/')
        }, 5000)
      } else {
        toast({
          title: 'Deletion Failed',
          description: 'The deletion process encountered errors. Please contact support.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('RTBF execution error:', error)
      toast({
        title: 'Deletion Failed',
        description: (error as Error).message || 'The deletion process failed. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleWarningCheck = (index: number) => {
    const newChecked = new Set(checkedWarnings)
    if (newChecked.has(index)) {
      newChecked.delete(index)
    } else {
      newChecked.add(index)
    }
    setCheckedWarnings(newChecked)
  }

  const isDualControlVerified = analysis && 
    checkedWarnings.size === analysis.warnings.length && 
    confirmationCode === 'DELETE_ALL_DATA'

  if (completionReceipt) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <FileText className="h-5 w-5" />
            Deletion Complete
          </CardTitle>
          <CardDescription>
            Your account and data have been processed for deletion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive">Completed</Badge>
              <span className="text-sm text-muted-foreground">
                {completionReceipt.total_items_deleted} items deleted
              </span>
            </div>
            <p className="text-sm">
              Deletion ID: <code>{completionReceipt.deletion_id}</code>
            </p>
            <p className="text-sm">
              Completed: {new Date(completionReceipt.completed_at).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Deletion Log:</h4>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {completionReceipt.deletion_log.map((log, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <span>{log.step}</span>
                  <div className="flex items-center gap-2">
                    {log.count && <span className="text-muted-foreground">{log.count}</span>}
                    <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>You will be redirected to the homepage in a few seconds</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Right to be Forgotten (RTBF)
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data in compliance with GDPR/CCPA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-destructive mb-2">Warning: This Action Cannot Be Undone</h4>
                  <ul className="text-sm space-y-1">
                    <li>• All your content will be permanently deleted</li>
                    <li>• Other family members will lose access to content you created</li>
                    <li>• Your family tree connections will be severed</li>
                    <li>• Comments and reactions on your content will be removed</li>
                    <li>• Media files you uploaded will be deleted</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleAnalyzeImpact} 
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Analyzing Impact...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Analyze Deletion Impact
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Deletion Impact Analysis</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Content to be deleted:</p>
                  <ul className="space-y-1">
                    <li>{analysis.deletion_analysis.content_data.stories} stories</li>
                    <li>{analysis.deletion_analysis.content_data.comments} comments</li>
                    <li>{analysis.deletion_analysis.content_data.reactions} reactions</li>
                    <li>{analysis.deletion_analysis.content_data.media_files} media files</li>
                    <li>{analysis.deletion_analysis.content_data.answers} answers</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Impact:</p>
                  <ul className="space-y-1">
                    <li>Total items: {analysis.deletion_analysis.impact_analysis.total_items}</li>
                    <li>Affected families: {analysis.deletion_analysis.impact_analysis.affected_families}</li>
                    <li>Family names: {analysis.deletion_analysis.user_data.affected_families.join(', ')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {analysis.deletion_analysis.impact_analysis.shared_content_warnings.length > 0 && (
              <div className="bg-destructive/10 p-4 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Shared Content Warnings:</h4>
                <ul className="text-sm space-y-1">
                  {analysis.deletion_analysis.impact_analysis.shared_content_warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-medium">Confirmation Required (check all that apply):</h4>
              {analysis.warnings.map((warning, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Checkbox
                    id={`warning-${index}`}
                    checked={checkedWarnings.has(index)}
                    onCheckedChange={() => toggleWarningCheck(index)}
                  />
                  <label
                    htmlFor={`warning-${index}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {warning}
                  </label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type "DELETE_ALL_DATA" to confirm (required for dual-control):
              </Label>
              <Input
                id="confirmation"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="DELETE_ALL_DATA"
                className="font-mono"
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={!isDualControlVerified || isDeleting}
                  className="w-full"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting Account...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Execute Right to be Forgotten
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">
                    Final Confirmation: Delete All Data
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This is your final confirmation. Once you proceed:
                    <br /><br />
                    • {analysis.deletion_analysis.impact_analysis.total_items} items will be permanently deleted
                    <br />
                    • {analysis.deletion_analysis.impact_analysis.affected_families} families will be affected
                    <br />
                    • This action cannot be undone or stopped once started
                    <br /><br />
                    Are you absolutely certain you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleExecuteRTBF}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              variant="outline" 
              onClick={() => setAnalysis(null)}
              className="w-full"
            >
              Start Over
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}