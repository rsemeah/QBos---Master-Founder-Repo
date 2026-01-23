/**
 * META-TEMPLATE ENGINE
 *
 * Generates full React applications from declarative AppSchema definitions.
 * One system that produces 40+ templates.
 *
 * INPUT: AppSchema (JSON config describing the app)
 * OUTPUT: Complete React component with TypeScript, Tailwind, and state management
 */

import type {
  AppSchema,
  EntityDefinition,
  ViewDefinition,
  FieldDefinition,
  ColorPalette,
  ThemeStyle,
} from './AppSchema';

export interface GeneratedTemplate {
  componentName: string;
  code: string;
  linesOfCode: number;
  entities: string[];
  features: string[];
}

export class MetaTemplateEngine {
  /**
   * Generate complete React component from schema
   */
  generate(schema: AppSchema): GeneratedTemplate {
    const componentName = this.toComponentName(schema.name);
    const entities = Object.keys(schema.entities);

    // Generate imports
    const imports = this.generateImports(schema);

    // Generate TypeScript interfaces
    const interfaces = this.generateInterfaces(schema);

    // Generate sample data
    const sampleData = this.generateSampleData(schema);

    // Generate component body
    const component = this.generateComponent(schema, componentName);

    // Combine all parts
    const code = `${imports}\n\n${interfaces}\n\n${sampleData}\n\n${component}`;

    return {
      componentName,
      code,
      linesOfCode: code.split('\n').length,
      entities,
      features: Object.keys(schema.features).filter(k => schema.features[k as keyof typeof schema.features]),
    };
  }

  /**
   * Generate imports section
   */
  private generateImports(schema: AppSchema): string {
    return `import React, { useState } from 'react';`;
  }

  /**
   * Generate TypeScript interfaces for all entities
   */
  private generateInterfaces(schema: AppSchema): string {
    const interfaces: string[] = [];

    for (const [entityName, entity] of Object.entries(schema.entities)) {
      const fields: string[] = [];

      fields.push('  id: number;');

      for (const [fieldName, field] of Object.entries(entity.fields)) {
        const tsType = this.fieldTypeToTypeScript(field.type);
        const optional = field.required ? '' : '?';
        fields.push(`  ${fieldName}${optional}: ${tsType};`);
      }

      interfaces.push(`interface ${entityName} {\n${fields.join('\n')}\n}`);
    }

    return interfaces.join('\n\n');
  }

  /**
   * Generate sample data for preview
   */
  private generateSampleData(schema: AppSchema): string {
    const samples: string[] = [];

    for (const [entityName, entity] of Object.entries(schema.entities)) {
      const sampleItems = schema.sampleData?.[entityName] || this.generateDefaultSampleData(entity, entityName);
      const dataName = `SAMPLE_${this.toConstantCase(entityName)}`;

      samples.push(
        `const ${dataName}: ${entityName}[] = ${JSON.stringify(sampleItems, null, 2)};`
      );
    }

    return samples.join('\n\n');
  }

  /**
   * Generate main component
   */
  private generateComponent(schema: AppSchema, componentName: string): string {
    const primaryEntity = Object.keys(schema.entities)[0];
    const entity = schema.entities[primaryEntity];
    const listView = Object.values(schema.views).find(v => v.type === 'list');

    // State declarations
    const stateDeclarations = this.generateStateDeclarations(schema, primaryEntity);

    // Handler functions
    const handlers = this.generateHandlers(schema, primaryEntity);

    // Filters
    const filters = this.generateFilters(schema, listView);

    // Main list/grid view
    const listContent = this.generateListView(schema, primaryEntity, listView);

    // Detail modal
    const detailModal = this.generateDetailModal(schema, primaryEntity);

    // Theme colors
    const theme = this.getThemeColors(schema.theme.primary, schema.theme.style);

    return `export default function ${componentName}() {
${stateDeclarations}

${handlers}

  return (
    <div className="${theme.background} min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold ${theme.textPrimary} mb-8 text-center">
          ${entity.icon} ${schema.name}
        </h1>

${filters}

${listContent}

${detailModal}
      </div>
    </div>
  );
}`;
  }

  /**
   * Generate state declarations
   */
  private generateStateDeclarations(schema: AppSchema, primaryEntity: string): string {
    const entity = schema.entities[primaryEntity];
    const dataName = `SAMPLE_${this.toConstantCase(primaryEntity)}`;
    const itemsVar = this.toLowerCamelCase(primaryEntity) + 's';
    const selectedVar = 'selected' + primaryEntity;

    const states: string[] = [];

    // Main data
    states.push(`  const [${itemsVar}] = useState<${primaryEntity}[]>(${dataName});`);
    states.push(`  const [${selectedVar}, set${selectedVar}] = useState<${primaryEntity} | null>(null);`);

    // Filters (if any)
    const listView = Object.values(schema.views).find(v => v.type === 'list');
    if (listView?.filters && listView.filters.length > 0) {
      for (const filter of listView.filters) {
        const field = entity.fields[filter];
        if (field?.type === 'select' || field?.type === 'boolean') {
          states.push(`  const [filter${this.toUpperCamelCase(filter)}, setFilter${this.toUpperCamelCase(filter)}] = useState('all');`);
        }
      }
    }

    // Search
    if (listView?.searchable) {
      states.push(`  const [searchTerm, setSearchTerm] = useState('');`);
    }

    return states.join('\n');
  }

  /**
   * Generate handler functions
   */
  private generateHandlers(schema: AppSchema, primaryEntity: string): string {
    const itemsVar = this.toLowerCamelCase(primaryEntity) + 's';
    const listView = Object.values(schema.views).find(v => v.type === 'list');

    const handlers: string[] = [];

    // Filter logic
    handlers.push(`  const filtered${primaryEntity}s = ${itemsVar}.filter(item => {`);

    const filterConditions: string[] = [];

    if (listView?.searchable) {
      const searchableFields = this.getSearchableFields(schema.entities[primaryEntity]);
      const searchConditions = searchableFields.map(field =>
        `item.${field}?.toString().toLowerCase().includes(searchTerm.toLowerCase())`
      ).join(' || ');
      filterConditions.push(`    const matchesSearch = !searchTerm || (${searchConditions});`);
    }

    if (listView?.filters) {
      for (const filter of listView.filters) {
        const filterVar = `filter${this.toUpperCamelCase(filter)}`;
        filterConditions.push(`    const matches${this.toUpperCamelCase(filter)} = ${filterVar} === 'all' || item.${filter} === ${filterVar};`);
      }
    }

    if (filterConditions.length > 0) {
      handlers.push(filterConditions.join('\n'));
      const matchVars = filterConditions.map(c => c.match(/const (matches\w+)/)?.[1]).filter(Boolean).join(' && ');
      handlers.push(`    return ${matchVars};`);
    } else {
      handlers.push(`    return true;`);
    }

    handlers.push(`  });`);

    return handlers.join('\n');
  }

  /**
   * Generate filter controls
   */
  private generateFilters(schema: AppSchema, listView?: ViewDefinition): string {
    if (!listView) return '';

    const filters: string[] = [];

    filters.push('        {/* Filters */}');
    filters.push('        <div className="mb-6 flex gap-4 flex-wrap">');

    // Search
    if (listView.searchable) {
      filters.push(`          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />`);
    }

    // Filter dropdowns
    if (listView.filters) {
      const entity = schema.entities[listView.entity];
      for (const filterName of listView.filters) {
        const field = entity.fields[filterName];
        if (field?.type === 'select' && field.options) {
          const filterVar = `filter${this.toUpperCamelCase(filterName)}`;
          filters.push(`          <select
            value={${filterVar}}
            onChange={(e) => setFilter${this.toUpperCamelCase(filterName)}(e.target.value)}
            className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All ${this.toTitleCase(filterName)}</option>
            ${field.options.map(opt => `<option value="${opt}">${this.toTitleCase(opt)}</option>`).join('\n            ')}
          </select>`);
        }
      }
    }

    filters.push('        </div>');

    return filters.join('\n');
  }

  /**
   * Generate list/grid view
   */
  private generateListView(schema: AppSchema, entityName: string, listView?: ViewDefinition): string {
    const entity = schema.entities[entityName];
    const layout = listView?.layout || 'grid';
    const itemsVar = `filtered${entityName}s`;
    const selectedVar = 'selected' + entityName;
    const theme = this.getThemeColors(schema.theme.primary, schema.theme.style);

    const gridClass = layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4';

    const fields = Object.entries(entity.fields).slice(0, 4); // Show first 4 fields in list view

    const content = `        {/* ${entityName} ${layout === 'grid' ? 'Grid' : 'List'} */}
        <div className="${gridClass}">
          {${itemsVar}.map(item => (
            <div
              key={item.id}
              onClick={() => set${selectedVar}(item)}
              className="${theme.card} backdrop-blur-lg rounded-xl p-6 border ${theme.border} cursor-pointer hover:${theme.cardHover} transition-all hover:scale-105 hover:shadow-2xl"
            >
              ${this.generateCardContent(fields, theme)}
            </div>
          ))}
        </div>

        {${itemsVar}.length === 0 && (
          <div className="text-center py-12 ${theme.textSecondary}">
            No ${entityName.toLowerCase()}s found.
          </div>
        )}`;

    return content;
  }

  /**
   * Generate card content for list view
   */
  private generateCardContent(fields: [string, FieldDefinition][], theme: any): string {
    const lines: string[] = [];

    for (const [fieldName, field] of fields) {
      if (field.type === 'image') {
        lines.push(`<div className="text-6xl text-center mb-4">{item.${fieldName} || '${field.icon || '🖼️'}'}</div>`);
      } else if (field.type === 'boolean') {
        lines.push(`<div className="flex items-center gap-2">
                <span className="${theme.textSecondary}">${field.label}:</span>
                <span className={item.${fieldName} ? 'text-green-400' : 'text-gray-400'}>
                  {item.${fieldName} ? '✓' : '○'}
                </span>
              </div>`);
      } else if (field.type === 'rating') {
        lines.push(`<div className="flex items-center gap-2">
                <span className="${theme.textSecondary}">${field.label}:</span>
                <span className="${theme.textPrimary}">{'⭐'.repeat(item.${fieldName} || 0)}</span>
              </div>`);
      } else {
        lines.push(`<div className="text-lg ${theme.textPrimary} font-semibold mb-2">{item.${fieldName}}</div>`);
      }
    }

    return lines.join('\n              ');
  }

  /**
   * Generate detail modal
   */
  private generateDetailModal(schema: AppSchema, entityName: string): string {
    const entity = schema.entities[entityName];
    const selectedVar = 'selected' + entityName;
    const theme = this.getThemeColors(schema.theme.primary, schema.theme.style);

    return `        {/* Detail Modal */}
        {${selectedVar} && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => set${selectedVar}(null)}
          >
            <div className="${theme.modal} rounded-2xl p-8 max-w-2xl w-full border-2 ${theme.border} shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-4xl font-bold ${theme.textPrimary} mb-6">{${selectedVar}.${this.getDisplayField(entity)}}</h2>

              <div className="space-y-4">
                ${this.generateDetailFields(entity, theme)}
              </div>

              <button
                onClick={() => set${selectedVar}(null)}
                className="mt-6 w-full py-3 ${theme.button} rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}`;
  }

  /**
   * Generate detail view fields
   */
  private generateDetailFields(entity: EntityDefinition, theme: any): string {
    const fields = Object.entries(entity.fields);
    return fields.map(([fieldName, field]) => {
      if (field.type === 'textarea') {
        return `<div>
                  <span className="${theme.textSecondary} block mb-2">${field.label}</span>
                  <p className="${theme.textPrimary}">{selected${entity.name}.${fieldName}}</p>
                </div>`;
      } else if (field.type === 'boolean') {
        return `<div className="flex justify-between items-center">
                  <span className="${theme.textSecondary}">${field.label}</span>
                  <span className={selected${entity.name}.${fieldName} ? 'text-green-400' : 'text-gray-400'}>
                    {selected${entity.name}.${fieldName} ? 'Yes' : 'No'}
                  </span>
                </div>`;
      } else {
        return `<div className="flex justify-between items-center">
                  <span className="${theme.textSecondary}">${field.label}</span>
                  <span className="${theme.textPrimary} font-semibold">{selected${entity.name}.${fieldName}}</span>
                </div>`;
      }
    }).join('\n                ');
  }

  // ===== UTILITY METHODS =====

  private fieldTypeToTypeScript(fieldType: string): string {
    const map: Record<string, string> = {
      text: 'string',
      textarea: 'string',
      email: 'string',
      url: 'string',
      color: 'string',
      number: 'number',
      currency: 'number',
      rating: 'number',
      boolean: 'boolean',
      date: 'string',
      datetime: 'string',
      image: 'string',
      location: 'string',
      select: 'string',
      multiselect: 'string[]',
    };
    return map[fieldType] || 'string';
  }

  private getSearchableFields(entity: EntityDefinition): string[] {
    return Object.entries(entity.fields)
      .filter(([_, field]) => ['text', 'textarea', 'email'].includes(field.type))
      .map(([name, _]) => name)
      .slice(0, 2); // Search first 2 text fields
  }

  private getDisplayField(entity: EntityDefinition): string {
    const textFields = Object.keys(entity.fields).filter(
      k => ['text', 'textarea'].includes(entity.fields[k].type)
    );
    return textFields[0] || 'id';
  }

  private generateDefaultSampleData(entity: EntityDefinition, entityName: string): any[] {
    // Generate 3-5 sample items
    return [1, 2, 3].map(id => {
      const item: any = { id };
      for (const [fieldName, field] of Object.entries(entity.fields)) {
        item[fieldName] = this.generateSampleValue(field, id);
      }
      return item;
    });
  }

  private generateSampleValue(field: FieldDefinition, seed: number): any {
    switch (field.type) {
      case 'text':
        return `${field.label} ${seed}`;
      case 'number':
      case 'rating':
        return seed * 10;
      case 'boolean':
        return seed % 2 === 0;
      case 'select':
        return field.options?.[seed % (field.options.length || 1)] || 'Option';
      case 'date':
        return `2025-12-${20 + seed}`;
      case 'image':
        return field.icon || '🖼️';
      default:
        return field.default || '';
    }
  }

  private getThemeColors(palette: ColorPalette, style: ThemeStyle) {
    const themes: Record<ColorPalette, any> = {
      purple: {
        background: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
        card: 'bg-white/10',
        cardHover: 'bg-white/20',
        border: 'border-white/20',
        modal: 'bg-gradient-to-br from-purple-900 to-blue-900',
        button: 'bg-white/10 hover:bg-white/20 text-white',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
      },
      blue: {
        background: 'bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600',
        card: 'bg-white/10',
        cardHover: 'bg-white/20',
        border: 'border-white/20',
        modal: 'bg-gradient-to-br from-blue-900 to-cyan-900',
        button: 'bg-white/10 hover:bg-white/20 text-white',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
      },
      green: {
        background: 'bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600',
        card: 'bg-white/10',
        cardHover: 'bg-white/20',
        border: 'border-white/20',
        modal: 'bg-gradient-to-br from-green-900 to-emerald-900',
        button: 'bg-white/10 hover:bg-white/20 text-white',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
      },
      orange: {
        background: 'bg-gradient-to-br from-orange-600 via-red-600 to-pink-600',
        card: 'bg-white/10',
        cardHover: 'bg-white/20',
        border: 'border-white/20',
        modal: 'bg-gradient-to-br from-orange-900 to-red-900',
        button: 'bg-white/10 hover:bg-white/20 text-white',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
      },
      red: {
        background: 'bg-gradient-to-br from-red-600 via-rose-600 to-pink-600',
        card: 'bg-white/10',
        cardHover: 'bg-white/20',
        border: 'border-white/20',
        modal: 'bg-gradient-to-br from-red-900 to-rose-900',
        button: 'bg-white/10 hover:bg-white/20 text-white',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
      },
      pink: {
        background: 'bg-gradient-to-br from-pink-600 via-rose-600 to-purple-600',
        card: 'bg-white/10',
        cardHover: 'bg-white/20',
        border: 'border-white/20',
        modal: 'bg-gradient-to-br from-pink-900 to-purple-900',
        button: 'bg-white/10 hover:bg-white/20 text-white',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
      },
      teal: {
        background: 'bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600',
        card: 'bg-white/10',
        cardHover: 'bg-white/20',
        border: 'border-white/20',
        modal: 'bg-gradient-to-br from-teal-900 to-cyan-900',
        button: 'bg-white/10 hover:bg-white/20 text-white',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
      },
      indigo: {
        background: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600',
        card: 'bg-white/10',
        cardHover: 'bg-white/20',
        border: 'border-white/20',
        modal: 'bg-gradient-to-br from-indigo-900 to-purple-900',
        button: 'bg-white/10 hover:bg-white/20 text-white',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
      },
      yellow: {
        background: 'bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500',
        card: 'bg-white/10',
        cardHover: 'bg-white/20',
        border: 'border-white/20',
        modal: 'bg-gradient-to-br from-yellow-800 to-orange-800',
        button: 'bg-white/10 hover:bg-white/20 text-white',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
      },
      gray: {
        background: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black',
        card: 'bg-white/10',
        cardHover: 'bg-white/20',
        border: 'border-white/20',
        modal: 'bg-gradient-to-br from-gray-800 to-gray-900',
        button: 'bg-white/10 hover:bg-white/20 text-white',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
      },
    };

    return themes[palette] || themes.purple;
  }

  private toComponentName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^\w/, c => c.toUpperCase());
  }

  private toLowerCamelCase(name: string): string {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }

  private toUpperCamelCase(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private toConstantCase(name: string): string {
    return name.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
  }

  private toTitleCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
  }
}
