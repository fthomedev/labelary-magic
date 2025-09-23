-- Drop the existing public SELECT policy that exposes all user email addresses
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Create a new restricted policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile only" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Verify the policy is working correctly by checking that users can only access their own data
-- This comment is for documentation - the policy restricts access to authenticated users viewing only their own profile data