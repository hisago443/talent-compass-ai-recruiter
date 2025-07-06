
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Square, RotateCcw, Loader2 } from "lucide-react";
import { useInterviewByToken, useStartInterview, useSubmitInterviewResponse, useCompleteInterview } from "@/hooks/useInterviews";
import { useToast } from "@/hooks/use-toast";

const InterviewPortal = () => {
  const { token } = useParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'welcome' | 'question' | 'review' | 'thankyou'>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch interview data
  const { data: interviewData, isLoading, error } = useInterviewByToken(token!);
  
  // Mutations
  const startInterviewMutation = useStartInterview();
  const submitResponseMutation = useSubmitInterviewResponse();
  const completeInterviewMutation = useCompleteInterview();

  const progress = interviewData?.questions ? ((currentQuestionIndex + 1) / interviewData.questions.length) * 100 : 0;

  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [recordingTimer]);

  const startInterview = async () => {
    if (!interviewData) return;
    
    try {
      await startInterviewMutation.mutateAsync(interviewData.id);
      setCurrentStep('question');
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setHasRecorded(true);
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      setCurrentStep('review');
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
      
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);
      
      // Auto-stop after 3 minutes
      setTimeout(() => {
        if (timer) {
          clearInterval(timer);
        }
        setIsRecording(false);
        setHasRecorded(true);
        setCurrentStep('review');
        setRecordingTimer(null);
      }, 180000);
    }
  };

  const submitAndContinue = async () => {
    if (!interviewData) return;

    try {
      // Submit the response
      await submitResponseMutation.mutateAsync({
        interviewId: interviewData.id,
        questionIndex: currentQuestionIndex,
        questionText: interviewData.questions[currentQuestionIndex],
        responseText: `Recorded response (${formatTime(recordingTime)})`,
        durationSeconds: recordingTime
      });

      if (currentQuestionIndex < interviewData.questions.length - 1) {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentStep('question');
        setIsRecording(false);
        setHasRecorded(false);
        setRecordingTime(0);
      } else {
        // Complete the interview
        await completeInterviewMutation.mutateAsync(interviewData.id);
        setCurrentStep('thankyou');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hr-gray to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-0 shadow-lg">
          <CardContent className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-hr-purple mx-auto mb-4" />
            <p className="text-gray-600">Loading interview...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !interviewData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hr-gray to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-0 shadow-lg">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold text-hr-navy mb-4">Interview Not Found</h2>
            <p className="text-gray-600">The interview link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                {interviewData.jobs?.title}
              </h2>
              <p className="text-gray-600">at {interviewData.companies?.name}</p>
            </div>
            
            <div className="bg-hr-gray p-6 rounded-lg text-left">
              <h3 className="font-semibold text-hr-navy mb-3">Interview Process:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• You will be asked {interviewData.questions.length} questions</li>
                <li>• Each question should be answered in 2-3 minutes</li>
                <li>• You can review and re-record your answers</li>
                <li>• Speak clearly and take your time</li>
              </ul>
            </div>
            
            <Button 
              onClick={startInterview}
              size="lg"
              className="bg-hr-purple hover:bg-hr-purple/90 px-8"
              disabled={startInterviewMutation.isPending}
            >
              {startInterviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                'Begin Interview'
              )}
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
                Question {currentQuestionIndex + 1} of {interviewData.questions.length}
              </span>
              <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="mb-4" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-hr-navy mb-6 leading-relaxed">
                {interviewData.questions[currentQuestionIndex]}
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
              <p className="text-hr-navy">{interviewData.questions[currentQuestionIndex]}</p>
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
                  disabled={submitResponseMutation.isPending || completeInterviewMutation.isPending}
                >
                  {submitResponseMutation.isPending || completeInterviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    currentQuestionIndex < interviewData.questions.length - 1 ? 'Submit and Continue' : 'Complete Interview'
                  )}
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
                You have successfully completed the interview for the <strong>{interviewData.jobs?.title}</strong> position at <strong>{interviewData.companies?.name}</strong>.
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
