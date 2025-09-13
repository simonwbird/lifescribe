import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Users, FileSpreadsheet, TreePine } from 'lucide-react'
import { FamilyTreeService } from '@/lib/familyTreeV2Service'
import { GedcomImportService } from '@/lib/gedcomImportService'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

const FamilyTreeV2 = () => {
  const navigate = useNavigate()
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [treeData, setTreeData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Get user's family
      const { data: membership } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (membership) {
        setFamilyId(membership.family_id)
        const data = await FamilyTreeService.getTreeData(membership.family_id)
        setTreeData(data)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGedcomUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !familyId || !userId) return

    try {
      setLoading(true)
      const content = await file.text()
      const preview = await GedcomImportService.previewImport(content, familyId)
      
      if (preview.duplicates.length > 0) {
        toast.warning(`Found ${preview.duplicates.length} potential duplicates. Review needed.`)
      }

      await GedcomImportService.commitImport(preview, familyId, userId)
      toast.success(`Imported ${preview.peopleCount} people and ${preview.familiesCount} families`)
      
      // Reload data
      const data = await FamilyTreeService.getTreeData(familyId)
      setTreeData(data)
    } catch (error) {
      toast.error('Import failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!treeData || treeData.people.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center mb-8">
          <TreePine className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Build Your Family Tree</h1>
          <p className="text-muted-foreground">
            Start mapping your family connections and relationships
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Start from Scratch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Begin with yourself and add family members one by one
              </p>
              <Button 
                className="w-full"
                onClick={() => navigate('/family-tree/quick-start')}
              >
                Quick Start
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import GEDCOM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your existing family tree from other software
              </p>
              <input
                type="file"
                accept=".ged"
                onChange={handleGedcomUpload}
                className="hidden"
                id="gedcom-upload"
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => document.getElementById('gedcom-upload')?.click()}
              >
                Choose File
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Import CSV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload people and relationships from spreadsheets
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/family-tree/csv-import')}
              >
                Import CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Family Tree</h1>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".ged"
            onChange={handleGedcomUpload}
            className="hidden"
            id="gedcom-upload-existing"
          />
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('gedcom-upload-existing')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import GED
          </Button>
          <Button variant="outline" onClick={() => navigate('/family-tree/explorer')}>
            Family Explorer
          </Button>
          <Button variant="outline" onClick={() => navigate('/family-tree/fan')}>
            Ancestor Fan
          </Button>
        </div>
      </div>
      
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-4">
          You have {treeData.people.length} people in your family tree
        </p>
        <Button onClick={() => navigate('/family-tree/explorer')}>
          Explore Tree
        </Button>
      </div>
    </div>
  )
}

export default FamilyTreeV2