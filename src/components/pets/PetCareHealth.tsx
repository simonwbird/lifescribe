import { Pet } from '@/lib/petTypes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PetCareHealthProps {
  pet: Pet
}

export function PetCareHealth({ pet }: PetCareHealthProps) {
  return (
    <div className="space-y-6">
      {/* Veterinarian */}
      {pet.vet && (
        <Card>
          <CardHeader>
            <CardTitle>Veterinarian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{pet.vet.name}</p>
              {pet.vet.phone && (
                <p className="text-sm text-muted-foreground">{pet.vet.phone}</p>
              )}
              {pet.vet.email && (
                <p className="text-sm text-muted-foreground">{pet.vet.email}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Identification */}
      {pet.microchip?.number && (
        <Card>
          <CardHeader>
            <CardTitle>Microchip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Number</p>
              <p className="font-mono">{pet.microchip.number}</p>
            </div>
            {pet.microchip.provider && (
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p>{pet.microchip.provider}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Insurance */}
      {pet.insurance?.provider && (
        <Card>
          <CardHeader>
            <CardTitle>Insurance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Provider</p>
              <p>{pet.insurance.provider}</p>
            </div>
            {pet.insurance.policy && (
              <div>
                <p className="text-sm text-muted-foreground">Policy Number</p>
                <p className="font-mono">{pet.insurance.policy}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Health */}
      <Card>
        <CardHeader>
          <CardTitle>Health Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pet.health.weightKg && (
            <div>
              <p className="text-sm text-muted-foreground">Weight</p>
              <p>{pet.health.weightKg} kg</p>
            </div>
          )}
          {pet.health.diet && (
            <div>
              <p className="text-sm text-muted-foreground">Diet</p>
              <p>{pet.health.diet}</p>
            </div>
          )}
          {pet.health.allergies && (
            <div>
              <p className="text-sm text-muted-foreground">Allergies</p>
              <Badge variant="destructive">{pet.health.allergies}</Badge>
            </div>
          )}
          {pet.health.medications && (
            <div>
              <p className="text-sm text-muted-foreground">Medications</p>
              <p>{pet.health.medications}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Care Instructions */}
      {pet.careInstructions && (
        <Card>
          <CardHeader>
            <CardTitle>Care Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{pet.careInstructions}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
