
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  location: string | null;
  salary_range: string | null;
  status: string;
  company_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  total_candidates?: number;
  shortlisted_candidates?: number;
}

export const useJobs = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          *,
          candidates(id, status)
        `);

      if (error) throw error;

      // Calculate candidate counts
      const jobsWithCounts = jobs?.map(job => ({
        ...job,
        total_candidates: job.candidates?.length || 0,
        shortlisted_candidates: job.candidates?.filter(c => c.status === 'Shortlisted').length || 0,
      })) || [];

      return jobsWithCounts;
    },
  });
};
