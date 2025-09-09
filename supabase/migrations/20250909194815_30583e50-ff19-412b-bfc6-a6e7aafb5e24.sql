-- Create enums
CREATE TYPE public.role_type AS ENUM ('admin', 'member', 'guest');
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'expired');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create families table
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create members table (join table between profiles and families)
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.role_type NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(family_id, profile_id)
);

-- Create invites table
CREATE TABLE public.invites (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.role_type NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (id)
);

-- Create questions table (prompts)
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create answers table (responses to prompts)
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create media table (for file attachments)
CREATE TABLE public.media (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT media_target_check CHECK (
    (story_id IS NOT NULL AND answer_id IS NULL) OR
    (story_id IS NULL AND answer_id IS NOT NULL)
  )
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT comments_target_check CHECK (
    (story_id IS NOT NULL AND answer_id IS NULL) OR
    (story_id IS NULL AND answer_id IS NOT NULL)
  )
);

-- Create reactions table
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT reactions_target_check CHECK (
    (story_id IS NOT NULL AND answer_id IS NULL AND comment_id IS NULL) OR
    (story_id IS NULL AND answer_id IS NOT NULL AND comment_id IS NULL) OR
    (story_id IS NULL AND answer_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE(story_id, answer_id, comment_id, profile_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Families policies
CREATE POLICY "Family members can view family" ON public.families FOR SELECT 
  USING (id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "Family admins can update family" ON public.families FOR UPDATE 
  USING (id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can create families" ON public.families FOR INSERT 
  WITH CHECK (created_by = auth.uid());

-- Members policies
CREATE POLICY "Family members can view members" ON public.members FOR SELECT 
  USING (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "Family admins can manage members" ON public.members FOR ALL 
  USING (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can join families" ON public.members FOR INSERT 
  WITH CHECK (profile_id = auth.uid());

-- Invites policies
CREATE POLICY "Family members can view invites" ON public.invites FOR SELECT 
  USING (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "Family admins can manage invites" ON public.invites FOR ALL 
  USING (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid() AND role = 'admin'));

-- Questions policies (public read)
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);

-- Stories policies
CREATE POLICY "Family members can view stories" ON public.stories FOR SELECT 
  USING (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "Family members can create stories" ON public.stories FOR INSERT 
  WITH CHECK (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()) AND profile_id = auth.uid());
CREATE POLICY "Story authors can update stories" ON public.stories FOR UPDATE 
  USING (profile_id = auth.uid());
CREATE POLICY "Story authors can delete stories" ON public.stories FOR DELETE 
  USING (profile_id = auth.uid());

-- Answers policies
CREATE POLICY "Family members can view answers" ON public.answers FOR SELECT 
  USING (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "Family members can create answers" ON public.answers FOR INSERT 
  WITH CHECK (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()) AND profile_id = auth.uid());
CREATE POLICY "Answer authors can update answers" ON public.answers FOR UPDATE 
  USING (profile_id = auth.uid());
CREATE POLICY "Answer authors can delete answers" ON public.answers FOR DELETE 
  USING (profile_id = auth.uid());

-- Media policies
CREATE POLICY "Family members can view media" ON public.media FOR SELECT 
  USING (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "Family members can create media" ON public.media FOR INSERT 
  WITH CHECK (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()) AND profile_id = auth.uid());
CREATE POLICY "Media authors can update media" ON public.media FOR UPDATE 
  USING (profile_id = auth.uid());
CREATE POLICY "Media authors can delete media" ON public.media FOR DELETE 
  USING (profile_id = auth.uid());

-- Comments policies
CREATE POLICY "Family members can view comments" ON public.comments FOR SELECT 
  USING (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "Family members can create comments" ON public.comments FOR INSERT 
  WITH CHECK (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()) AND profile_id = auth.uid());
CREATE POLICY "Comment authors can update comments" ON public.comments FOR UPDATE 
  USING (profile_id = auth.uid());
CREATE POLICY "Comment authors can delete comments" ON public.comments FOR DELETE 
  USING (profile_id = auth.uid());

-- Reactions policies
CREATE POLICY "Family members can view reactions" ON public.reactions FOR SELECT 
  USING (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "Family members can create reactions" ON public.reactions FOR INSERT 
  WITH CHECK (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()) AND profile_id = auth.uid());
CREATE POLICY "Reaction authors can update reactions" ON public.reactions FOR UPDATE 
  USING (profile_id = auth.uid());
CREATE POLICY "Reaction authors can delete reactions" ON public.reactions FOR DELETE 
  USING (profile_id = auth.uid());

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON public.families FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON public.answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert seed questions
INSERT INTO public.questions (category, question_text) VALUES
('childhood','What is your earliest memory?'),
('music','What music did you listen to in your 20s?'),
('travel','What was your favourite holiday and why?'),
('mischief','What mischief did you get up to when you were young?'),
('love','How did you meet your partner?'),
('food','What family recipe should never be lost?'),
('work','What was your first job and what did it teach you?'),
('family','Who were you named after, and what does your name mean to you?'),
('firsts','What was your first big purchase and how did it feel?'),
('wisdom','What advice would you give your younger self?');

-- Create indexes for performance
CREATE INDEX idx_members_family_id ON public.members(family_id);
CREATE INDEX idx_members_profile_id ON public.members(profile_id);
CREATE INDEX idx_stories_family_id ON public.stories(family_id);
CREATE INDEX idx_stories_profile_id ON public.stories(profile_id);
CREATE INDEX idx_answers_family_id ON public.answers(family_id);
CREATE INDEX idx_answers_profile_id ON public.answers(profile_id);
CREATE INDEX idx_answers_question_id ON public.answers(question_id);
CREATE INDEX idx_media_story_id ON public.media(story_id);
CREATE INDEX idx_media_answer_id ON public.media(answer_id);
CREATE INDEX idx_comments_story_id ON public.comments(story_id);
CREATE INDEX idx_comments_answer_id ON public.comments(answer_id);
CREATE INDEX idx_reactions_story_id ON public.reactions(story_id);
CREATE INDEX idx_reactions_answer_id ON public.reactions(answer_id);
CREATE INDEX idx_reactions_comment_id ON public.reactions(comment_id);