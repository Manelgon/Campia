-- GUEST MESSAGING SYSTEM MIGRATION

-- 1. Create Messages Table
CREATE TYPE message_type AS ENUM ('text', 'image', 'audio');

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
    guest_id uuid REFERENCES public.guests(id) ON DELETE CASCADE, -- The conversation context
    sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Who sent it
    content text, -- Text message or URL to media
    type message_type DEFAULT 'text',
    is_read boolean DEFAULT false
);

-- 2. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Guests: Can read messages where they are the guest_id (conversation owner)
-- We need to link auth.uid() -> guest.id
CREATE POLICY "Guests read their own messages" ON public.messages
FOR SELECT USING (
    guest_id IN (SELECT id FROM public.guests WHERE user_id = auth.uid())
);

-- Guests: Can insert messages into their own conversation
CREATE POLICY "Guests send messages" ON public.messages
FOR INSERT WITH CHECK (
    guest_id IN (SELECT id FROM public.guests WHERE user_id = auth.uid())
    AND sender_id = auth.uid() -- Must be sent by them
);

-- Staff: Can read/write messages for their property
CREATE POLICY "Staff read property messages" ON public.messages
FOR ALL USING (
    property_id = (SELECT property_id FROM public.profiles WHERE id = auth.uid())
);

-- 4. Storage for Media
-- Insert 'chat-uploads' bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-uploads', 'chat-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Guests can upload to strictly their own folder: property_id/guest_id/*
-- But storage policies are tricky with dynamic paths.
-- Simplified Policy: Authenticated users can upload related to their "files"
-- For MVP, allow authenticated uploads to 'chat-uploads' bucket.

CREATE POLICY "Chat Uploads Public Read" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-uploads');

CREATE POLICY "Chat Uploads Authenticated Insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'chat-uploads' 
    AND auth.role() = 'authenticated'
);

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
