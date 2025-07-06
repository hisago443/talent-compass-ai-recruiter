
-- Create enum types for better data integrity
CREATE TYPE public.candidate_status AS ENUM (
  'Applied',
  'Screening',
  'Shortlisted', 
  'Interview Scheduled',
  'Interview Completed',
  'Interview Reviewed',
  'Hired',
  'Rejected'
);

CREATE TYPE public.interview_status AS ENUM (
  'Scheduled',
  'In Progress',
  'Completed',
  'Cancelled'
);

-- Create companies table for multi-tenancy
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'recruiter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  location TEXT,
  salary_range TEXT,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create candidates table
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cv_analysis JSONB,
  match_score INTEGER DEFAULT 0,
  status public.candidate_status DEFAULT 'Applied',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create interviews table
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  interview_token TEXT UNIQUE NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  responses JSONB DEFAULT '[]',
  status public.interview_status DEFAULT 'Scheduled',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create interview responses table for detailed tracking
CREATE TABLE public.interview_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  response_text TEXT,
  audio_url TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenant access
-- Companies policies
CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT USING (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Profiles policies
CREATE POLICY "Users can view profiles in their company" ON public.profiles
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Jobs policies
CREATE POLICY "Users can view jobs in their company" ON public.jobs
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage jobs in their company" ON public.jobs
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Candidates policies
CREATE POLICY "Users can view candidates in their company" ON public.candidates
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage candidates in their company" ON public.candidates
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Interviews policies
CREATE POLICY "Users can view interviews in their company" ON public.interviews
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage interviews in their company" ON public.interviews
  FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Public access to interviews via token" ON public.interviews
  FOR SELECT USING (true);

-- Interview responses policies
CREATE POLICY "Users can view responses for their company interviews" ON public.interview_responses
  FOR SELECT USING (interview_id IN (
    SELECT id FROM public.interviews 
    WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Public can insert responses via valid interview token" ON public.interview_responses
  FOR INSERT WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_candidates_job_id ON public.candidates(job_id);
CREATE INDEX idx_candidates_company_id ON public.candidates(company_id);
CREATE INDEX idx_candidates_status ON public.candidates(status);
CREATE INDEX idx_interviews_token ON public.interviews(interview_token);
CREATE INDEX idx_interviews_candidate_id ON public.interviews(candidate_id);
CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);

-- Insert sample data for testing
INSERT INTO public.companies (id, name, email) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'TechCorp Inc.', 'hr@techcorp.com');

-- Update the existing interview_kits table structure
ALTER TABLE public.interview_kits ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id);
ALTER TABLE public.interview_kits ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.interview_kits ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]';
