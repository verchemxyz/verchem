'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTutorial } from '@/lib/tutorials/context';
import { TutorialProgressTracker } from './tutorial-progress';
import { 
  Play, 
  BookOpen, 
  Award, 
  Clock, 
  Filter, 
  Search, 
  Star, 
  ChevronRight,
  CheckCircle
} from 'lucide-react';

export function TutorialDashboard() {
  const { state, startTutorial, getRecommendedTutorials, isTutorialCompleted } = useTutorial();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'difficulty' | 'duration' | 'progress'>('featured');

  const { availableTutorials, userData } = state;
  const recommendedTutorials = getRecommendedTutorials();

  const categories = [
    { id: 'all', name: 'All Tutorials', icon: BookOpen, count: availableTutorials.length },
    { id: 'getting-started', name: 'Getting Started', icon: Play, count: 0 },
    { id: 'periodic-table', name: 'Periodic Table', icon: '🧪', count: 0 },
    { id: '3d-viewer', name: '3D Viewer', icon: '🔬', count: 0 },
    { id: 'molecule-builder', name: 'Molecule Builder', icon: '🏗️', count: 0 },
    { id: 'calculators', name: 'Calculators', icon: '🧮', count: 0 },
    { id: 'advanced-features', name: 'Advanced Features', icon: '⚙️', count: 0 },
    { id: 'chemistry-concepts', name: 'Chemistry Concepts', icon: '⚛️', count: 0 },
  ].map(cat => ({
    ...cat,
    count: availableTutorials.filter(t => cat.id === 'all' || t.category === cat.id).length
  }));

  const getFilteredAndSortedTutorials = () => {
    let tutorials = availableTutorials;

    // Category filter
    if (selectedCategory !== 'all') {
      tutorials = tutorials.filter(t => t.category === selectedCategory);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      tutorials = tutorials.filter(t => t.difficulty === difficultyFilter);
    }

    // Search filter
    if (searchQuery) {
      tutorials = tutorials.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sorting
    switch (sortBy) {
      case 'featured':
        tutorials = [...tutorials].sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
        break;
      case 'difficulty':
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
        tutorials = [...tutorials].sort((a, b) => 
          difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        );
        break;
      case 'duration':
        tutorials = [...tutorials].sort((a, b) => a.estimatedTime - b.estimatedTime);
        break;
      case 'progress':
        tutorials = [...tutorials].sort((a, b) => {
          const aCompleted = isTutorialCompleted(a.id);
          const bCompleted = isTutorialCompleted(b.id);
          if (aCompleted && !bCompleted) return 1;
          if (!aCompleted && bCompleted) return -1;
          return 0;
        });
        break;
    }

    return tutorials;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'advanced': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getCategoryStats = () => {
    const stats = categories.map(cat => ({
      ...cat,
      completed: availableTutorials.filter(t => 
        (cat.id === 'all' || t.category === cat.id) && isTutorialCompleted(t.id)
      ).length
    }));
    return stats;
  };

  const stats = getCategoryStats();
  const filteredTutorials = getFilteredAndSortedTutorials();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Learning Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Master VerChem with interactive tutorials and comprehensive help resources
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tutorials</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {availableTutorials.length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userData?.completedTutorials.length || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Achievements</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userData?.achievements.length || 0}
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round((userData?.totalTimeSpent || 0) / 60)}m
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Progress & Categories */}
          <div className="space-y-6">
            {/* Progress Tracker */}
            <TutorialProgressTracker />

            {/* Category Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Progress by Category
              </h3>
              <div className="space-y-3">
                {stats.map((category) => (
                  <div
                    key={category.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {typeof category.icon === 'string' ? category.icon : <category.icon className="w-5 h-5" />}
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {category.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {category.completed}/{category.count}
                        </div>
                        <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full"
                            style={{ width: `${category.count > 0 ? (category.completed / category.count) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Tutorials */}
            {recommendedTutorials.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recommended for You
                </h3>
                <div className="space-y-3">
                  {recommendedTutorials.slice(0, 3).map((tutorial) => (
                    <div
                      key={tutorial.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => startTutorial(tutorial)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{tutorial.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {tutorial.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {tutorial.estimatedTime} min • {tutorial.difficulty}
                            </p>
                          </div>
                        </div>
                        <Play className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Tutorial List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              {/* Filters and Search */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tutorials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'featured' | 'difficulty' | 'duration' | 'progress')}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="featured">Featured</option>
                    <option value="difficulty">Difficulty</option>
                    <option value="duration">Duration</option>
                    <option value="progress">Progress</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Filter className="w-4 h-4" />
                  <span>{filteredTutorials.length} tutorials found</span>
                </div>
              </div>

              {/* Tutorial Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTutorials.map((tutorial) => {
                    const isCompleted = isTutorialCompleted(tutorial.id);
                    const isRecommended = recommendedTutorials.some(rt => rt.id === tutorial.id);
                    
                    return (
                      <motion.div
                        key={tutorial.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isCompleted
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                            : isRecommended
                            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => startTutorial(tutorial)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{tutorial.icon}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {tutorial.title}
                              </h3>
                              {tutorial.featured && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                          {tutorial.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full ${getDifficultyColor(tutorial.difficulty)}`}>
                              {tutorial.difficulty}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {tutorial.estimatedTime} min
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        
                        {/* Tags */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {tutorial.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {filteredTutorials.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No tutorials found matching your criteria.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setDifficultyFilter('all');
                      }}
                      className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
