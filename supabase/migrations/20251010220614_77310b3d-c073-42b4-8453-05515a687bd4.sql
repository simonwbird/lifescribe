-- Create audio_recordings table for voice notes
CREATE TABLE IF NOT EXISTS public.audio_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  tribute_id UUID REFERENCES public.tributes(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  transcript TEXT,
  is_draft BOOLEAN DEFAULT false,
  draft_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transcript_versions table for version history
CREATE TABLE IF NOT EXISTS public.transcript_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_recording_id UUID NOT NULL REFERENCES public.audio_recordings(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  transcript TEXT NOT NULL,
  edited_by UUID NOT NULL,
  edit_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(audio_recording_id, version_number)
);

-- Enable RLS
ALTER TABLE public.audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_versions ENABLE ROW LEVEL SECURITY;

-- Family members can view audio recordings
CREATE POLICY "Family members can view audio recordings"
ON public.audio_recordings FOR SELECT
USING (
  family_id IN (
    SELECT family_id FROM public.members WHERE profile_id = auth.uid()
  )
);

-- Family members can create audio recordings
CREATE POLICY "Family members can create audio recordings"
ON public.audio_recordings FOR INSERT
WITH CHECK (
  family_id IN (
    SELECT family_id FROM public.members WHERE profile_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Recording creators can update their recordings
CREATE POLICY "Recording creators can update their recordings"
ON public.audio_recordings FOR UPDATE
USING (created_by = auth.uid());

-- Family members can view transcript versions
CREATE POLICY "Family members can view transcript versions"
ON public.transcript_versions FOR SELECT
USING (
  audio_recording_id IN (
    SELECT id FROM public.audio_recordings
    WHERE family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  )
);

-- Family members can create transcript versions
CREATE POLICY "Family members can create transcript versions"
ON public.transcript_versions FOR INSERT
WITH CHECK (
  audio_recording_id IN (
    SELECT id FROM public.audio_recordings
    WHERE family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  )
  AND edited_by = auth.uid()
);

-- Create indexes
CREATE INDEX idx_audio_recordings_family_id ON public.audio_recordings(family_id);
CREATE INDEX idx_audio_recordings_story_id ON public.audio_recordings(story_id);
CREATE INDEX idx_audio_recordings_created_by ON public.audio_recordings(created_by);
CREATE INDEX idx_transcript_versions_recording_id ON public.transcript_versions(audio_recording_id);