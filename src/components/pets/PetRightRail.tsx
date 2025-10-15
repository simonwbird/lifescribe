import { Pet } from '@/lib/petTypes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Shield, AlertCircle } from 'lucide-react'

interface PetRightRailProps {
  pet: Pet
}

export function PetRightRail({ pet }: PetRightRailProps) {
  return (
    <div className="space-y-4">
      {/* Quick Facts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Facts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {pet.microchip?.number && (
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Microchipped</p>
                <p className="text-muted-foreground font-mono text-xs">
                  {pet.microchip.number}
                </p>
              </div>
            </div>
          )}
          
          {pet.vet && (
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">{pet.vet.name}</p>
                {pet.vet.phone && (
                  <p className="text-muted-foreground">{pet.vet.phone}</p>
                )}
              </div>
            </div>
          )}

          {pet.insurance?.provider && (
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Insured</p>
                <p className="text-muted-foreground">{pet.insurance.provider}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Alerts */}
      {(pet.health.allergies || pet.health.medications) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pet.health.allergies && (
              <Badge variant="destructive" className="w-full justify-start">
                Allergies: {pet.health.allergies}
              </Badge>
            )}
            {pet.health.medications && (
              <Badge variant="secondary" className="w-full justify-start">
                On medication
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {pet.tags && pet.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pet.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
