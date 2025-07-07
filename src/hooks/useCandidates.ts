
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  cv_analysis: any;
  match_score: number | null;
  status: string;
  applied_at: string | null;
  job_id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

// Define the candidate status type to match the database enum
export type CandidateStatus = 
  | 'Applied'
  | 'Screening'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Interview Completed'
  | 'Interview Reviewed'
  | 'Hired'
  | 'Rejected';

export const useCandidates = (jobId: string) => {
  return useQuery({
    queryKey: ['candidates', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Candidate[];
    },
    enabled: !!jobId,
  });
};

export const useUpdateCandidateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ candidateId, status }: { candidateId: string; status: CandidateStatus }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', candidateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['candidates', data.job_id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useInviteToInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ candidateId, jobId, questions }: { 
      candidateId: string; 
      jobId: string; 
      questions: string[];
    }) => {
      // Generate unique interview token
      const interview_token = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get candidate and job details
      const { data: candidate } = await supabase
        .from('candidates')
        .select('company_id')
        .eq('id', candidateId)
        .single();

      if (!candidate) throw new Error('Candidate not found');

      // Create interview record
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .insert({
          candidate_id: candidateId,
          job_id: jobId,
          company_id: candidate.company_id,
          interview_token,
          questions: JSON.stringify(questions),
          status: 'Scheduled',
          scheduled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (interviewError) throw interviewError;

      // Update candidate status
      const { error: statusError } = await supabase
        .from('candidates')
        .update({ status: 'Interview Scheduled' as CandidateStatus })
        .eq('id', candidateId);

      if (statusError) throw statusError;

      return { interview, interview_token };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};
