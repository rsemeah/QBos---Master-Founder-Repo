/**
 * APP SCHEMA DEFINITIONS
 *
 * Declarative schema for defining apps without writing code.
 * Define your app's structure, and the MetaTemplateEngine generates the React components.
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'image'
  | 'color'
  | 'select'
  | 'multiselect'
  | 'location'
  | 'rating'
  | 'currency'
  | 'textarea';

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'join' | 'leave' | 'like' | 'share' | 'comment' | 'rsvp' | 'book' | 'cancel' | 'rate' | 'favorite';

export type LayoutType = 'grid' | 'list' | 'timeline' | 'calendar' | 'map' | 'table' | 'kanban' | 'gallery';

export type ThemeStyle = 'modern' | 'minimal' | 'playful' | 'professional' | 'sporty' | 'elegant' | 'bold';

export type ColorPalette = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'teal' | 'indigo' | 'yellow' | 'gray';

export interface FieldDefinition {
  type: FieldType;
  label: string;
  required?: boolean;
  default?: any;
  placeholder?: string;
  validation?: string; // Regex pattern or validation rule
  options?: string[]; // For select/multiselect
  min?: number;
  max?: number;
  icon?: string; // Emoji or icon name
}

export interface EntityDefinition {
  name: string;
  icon: string; // Emoji representing this entity
  fields: Record<string, FieldDefinition>;
  actions: ActionType[];
  relationships?: Record<string, {
    entity: string;
    type: 'one-to-many' | 'many-to-many' | 'one-to-one';
  }>;
}

export interface ViewDefinition {
  type: 'list' | 'detail' | 'create' | 'edit';
  entity: string;
  layout?: LayoutType;
  filters?: string[]; // Field names that can be filtered
  sortBy?: string[]; // Field names that can be sorted
  searchable?: boolean;
  actions?: ActionType[];
  showRelated?: string[]; // Related entities to display
  columns?: number; // Grid columns (for grid layout)
}

export interface ThemeDefinition {
  primary: ColorPalette;
  style: ThemeStyle;
  gradient?: boolean;
  darkMode?: boolean;
}

export interface FeatureFlags {
  auth?: boolean;
  realtime?: boolean;
  notifications?: boolean;
  payments?: boolean;
  location?: boolean;
  social?: boolean;
  analytics?: boolean;
  offline?: boolean;
}

/**
 * Complete App Schema
 * This is what gets passed to MetaTemplateEngine.generate()
 */
export interface AppSchema {
  // Metadata
  id: string;
  name: string;
  description: string;
  domain: string; // e.g., 'event_booking', 'content_collection', 'social_network'

  // Data model
  entities: Record<string, EntityDefinition>;

  // UI structure
  views: Record<string, ViewDefinition>;

  // Design
  theme: ThemeDefinition;

  // Features
  features: FeatureFlags;

  // Sample data (for preview)
  sampleData?: Record<string, any[]>;
}

/**
 * Domain-specific presets
 * Common patterns for different app types
 */
export const DOMAIN_PRESETS: Record<string, Partial<AppSchema>> = {
  event_booking: {
    domain: 'event_booking',
    entities: {
      Event: {
        name: 'Event',
        icon: '📅',
        fields: {
          title: { type: 'text', label: 'Event Name', required: true },
          description: { type: 'textarea', label: 'Description' },
          date: { type: 'datetime', label: 'Date & Time', required: true },
          location: { type: 'location', label: 'Location', required: true },
          maxParticipants: { type: 'number', label: 'Max Participants', min: 1 },
          currentParticipants: { type: 'number', label: 'Current Participants', default: 0 },
        },
        actions: ['create', 'read', 'update', 'delete', 'rsvp', 'cancel'],
      },
    },
    views: {
      list: { type: 'list', entity: 'Event', layout: 'grid', filters: ['date', 'location'], searchable: true },
      detail: { type: 'detail', entity: 'Event', actions: ['rsvp', 'cancel'], showRelated: ['participants'] },
      create: { type: 'create', entity: 'Event' },
    },
    features: { auth: true, realtime: true, notifications: true, location: true },
  },

  content_collection: {
    domain: 'content_collection',
    entities: {
      Item: {
        name: 'Item',
        icon: '📚',
        fields: {
          title: { type: 'text', label: 'Title', required: true },
          description: { type: 'textarea', label: 'Description' },
          image: { type: 'image', label: 'Image' },
          category: { type: 'select', label: 'Category', options: [] },
          rating: { type: 'rating', label: 'Rating', min: 1, max: 5 },
          tags: { type: 'multiselect', label: 'Tags', options: [] },
        },
        actions: ['create', 'read', 'update', 'delete', 'favorite', 'share'],
      },
    },
    views: {
      list: { type: 'list', entity: 'Item', layout: 'grid', filters: ['category', 'rating'], searchable: true },
      detail: { type: 'detail', entity: 'Item', actions: ['favorite', 'share'] },
      create: { type: 'create', entity: 'Item' },
    },
    features: { auth: true, social: true },
  },

  task_management: {
    domain: 'task_management',
    entities: {
      Task: {
        name: 'Task',
        icon: '✅',
        fields: {
          title: { type: 'text', label: 'Task', required: true },
          completed: { type: 'boolean', label: 'Completed', default: false },
          priority: { type: 'select', label: 'Priority', options: ['high', 'medium', 'low'] },
          dueDate: { type: 'date', label: 'Due Date' },
          category: { type: 'select', label: 'Category', options: [] },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    views: {
      list: { type: 'list', entity: 'Task', layout: 'list', filters: ['completed', 'priority'], sortBy: ['dueDate', 'priority'], searchable: true },
      detail: { type: 'detail', entity: 'Task', actions: ['update', 'delete'] },
      create: { type: 'create', entity: 'Task' },
    },
    features: { auth: true, notifications: true },
  },

  social_network: {
    domain: 'social_network',
    entities: {
      Post: {
        name: 'Post',
        icon: '💬',
        fields: {
          content: { type: 'textarea', label: 'What\'s on your mind?', required: true },
          image: { type: 'image', label: 'Image' },
          likes: { type: 'number', label: 'Likes', default: 0 },
          comments: { type: 'number', label: 'Comments', default: 0 },
        },
        actions: ['create', 'read', 'update', 'delete', 'like', 'comment', 'share'],
      },
    },
    views: {
      list: { type: 'list', entity: 'Post', layout: 'timeline', searchable: true },
      detail: { type: 'detail', entity: 'Post', actions: ['like', 'comment', 'share'], showRelated: ['comments'] },
      create: { type: 'create', entity: 'Post' },
    },
    features: { auth: true, realtime: true, social: true, notifications: true },
  },

  tracking: {
    domain: 'tracking',
    entities: {
      Entry: {
        name: 'Entry',
        icon: '📊',
        fields: {
          date: { type: 'date', label: 'Date', required: true, default: 'today' },
          value: { type: 'number', label: 'Value', required: true },
          category: { type: 'select', label: 'Category', options: [] },
          notes: { type: 'textarea', label: 'Notes' },
        },
        actions: ['create', 'read', 'update', 'delete'],
      },
    },
    views: {
      list: { type: 'list', entity: 'Entry', layout: 'timeline', filters: ['category'], sortBy: ['date'], searchable: false },
      detail: { type: 'detail', entity: 'Entry', actions: ['update', 'delete'] },
      create: { type: 'create', entity: 'Entry' },
    },
    features: { auth: true, analytics: true },
  },

  marketplace: {
    domain: 'marketplace',
    entities: {
      Listing: {
        name: 'Listing',
        icon: '🛍️',
        fields: {
          title: { type: 'text', label: 'Title', required: true },
          description: { type: 'textarea', label: 'Description', required: true },
          price: { type: 'currency', label: 'Price', required: true },
          image: { type: 'image', label: 'Image', required: true },
          category: { type: 'select', label: 'Category', options: [] },
          condition: { type: 'select', label: 'Condition', options: ['new', 'like-new', 'used', 'refurbished'] },
          location: { type: 'location', label: 'Location' },
        },
        actions: ['create', 'read', 'update', 'delete', 'book', 'favorite'],
      },
    },
    views: {
      list: { type: 'list', entity: 'Listing', layout: 'grid', filters: ['category', 'price', 'condition'], searchable: true },
      detail: { type: 'detail', entity: 'Listing', actions: ['book', 'favorite'] },
      create: { type: 'create', entity: 'Listing' },
    },
    features: { auth: true, payments: true, location: true },
  },
};
