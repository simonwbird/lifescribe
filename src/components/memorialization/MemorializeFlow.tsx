import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useSubmitDeathVerification,
  useInitiateMemorialization,
  useCompleteMemorialization,
} from '@/hooks/useMemorialization';
import { Loader2, Heart, FileCheck, Users, AlertTriangle } from 'lucide-react';

interface MemorializeFlowProps {
  personId: string;
  personName: string;
  familyId: string;
  familyMembers: Array<{ id: string; name: string; avatar?: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'verify' | 'stewards' | 'confirm';

export function MemorializeFlow({
  personId,
  personName,
  familyId,
  familyMembers,
  open,
  onOpenChange,
}: MemorializeFlowProps) {
  const [step, setStep] = useState<Step>('verify');
  const [verificationType, setVerificationType] = useState('document');
  const [documentType, setDocumentType] = useState('death_certificate');
  const [deathDate, setDeathDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [adminOverride, setAdminOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedStewards, setSelectedStewards] = useState<string[]>([]);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const submitVerification = useSubmitDeathVerification();
  const initiateMemorialization = useInitiateMemorialization();
  const completeMemorialization = useCompleteMemorialization();

  const handleVerificationSubmit = async () => {
    const result = await submitVerification.mutateAsync({
      person_id: personId,
      family_id: familyId,
      verification_type: verificationType,
      document_type: documentType,
      death_date: deathDate,
      death_place: deathPlace,
      certificate_number: certificateNumber,
      issuing_authority: issuingAuthority,
      admin_override: adminOverride,
      override_reason: overrideReason,
    });

    setVerificationId(result.id);
    setStep('stewards');
  };

  const handleStewardsSubmit = async () => {
    if (selectedStewards.length === 0) {
      return;
    }
    setStep('confirm');
  };

  const handleComplete = async () => {
    if (!verificationId) return;

    // First initiate
    const initResult = await initiateMemorialization.mutateAsync({
      personId,
      verificationId,
      stewardIds: selectedStewards,
    });

    // Then complete
    await completeMemorialization.mutateAsync({
      memorializationId: initResult.memorialization_id,
      deathDate,
      personId,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep('verify');
    setVerificationType('document');
    setDeathDate('');
    setDeathPlace('');
    setCertificateNumber('');
    setIssuingAuthority('');
    setAdminOverride(false);
    setOverrideReason('');
    setSelectedStewards([]);
    setVerificationId(null);
  };

  const toggleSteward = (memberId: string) => {
    setSelectedStewards((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive" />
            Memorialize {personName}
          </DialogTitle>
          <DialogDescription>
            Convert this life page to a tribute page. This process is reversible by admins.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Death Verification */}
        {step === 'verify' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileCheck className="h-4 w-4" />
                  Step 1: Verify Death
                </CardTitle>
                <CardDescription>
                  Provide documentation or admin override to verify the passing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-type">Verification Type</Label>
                  <Select value={verificationType} onValueChange={setVerificationType}>
                    <SelectTrigger id="verification-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Official Document</SelectItem>
                      <SelectItem value="admin_override">Admin Override</SelectItem>
                      <SelectItem value="family_attestation">Family Attestation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {verificationType === 'document' && (
                  <div className="space-y-2">
                    <Label htmlFor="document-type">Document Type</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger id="document-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="death_certificate">Death Certificate</SelectItem>
                        <SelectItem value="obituary">Obituary</SelectItem>
                        <SelectItem value="funeral_notice">Funeral Notice</SelectItem>
                        <SelectItem value="legal_document">Legal Document</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="death-date">Date of Passing</Label>
                  <Input
                    id="death-date"
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="death-place">Place of Passing</Label>
                  <Input
                    id="death-place"
                    placeholder="City, State, Country"
                    value={deathPlace}
                    onChange={(e) => setDeathPlace(e.target.value)}
                  />
                </div>

                {verificationType === 'document' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="certificate-number">Certificate Number (Optional)</Label>
                      <Input
                        id="certificate-number"
                        placeholder="Certificate or document number"
                        value={certificateNumber}
                        onChange={(e) => setCertificateNumber(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issuing-authority">Issuing Authority (Optional)</Label>
                      <Input
                        id="issuing-authority"
                        placeholder="e.g., County Registrar"
                        value={issuingAuthority}
                        onChange={(e) => setIssuingAuthority(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {verificationType === 'admin_override' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="admin-override"
                        checked={adminOverride}
                        onCheckedChange={(checked) => setAdminOverride(checked as boolean)}
                      />
                      <Label htmlFor="admin-override" className="cursor-pointer">
                        I confirm this is an administrative override
                      </Label>
                    </div>

                    {adminOverride && (
                      <div className="space-y-2">
                        <Label htmlFor="override-reason">Override Reason</Label>
                        <Textarea
                          id="override-reason"
                          placeholder="Explain why documentation is unavailable..."
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleVerificationSubmit}
                disabled={
                  !deathDate ||
                  submitVerification.isPending ||
                  (verificationType === 'admin_override' && (!adminOverride || !overrideReason))
                }
              >
                {submitVerification.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Continue to Stewards
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Select Stewards */}
        {step === 'stewards' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Step 2: Select Stewards
                </CardTitle>
                <CardDescription>
                  Choose family members who will manage this tribute page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleSteward(member.id)}
                  >
                    <Checkbox
                      checked={selectedStewards.includes(member.id)}
                      onCheckedChange={() => toggleSteward(member.id)}
                    />
                    <Avatar className="h-8 w-8">
                      {member.avatar && <AvatarImage src={member.avatar} />}
                      <AvatarFallback>
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.name}</span>
                  </div>
                ))}
                {familyMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No family members available
                  </p>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('verify')}>
                Back
              </Button>
              <Button onClick={handleStewardsSubmit} disabled={selectedStewards.length === 0}>
                Continue to Review
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Step 3: Review & Confirm
                </CardTitle>
                <CardDescription>
                  Review the changes that will be made to this page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Changes to be applied:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>✓ Person status will change to "Passed"</li>
                    <li>✓ Death date: {deathDate}</li>
                    <li>✓ {selectedStewards.length} steward(s) will be assigned</li>
                    <li>✓ Life-only blocks (Now & Next) will be locked</li>
                    <li>✓ Owner posting rights will be disabled</li>
                    <li>✓ Co-curators will become contributors</li>
                    <li>✓ Page will convert to tribute preset</li>
                  </ul>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> This action is logged and can be reversed by
                    administrators if needed. All changes maintain a complete audit trail.
                  </p>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('stewards')}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleComplete}
                disabled={
                  completeMemorialization.isPending || initiateMemorialization.isPending
                }
              >
                {(completeMemorialization.isPending || initiateMemorialization.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Complete Memorialization
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
