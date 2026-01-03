"use strict";
/**
 * GuidedSetupPanel - Friendly, low-decision setup for non-technical users.
 */
'use client';
/**
 * GuidedSetupPanel - Friendly, low-decision setup for non-technical users.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuidedSetupPanel = GuidedSetupPanel;
const react_1 = require("react");
function GuidedSetupPanel({ prompts, templates, palettes, selectedTemplateId, selectedPaletteId, onSelectTemplate, onSelectPalette, onSendPrompt, }) {
    const selectedTemplate = (0, react_1.useMemo)(() => templates.find((template) => template.id === selectedTemplateId) ?? null, [templates, selectedTemplateId]);
    const selectedPalette = (0, react_1.useMemo)(() => palettes.find((palette) => palette.id === selectedPaletteId) ?? null, [palettes, selectedPaletteId]);
    return (<div className="border-b border-gray-200 bg-white px-6 py-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Guided setup</h2>
        <p className="text-sm text-gray-600">
          Choose a starting point and we will handle the rest.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800">1) Pick a quick prompt</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {prompts.map((prompt) => (<button key={prompt.id} type="button" onClick={() => onSendPrompt(prompt.message)} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100">
              {prompt.label}
            </button>))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800">2) Choose a template</h3>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {templates.map((template) => {
            const isSelected = template.id === selectedTemplateId;
            return (<button key={template.id} type="button" onClick={() => onSelectTemplate(template.id)} className={`rounded-lg border px-3 py-2 text-left text-sm transition ${isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-blue-300'}`}>
                <div className="font-semibold">{template.name}</div>
                <div className="text-xs text-gray-500">{template.description}</div>
              </button>);
        })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800">3) Choose a palette</h3>
        <div className="mt-2 flex flex-wrap gap-3">
          {palettes.map((palette) => {
            const isSelected = palette.id === selectedPaletteId;
            return (<button key={palette.id} type="button" onClick={() => onSelectPalette(palette.id)} className={`rounded-lg border px-3 py-2 text-left text-xs transition ${isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                <div className="font-semibold text-gray-800">{palette.name}</div>
                <div className="mt-2 flex gap-1">
                  {palette.swatches.map((swatch) => (<span key={swatch} className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: swatch }}/>))}
                </div>
              </button>);
        })}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <div className="font-semibold text-gray-900">Summary</div>
        <ul className="mt-2 space-y-1">
          <li>
            <span className="font-medium">Template:</span>{' '}
            {selectedTemplate ? selectedTemplate.name : 'Not selected'}
          </li>
          <li>
            <span className="font-medium">Palette:</span>{' '}
            {selectedPalette ? selectedPalette.name : 'Not selected'}
          </li>
        </ul>
      </div>
    </div>);
}
//# sourceMappingURL=GuidedSetupPanel.js.map