
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CandidateStatus = 
  | 'Applied'
  | 'Screening'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Interview Completed'
  | 'Interview Reviewed'
  | 'Hired'
  | 'Rejected';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  match_score?: number;
  status: CandidateStatus;
  cv_analysis?: any;
  applied_at?: string;
  job_id: string;
  company_id: string;
  interview_token?: string;
}

export const useCandidates = (jobId: string) => {
  return useQuery({
    queryKey: ['candidates', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          interviews!left(interview_token)
        `)
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      
      // Flatten the interview_token from the interviews relation
      return data.map(candidate => ({
        ...candidate,
        interview_token: candidate.interviews?.[0]?.interview_token || null
      })) as (Candidate & { interview_token?: string })[];
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
        .update({ status })
        .eq('id', candidateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['candidates', data.job_id] });
    },
  });
};

export const useInviteToInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      candidateId, 
      jobId, 
      questions 
    }: {
      candidateId: string;
      jobId: string;
      questions: string[];
    }) => {
      // Generate a unique interview token
      const interviewToken = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get candidate and company info
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select('company_id')
        .eq('id', candidateId)
        .single();

      if (candidateError) throw candidateError;

      // Create interview record
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .insert({
          candidate_id: candidateId,
          job_id: jobId,
          company_id: candidate.company_id,
          interview_token: interviewToken,
          questions: JSON.stringify(questions),
          status: 'Scheduled',
          scheduled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (interviewError) throw interviewError;

      // Update candidate status
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ status: 'Interview Scheduled' as CandidateStatus })
        .eq('id', candidateId);

      if (updateError) throw updateError;

      return { interview, interviewToken };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
};
