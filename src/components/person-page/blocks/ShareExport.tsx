import React, { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Share2, Link2, QrCode as QrCodeIcon, FileDown, Loader2 } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import QRCode from 'qrcode'

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
      
      // Create canvas and generate QR code
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, url, {
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

      if (personError) {
        console.error('Error fetching person:', personError)
        throw new Error('Failed to fetch person data')
      }

      // Generate QR code as data URL first (before any async operations)
      const qrDataUrl = await QRCode.toDataURL(getCanonicalURL(), {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'M'
      })

      // Fetch top 6 photos linked to this person
      const { data: photos, error: photosError } = await supabase
        .from('media')
        .select('file_path, created_at')
        .eq('family_id', familyId)
        .like('mime_type', 'image/%')
        .contains('linked_people', [personId])
        .order('created_at', { ascending: false })
        .limit(6)

      if (photosError) {
        console.error('Error fetching photos:', photosError)
        // Continue without photos
      }

      // Generate signed URLs for images (parallelized)
      const photoUrls: string[] = []
      if (photos && photos.length > 0) {
        const results = await Promise.allSettled(
          photos.map((photo) =>
            supabase.storage.from('media').createSignedUrl(photo.file_path, 3600)
          )
        )
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value.data?.signedUrl) {
            photoUrls.push(r.value.data.signedUrl)
          }
        })
      }

      // Get avatar image URL (signed) if available
      let avatarUrl = ''
      if (person.avatar_url) {
        try {
          const { data } = await supabase.storage
            .from('media')
            .createSignedUrl(person.avatar_url, 3600)
          if (data?.signedUrl) {
            avatarUrl = data.signedUrl
          }
        } catch (err) {
          console.error('Error creating avatar signed URL:', err)
        }
      }

      // Escape HTML in bio text
      const escapedBio = person.bio ? person.bio.replace(/[<>]/g, '').replace(/\n/g, '<br/>') : ''
      const fullName = `${person.given_name}${person.surname ? ` ${person.surname}` : ''}`
      const dateRange = person.birth_date
        ? `${new Date(person.birth_date).toLocaleDateString()}${person.death_date ? ` — ${new Date(person.death_date).toLocaleDateString()}` : ''}`
        : ''

      // Create styled PDF content
      const pdfContent = `
        <div id="pdf-root" style="font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111; padding: 28px; max-width: 820px; margin:0 auto;">
          <style>
            .cover{page-break-after: always;}
            .hero{height: 260px; border-radius: 12px; position: relative; overflow: hidden; ${avatarUrl ? `background: url('${avatarUrl}') center/cover no-repeat;` : 'background: linear-gradient(135deg,#e8f0ff,#f4f9ff);'} }
            .hero::after{content:'';position:absolute;inset:0;background:rgba(0,0,0,0.35);}
            .title{position:absolute;bottom:24px;left:24px;right:24px;color:#fff;}
            .name{font-size:28px;font-weight:700;margin:0 0 6px 0;}
            .dates{font-size:12px;opacity:.95;margin:0;}
            .section{margin-top:24px;}
            .h2{font-size:18px;font-weight:600;margin:0 0 12px 0;color:#111;}
            .bio{font-size:14px;line-height:1.6;color:#333;}
            .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
            .ph{width:100%;height:160px;object-fit:cover;border-radius:8px;}
            .qr{page-break-before: always;text-align:center;padding-top:24px;}
            .url{font-size:10px;color:#777;margin-top:6px;word-break:break-all;}
            .caption{font-size:12px;color:#666;margin-top:8px;}
          </style>

          <div class="cover">
            <div class="hero">
              <div class="title">
                <h1 class="name">${fullName}</h1>
                ${dateRange ? `<p class="dates">${dateRange}</p>` : ''}
              </div>
            </div>
            ${escapedBio ? `<div class="section"><h2 class="h2">Biography</h2><div class="bio">${escapedBio}</div></div>` : ''}
          </div>

          ${photoUrls.length > 0 ? `
            <div class="section" style="page-break-inside: avoid;">
              <h2 class="h2">Highlights</h2>
              <div class="grid">
                ${photoUrls.map(url => `<img src="${url}" class="ph" alt="" crossorigin="anonymous" />`).join('')}
              </div>
            </div>
          ` : ''}

          <div class="qr">
            <img src="${qrDataUrl}" width="180" height="180" alt="QR code" />
            <div class="caption">Scan to view online</div>
            <div class="url">${getCanonicalURL()}</div>
          </div>
        </div>
      `

      // Generate PDF with error handling
      const element = document.createElement('div')
      element.innerHTML = pdfContent
      document.body.appendChild(element)
      
      try {
        // Ensure images are loaded before rendering
        const waitForImages = async (root: HTMLElement, timeoutMs = 4000) => {
          const imgs = Array.from(root.querySelectorAll('img'))
          await Promise.all(
            imgs.map((img) =>
              new Promise<void>((resolve) => {
                if ((img as HTMLImageElement).complete) return resolve()
                const done = () => resolve()
                img.addEventListener('load', done, { once: true })
                img.addEventListener('error', done, { once: true })
                setTimeout(done, timeoutMs)
              })
            )
          )
        }

        await waitForImages(element)

        const opt = {
          margin: 10,
          filename: `${personName.replace(/\s+/g, '-')}-Memorial.pdf`,
          image: { type: 'jpeg' as const, quality: 0.9 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        }

        await html2pdf().set(opt).from(element).save()
        
        toast({
          title: "PDF exported",
          description: "Memorial PDF downloaded successfully"
        })
      } finally {
        document.body.removeChild(element)
      }
    } catch (error) {
      console.error('PDF export error:', error)
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not generate PDF. Please try again.",
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
            <QrCodeIcon className="h-3 w-3 mr-2" />
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
