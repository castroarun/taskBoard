import React, { useState } from 'react';

// Font options for Klarity branding
const fontOptions = [
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    category: 'Recommended',
    description: 'Geometric, modern, techy feel with excellent readability',
    css: "'Space Grotesk', sans-serif",
    weights: ['400', '500', '600', '700'],
    googleFont: 'https://fonts.google.com/specimen/Space+Grotesk',
  },
  {
    id: 'satoshi',
    name: 'Satoshi',
    category: 'Recommended',
    description: 'Clean, contemporary, slightly humanist geometric',
    css: "'Satoshi', sans-serif",
    weights: ['400', '500', '700', '900'],
    googleFont: 'https://www.fontshare.com/fonts/satoshi',
  },
  {
    id: 'cabinet-grotesk',
    name: 'Cabinet Grotesk',
    category: 'Bold Option',
    description: 'Strong, confident, great for headers',
    css: "'Cabinet Grotesk', sans-serif",
    weights: ['500', '700', '800'],
    googleFont: 'https://www.fontshare.com/fonts/cabinet-grotesk',
  },
  {
    id: 'geist',
    name: 'Geist',
    category: 'Developer Favorite',
    description: 'Vercel\'s font - clean, minimal, developer-focused',
    css: "'Geist', sans-serif",
    weights: ['400', '500', '600', '700'],
    googleFont: 'https://vercel.com/font',
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'Safe Choice',
    description: 'Industry standard, highly readable, versatile',
    css: "'Inter', sans-serif",
    weights: ['400', '500', '600', '700'],
    googleFont: 'https://fonts.google.com/specimen/Inter',
  },
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    category: 'Friendly',
    description: 'Modern, friendly, slightly rounded edges',
    css: "'Plus Jakarta Sans', sans-serif",
    weights: ['400', '500', '600', '700'],
    googleFont: 'https://fonts.google.com/specimen/Plus+Jakarta+Sans',
  },
  {
    id: 'manrope',
    name: 'Manrope',
    category: 'Elegant',
    description: 'Semi-geometric, elegant, great x-height',
    css: "'Manrope', sans-serif",
    weights: ['400', '500', '600', '700'],
    googleFont: 'https://fonts.google.com/specimen/Manrope',
  },
];

// Icon concepts for Klarity
const iconConcepts = [
  {
    id: 'k-prism',
    name: 'K Prism',
    description: 'Abstract K formed by light rays refracting through a prism',
    meaning: 'Represents clarity emerging from complexity',
    svg: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <defs>
          <linearGradient id="prism-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* Prism K shape */}
        <polygon points="12,8 32,8 52,56 32,56 32,32 22,56 12,56" fill="url(#prism-grad)" />
        <polygon points="32,32 52,8 52,32 42,56 32,56" fill="#22d3ee" opacity="0.8" />
        {/* Light rays */}
        <line x1="8" y1="20" x2="16" y2="24" stroke="#f472b6" strokeWidth="2" opacity="0.6" />
        <line x1="8" y1="32" x2="16" y2="32" stroke="#facc15" strokeWidth="2" opacity="0.6" />
        <line x1="8" y1="44" x2="16" y2="40" stroke="#4ade80" strokeWidth="2" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'flow-k',
    name: 'Flow K',
    description: 'K with flowing lines suggesting workflow and movement',
    meaning: 'Represents smooth workflow orchestration',
    svg: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <defs>
          <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* Flowing K */}
        <path
          d="M16 8 L16 56 M16 32 Q32 32 40 16 Q48 0 56 8 M16 32 Q32 32 40 48 Q48 64 56 56"
          fill="none"
          stroke="url(#flow-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Flow dots */}
        <circle cx="56" cy="8" r="3" fill="#22d3ee" />
        <circle cx="56" cy="56" r="3" fill="#a78bfa" />
      </svg>
    ),
  },
  {
    id: 'grid-k',
    name: 'Grid K',
    description: 'K constructed from grid squares/dots',
    meaning: 'Represents structured organization and clarity',
    svg: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        {/* Grid K using dots */}
        {/* Vertical line */}
        <circle cx="16" cy="12" r="4" fill="#6366f1" />
        <circle cx="16" cy="24" r="4" fill="#6366f1" />
        <circle cx="16" cy="36" r="4" fill="#6366f1" />
        <circle cx="16" cy="48" r="4" fill="#6366f1" />
        {/* Upper diagonal */}
        <circle cx="28" cy="30" r="4" fill="#a78bfa" />
        <circle cx="40" cy="20" r="4" fill="#a78bfa" />
        <circle cx="52" cy="10" r="4" fill="#22d3ee" />
        {/* Lower diagonal */}
        <circle cx="28" cy="38" r="4" fill="#a78bfa" />
        <circle cx="40" cy="46" r="4" fill="#a78bfa" />
        <circle cx="52" cy="54" r="4" fill="#22d3ee" />
      </svg>
    ),
  },
  {
    id: 'declutter-k',
    name: 'Declutter K',
    description: 'Minimalist K with clean, sharp lines',
    meaning: 'Represents simplicity and decluttering',
    svg: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <defs>
          <linearGradient id="declutter-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        {/* Sharp minimal K */}
        <rect x="12" y="8" width="8" height="48" rx="2" fill="url(#declutter-grad)" />
        <polygon points="20,32 48,8 56,8 56,16 28,32 56,48 56,56 48,56 20,32" fill="#22d3ee" />
      </svg>
    ),
  },
  {
    id: 'lens-k',
    name: 'Lens K',
    description: 'K integrated with a magnifying lens or focus circle',
    meaning: 'Represents focus and clarity of vision',
    svg: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <defs>
          <linearGradient id="lens-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* Lens circle */}
        <circle cx="32" cy="28" r="20" fill="none" stroke="url(#lens-grad)" strokeWidth="3" />
        {/* K inside lens */}
        <rect x="24" y="14" width="4" height="28" fill="#a78bfa" />
        <path d="M28 28 L40 14 L44 14 L44 18 L32 28 L44 38 L44 42 L40 42 L28 28" fill="#6366f1" />
        {/* Handle */}
        <line x1="46" y1="42" x2="58" y2="54" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
  },
];

// Color palette
const colorPalette = {
  primary: [
    { name: 'Deep Indigo', hex: '#6366f1', usage: 'Primary brand color, buttons, accents' },
    { name: 'Indigo Light', hex: '#818cf8', usage: 'Hover states, secondary buttons' },
    { name: 'Indigo Dark', hex: '#4f46e5', usage: 'Active states, emphasis' },
  ],
  accent: [
    { name: 'Clarity Cyan', hex: '#22d3ee', usage: 'Highlights, success states, links' },
    { name: 'Soft Purple', hex: '#a78bfa', usage: 'Secondary accents, gradients' },
    { name: 'Warm Pink', hex: '#f472b6', usage: 'Design phase, notifications' },
  ],
  workflow: [
    { name: 'Design Pink', hex: '#f472b6', usage: 'Design phase indicators' },
    { name: 'Engineering Blue', hex: '#38bdf8', usage: 'Engineering phase indicators' },
    { name: 'Build Yellow', hex: '#facc15', usage: 'Build phase indicators' },
    { name: 'Launch Green', hex: '#4ade80', usage: 'Launch phase indicators' },
    { name: 'Closure Teal', hex: '#5eead4', usage: 'Closure phase indicators' },
  ],
  neutral: [
    { name: 'Background', hex: '#0a0a0f', usage: 'App background' },
    { name: 'Surface', hex: '#1a1a2e', usage: 'Cards, panels' },
    { name: 'Border', hex: '#2a2a4a', usage: 'Borders, dividers' },
    { name: 'Text Primary', hex: '#f8fafc', usage: 'Headings, primary text' },
    { name: 'Text Secondary', hex: '#94a3b8', usage: 'Body text, labels' },
  ],
};

export const KlarityBrandingMockup: React.FC = () => {
  const [selectedFont, setSelectedFont] = useState<string>('space-grotesk');
  const [selectedIcon, setSelectedIcon] = useState<string>('k-prism');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Klarity Branding Options
          </h1>
          <p className="text-gray-400 text-lg">
            Visual mockups for fonts, icons, and color palette
          </p>
        </div>

        {/* Selected Preview */}
        <section className="bg-gradient-to-br from-[#1a1a2e] to-[#0d0d1a] rounded-2xl p-8 border border-[#2a2a4a]">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
            Live Preview
          </h2>
          <div className="flex flex-col items-center space-y-6">
            {/* Icon + Wordmark */}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20">
                {iconConcepts.find(i => i.id === selectedIcon)?.svg}
              </div>
              <div className="text-center">
                <h2
                  className="text-5xl font-bold text-white"
                  style={{ fontFamily: fontOptions.find(f => f.id === selectedFont)?.css }}
                >
                  Klarity
                </h2>
                <p className="text-lg text-gray-400 tracking-widest mt-2">
                  Declutter. Design. Deploy.
                </p>
              </div>
            </div>
            {/* Color bar */}
            <div className="flex gap-2 mt-4">
              <div className="w-16 h-2 rounded-full bg-[#6366f1]" />
              <div className="w-16 h-2 rounded-full bg-[#a78bfa]" />
              <div className="w-16 h-2 rounded-full bg-[#22d3ee]" />
            </div>
          </div>
        </section>

        {/* Font Options */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Font Options</h2>
            <span className="text-sm text-gray-500">Click to preview</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fontOptions.map((font) => (
              <button
                key={font.id}
                onClick={() => setSelectedFont(font.id)}
                className={`p-6 rounded-xl border transition-all text-left ${
                  selectedFont === font.id
                    ? 'bg-indigo-500/20 border-indigo-500'
                    : 'bg-[#1a1a2e] border-[#2a2a4a] hover:border-[#4a4a6a]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      font.category === 'Recommended'
                        ? 'bg-green-500/20 text-green-400'
                        : font.category === 'Developer Favorite'
                        ? 'bg-blue-500/20 text-blue-400'
                        : font.category === 'Bold Option'
                        ? 'bg-orange-500/20 text-orange-400'
                        : font.category === 'Safe Choice'
                        ? 'bg-gray-500/20 text-gray-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {font.category}
                  </span>
                  {selectedFont === font.id && (
                    <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-medium text-white mb-1">{font.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{font.description}</p>
                <div
                  className="text-3xl text-white"
                  style={{ fontFamily: font.css }}
                >
                  Klarity
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Icon Concepts */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Icon Concepts</h2>
            <span className="text-sm text-gray-500">Click to preview</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {iconConcepts.map((icon) => (
              <button
                key={icon.id}
                onClick={() => setSelectedIcon(icon.id)}
                className={`p-6 rounded-xl border transition-all text-left ${
                  selectedIcon === icon.id
                    ? 'bg-indigo-500/20 border-indigo-500'
                    : 'bg-[#1a1a2e] border-[#2a2a4a] hover:border-[#4a4a6a]'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16">{icon.svg}</div>
                  {selectedIcon === icon.id && (
                    <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-medium text-white mb-1">{icon.name}</h3>
                <p className="text-sm text-gray-400 mb-2">{icon.description}</p>
                <p className="text-xs text-indigo-400">{icon.meaning}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Color Palette</h2>

          {/* Primary Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Primary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {colorPalette.primary.map((color) => (
                <div key={color.hex} className="flex items-center gap-4 p-4 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a]">
                  <div
                    className="w-14 h-14 rounded-lg shadow-lg"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div>
                    <p className="font-medium text-white">{color.name}</p>
                    <p className="text-sm text-gray-400 font-mono">{color.hex}</p>
                    <p className="text-xs text-gray-500 mt-1">{color.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accent Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Accent</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {colorPalette.accent.map((color) => (
                <div key={color.hex} className="flex items-center gap-4 p-4 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a]">
                  <div
                    className="w-14 h-14 rounded-lg shadow-lg"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div>
                    <p className="font-medium text-white">{color.name}</p>
                    <p className="text-sm text-gray-400 font-mono">{color.hex}</p>
                    <p className="text-xs text-gray-500 mt-1">{color.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Workflow Phases</h3>
            <div className="flex flex-wrap gap-4">
              {colorPalette.workflow.map((color) => (
                <div key={color.hex} className="flex items-center gap-3 p-3 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a]">
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{color.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{color.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Neutral Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Neutral</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {colorPalette.neutral.map((color) => (
                <div key={color.hex} className="p-4 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] text-center">
                  <div
                    className="w-full h-12 rounded-lg mb-3 border border-[#3a3a5a]"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-sm font-medium text-white">{color.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lockup Variations */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Lockup Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Horizontal */}
            <div className="p-8 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a]">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Horizontal</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12">
                  {iconConcepts.find(i => i.id === selectedIcon)?.svg}
                </div>
                <div>
                  <span
                    className="text-3xl font-bold text-white"
                    style={{ fontFamily: fontOptions.find(f => f.id === selectedFont)?.css }}
                  >
                    Klarity
                  </span>
                  <span className="text-gray-500 mx-3">—</span>
                  <span className="text-gray-400">Declutter. Design. Deploy.</span>
                </div>
              </div>
            </div>

            {/* Stacked */}
            <div className="p-8 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a]">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Stacked</h3>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 mb-4">
                  {iconConcepts.find(i => i.id === selectedIcon)?.svg}
                </div>
                <span
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: fontOptions.find(f => f.id === selectedFont)?.css }}
                >
                  Klarity
                </span>
                <span className="text-sm text-gray-400 tracking-wider mt-2">
                  Declutter. Design. Deploy.
                </span>
              </div>
            </div>

            {/* Icon Only */}
            <div className="p-8 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a]">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Icon Only</h3>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 p-2 bg-[#0a0a0f] rounded-xl">
                  {iconConcepts.find(i => i.id === selectedIcon)?.svg}
                </div>
                <div className="w-12 h-12 p-2 bg-[#0a0a0f] rounded-lg">
                  {iconConcepts.find(i => i.id === selectedIcon)?.svg}
                </div>
                <div className="w-8 h-8 p-1 bg-[#0a0a0f] rounded-md">
                  {iconConcepts.find(i => i.id === selectedIcon)?.svg}
                </div>
              </div>
            </div>

            {/* Wordmark Only */}
            <div className="p-8 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a]">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Wordmark Only</h3>
              <div className="space-y-4">
                <span
                  className="block text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
                  style={{ fontFamily: fontOptions.find(f => f.id === selectedFont)?.css }}
                >
                  Klarity
                </span>
                <span
                  className="block text-2xl font-bold text-white"
                  style={{ fontFamily: fontOptions.find(f => f.id === selectedFont)?.css }}
                >
                  Klarity
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Scale */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Typography Scale</h2>
          <div className="p-8 bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] space-y-4">
            <div style={{ fontFamily: fontOptions.find(f => f.id === selectedFont)?.css }}>
              <p className="text-xs text-gray-500 mb-1">Display / 48px</p>
              <p className="text-5xl font-bold text-white">Klarity Command Center</p>
            </div>
            <div style={{ fontFamily: fontOptions.find(f => f.id === selectedFont)?.css }}>
              <p className="text-xs text-gray-500 mb-1">Heading 1 / 32px</p>
              <p className="text-3xl font-semibold text-white">Project Management</p>
            </div>
            <div style={{ fontFamily: fontOptions.find(f => f.id === selectedFont)?.css }}>
              <p className="text-xs text-gray-500 mb-1">Heading 2 / 24px</p>
              <p className="text-2xl font-medium text-white">Task Overview</p>
            </div>
            <div style={{ fontFamily: fontOptions.find(f => f.id === selectedFont)?.css }}>
              <p className="text-xs text-gray-500 mb-1">Body / 16px</p>
              <p className="text-base text-gray-300">
                Klarity helps you declutter your project chaos, design with clarity, and deploy with confidence.
              </p>
            </div>
            <div style={{ fontFamily: fontOptions.find(f => f.id === selectedFont)?.css }}>
              <p className="text-xs text-gray-500 mb-1">Small / 14px</p>
              <p className="text-sm text-gray-400">Last updated 2 hours ago</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm pt-8 border-t border-[#2a2a4a]">
          <p>Klarity Branding Mockup • Select options above to see live preview</p>
        </footer>
      </div>
    </div>
  );
};

export default KlarityBrandingMockup;
