import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Team, Question, TestSubmission } from '../types';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, AlertTriangle, Shield, CheckCircle2, XCircle, Code2, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';

interface TestPageProps {
  user: User;
}

export default function TestPage({ user }: TestPageProps) {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  
  // Test State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [codingAnswer, setCodingAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [suspiciousActivityCount, setSuspiciousActivityCount] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch team and test config
  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) return;
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      if (teamDoc.exists()) {
        const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team;
        setTeam(teamData);
        
        if (teamData.testConfig?.enabled) {
          // Randomize questions
          const shuffledQuestions = [...teamData.testConfig.questions]
            .sort(() => Math.random() - 0.5)
            .map(q => ({
              ...q,
              options: [...q.options].sort(() => Math.random() - 0.5)
            }));
          setQuestions(shuffledQuestions);
          setTimeLeft(teamData.testConfig.timeLimitMinutes * 60);
        } else {
          // No test enabled for this team
          navigate('/teams');
        }
      } else {
        navigate('/teams');
      }
      setLoading(false);
    };

    fetchTeam();
  }, [teamId, navigate]);

  // Anti-cheating: Keyboard Shortcut Prevention
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+S, Ctrl+P
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        setSuspiciousActivityCount(prev => prev + 1);
        return false;
      }
      // Prevent F12
      if (e.key === 'F12') {
        e.preventDefault();
        setSuspiciousActivityCount(prev => prev + 1);
        return false;
      }
      // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        setSuspiciousActivityCount(prev => prev + 1);
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Anti-cheating: Tab Switch Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabActive(false);
        if (testStarted && !testCompleted) {
          setSuspiciousActivityCount(prev => prev + 1);
        }
      } else {
        setIsTabActive(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [testStarted, testCompleted]);

  // Timer logic
  useEffect(() => {
    if (testStarted && !testCompleted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testStarted, testCompleted, timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (testCompleted) return;
    setTestCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate MCQ Score
    let mcqScore = 0;
    questions.forEach(q => {
      const originalQuestion = team?.testConfig?.questions.find(oq => oq.id === q.id);
      if (originalQuestion) {
        const selectedOptionText = q.options[answers[q.id]];
        const correctOptionText = originalQuestion.options[originalQuestion.correctOptionIndex];
        if (selectedOptionText === correctOptionText) {
          mcqScore++;
        }
      }
    });

    const submission: TestSubmission = {
      mcqScore,
      totalMcqs: questions.length,
      codingAnswer,
      suspiciousActivityCount,
      attemptsUsed: 1,
      status: timeLeft === 0 ? 'timed-out' : 'completed',
      completedAt: serverTimestamp(),
    };

    // Create join request with test submission
    await addDoc(collection(db, 'joinRequests'), {
      teamId: team?.id,
      teamName: team?.title,
      leaderId: team?.leaderId,
      applicantId: user.uid,
      applicantName: user.name,
      status: 'pending',
      createdAt: serverTimestamp(),
      message: `Test completed with score ${mcqScore}/${questions.length}. Suspicious activities: ${suspiciousActivityCount}`,
      testSubmission: submission,
    });

    // Create notification for team leader
    await addDoc(collection(db, 'notifications'), {
      userId: team?.leaderId,
      title: 'New Join Request (Test Completed)',
      message: `${user.name} completed the test for "${team?.title}". Score: ${mcqScore}/${questions.length}`,
      type: 'request',
      read: false,
      createdAt: serverTimestamp(),
      link: `/teams`,
    });

  }, [testCompleted, questions, answers, codingAnswer, suspiciousActivityCount, timeLeft, team, user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (testCompleted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[2.5rem] text-center"
        >
          <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-cyan-500" />
          </div>
          <h2 className="text-3xl font-black mb-4">Test Submitted!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your application has been sent to the team leader. They will review your score and suspicious activity log.
          </p>
          <button
            onClick={() => navigate('/teams')}
            className="w-full bg-cyan-500 text-black px-8 py-4 rounded-2xl font-bold hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
          >
            Back to Teams
          </button>
        </motion.div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white/5 border border-white/10 p-8 sm:p-12 rounded-[2.5rem]"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center">
              <Shield className="text-black w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Joining {team?.title}</h2>
              <p className="text-gray-500 text-sm">Anti-Cheat Enabled Test</p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <Timer className="w-6 h-6 text-cyan-500 shrink-0 mt-1" />
              <div>
                <div className="font-bold mb-1">Time Limit: {team?.testConfig?.timeLimitMinutes} Minutes</div>
                <p className="text-xs text-gray-500">The test will automatically submit when time runs out.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
              <div>
                <div className="font-bold mb-1">Anti-Cheat Monitoring</div>
                <p className="text-xs text-gray-500">Do not switch tabs or leave the test screen. Your activity is being monitored.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
              <div>
                <div className="font-bold mb-1">Restrictions</div>
                <p className="text-xs text-gray-500">Copy-paste, right-click, and common shortcuts are disabled during the test.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setTestStarted(true)}
            className="w-full bg-cyan-500 text-black px-8 py-5 rounded-2xl font-bold text-lg hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
          >
            Start Test
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#0a0a0a] p-6 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md py-4 z-10 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
              <BrainCircuit className="text-black w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {questions.length + (team?.testConfig?.codingQuestion ? 1 : 0)}</div>
              <div className="font-bold truncate max-w-[200px]">{team?.title} Test</div>
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all",
            timeLeft < 60 ? "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse" : "bg-white/5 border-white/10 text-cyan-500"
          )}>
            <Timer className="w-5 h-5" />
            <span className="font-mono font-bold text-xl">{formatTime(timeLeft)}</span>
          </div>
        </header>

        {/* Focus Warning */}
        <AnimatePresence>
          {!isTabActive && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-red-500 text-white p-4 rounded-2xl flex items-center gap-3 font-bold shadow-lg shadow-red-500/20"
            >
              <AlertTriangle className="w-6 h-6" />
              Warning: Tab switch detected! This activity is being logged.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test Content */}
        <div className="space-y-8">
          {currentQuestionIndex < questions.length ? (
            <motion.div
              key={questions[currentQuestionIndex].id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 p-8 sm:p-12 rounded-[2.5rem]"
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-12 leading-relaxed">
                {questions[currentQuestionIndex].text}
              </h3>

              <div className="grid gap-4">
                {questions[currentQuestionIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnswers({ ...answers, [questions[currentQuestionIndex].id]: idx })}
                    className={cn(
                      "w-full p-6 rounded-2xl border text-left transition-all flex items-center justify-between group",
                      answers[questions[currentQuestionIndex].id] === idx
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-500"
                        : "bg-white/5 border-white/10 hover:border-white/20 text-gray-400"
                    )}
                  >
                    <span className="font-bold">{option}</span>
                    {answers[questions[currentQuestionIndex].id] === idx && <CheckCircle2 className="w-6 h-6" />}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 p-8 sm:p-12 rounded-[2.5rem]"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                  <Code2 className="text-purple-500 w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Coding Question</h3>
              </div>
              
              <p className="text-gray-400 mb-8 leading-relaxed">
                {team?.testConfig?.codingQuestion}
              </p>

              <textarea
                value={codingAnswer}
                onChange={(e) => setCodingAnswer(e.target.value)}
                placeholder="Write your code here..."
                className="w-full h-96 bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-all resize-none custom-scrollbar"
              />
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="px-8 py-4 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentQuestionIndex < questions.length + (team?.testConfig?.codingQuestion ? 0 : -1) ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="bg-white text-black px-12 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="bg-cyan-500 text-black px-12 py-4 rounded-xl font-bold hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
              >
                Submit Test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
