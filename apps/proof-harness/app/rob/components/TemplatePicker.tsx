/**
 * Template Picker - Browse and select from 40+ app templates
 */

'use client';

import { useState } from 'react';
import { getAllTemplateIds, getTemplate, getTemplatesByDomain } from '@/../../packages/engines/execution-engine/core/src/intelligence/TemplateRegistry';
import type { AppSchema } from '@/../../packages/engines/execution-engine/core/src/intelligence/AppSchema';

interface TemplatePickerProps {
  onSelect: (template: AppSchema) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'event_booking', name: 'Events & Booking', icon: '📅', color: 'blue' },
  { id: 'content_collection', name: 'Collections', icon: '📚', color: 'purple' },
  { id: 'task_management', name: 'Productivity', icon: '✅', color: 'green' },
  { id: 'tracking', name: 'Tracking & Health', icon: '📊', color: 'orange' },
  { id: 'social_network', name: 'Social & Community', icon: '💬', color: 'pink' },
  { id: 'marketplace', name: 'Marketplace', icon: '🛍️', color: 'teal' },
];

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get all templates
  const allTemplateIds = getAllTemplateIds();
  const allTemplates = allTemplateIds.map(id => getTemplate(id)).filter(Boolean) as AppSchema[];

  // Filter templates
  const filteredTemplates = allTemplates.filter(template => {
    const matchesCategory = !selectedCategory || template.domain === selectedCategory;
    const matchesSearch = !searchTerm ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat?.color || 'gray';
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      pink: 'bg-pink-100 text-pink-700 border-pink-300',
      teal: 'bg-teal-100 text-teal-700 border-teal-300',
    };
    return colors[color] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold">Choose Your App Template</h2>
              <p className="text-purple-100 mt-1">40+ templates covering 80% of App Store categories</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>

        <div className="flex h-[calc(90vh-12rem)]">
          {/* Sidebar - Categories */}
          <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === null
                    ? 'bg-purple-100 text-purple-700 font-semibold'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="mr-2">🌟</span>
                All Templates ({allTemplates.length})
              </button>
              {CATEGORIES.map(category => {
                const count = allTemplates.filter(t => t.domain === category.id).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content - Templates Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🔍</div>
                <p className="font-semibold">No templates found</p>
                <p className="text-sm mt-2">Try a different search or category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => {
                  const primaryEntity = Object.values(template.entities)[0];
                  const colorClass = getColorClasses(getCategoryColor(template.domain));

                  return (
                    <button
                      key={template.id}
                      onClick={() => onSelect(template)}
                      className="text-left p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-4xl">{primaryEntity.icon}</div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${colorClass}`}>
                          {CATEGORIES.find(c => c.id === template.domain)?.name}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {template.description}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {Object.keys(template.entities).length} entities
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          {template.theme.primary}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
