/**
 * PATTERN MATCHER
 *
 * Matches user ideas to the 40+ templates in TemplateRegistry
 * Uses keyword matching, domain detection, and fuzzy matching
 */

export interface PatternMatch {
  templateId: string;
  confidence: 'high' | 'medium' | 'low';
  score: number;
  matchedKeywords: string[];
}

/**
 * Template pattern definitions
 * Maps keywords and patterns to template IDs
 */
const TEMPLATE_PATTERNS: Record<string, {
  keywords: string[];
  synonyms: string[];
  domain: string;
  category: string;
}> = {
  // Event & Booking Apps (5)
  basketball_scheduling: {
    keywords: ['basketball', 'pickup', 'game', 'court', 'player', 'schedule', 'sport'],
    synonyms: ['hoops', 'b-ball', 'pickup game', 'rec league'],
    domain: 'event_booking',
    category: 'sports',
  },
  appointment_booking: {
    keywords: ['appointment', 'booking', 'schedule', 'reservation', 'consultation'],
    synonyms: ['book', 'reserve', 'meeting', 'session'],
    domain: 'event_booking',
    category: 'professional',
  },
  restaurant_reservations: {
    keywords: ['restaurant', 'table', 'dining', 'reservation', 'food'],
    synonyms: ['book table', 'dinner', 'reservations'],
    domain: 'event_booking',
    category: 'food',
  },
  class_scheduler: {
    keywords: ['class', 'fitness', 'yoga', 'gym', 'workout', 'instructor'],
    synonyms: ['exercise class', 'fitness class', 'gym class'],
    domain: 'event_booking',
    category: 'fitness',
  },
  event_tickets: {
    keywords: ['event', 'ticket', 'concert', 'show', 'venue', 'entertainment'],
    synonyms: ['tickets', 'events', 'shows'],
    domain: 'event_booking',
    category: 'entertainment',
  },

  // Content Collection Apps (8)
  recipe_collection: {
    keywords: ['recipe', 'cooking', 'food', 'ingredients', 'meal', 'kitchen'],
    synonyms: ['cook', 'dish', 'cookbook', 'recipes'],
    domain: 'content_collection',
    category: 'food',
  },
  book_tracker: {
    keywords: ['book', 'reading', 'library', 'author', 'novel', 'literature'],
    synonyms: ['books', 'read', 'reading list', 'bookshelf'],
    domain: 'content_collection',
    category: 'education',
  },
  movie_watchlist: {
    keywords: ['movie', 'film', 'watch', 'cinema', 'watchlist'],
    synonyms: ['movies', 'films', 'to watch'],
    domain: 'content_collection',
    category: 'entertainment',
  },
  podcast_library: {
    keywords: ['podcast', 'episode', 'audio', 'listen', 'show'],
    synonyms: ['podcasts', 'listening'],
    domain: 'content_collection',
    category: 'media',
  },
  wine_collection: {
    keywords: ['wine', 'cellar', 'bottle', 'vintage', 'tasting'],
    synonyms: ['wines', 'wine cellar', 'wine collection'],
    domain: 'content_collection',
    category: 'lifestyle',
  },
  plant_care: {
    keywords: ['plant', 'garden', 'watering', 'houseplant', 'care'],
    synonyms: ['plants', 'gardening', 'plant care'],
    domain: 'content_collection',
    category: 'lifestyle',
  },
  photo_gallery: {
    keywords: ['photo', 'picture', 'image', 'gallery', 'album'],
    synonyms: ['photos', 'pictures', 'photography'],
    domain: 'content_collection',
    category: 'media',
  },
  quote_collection: {
    keywords: ['quote', 'saying', 'wisdom', 'inspiration', 'author'],
    synonyms: ['quotes', 'sayings', 'inspirational'],
    domain: 'content_collection',
    category: 'lifestyle',
  },

  // Task & Productivity Apps (6)
  todo_list: {
    keywords: ['todo', 'task', 'checklist', 'list', 'productivity'],
    synonyms: ['to-do', 'tasks', 'to do'],
    domain: 'task_management',
    category: 'productivity',
  },
  habit_tracker: {
    keywords: ['habit', 'routine', 'daily', 'streak', 'track'],
    synonyms: ['habits', 'daily routine', 'habit tracking'],
    domain: 'tracking',
    category: 'productivity',
  },
  grocery_list: {
    keywords: ['grocery', 'shopping', 'store', 'items', 'food'],
    synonyms: ['groceries', 'shopping list', 'market'],
    domain: 'task_management',
    category: 'lifestyle',
  },
  goal_tracker: {
    keywords: ['goal', 'target', 'achieve', 'progress', 'objective'],
    synonyms: ['goals', 'targets', 'milestones'],
    domain: 'tracking',
    category: 'productivity',
  },
  project_manager: {
    keywords: ['project', 'manage', 'team', 'deadline', 'milestone'],
    synonyms: ['projects', 'project management', 'pm'],
    domain: 'task_management',
    category: 'professional',
  },
  reading_list: {
    keywords: ['article', 'blog', 'read later', 'link', 'url'],
    synonyms: ['articles', 'reading', 'read list'],
    domain: 'content_collection',
    category: 'education',
  },

  // Health & Fitness Apps (5)
  workout_tracker: {
    keywords: ['workout', 'exercise', 'fitness', 'gym', 'training'],
    synonyms: ['workouts', 'exercises', 'lifting', 'strength'],
    domain: 'tracking',
    category: 'fitness',
  },
  meal_planner: {
    keywords: ['meal', 'plan', 'diet', 'nutrition', 'food'],
    synonyms: ['meal planning', 'diet plan', 'meal prep'],
    domain: 'content_collection',
    category: 'health',
  },
  water_tracker: {
    keywords: ['water', 'hydration', 'drink', 'intake', 'fluid'],
    synonyms: ['hydrate', 'water intake', 'drinking'],
    domain: 'tracking',
    category: 'health',
  },
  sleep_tracker: {
    keywords: ['sleep', 'rest', 'bedtime', 'wake', 'hours'],
    synonyms: ['sleeping', 'sleep tracking', 'sleep log'],
    domain: 'tracking',
    category: 'health',
  },
  symptom_tracker: {
    keywords: ['symptom', 'health', 'medical', 'condition', 'pain'],
    synonyms: ['symptoms', 'health tracking', 'medical log'],
    domain: 'tracking',
    category: 'health',
  },

  // Finance Apps (4)
  expense_tracker: {
    keywords: ['expense', 'spend', 'money', 'cost', 'budget'],
    synonyms: ['expenses', 'spending', 'costs'],
    domain: 'tracking',
    category: 'finance',
  },
  budget_planner: {
    keywords: ['budget', 'finance', 'money', 'plan', 'allocate'],
    synonyms: ['budgeting', 'financial planning'],
    domain: 'tracking',
    category: 'finance',
  },
  savings_goals: {
    keywords: ['savings', 'save', 'goal', 'money', 'target'],
    synonyms: ['saving', 'save money', 'financial goal'],
    domain: 'tracking',
    category: 'finance',
  },
  bill_reminders: {
    keywords: ['bill', 'payment', 'due', 'reminder', 'invoice'],
    synonyms: ['bills', 'payments', 'due dates'],
    domain: 'task_management',
    category: 'finance',
  },

  // Social & Community Apps (3)
  community_forum: {
    keywords: ['community', 'forum', 'discussion', 'post', 'social'],
    synonyms: ['forums', 'community board', 'discussion board'],
    domain: 'social_network',
    category: 'social',
  },
  pet_profiles: {
    keywords: ['pet', 'dog', 'cat', 'animal', 'profile'],
    synonyms: ['pets', 'animals', 'pet profile'],
    domain: 'content_collection',
    category: 'lifestyle',
  },
  neighborhood_watch: {
    keywords: ['neighborhood', 'neighbor', 'local', 'community', 'area'],
    synonyms: ['neighbours', 'local community'],
    domain: 'social_network',
    category: 'social',
  },

  // Travel Apps (3)
  trip_planner: {
    keywords: ['trip', 'travel', 'vacation', 'itinerary', 'destination'],
    synonyms: ['trips', 'traveling', 'holiday'],
    domain: 'event_booking',
    category: 'travel',
  },
  travel_checklist: {
    keywords: ['travel', 'packing', 'luggage', 'checklist', 'trip'],
    synonyms: ['pack', 'packing list', 'travel list'],
    domain: 'task_management',
    category: 'travel',
  },
  travel_journal: {
    keywords: ['travel', 'journal', 'diary', 'trip', 'memory'],
    synonyms: ['travel diary', 'trip journal'],
    domain: 'content_collection',
    category: 'travel',
  },

  // Marketplace Apps (3)
  local_marketplace: {
    keywords: ['marketplace', 'buy', 'sell', 'local', 'listing'],
    synonyms: ['market', 'buying', 'selling', 'classifieds'],
    domain: 'marketplace',
    category: 'commerce',
  },
  rental_listings: {
    keywords: ['rental', 'apartment', 'house', 'rent', 'property'],
    synonyms: ['rentals', 'housing', 'apartments'],
    domain: 'marketplace',
    category: 'real-estate',
  },
  service_marketplace: {
    keywords: ['service', 'provider', 'hire', 'professional', 'contractor'],
    synonyms: ['services', 'professionals', 'freelance'],
    domain: 'marketplace',
    category: 'services',
  },
};

/**
 * Match user idea to templates
 */
export function matchIdeaToTemplates(idea: string): PatternMatch[] {
  const lowerIdea = idea.toLowerCase();
  const matches: PatternMatch[] = [];

  // Score each template
  for (const [templateId, pattern] of Object.entries(TEMPLATE_PATTERNS)) {
    let score = 0;
    const matchedKeywords: string[] = [];

    // Check keywords (weight: 10 points each)
    for (const keyword of pattern.keywords) {
      if (lowerIdea.includes(keyword)) {
        score += 10;
        matchedKeywords.push(keyword);
      }
    }

    // Check synonyms (weight: 7 points each)
    for (const synonym of pattern.synonyms) {
      if (lowerIdea.includes(synonym)) {
        score += 7;
        matchedKeywords.push(synonym);
      }
    }

    // Check category (weight: 5 points)
    if (lowerIdea.includes(pattern.category)) {
      score += 5;
    }

    // Only include if there's at least one match
    if (score > 0) {
      let confidence: 'high' | 'medium' | 'low';
      if (score >= 20) {
        confidence = 'high';
      } else if (score >= 10) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      matches.push({
        templateId,
        confidence,
        score,
        matchedKeywords: [...new Set(matchedKeywords)],
      });
    }
  }

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

/**
 * Get best template match
 */
export function getBestTemplateMatch(idea: string): PatternMatch | null {
  const matches = matchIdeaToTemplates(idea);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Get all template matches above a confidence threshold
 */
export function getRelevantTemplates(idea: string, minConfidence: 'low' | 'medium' | 'high' = 'low'): PatternMatch[] {
  const confidenceLevels = { low: 0, medium: 1, high: 2 };
  const threshold = confidenceLevels[minConfidence];

  return matchIdeaToTemplates(idea).filter(match => {
    return confidenceLevels[match.confidence] >= threshold;
  });
}
