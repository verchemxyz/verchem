'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTutorial } from '@/lib/tutorials/context';
import { BookOpen, Award, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export function TutorialProgressTracker() {
  const { state } = useTutorial();
  const { userData, availableTutorials } = state;

  if (!userData) return null;

  const completedTutorials = userData.completedTutorials.length;
  const totalTutorials = availableTutorials.length;
  const completionRate = totalTutorials > 0 ? (completedTutorials / totalTutorials) * 100 : 0;

  const getCategoryProgress = (category: string) => {
    const categoryTutorials = availableTutorials.filter(t => t.category === category);
    const completedInCategory = categoryTutorials.filter(t => 
      userData.completedTutorials.includes(t.id)
    ).length;
    
    return {
      total: categoryTutorials.length,
      completed: completedInCategory,
      percentage: categoryTutorials.length > 0 ? (completedInCategory / categoryTutorials.length) * 100 : 0
    };
  };

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: BookOpen, color: 'bg-success' },
    { id: 'periodic-table', name: 'Periodic Table', icon: BookOpen, color: 'bg-primary-500' },
    { id: '3d-viewer', name: '3D Viewer', icon: BookOpen, color: 'bg-secondary-500' },
    { id: 'molecule-builder', name: 'Molecule Builder', icon: BookOpen, color: 'bg-warning' },
    { id: 'calculators', name: 'Calculators', icon: BookOpen, color: 'bg-destructive' },
    { id: 'advanced-features', name: 'Advanced Features', icon: BookOpen, color: 'bg-muted-foreground' },
    { id: 'chemistry-concepts', name: 'Chemistry Concepts', icon: BookOpen, color: 'bg-primary-700' },
  ];

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Learning Progress
        </h2>
        <Award className="w-6 h-6 text-warning-strong" />
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Overall Progress
          </span>
          <span className="text-sm text-muted-foreground">
            {completedTutorials}/{totalTutorials} tutorials
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <motion.div
            className="bg-primary-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="mt-2 text-center">
          <span className="text-2xl font-bold text-foreground">
            {Math.round(completionRate)}%
          </span>
          <span className="text-sm text-muted-foreground ml-1">
            complete
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-primary-600" />
            <span className="text-sm text-muted-foreground">Time Spent</span>
          </div>
          <p className="text-lg font-semibold text-foreground mt-1">
            {Math.round(userData.totalTimeSpent / 60)} min
          </p>
        </div>
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-warning-strong" />
            <span className="text-sm text-muted-foreground">Achievements</span>
          </div>
          <p className="text-lg font-semibold text-foreground mt-1">
            {userData.achievements.length}
          </p>
        </div>
      </div>

      {/* Category Progress */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Progress by Category
        </h3>
        {categories.map((category) => {
          const progress = getCategoryProgress(category.id);
          
          if (progress.total === 0) return null;

          return (
            <div key={category.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {typeof category.icon === 'string' ? category.icon : <category.icon className="w-4 h-4" />}
                  </span>
                  <span className="text-sm text-foreground">
                    {category.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {progress.completed}/{progress.total}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  className={`${category.color} h-2 rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Achievements */}
      {userData.achievements.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Recent Achievements
          </h3>
          <div className="space-y-2">
            {userData.achievements.slice(-3).map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center space-x-3 p-2 bg-muted rounded-lg"
              >
                <span className="text-lg">{achievement.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {achievement.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>
                </div>
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Message */}
      <div className="mt-6 p-4 bg-muted border border-border rounded-lg">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <p className="text-sm font-medium text-foreground">
            {completionRate === 100
              ? "Congratulations! You've completed all tutorials!"
              : completionRate >= 50
              ? "Great progress! Keep going!"
              : "Keep learning! You're doing great!"
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export function MiniProgressTracker() {
  const { state } = useTutorial();
  const { userData, availableTutorials } = state;

  if (!userData) return null;

  const completedTutorials = userData.completedTutorials.length;
  const totalTutorials = availableTutorials.length;
  const completionRate = totalTutorials > 0 ? (completedTutorials / totalTutorials) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          Learning Progress
        </span>
        <span className="text-xs text-muted-foreground">
          {completedTutorials}/{totalTutorials}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          className="bg-primary-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${completionRate}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
