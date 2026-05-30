'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Award, RotateCcw, ChevronRight } from 'lucide-react';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  points: number;
}

interface AssessmentProps {
  questions: Question[];
  onComplete: (score: number, answers: (string | number | boolean | null)[]) => void;
  onSkip: () => void;
}

export function TutorialAssessment({ questions, onComplete, onSkip }: AssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(string | number | boolean | null)[]>(new Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | boolean | null>(null);

  const currentQ = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleAnswerSelect = (answer: string | number | boolean) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = selectedAnswer;
      setAnswers(newAnswers);

      if (isLastQuestion) {
        // Calculate score
        let totalScore = 0;
        let maxScore = 0;
        
        questions.forEach((q, index) => {
          maxScore += q.points;
          if (answers[index] === q.correctAnswer || newAnswers[index] === q.correctAnswer) {
            totalScore += q.points;
          }
        });

        const finalScore = Math.round((totalScore / maxScore) * 100);
        setShowResults(true);
        
        // Call onComplete after showing results
        setTimeout(() => {
          onComplete(finalScore, newAnswers);
        }, 3000);
      } else {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(answers[currentQuestion + 1] || null);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || null);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers(new Array(questions.length).fill(null));
    setShowResults(false);
    setSelectedAnswer(null);
  };

  const getAnswerStatus = (questionIndex: number) => {
    const answer = answers[questionIndex];
    const correctAnswer = questions[questionIndex].correctAnswer;
    
    if (answer === null) return 'unanswered';
    return answer === correctAnswer ? 'correct' : 'incorrect';
  };

  const calculateScore = () => {
    let totalScore = 0;
    let maxScore = 0;
    
    questions.forEach((q, index) => {
      maxScore += q.points;
      if (answers[index] === q.correctAnswer) {
        totalScore += q.points;
      }
    });
    
    return Math.round((totalScore / maxScore) * 100);
  };

  if (showResults) {
    const score = calculateScore();
    const passed = score >= 70;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-lg p-6 max-w-2xl mx-auto"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center border ${
              passed ? 'bg-muted border-success' : 'bg-muted border-destructive'
            }`}
          >
            {passed ? (
              <Award className="w-10 h-10 text-success-strong" />
            ) : (
              <RotateCcw className="w-10 h-10 text-destructive-strong" />
            )}
          </motion.div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            {passed ? 'Congratulations!' : 'Keep Learning!'}
          </h2>

          <p className="text-lg text-muted-foreground mb-4">
            You scored {score}% ({Math.round(score * questions.length / 100)}/{questions.length} correct)
          </p>

          {passed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-muted border border-success rounded-lg p-4 mb-4"
            >
              <p className="text-sm font-medium text-success-strong">
                Achievement Unlocked
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tutorial Master - Completed assessment with {score}% score
              </p>
            </motion.div>
          )}

          {/* Answer Summary */}
          <div className="space-y-2 mb-6">
            {questions.map((q, index) => {
              const status = getAnswerStatus(index);
              return (
                <div
                  key={q.id}
                  className={`flex items-center space-x-3 p-2 rounded-lg border ${
                    status === 'correct'
                      ? 'bg-muted border-success'
                      : status === 'incorrect'
                      ? 'bg-muted border-destructive'
                      : 'bg-muted border-border'
                  }`}
                >
                  {status === 'correct' ? (
                    <CheckCircle className="w-4 h-4 text-success-strong" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive-strong" />
                  )}
                  <span className="text-sm text-foreground">
                    Question {index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground flex-1">
                    {status === 'unanswered' ? 'Not answered' :
                     status === 'correct' ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex space-x-3">
            {!passed && (
              <button
                onClick={handleRestart}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-primary-foreground rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => onComplete(score, answers)}
              className="flex-1 px-4 py-2 bg-muted hover:bg-accent text-foreground border border-border rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-6 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Tutorial Assessment
          </h2>
          <p className="text-sm text-muted-foreground">
            Test your knowledge from this tutorial
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          <div className="text-xs text-muted-foreground">
            {currentQ.points} points
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-foreground mb-4">
          {currentQ.question}
        </h3>

        <AnimatePresence mode="wait">
          {currentQ.type === 'multiple-choice' && currentQ.options && (
            <motion.div
              key={`mc-${currentQuestion}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2"
            >
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedAnswer === index
                      ? 'border-primary-500 bg-accent text-primary-700 dark:text-primary-500'
                      : 'border-border hover:border-ring'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedAnswer === index
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-border'
                      }`}
                    >
                      {selectedAnswer === index && (
                        <div className="w-full h-full rounded-full bg-primary-foreground scale-50" />
                      )}
                    </div>
                    <span className="text-foreground">{option}</span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {currentQ.type === 'true-false' && (
            <motion.div
              key={`tf-${currentQuestion}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex space-x-4"
            >
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  onClick={() => handleAnswerSelect(value)}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === value
                      ? 'border-primary-500 bg-accent'
                      : 'border-border hover:border-ring'
                  }`}
                >
                  <span className="text-lg font-medium text-foreground">
                    {value ? 'True' : 'False'}
                  </span>
                </button>
              ))}
            </motion.div>
          )}

          {currentQ.type === 'fill-blank' && (
            <motion.div
              key={`fb-${currentQuestion}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <input
                type="text"
                value={typeof selectedAnswer === 'boolean' ? String(selectedAnswer) : (selectedAnswer || '')}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <div className="flex space-x-3">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip Assessment
          </button>
          <button
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>{isLastQuestion ? 'Submit' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Sample assessment questions for different tutorials
export const sampleAssessments = {
  'getting-started-navigation': [
    {
      id: 'nav-1',
      type: 'multiple-choice' as const,
      question: 'Where can you find the main navigation in VerChem?',
      options: ['Top of the page', 'Left sidebar', 'Right sidebar', 'Bottom footer'],
      correctAnswer: 0,
      explanation: 'The main navigation is located at the top of the page for easy access to all tools.',
      points: 10,
    },
    {
      id: 'nav-2',
      type: 'true-false' as const,
      question: 'The help button is always visible in the top-right corner.',
      correctAnswer: true,
      explanation: 'The help button is consistently placed in the top-right corner for easy access.',
      points: 10,
    },
  ],
  'periodic-table-basics': [
    {
      id: 'pt-1',
      type: 'multiple-choice' as const,
      question: 'What information can you find by clicking on an element?',
      options: [
        'Only atomic number',
        'Only element symbol',
        'Detailed properties and information',
        'Nothing useful'
      ],
      correctAnswer: 2,
      explanation: 'Clicking on an element provides comprehensive information including properties, electron configuration, and more.',
      points: 15,
    },
    {
      id: 'pt-2',
      type: 'fill-blank' as const,
      question: 'The periodic table can visualize trends like atomic radius and ___________.',
      correctAnswer: 'electronegativity',
      explanation: 'The periodic table can visualize various trends including electronegativity, ionization energy, and more.',
      points: 15,
    },
  ],
  'stoichiometry-calculator': [
    {
      id: 'stoich-1',
      type: 'multiple-choice' as const,
      question: 'What does the stoichiometry calculator help you with?',
      options: [
        'Only balancing equations',
        'Only calculating molar mass',
        'Balancing equations and stoichiometric calculations',
        'Drawing molecular structures'
      ],
      correctAnswer: 2,
      explanation: 'The stoichiometry calculator helps with both balancing chemical equations and performing stoichiometric calculations.',
      points: 20,
    },
    {
      id: 'stoich-2',
      type: 'true-false' as const,
      question: 'The calculator shows step-by-step explanations for balancing equations.',
      correctAnswer: true,
      explanation: 'Yes, the calculator provides detailed step-by-step explanations for the balancing process.',
      points: 20,
    },
  ],
};
