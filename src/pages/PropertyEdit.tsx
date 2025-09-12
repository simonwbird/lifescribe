import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PropertyService } from '@/lib/propertyService'
import type { PropertyStatus, PropertyWithDetails } from '@/lib/propertyTypes'
import { PROPERTY_STATUS_LABELS } from '@/lib/propertyTypes'

export default function PropertyEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [property, setProperty] = useState<PropertyWithDetails | null>(null)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<PropertyStatus>('current')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await PropertyService.getProperty(id)
        if (data) {
          setProperty(data)
          setTitle(data.display_title || '')
          setStatus((data.status || 'current') as PropertyStatus)
          setDescription(data.description || '')
          document.title = `Edit Property · ${data.display_title || 'Property'}`
        }
      } catch (e) {
        console.error(e)
        toast({ title: 'Error', description: 'Failed to load property', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, toast])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await PropertyService.updateProperty(id, {
        display_title: title,
        status,
        description,
      })
      if (updated) {
        toast({ title: 'Saved', description: 'Property updated successfully.' })
        navigate(`/properties/${id}`)
      } else {
        throw new Error('Update failed')
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'Could not save changes.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Edit Property</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="text-muted-foreground">Loading…</div>
              ) : property ? (
                <>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., The Bird Family Home"
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v: PropertyStatus) => setStatus(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover">
                        {Object.entries(PROPERTY_STATUS_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Overview and why this place matters…"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">Property not found.</div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGate>
  )
}
