
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Interview {
  id: string;
  candidate_id: string;
  job_id: string;
  company_id: string;
  interview_token: string;
  questions: string[];
  responses: any[];
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useInterviewByToken = (token: string) => {
  return useQuery({
    queryKey: ['interview', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          candidates(name, email),
          jobs(title, description, company_id),
          companies(name)
        `)
        .eq('interview_token', token)
        .single();

      if (error) throw error;
      
      // Parse questions from JSON
      const interview = {
        ...data,
        questions: typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions || []
      };

      return interview;
    },
    enabled: !!token,
  });
};

export const useStartInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interviewId: string) => {
      const { data, error } = await supabase
        .from('interviews')
        .update({ 
          status: 'In Progress',
          started_at: new Date().toISOString() 
        })
        .eq('id', interviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interview', data.interview_token] });
    },
  });
};

export const useSubmitInterviewResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      interviewId, 
      questionIndex, 
      questionText, 
      responseText, 
      durationSeconds 
    }: {
      interviewId: string;
      questionIndex: number;
      questionText: string;
      responseText?: string;
      durationSeconds: number;
    }) => {
      const { data, error } = await supabase
        .from('interview_responses')
        .insert({
          interview_id: interviewId,
          question_index: questionIndex,
          question_text: questionText,
          response_text: responseText,
          duration_seconds: durationSeconds
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
};

export const useCompleteInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interviewId: string) => {
      // Update interview status
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .update({ 
          status: 'Completed',
          completed_at: new Date().toISOString() 
        })
        .eq('id', interviewId)
        .select('candidate_id')
        .single();

      if (interviewError) throw interviewError;

      // Update candidate status
      const { error: candidateError } = await supabase
        .from('candidates')
        .update({ status: 'Interview Completed' })
        .eq('id', interview.candidate_id);

      if (candidateError) throw candidateError;

      return interview;
    },
    onSuccess: (data, interviewId) => {
      queryClient.invalidateQueries({ queryKey: ['interview'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};
