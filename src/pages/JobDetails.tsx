
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MoreHorizontal } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useCandidates, useUpdateCandidateStatus, useInviteToInterview } from "@/hooks/useCandidates";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const JobDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Fetch job data
  const { data: jobData, isLoading: jobLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch candidates
  const { data: candidates = [], isLoading: candidatesLoading, refetch } = useCandidates(id!);
  
  // Mutations
  const updateStatusMutation = useUpdateCandidateStatus();
  const inviteToInterviewMutation = useInviteToInterview();

  const handleAnalyzeCVs = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      refetch();
      toast({
        title: "Analysis Complete",
        description: "All CVs have been analyzed and scored.",
      });
    }, 3000);
  };

  const handleCandidateAction = async (candidateId: string, action: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    
    try {
      if (action === 'Invite to Interview') {
        // Default interview questions - in production, these would come from interview kits
        const defaultQuestions = [
          "Tell me about yourself and your background.",
          "Why are you interested in this position?",
          "Describe a challenging project you've worked on.",
          "How do you handle working under pressure?",
          "Where do you see yourself in 5 years?"
        ];

        await inviteToInterviewMutation.mutateAsync({
          candidateId,
          jobId: id!,
          questions: defaultQuestions
        });

        toast({
          title: "Interview Scheduled",
          description: `${candidate?.name} has been invited to interview. Interview link will be sent via email.`,
        });
      } else {
        await updateStatusMutation.mutateAsync({ 
          candidateId, 
          status: action 
        });

        toast({
          title: "Status Updated",
          description: `${candidate?.name} has been ${action.toLowerCase()}.`,
        });
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast({
        title: "Error",
        description: "Failed to update candidate status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Shortlisted': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'Interview Scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Interview Completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Interview Reviewed': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Hired': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Needs Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const showSummary = (candidate: any) => {
    setSelectedCandidate(candidate);
    setShowSummaryModal(true);
  };

  if (jobLoading || candidatesLoading) {
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

  if (!jobData) {
    return (
      <div className="min-h-screen bg-hr-gray">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-hr-navy mb-4">Job not found</h2>
            <p className="text-gray-600">The job you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hr-gray">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-hr-navy">{jobData.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{jobData.description}</p>
            {jobData.requirements && (
              <div className="mt-4">
                <h4 className="font-semibold text-hr-navy mb-2">Requirements:</h4>
                <p className="text-gray-700">{jobData.requirements}</p>
              </div>
            )}
            <div className="mt-6">
              <Button 
                onClick={handleAnalyzeCVs}
                disabled={analyzing}
                className="bg-hr-purple hover:bg-hr-purple/90"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing CVs...
                  </>
                ) : (
                  'Analyze New CVs'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-hr-navy">
              Candidates ({candidates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No candidates yet</h3>
                <p className="text-gray-500">Candidates will appear here once they apply for this job.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>CV Match Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">{candidate.name}</TableCell>
                        <TableCell className="text-gray-600">{candidate.email}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-hr-purple">
                            {candidate.match_score || 0}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(candidate.status)}>
                            {candidate.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {candidate.applied_at ? new Date(candidate.applied_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white shadow-lg border">
                              <DropdownMenuItem 
                                onClick={() => handleCandidateAction(candidate.id, 'Invite to Interview')}
                                className="cursor-pointer"
                                disabled={candidate.status === 'Interview Scheduled' || candidate.status === 'Interview Completed'}
                              >
                                Invite to Interview
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleCandidateAction(candidate.id, 'Shortlisted')}
                                className="cursor-pointer"
                              >
                                Shortlist
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleCandidateAction(candidate.id, 'Rejected')}
                                className="cursor-pointer text-red-600"
                              >
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-hr-navy">Candidate Details</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-hr-navy mb-2">{selectedCandidate.name}</h4>
                <p className="text-gray-600 mb-2">{selectedCandidate.email}</p>
                <p className="text-sm font-medium text-hr-purple">
                  Match Score: {selectedCandidate.match_score || 0}%
                </p>
              </div>
              {selectedCandidate.cv_analysis && (
                <div>
                  <h5 className="font-medium text-hr-navy mb-2">CV Analysis:</h5>
                  <div className="text-gray-700 leading-relaxed">
                    {typeof selectedCandidate.cv_analysis === 'string' 
                      ? selectedCandidate.cv_analysis 
                      : JSON.stringify(selectedCandidate.cv_analysis, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDetails;
