
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import CreateJobDialog from "@/components/CreateJobDialog";

const mockJobs = [
  {
    id: 1,
    title: "Senior Software Engineer",
    totalCandidates: 24,
    shortlistedCandidates: 8,
  },
  {
    id: 2,
    title: "Product Manager",
    totalCandidates: 18,
    shortlistedCandidates: 5,
  },
  {
    id: 3,
    title: "UX Designer",
    totalCandidates: 32,
    shortlistedCandidates: 12,
  },
  {
    id: 4,
    title: "Data Scientist",
    totalCandidates: 15,
    shortlistedCandidates: 6,
  },
];

const Dashboard = () => {
  const [showCreateJob, setShowCreateJob] = useState(false);

  return (
    <div className="min-h-screen bg-hr-gray">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-hr-navy mb-2">Active Jobs</h1>
            <p className="text-gray-600">Manage your recruitment pipeline</p>
          </div>
          <Button 
            onClick={() => setShowCreateJob(true)}
            className="bg-hr-purple hover:bg-hr-purple/90 h-11 px-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Job
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-hr-navy">{job.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Total Candidates</span>
                  </div>
                  <span className="font-semibold text-hr-navy">{job.totalCandidates}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Shortlisted</span>
                  <span className="font-semibold text-green-600">{job.shortlistedCandidates}</span>
                </div>
                
                <Link to={`/job/${job.id}`}>
                  <Button variant="outline" className="w-full mt-4 border-hr-purple text-hr-purple hover:bg-hr-purple hover:text-white">
                    View Candidates
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockJobs.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No active jobs yet</h3>
            <p className="text-gray-500 mb-6">Create your first job posting to get started</p>
            <Button 
              onClick={() => setShowCreateJob(true)}
              className="bg-hr-purple hover:bg-hr-purple/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Job
            </Button>
          </div>
        )}
      </main>

      <CreateJobDialog open={showCreateJob} onOpenChange={setShowCreateJob} />
    </div>
  );
};

export default Dashboard;
