import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, X, Loader2, Target, Edit3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useBugReporting, BugReportData, PossibleDuplicate } from '@/hooks/useBugReporting';
import { ElementPicker } from './ElementPicker';
import { ScreenshotAnnotator } from './ScreenshotAnnotator';
import { DuplicateHandler } from './DuplicateHandler';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BugReportModal = ({ isOpen, onClose }: BugReportModalProps) => {
  const { captureScreenshot, submitBugReport: submitBugReportAPI, checkForDuplicates } = useBugReporting();
  const [formData, setFormData] = useState<BugReportData>({
    title: '',
    expectedBehavior: '',
    actualBehavior: '',
    notes: '',
    severity: 'Medium',
    consentDeviceInfo: false,
    consentConsoleInfo: false,
    selectedElement: undefined
  });
  
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [uploads, setUploads] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [duplicates, setDuplicates] = useState<PossibleDuplicate[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [showElementPicker, setShowElementPicker] = useState(false);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [showDuplicateHandler, setShowDuplicateHandler] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof BugReportData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check for duplicates when title changes
    if (field === 'title' && typeof value === 'string' && value.trim().length > 3) {
      debounceCheckDuplicates(value);
    }
  };

  const debounceCheckDuplicates = (() => {
    let timeout: NodeJS.Timeout;
    return (title: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        setCheckingDuplicates(true);
        try {
          const possibleDupes = await checkForDuplicates(title, window.location.pathname);
          setDuplicates(possibleDupes);
        } catch (error) {
          console.error('Error checking duplicates:', error);
        } finally {
          setCheckingDuplicates(false);
        }
      }, 500);
    };
  })();

  const handleCaptureScreenshot = async () => {
    setIsCapturing(true);
    try {
      const screenshotData = await captureScreenshot();
      if (screenshotData) {
        setCurrentScreenshot(screenshotData);
        setShowAnnotator(true);
      }
    } catch (error) {
      toast({
        title: "Screenshot failed",
        description: "Unable to capture screenshot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleAnnotatedScreenshot = async (annotatedDataUrl: string) => {
    try {
      // Convert data URL to File
      const response = await fetch(annotatedDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `annotated-screenshot-${Date.now()}.png`, { type: 'image/png' });
      
      if (screenshots.length < 1) { // Limit to 1 screenshot for now
        setScreenshots(prev => [...prev, file]);
        toast({
          title: "Annotated screenshot saved",
          description: "Your annotated screenshot has been added to your bug report."
        });
      } else {
        toast({
          title: "Screenshot limit reached",
          description: "You can only attach 1 screenshot per bug report.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to save screenshot",
        description: "Unable to save annotated screenshot.",
        variant: "destructive"
      });
    }
    
    setShowAnnotator(false);
    setCurrentScreenshot(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => file.size <= 20 * 1024 * 1024); // 20MB limit
    
    if (uploads.length + validFiles.length <= 3) {
      setUploads(prev => [...prev, ...validFiles]);
    } else {
      toast({
        title: "Upload limit reached",
        description: "You can only upload up to 3 files per bug report.",
        variant: "destructive"
      });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number, type: 'screenshot' | 'upload') => {
    if (type === 'screenshot') {
      setScreenshots(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploads(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleElementSelected = (elementInfo: any) => {
    setFormData(prev => ({ ...prev, selectedElement: elementInfo }));
    setShowElementPicker(false);
    toast({
      title: "Element selected",
      description: `Selected: ${elementInfo.element} - ${elementInfo.fallbackText}`
    });
  };

  const removeSelectedElement = () => {
    setFormData(prev => ({ ...prev, selectedElement: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your bug report.",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates before submitting
    if (duplicates.length > 0) {
      setShowDuplicateHandler(true);
      return;
    }

    await handleBugReportSubmission();
  };

  const handleBugReportSubmission = async (forceCreate = false) => {
    setIsSubmitting(true);
    
    try {
      const result = await submitBugReportAPI(formData, screenshots, uploads);
      
      if (result.success) {
        toast({
          title: "Bug report submitted",
          description: `Your bug report has been submitted with ID: ${result.bugId}. Our team will review it soon.`
        });
        
        resetForm();
        onClose();
      } else {
        toast({
          title: "Submission failed",
          description: result.error || "Unable to submit bug report. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Submission error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      expectedBehavior: '',
      actualBehavior: '',
      notes: '',
      severity: 'Medium',
      consentDeviceInfo: false,
      consentConsoleInfo: false,
      selectedElement: undefined
    });
    setScreenshots([]);
    setUploads([]);
    setDuplicates([]);
  };

  const handleAddComment = async (bugId: string) => {
    // TODO: Implement adding comment to existing bug
    toast({
      title: "Feature coming soon",
      description: "Adding comments to existing bugs will be available soon."
    });
    setShowDuplicateHandler(false);
  };

  // Close modal handlers
  useEffect(() => {
    if (!isOpen) {
      setShowElementPicker(false);
      setShowAnnotator(false);
      setCurrentScreenshot(null);
      setShowDuplicateHandler(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Report a Bug
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected">Expected Behavior</Label>
              <Textarea
                id="expected"
                value={formData.expectedBehavior}
                onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
                placeholder="What should have happened?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual">Actual Behavior</Label>
              <Textarea
                id="actual"
                value={formData.actualBehavior}
                onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
                placeholder="What actually happened?"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional context or steps to reproduce"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={formData.severity} onValueChange={(value) => handleInputChange('severity', value as 'Low' | 'Medium' | 'High')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Element Selection */}
          <div className="space-y-2">
            <Label>Element Selection (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowElementPicker(true)}
                disabled={showElementPicker}
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                {formData.selectedElement ? 'Change Element' : 'Select Element'}
              </Button>
            </div>
            
            {formData.selectedElement && (
              <div className="p-3 bg-muted rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">Selected:</span> {formData.selectedElement.element} - {formData.selectedElement.fallbackText}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeSelectedElement}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Selector: <code className="bg-background px-1 rounded">{formData.selectedElement.selector}</code>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label>Attachments</Label>
            
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCaptureScreenshot}
                disabled={screenshots.length >= 1 || isCapturing}
                className="flex items-center gap-2"
              >
                {isCapturing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                {screenshots.length > 0 ? 'Retake Screenshot' : 'Capture & Annotate'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploads.length >= 3}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.log"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Display attached files */}
            {(screenshots.length > 0 || uploads.length > 0) && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Attached Files:</Label>
                <div className="space-y-1">
                  {screenshots.map((file, index) => (
                    <div key={`screenshot-${index}`} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                      <span className="text-sm">📸 {file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index, 'screenshot')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {uploads.map((file, index) => (
                    <div key={`upload-${index}`} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                      <span className="text-sm">📎 {file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index, 'upload')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Possible Duplicates */}
          {duplicates.length > 0 && (
            <div className="space-y-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  ⚠️ Possible Duplicates Found
                </span>
                {checkingDuplicates && <div className="animate-pulse text-xs text-muted-foreground">Checking...</div>}
              </div>
              <div className="space-y-1">
                {duplicates.map((dup) => (
                  <div key={dup.id} className="text-xs text-yellow-700 dark:text-yellow-300">
                    • {dup.title} ({dup.status}) - {new Date(dup.created_at).toLocaleDateString()}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">Privacy & Consent</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="consentDevice"
                checked={formData.consentDeviceInfo}
                onCheckedChange={(checked) => handleInputChange('consentDeviceInfo', !!checked)}
              />
              <Label htmlFor="consentDevice" className="text-sm">
                Attach device information (browser, OS, screen size) to help debug
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consentConsole"
                checked={formData.consentConsoleInfo}
                onCheckedChange={(checked) => handleInputChange('consentConsoleInfo', !!checked)}
              />
              <Label htmlFor="consentConsole" className="text-sm">
                Attach UI events and console logs (errors/warnings only) for better debugging
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Bug Report'
              )}
            </Button>
          </div>
        </form>

        {/* Element Picker Overlay */}
        <ElementPicker
          isActive={showElementPicker}
          onElementSelected={handleElementSelected}
          onCancel={() => setShowElementPicker(false)}
        />

        {/* Screenshot Annotator */}
        {showAnnotator && currentScreenshot && (
          <ScreenshotAnnotator
            imageDataUrl={currentScreenshot}
            onSave={handleAnnotatedScreenshot}
            onCancel={() => {
              setShowAnnotator(false);
              setCurrentScreenshot(null);
            }}
          />
        )}

        {/* Duplicate Handler */}
        <DuplicateHandler
          isOpen={showDuplicateHandler}
          duplicates={duplicates}
          onAddComment={handleAddComment}
          onCreateNew={() => {
            setShowDuplicateHandler(false);
            handleBugReportSubmission(true);
          }}
          onCancel={() => setShowDuplicateHandler(false)}
        />
      </DialogContent>
    </Dialog>
  );
};