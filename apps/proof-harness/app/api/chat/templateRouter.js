"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestTemplate = suggestTemplate;
exports.detectTemplateSelection = detectTemplateSelection;
exports.listTemplates = listTemplates;
const templateDefinitions = [
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
function normalize(text) {
    return text.toLowerCase().trim();
}
function suggestTemplate(message) {
    const normalized = normalize(message);
    const match = templateDefinitions.find((template) => template.keywords.some((keyword) => normalized.includes(keyword)));
    if (!match) {
        return null;
    }
    return {
        templateId: match.id,
        templateName: match.name,
    };
}
function detectTemplateSelection(message) {
    const normalized = normalize(message);
    const explicitMatch = templateDefinitions.find((template) => {
        return (normalized.includes(template.id) ||
            normalized.includes(template.name.toLowerCase()));
    });
    if (explicitMatch) {
        return {
            templateId: explicitMatch.id,
            templateName: explicitMatch.name,
        };
    }
    return suggestTemplate(message);
}
function listTemplates() {
    return templateDefinitions.map((template) => ({
        id: template.id,
        name: template.name,
    }));
}
//# sourceMappingURL=templateRouter.js.map