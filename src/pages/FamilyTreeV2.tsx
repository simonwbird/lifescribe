import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Users, FileSpreadsheet, TreePine } from 'lucide-react'
import { FamilyTreeService } from '@/lib/familyTreeV2Service'
import { GedcomImportService } from '@/lib/gedcomImportService'
import { CsvImportService } from '@/lib/csvImportService'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import FamilyExplorerWrapper from '@/components/familyTreeV2/FamilyExplorerWrapper'
import { FamilyDataEditor } from '@/components/family-tree/FamilyDataEditor'
import { GedcomImportModal } from '@/components/family-tree/GedcomImportModal'
import { useLabs } from '@/hooks/useLabs'

const FamilyTreeV2 = () => {
  const navigate = useNavigate()
  const { labsEnabled, flags } = useLabs()
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [treeData, setTreeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDataEditor, setShowDataEditor] = useState(false)
  const [showGedcomImport, setShowGedcomImport] = useState(false)

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

  const handleGedcomUpload = () => {
    if (!labsEnabled || !flags.gedcomImport) {
      toast.error('GEDCOM import is available in Labs. Enable it in your profile settings.')
      return
    }
    // Open safe import modal instead of direct upload
    setShowGedcomImport(true)
  }

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!labsEnabled || !flags.gedcomImport) {
      toast.error('CSV import is available in Labs. Enable it in your profile settings.')
      return
    }
    
    const files = event.target.files
    if (!files || files.length === 0 || !familyId || !userId) return

    try {
      setLoading(true)
      
      // Handle single combined CSV file
      const file = files[0]
      const content = await file.text()
      
      // Try parsing as combined CSV first
      const combined = CsvImportService.parseCombinedCsv(content)
      
      if (combined.people.length === 0) {
        toast.error('No valid people data found in CSV file')
        return
      }

      // Create preview
      const preview = {
        people: combined.people,
        relationships: combined.relationships,
        peopleCount: combined.people.length,
        familiesCount: new Set(combined.relationships.map(r => r.family_id)).size,
        childrenCount: combined.relationships.filter(r => r.rel_type === 'parent').length,
        duplicates: []
      }

      // Commit the import
      await CsvImportService.commitCsvImport(preview, familyId, userId)
      
      const relationshipText = combined.relationships.length > 0 
        ? `, ${preview.familiesCount} families, and ${preview.childrenCount} relationships`
        : ''
      
      toast.success(`Successfully imported ${preview.peopleCount} people${relationshipText} from CSV`)
      
      // Reload tree data
      const data = await FamilyTreeService.getTreeData(familyId)
      setTreeData(data)
      
    } catch (error) {
      console.error('CSV import error:', error)
      toast.error('CSV import failed: ' + error.message)
    } finally {
      setLoading(false)
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </>
    )
  }

  if (!treeData || treeData.people.length === 0) {
    return (
      <>
        <Header />
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

            {labsEnabled && flags.gedcomImport && (
              <>
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
                      Upload people and relationships in one CSV file
                    </p>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => CsvImportService.downloadCombinedTemplate()}
                        className="w-full"
                      >
                        📥 Download CSV Template
                      </Button>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden"
                        id="csv-upload"
                      />
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => document.getElementById('csv-upload')?.click()}
                      >
                        Import CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Family Tree</h1>
          <p className="text-muted-foreground mt-1">Have a memory, story or photo? Click on any person to add it to their profile</p>
          <div className="flex gap-2">
            {labsEnabled && flags.gedcomImport && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleGedcomUpload}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Safe Import GED
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                  id="csv-upload-existing"
                />
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('csv-upload-existing')?.click()}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                  <button 
                    onClick={() => CsvImportService.downloadCombinedTemplate()}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Download CSV template
                  </button>
                </div>
              </>
            )}
            <Button 
              variant="outline" 
              onClick={() => setShowDataEditor(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Edit Data
            </Button>
          </div>
        </div>
        
        <div className="mt-6">
          <FamilyExplorerWrapper familyId={familyId} />
        </div>
      </div>
      
      <FamilyDataEditor
        open={showDataEditor}
        onOpenChange={setShowDataEditor}
        familyId={familyId || ''}
        onDataChange={() => {
          // Force refresh of the family tree
          loadUserData()
        }}
      />
      
      <GedcomImportModal
        open={showGedcomImport && labsEnabled && flags.gedcomImport}
        onOpenChange={setShowGedcomImport}
        familyId={familyId || ''}
        userId={userId || ''}
        onImportComplete={() => {
          // Force refresh of the family tree
          loadUserData()
        }}
      />
    </>
  )
}

export default FamilyTreeV2