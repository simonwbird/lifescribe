import React, { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Share2, Link2, QrCode, FileDown, Loader2 } from 'lucide-react'
import html2pdf from 'html2pdf.js'

interface ShareExportProps {
  personId: string
  familyId: string
  personName: string
  isMemorialized: boolean
  canExportPDF?: boolean // Steward or higher
}

interface PersonData {
  given_name: string
  surname: string | null
  birth_date: string | null
  death_date: string | null
  bio: string | null
  avatar_url: string | null
}

export function ShareExport({ 
  personId, 
  familyId,
  personName,
  isMemorialized,
  canExportPDF = false 
}: ShareExportProps) {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { toast } = useToast()

  const getCanonicalURL = () => {
    return `${window.location.origin}/people/${personId}`
  }

  const handleCopyLink = async () => {
    try {
      const url = getCanonicalURL()
      await navigator.clipboard.writeText(url)
      toast({
        title: "Link copied",
        description: "Page link copied to clipboard"
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive"
      })
    }
  }

  const handleCreateQR = async () => {
    setIsGeneratingQR(true)
    try {
      const url = getCanonicalURL()
      const qrCode = require('qrcode')
      
      // Create canvas and generate QR code
      const canvas = document.createElement('canvas')
      await qrCode.toCanvas(canvas, url, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      // Download the canvas as PNG
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `${personName.replace(/\s+/g, '-')}-QR.png`
      link.href = dataUrl
      link.click()
      
      toast({
        title: "QR Code created",
        description: "QR code downloaded successfully"
      })
    } catch (error) {
      console.error('QR generation error:', error)
      toast({
        title: "QR generation failed",
        description: "Could not create QR code",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleExportPDF = async () => {
    if (!canExportPDF) {
      toast({
        title: "Permission denied",
        description: "Only stewards can export PDFs",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingPDF(true)
    try {
      // Fetch person data
      const { data: person, error: personError } = await supabase
        .from('people')
        .select('given_name, surname, birth_date, death_date, bio, avatar_url')
        .eq('id', personId)
        .single()

      if (personError) throw personError

      // Fetch top 6 photos
      const { data: photos, error: photosError } = await supabase
        .from('media')
        .select('file_path')
        .eq('family_id', familyId)
        .like('mime_type', 'image/%')
        .order('created_at', { ascending: false })
        .limit(6)

      if (photosError) throw photosError

      // Generate signed URLs for images
      const photoUrls = await Promise.all(
        (photos || []).map(async (photo) => {
          const { data } = await supabase.storage
            .from('media')
            .createSignedUrl(photo.file_path, 3600)
          return data?.signedUrl || ''
        })
      )

      // Get avatar image URL
      let avatarUrl = ''
      if (person.avatar_url) {
        const { data } = await supabase.storage
          .from('media')
          .createSignedUrl(person.avatar_url, 3600)
        avatarUrl = data?.signedUrl || ''
      }

      // Generate QR code as data URL
      const qrCode = require('qrcode')
      const qrDataUrl = await qrCode.toDataURL(getCanonicalURL(), {
        width: 200,
        margin: 1
      })

      // Create PDF content
      const pdfContent = `
        <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
          ${avatarUrl ? `<img src="${avatarUrl}" style="width: 100%; max-height: 400px; object-fit: cover; margin-bottom: 30px;" />` : ''}
          
          <h1 style="font-size: 36px; margin-bottom: 10px; color: #1a1a1a;">
            ${person.given_name}${person.surname ? ` ${person.surname}` : ''}
          </h1>
          
          ${person.birth_date ? `
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              ${new Date(person.birth_date).toLocaleDateString()}${person.death_date ? ` - ${new Date(person.death_date).toLocaleDateString()}` : ''}
            </p>
          ` : ''}
          
          ${person.bio ? `
            <div style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px; page-break-inside: avoid;">
              <h2 style="font-size: 20px; margin-bottom: 15px; color: #1a1a1a;">Biography</h2>
              <p>${person.bio}</p>
            </div>
          ` : ''}
          
          ${photoUrls.length > 0 ? `
            <div style="margin-top: 30px; page-break-before: always;">
              <h2 style="font-size: 20px; margin-bottom: 20px; color: #1a1a1a;">Highlights</h2>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                ${photoUrls.filter(url => url).map(url => `
                  <div style="page-break-inside: avoid;">
                    <img src="${url}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div style="margin-top: 40px; text-align: center; page-break-before: always; padding-top: 40px;">
            <img src="${qrDataUrl}" style="width: 200px; height: 200px;" />
            <p style="font-size: 12px; color: #666; margin-top: 10px;">Scan to view online</p>
            <p style="font-size: 10px; color: #999; margin-top: 5px;">${getCanonicalURL()}</p>
          </div>
        </div>
      `

      // Generate PDF
      const element = document.createElement('div')
      element.innerHTML = pdfContent
      
      const opt = {
        margin: 10,
        filename: `${personName.replace(/\s+/g, '-')}-Memorial.pdf`,
        image: { type: 'jpeg' as const, quality: 0.85 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      }

      await html2pdf().set(opt).from(element).save()

      toast({
        title: "PDF exported",
        description: "Memorial PDF downloaded successfully"
      })
    } catch (error) {
      console.error('PDF export error:', error)
      toast({
        title: "Export failed",
        description: "Could not generate PDF",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share & Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={handleCopyLink}
        >
          <Link2 className="h-3 w-3 mr-2" />
          Copy Link
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={handleCreateQR}
          disabled={isGeneratingQR}
        >
          {isGeneratingQR ? (
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          ) : (
            <QrCode className="h-3 w-3 mr-2" />
          )}
          Create QR Code
        </Button>
        
        {canExportPDF && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-3 w-3 mr-2" />
            )}
            Export PDF
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
