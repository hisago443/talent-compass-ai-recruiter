
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

const mockJobData = {
  1: {
    title: "Senior Software Engineer",
    description: "We are looking for an experienced Senior Software Engineer to join our dynamic team. The ideal candidate will have 5+ years of experience in full-stack development, proficiency in React, Node.js, and Python, and a strong understanding of cloud technologies. You will be responsible for designing and implementing scalable solutions, mentoring junior developers, and collaborating with cross-functional teams to deliver high-quality software products.",
  }
};

const mockCandidates = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    matchScore: 92,
    summary: "Experienced full-stack developer with 6 years at top tech companies. Strong expertise in React, Node.js, and AWS. Led multiple successful projects and mentored junior developers. Excellent problem-solving skills and passion for clean code architecture.",
    status: "Shortlisted"
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    email: "m.rodriguez@email.com",
    matchScore: 87,
    summary: "Senior engineer with extensive background in distributed systems and microservices. 7 years of experience building scalable applications. Strong leadership skills and experience with team management.",
    status: "Needs Review"
  },
  {
    id: 3,
    name: "Emily Johnson",
    email: "emily.j@email.com",
    matchScore: 78,
    summary: "Full-stack developer with solid foundation in modern web technologies. 4 years of experience with React and Python. Quick learner with strong analytical skills and attention to detail.",
    status: "Shortlisted"
  },
  {
    id: 4,
    name: "David Kim",
    email: "david.kim@email.com",
    matchScore: 65,
    summary: "Junior developer transitioning to senior role. 3 years of experience primarily in frontend development. Shows strong potential and eagerness to learn backend technologies.",
    status: "Rejected"
  }
];

const JobDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const jobData = mockJobData[id as keyof typeof mockJobData];

  const handleAnalyzeCVs = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: "All CVs have been analyzed and scored.",
      });
    }, 3000);
  };

  const handleCandidateAction = (candidateId: number, action: string) => {
    const candidate = mockCandidates.find(c => c.id === candidateId);
    toast({
      title: "Action Completed",
      description: `${candidate?.name} has been ${action.toLowerCase()}.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Shortlisted': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'Needs Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const showSummary = (candidate: any) => {
    setSelectedCandidate(candidate);
    setShowSummaryModal(true);
  };

  if (!jobData) {
    return <div>Job not found</div>;
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
            <CardTitle className="text-xl text-hr-navy">Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CV Match Score</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">{candidate.name}</TableCell>
                      <TableCell className="text-gray-600">{candidate.email}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-hr-purple">{candidate.matchScore}%</span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">
                          {candidate.summary.substring(0, 100)}...
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-hr-purple"
                          onClick={() => showSummary(candidate)}
                        >
                          read more
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(candidate.status)}>
                          {candidate.status}
                        </Badge>
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
                              onClick={() => handleCandidateAction(candidate.id, 'Invited to Interview')}
                              className="cursor-pointer"
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
          </CardContent>
        </Card>
      </main>

      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-hr-navy">CV Analysis Summary</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-hr-navy mb-2">{selectedCandidate.name}</h4>
                <p className="text-gray-600 mb-2">{selectedCandidate.email}</p>
                <p className="text-sm font-medium text-hr-purple">Match Score: {selectedCandidate.matchScore}%</p>
              </div>
              <div>
                <h5 className="font-medium text-hr-navy mb-2">Analysis Summary:</h5>
                <p className="text-gray-700 leading-relaxed">{selectedCandidate.summary}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDetails;
