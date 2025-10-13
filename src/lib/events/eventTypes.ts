export type EventStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type RSVPResponse = 'yes' | 'no' | 'maybe';
export type EventRoleType = 'host' | 'helper' | 'contributor';

export interface Event {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_place: string | null;
  place_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: EventStatus;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  response: RSVPResponse;
  guest_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRole {
  id: string;
  event_id: string;
  user_id: string;
  role: EventRoleType;
  created_at: string;
}

export interface EventUpload {
  id: string;
  event_id: string;
  family_id: string;
  upload_token_id: string | null;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  contributor_name: string | null;
  contributor_email: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface RSVPCounts {
  yes: number;
  no: number;
  maybe: number;
  total: number;
}
