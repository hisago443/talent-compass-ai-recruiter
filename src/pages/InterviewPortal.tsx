
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Square, RotateCcw } from "lucide-react";

const mockInterviewData = {
  jobTitle: "Senior Software Engineer",
  companyName: "TechCorp Inc.",
  questions: [
    "Tell me about a challenging technical problem you solved recently.",
    "How do you approach code reviews with your team?",
    "Describe your experience with agile development methodologies.",
    "What strategies do you use for debugging complex issues?",
    "How do you stay updated with new technologies and best practices?"
  ]
};

const InterviewPortal = () => {
  const { token } = useParams();
  const [currentStep, setCurrentStep] = useState<'welcome' | 'question' | 'review' | 'thankyou'>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);

  const progress = ((currentQuestionIndex + 1) / mockInterviewData.questions.length) * 100;

  const startInterview = () => {
    setCurrentStep('question');
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasRecorded(true);
      setCurrentStep('review');
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      // Simulate recording timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Auto-stop after 2 minutes (for demo)
      setTimeout(() => {
        clearInterval(timer);
        setIsRecording(false);
        setHasRecorded(true);
        setCurrentStep('review');
      }, 120000);
    }
  };

  const submitAndContinue = () => {
    if (currentQuestionIndex < mockInterviewData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentStep('question');
      setIsRecording(false);
      setHasRecorded(false);
      setRecordingTime(0);
    } else {
      setCurrentStep('thankyou');
    }
  };

  const rerecordAnswer = () => {
    setCurrentStep('question');
    setIsRecording(false);
    setHasRecorded(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hr-gray to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-hr-navy mb-4">Welcome to Your Interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div>
              <h2 className="text-xl font-semibold text-hr-navy mb-2">
                {mockInterviewData.jobTitle}
              </h2>
              <p className="text-gray-600">at {mockInterviewData.companyName}</p>
            </div>
            
            <div className="bg-hr-gray p-6 rounded-lg text-left">
              <h3 className="font-semibold text-hr-navy mb-3">Interview Process:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• You will be asked {mockInterviewData.questions.length} behavioral questions</li>
                <li>• Each question should be answered in 2-3 minutes</li>
                <li>• You can review and re-record your answers</li>
                <li>• Speak clearly and take your time</li>
              </ul>
            </div>
            
            <Button 
              onClick={startInterview}
              size="lg"
              className="bg-hr-purple hover:bg-hr-purple/90 px-8"
            >
              Begin Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'question') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hr-gray to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {mockInterviewData.questions.length}
              </span>
              <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="mb-4" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-hr-navy mb-6 leading-relaxed">
                {mockInterviewData.questions[currentQuestionIndex]}
              </h2>
            </div>
            
            <div className="text-center">
              {isRecording ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-500 font-medium">Recording</span>
                    <span className="text-gray-600">{formatTime(recordingTime)}</span>
                  </div>
                  <Button 
                    onClick={toggleRecording}
                    size="lg"
                    className="bg-red-500 hover:bg-red-600 px-8"
                  >
                    <Square className="mr-2 h-5 w-5" />
                    Stop Recording
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={toggleRecording}
                  size="lg"
                  className="bg-hr-purple hover:bg-hr-purple/90 px-8"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Record Answer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hr-gray to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-hr-navy">Review Your Answer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-hr-gray p-4 rounded-lg">
              <p className="text-gray-700 font-medium mb-2">Question:</p>
              <p className="text-hr-navy">{mockInterviewData.questions[currentQuestionIndex]}</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600 mb-2">Your recorded answer</p>
                <p className="text-sm text-gray-500">Duration: {formatTime(recordingTime)}</p>
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-hr-purple h-2 rounded-full w-full"></div>
                  </div>
                  <p className="text-xs text-gray-500">Audio playback would be available here</p>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={rerecordAnswer}
                  variant="outline"
                  className="border-hr-purple text-hr-purple hover:bg-hr-purple hover:text-white"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Rerecord Answer
                </Button>
                <Button 
                  onClick={submitAndContinue}
                  className="bg-hr-purple hover:bg-hr-purple/90"
                >
                  Submit and Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'thankyou') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hr-gray to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-0 shadow-lg">
          <CardContent className="text-center space-y-6 pt-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">✓</span>
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-hr-navy mb-2">Thank You!</h1>
              <p className="text-gray-600 mb-6">
                You have successfully completed the interview for the <strong>{mockInterviewData.jobTitle}</strong> position at <strong>{mockInterviewData.companyName}</strong>.
              </p>
            </div>
            
            <div className="bg-hr-gray p-6 rounded-lg">
              <h3 className="font-semibold text-hr-navy mb-2">What happens next?</h3>
              <p className="text-gray-700">
                Our team will review your responses and get back to you within 5-7 business days. 
                Thank you for your time and interest in joining our team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default InterviewPortal;
