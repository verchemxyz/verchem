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
    { id: 'getting-started', name: 'Getting Started', icon: BookOpen, color: 'bg-green-500' },
    { id: 'periodic-table', name: 'Periodic Table', icon: '🧪', color: 'bg-blue-500' },
    { id: '3d-viewer', name: '3D Viewer', icon: '🔬', color: 'bg-purple-500' },
    { id: 'molecule-builder', name: 'Molecule Builder', icon: '🏗️', color: 'bg-orange-500' },
    { id: 'calculators', name: 'Calculators', icon: '🧮', color: 'bg-red-500' },
    { id: 'advanced-features', name: 'Advanced Features', icon: '⚙️', color: 'bg-gray-500' },
    { id: 'chemistry-concepts', name: 'Chemistry Concepts', icon: '⚛️', color: 'bg-indigo-500' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Learning Progress
        </h2>
        <Award className="w-6 h-6 text-yellow-500" />
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedTutorials}/{totalTutorials} tutorials
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="mt-2 text-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(completionRate)}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
            complete
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Time Spent</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {Math.round(userData.totalTimeSpent / 60)} min
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Achievements</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {userData.achievements.length}
          </p>
        </div>
      </div>

      {/* Category Progress */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Progress by Category
        </h3>
        {categories.map((category) => {
          const progress = getCategoryProgress(category.id);
          
          if (progress.total === 0) return null;

          return (
            <div key={category.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">
                    {typeof category.icon === 'string' ? category.icon : <category.icon className="w-4 h-4" />}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {category.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {progress.completed}/{progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Recent Achievements
          </h3>
          <div className="space-y-2">
            {userData.achievements.slice(-3).map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-lg">{achievement.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {achievement.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {achievement.description}
                  </p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Message */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {completionRate === 100 
              ? "🎉 Congratulations! You've completed all tutorials!"
              : completionRate >= 50
              ? "🌟 Great progress! Keep going!"
              : "📚 Keep learning! You're doing great!"
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Learning Progress
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {completedTutorials}/{totalTutorials}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          className="bg-blue-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${completionRate}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
