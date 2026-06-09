-- Remove the legacy phone/SMS (Twilio OTP) customer auth system.
-- Customer authentication now uses Supabase Auth (Google / email-password),
-- and orders are linked to auth.users via orders.user_id.

DROP TABLE IF EXISTS public.customer_otp_codes;
DROP TABLE IF EXISTS public.customer_users;
