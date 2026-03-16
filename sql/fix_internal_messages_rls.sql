-- Fix RLS for internal_messages to allow admins to see all messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.internal_messages;

CREATE POLICY "Users can view their own messages" 
ON public.internal_messages FOR SELECT 
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id OR 
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ))
);

-- Ensure real-time is enabled for internal_messages
ALTER TABLE public.internal_messages REPLICA IDENTITY FULL;
