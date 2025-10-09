-- Create trigger to enable weekly digest for new members by default
CREATE OR REPLACE FUNCTION enable_digest_for_new_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the family's first member
  IF NOT EXISTS (
    SELECT 1 FROM members 
    WHERE family_id = NEW.family_id AND id != NEW.id
  ) THEN
    -- Create default digest settings for the family
    INSERT INTO weekly_digest_settings (
      family_id,
      enabled,
      delivery_day,
      delivery_hour,
      delivery_timezone,
      recipients,
      created_by,
      is_unlocked,
      unlock_threshold
    ) VALUES (
      NEW.family_id,
      true, -- Enabled by default
      0, -- Sunday
      9, -- 9 AM
      'America/New_York', -- Default timezone
      '{}', -- Empty recipients array initially
      NEW.profile_id,
      false, -- Initially locked until threshold met
      2 -- Unlock after 2 members
    )
    ON CONFLICT (family_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on members table
DROP TRIGGER IF EXISTS on_new_member_enable_digest ON members;
CREATE TRIGGER on_new_member_enable_digest
  AFTER INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION enable_digest_for_new_member();