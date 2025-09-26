-- Create user_prompt_history table for tracking prompt usage
CREATE TABLE public.user_prompt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt_id TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed BOOLEAN NOT NULL DEFAULT false,
  response_length INTEGER,
  response_topics TEXT[],
  action TEXT DEFAULT 'used',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_streaks table for tracking user engagement streaks
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_completed INTEGER NOT NULL DEFAULT 0,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  streak_started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_user_prompt_history_user_id ON public.user_prompt_history(user_id);
CREATE INDEX idx_user_prompt_history_used_at ON public.user_prompt_history(used_at DESC);
CREATE INDEX idx_user_prompt_history_completed ON public.user_prompt_history(completed);
CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_prompt_history
CREATE POLICY "Users can view their own prompt history"
ON public.user_prompt_history
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own prompt history"
ON public.user_prompt_history
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own prompt history"
ON public.user_prompt_history
FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for user_streaks
CREATE POLICY "Users can view their own streaks"
ON public.user_streaks
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own streaks"
ON public.user_streaks
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own streaks"
ON public.user_streaks
FOR UPDATE
USING (user_id = auth.uid());

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_prompt_history_updated_at
    BEFORE UPDATE ON public.user_prompt_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON public.user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update streak data
CREATE OR REPLACE FUNCTION public.update_user_streak(
    p_user_id UUID,
    p_completed_today BOOLEAN DEFAULT true
)
RETURNS TABLE(
    current_streak INTEGER,
    longest_streak INTEGER,  
    total_completed INTEGER
) AS $$
DECLARE
    v_current_record RECORD;
    v_yesterday DATE;
    v_today DATE;
    v_new_streak INTEGER;
    v_new_total INTEGER;
    v_new_longest INTEGER;
BEGIN
    v_today := CURRENT_DATE;
    v_yesterday := v_today - INTERVAL '1 day';
    
    -- Get current streak record
    SELECT * INTO v_current_record
    FROM public.user_streaks
    WHERE user_id = p_user_id;
    
    -- If no record exists, create one
    IF v_current_record IS NULL THEN
        v_new_streak := CASE WHEN p_completed_today THEN 1 ELSE 0 END;
        v_new_total := CASE WHEN p_completed_today THEN 1 ELSE 0 END;
        v_new_longest := v_new_streak;
        
        INSERT INTO public.user_streaks (
            user_id, 
            current_streak, 
            longest_streak, 
            total_completed,
            last_completed_at,
            streak_started_at
        ) VALUES (
            p_user_id, 
            v_new_streak, 
            v_new_longest, 
            v_new_total,
            CASE WHEN p_completed_today THEN now() ELSE NULL END,
            CASE WHEN p_completed_today THEN now() ELSE NULL END
        );
    ELSE
        -- Calculate new streak
        IF p_completed_today THEN
            -- Check if last completion was yesterday (continuing streak) or today (same day)
            IF DATE(v_current_record.last_completed_at) = v_yesterday THEN
                v_new_streak := v_current_record.current_streak + 1;
            ELSIF DATE(v_current_record.last_completed_at) = v_today THEN
                v_new_streak := v_current_record.current_streak; -- Same day, don't increment
            ELSE
                v_new_streak := 1; -- New streak starts
            END IF;
            
            v_new_total := v_current_record.total_completed + 1;
        ELSE
            v_new_streak := 0; -- Reset streak
            v_new_total := v_current_record.total_completed;
        END IF;
        
        v_new_longest := GREATEST(v_current_record.longest_streak, v_new_streak);
        
        -- Update the record
        UPDATE public.user_streaks
        SET 
            current_streak = v_new_streak,
            longest_streak = v_new_longest,
            total_completed = v_new_total,
            last_completed_at = CASE WHEN p_completed_today THEN now() ELSE v_current_record.last_completed_at END,
            streak_started_at = CASE 
                WHEN v_new_streak = 1 AND p_completed_today THEN now()
                ELSE v_current_record.streak_started_at 
            END,
            updated_at = now()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Return current stats
    RETURN QUERY
    SELECT 
        COALESCE(v_new_streak, 0) as current_streak,
        COALESCE(v_new_longest, 0) as longest_streak,
        COALESCE(v_new_total, 0) as total_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;