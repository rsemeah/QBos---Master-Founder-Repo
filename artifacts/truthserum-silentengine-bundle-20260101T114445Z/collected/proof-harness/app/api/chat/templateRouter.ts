interface TemplateDefinition {
  id: string;
  name: string;
  keywords: string[];
}

const templateDefinitions: TemplateDefinition[] = [
  {
    id: 'auth-starter',
    name: 'Auth Starter',
    keywords: ['login', 'auth', 'signup', 'account'],
  },
  {
    id: 'booking',
    name: 'Booking & Scheduling',
    keywords: ['booking', 'schedule', 'reservation', 'appointments', 'slots'],
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    keywords: ['marketplace', 'listings', 'shop', 'store', 'commerce'],
  },
  {
    id: 'community',
    name: 'Community',
    keywords: ['community', 'chat', 'social', 'feed', 'members'],
  },
];

function normalize(text: string) {
  return text.toLowerCase().trim();
}

export function suggestTemplate(message: string) {
  const normalized = normalize(message);
  const match = templateDefinitions.find((template) =>
    template.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (!match) {
    return null;
  }

  return {
    templateId: match.id,
    templateName: match.name,
  };
}

export function detectTemplateSelection(message: string) {
  const normalized = normalize(message);

  const explicitMatch = templateDefinitions.find((template) => {
    return (
      normalized.includes(template.id) ||
      normalized.includes(template.name.toLowerCase())
    );
  });

  if (explicitMatch) {
    return {
      templateId: explicitMatch.id,
      templateName: explicitMatch.name,
    };
  }

  return suggestTemplate(message);
}

export function listTemplates() {
  return templateDefinitions.map((template) => ({
    id: template.id,
    name: template.name,
  }));
}
