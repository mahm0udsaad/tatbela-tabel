-- Migration: Setup automatic profile creation and RLS policies
-- This ensures every new user gets a profile automatically
-- and proper permissions are set

-- 1. Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    false  -- New users are not admin by default
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles for admin checks" ON profiles;

-- 4. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 6. Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 7. Policy: Allow insert during user creation (for the trigger)
CREATE POLICY "Allow profile creation on signup"
  ON profiles
  FOR INSERT
  WITH CHECK (true);

-- 8. Policy: Allow authenticated users to read profiles for admin checks
-- This is needed for the middleware to check is_admin status
CREATE POLICY "Allow authenticated users to read all profiles for admin checks"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

