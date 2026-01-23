/**
 * TEMPLATE REGISTRY
 *
 * 40+ pre-configured app templates covering 80% of App Store categories.
 * Each template is a declarative AppSchema that MetaTemplateEngine converts to React code.
 */

import type { AppSchema } from './AppSchema';
import { DOMAIN_PRESETS } from './AppSchema';

export const TEMPLATE_REGISTRY: Record<string, AppSchema> = {
  // ===== EVENT & BOOKING APPS (5 templates) =====

  basketball_scheduling: {
    ...DOMAIN_PRESETS.event_booking,
    id: 'basketball_scheduling',
    name: 'Basketball Scheduler',
    description: 'Schedule and join pickup basketball games in your city',
    entities: {
      Game: {
        name: 'Game',
        icon: '🏀',
        fields: {
          location: { type: 'text', label: 'Court/Gym', required: true, icon: '📍' },
          date: { type: 'datetime', label: 'Date & Time', required: true },
          skillLevel: { type: 'select', label: 'Skill Level', options: ['beginner', 'intermediate', 'advanced'], required: true },
          maxPlayers: { type: 'number', label: 'Max Players', required: true, default: 10, min: 4, max: 20 },
          currentPlayers: { type: 'number', label: 'Current Players', default: 0 },
          notes: { type: 'textarea', label: 'Notes' },
        },
        actions: ['create', 'read', 'update', 'delete', 'rsvp', 'cancel'],
      },
    },
    theme: { primary: 'orange', style: 'sporty' },
    sampleData: {
      Game: [
        { id: 1, location: 'Rucker Park', date: '2025-12-28 18:00', skillLevel: 'intermediate', maxPlayers: 10, currentPlayers: 7, notes: 'Bring your own ball' },
        { id: 2, location: 'Venice Beach Courts', date: '2025-12-29 16:00', skillLevel: 'advanced', maxPlayers: 10, currentPlayers: 10, notes: 'Full court' },
        { id: 3, location: 'Community Gym', date: '2025-12-30 19:00', skillLevel: 'beginner', maxPlayers: 8, currentPlayers: 3, notes: 'All welcome!' },
      ],
    },
  } as AppSchema,

  appointment_booking: {
    ...DOMAIN_PRESETS.event_booking,
    id: 'appointment_booking',
    name: 'Appointment Manager',
    description: 'Book and manage appointments',
    entities: {
      Appointment: {
        name: 'Appointment',
        icon: '📅',
        fields: {
          service: { type: 'select', label: 'Service', options: ['consultation', 'treatment', 'checkup'], required: true },
          date: { type: 'datetime', label: 'Date & Time', required: true },
          provider: { type: 'text', label: 'Provider', required: true },
          duration: { type: 'number', label: 'Duration (mins)', default: 30 },
          status: { type: 'select', label: 'Status', options: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
          notes: { type: 'textarea', label: 'Notes' },
        },
        actions: ['create', 'read', 'update', 'cancel'],
      },
    },
    theme: { primary: 'blue', style: 'professional' },
  } as AppSchema,

  restaurant_reservations: {
    ...DOMAIN_PRESETS.event_booking,
    id: 'restaurant_reservations',
    name: 'Table Reservations',
    description: 'Reserve tables at restaurants',
    entities: {
      Reservation: {
        name: 'Reservation',
        icon: '🍽️',
        fields: {
          restaurant: { type: 'text', label: 'Restaurant', required: true },
          date: { type: 'datetime', label: 'Date & Time', required: true },
          partySize: { type: 'number', label: 'Party Size', required: true, min: 1, max: 20 },
          specialRequests: { type: 'textarea', label: 'Special Requests' },
          status: { type: 'select', label: 'Status', options: ['pending', 'confirmed', 'seated', 'completed'], default: 'pending' },
        },
        actions: ['create', 'read', 'update', 'cancel'],
      },
    },
    theme: { primary: 'red', style: 'elegant' },
  } as AppSchema,

  class_scheduler: {
    ...DOMAIN_PRESETS.event_booking,
    id: 'class_scheduler',
    name: 'Class Scheduler',
    description: 'Schedule and attend fitness classes',
    entities: {
      Class: {
        name: 'Class',
        icon: '💪',
        fields: {
          name: { type: 'text', label: 'Class Name', required: true },
          instructor: { type: 'text', label: 'Instructor', required: true },
          date: { type: 'datetime', label: 'Date & Time', required: true },
          duration: { type: 'number', label: 'Duration (mins)', default: 60 },
          maxCapacity: { type: 'number', label: 'Max Capacity', default: 20 },
          currentEnrollment: { type: 'number', label: 'Enrolled', default: 0 },
          level: { type: 'select', label: 'Level', options: ['beginner', 'intermediate', 'advanced'] },
        },
        actions: ['create', 'read', 'rsvp', 'cancel'],
      },
    },
    theme: { primary: 'green', style: 'sporty' },
  } as AppSchema,

  event_tickets: {
    ...DOMAIN_PRESETS.event_booking,
    id: 'event_tickets',
    name: 'Event Tickets',
    description: 'Browse and book event tickets',
    entities: {
      Event: {
        name: 'Event',
        icon: '🎫',
        fields: {
          title: { type: 'text', label: 'Event Name', required: true },
          date: { type: 'datetime', label: 'Date & Time', required: true },
          venue: { type: 'text', label: 'Venue', required: true },
          price: { type: 'currency', label: 'Price', required: true },
          category: { type: 'select', label: 'Category', options: ['concert', 'sports', 'theater', 'comedy', 'conference'] },
          availableTickets: { type: 'number', label: 'Available', default: 100 },
        },
        actions: ['read', 'book', 'favorite'],
      },
    },
    theme: { primary: 'purple', style: 'playful' },
  } as AppSchema,

  // ===== CONTENT COLLECTION APPS (8 templates) =====

  recipe_collection: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'recipe_collection',
    name: 'Recipe Box',
    description: 'Collect and organize your favorite recipes',
    entities: {
      Recipe: {
        name: 'Recipe',
        icon: '🍳',
        fields: {
          title: { type: 'text', label: 'Recipe Name', required: true },
          image: { type: 'image', label: 'Photo', icon: '🍲' },
          prepTime: { type: 'number', label: 'Prep Time (mins)' },
          cookTime: { type: 'number', label: 'Cook Time (mins)' },
          servings: { type: 'number', label: 'Servings', default: 4 },
          category: { type: 'select', label: 'Category', options: ['breakfast', 'lunch', 'dinner', 'dessert', 'snack'] },
          difficulty: { type: 'select', label: 'Difficulty', options: ['easy', 'medium', 'hard'] },
          rating: { type: 'rating', label: 'Rating', min: 1, max: 5 },
        },
        actions: ['create', 'read', 'update', 'delete', 'favorite'],
      },
    },
    theme: { primary: 'orange', style: 'playful' },
  } as AppSchema,

  book_tracker: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'book_tracker',
    name: 'Book Tracker',
    description: 'Track books you\'ve read and want to read',
    entities: {
      Book: {
        name: 'Book',
        icon: '📚',
        fields: {
          title: { type: 'text', label: 'Title', required: true },
          author: { type: 'text', label: 'Author', required: true },
          cover: { type: 'image', label: 'Cover', icon: '📖' },
          status: { type: 'select', label: 'Status', options: ['want-to-read', 'reading', 'finished'], default: 'want-to-read' },
          rating: { type: 'rating', label: 'Rating', min: 1, max: 5 },
          genre: { type: 'select', label: 'Genre', options: ['fiction', 'non-fiction', 'mystery', 'sci-fi', 'romance', 'biography'] },
          notes: { type: 'textarea', label: 'Notes' },
        },
        actions: ['create', 'read', 'update', 'delete', 'favorite'],
      },
    },
    theme: { primary: 'indigo', style: 'elegant' },
  } as AppSchema,

  movie_watchlist: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'movie_watchlist',
    name: 'Movie Watchlist',
    description: 'Track movies you want to watch',
    entities: {
      Movie: {
        name: 'Movie',
        icon: '🎬',
        fields: {
          title: { type: 'text', label: 'Title', required: true },
          year: { type: 'number', label: 'Year' },
          poster: { type: 'image', label: 'Poster', icon: '🎞️' },
          genre: { type: 'select', label: 'Genre', options: ['action', 'comedy', 'drama', 'horror', 'sci-fi', 'thriller'] },
          rating: { type: 'rating', label: 'Rating', min: 1, max: 5 },
          watched: { type: 'boolean', label: 'Watched', default: false },
          notes: { type: 'textarea', label: 'Notes' },
        },
        actions: ['create', 'read', 'update', 'delete', 'favorite'],
      },
    },
    theme: { primary: 'red', style: 'bold' },
  } as AppSchema,

  podcast_library: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'podcast_library',
    name: 'Podcast Library',
    description: 'Organize your favorite podcasts',
    entities: {
      Podcast: {
        name: 'Podcast',
        icon: '🎙️',
        fields: {
          title: { type: 'text', label: 'Podcast Name', required: true },
          host: { type: 'text', label: 'Host' },
          cover: { type: 'image', label: 'Cover Art', icon: '🎧' },
          category: { type: 'select', label: 'Category', options: ['technology', 'business', 'comedy', 'news', 'sports', 'education'] },
          rating: { type: 'rating', label: 'Rating', min: 1, max: 5 },
          subscribed: { type: 'boolean', label: 'Subscribed', default: false },
        },
        actions: ['create', 'read', 'update', 'delete', 'favorite'],
      },
    },
    theme: { primary: 'purple', style: 'modern' },
  } as AppSchema,

  wine_collection: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'wine_collection',
    name: 'Wine Cellar',
    description: 'Track your wine collection',
    entities: {
      Wine: {
        name: 'Wine',
        icon: '🍷',
        fields: {
          name: { type: 'text', label: 'Wine Name', required: true },
          winery: { type: 'text', label: 'Winery' },
          varietal: { type: 'select', label: 'Varietal', options: ['cabernet', 'merlot', 'chardonnay', 'pinot-noir', 'sauvignon-blanc'] },
          vintage: { type: 'number', label: 'Vintage Year' },
          rating: { type: 'rating', label: 'Rating', min: 1, max: 5 },
          price: { type: 'currency', label: 'Price' },
          notes: { type: 'textarea', label: 'Tasting Notes' },
        },
        actions: ['create', 'read', 'update', 'delete', 'favorite'],
      },
    },
    theme: { primary: 'red', style: 'elegant' },
  } as AppSchema,

  plant_care: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'plant_care',
    name: 'Plant Care',
    description: 'Track your houseplants and care schedule',
    entities: {
      Plant: {
        name: 'Plant',
        icon: '🪴',
        fields: {
          name: { type: 'text', label: 'Plant Name', required: true },
          species: { type: 'text', label: 'Species' },
          photo: { type: 'image', label: 'Photo', icon: '🌱' },
          location: { type: 'text', label: 'Location' },
          wateringFrequency: { type: 'select', label: 'Water Every', options: ['daily', 'every-2-days', 'weekly', 'bi-weekly', 'monthly'] },
          lastWatered: { type: 'date', label: 'Last Watered' },
          notes: { type: 'textarea', label: 'Care Notes' },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'green', style: 'minimal' },
  } as AppSchema,

  photo_gallery: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'photo_gallery',
    name: 'Photo Gallery',
    description: 'Organize your photo collection',
    entities: {
      Photo: {
        name: 'Photo',
        icon: '📸',
        fields: {
          title: { type: 'text', label: 'Title', required: true },
          image: { type: 'image', label: 'Photo', icon: '🖼️', required: true },
          date: { type: 'date', label: 'Date Taken' },
          location: { type: 'text', label: 'Location' },
          album: { type: 'select', label: 'Album', options: ['vacation', 'family', 'events', 'nature', 'misc'] },
          tags: { type: 'multiselect', label: 'Tags', options: ['landscape', 'portrait', 'food', 'pets', 'travel'] },
        },
        actions: ['create', 'read', 'delete', 'favorite', 'share'],
      },
    },
    theme: { primary: 'teal', style: 'modern' },
  } as AppSchema,

  quote_collection: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'quote_collection',
    name: 'Quote Collection',
    description: 'Save inspiring quotes',
    entities: {
      Quote: {
        name: 'Quote',
        icon: '💭',
        fields: {
          text: { type: 'textarea', label: 'Quote', required: true },
          author: { type: 'text', label: 'Author' },
          source: { type: 'text', label: 'Source' },
          category: { type: 'select', label: 'Category', options: ['inspirational', 'funny', 'wisdom', 'love', 'motivation'] },
          favorite: { type: 'boolean', label: 'Favorite', default: false },
        },
        actions: ['create', 'read', 'update', 'delete', 'favorite', 'share'],
      },
    },
    theme: { primary: 'indigo', style: 'elegant' },
  } as AppSchema,

  // ===== TASK & PRODUCTIVITY APPS (6 templates) =====

  todo_list: {
    ...DOMAIN_PRESETS.task_management,
    id: 'todo_list',
    name: 'To-Do List',
    description: 'Simple and effective task management',
    theme: { primary: 'blue', style: 'minimal' },
  } as AppSchema,

  habit_tracker: {
    ...DOMAIN_PRESETS.tracking,
    id: 'habit_tracker',
    name: 'Habit Tracker',
    description: 'Build better habits',
    entities: {
      Habit: {
        name: 'Habit',
        icon: '✨',
        fields: {
          name: { type: 'text', label: 'Habit', required: true },
          frequency: { type: 'select', label: 'Frequency', options: ['daily', 'weekly', 'monthly'] },
          streak: { type: 'number', label: 'Current Streak', default: 0 },
          lastCompleted: { type: 'date', label: 'Last Completed' },
          notes: { type: 'textarea', label: 'Notes' },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'green', style: 'motivational' as ThemeStyle },
  } as AppSchema,

  grocery_list: {
    ...DOMAIN_PRESETS.task_management,
    id: 'grocery_list',
    name: 'Grocery List',
    description: 'Never forget items at the store',
    entities: {
      Item: {
        name: 'Item',
        icon: '🛒',
        fields: {
          name: { type: 'text', label: 'Item', required: true },
          quantity: { type: 'number', label: 'Quantity', default: 1 },
          category: { type: 'select', label: 'Category', options: ['produce', 'dairy', 'meat', 'bakery', 'pantry', 'frozen', 'other'] },
          checked: { type: 'boolean', label: 'In Cart', default: false },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'orange', style: 'playful' },
  } as AppSchema,

  goal_tracker: {
    ...DOMAIN_PRESETS.tracking,
    id: 'goal_tracker',
    name: 'Goal Tracker',
    description: 'Set and achieve your goals',
    entities: {
      Goal: {
        name: 'Goal',
        icon: '🎯',
        fields: {
          title: { type: 'text', label: 'Goal', required: true },
          target: { type: 'number', label: 'Target', required: true },
          current: { type: 'number', label: 'Progress', default: 0 },
          deadline: { type: 'date', label: 'Deadline' },
          category: { type: 'select', label: 'Category', options: ['fitness', 'career', 'financial', 'personal', 'learning'] },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'purple', style: 'bold' },
  } as AppSchema,

  project_manager: {
    ...DOMAIN_PRESETS.task_management,
    id: 'project_manager',
    name: 'Project Manager',
    description: 'Manage projects and tasks',
    entities: {
      Project: {
        name: 'Project',
        icon: '📋',
        fields: {
          name: { type: 'text', label: 'Project Name', required: true },
          status: { type: 'select', label: 'Status', options: ['planning', 'in-progress', 'review', 'completed'], default: 'planning' },
          dueDate: { type: 'date', label: 'Due Date' },
          priority: { type: 'select', label: 'Priority', options: ['low', 'medium', 'high', 'urgent'] },
          progress: { type: 'number', label: 'Progress %', min: 0, max: 100, default: 0 },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'indigo', style: 'professional' },
  } as AppSchema,

  reading_list: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'reading_list',
    name: 'Reading List',
    description: 'Track articles and blogs to read',
    entities: {
      Article: {
        name: 'Article',
        icon: '📰',
        fields: {
          title: { type: 'text', label: 'Title', required: true },
          url: { type: 'url', label: 'URL' },
          source: { type: 'text', label: 'Source' },
          category: { type: 'select', label: 'Category', options: ['technology', 'business', 'science', 'design', 'news'] },
          read: { type: 'boolean', label: 'Read', default: false },
          saved: { type: 'date', label: 'Date Saved' },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'gray', style: 'minimal' },
  } as AppSchema,

  // ===== HEALTH & FITNESS APPS (5 templates) =====

  workout_tracker: {
    ...DOMAIN_PRESETS.tracking,
    id: 'workout_tracker',
    name: 'Workout Tracker',
    description: 'Log your workouts and track progress',
    entities: {
      Workout: {
        name: 'Workout',
        icon: '💪',
        fields: {
          exercise: { type: 'text', label: 'Exercise', required: true },
          sets: { type: 'number', label: 'Sets', required: true },
          reps: { type: 'number', label: 'Reps', required: true },
          weight: { type: 'number', label: 'Weight (lbs)' },
          date: { type: 'date', label: 'Date', default: 'today' },
          notes: { type: 'textarea', label: 'Notes' },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'red', style: 'sporty' },
  } as AppSchema,

  meal_planner: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'meal_planner',
    name: 'Meal Planner',
    description: 'Plan your weekly meals',
    entities: {
      Meal: {
        name: 'Meal',
        icon: '🍽️',
        fields: {
          name: { type: 'text', label: 'Meal Name', required: true },
          date: { type: 'date', label: 'Date', required: true },
          mealType: { type: 'select', label: 'Meal Type', options: ['breakfast', 'lunch', 'dinner', 'snack'] },
          calories: { type: 'number', label: 'Calories' },
          prepTime: { type: 'number', label: 'Prep Time (mins)' },
          ingredients: { type: 'textarea', label: 'Ingredients' },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'green', style: 'playful' },
  } as AppSchema,

  water_tracker: {
    ...DOMAIN_PRESETS.tracking,
    id: 'water_tracker',
    name: 'Water Tracker',
    description: 'Track daily water intake',
    entities: {
      Entry: {
        name: 'Entry',
        icon: '💧',
        fields: {
          amount: { type: 'number', label: 'Amount (oz)', required: true, default: 8 },
          time: { type: 'datetime', label: 'Time', default: 'now' },
          date: { type: 'date', label: 'Date', default: 'today' },
        },
        actions: ['create', 'read', 'delete'],
      },
    },
    theme: { primary: 'blue', style: 'minimal' },
  } as AppSchema,

  sleep_tracker: {
    ...DOMAIN_PRESETS.tracking,
    id: 'sleep_tracker',
    name: 'Sleep Tracker',
    description: 'Track sleep patterns',
    entities: {
      Sleep: {
        name: 'Sleep',
        icon: '😴',
        fields: {
          date: { type: 'date', label: 'Date', required: true },
          bedTime: { type: 'datetime', label: 'Bed Time', required: true },
          wakeTime: { type: 'datetime', label: 'Wake Time', required: true },
          hours: { type: 'number', label: 'Hours Slept' },
          quality: { type: 'rating', label: 'Quality', min: 1, max: 5 },
          notes: { type: 'textarea', label: 'Notes' },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'indigo', style: 'minimal' },
  } as AppSchema,

  symptom_tracker: {
    ...DOMAIN_PRESETS.tracking,
    id: 'symptom_tracker',
    name: 'Symptom Tracker',
    description: 'Track health symptoms',
    entities: {
      Symptom: {
        name: 'Symptom',
        icon: '🩺',
        fields: {
          symptom: { type: 'text', label: 'Symptom', required: true },
          severity: { type: 'rating', label: 'Severity', min: 1, max: 5, required: true },
          date: { type: 'datetime', label: 'Date & Time', default: 'now' },
          duration: { type: 'number', label: 'Duration (mins)' },
          notes: { type: 'textarea', label: 'Notes' },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'red', style: 'professional' },
  } as AppSchema,

  // ===== FINANCE APPS (4 templates) =====

  expense_tracker: {
    ...DOMAIN_PRESETS.tracking,
    id: 'expense_tracker',
    name: 'Expense Tracker',
    description: 'Track your spending',
    entities: {
      Expense: {
        name: 'Expense',
        icon: '💰',
        fields: {
          description: { type: 'text', label: 'Description', required: true },
          amount: { type: 'currency', label: 'Amount', required: true },
          category: { type: 'select', label: 'Category', options: ['food', 'transport', 'shopping', 'bills', 'entertainment', 'other'] },
          date: { type: 'date', label: 'Date', default: 'today' },
          paymentMethod: { type: 'select', label: 'Payment', options: ['cash', 'card', 'transfer'] },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'green', style: 'professional' },
  } as AppSchema,

  budget_planner: {
    ...DOMAIN_PRESETS.tracking,
    id: 'budget_planner',
    name: 'Budget Planner',
    description: 'Plan and track your budget',
    entities: {
      Budget: {
        name: 'Budget',
        icon: '📊',
        fields: {
          category: { type: 'select', label: 'Category', options: ['housing', 'food', 'transport', 'utilities', 'entertainment', 'savings'], required: true },
          budgeted: { type: 'currency', label: 'Budgeted Amount', required: true },
          spent: { type: 'currency', label: 'Spent', default: 0 },
          month: { type: 'date', label: 'Month' },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'blue', style: 'professional' },
  } as AppSchema,

  savings_goals: {
    ...DOMAIN_PRESETS.tracking,
    id: 'savings_goals',
    name: 'Savings Goals',
    description: 'Track savings goals',
    entities: {
      Goal: {
        name: 'Goal',
        icon: '🎯',
        fields: {
          name: { type: 'text', label: 'Goal', required: true },
          targetAmount: { type: 'currency', label: 'Target Amount', required: true },
          currentAmount: { type: 'currency', label: 'Current Amount', default: 0 },
          deadline: { type: 'date', label: 'Target Date' },
          priority: { type: 'select', label: 'Priority', options: ['low', 'medium', 'high'] },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'green', style: 'bold' },
  } as AppSchema,

  bill_reminders: {
    ...DOMAIN_PRESETS.task_management,
    id: 'bill_reminders',
    name: 'Bill Reminders',
    description: 'Never miss a bill payment',
    entities: {
      Bill: {
        name: 'Bill',
        icon: '💳',
        fields: {
          name: { type: 'text', label: 'Bill Name', required: true },
          amount: { type: 'currency', label: 'Amount', required: true },
          dueDate: { type: 'date', label: 'Due Date', required: true },
          category: { type: 'select', label: 'Category', options: ['utilities', 'rent', 'insurance', 'subscription', 'loan', 'other'] },
          paid: { type: 'boolean', label: 'Paid', default: false },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'red', style: 'professional' },
  } as AppSchema,

  // ===== SOCIAL & COMMUNITY APPS (3 templates) =====

  community_forum: {
    ...DOMAIN_PRESETS.social_network,
    id: 'community_forum',
    name: 'Community Forum',
    description: 'Community discussion board',
    theme: { primary: 'purple', style: 'modern' },
  } as AppSchema,

  pet_profiles: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'pet_profiles',
    name: 'Pet Profiles',
    description: 'Share and discover pet profiles',
    entities: {
      Pet: {
        name: 'Pet',
        icon: '🐾',
        fields: {
          name: { type: 'text', label: 'Pet Name', required: true },
          species: { type: 'select', label: 'Species', options: ['dog', 'cat', 'bird', 'fish', 'hamster', 'rabbit', 'other'] },
          breed: { type: 'text', label: 'Breed' },
          age: { type: 'number', label: 'Age (years)' },
          photo: { type: 'image', label: 'Photo', icon: '🐶' },
          bio: { type: 'textarea', label: 'Bio' },
        },
        actions: ['create', 'read', 'update', 'delete', 'like', 'share'],
      },
    },
    theme: { primary: 'orange', style: 'playful' },
  } as AppSchema,

  neighborhood_watch: {
    ...DOMAIN_PRESETS.social_network,
    id: 'neighborhood_watch',
    name: 'Neighborhood Watch',
    description: 'Connect with your neighbors',
    entities: {
      Post: {
        name: 'Post',
        icon: '🏘️',
        fields: {
          title: { type: 'text', label: 'Title', required: true },
          description: { type: 'textarea', label: 'Description', required: true },
          category: { type: 'select', label: 'Category', options: ['announcement', 'event', 'alert', 'question', 'recommendation'] },
          location: { type: 'location', label: 'Location' },
          likes: { type: 'number', label: 'Likes', default: 0 },
        },
        actions: ['create', 'read', 'update', 'delete', 'like', 'comment'],
      },
    },
    theme: { primary: 'blue', style: 'professional' },
  } as AppSchema,

  // ===== TRAVEL APPS (3 templates) =====

  trip_planner: {
    ...DOMAIN_PRESETS.event_booking,
    id: 'trip_planner',
    name: 'Trip Planner',
    description: 'Plan your travel itinerary',
    entities: {
      Trip: {
        name: 'Trip',
        icon: '✈️',
        fields: {
          destination: { type: 'text', label: 'Destination', required: true },
          startDate: { type: 'date', label: 'Start Date', required: true },
          endDate: { type: 'date', label: 'End Date', required: true },
          budget: { type: 'currency', label: 'Budget' },
          travelers: { type: 'number', label: 'Travelers', default: 1 },
          notes: { type: 'textarea', label: 'Notes' },
        },
        actions: ['create', 'read', 'update', 'delete', 'share'],
      },
    },
    theme: { primary: 'teal', style: 'playful' },
  } as AppSchema,

  travel_checklist: {
    ...DOMAIN_PRESETS.task_management,
    id: 'travel_checklist',
    name: 'Travel Checklist',
    description: 'Packing and travel checklist',
    entities: {
      Item: {
        name: 'Item',
        icon: '🧳',
        fields: {
          item: { type: 'text', label: 'Item', required: true },
          category: { type: 'select', label: 'Category', options: ['clothing', 'toiletries', 'electronics', 'documents', 'other'] },
          packed: { type: 'boolean', label: 'Packed', default: false },
          priority: { type: 'select', label: 'Priority', options: ['must-have', 'nice-to-have', 'optional'] },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    theme: { primary: 'orange', style: 'playful' },
  } as AppSchema,

  travel_journal: {
    ...DOMAIN_PRESETS.content_collection,
    id: 'travel_journal',
    name: 'Travel Journal',
    description: 'Document your travels',
    entities: {
      Entry: {
        name: 'Entry',
        icon: '📔',
        fields: {
          title: { type: 'text', label: 'Title', required: true },
          location: { type: 'location', label: 'Location', required: true },
          date: { type: 'date', label: 'Date' },
          photo: { type: 'image', label: 'Photo', icon: '📷' },
          description: { type: 'textarea', label: 'Description' },
          rating: { type: 'rating', label: 'Rating', min: 1, max: 5 },
        },
        actions: ['create', 'read', 'update', 'delete', 'share'],
      },
    },
    theme: { primary: 'purple', style: 'elegant' },
  } as AppSchema,

  // ===== MARKETPLACE APPS (3 templates) =====

  local_marketplace: {
    ...DOMAIN_PRESETS.marketplace,
    id: 'local_marketplace',
    name: 'Local Marketplace',
    description: 'Buy and sell locally',
    theme: { primary: 'green', style: 'modern' },
  } as AppSchema,

  rental_listings: {
    ...DOMAIN_PRESETS.marketplace,
    id: 'rental_listings',
    name: 'Rental Listings',
    description: 'Find apartments and homes for rent',
    entities: {
      Property: {
        name: 'Property',
        icon: '🏠',
        fields: {
          title: { type: 'text', label: 'Property Title', required: true },
          address: { type: 'location', label: 'Address', required: true },
          rent: { type: 'currency', label: 'Monthly Rent', required: true },
          bedrooms: { type: 'number', label: 'Bedrooms', required: true },
          bathrooms: { type: 'number', label: 'Bathrooms', required: true },
          image: { type: 'image', label: 'Photo', icon: '🏡' },
          available: { type: 'date', label: 'Available Date' },
        },
        actions: ['read', 'book', 'favorite'],
      },
    },
    theme: { primary: 'blue', style: 'professional' },
  } as AppSchema,

  service_marketplace: {
    ...DOMAIN_PRESETS.marketplace,
    id: 'service_marketplace',
    name: 'Service Marketplace',
    description: 'Find local services',
    entities: {
      Service: {
        name: 'Service',
        icon: '🔧',
        fields: {
          title: { type: 'text', label: 'Service', required: true },
          provider: { type: 'text', label: 'Provider', required: true },
          category: { type: 'select', label: 'Category', options: ['cleaning', 'plumbing', 'electrical', 'moving', 'tutoring', 'other'] },
          price: { type: 'currency', label: 'Price' },
          rating: { type: 'rating', label: 'Rating', min: 1, max: 5 },
          description: { type: 'textarea', label: 'Description' },
        },
        actions: ['read', 'book', 'favorite'],
      },
    },
    theme: { primary: 'orange', style: 'professional' },
  } as AppSchema,
};

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): AppSchema | null {
  return TEMPLATE_REGISTRY[templateId] || null;
}

/**
 * Search templates by keywords
 */
export function searchTemplates(keywords: string[]): AppSchema[] {
  const results: AppSchema[] = [];
  const searchTerms = keywords.map(k => k.toLowerCase());

  for (const template of Object.values(TEMPLATE_REGISTRY)) {
    const searchableText = `${template.name} ${template.description} ${template.domain}`.toLowerCase();

    const matchCount = searchTerms.filter(term => searchableText.includes(term)).length;

    if (matchCount > 0) {
      results.push(template);
    }
  }

  // Sort by match count (most relevant first)
  return results.sort((a, b) => {
    const scoreA = searchTerms.filter(term =>
      `${a.name} ${a.description}`.toLowerCase().includes(term)
    ).length;
    const scoreB = searchTerms.filter(term =>
      `${b.name} ${b.description}`.toLowerCase().includes(term)
    ).length;
    return scoreB - scoreA;
  });
}

/**
 * Get all template IDs
 */
export function getAllTemplateIds(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}

/**
 * Get templates by domain
 */
export function getTemplatesByDomain(domain: string): AppSchema[] {
  return Object.values(TEMPLATE_REGISTRY).filter(t => t.domain === domain);
}
