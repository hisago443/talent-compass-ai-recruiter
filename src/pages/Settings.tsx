
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

interface InterviewKit {
  id: number;
  name: string;
  questions: string[];
}

const mockInterviewKits: InterviewKit[] = [
  {
    id: 1,
    name: "Software Engineer Kit",
    questions: [
      "Tell me about a challenging technical problem you solved.",
      "How do you approach code reviews?",
      "Describe your experience with agile development.",
    ]
  },
  {
    id: 2,
    name: "Product Manager Kit",
    questions: [
      "How do you prioritize features in a product roadmap?",
      "Describe a time when you had to make a difficult product decision.",
      "How do you work with engineering teams?",
    ]
  }
];

const Settings = () => {
  const { toast } = useToast();
  const [interviewKits, setInterviewKits] = useState<InterviewKit[]>(mockInterviewKits);
  const [showKitDialog, setShowKitDialog] = useState(false);
  const [editingKit, setEditingKit] = useState<InterviewKit | null>(null);
  const [kitName, setKitName] = useState('');
  const [questions, setQuestions] = useState<string[]>(['']);

  const openCreateDialog = () => {
    setEditingKit(null);
    setKitName('');
    setQuestions(['']);
    setShowKitDialog(true);
  };

  const openEditDialog = (kit: InterviewKit) => {
    setEditingKit(kit);
    setKitName(kit.name);
    setQuestions([...kit.questions]);
    setShowKitDialog(true);
  };

  const handleSaveKit = () => {
    if (!kitName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a kit name.",
        variant: "destructive",
      });
      return;
    }

    const validQuestions = questions.filter(q => q.trim());
    if (validQuestions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question.",
        variant: "destructive",
      });
      return;
    }

    if (editingKit) {
      // Update existing kit
      setInterviewKits(kits => 
        kits.map(kit => 
          kit.id === editingKit.id 
            ? { ...kit, name: kitName, questions: validQuestions }
            : kit
        )
      );
      toast({
        title: "Kit Updated",
        description: `${kitName} has been updated successfully.`,
      });
    } else {
      // Create new kit
      const newKit: InterviewKit = {
        id: Math.max(...interviewKits.map(k => k.id), 0) + 1,
        name: kitName,
        questions: validQuestions
      };
      setInterviewKits(kits => [...kits, newKit]);
      toast({
        title: "Kit Created",
        description: `${kitName} has been created successfully.`,
      });
    }

    setShowKitDialog(false);
  };

  const handleDeleteKit = (kitId: number) => {
    setInterviewKits(kits => kits.filter(kit => kit.id !== kitId));
    toast({
      title: "Kit Deleted",
      description: "Interview kit has been deleted.",
    });
  };

  const addQuestion = () => {
    setQuestions([...questions, '']);
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-hr-gray">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-hr-navy mb-2">Settings</h1>
              <p className="text-gray-600">Manage your interview kits and configurations</p>
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl text-hr-navy">Interview Kits</CardTitle>
              <Button 
                onClick={openCreateDialog}
                className="bg-hr-purple hover:bg-hr-purple/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Interview Kit
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interviewKits.map((kit) => (
                  <div key={kit.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-hr-navy">{kit.name}</h3>
                        <p className="text-sm text-gray-600">{kit.questions.length} questions</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(kit)}
                          className="border-hr-purple text-hr-purple hover:bg-hr-purple hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteKit(kit.id)}
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {kit.questions.slice(0, 2).map((question, index) => (
                        <p key={index} className="text-sm text-gray-700">
                          {index + 1}. {question}
                        </p>
                      ))}
                      {kit.questions.length > 2 && (
                        <p className="text-sm text-gray-500">
                          +{kit.questions.length - 2} more questions...
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {interviewKits.length === 0 && (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No interview kits yet</h3>
                    <p className="text-gray-500 mb-4">Create your first interview kit to get started</p>
                    <Button 
                      onClick={openCreateDialog}
                      className="bg-hr-purple hover:bg-hr-purple/90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Interview Kit
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showKitDialog} onOpenChange={setShowKitDialog}>
        <DialogContent className="sm:max-w-[600px] bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-hr-navy">
              {editingKit ? 'Edit Interview Kit' : 'Create Interview Kit'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kit-name">Kit Name *</Label>
              <Input
                id="kit-name"
                value={kitName}
                onChange={(e) => setKitName(e.target.value)}
                placeholder="e.g. Software Engineer Kit"
                required
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Questions *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addQuestion}
                  className="border-hr-purple text-hr-purple hover:bg-hr-purple hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Question
                </Button>
              </div>
              
              {questions.map((question, index) => (
                <div key={index} className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      value={question}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder={`Question ${index + 1}`}
                    />
                  </div>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeQuestion(index)}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowKitDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveKit} className="bg-hr-purple hover:bg-hr-purple/90">
                {editingKit ? 'Update Kit' : 'Create Kit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
