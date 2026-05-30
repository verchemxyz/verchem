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
    { id: 'periodic-table', name: 'Periodic Table', icon: BookOpen, count: 0 },
    { id: '3d-viewer', name: '3D Viewer', icon: BookOpen, count: 0 },
    { id: 'molecule-builder', name: 'Molecule Builder', icon: BookOpen, count: 0 },
    { id: 'calculators', name: 'Calculators', icon: BookOpen, count: 0 },
    { id: 'advanced-features', name: 'Advanced Features', icon: BookOpen, count: 0 },
    { id: 'chemistry-concepts', name: 'Chemistry Concepts', icon: BookOpen, count: 0 },
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
      case 'beginner': return 'text-success bg-success/10';
      case 'intermediate': return 'text-warning bg-warning/10';
      case 'advanced': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Learning Center
          </h1>
          <p className="text-muted-foreground">
            Master VerChem with interactive tutorials and comprehensive help resources
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tutorials</p>
                <p className="text-2xl font-bold text-foreground">
                  {availableTutorials.length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-primary-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">
                  {userData?.completedTutorials.length || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold text-foreground">
                  {userData?.achievements.length || 0}
                </p>
              </div>
              <Award className="w-8 h-8 text-warning" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round((userData?.totalTimeSpent || 0) / 60)}m
                </p>
              </div>
              <Clock className="w-8 h-8 text-secondary-600" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Progress & Categories */}
          <div className="space-y-6">
            {/* Progress Tracker */}
            <TutorialProgressTracker />

            {/* Category Progress */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Progress by Category
              </h3>
              <div className="space-y-3">
                {stats.map((category) => (
                  <div
                    key={category.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-50 border border-primary-200'
                        : 'bg-muted hover:bg-border'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg text-muted-foreground">
                          {typeof category.icon === 'string' ? category.icon : <category.icon className="w-5 h-5" />}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {category.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {category.completed}/{category.count}
                        </div>
                        <div className="w-16 bg-muted rounded-full h-1 mt-1">
                          <div
                            className="bg-primary-600 h-1 rounded-full"
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
              <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Recommended for You
                </h3>
                <div className="space-y-3">
                  {recommendedTutorials.slice(0, 3).map((tutorial) => (
                    <div
                      key={tutorial.id}
                      className="p-3 bg-muted rounded-lg hover:bg-border transition-colors cursor-pointer"
                      onClick={() => startTutorial(tutorial)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{tutorial.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {tutorial.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tutorial.estimatedTime} min • {tutorial.difficulty}
                            </p>
                          </div>
                        </div>
                        <Play className="w-4 h-4 text-primary-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Tutorial List */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg shadow-sm">
              {/* Filters and Search */}
              <div className="p-6 border-b border-border">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search tutorials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-card text-foreground"
                    />
                  </div>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-card text-foreground"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'featured' | 'difficulty' | 'duration' | 'progress')}
                    className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-card text-foreground"
                  >
                    <option value="featured">Featured</option>
                    <option value="difficulty">Difficulty</option>
                    <option value="duration">Duration</option>
                    <option value="progress">Progress</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
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
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          isCompleted
                            ? 'border-success/40 bg-success/10'
                            : isRecommended
                            ? 'border-primary-200 bg-primary-50'
                            : 'border-border bg-card hover:border-muted-foreground'
                        }`}
                        onClick={() => startTutorial(tutorial)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{tutorial.icon}</span>
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {tutorial.title}
                              </h3>
                              {tutorial.featured && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-warning/10 text-warning">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-success-foreground" />
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {tutorial.description}
                        </p>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full ${getDifficultyColor(tutorial.difficulty)}`}>
                              {tutorial.difficulty}
                            </span>
                            <span className="text-muted-foreground">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {tutorial.estimatedTime} min
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>

                        {/* Tags */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {tutorial.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded"
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
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No tutorials found matching your criteria.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setDifficultyFilter('all');
                      }}
                      className="mt-2 text-primary-600 hover:underline"
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
