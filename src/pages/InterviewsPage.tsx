
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, PlayCircle, FileText, Star } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface InterviewWithDetails {
  id: string;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  candidates: {
    name: string;
    email: string;
  };
  jobs: {
    title: string;
  };
  responses: any[];
}

const InterviewsPage = () => {
  const { user } = useAuth();
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          id,
          status,
          scheduled_at,
          started_at,
          completed_at,
          candidates(name, email),
          jobs(title),
          responses
        `)
        .eq('status', 'Completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data as InterviewWithDetails[];
    },
    enabled: !!user,
  });

  const { data: interviewResponses } = useQuery({
    queryKey: ['interview-responses', selectedInterview?.id],
    queryFn: async () => {
      if (!selectedInterview?.id) return [];
      
      const { data, error } = await supabase
        .from('interview_responses')
        .select('*')
        .eq('interview_id', selectedInterview.id)
        .order('question_index');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedInterview?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculatePerformanceScore = (responses: any[]) => {
    if (!responses || responses.length === 0) return 0;
    
    // Simple scoring based on response length and presence
    const avgLength = responses.reduce((acc, resp) => {
      const responseText = resp.response_text || '';
      return acc + responseText.length;
    }, 0) / responses.length;
    
    // Score from 1-100 based on response quality indicators
    const baseScore = Math.min(100, Math.max(20, avgLength / 10));
    return Math.round(baseScore);
  };

  const viewInterviewDetails = (interview: InterviewWithDetails) => {
    setSelectedInterview(interview);
    setShowDetailsModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hr-gray">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-hr-purple" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hr-gray">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-hr-navy mb-2">Interview Analytics</h1>
            <p className="text-gray-600">Review completed interviews and performance analytics</p>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-hr-navy">
              Completed Interviews ({interviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No completed interviews</h3>
                <p className="text-gray-500">Completed interviews will appear here for analysis.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed Date</TableHead>
                      <TableHead>Performance Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interviews.map((interview) => {
                      const score = calculatePerformanceScore(interview.responses);
                      return (
                        <TableRow key={interview.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{interview.candidates.name}</div>
                              <div className="text-sm text-gray-500">{interview.candidates.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{interview.jobs.title}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(interview.status)}>
                              {interview.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {interview.completed_at ? new Date(interview.completed_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-semibold text-hr-purple">{score}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewInterviewDetails(interview)}
                              className="text-hr-purple border-hr-purple hover:bg-hr-purple hover:text-white"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[800px] bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-hr-navy">Interview Analysis</DialogTitle>
          </DialogHeader>
          {selectedInterview && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-hr-navy mb-2">Candidate Information</h4>
                  <p className="text-gray-700">{selectedInterview.candidates.name}</p>
                  <p className="text-gray-600 text-sm">{selectedInterview.candidates.email}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-hr-navy mb-2">Position</h4>
                  <p className="text-gray-700">{selectedInterview.jobs.title}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-hr-navy mb-4">Interview Transcript</h4>
                {interviewResponses && interviewResponses.length > 0 ? (
                  <div className="space-y-4">
                    {interviewResponses.map((response, index) => (
                      <div key={response.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="font-medium text-hr-navy mb-2">
                          Question {index + 1}: {response.question_text}
                        </div>
                        <div className="text-gray-700 mb-2">
                          <strong>Response:</strong> {response.response_text || 'Audio response recorded'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Duration: {response.duration_seconds ? `${Math.floor(response.duration_seconds / 60)}:${(response.duration_seconds % 60).toString().padStart(2, '0')}` : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No detailed transcript available</p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-hr-navy mb-2">Performance Analysis</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-hr-purple">
                      {calculatePerformanceScore(selectedInterview.responses)}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {interviewResponses?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Questions Answered</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {interviewResponses?.reduce((acc, resp) => acc + (resp.duration_seconds || 0), 0) 
                        ? Math.floor(interviewResponses.reduce((acc, resp) => acc + (resp.duration_seconds || 0), 0) / 60) + 'm'
                        : '0m'}
                    </div>
                    <div className="text-sm text-gray-600">Total Duration</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewsPage;
