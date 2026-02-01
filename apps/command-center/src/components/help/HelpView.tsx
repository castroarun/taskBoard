/**
 * HelpView Component
 *
 * Self-contained help documentation with indexed navigation.
 */

import { useState } from 'react';
import clsx from 'clsx';

type HelpSection = 'getting-started' | 'features' | 'workflow' | 'shortcuts' | 'configuration' | 'agents' | 'about';

const sections: { id: HelpSection; label: string; icon: React.ReactNode }[] = [
  { id: 'getting-started', label: 'Getting Started', icon: <RocketIcon /> },
  { id: 'features', label: 'Features', icon: <SparklesIcon /> },
  { id: 'workflow', label: '9-Step Workflow', icon: <FlowIcon /> },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <KeyboardIcon /> },
  { id: 'configuration', label: 'Configuration', icon: <CogIcon /> },
  { id: 'agents', label: 'AI Agents', icon: <BotIcon /> },
  { id: 'about', label: 'About', icon: <InfoIcon /> },
];

export function HelpView() {
  const [activeSection, setActiveSection] = useState<HelpSection>('getting-started');

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar Navigation */}
      <nav className="w-64 ml-20 border-r border-zinc-800 p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider pl-3">Documentation</h2>
        </div>
        <ul className="space-y-1">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => setActiveSection(section.id)}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left',
                  activeSection === section.id
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                )}
              >
                <span className="w-4 h-4">{section.icon}</span>
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto px-16 py-6">
        <div className={activeSection === 'agents' ? 'max-w-4xl mx-auto' : 'max-w-2xl mx-auto'}>
          {activeSection === 'getting-started' && <GettingStartedSection />}
          {activeSection === 'features' && <FeaturesSection />}
          {activeSection === 'workflow' && <WorkflowSection />}
          {activeSection === 'shortcuts' && <ShortcutsSection />}
          {activeSection === 'configuration' && <ConfigurationSection />}
          {activeSection === 'agents' && <AgentsSection />}
          {activeSection === 'about' && <AboutSection />}
        </div>
      </main>
    </div>
  );
}

// === SECTION COMPONENTS ===

function GettingStartedSection() {
  return (
    <div className="space-y-4">
      {/* Klarity Hero Banner */}
      <div className="py-8 text-center">
        <div className="flex justify-center mb-6">
          <KlarityLogoHero />
        </div>
        <h1 className="text-3xl font-bold text-white font-display mb-3 tracking-tight">Klarity</h1>
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-4">
          Declutter. Design. Deploy.
        </p>
        <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed mb-6">
          Klarity helps you declutter your project chaos,
          <br />
          design with clarity, and deploy with confidence.
        </p>
        <div className="flex justify-center gap-2">
          <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: '#6366f1' }} />
          <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: '#a78bfa' }} />
          <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: '#22d3ee' }} />
        </div>
      </div>

      <Section title="What is Klarity?">
        <p>
          A file-based project orchestration system with a structured 9-step workflow.
          Local file storage, full control over your data.
        </p>
      </Section>

      <Section title="Quick Start">
        <ol className="list-decimal list-inside space-y-1.5 text-zinc-300">
          <li><strong>Create a Project</strong> — <Kbd>+ New Project</Kbd> or <Kbd>Ctrl+K</Kbd></li>
          <li><strong>Set Up Workflow</strong> — Settings → Workflow</li>
          <li><strong>Add Tasks</strong> — Open project, create tasks</li>
          <li><strong>Track Progress</strong> — Move tasks through stages</li>
          <li><strong>Review Docs</strong> — Use the Docs tab</li>
        </ol>
      </Section>

      <Section title="Data Storage">
        <p className="mb-2">All data stored locally in JSON files.</p>
        <div className="bg-zinc-800/50 rounded p-2.5 font-mono text-[11px]">
          <div className="text-zinc-500 mb-1"># Data files</div>
          <div className="text-zinc-400">projects.json · tasks.json · inbox.md · config.json</div>
        </div>
      </Section>

      <Section title="Install AI Agents">
        <p className="mb-2">Clone the shared agents repository to enable AI-assisted workflows:</p>
        <div className="bg-zinc-900 rounded border border-zinc-800 p-2 font-mono text-[10px] overflow-x-auto mb-2">
          <div className="text-zinc-500"># macOS / Linux / Git Bash</div>
          <div className="text-green-400/80 select-all">git clone https://github.com/castroarun/claude-shared.git ~/.claude-shared</div>
          <div className="text-green-400/80 select-all">cp -r ~/.claude-shared/agents ~/.claude/</div>
          <div className="text-green-400/80 select-all">cp -r ~/.claude-shared/commands ~/.claude/</div>
        </div>
        <div className="bg-zinc-900 rounded border border-zinc-800 p-2 font-mono text-[10px] overflow-x-auto mb-2">
          <div className="text-zinc-500"># Windows PowerShell</div>
          <div className="text-blue-400/80 select-all">git clone https://github.com/castroarun/claude-shared.git $HOME\.claude-shared</div>
          <div className="text-blue-400/80 select-all">Copy-Item -Recurse $HOME\.claude-shared\agents $HOME\.claude\</div>
          <div className="text-blue-400/80 select-all">Copy-Item -Recurse $HOME\.claude-shared\commands $HOME\.claude\</div>
        </div>
        <p className="text-[11px] text-zinc-500">
          Test with: <code className="bg-zinc-800 px-1 rounded text-emerald-400/80">@architect help</code> in Claude Code
        </p>
      </Section>
    </div>
  );
}

// Feature data with detailed information
const featuresData = [
  {
    id: 'project-board',
    icon: 'pipeline',
    title: 'Project Board',
    tagline: 'Kanban board for projects by workflow phase',
    description: 'Visual pipeline showing all projects organized by their current workflow phase. Drag and drop to move projects, click to drill into task details.',
    capabilities: [
      'Phase-based columns (Design → Engineering → Build → Launch → Closure)',
      'Drag & drop project cards between phases',
      'Progress indicators and status badges',
      'Quick actions for common operations',
    ],
    principles: [
      { label: 'Visual Management', desc: 'See bottlenecks and blocked work at a glance', highlight: false },
      { label: 'Flow Optimization', desc: 'Limit WIP by visualizing all active projects', highlight: false },
    ],
  },
  {
    id: 'document-viewer',
    icon: 'docs',
    title: 'Document Viewer',
    tagline: 'Markdown viewer/editor with real-time preview',
    description: 'Navigate and edit project documentation directly in the app. Supports Markdown with live preview, syntax highlighting, and file tree navigation.',
    capabilities: [
      'File tree navigation for project docs/',
      'Split-pane Markdown editor with live preview',
      'Syntax highlighting for code blocks',
      'Auto-save with change detection',
    ],
    principles: [
      { label: 'Documentation-First', desc: 'PRD and architecture docs before code', highlight: true },
      { label: 'Catch Issues Early', desc: 'Review designs when changes cost 1x, not 100x', highlight: true },
    ],
  },
  {
    id: 'inbox',
    icon: 'inbox',
    title: 'Inbox',
    tagline: 'Quick capture for ideas, notes & AI instructions',
    description: 'Central inbox for capturing thoughts, instructions, and quick notes. Serves as the communication bridge between you and AI agents in hybrid mode.',
    capabilities: [
      'Quick text capture with keyboard shortcut',
      'Voice-to-text transcription',
      'AI agent trigger point (hybrid mode)',
      'Review/comment system for human feedback',
    ],
    principles: [
      { label: 'Human-in-the-Loop', desc: 'You review and approve AI work before it proceeds', highlight: true },
      { label: 'Async Communication', desc: 'Leave instructions, get results when ready', highlight: false },
    ],
  },
  {
    id: 'quick-launch',
    icon: 'search',
    title: 'Quick Launch',
    tagline: 'Ctrl+K to search, navigate, and trigger actions',
    description: 'Command palette for power users. Search projects, switch tabs, trigger actions, and navigate anywhere in the app without touching the mouse.',
    capabilities: [
      'Fuzzy search across all projects',
      'Quick navigation between tabs',
      'Action triggers (new project, settings, etc.)',
      'Recent items and favorites',
    ],
    principles: [
      { label: 'Keyboard-First', desc: 'Reduce context switching, stay in flow', highlight: false },
      { label: 'Speed', desc: 'Access anything in 2-3 keystrokes', highlight: false },
    ],
  },
  {
    id: 'voice-capture',
    icon: 'mic',
    title: 'Voice Capture',
    tagline: 'Voice notes transcribed via Groq Whisper API',
    description: 'Record voice memos that are automatically transcribed to text. Perfect for capturing ideas on the go or dictating longer instructions.',
    capabilities: [
      'One-click recording start/stop',
      'Groq Whisper API for fast transcription',
      'Auto-append to inbox or document',
      'Multi-language support',
    ],
    principles: [
      { label: 'Capture Everything', desc: 'Ideas are fleeting—voice is fastest', highlight: false },
      { label: 'Accessibility', desc: 'Alternative input for different contexts', highlight: false },
    ],
  },
  {
    id: 'notifications',
    icon: 'bell',
    title: 'Notifications',
    tagline: 'Desktop alerts for task completion and approvals',
    description: 'Stay informed without constantly checking. Get notified when AI agents complete work, when approvals are needed, or when projects go stale.',
    capabilities: [
      'Desktop notifications (OS-native)',
      'Stale project reminders (configurable)',
      'Approval pending alerts',
      'Agent completion notifications',
    ],
    principles: [
      { label: 'Proactive Alerts', desc: 'System finds problems before you do', highlight: false },
      { label: 'Quality Gates', desc: 'Mandatory reviews before phase transitions', highlight: true },
    ],
  },
];

function FeaturesSection() {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">Features</h1>
        <p className="text-xs text-zinc-500">Everything you can do with Klarity. Click to expand.</p>
      </header>

      {/* Design Principles Banner */}
      <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
        <h3 className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-2">Core Design Principles</h3>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-zinc-300 font-medium">Human-in-the-Loop</span>
              <span className="text-zinc-500 block">AI assists, you decide</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-zinc-300 font-medium">Catch Issues Early</span>
              <span className="text-zinc-500 block">Fix at lowest cost</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-zinc-300 font-medium">Documentation-First</span>
              <span className="text-zinc-500 block">Design before code</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-zinc-300 font-medium">Quality Gates</span>
              <span className="text-zinc-500 block">Review before proceed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="space-y-2">
        {featuresData.map((feature) => (
          <ExpandableFeatureCard
            key={feature.id}
            feature={feature}
            isExpanded={expandedFeature === feature.id}
            onToggle={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface FeatureData {
  id: string;
  icon: string;
  title: string;
  tagline: string;
  description: string;
  capabilities: string[];
  principles: { label: string; desc: string; highlight: boolean }[];
}

function ExpandableFeatureCard({
  feature,
  isExpanded,
  onToggle,
}: {
  feature: FeatureData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const iconMap: Record<string, React.ReactNode> = {
    pipeline: <PipelineIcon />,
    docs: <DocsIcon />,
    inbox: <InboxIcon />,
    search: <SearchIcon />,
    mic: <MicIcon />,
    bell: <BellIcon />,
  };

  return (
    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-zinc-800/50 transition-colors"
      >
        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">
          {iconMap[feature.icon]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-zinc-200">{feature.title}</div>
          <div className="text-[11px] text-zinc-500 truncate">{feature.tagline}</div>
        </div>
        <ChevronIcon className={clsx('w-3.5 h-3.5 text-zinc-500 transition-transform flex-shrink-0', isExpanded && 'rotate-90')} />
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-zinc-800/50 space-y-3">
          {/* Description */}
          <p className="text-[11px] text-zinc-400 leading-relaxed">{feature.description}</p>

          {/* Capabilities */}
          <div>
            <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Key Capabilities</h4>
            <ul className="space-y-1">
              {feature.capabilities.map((cap, i) => (
                <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                  <span className="text-blue-400/70 mt-0.5">•</span>
                  {cap}
                </li>
              ))}
            </ul>
          </div>

          {/* Design Principles */}
          <div>
            <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Design Principles</h4>
            <div className="space-y-1.5">
              {feature.principles.map((principle, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex items-start gap-2 px-2 py-1.5 rounded text-[11px]',
                    principle.highlight
                      ? 'bg-indigo-500/10 border border-indigo-500/20'
                      : 'bg-zinc-800/50'
                  )}
                >
                  <div className={clsx(
                    'w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0',
                    principle.highlight ? 'bg-indigo-400' : 'bg-zinc-600'
                  )} />
                  <div>
                    <span className={clsx(
                      'font-medium',
                      principle.highlight ? 'text-indigo-300' : 'text-zinc-300'
                    )}>
                      {principle.label}
                    </span>
                    <span className="text-zinc-500 ml-1">— {principle.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowSection() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">9-Step Workflow</h1>
        <p className="text-xs text-zinc-500">Structured approach from idea to completion.</p>
      </header>

      <div className="space-y-3">
        <PhaseBlock phase="Design" color="#8b5cf6" stages={[
          { name: 'Conception', desc: 'Idea, problem, audience' },
          { name: 'Discovery', desc: 'Research, analysis, needs' },
          { name: 'Requirements', desc: 'PRD, user stories' },
        ]} />
        <PhaseBlock phase="Engineering" color="#3b82f6" stages={[
          { name: 'Architecture', desc: 'Tech design, diagrams' },
          { name: 'QA Planning', desc: 'Test strategy, cases' },
          { name: 'Review', desc: 'Approval, sign-off' },
        ]} />
        <PhaseBlock phase="Build" color="#22c55e" stages={[
          { name: 'Development', desc: 'Implementation, coding' },
          { name: 'Testing', desc: 'Unit/integration tests' },
          { name: 'Staging', desc: 'Pre-prod, UAT' },
        ]} />
        <PhaseBlock phase="Launch" color="#f59e0b" stages={[
          { name: 'Ship', desc: 'Deploy, release notes' },
          { name: 'Announce', desc: 'Marketing, social' },
          { name: 'Walkthrough', desc: 'Demo, onboarding' },
        ]} />
        <PhaseBlock phase="Closure" color="#ec4899" stages={[
          { name: 'Documentation', desc: 'Final docs, README' },
          { name: 'Portfolio', desc: 'Case study, screenshots' },
          { name: 'Retrospective', desc: 'Lessons, celebration' },
        ]} />
      </div>
    </div>
  );
}

function ShortcutsSection() {
  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: '⌘ K', action: 'Quick Launch' },
      { keys: 'Ctrl 1', action: 'Projects' },
      { keys: 'Ctrl 2', action: 'Docs' },
      { keys: 'Ctrl 3', action: 'Inbox' },
      { keys: 'Ctrl 4', action: 'Help' },
    ]},
    { category: 'Actions', items: [
      { keys: '⌘ S', action: 'Save Document' },
      { keys: '⌘ N', action: 'New Project' },
      { keys: 'Esc', action: 'Close/Cancel' },
    ]},
    { category: 'Quick Launch', items: [
      { keys: '> new', action: 'New project' },
      { keys: '> settings', action: 'Settings' },
      { keys: '> voice', action: 'Voice capture' },
    ]},
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">Keyboard Shortcuts</h1>
        <p className="text-xs text-zinc-500">Navigate faster with shortcuts.</p>
      </header>

      <div className="space-y-3">
        {shortcuts.map((group) => (
          <div key={group.category}>
            <h3 className="text-[11px] font-medium text-zinc-400 mb-1.5">{group.category}</h3>
            <div className="bg-zinc-800/50 rounded border border-zinc-700/50 overflow-hidden">
              {group.items.map((shortcut, i) => (
                <div
                  key={shortcut.action}
                  className={clsx(
                    'flex items-center justify-between px-2.5 py-1.5 text-xs',
                    i !== group.items.length - 1 && 'border-b border-zinc-700/30'
                  )}
                >
                  <span className="text-zinc-400">{shortcut.action}</span>
                  <Kbd>{shortcut.keys}</Kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigurationSection() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">Configuration</h1>
        <p className="text-xs text-zinc-500">Customize Task Board to fit your workflow.</p>
      </header>

      <Section title="Settings Panel">
        <p className="mb-2">Access via gear icon or <Kbd>⌘ ,</Kbd></p>
        <div className="space-y-1.5">
          <ConfigItem title="Profile" desc="Name, email, timezone, paths" />
          <ConfigItem title="Integrations" desc="Groq, GitHub, Jira" />
          <ConfigItem title="Workflow" desc="Phases, stages, priorities" />
          <ConfigItem title="Agents" desc="AI agent templates" />
          <ConfigItem title="Appearance" desc="Theme, accent, compact mode" />
          <ConfigItem title="Notifications" desc="Alerts, sound, timing" />
          <ConfigItem title="Advanced" desc="Debug, auto-save, backup" />
        </div>
      </Section>

      <Section title="Config File">
        <p className="mb-2">Settings stored in <code className="text-blue-400 text-[11px]">config.json</code></p>
        <div className="bg-zinc-800/50 rounded p-2 font-mono text-[10px] overflow-x-auto">
          <pre className="text-zinc-500">{`{ "user": {...}, "workflow": {...}, "integrations": {...} }`}</pre>
        </div>
      </Section>

      <Section title="Integrations">
        <div className="space-y-2">
          <div className="p-2.5 bg-zinc-800/50 rounded border border-zinc-700/50">
            <h4 className="text-xs font-medium text-zinc-300 mb-1">Groq (Voice)</h4>
            <p className="text-[11px] text-zinc-500">Get key from console.groq.com → Settings → Integrations</p>
          </div>
          <div className="p-2.5 bg-zinc-800/50 rounded border border-zinc-700/50">
            <h4 className="text-xs font-medium text-zinc-300 mb-1">Jira</h4>
            <p className="text-[11px] text-zinc-500">Token from id.atlassian.com → Settings → Integrations</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

const GITHUB_BASE = 'https://github.com/castroarun/claude-shared/blob/main';

const unifiedAgents = [
  {
    id: 'designer',
    name: 'Designer',
    invocation: '@designer',
    file: 'agents/designer.md',
    desc: 'Requirements via deep research',
    capabilities: ['WebSearch for research', 'Skill discovery', 'Systematic questioning', 'Creates idea.md, discovery.md, APP_PRD.md'],
    phase: 'Design',
  },
  {
    id: 'architect',
    name: 'Architect',
    invocation: '@architect',
    file: 'agents/architect.md',
    desc: 'System design, PRD, mockups',
    capabilities: ['Two-phase approach (Discovery → PRD)', 'HTML mockups generation', '.drawio diagrams', 'Jira integration', 'Creates ARCHITECTURE.md'],
    phase: 'Engineering',
  },
  {
    id: 'qa',
    name: 'QA',
    invocation: '@qa',
    file: 'agents/qa.md',
    desc: 'Test planning and execution',
    capabilities: ['TEST-PLAN.csv (Excel format)', 'TEST_CASES.md (Markdown)', 'test-results.md', 'Quality gates', 'Staging checklist'],
    phase: 'Engineering / Build',
  },
  {
    id: 'dev',
    name: 'Dev',
    invocation: '@dev',
    file: 'agents/dev.md',
    desc: 'Development tracking',
    capabilities: ['Task execution tracking', 'dev-log.md maintenance', 'Progress updates', 'Bug discovery workflow', 'Code standards'],
    phase: 'Build',
  },
  {
    id: 'walkthrough',
    name: 'Walkthrough',
    invocation: '@walkthrough',
    file: 'agents/walkthrough.md',
    desc: 'Code walkthroughs',
    capabilities: ['Live code explanation', 'WALKTHROUGH.md generation', 'Feature documentation'],
    phase: 'Launch',
  },
  {
    id: 'retro',
    name: 'Retro',
    invocation: '@retro',
    file: 'agents/retro.md',
    desc: 'Project retrospectives',
    capabilities: ['4-Question Framework', 'Progressive improvement tracking', '5 Whys root cause', 'RETRO.md generation', 'Action items (SMART)'],
    phase: 'Closure',
  },
];

const unifiedCommands = [
  {
    id: 'readme',
    name: 'README',
    invocation: '/readme',
    file: 'commands/readme.md',
    desc: 'README quality scoring',
    capabilities: ['Quality score 0-100', 'Badge generation', 'ORBIT validation', 'Roadmap sync', 'Auto-fix suggestions'],
  },
  {
    id: 'git',
    name: 'Git',
    invocation: '/git',
    file: 'commands/git.md',
    desc: 'Git operations',
    capabilities: ['Commit standards', 'ORBIT sync on push', 'Branch management', 'README check before push'],
  },
  {
    id: 'docs',
    name: 'Docs',
    invocation: '/docs',
    file: 'commands/docs.md',
    desc: 'Documentation generation',
    capabilities: ['README.md', 'CHANGELOG.md', 'WALKTHROUGH.md', 'portfolio-entry.md', 'linkedin-post.md', 'retro.md'],
  },
  {
    id: 'deploy',
    name: 'Deploy',
    invocation: '/deploy',
    file: 'commands/deploy.md',
    desc: 'Deployment workflows',
    capabilities: ['Production deploy', 'Staging deploy', 'Environment configuration'],
  },
  {
    id: 'newproject',
    name: 'New Project',
    invocation: '/newproject',
    file: 'commands/newproject.md',
    desc: 'Project initialization',
    capabilities: ['9-step workflow setup', 'Folder structure', 'Template files', 'DEV-CLOCK.md', 'PROJECT-STATUS.md'],
  },
];

function AgentsSection() {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);

  return (
    <div className="flex gap-6">
      {/* Left Column - Agent/Command List */}
      <div className="flex-1 space-y-4 min-w-0">
        <header>
          <h1 className="text-base font-semibold text-zinc-100 mb-1">AI Agents</h1>
          <p className="text-xs text-zinc-500">
            Unified agents from{' '}
            <a
              href="https://github.com/castroarun/claude-shared"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400/70 hover:text-blue-400"
            >
              <GitHubIcon className="w-3 h-3" />
              claude-shared
            </a>
            {' '}for AI-assisted development.
          </p>
        </header>

        <Section title="Agents (@invocation)">
          <div className="space-y-1.5">
            {unifiedAgents.map((agent) => (
              <ExpandableAgentCard
                key={agent.id}
                agent={agent}
                isExpanded={expandedAgent === agent.id}
                onToggle={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                githubUrl={agent.file ? `${GITHUB_BASE}/${agent.file}` : null}
              />
            ))}
          </div>
        </Section>

        <Section title="Commands (/invocation)">
          <div className="space-y-1.5">
            {unifiedCommands.map((cmd) => (
              <ExpandableCommandCard
                key={cmd.id}
                command={cmd}
                isExpanded={expandedCommand === cmd.id}
                onToggle={() => setExpandedCommand(expandedCommand === cmd.id ? null : cmd.id)}
                githubUrl={cmd.file ? `${GITHUB_BASE}/${cmd.file}` : null}
              />
            ))}
          </div>
        </Section>

        <Section title="Execution Modes">
          <div className="space-y-1.5 text-zinc-400">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/30 rounded">
              <div className="w-1.5 h-1.5 bg-green-500/70 rounded-full flex-shrink-0" />
              <span className="text-xs"><strong>Manual</strong> — Type @agent or /command in Claude Code</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/30 rounded">
              <div className="w-1.5 h-1.5 bg-blue-500/70 rounded-full flex-shrink-0" />
              <span className="text-xs"><strong>Auto</strong> — App detects inbox.md changes, spawns agents</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/30 rounded">
              <div className="w-1.5 h-1.5 bg-purple-500/70 rounded-full flex-shrink-0" />
              <span className="text-xs"><strong>Hybrid</strong> — Both modes enabled (default)</span>
            </div>
          </div>
        </Section>

        <Section title="Quick Installation">
          <div className="space-y-3">
            <p className="text-[11px] text-zinc-500">
              Share with teammates or install on another machine:
            </p>

            {/* macOS/Linux/Git Bash */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] font-medium text-zinc-400">macOS / Linux / Git Bash</span>
              </div>
              <div className="bg-zinc-900 rounded border border-zinc-800 p-2 font-mono text-[10px] text-zinc-300 overflow-x-auto">
                <div className="text-zinc-500"># Clone and install (one-liner)</div>
                <div className="text-green-400/80 select-all">git clone https://github.com/castroarun/claude-shared.git ~/.claude-shared && \</div>
                <div className="text-green-400/80 select-all">mkdir -p ~/.claude/agents ~/.claude/commands && \</div>
                <div className="text-green-400/80 select-all">cp ~/.claude-shared/agents/*.md ~/.claude/agents/ && \</div>
                <div className="text-green-400/80 select-all">cp ~/.claude-shared/commands/*.md ~/.claude/commands/</div>
              </div>
            </div>

            {/* Windows PowerShell */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <WindowsIcon className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] font-medium text-zinc-400">Windows PowerShell</span>
              </div>
              <div className="bg-zinc-900 rounded border border-zinc-800 p-2 font-mono text-[10px] text-zinc-300 overflow-x-auto">
                <div className="text-zinc-500"># Clone repository</div>
                <div className="text-blue-400/80 select-all">git clone https://github.com/castroarun/claude-shared.git $HOME\.claude-shared</div>
                <div className="text-zinc-500 mt-1"># Install agents & commands</div>
                <div className="text-blue-400/80 select-all">New-Item -ItemType Directory -Force -Path $HOME\.claude\agents</div>
                <div className="text-blue-400/80 select-all">Copy-Item $HOME\.claude-shared\agents\*.md $HOME\.claude\agents\</div>
                <div className="text-blue-400/80 select-all">New-Item -ItemType Directory -Force -Path $HOME\.claude\commands</div>
                <div className="text-blue-400/80 select-all">Copy-Item $HOME\.claude-shared\commands\*.md $HOME\.claude\commands\</div>
              </div>
            </div>

            {/* Verify */}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
              <CheckCircleIcon className="w-3 h-3 text-emerald-500/70" />
              <span className="text-[10px] text-emerald-400/80">Test: Type <code className="bg-zinc-800 px-1 rounded">@architect help</code> in Claude Code</span>
            </div>
          </div>
        </Section>

        <Section title="Source Repository">
          <a
            href="https://github.com/castroarun/claude-shared"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2.5 py-2 bg-zinc-800/50 rounded border border-zinc-700/50 hover:bg-zinc-800 transition-colors group"
          >
            <GitHubIcon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
            <span className="text-xs text-zinc-400 group-hover:text-zinc-300">castroarun/claude-shared</span>
            <ExternalLinkIcon className="w-3 h-3 text-zinc-600 ml-auto" />
          </a>
        </Section>
      </div>

      {/* Right Column - Workflow Diagram */}
      <div className="w-[420px] flex-shrink-0">
        <AgentWorkflowDiagram />
      </div>
    </div>
  );
}

// Workflow phases with their agents/commands and outputs
const workflowPhases = [
  {
    id: 'start',
    name: 'Start',
    color: '#6b7280',
    items: [{ type: 'command', name: '/newproject', desc: 'Initialize' }],
    output: 'PROJECT-STATUS.md',
  },
  {
    id: 'design',
    name: 'Design',
    color: '#f472b6',
    items: [{ type: 'agent', name: '@designer', desc: 'Requirements' }],
    output: 'idea.md, APP_PRD.md',
  },
  {
    id: 'engineering',
    name: 'Engineering',
    color: '#38bdf8',
    items: [
      { type: 'agent', name: '@architect', desc: 'Architecture' },
      { type: 'agent', name: '@qa', desc: 'Test Planning' },
    ],
    output: 'ARCHITECTURE.md, TEST-PLAN.md',
  },
  {
    id: 'build',
    name: 'Build',
    color: '#facc15',
    items: [
      { type: 'agent', name: '@dev', desc: 'Development' },
      { type: 'command', name: '/git', desc: 'Version Control' },
    ],
    output: 'dev-log.md, README.md',
  },
  {
    id: 'launch',
    name: 'Launch',
    color: '#4ade80',
    items: [
      { type: 'agent', name: '@walkthrough', desc: 'Documentation' },
      { type: 'command', name: '/deploy', desc: 'Deployment' },
    ],
    output: 'WALKTHROUGH.md',
  },
  {
    id: 'closure',
    name: 'Closure',
    color: '#5eead4',
    items: [
      { type: 'agent', name: '@retro', desc: 'Retrospective' },
      { type: 'command', name: '/docs', desc: 'Portfolio' },
      { type: 'command', name: '/readme', desc: 'Quality Check' },
    ],
    output: 'RETRO.md, README.md',
  },
];

function AgentWorkflowDiagram() {
  return (
    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 sticky top-4">
      <h3 className="text-xs font-medium text-zinc-300 mb-4 flex items-center gap-2">
        <FlowIcon />
        Workflow
      </h3>

      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[11px] top-4 bottom-4 w-px bg-gradient-to-b from-zinc-700 via-zinc-600 to-zinc-700" />

        {/* Phases */}
        <div className="space-y-3">
          {workflowPhases.map((phase, phaseIndex) => (
            <div key={phase.id} className="relative">
              {/* Phase row */}
              <div className="flex items-start gap-3">
                {/* Circle indicator */}
                <div
                  className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 bg-zinc-900 z-10"
                  style={{ borderColor: phase.color }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: phase.color }}
                  />
                </div>

                {/* Phase content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div
                    className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: phase.color }}
                  >
                    {phase.name}
                  </div>

                  {/* Items in this phase */}
                  <div className="space-y-1">
                    {phase.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center gap-1.5 text-[11px]"
                      >
                        <code
                          className={clsx(
                            'px-1.5 py-0.5 rounded text-[10px]',
                            item.type === 'agent'
                              ? 'bg-blue-500/15 text-blue-400/90'
                              : 'bg-emerald-500/15 text-emerald-400/90'
                          )}
                        >
                          {item.name}
                        </code>
                        <span className="text-zinc-600 text-[10px]">{item.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Output with dotted arrow - at bottom of phase */}
                  {phase.output && (
                    <div className="mt-1.5 flex items-center gap-2 text-[9px]">
                      {/* Dotted arrow line */}
                      <div className="flex-1 flex items-center min-w-[80px]">
                        <div className="flex-1 border-t border-dashed border-zinc-600" />
                        <svg className="w-2.5 h-2.5 text-zinc-500 -ml-0.5 flex-shrink-0" viewBox="0 0 8 8" fill="currentColor">
                          <path d="M0 0L8 4L0 8V0z" />
                        </svg>
                      </div>
                      <code className="text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                        {phase.output}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              {/* Arrow between phases */}
              {phaseIndex < workflowPhases.length - 1 && (
                <div className="absolute left-[7px] -bottom-1.5 text-zinc-600">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="currentColor">
                    <path d="M4 6L0 0h8L4 6z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-blue-500/50" />
            <span>@agent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-emerald-500/50" />
            <span>/command</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-amber-500/50" />
            <span>→ output</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AgentData {
  id: string;
  name: string;
  invocation: string;
  file: string | null;
  desc: string;
  capabilities: string[];
  phase: string;
}

interface CommandData {
  id: string;
  name: string;
  invocation: string;
  file: string | null;
  desc: string;
  capabilities: string[];
}

function ExpandableAgentCard({
  agent,
  isExpanded,
  onToggle,
  githubUrl,
}: {
  agent: AgentData;
  isExpanded: boolean;
  onToggle: () => void;
  githubUrl: string | null;
}) {
  return (
    <div className="bg-zinc-800/30 rounded border border-zinc-800/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-2.5 py-2 flex items-center gap-2 text-left hover:bg-zinc-800/50 transition-colors"
      >
        <ChevronIcon className={clsx('w-3 h-3 text-zinc-500 transition-transform', isExpanded && 'rotate-90')} />
        <span className="text-xs font-medium text-zinc-300">{agent.name}</span>
        <code className="text-[10px] text-blue-400/70 bg-blue-500/10 px-1.5 py-0.5 rounded">{agent.invocation}</code>
        <span className="text-[10px] text-zinc-600 ml-auto">{agent.phase}</span>
      </button>
      {isExpanded && (
        <div className="px-2.5 pb-2.5 pt-1 border-t border-zinc-800/50">
          <p className="text-[11px] text-zinc-500 mb-2">{agent.desc}</p>
          <div className="mb-2">
            <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Capabilities</h4>
            <ul className="space-y-0.5">
              {agent.capabilities.map((cap, i) => (
                <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                  <span className="text-green-500/70 mt-0.5">•</span>
                  {cap}
                </li>
              ))}
            </ul>
          </div>
          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-blue-400 transition-colors"
            >
              <GitHubIcon className="w-3 h-3" />
              View on GitHub
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-600">
              <InfoIcon />
              Docs in local project
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ExpandableCommandCard({
  command,
  isExpanded,
  onToggle,
  githubUrl,
}: {
  command: CommandData;
  isExpanded: boolean;
  onToggle: () => void;
  githubUrl: string | null;
}) {
  return (
    <div className="bg-zinc-800/30 rounded border border-zinc-800/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-2.5 py-2 flex items-center gap-2 text-left hover:bg-zinc-800/50 transition-colors"
      >
        <ChevronIcon className={clsx('w-3 h-3 text-zinc-500 transition-transform', isExpanded && 'rotate-90')} />
        <span className="text-xs font-medium text-zinc-300">{command.name}</span>
        <code className="text-[10px] text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">{command.invocation}</code>
      </button>
      {isExpanded && (
        <div className="px-2.5 pb-2.5 pt-1 border-t border-zinc-800/50">
          <p className="text-[11px] text-zinc-500 mb-2">{command.desc}</p>
          <div className="mb-2">
            <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Outputs</h4>
            <ul className="space-y-0.5">
              {command.capabilities.map((cap, i) => (
                <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                  <span className="text-emerald-500/70 mt-0.5">•</span>
                  {cap}
                </li>
              ))}
            </ul>
          </div>
          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-blue-400 transition-colors"
            >
              <GitHubIcon className="w-3 h-3" />
              View on GitHub
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-600">
              <InfoIcon />
              Docs in local project
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">About</h1>
        <p className="text-xs text-zinc-500">Version and credits.</p>
      </header>

      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
        <div className="flex items-center gap-3 mb-4">
          <KlarityLogoAbout />
          <div>
            <div className="text-sm font-medium text-zinc-100">Klarity</div>
            <div className="text-[11px] text-zinc-500">v1.0.0</div>
          </div>
        </div>
        <p className="text-xs text-zinc-400 mb-1 font-medium">Declutter. Design. Deploy.</p>
        <p className="text-xs text-zinc-500 mb-4">Klarity helps you declutter your project chaos, design with clarity, and deploy with confidence.</p>

        {/* Brand color bars */}
        <div className="flex gap-2 mb-4">
          <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: '#6366f1' }} />
          <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: '#a78bfa' }} />
          <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: '#22d3ee' }} />
        </div>

        <div className="flex items-center gap-4 pt-3 border-t border-zinc-700/50 text-[11px]">
          <a href="https://github.com/castroarun/taskboard" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
            <GitHubIcon className="w-3 h-3" />
            GitHub
          </a>
          <a href="https://github.com/castroarun/taskboard/issues/new" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300">Report Bug</a>
          <a href="https://github.com/castroarun/taskboard/discussions/new?category=ideas" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
            <FeedbackIcon className="w-3 h-3" />
            Feedback
          </a>
        </div>
      </div>

      <Section title="Tech Stack">
        <div className="flex flex-wrap gap-1.5">
          {['Tauri 2.0', 'React 18', 'TypeScript', 'Tailwind', 'Zustand', 'Vite'].map((tech) => (
            <span key={tech} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded border border-zinc-700/50">
              {tech}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Links">
        <div className="space-y-1.5">
          <ExternalLink href="https://console.groq.com" label="Groq Console" desc="Voice API" />
          <ExternalLink href="https://tauri.app" label="Tauri" desc="Desktop framework" />
          <ExternalLink href="https://id.atlassian.com/manage-profile/security/api-tokens" label="Atlassian" desc="Jira tokens" />
        </div>
      </Section>
    </div>
  );
}

// === HELPER COMPONENTS ===

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-medium text-zinc-300 mb-1.5">{title}</h2>
      <div className="text-xs text-zinc-500 leading-relaxed">{children}</div>
    </section>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded border border-zinc-700 font-mono">
      {children}
    </kbd>
  );
}

function PhaseBlock({ phase, color, stages }: { phase: string; color: string; stages: { name: string; desc: string }[] }) {
  return (
    <div className="rounded border border-zinc-800/50 overflow-hidden">
      <div className="px-2.5 py-1.5 flex items-center gap-1.5" style={{ backgroundColor: `${color}15` }}>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-zinc-300">{phase}</span>
      </div>
      <div className="divide-y divide-zinc-800/50">
        {stages.map((stage, i) => (
          <div key={stage.name} className="px-2.5 py-1.5 flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 font-mono w-3">{i + 1}</span>
            <span className="text-xs text-zinc-400">{stage.name}</span>
            <span className="text-[11px] text-zinc-600">— {stage.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/30 rounded">
      <div className="w-1.5 h-1.5 bg-blue-500/70 rounded-full flex-shrink-0" />
      <span className="text-xs text-zinc-400">{title}</span>
      <span className="text-[11px] text-zinc-600">— {desc}</span>
    </div>
  );
}

function ExternalLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between px-2 py-1.5 bg-zinc-800/30 rounded hover:bg-zinc-800/50 transition-colors group"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 group-hover:text-zinc-300">{label}</span>
        <span className="text-[10px] text-zinc-600">{desc}</span>
      </div>
      <ExternalLinkIcon className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
    </a>
  );
}

// === KLARITY LOGO FOR ABOUT SECTION ===

function KlarityLogoAbout() {
  return (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50">
      <svg className="w-7 h-7" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="klarity-about-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="28" r="20" fill="none" stroke="url(#klarity-about-gradient)" strokeWidth="3" />
        <rect x="24" y="14" width="4" height="28" fill="#a78bfa" />
        <path d="M28 28 L40 14 L44 14 L44 18 L32 28 L44 38 L44 42 L40 42 L28 28" fill="#6366f1" />
        <line x1="46" y1="42" x2="58" y2="54" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Klarity Logo for Getting Started Hero
function KlarityLogoHero() {
  return (
    <svg className="w-20 h-20" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="klarity-hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="28" r="20" fill="none" stroke="url(#klarity-hero-gradient)" strokeWidth="3" />
      <rect x="24" y="14" width="4" height="28" fill="#a78bfa" />
      <path d="M28 28 L40 14 L44 14 L44 18 L32 28 L44 38 L44 42 L40 42 L28 28" fill="#6366f1" />
      <line x1="46" y1="42" x2="58" y2="54" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// === ICONS (all w-3.5 h-3.5 for sidebar, feature cards override via parent) ===

function RocketIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function FlowIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3h6m-6 0v2m6-2v2M9 21h6m-6 0v-2m6 2v-2M4 7h16a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function ExternalLinkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function ChevronIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function GitHubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function TerminalIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function WindowsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 5.548l7.053-0.96v6.817H3V5.548zm0 12.9l7.053 0.96v-6.715H3v5.755zm7.938 1.063L21 21v-8.305h-10.062v6.816zm0-14.025v6.819H21V3l-10.062 1.486z" />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function FeedbackIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

