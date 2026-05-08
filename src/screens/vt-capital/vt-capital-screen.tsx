import { useEffect, useMemo, useState } from 'react'

type VtWorker = {
  workerId: string
  name?: string
  emoji?: string
  councilRole?: string
  shortRole?: string
  skills?: Array<string>
  chatPrompt?: string
  chatUrl?: string
  state?: string
  currentTask?: string | null
  lastSummary?: string | null
  latestAnalysis?: string | null
  recentMessages?: Array<{
    id: string
    role: string
    content: string
    timestamp: number | null
  }>
  sessionId?: string | null
  sessionTitle?: string | null
  chatAvailable?: boolean
  memoryExists?: boolean
  identityExists?: boolean
  runtimeExists?: boolean
  soulExists?: boolean
}

type VtNote = { title: string; path: string; mtimeMs: number; size: number }

type DirectChatResponse = {
  ok: boolean
  workerId: string
  delivered: boolean
  error?: string | null
  sessionId: string | null
  sessionTitle: string | null
  messages: Array<{
    id: string
    role: string
    content: string
    timestamp: number | null
  }>
  source: 'state.db' | 'unavailable'
  fetchedAt: number
}

type CouncilDispatchResult = {
  workerId: string
  workerName: string
  role: string
  ok: boolean
  status: string
  reply: string
  error?: string | null
}

type PortfolioAsset = {
  symbol: string
  book?: string
  strategyId?: string | null
  side?: string | null
  status: string
  openQuantity: number
  avgEntry: number
  lastPrice: number
  openExposure: number
  markToMarketValue: number
  allocationPct?: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  maxRiskToStop: number
  riskToStopPct?: number
  signal?: string | null
  confidence?: number | string | null
  orders: Array<Record<string, unknown>>
}

type PortfolioSnapshot = {
  activeTrades: number
  activeInvestments: number
  openExposure: number
  markToMarketValue: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  maxRiskToStop: number
  riskToStopPct?: number
  assetCount: number
  assets: Array<PortfolioAsset>
  activeOrders: Array<Record<string, unknown>>
}

type GuardianPayload = {
  requireOrderScope: boolean
  executionMode: string
  liveBlocked: boolean
  executionEnabled: boolean
  lastRiskCheck: Record<string, unknown> | null
  lastOrderProposed: Record<string, unknown> | null
  lastOrderExecuted: Record<string, unknown> | null
  demoState: {
    openOrders: number
    trackedOrders: number
    lastOrder: Record<string, unknown> | null
  }
  recentBlocks: Array<Record<string, unknown>>
}

type ShadowPayload = {
  fileExists: boolean
  updatedAt: number | null
  eventCount: number
  lastEventType: string | null
  lastTimestamp: string | null
  namespace: string | null
  mode: string | null
  executionEnabled: boolean | null
  brokerSupplied: boolean | null
  recent: Array<Record<string, unknown>>
}

type CouncilHistoryPayload = {
  total: number
  latestDecision: string | null
  latestAsset: string | null
  latestRisk: string | null
  counts: Record<string, number>
  timeline: Array<Record<string, unknown>>
}

type AutoResearchPayload = {
  fileExists: boolean
  updatedAt: number | null
  enabled: boolean
  status: string
  mode: string
  executionEnabled?: boolean
  liveTradingEnabled?: boolean
  demoTradingEnabled?: boolean
  enabledUseCases: Array<string>
  useCases: Record<string, unknown>
  inspirations?: Array<Record<string, unknown>>
  workflow?: Array<string>
  researchTopics?: Array<string>
  agents: Array<Record<string, unknown>>
  safeguards: Array<string>
}

type StrategyRegistryPayload = {
  fileExists: boolean
  updatedAt: number | null
  mode: string
  executionEnabled: boolean
  liveTradingEnabled: boolean
  pipeline: Array<string>
  safeguards: Array<string>
  strategies: Array<Record<string, unknown>>
}

type BacktestResultPayload = {
  fileExists: boolean
  updatedAt: number | null
  generatedAt: string | null
  mode: string
  executionEnabled: boolean
  dataDir: string | null
  results: Array<Record<string, unknown>>
}

type StrategyTestLogPayload = {
  fileExists: boolean
  updatedAt: number | null
  eventCount: number
  byStrategy: Record<string, number>
  byConcilium?: Record<string, number>
  latestConcilium?: Record<string, unknown> | null
  concilium?: {
    reviewed: number
    recommendations: Record<string, number>
    latest: Record<string, unknown> | null
  }
  recent: Array<Record<string, unknown>>
}

type ForwardTestQueuePayload = {
  fileExists: boolean
  updatedAt: number | null
  logExists: boolean
  logUpdatedAt: number | null
  logEventCount: number
  generatedAt: string | null
  mode: string
  sourceBacktestGeneratedAt: string | null
  activeCount: number
  active: Array<Record<string, unknown>>
  safety: {
    observeOnly: boolean
    executionEnabled: boolean
    demoTradingEnabled: boolean
    liveTradingEnabled: boolean
    registryMutated: boolean
    paperPromoted: boolean
    brokerCallsAllowed: boolean
  }
}

type ForwardPerformancePayload = {
  fileExists: boolean
  updatedAt: number | null
  logExists: boolean
  logUpdatedAt: number | null
  logEventCount: number
  generatedAt: string | null
  mode: string
  sourceQueueGeneratedAt: string | null
  activeCount: number
  observedCount: number
  observations: Array<Record<string, unknown>>
  forwardHistory?: {
    candidate_count?: number
    eligible_count?: number
    candidates?: Array<Record<string, unknown>>
    thresholds?: Record<string, unknown>
    safety?: Record<string, unknown>
  }
  safety: {
    observeOnly: boolean
    executionEnabled: boolean
    demoTradingEnabled: boolean
    liveTradingEnabled: boolean
    registryMutated: boolean
    paperPromoted: boolean
    brokerCallsAllowed: boolean
  }
}

type BacktestDataPayload = {
  source: string
  fetcher: string
  configPath: string
  outputDir: string
  fileExists: boolean
  fileCount: number
  files: Array<string>
  symbols: Array<string>
  timeframes: Array<string>
  limitation: string
  nextSource: string
}

type VtMapNode = {
  id: string
  title: string
  group: 'core' | 'agent' | 'strategy' | 'queue' | 'missing'
  status: 'online' | 'observe' | 'demo' | 'missing' | 'blocked'
  summary: string
  does: string
  input: string
  output: string
  next: string
}

type VtPayload = {
  ok: boolean
  checkedAt: number
  plugin: {
    name: string
    version: string
    mode: string
    executionEnabled: boolean
  }
  paths: Record<string, string>
  marketBias: {
    fileExists: boolean
    updatedAt: number | null
    sizeBytes: number
    latest: Record<string, unknown> | null
    recent: Array<Record<string, unknown>>
  }
  council: {
    fileExists: boolean
    updatedAt: number | null
    sizeBytes: number
    recent: Array<Record<string, unknown>>
    history?: CouncilHistoryPayload
  }
  workers: Array<VtWorker>
  autoresearch?: AutoResearchPayload
  strategyRegistry?: StrategyRegistryPayload
  backtestResults?: BacktestResultPayload
  forwardTestQueue?: ForwardTestQueuePayload
  forwardPerformance?: ForwardPerformancePayload
  strategyTestLogs?: StrategyTestLogPayload
  backtestData?: BacktestDataPayload
  guardian?: GuardianPayload
  portfolio?: PortfolioSnapshot
  shadow?: ShadowPayload
  notes: Array<VtNote>
}

type VtTab =
  | 'mappa'
  | 'trading'
  | 'strategie'
  | 'log-strategie'
  | 'portafoglio'
  | 'concilium'
  | 'investimenti'
  | 'impostazioni'
  | 'altro'

const VT_SETTINGS_STORAGE_KEY = 'vt-capital-cockpit-settings'

const DEFAULT_VT_SETTINGS = {
  autoRefresh: true,
  refreshEverySeconds: 60,
  showRawJson: false,
  denseMode: false,
}

type VtSettings = typeof DEFAULT_VT_SETTINGS

const VT_STRATEGIES_STORAGE_KEY = 'vt-capital-strategy-lab'

type VtStrategyState = 'idea' | 'backtest' | 'paper' | 'disabled'

type VtStrategyLabItem = {
  id: string
  name: string
  icon: string
  book: 'trading' | 'investimenti' | 'altro'
  horizon: string
  state: VtStrategyState
  description: string
  backtestStatus: 'manca' | 'in_corso' | 'superato' | 'fallito'
  sample: string
  timeframes: string
  dataNeed: string
  guardrail: string
  symbols?: Array<string>
  canPaper?: boolean
  dataSource?: string
}

const DEFAULT_STRATEGY_LAB: Array<VtStrategyLabItem> = [
  {
    id: 'intraday-breakout-fast',
    name: 'Fast Breakout',
    icon: '⚡',
    book: 'trading',
    horizon: 'intraday',
    state: 'paper',
    description: 'Momentum veloce con trigger e stop ATR.',
    backtestStatus: 'superato',
    sample: 'BTC/ETH/SOL · breakout + regime',
    timeframes: '15m / 35m / 1h',
    dataNeed: 'OHLCV exchange, fee e slippage minuti.',
    guardrail: 'PAPER solo con invalidazione chiara e risk gate ok.',
  },
  {
    id: 'mean-reversion-rsi',
    name: 'RSI Reversion',
    icon: '↩️',
    book: 'trading',
    horizon: 'swing breve',
    state: 'backtest',
    description: 'Rimbalzi da ipervenduto confermati.',
    backtestStatus: 'in_corso',
    sample: 'RSI estremo + volume + regime BTC',
    timeframes: '35m / 1h / 4h',
    dataNeed: 'OHLCV + volume reale + volatilità.',
    guardrail: 'Non attivabile senza storico win-rate/drawdown.',
  },
  {
    id: 'dca-core-crypto',
    name: 'DCA Core',
    icon: '🏦',
    book: 'investimenti',
    horizon: 'lungo',
    state: 'idea',
    description: 'Accumulo lento, separato dal trading.',
    backtestStatus: 'manca',
    sample: 'BTC/ETH allocazione progressiva',
    timeframes: '1d / 1w / 1M',
    dataNeed: 'Storico multi-anno + drawdown ciclo.',
    guardrail: 'Serve policy allocazione e drawdown massimo.',
  },
]

function readStoredStrategyLab(): Record<string, VtStrategyState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(VT_STRATEGIES_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) =>
        ['idea', 'backtest', 'paper', 'disabled'].includes(String(value)),
      ),
    ) as Record<string, VtStrategyState>
  } catch {
    return {}
  }
}

function strategyStateLabel(state: VtStrategyState): string {
  if (state === 'idea') return 'Idea'
  if (state === 'backtest') return 'Backtest'
  if (state === 'paper') return 'Paper observe'
  return 'Disabilitata'
}

function strategyCanPaper(strategy: VtStrategyLabItem): boolean {
  return strategy.canPaper === true || strategy.backtestStatus === 'superato'
}

function normalizeRegistryStrategy(
  raw: Record<string, unknown>,
): VtStrategyLabItem | null {
  const id = typeof raw.id === 'string' ? raw.id : null
  const name = typeof raw.name === 'string' ? raw.name : null
  if (!id || !name) return null
  const book = ['trading', 'investimenti', 'altro'].includes(String(raw.book))
    ? (String(raw.book) as VtStrategyLabItem['book'])
    : 'altro'
  const state = ['idea', 'backtest', 'paper', 'disabled'].includes(
    String(raw.state),
  )
    ? (String(raw.state) as VtStrategyState)
    : 'idea'
  const backtestStatus = ['manca', 'in_corso', 'superato', 'fallito'].includes(
    String(raw.backtest_status),
  )
    ? (String(raw.backtest_status) as VtStrategyLabItem['backtestStatus'])
    : 'manca'
  const symbols = Array.isArray(raw.symbols) ? raw.symbols.map(String) : []
  const timeframes = Array.isArray(raw.timeframes)
    ? raw.timeframes.map(String)
    : []
  return {
    id,
    name,
    icon: typeof raw.icon === 'string' ? raw.icon : '🧪',
    book,
    horizon: typeof raw.horizon === 'string' ? raw.horizon : 'n/d',
    state,
    description:
      typeof raw.description === 'string'
        ? raw.description
        : 'Strategia candidata.',
    backtestStatus,
    sample: symbols.length ? symbols.join('/') : 'campione da definire',
    timeframes: timeframes.length
      ? timeframes.join(' / ')
      : 'timeframe da definire',
    dataNeed:
      typeof raw.data_need === 'string' ? raw.data_need : 'dati da definire',
    guardrail:
      typeof raw.guardrail === 'string'
        ? raw.guardrail
        : 'paper solo dopo backtest ok',
    symbols,
    canPaper: raw.can_paper === true,
    dataSource:
      typeof raw.data_source === 'string' ? raw.data_source : undefined,
  }
}

function readStoredVtSettings(): VtSettings {
  if (typeof window === 'undefined') return DEFAULT_VT_SETTINGS
  try {
    const raw = window.localStorage.getItem(VT_SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_VT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<VtSettings>
    const refreshEverySeconds = [30, 60, 120, 300].includes(
      Number(parsed.refreshEverySeconds),
    )
      ? Number(parsed.refreshEverySeconds)
      : DEFAULT_VT_SETTINGS.refreshEverySeconds
    return {
      autoRefresh:
        typeof parsed.autoRefresh === 'boolean'
          ? parsed.autoRefresh
          : DEFAULT_VT_SETTINGS.autoRefresh,
      refreshEverySeconds,
      showRawJson:
        typeof parsed.showRawJson === 'boolean'
          ? parsed.showRawJson
          : DEFAULT_VT_SETTINGS.showRawJson,
      denseMode:
        typeof parsed.denseMode === 'boolean'
          ? parsed.denseMode
          : DEFAULT_VT_SETTINGS.denseMode,
    }
  } catch {
    return DEFAULT_VT_SETTINGS
  }
}

const VT_TABS: Array<{
  id: VtTab
  label: string
  icon: string
  short: string
  description: string
}> = [
  {
    id: 'mappa',
    label: 'Mappa',
    icon: '🗺️',
    short: 'Schema',
    description: 'Componenti e flussi.',
  },
  {
    id: 'trading',
    label: 'Trading',
    icon: '📈',
    short: 'Ordini',
    description: 'Guardian e shadow.',
  },
  {
    id: 'strategie',
    label: 'Strategie',
    icon: '🧪',
    short: 'Lab',
    description: 'Crea, testa, abilita.',
  },
  {
    id: 'log-strategie',
    label: 'Log test',
    icon: '📜',
    short: 'Test',
    description: 'Strategie e prove.',
  },
  {
    id: 'portafoglio',
    label: 'Portafoglio',
    icon: '💼',
    short: 'PNL',
    description: 'Esposizione e rischio.',
  },
  {
    id: 'concilium',
    label: 'Concilium',
    icon: '🧠',
    short: 'Agenti',
    description: 'Decisioni e chat.',
  },
  {
    id: 'investimenti',
    label: 'Investimenti',
    icon: '🏦',
    short: 'Lungo',
    description: 'Bias e watchlist.',
  },
  {
    id: 'impostazioni',
    label: 'Impostazioni',
    icon: '⚙️',
    short: 'Setup',
    description: 'Preferenze locali.',
  },
  {
    id: 'altro',
    label: 'Altro',
    icon: '🧩',
    short: 'Extra',
    description: 'Runtime e dettagli.',
  },
]

function formatTime(value: number | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function formatIsoTime(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value
  return formatTime(parsed)
}

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
  }).format(value)
}

function formatPct(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

function pnlTone(
  value: number | null | undefined,
): 'good' | 'warn' | 'bad' | 'neutral' {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0)
    return 'neutral'
  return value > 0 ? 'good' : 'bad'
}

function compactJson(value: unknown): string {
  if (value == null) return '—'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function formatConciliumRole(role: unknown): string {
  const item = asRecord(role)
  if (!item) return 'ruolo sconosciuto'
  const roleLabel = String(item.role ?? 'agent').replaceAll('_', ' ')
  return `${roleLabel}: ${String(item.stance ?? '—')} · ${String(item.reason_code ?? '—')}`
}

function formatViolations(value: unknown): string {
  return Array.isArray(value)
    ? value.map(String).join(', ')
    : String(value ?? '—')
}

function formatMoney(value: number | null | undefined): string {
  return formatCurrency(value)
}

function signedNumber(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function performanceTone(score: number): 'good' | 'warn' | 'bad' | 'neutral' {
  if (score >= 70) return 'good'
  if (score >= 45) return 'warn'
  if (score > 0) return 'bad'
  return 'neutral'
}

function stateClass(state: string | undefined): string {
  if (state === 'idle')
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (state === 'executing' || state === 'thinking' || state === 'writing')
    return 'bg-amber-500/15 text-amber-200 border-amber-500/30'
  if (state === 'blocked' || state === 'offline')
    return 'bg-red-500/15 text-red-200 border-red-500/30'
  return 'bg-primary-500/15 text-primary-200 border-primary-500/30'
}

function mapStatusClass(status: VtMapNode['status']): string {
  if (status === 'online')
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (status === 'observe')
    return 'border-sky-500/30 bg-sky-500/10 text-sky-300'
  if (status === 'demo')
    return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
  if (status === 'blocked')
    return 'border-red-500/30 bg-red-500/10 text-red-200'
  return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300'
}

function mapGroupLabel(group: VtMapNode['group']): string {
  if (group === 'core') return 'core progetto'
  if (group === 'agent') return 'agenti'
  if (group === 'strategy') return 'strategie'
  if (group === 'queue') return 'queue / memoria'
  return 'manca ancora'
}

function workerIsAvailable(worker: VtWorker): boolean {
  return Boolean(
    worker.runtimeExists ||
    worker.identityExists ||
    worker.memoryExists ||
    worker.soulExists ||
    worker.chatAvailable ||
    worker.latestAnalysis,
  )
}

function modeLabel(mode: string): string {
  if (mode === 'observe_only') return 'Modalità osservazione'
  return mode.replaceAll('_', ' ')
}

function executionLabel(enabled: boolean): string {
  return enabled ? 'Esecuzione attiva' : 'Esecuzione disattivata'
}

function decisionLabel(entry: Record<string, unknown>): string {
  if (typeof entry.decision === 'string') return entry.decision
  const precheck = entry.council_precheck
  if (precheck && typeof precheck === 'object') {
    const decision = (precheck as Record<string, unknown>).decision
    if (typeof decision === 'string') return decision
  }
  return 'precheck'
}

function entryTitle(entry: Record<string, unknown>, fallback: string): string {
  return String(entry.asset ?? entry.symbol ?? fallback)
}

function fieldValue(
  entry: Record<string, unknown> | null | undefined,
  field: string,
): string {
  if (!entry) return '—'
  const value = entry[field]
  if (value == null || value === '') return '—'
  return String(value)
}

function scopeLine(entry: Record<string, unknown> | null | undefined): string {
  if (!entry) return '—'
  return [
    fieldValue(entry, 'symbol'),
    fieldValue(entry, 'book'),
    fieldValue(entry, 'strategy_id'),
    fieldValue(entry, 'intent'),
    fieldValue(entry, 'position_horizon'),
  ]
    .filter((value) => value !== '—')
    .join(' · ')
}

function MiniEvent({
  label,
  event,
}: {
  label: string
  event: Record<string, unknown> | null | undefined
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{
        background: 'var(--theme-card2)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-ink">
        {scopeLine(event)}
      </div>
      <div className="mt-1 text-xs text-muted">
        approval {fieldValue(event, 'approval_id')} · stato{' '}
        {fieldValue(event, 'status') !== '—'
          ? fieldValue(event, 'status')
          : fieldValue(event, 'decision')}
      </div>
    </div>
  )
}

function Card({
  title,
  children,
  right,
  accent = 'var(--theme-accent)',
}: {
  title: string
  children: React.ReactNode
  right?: React.ReactNode
  accent?: string
}) {
  return (
    <section
      className="relative overflow-hidden rounded-xl border p-4 transition-colors"
      style={{
        background: 'var(--theme-card)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 45%, transparent), transparent)`,
        }}
      />
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  )
}

function Metric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: React.ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'bad'
}) {
  const accent =
    tone === 'good'
      ? 'var(--theme-success)'
      : tone === 'warn'
        ? 'var(--theme-warning)'
        : tone === 'bad'
          ? 'var(--theme-danger)'
          : 'var(--theme-accent)'
  return (
    <div
      className="relative overflow-hidden rounded-xl border p-3"
      style={{
        background: 'var(--theme-card)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
        {label}
      </div>
      <div
        className="mt-1 text-2xl font-bold tabular-nums leading-tight"
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  )
}

function SafetyPill({ label, safe }: { label: string; safe: boolean }) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{
        borderColor: safe
          ? 'color-mix(in srgb, var(--theme-success) 42%, var(--theme-border))'
          : 'color-mix(in srgb, var(--theme-danger) 42%, var(--theme-border))',
        background: safe
          ? 'color-mix(in srgb, var(--theme-success) 10%, transparent)'
          : 'color-mix(in srgb, var(--theme-danger) 10%, transparent)',
        color: safe ? 'var(--theme-success)' : 'var(--theme-danger)',
      }}
    >
      {safe ? '✓' : '!'} {label}
    </span>
  )
}

export function VtCapitalScreen() {
  const [data, setData] = useState<VtPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const storedSettings = useMemo(() => readStoredVtSettings(), [])
  const [activeTab, setActiveTab] = useState<VtTab>('mappa')
  const [autoRefresh, setAutoRefresh] = useState(storedSettings.autoRefresh)
  const [refreshEverySeconds, setRefreshEverySeconds] = useState(
    storedSettings.refreshEverySeconds,
  )
  const [showRawJson, setShowRawJson] = useState(storedSettings.showRawJson)
  const [denseMode, setDenseMode] = useState(storedSettings.denseMode)
  const storedStrategyLab = useMemo(() => readStoredStrategyLab(), [])
  const [strategyStates, setStrategyStates] =
    useState<Record<string, VtStrategyState>>(storedStrategyLab)
  const strategies = useMemo(() => {
    const registryStrategies = data?.strategyRegistry?.strategies
      .map(normalizeRegistryStrategy)
      .filter((strategy): strategy is VtStrategyLabItem => Boolean(strategy))
    const source = registryStrategies?.length
      ? registryStrategies
      : DEFAULT_STRATEGY_LAB
    return source.map((strategy) => ({
      ...strategy,
      state: strategyStates[strategy.id] ?? strategy.state,
    }))
  }, [data?.strategyRegistry?.strategies, strategyStates])
  const [selectedMapNodeId, setSelectedMapNodeId] = useState('cockpit')
  const [selectedCouncilWorkerId, setSelectedCouncilWorkerId] =
    useState('hermesmain')
  const [councilDraft, setCouncilDraft] = useState(
    'Fai un check VT Capital: ultime analisi, rischi principali, cosa monitorare ora. Solo observe-only.',
  )
  const [councilSendStatus, setCouncilSendStatus] = useState<string | null>(
    null,
  )
  const [councilSendError, setCouncilSendError] = useState<string | null>(null)
  const [councilReply, setCouncilReply] = useState<string | null>(null)
  const [councilSending, setCouncilSending] = useState(false)
  const [councilDispatching, setCouncilDispatching] = useState(false)
  const [councilDispatchResults, setCouncilDispatchResults] = useState<
    Array<CouncilDispatchResult>
  >([])

  async function load() {
    setError(null)
    try {
      const res = await fetch('/api/vt-capital', { cache: 'no-store' })
      const payload = (await res.json()) as VtPayload | { error?: string }
      if (!res.ok || !('ok' in payload) || !payload.ok)
        throw new Error(
          'error' in payload && payload.error
            ? payload.error
            : 'API VT Capital non disponibile',
        )
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    if (!autoRefresh) return undefined
    const timer = window.setInterval(
      () => void load(),
      refreshEverySeconds * 1000,
    )
    return () => window.clearInterval(timer)
  }, [autoRefresh, refreshEverySeconds])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        VT_SETTINGS_STORAGE_KEY,
        JSON.stringify({
          autoRefresh,
          refreshEverySeconds,
          showRawJson,
          denseMode,
        }),
      )
    } catch {
      // Preferenze locali best-effort: la dashboard resta read-only anche senza storage.
    }
  }, [autoRefresh, refreshEverySeconds, showRawJson, denseMode])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        VT_STRATEGIES_STORAGE_KEY,
        JSON.stringify(strategyStates),
      )
    } catch {
      // Stato strategie locale best-effort: nessuna execution dipende dal browser.
    }
  }, [strategyStates])

  const updateStrategyState = (id: string, state: VtStrategyState) => {
    const strategy = strategies.find((item) => item.id === id)
    if (state === 'paper' && strategy && !strategyCanPaper(strategy)) return
    setStrategyStates((current) => ({ ...current, [id]: state }))
  }

  const backtestByStrategyId = useMemo(() => {
    const entries = data?.backtestResults?.results ?? []
    return new Map(
      entries
        .map((entry) => [String(entry.strategy_id ?? ''), entry] as const)
        .filter(([id]) => id),
    )
  }, [data?.backtestResults?.results])

  const strategyCounts = useMemo(
    () => ({
      total: strategies.length,
      paper: strategies.filter((strategy) => strategy.state === 'paper').length,
      backtest: strategies.filter((strategy) => strategy.state === 'backtest')
        .length,
      ideas: strategies.filter((strategy) => strategy.state === 'idea').length,
    }),
    [strategies],
  )

  const activeWorkers = useMemo(
    () => data?.workers.filter(workerIsAvailable).length ?? 0,
    [data],
  )
  const latestCandidates = useMemo(() => {
    const candidates = data?.marketBias.latest?.candidates
    return Array.isArray(candidates) ? candidates : []
  }, [data])
  const latestCouncil = useMemo(() => {
    const timeline = data?.council.history?.timeline
    if (Array.isArray(timeline) && timeline.length > 0) return timeline
    return data?.council.recent.slice().reverse() ?? []
  }, [data])
  const performance = useMemo(() => {
    const portfolio = data?.portfolio
    const counts = data?.council.history?.counts ?? {}
    const paper = safeNumber(counts.PAPER)
    const watch = safeNumber(counts.WATCH)
    const discard = safeNumber(counts.DISCARD)
    const review = safeNumber(counts.REVIEW)
    const totalDecisions = paper + watch + discard + review
    const pnlPct = safeNumber(portfolio?.unrealizedPnlPct)
    const riskPct = safeNumber(portfolio?.riskToStopPct)
    const activeOrders = portfolio?.activeOrders.length ?? 0
    const openExposure = safeNumber(portfolio?.openExposure)
    const baseScore = 50 + Math.max(-25, Math.min(25, pnlPct * 2))
    const riskPenalty = Math.min(25, riskPct * 1.5)
    const decisionBonus =
      totalDecisions > 0 ? Math.min(15, paper * 4 + watch * 1.5) : 0
    const score = Math.max(
      0,
      Math.min(100, Math.round(baseScore - riskPenalty + decisionBonus)),
    )
    return {
      score,
      pnlPct,
      riskPct,
      activeOrders,
      openExposure,
      paper,
      watch,
      discard,
      review,
      totalDecisions,
      paperRate: totalDecisions > 0 ? (paper / totalDecisions) * 100 : null,
      label:
        activeOrders > 0
          ? 'demo sotto osservazione'
          : totalDecisions > 0
            ? 'solo segnali osservati'
            : 'storico insufficiente',
    }
  }, [data])
  const selectedCouncilWorker = useMemo(
    () =>
      data?.workers.find(
        (worker) => worker.workerId === selectedCouncilWorkerId,
      ) ??
      data?.workers[0] ??
      null,
    [data, selectedCouncilWorkerId],
  )
  const councilChatMessage = selectedCouncilWorker
    ? `[VT Capital / Concilium / ${selectedCouncilWorker.councilRole ?? selectedCouncilWorker.workerId}]\n${councilDraft}`
    : councilDraft
  const councilAvailableWorkers = useMemo(
    () => data?.workers.filter(workerIsAvailable) ?? [],
    [data],
  )
  const councilRoomPrompt = useMemo(() => {
    const roster = councilAvailableWorkers
      .map(
        (worker) =>
          `- ${worker.name ?? worker.workerId}: ${worker.councilRole ?? worker.shortRole ?? 'agente Concilium'}; skill ${(worker.skills ?? []).join(', ') || 'n/d'}`,
      )
      .join('\n')
    return `[VT Capital / Concilium / Council completo]\nModalità observe-only. Nessun ordine, nessuna execution.\n\nAgenti disponibili:\n${roster || '- nessun agente disponibile'}\n\nRichiesta:\n${councilDraft}\n\nOutput atteso: decisione WATCH/PAPER/DISCARD/REVIEW, trigger, invalidazione, rischio principale e disaccordo agenti.`
  }, [councilAvailableWorkers, councilDraft])
  const councilDispatchWorkers = useMemo(
    () => councilAvailableWorkers.filter((worker) => worker.chatAvailable),
    [councilAvailableWorkers],
  )

  function buildCouncilDispatchPrompt(worker: VtWorker): string {
    return `${councilRoomPrompt}\n\nTu sei: ${worker.name ?? worker.workerId} / ${worker.councilRole ?? worker.shortRole ?? 'agente Concilium'}.\nRispondi dal tuo ruolo, sintetico, con: stance, trigger, invalidazione, rischio principale, decisione proposta.`
  }

  async function sendCouncilPrompt() {
    if (!selectedCouncilWorker) return
    setCouncilSending(true)
    setCouncilSendStatus(null)
    setCouncilSendError(null)
    setCouncilReply(null)
    try {
      const response = await fetch('/api/swarm-direct-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: selectedCouncilWorker.workerId,
          prompt: councilChatMessage,
          limit: 30,
          timeoutMs: 120_000,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | DirectChatResponse
        | { error?: string }
        | null
      if (!response.ok || !payload || !('delivered' in payload)) {
        throw new Error(
          payload && 'error' in payload && payload.error
            ? payload.error
            : `swarm-direct-chat HTTP ${response.status}`,
        )
      }
      if (!payload.delivered) {
        throw new Error(payload.error ?? 'Prompt non consegnato')
      }
      const latestAssistant = payload.messages
        .slice()
        .reverse()
        .find((message) => message.role === 'assistant')
      setCouncilSendStatus(
        `Prompt inviato a ${selectedCouncilWorker.name ?? selectedCouncilWorker.workerId}`,
      )
      setCouncilReply(
        latestAssistant?.content ??
          'Prompt consegnato, risposta non ancora letta.',
      )
      await load()
    } catch (err) {
      setCouncilSendError(err instanceof Error ? err.message : String(err))
    } finally {
      setCouncilSending(false)
    }
  }

  async function dispatchCouncilPrompt() {
    const targets = councilDispatchWorkers
    if (targets.length === 0) {
      setCouncilSendError('Nessun agente Concilium con chat disponibile')
      return
    }
    setCouncilDispatching(true)
    setCouncilSendStatus(null)
    setCouncilSendError(null)
    setCouncilReply(null)
    setCouncilDispatchResults([])
    try {
      const results = await Promise.all(
        targets.map(async (worker): Promise<CouncilDispatchResult> => {
          const role =
            worker.councilRole ?? worker.shortRole ?? 'agente Concilium'
          try {
            const response = await fetch('/api/swarm-direct-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                workerId: worker.workerId,
                prompt: buildCouncilDispatchPrompt(worker),
                limit: 30,
                timeoutMs: 120_000,
              }),
            })
            const payload = (await response.json().catch(() => null)) as
              | DirectChatResponse
              | { error?: string }
              | null
            if (!response.ok || !payload || !('delivered' in payload)) {
              throw new Error(
                payload && 'error' in payload && payload.error
                  ? payload.error
                  : `swarm-direct-chat HTTP ${response.status}`,
              )
            }
            if (!payload.delivered) {
              throw new Error(payload.error ?? 'Prompt non consegnato')
            }
            const latestAssistant = payload.messages
              .slice()
              .reverse()
              .find((message) => message.role === 'assistant')
            return {
              workerId: worker.workerId,
              workerName: worker.name ?? worker.workerId,
              role,
              ok: true,
              status: 'risposta ricevuta',
              reply:
                latestAssistant?.content ??
                'Prompt consegnato, risposta non ancora letta.',
              error: null,
            }
          } catch (err) {
            return {
              workerId: worker.workerId,
              workerName: worker.name ?? worker.workerId,
              role,
              ok: false,
              status: 'errore',
              reply: '',
              error: err instanceof Error ? err.message : String(err),
            }
          }
        }),
      )
      setCouncilDispatchResults(results)
      const okCount = results.filter((result) => result.ok).length
      setCouncilSendStatus(
        `Dispatch council completato: ${okCount}/${results.length} agenti hanno risposto`,
      )
      if (okCount < results.length) {
        setCouncilSendError(
          'Alcuni agenti non hanno risposto: vedi risultati council',
        )
      }
      await load()
    } finally {
      setCouncilDispatching(false)
    }
  }

  const mapNodes = useMemo<Array<VtMapNode>>(() => {
    const workers = data?.workers ?? []
    const activeOrders = data?.guardian?.demoState.openOrders ?? 0
    const shadowEvents = data?.shadow?.eventCount ?? 0
    const councilRecords =
      data?.council.history?.total ?? data?.council.recent.length ?? 0
    return [
      {
        id: 'cockpit',
        title: 'VT Capital Cockpit',
        group: 'core',
        status: data ? 'online' : 'missing',
        summary: 'Dashboard operativa read-only dentro Hermes Workspace.',
        does: 'Unifica trading demo, portafoglio, Concilium, market bias, shadow audit e note vault.',
        input: '/api/vt-capital, JSONL locali, runtime profili Hermes.',
        output: 'Vista umana cliccabile, senza side effect di trading.',
        next: 'Aggiungere chat agenti più nativa e store analisi normalizzato.',
      },
      {
        id: 'plugin-api',
        title: 'API plugin /api/vt-capital',
        group: 'core',
        status: data?.ok ? 'online' : 'missing',
        summary: 'Read-model stabile per la dashboard.',
        does: 'Legge code, stato demo guardian, audit shadow, storico council e profili worker.',
        input: 'File VT Capital + Hermes Vault + profili Hermes Workspace.',
        output: 'Payload JSON compatto per il cockpit.',
        next: 'Separare endpoint /map, /agents e /analyses quando il sistema cresce.',
      },
      {
        id: 'strategy-lab',
        title: 'Strategy Lab',
        group: 'strategy',
        status: strategyCounts.total > 0 ? 'observe' : 'missing',
        summary: `${strategyCounts.paper} paper · ${strategyCounts.backtest} backtest · ${strategyCounts.ideas} idee.`,
        does: 'Crea strategie, controlla backtest e abilita solo paper/observe.',
        input: 'Market bias, storico council, regole risk, backtest futuri.',
        output: 'Catalogo strategie con stato sicuro e prossime azioni.',
        next: 'Collegare runner backtest reale e registry persistente backend.',
      },
      {
        id: 'demo-guardian',
        title: 'demo_guardian_intraday',
        group: 'strategy',
        status: activeOrders > 0 ? 'demo' : 'observe',
        summary: `${activeOrders} ordini demo aperti, live sempre bloccato.`,
        does: 'Crea/traccia micro ordini demo intraday con scope e risk gate.',
        input: 'Loop guardian, broker demo/fake, queue order.executed.',
        output: 'Ordini demo osservabili e portfolio mark-to-market.',
        next: 'Collegare meglio ogni ordine alla decisione Concilium che lo ha motivato.',
      },
      {
        id: 'shadow-runtime',
        title: 'Shadow observe-only',
        group: 'strategy',
        status: shadowEvents > 0 ? 'observe' : 'missing',
        summary: `${shadowEvents} eventi audit shadow, nessun broker live.`,
        does: 'Esegue tick di osservazione isolati per verificare runtime e policy senza ordini.',
        input: 'Cron Hermes shadow ogni 30 minuti.',
        output: 'Audit JSONL agents-vt-capital-shadow.',
        next: 'Mostrare drift, errori e trend salute negli ultimi giorni.',
      },
      {
        id: 'hourly-bias',
        title: 'Hourly crypto bias',
        group: 'strategy',
        status: data?.marketBias.fileExists ? 'online' : 'missing',
        summary: 'Pre-analisi BTC/ETH/SOL 1h e candidati council.',
        does: 'Calcola bias tecnico e filtra candidati prima del Concilium.',
        input: 'Dati mercato crypto e script Python schedulato.',
        output: 'crypto-hourly-bias.jsonl + council_candidates.',
        next: 'Aggiungere spiegazione visuale dei motivi tecnici per ogni asset.',
      },
      {
        id: 'council-store',
        title: 'Storico Concilium',
        group: 'queue',
        status: councilRecords > 0 ? 'online' : 'missing',
        summary: `${councilRecords} decisioni/precheck leggibili.`,
        does: 'Conserva WATCH/PAPER/DISCARD/REVIEW con trigger, invalidazione e rischio.',
        input: 'Precheck deterministico e analisi agenti.',
        output: 'Timeline decisionale dentro la tab Concilium.',
        next: 'Normalizzare stance per agente, non solo decisione aggregata.',
      },
      ...workers.map(
        (worker): VtMapNode => ({
          id: `agent-${worker.workerId}`,
          title: `${worker.emoji ?? '🤖'} ${worker.name ?? worker.workerId}`,
          group: 'agent',
          status: workerIsAvailable(worker) ? 'online' : 'missing',
          summary: worker.councilRole ?? worker.shortRole ?? 'Agente Concilium',
          does: worker.shortRole ?? 'Partecipa al council operativo.',
          input: 'Prompt Valerio, storico chat, dati VT Capital read-only.',
          output: worker.latestAnalysis
            ? 'Ultima analisi disponibile in dashboard.'
            : 'Profilo agente pronto, nessuna analisi recente letta.',
          next: worker.chatAvailable
            ? 'Usare Apri chat/Copia prompt nella tab Concilium.'
            : 'Verificare sessione chat del profilo.',
        }),
      ),
      {
        id: 'missing-chat',
        title: 'Chat swarm nativa',
        group: 'missing',
        status: 'observe',
        summary:
          'Invio reale al singolo agente e dispatch council multi-agente attivi nella tab Concilium.',
        does: 'Permette chat observe-only via swarm-direct-chat, senza toccare broker o execution.',
        input: 'Selezione agente o council completo + prompt contestuale.',
        output:
          'Risposte agenti mostrate nel cockpit e storico chat profili aggiornato.',
        next: 'Collegare le risposte aggregate a una decisione Concilium normalizzata.',
      },
      {
        id: 'performance-board',
        title: 'Performance board',
        group: 'queue',
        status: data?.portfolio || councilRecords > 0 ? 'observe' : 'missing',
        summary: `Score ${performance.score}/100 · ${performance.label}.`,
        does: 'Trasforma portafoglio demo e decisioni Concilium in metriche leggibili.',
        input:
          'Ordini demo aperti, PnL mark-to-market, rischio a stop, counts council.',
        output: 'Score provvisorio, PnL, rischio, PAPER rate e prossimi gap.',
        next: 'Aggiungere storico chiuso: win-rate, expectancy e drawdown reale per strategy_id.',
      },
    ]
  }, [data, performance, strategyCounts])
  const selectedMapNode =
    mapNodes.find((node) => node.id === selectedMapNodeId) ?? mapNodes[0]
  const selectedMapWorker =
    selectedMapNode.group === 'agent'
      ? (data?.workers.find(
          (worker) => `agent-${worker.workerId}` === selectedMapNode.id,
        ) ?? null)
      : null

  if (loading)
    return (
      <div className="flex h-full items-center justify-center text-muted">
        Carico VT Capital…
      </div>
    )
  if (error)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <h1
          className="text-xl font-semibold"
          style={{ color: 'var(--theme-danger)' }}
        >
          VT Capital non caricato
        </h1>
        <p className="max-w-xl text-sm text-muted">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg px-4 py-2 text-sm font-semibold transition-transform hover:scale-[1.02]"
          style={{
            background: 'var(--theme-accent)',
            color: 'var(--theme-on-accent, white)',
          }}
        >
          Riprova
        </button>
      </div>
    )
  if (!data) return null
  const portfolio = data.portfolio

  return (
    <div
      data-plugin-surface="vt-capital"
      className="min-h-full p-4 pb-28 pt-14 md:p-6 md:pb-28 lg:p-10 lg:pb-28"
      style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:gap-5">
        <header
          className="relative overflow-hidden rounded-xl border p-5"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--theme-card) 96%, var(--theme-accent)), var(--theme-card))',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, var(--theme-accent), var(--theme-accent-secondary), transparent)',
            }}
          />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border text-xl"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--theme-accent) 35%, var(--theme-border))',
                  background:
                    'linear-gradient(135deg, color-mix(in srgb, var(--theme-accent) 14%, var(--theme-card)), var(--theme-card))',
                  boxShadow:
                    '0 0 0 4px color-mix(in srgb, var(--theme-accent) 6%, transparent)',
                }}
              >
                ◈
              </span>
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Plugin VT Capital
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  VT Capital Cockpit
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted">
                  Bias crypto BTC/ETH/SOL, council/precheck, worker Swarm e note
                  vault in una superficie isolata dal resto della dashboard.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span
                className="rounded-full border px-3 py-1 font-medium"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--theme-success) 40%, var(--theme-border))',
                  background:
                    'color-mix(in srgb, var(--theme-success) 10%, transparent)',
                  color: 'var(--theme-success)',
                }}
              >
                {modeLabel(data.plugin.mode)}
              </span>
              <span
                className="rounded-full border px-3 py-1 font-medium"
                style={{
                  borderColor: data.plugin.executionEnabled
                    ? 'color-mix(in srgb, var(--theme-warning) 45%, var(--theme-border))'
                    : 'color-mix(in srgb, var(--theme-danger) 40%, var(--theme-border))',
                  background: data.plugin.executionEnabled
                    ? 'color-mix(in srgb, var(--theme-warning) 10%, transparent)'
                    : 'color-mix(in srgb, var(--theme-danger) 10%, transparent)',
                  color: data.plugin.executionEnabled
                    ? 'var(--theme-warning)'
                    : 'var(--theme-danger)',
                }}
              >
                {executionLabel(data.plugin.executionEnabled)}
              </span>
              <span
                className="rounded-full border px-3 py-1 text-muted"
                style={{
                  borderColor: 'var(--theme-border)',
                  background: 'var(--theme-card2)',
                }}
              >
                Scope: solo plugin
              </span>
              <span
                className="rounded-full border px-3 py-1 text-muted"
                style={{
                  borderColor: 'var(--theme-border)',
                  background: 'var(--theme-card2)',
                }}
              >
                v{data.plugin.version}
              </span>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric
            label="Market bias file"
            value={data.marketBias.fileExists ? 'online' : 'missing'}
            tone={data.marketBias.fileExists ? 'good' : 'warn'}
          />
          <Metric
            label="Council precheck"
            value={
              data.council.fileExists
                ? `${data.council.recent.length} record`
                : 'missing'
            }
            tone={data.council.fileExists ? 'good' : 'warn'}
          />
          <Metric
            label="Worker runtime"
            value={`${activeWorkers}/${data.workers.length}`}
            tone={activeWorkers > 0 ? 'good' : 'warn'}
          />
          <Metric label="Ultimo refresh" value={formatTime(data.checkedAt)} />
        </div>

        <nav
          className="grid gap-2 rounded-xl border p-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
          style={{
            background: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
          aria-label="Sezioni VT Capital"
        >
          {VT_TABS.map((tab) => {
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                data-vt-tab-card="true"
                onClick={() => setActiveTab(tab.id)}
                className="group min-h-[86px] rounded-xl border p-3 text-left transition-transform hover:-translate-y-0.5"
                style={{
                  borderColor: selected
                    ? 'var(--theme-accent-border)'
                    : 'var(--theme-border)',
                  background: selected
                    ? 'linear-gradient(135deg, var(--theme-accent-subtle), var(--theme-card2))'
                    : 'var(--theme-card2)',
                  color: selected ? 'var(--theme-accent)' : 'var(--theme-text)',
                  boxShadow: selected
                    ? '0 0 0 1px color-mix(in srgb, var(--theme-accent) 20%, transparent)'
                    : 'none',
                }}
                title={tab.description}
              >
                <span className="flex items-start gap-2">
                  <span
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border text-base"
                    style={{
                      borderColor: selected
                        ? 'var(--theme-accent-border)'
                        : 'var(--theme-border)',
                      background: selected
                        ? 'color-mix(in srgb, var(--theme-accent) 12%, transparent)'
                        : 'var(--theme-card)',
                    }}
                    aria-hidden
                  >
                    {tab.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">
                      {tab.label}
                    </span>
                    <span className="mt-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                      {tab.short}
                    </span>
                  </span>
                </span>
                <span className="mt-2 block text-[11px] leading-snug text-muted">
                  {tab.description}
                </span>
              </button>
            )
          })}
        </nav>

        {activeTab === 'mappa' ? (
          <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <Card
              title="Mappa interattiva progetto"
              right={
                <span className="text-xs text-muted">
                  componenti, agenti, strategie e mancanze
                </span>
              }
              accent="var(--theme-accent-secondary)"
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <Metric
                  label="Live trading"
                  value={data.guardian?.liveBlocked ? 'bloccato' : 'verifica'}
                  tone={data.guardian?.liveBlocked ? 'good' : 'warn'}
                />
                <Metric
                  label="Execution flag"
                  value={data.plugin.executionEnabled ? 'on' : 'off'}
                  tone={data.plugin.executionEnabled ? 'warn' : 'good'}
                />
                <Metric
                  label="Ordini demo"
                  value={data.guardian?.demoState.openOrders ?? 0}
                  tone={
                    (data.guardian?.demoState.openOrders ?? 0) > 0
                      ? 'warn'
                      : 'good'
                  }
                />
                <Metric
                  label="Agenti"
                  value={`${activeWorkers}/${data.workers.length}`}
                  tone={activeWorkers > 0 ? 'good' : 'warn'}
                />
              </div>
              {(['core', 'strategy', 'agent', 'queue', 'missing'] as const).map(
                (group) => (
                  <div key={group} className="mb-4">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {mapGroupLabel(group)}
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {mapNodes
                        .filter((node) => node.group === group)
                        .map((node) => {
                          const selected = selectedMapNode.id === node.id
                          return (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => setSelectedMapNodeId(node.id)}
                              className="rounded-xl border p-3 text-left transition-transform hover:scale-[1.01]"
                              style={{
                                background: selected
                                  ? 'var(--theme-accent-subtle)'
                                  : 'var(--theme-card2)',
                                borderColor: selected
                                  ? 'var(--theme-accent-border)'
                                  : 'var(--theme-border)',
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-semibold text-ink">
                                  {node.title}
                                </div>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] ${mapStatusClass(node.status)}`}
                                >
                                  {node.status}
                                </span>
                              </div>
                              <div className="mt-2 line-clamp-2 text-xs text-muted">
                                {node.summary}
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  </div>
                ),
              )}
            </Card>

            <Card title="Dettaglio componente" accent="var(--theme-success)">
              <div className="space-y-4">
                <div>
                  <div className="text-xl font-bold text-ink">
                    {selectedMapNode.title}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${mapStatusClass(selectedMapNode.status)}`}
                    >
                      {selectedMapNode.status}
                    </span>
                    <span
                      className="rounded-full border px-2 py-1 text-xs text-muted"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      {mapGroupLabel(selectedMapNode.group)}
                    </span>
                  </div>
                </div>
                {[
                  ['Cosa fa', selectedMapNode.does],
                  ['Input', selectedMapNode.input],
                  ['Output', selectedMapNode.output],
                  ['Prossimo miglioramento', selectedMapNode.next],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border p-3"
                    style={{
                      background: 'var(--theme-card2)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {label}
                    </div>
                    <div className="mt-1 text-sm text-ink">{value}</div>
                  </div>
                ))}
                {selectedMapWorker ? (
                  <div
                    className="rounded-lg border p-3"
                    style={{
                      background: 'var(--theme-card2)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Skill agente
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(selectedMapWorker.skills ?? []).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border px-2 py-1 text-xs text-muted"
                          style={{ borderColor: 'var(--theme-border)' }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Ultima analisi mappa
                    </div>
                    <p className="mt-1 line-clamp-5 text-sm text-ink">
                      {selectedMapWorker.latestAnalysis ??
                        'Nessuna analisi recente letta da questo profilo.'}
                    </p>
                    <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Ultimi messaggi mappa
                    </div>
                    <div className="mt-1 flex max-h-32 flex-col gap-1 overflow-auto text-xs text-muted">
                      {(selectedMapWorker.recentMessages ?? []).length > 0 ? (
                        selectedMapWorker.recentMessages?.map((message) => (
                          <div key={message.id} className="line-clamp-2">
                            {message.role}: {message.content}
                          </div>
                        ))
                      ) : (
                        <div>Nessun messaggio recente disponibile.</div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={selectedMapWorker.chatUrl ?? '/chat/main'}
                        className="rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{
                          background: 'var(--theme-accent)',
                          color: 'var(--theme-on-accent, white)',
                        }}
                      >
                        Apri chat da mappa
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(
                            selectedMapWorker.chatPrompt ?? councilDraft,
                          )
                        }}
                        className="rounded-lg border px-3 py-2 text-xs font-semibold text-muted"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        Copia prompt da mappa
                      </button>
                    </div>
                  </div>
                ) : null}
                <div
                  className="rounded-lg border p-3 text-xs text-muted"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  Regola sicurezza: questa mappa è read-only. Chat e ordini
                  restano separati dal motore di esecuzione.
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'trading' ? (
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            {data.guardian ? (
              <Card
                title="Guardian / OMS"
                accent="var(--theme-danger)"
                right={
                  <span className="text-xs text-muted">
                    {data.guardian.requireOrderScope
                      ? 'require_order_scope attivo'
                      : 'scope legacy'}
                  </span>
                }
              >
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Safety Gates
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <SafetyPill
                    label="Observe-only confermato"
                    safe={!data.plugin.executionEnabled}
                  />
                  <SafetyPill
                    label="Live bloccato"
                    safe={data.guardian.liveBlocked}
                  />
                  <SafetyPill
                    label="Broker non fornito"
                    safe={!data.shadow?.brokerSupplied}
                  />
                  <SafetyPill
                    label="Namespace shadow separato"
                    safe={data.shadow?.namespace === 'agents-vt-capital-shadow'}
                  />
                </div>
                <div className="grid gap-3 lg:grid-cols-4">
                  <Metric
                    label="Modalità executor"
                    value={data.guardian.executionMode.replaceAll('_', ' ')}
                    tone={data.guardian.executionEnabled ? 'warn' : 'good'}
                  />
                  <Metric
                    label="Live trading"
                    value={data.guardian.liveBlocked ? 'bloccato' : 'aperto'}
                    tone={data.guardian.liveBlocked ? 'good' : 'warn'}
                  />
                  <Metric
                    label="Ordini aperti demo"
                    value={data.guardian.demoState.openOrders}
                    tone={
                      data.guardian.demoState.openOrders > 0 ? 'warn' : 'good'
                    }
                  />
                  <Metric
                    label="Ordini tracciati"
                    value={data.guardian.demoState.trackedOrders}
                  />
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <MiniEvent
                    label="Ultimo risk.check"
                    event={data.guardian.lastRiskCheck}
                  />
                  <MiniEvent
                    label="Ultimo order.proposed"
                    event={data.guardian.lastOrderProposed}
                  />
                  <MiniEvent
                    label="Ultimo order.executed"
                    event={data.guardian.lastOrderExecuted}
                  />
                </div>
                {data.guardian.recentBlocks.length > 0 ? (
                  <div
                    className="mt-4 rounded-lg border p-3"
                    style={{
                      background: 'var(--theme-card2)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Blocchi recenti
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {data.guardian.recentBlocks.map((block, index) => (
                        <span
                          key={index}
                          className="rounded-full border px-2 py-1"
                          style={{
                            borderColor:
                              'color-mix(in srgb, var(--theme-danger) 35%, var(--theme-border))',
                            background:
                              'color-mix(in srgb, var(--theme-danger) 10%, transparent)',
                            color: 'var(--theme-danger)',
                          }}
                        >
                          {String(
                            block.reason_code ?? block.reason ?? 'BLOCKED',
                          )}
                          {block.symbol ? ` · ${String(block.symbol)}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Card>
            ) : null}

            <Card title="Shadow audit" accent="var(--theme-warning)">
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric
                  label="Eventi shadow"
                  value={
                    data.shadow?.fileExists
                      ? `${data.shadow.eventCount} eventi`
                      : 'missing'
                  }
                  tone={data.shadow?.fileExists ? 'good' : 'warn'}
                />
                <Metric
                  label="Ultimo evento"
                  value={data.shadow?.lastEventType ?? '—'}
                />
                <Metric
                  label="Ultimo tick"
                  value={formatIsoTime(data.shadow?.lastTimestamp)}
                />
                <Metric
                  label="Execution shadow"
                  value={data.shadow?.executionEnabled ? 'attiva' : 'spenta'}
                  tone={data.shadow?.executionEnabled ? 'warn' : 'good'}
                />
              </div>
              <div
                className="mt-4 rounded-lg border p-3 text-xs text-muted"
                style={{
                  background: 'var(--theme-card2)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                Namespace: {data.shadow?.namespace ?? '—'} · mode:{' '}
                {data.shadow?.mode ?? '—'} · broker{' '}
                {data.shadow?.brokerSupplied ? 'fornito' : 'non fornito'}
              </div>
              {showRawJson ? (
                <pre
                  className="mt-3 max-h-72 overflow-auto rounded-lg border p-3 text-xs text-muted"
                  style={{
                    background: 'var(--theme-card2)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  {compactJson(data.shadow?.recent ?? [])}
                </pre>
              ) : null}
            </Card>
          </div>
        ) : null}
        {activeTab === 'strategie' ? (
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Card
              title="Strategy Lab"
              right={
                <span className="text-xs text-muted">
                  abilita solo observe/paper
                </span>
              }
              accent="var(--theme-success)"
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <Metric
                  label="Registry"
                  value={data.strategyRegistry?.fileExists ? 'file' : 'mock'}
                />
                <Metric label="Strategie" value={strategyCounts.total} />
                <Metric
                  label="Paper"
                  value={strategyCounts.paper}
                  tone="good"
                />
                <Metric
                  label="Backtest"
                  value={strategyCounts.backtest}
                  tone="warn"
                />
                <Metric label="Idee" value={strategyCounts.ideas} />
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <Metric
                  label="Backtest file"
                  value={
                    data.backtestResults?.fileExists ? 'presente' : 'manca'
                  }
                  tone={data.backtestResults?.fileExists ? 'good' : 'warn'}
                />
                <Metric
                  label="Runner"
                  value={data.backtestResults?.mode ?? 'observe_only'}
                />
                <Metric
                  label="Ultimo run"
                  value={
                    data.backtestResults?.updatedAt
                      ? formatTime(data.backtestResults.updatedAt)
                      : '—'
                  }
                />
              </div>
              <div className="grid gap-3">
                {strategies.map((strategy) => {
                  const canPaper = strategyCanPaper(strategy)
                  const backtest = backtestByStrategyId.get(strategy.id)
                  const coverage = backtest?.coverage as
                    | Record<string, unknown>
                    | undefined
                  const simulation = backtest?.simulation as
                    | Record<string, unknown>
                    | undefined
                  return (
                    <div
                      key={strategy.id}
                      className="rounded-xl border p-3"
                      style={{
                        background: 'var(--theme-card2)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-base font-semibold text-ink">
                            <span>{strategy.icon}</span>
                            <span>{strategy.name}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted">
                            {strategy.book} · {strategy.horizon} ·{' '}
                            {strategy.timeframes}
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${stateClass(strategy.state === 'paper' ? 'idle' : strategy.state === 'backtest' ? 'thinking' : strategy.state === 'disabled' ? 'blocked' : undefined)}`}
                        >
                          {strategyStateLabel(strategy.state)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted">
                        {strategy.description}
                      </p>
                      <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2 lg:grid-cols-4">
                        <span>Target: {strategy.book}</span>
                        <span>backtest: {strategy.backtestStatus}</span>
                        <span>asset: {strategy.sample}</span>
                        <span>tf: {strategy.timeframes}</span>
                        <span>
                          dati: {strategy.dataSource ?? strategy.dataNeed}
                        </span>
                        <span>
                          coverage:{' '}
                          {coverage
                            ? `${String(coverage.ok ?? 0)}/${String(coverage.total ?? 0)} ok`
                            : 'non lanciato'}
                        </span>
                        <span>runner: {String(backtest?.status ?? '—')}</span>
                        <span>
                          trade:{' '}
                          {simulation
                            ? `${String(simulation.trades ?? 0)} · ${String(simulation.status ?? '—')}`
                            : '—'}
                        </span>
                        <span>
                          expectancy:{' '}
                          {simulation?.avg_expectancy_pct === null ||
                          simulation?.avg_expectancy_pct === undefined
                            ? '—'
                            : `${String(simulation.avg_expectancy_pct)}%`}
                        </span>
                        <span>
                          costi:{' '}
                          {simulation?.cost_bps_roundtrip
                            ? `${String(simulation.cost_bps_roundtrip)} bps rt`
                            : '—'}
                        </span>
                        <span>{strategy.guardrail}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateStrategyState(strategy.id, 'idea')
                          }
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-muted"
                          style={{ borderColor: 'var(--theme-border)' }}
                        >
                          Idea
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateStrategyState(strategy.id, 'backtest')
                          }
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-muted"
                          style={{ borderColor: 'var(--theme-border)' }}
                        >
                          Backtest
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateStrategyState(strategy.id, 'paper')
                          }
                          disabled={!canPaper}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                          style={{
                            borderColor:
                              'color-mix(in srgb, var(--theme-success) 50%, var(--theme-border))',
                            color: 'var(--theme-success)',
                          }}
                        >
                          Paper observe
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateStrategyState(strategy.id, 'disabled')
                          }
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                          style={{
                            borderColor:
                              'color-mix(in srgb, var(--theme-danger) 45%, var(--theme-border))',
                            color: 'var(--theme-danger)',
                          }}
                        >
                          Disabilita
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <div className="grid gap-5">
              <Card title="Pipeline strategia" accent="var(--theme-warning)">
                <div className="space-y-3 text-sm text-muted">
                  {[
                    [
                      '1',
                      'Research',
                      'Mercato, regime, pattern e ipotesi nuove.',
                    ],
                    ['2', 'Crea', 'Regole ingresso/uscita + book + orizzonte.'],
                    [
                      '3',
                      'Backtest',
                      'Storico, costi, slippage, drawdown, expectancy.',
                    ],
                    [
                      '4',
                      'Concilium',
                      'Bull/bear/risk reviewer validano il setup.',
                    ],
                    [
                      '5',
                      'Paper',
                      'Solo observe/paper con audit e stop chiaro.',
                    ],
                    ['6', 'Gate', 'Demo/live solo con checklist separata.'],
                  ].map(([step, title, text]) => (
                    <div
                      key={step}
                      className="flex gap-3 rounded-lg border p-3"
                      style={{
                        background: 'var(--theme-card2)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                        style={{
                          borderColor: 'var(--theme-accent-border)',
                          color: 'var(--theme-accent)',
                        }}
                      >
                        {step}
                      </div>
                      <div>
                        <div className="font-semibold text-ink">{title}</div>
                        <div className="text-xs text-muted">{text}</div>
                      </div>
                    </div>
                  ))}
                  <div
                    className="rounded-lg border p-3 text-xs"
                    style={{
                      borderColor:
                        'color-mix(in srgb, var(--theme-danger) 45%, var(--theme-border))',
                      color: 'var(--theme-danger)',
                      background:
                        'color-mix(in srgb, var(--theme-danger) 8%, transparent)',
                    }}
                  >
                    Questi pulsanti salvano solo lo stato locale del cockpit.
                    Non chiamano broker, non cambiano feature flag backend, non
                    abilitano live trading.
                  </div>
                </div>
              </Card>

              <Card title="🔎 AutoResearch" accent="var(--theme-accent)">
                <div className="grid gap-3 text-sm text-muted">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Metric
                      label="Stato"
                      value={data.autoresearch?.enabled ? 'ON' : 'OFF sicuro'}
                      tone={data.autoresearch?.enabled ? 'warn' : 'good'}
                    />
                    <Metric
                      label="Modo"
                      value={data.autoresearch?.mode ?? 'observe_only'}
                    />
                    <Metric
                      label="Agenti"
                      value={data.autoresearch?.agents.length ?? 0}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div
                      className="rounded-lg border p-3"
                      style={{
                        background: 'var(--theme-card2)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Ispirazione
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-muted">
                        {(data.autoresearch?.inspirations ?? []).map((item) => (
                          <div key={String(item.name ?? item.repo)}>
                            <span className="font-semibold text-ink">
                              {String(item.name ?? 'research pattern')}
                            </span>
                            {item.repo ? ` · ${String(item.repo)}` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div
                      className="rounded-lg border p-3"
                      style={{
                        background: 'var(--theme-card2)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Factory
                      </div>
                      <div className="mt-2 text-xs text-muted">
                        {(data.autoresearch?.workflow ?? [])
                          .slice(0, 8)
                          .join(' → ')}
                      </div>
                      <div className="mt-2 text-xs text-muted">
                        Topic:{' '}
                        {(data.autoresearch?.researchTopics ?? [])
                          .slice(0, 4)
                          .join(', ') || 'da configurare'}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full border px-2 py-0.5">
                          demo{' '}
                          {data.autoresearch?.demoTradingEnabled ? 'on' : 'off'}
                        </span>
                        <span className="rounded-full border px-2 py-0.5">
                          live{' '}
                          {data.autoresearch?.liveTradingEnabled ? 'on' : 'off'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {(data.autoresearch?.agents ?? []).map((agent) => (
                      <div
                        key={String(agent.id ?? agent.name)}
                        className="rounded-lg border p-3"
                        style={{
                          background: 'var(--theme-card2)',
                          borderColor: 'var(--theme-border)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-ink">
                            {String(agent.name ?? agent.id ?? 'Agente ricerca')}
                          </div>
                          <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase">
                            {String(agent.status ?? 'planned')}
                          </span>
                        </div>
                        <div className="mt-1 text-xs">
                          {String(agent.role ?? 'Ruolo non definito')}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted">
                    Flusso sicuro: research online → bozza strategia Python →
                    backtest + walk-forward → Concilium → paper observe. Non
                    abilita live trading e non chiama broker.
                  </div>
                </div>
              </Card>

              <Card
                title="📦 Dati backtest"
                accent="var(--theme-accent-secondary)"
              >
                <div className="grid gap-3 text-sm text-muted">
                  <Metric
                    label="Fonte attuale"
                    value={data.backtestData?.source ?? 'CoinGecko free'}
                  />
                  <Metric
                    label="Output locale"
                    value={
                      data.backtestData?.outputDir ?? 'data/desks/desk-a-swing'
                    }
                  />
                  <Metric
                    label="File dati"
                    value={data.backtestData?.fileCount ?? 0}
                  />
                  <Metric
                    label="Prossima fonte"
                    value={data.backtestData?.nextSource ?? 'Bybit/CCXT OHLCV'}
                  />
                  <div className="text-xs text-muted">
                    Fetcher:{' '}
                    {data.backtestData?.fetcher ?? 'vt_capital.fetch_candles'}.
                    Oggi{' '}
                    {(data.backtestData?.symbols ?? ['BTC', 'ETH', 'SOL']).join(
                      '/',
                    )}{' '}
                    da {data.backtestData?.configPath ?? 'config/firm.yaml'}.{' '}
                    {data.backtestData?.limitation ??
                      'Volume CoinGecko OHLC = 0; per backtest seri serve poi Bybit/CCXT OHLCV.'}
                  </div>
                  {data.backtestData && data.backtestData.files.length ? (
                    <div className="text-xs text-muted">
                      File: {data.backtestData.files.slice(0, 6).join(', ')}
                    </div>
                  ) : null}
                </div>
              </Card>
            </div>
          </div>
        ) : null}

        {activeTab === 'log-strategie' ? (
          <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
            <Card title="Log strategie" accent="var(--theme-accent)">
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric
                  label="File log"
                  value={
                    data.strategyTestLogs?.fileExists ? 'presente' : 'manca'
                  }
                  tone={data.strategyTestLogs?.fileExists ? 'good' : 'warn'}
                />
                <Metric
                  label="Test salvati"
                  value={data.strategyTestLogs?.eventCount ?? 0}
                />
                <Metric
                  label="Concilium WATCH"
                  value={data.strategyTestLogs?.byConcilium?.WATCH ?? 0}
                  tone={
                    (data.strategyTestLogs?.byConcilium?.WATCH ?? 0) > 0
                      ? 'good'
                      : 'neutral'
                  }
                />
                <Metric
                  label="Ultimo log"
                  value={
                    data.strategyTestLogs?.updatedAt
                      ? formatTime(data.strategyTestLogs.updatedAt)
                      : '—'
                  }
                />
              </div>
              <div className="mt-4 rounded-xl border p-3 text-sm text-muted">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-ink">Forward Queue</div>
                    <div className="text-xs">
                      Observe-only: candidati che hanno passato risk gate e
                      Concilium.
                    </div>
                  </div>
                  <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase">
                    {data.forwardTestQueue?.activeCount ?? 0} attivi
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <Metric
                    label="Queue file"
                    value={
                      data.forwardTestQueue?.fileExists ? 'presente' : 'manca'
                    }
                    tone={data.forwardTestQueue?.fileExists ? 'good' : 'warn'}
                  />
                  <Metric
                    label="Eventi queue"
                    value={data.forwardTestQueue?.logEventCount ?? 0}
                  />
                  <Metric
                    label="Safety"
                    value={
                      data.forwardTestQueue?.safety?.executionEnabled
                        ? 'execution on'
                        : 'observe only'
                    }
                    tone={
                      data.forwardTestQueue?.safety?.executionEnabled
                        ? 'bad'
                        : 'good'
                    }
                  />
                </div>
                <div className="mt-3 space-y-2">
                  {(data.forwardTestQueue?.active ?? []).length ? (
                    (data.forwardTestQueue?.active ?? []).map(
                      (candidate, candidateIndex) => {
                        const review = asRecord(candidate.concilium_review)
                        const riskGate = asRecord(candidate.risk_gate)
                        return (
                          <div
                            key={`${String(candidate.candidate_key ?? 'candidate')}-${candidateIndex}`}
                            className="rounded-lg border p-3"
                            style={{
                              background: 'var(--theme-card2)',
                              borderColor: 'var(--theme-border)',
                            }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-semibold text-ink">
                                {String(
                                  candidate.strategy_name ??
                                    candidate.strategy_id ??
                                    'strategia',
                                )}{' '}
                                · {String(candidate.symbol ?? 'asset')}{' '}
                                {String(candidate.timeframe ?? 'tf')}
                              </div>
                              <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase">
                                {String(candidate.status ?? 'queued')}
                              </span>
                            </div>
                            <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                              <span>
                                logic: {String(candidate.logic ?? '—')}
                              </span>
                              <span>
                                score: {formatPct(Number(candidate.score_pct))}
                              </span>
                              <span>
                                sample: {String(candidate.sample ?? '—')}
                              </span>
                              <span>
                                drawdown:{' '}
                                {formatPct(Number(candidate.max_drawdown_pct))}
                              </span>
                              <span>
                                Concilium:{' '}
                                {String(review?.recommendation ?? '—')} ·{' '}
                                {String(review?.reason_code ?? '—')}
                              </span>
                              <span>
                                risk gate: {String(riskGate?.status ?? '—')}
                              </span>
                            </div>
                            <div className="mt-2 text-[11px] text-muted">
                              reason: {String(candidate.queue_reason ?? '—')} ·
                              params: {compactJson(candidate.params ?? {})} ·
                              broker off · paper_promoted=false
                            </div>
                          </div>
                        )
                      },
                    )
                  ) : (
                    <div className="rounded-lg border p-3 text-xs">
                      Nessun candidato in forward observe. Serve WATCH + risk
                      gate pass.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 rounded-xl border p-3 text-sm text-muted">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-ink">Forward Performance</div>
                    <div className="text-xs">
                      Replay observe-only sui candidati in queue: misura cosa avrebbe fatto, senza ordini.
                    </div>
                  </div>
                  <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase">
                    {data.forwardPerformance?.observedCount ?? 0} osservati
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <Metric
                    label="Perf file"
                    value={data.forwardPerformance?.fileExists ? 'presente' : 'manca'}
                    tone={data.forwardPerformance?.fileExists ? 'good' : 'warn'}
                  />
                  <Metric
                    label="Eventi perf"
                    value={data.forwardPerformance?.logEventCount ?? 0}
                  />
                  <Metric
                    label="Safety perf"
                    value={
                      data.forwardPerformance?.safety?.brokerCallsAllowed
                        ? 'broker on'
                        : 'broker off'
                    }
                    tone={
                      data.forwardPerformance?.safety?.brokerCallsAllowed
                        ? 'bad'
                        : 'good'
                    }
                  />
                </div>
                <div className="mt-3 rounded-lg border p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-ink">Storico forward + gate manuale</div>
                    <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase">
                      {Number(data.forwardPerformance?.forwardHistory?.eligible_count ?? 0)} eligible
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 sm:grid-cols-3">
                    <span>
                      candidati: {String(data.forwardPerformance?.forwardHistory?.candidate_count ?? 0)}
                    </span>
                    <span>
                      min obs:{' '}
                      {String(data.forwardPerformance?.forwardHistory?.thresholds?.min_observations ?? 3)}
                    </span>
                    <span>
                      max DD:{' '}
                      {formatPct(Number(data.forwardPerformance?.forwardHistory?.thresholds?.max_drawdown_pct ?? 10))}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {(data.forwardPerformance?.forwardHistory?.candidates ?? []).length ? (
                      (data.forwardPerformance?.forwardHistory?.candidates ?? []).slice(0, 4).map((candidate, index) => {
                        const manualGate = asRecord(candidate.manual_gate)
                        const avgScore = Number(candidate.average_score_pct)
                        const worstDrawdown = Number(candidate.worst_drawdown_pct)
                        return (
                          <div
                            key={`${String(candidate.candidate_key ?? 'forward-history')}-${index}`}
                            className="rounded-md border px-2 py-1"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-ink">
                                {String(candidate.strategy_name ?? candidate.strategy_id ?? 'strategia')} ·{' '}
                                {String(candidate.symbol ?? 'asset')} {String(candidate.timeframe ?? 'tf')}
                              </span>
                              <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase">
                                {String(candidate.recommendation ?? 'KEEP_FORWARD_OBSERVE')}
                              </span>
                            </div>
                            <div className="mt-1 grid gap-1 text-[11px] sm:grid-cols-3">
                              <span>obs: {String(candidate.observation_count ?? 0)}</span>
                              <span>sample: {String(candidate.total_sample ?? 0)}</span>
                              <span>avg score: {Number.isFinite(avgScore) ? formatPct(avgScore) : '—'}</span>
                              <span>worst DD: {Number.isFinite(worstDrawdown) ? formatPct(worstDrawdown) : '—'}</span>
                              <span>gate: {String(manualGate?.status ?? '—')}</span>
                              <span>paper: false · manual review</span>
                            </div>
                            <div className="mt-1 text-[11px] text-muted">
                              reason: {String(manualGate?.reason_code ?? '—')} · broker off · execution=false
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-[11px] text-muted">
                        Nessuno storico forward sufficiente. Il gate richiede più osservazioni prima di qualsiasi review manuale.
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {(data.forwardPerformance?.observations ?? []).length ? (
                    (data.forwardPerformance?.observations ?? []).map(
                      (observation, observationIndex) => {
                        const equityLast = Number(observation.equity_last)
                        const score = Number(observation.score_pct)
                        const drawdown = Number(observation.max_drawdown_pct)
                        return (
                          <div
                            key={`${String(observation.candidate_key ?? 'observation')}-${observationIndex}`}
                            className="rounded-lg border p-3"
                            style={{
                              background: 'var(--theme-card2)',
                              borderColor: 'var(--theme-border)',
                            }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-semibold text-ink">
                                {String(observation.strategy_name ?? observation.strategy_id ?? 'strategia')}{' '}
                                · {String(observation.symbol ?? 'asset')}{' '}
                                {String(observation.timeframe ?? 'tf')}
                              </div>
                              <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase">
                                {String(observation.status ?? 'observed')}
                              </span>
                            </div>
                            <div className="mt-2 grid gap-1 text-xs sm:grid-cols-3">
                              <span>score forward: {Number.isFinite(score) ? formatPct(score) : '—'}</span>
                              <span>trade/sample: {String(observation.sample ?? '—')}</span>
                              <span>win-rate: {formatPct(Number(observation.win_rate_pct))}</span>
                              <span>drawdown: {Number.isFinite(drawdown) ? formatPct(drawdown) : '—'}</span>
                              <span>equity: {Number.isFinite(equityLast) ? equityLast.toFixed(4) : '—'}</span>
                              <span>candele: {String(observation.candles ?? '—')}</span>
                            </div>
                            <div className="mt-2 text-[11px] text-muted">
                              interface: {String(observation.interface ?? '—')} · source:{' '}
                              {String(observation.source ?? '—')} · broker off · paper_promoted=false
                            </div>
                          </div>
                        )
                      },
                    )
                  ) : (
                    <div className="rounded-lg border p-3 text-xs">
                      Nessuna performance forward osservata. Serve queue attiva + cron performance.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-muted">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="rounded-lg border p-3"
                    style={{
                      background: 'var(--theme-card2)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-ink">
                        {strategy.icon} {strategy.name}
                      </div>
                      <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase">
                        {data.strategyTestLogs?.byStrategy[strategy.id] ?? 0}{' '}
                        test
                      </span>
                    </div>
                    <div className="mt-1 text-xs">
                      {strategy.id} · {strategy.timeframes} ·{' '}
                      {strategy.dataSource ?? strategy.dataNeed}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Tutti i test" accent="var(--theme-success)">
              <div className="space-y-2 text-sm text-muted">
                {(data.strategyTestLogs?.recent ?? []).length ? (
                  (data.strategyTestLogs?.recent ?? []).map((log, index) => {
                    const score = Number(log.score_pct)
                    const scoreLabel = Number.isFinite(score)
                      ? formatPct(score)
                      : '—'
                    const conciliumReview = asRecord(log.concilium_review)
                    const conciliumRoles = Array.isArray(conciliumReview?.roles)
                      ? conciliumReview.roles
                      : []
                    const riskGate = asRecord(log.risk_gate)
                    return (
                      <div
                        key={`${String(log.generated_at ?? 'run')}-${String(log.strategy_id ?? 'strategy')}-${index}`}
                        className="rounded-lg border p-3"
                        style={{
                          background: 'var(--theme-card2)',
                          borderColor: 'var(--theme-border)',
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold text-ink">
                            {String(log.strategy_id ?? 'strategia')} ·{' '}
                            {String(log.symbol ?? 'asset')}{' '}
                            {String(log.timeframe ?? 'tf')}
                          </div>
                          <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase">
                            {String(log.decision ?? '—')}
                          </span>
                        </div>
                        <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                          <span>logic: {String(log.best_logic ?? '—')}</span>
                          <span>score: {scoreLabel}</span>
                          <span>sample: {String(log.sample ?? '—')}</span>
                          <span>
                            varianti: {String(log.variants_tested ?? '—')}
                          </span>
                          <span>candele: {String(log.candles ?? '—')}</span>
                          <span>
                            walk-forward:{' '}
                            {String(
                              (
                                log.walk_forward as
                                  | Record<string, unknown>
                                  | undefined
                              )?.status ?? '—',
                            )}
                          </span>
                        </div>
                        {conciliumReview ? (
                          <div className="mt-3 rounded-lg border p-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                              <span>Review Concilium</span>
                              <span>
                                Concilium:{' '}
                                {String(conciliumReview.recommendation ?? '—')}{' '}
                                · conf{' '}
                                {String(conciliumReview.confidence ?? '—')}
                              </span>
                              <span className="text-muted">
                                reason:{' '}
                                {String(conciliumReview.reason_code ?? '—')}
                              </span>
                            </div>
                            {conciliumRoles.length ? (
                              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted">
                                {conciliumRoles
                                  .slice(0, 5)
                                  .map((role, roleIndex) => (
                                    <span
                                      key={`${String(log.strategy_id ?? 'strategy')}-role-${roleIndex}`}
                                      className="rounded-full border px-2 py-0.5"
                                    >
                                      {formatConciliumRole(role)}
                                    </span>
                                  ))}
                              </div>
                            ) : null}
                            {riskGate ? (
                              <div className="mt-2 text-[11px] text-muted">
                                Risk gate: {String(riskGate.status ?? '—')} ·{' '}
                                violazioni:{' '}
                                {formatViolations(riskGate.violations)}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="mt-2 text-[11px] text-muted">
                          {formatIsoTime(String(log.generated_at ?? ''))} ·
                          params: {compactJson(log.best_params ?? {})}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-lg border p-3 text-xs">
                    Nessun log ancora. Il prossimo run AutoResearch scriverà una
                    riga per ogni strategia/asset/timeframe testato.
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'portafoglio' ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <Card title="Portafoglio attivo" accent="var(--theme-success)">
              {portfolio ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric
                      label="Esposizione"
                      value={formatCurrency(portfolio.openExposure)}
                    />
                    <Metric
                      label="Valore a mercato"
                      value={formatCurrency(portfolio.markToMarketValue)}
                    />
                    <Metric
                      label="PnL non realizzato"
                      value={`${formatCurrency(portfolio.unrealizedPnl)} · ${formatPct(portfolio.unrealizedPnlPct)}`}
                      tone={pnlTone(portfolio.unrealizedPnl)}
                    />
                    <Metric
                      label="Drawdown / rischio a stop"
                      value={`${formatCurrency(portfolio.maxRiskToStop)} · ${formatPct(portfolio.riskToStopPct)}`}
                      tone={portfolio.maxRiskToStop > 0 ? 'warn' : 'good'}
                    />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Metric
                      label="Trade attivi"
                      value={portfolio.activeTrades}
                    />
                    <Metric
                      label="Investimenti attivi"
                      value={portfolio.activeInvestments}
                    />
                    <Metric
                      label="Asset in portafoglio"
                      value={portfolio.assetCount}
                    />
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Calcolo read-only su ordini demo aperti: PnL mark-to-market,
                    rischio a stop e allocazione per asset. Se manca prezzo live
                    usa entry price come fallback.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">
                  Snapshot portafoglio non disponibile.
                </p>
              )}
            </Card>

            <Card
              title="Performance board"
              accent="var(--theme-warning)"
              right={
                <span className="text-xs text-muted">observe metrics</span>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Score provvisorio"
                  value={`${performance.score}/100`}
                  tone={performanceTone(performance.score)}
                />
                <Metric
                  label="PnL demo"
                  value={formatPct(performance.pnlPct)}
                  tone={pnlTone(performance.pnlPct)}
                />
                <Metric
                  label="Rischio a stop"
                  value={formatPct(performance.riskPct)}
                  tone={performance.riskPct > 0 ? 'warn' : 'good'}
                />
                <Metric
                  label="PAPER rate"
                  value={
                    performance.paperRate == null
                      ? '—'
                      : formatPct(performance.paperRate)
                  }
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Metric label="PAPER" value={performance.paper} tone="good" />
                <Metric label="WATCH" value={performance.watch} tone="warn" />
                <Metric
                  label="DISCARD"
                  value={performance.discard}
                  tone="bad"
                />
                <Metric label="REVIEW" value={performance.review} />
              </div>
              <div
                className="mt-4 rounded-lg border p-3 text-xs text-muted"
                style={{
                  background: 'var(--theme-card2)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                Stato: {performance.label}. È una scorecard read-only: misura
                portafoglio demo e decisioni Concilium, non abilita ordini.
                Mancano ancora trade chiusi per win-rate, expectancy e drawdown
                storico affidabili.
              </div>
            </Card>

            <Card
              title="Asset / posizioni aperte"
              accent="var(--theme-accent-secondary)"
            >
              <div className="flex max-h-[620px] flex-col gap-3 overflow-auto pr-1">
                {(portfolio?.assets ?? []).length === 0 ? (
                  <p className="text-sm text-muted">
                    Nessun asset attivo nel demo state.
                  </p>
                ) : (
                  portfolio?.assets.map((asset) => (
                    <div
                      key={`${asset.symbol}-${asset.book}-${asset.strategyId ?? 'strategy'}`}
                      className="rounded-lg border p-3"
                      style={{
                        background: 'var(--theme-card2)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-semibold text-ink">
                            {asset.symbol}
                          </div>
                          <div className="mt-1 text-xs text-muted">
                            {asset.book ?? 'trading'} ·{' '}
                            {asset.strategyId ?? 'strategy n/d'} ·{' '}
                            {asset.side ?? 'side n/d'}
                          </div>
                        </div>
                        <span
                          className="rounded-full border px-2 py-1 text-xs font-semibold"
                          style={{
                            borderColor:
                              asset.unrealizedPnl >= 0
                                ? 'color-mix(in srgb, var(--theme-success) 42%, var(--theme-border))'
                                : 'color-mix(in srgb, var(--theme-danger) 42%, var(--theme-border))',
                            color:
                              asset.unrealizedPnl >= 0
                                ? 'var(--theme-success)'
                                : 'var(--theme-danger)',
                          }}
                        >
                          {formatCurrency(asset.unrealizedPnl)} ·{' '}
                          {formatPct(asset.unrealizedPnlPct)}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-3">
                        <span>qty {asset.openQuantity}</span>
                        <span>entry {formatCurrency(asset.avgEntry)}</span>
                        <span>last {formatCurrency(asset.lastPrice)}</span>
                        <span>
                          allocazione {formatPct(asset.allocationPct)}
                        </span>
                        <span>
                          rischio stop {formatCurrency(asset.maxRiskToStop)}
                        </span>
                        <span>
                          segnale {asset.signal ?? '—'} · conf{' '}
                          {asset.confidence ?? '—'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card title="Ordini attivi" accent="var(--theme-warning)">
              <div className="flex max-h-[520px] flex-col gap-2 overflow-auto pr-1">
                {(portfolio?.activeOrders ?? []).length === 0 ? (
                  <p className="text-sm text-muted">Nessun ordine aperto.</p>
                ) : (
                  portfolio?.activeOrders.map((order, index) => (
                    <MiniEvent
                      key={index}
                      label={`Ordine ${index + 1}`}
                      event={order}
                    />
                  ))
                )}
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'investimenti' ? (
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card
              title="Market Bias BTC/ETH/SOL"
              right={
                <span className="text-xs text-muted">
                  aggiornato {formatTime(data.marketBias.updatedAt)}
                </span>
              }
            >
              {latestCandidates.length > 0 ? (
                <div
                  className={`grid gap-3 ${denseMode ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
                >
                  {latestCandidates
                    .slice(0, denseMode ? 8 : 6)
                    .map((candidate, index) => {
                      const item = candidate as Record<string, unknown>
                      return (
                        <div
                          key={index}
                          className="rounded-lg border p-3 transition-colors hover:bg-[var(--theme-card2)]"
                          style={{
                            background: 'var(--theme-card2)',
                            borderColor: 'var(--theme-border)',
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-ink">
                              {String(
                                item.asset ??
                                  item.symbol ??
                                  `Candidate ${index + 1}`,
                              )}
                            </div>
                            <div
                              className="rounded-full border px-2 py-0.5 text-xs"
                              style={{
                                borderColor: 'var(--theme-accent-border)',
                                color: 'var(--theme-accent)',
                                background: 'var(--theme-accent-subtle)',
                              }}
                            >
                              {String(item.candidate_bias ?? item.bias ?? '—')}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted">
                            confidence{' '}
                            {String(
                              item.confidence ?? item.confidence_final ?? '—',
                            )}
                          </div>
                          <div
                            className="mt-2 line-clamp-3 text-xs"
                            style={{
                              color:
                                'color-mix(in srgb, var(--theme-text) 72%, var(--theme-muted))',
                            }}
                          >
                            {Array.isArray(item.reasons)
                              ? item.reasons.join(' · ')
                              : String(item.summary ?? item.reason ?? '')}
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <pre
                  className="max-h-96 overflow-auto rounded-lg border p-3 text-xs text-muted"
                  style={{
                    background: 'var(--theme-card2)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  {compactJson(
                    data.marketBias.latest?.raw ??
                      data.marketBias.recent.at(-1) ??
                      'Nessun candidato recente',
                  )}
                </pre>
              )}
            </Card>

            <Card
              title="Vault / Report recenti"
              accent="var(--theme-accent-secondary)"
            >
              <div className="flex flex-col gap-2">
                {data.notes.length === 0 ? (
                  <p className="text-sm text-muted">
                    Nessuna nota VT Capital/crypto trovata.
                  </p>
                ) : (
                  data.notes.map((note) => (
                    <div
                      key={note.path}
                      className="rounded-lg border p-3"
                      style={{
                        background: 'var(--theme-card2)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="font-medium text-ink">{note.title}</div>
                      <div className="mt-1 text-xs text-muted">
                        {formatTime(note.mtimeMs)} ·{' '}
                        {Math.round(note.size / 1024)} KB
                      </div>
                      <div
                        className="mt-1 truncate text-xs"
                        style={{
                          color:
                            'color-mix(in srgb, var(--theme-muted) 70%, transparent)',
                        }}
                      >
                        {note.path}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'concilium' ? (
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Card
              title="Storico Concilium"
              right={
                <span className="text-xs text-muted">
                  {latestCouncil.length} record
                </span>
              }
              accent="var(--theme-warning)"
            >
              {data.council.history ? (
                <div className="mb-4 grid gap-3 sm:grid-cols-4">
                  <Metric
                    label="Decisioni totali"
                    value={data.council.history.total}
                  />
                  <Metric
                    label="Ultima decisione"
                    value={data.council.history.latestDecision ?? '—'}
                  />
                  <Metric
                    label="Ultimo asset"
                    value={data.council.history.latestAsset ?? '—'}
                  />
                  <Metric
                    label="Rischio ultimo"
                    value={data.council.history.latestRisk ?? '—'}
                    tone="warn"
                  />
                </div>
              ) : null}
              <div className="flex max-h-[520px] flex-col gap-2 overflow-auto pr-1">
                {latestCouncil.length === 0 ? (
                  <p className="text-sm text-muted">
                    Nessun precheck council trovato.
                  </p>
                ) : (
                  latestCouncil.map((entry, index) => (
                    <details
                      key={index}
                      open={index === 0}
                      className="rounded-lg border p-3"
                      style={{
                        background: 'var(--theme-card2)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <summary className="cursor-pointer text-sm font-medium text-ink">
                        {entryTitle(entry, `Record ${index + 1}`)} ·{' '}
                        {decisionLabel(entry)}
                      </summary>
                      <div className="mt-2 grid gap-2 text-xs text-muted sm:grid-cols-3">
                        <span>agente: {fieldValue(entry, 'agent')}</span>
                        <span>asset: {fieldValue(entry, 'asset')}</span>
                        <span>bias: {fieldValue(entry, 'bias')}</span>
                        <span>timeframe: {fieldValue(entry, 'timeframe')}</span>
                        <span>
                          fiducia: {fieldValue(entry, 'confidenceFinal')}
                        </span>
                        <span>timestamp: {fieldValue(entry, 'timestamp')}</span>
                      </div>
                      <div
                        className="mt-2 rounded border p-2 text-xs text-muted"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        <div>Trigger: {fieldValue(entry, 'trigger')}</div>
                        <div>
                          Invalidazione: {fieldValue(entry, 'invalidation')}
                        </div>
                        <div>Rischio: {fieldValue(entry, 'mainRisk')}</div>
                      </div>
                      <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-muted">
                        {compactJson(entry)}
                      </pre>
                    </details>
                  ))
                )}
              </div>
            </Card>

            <Card
              title="Concilium swarm"
              right={
                <span className="text-xs text-muted">
                  agenti, skill, chat e ultime analisi
                </span>
              }
              accent="var(--theme-success)"
            >
              <div
                className="mb-4 rounded-xl border p-3"
                style={{
                  background: 'var(--theme-card2)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Sala agenti
                    </div>
                    <div className="mt-1 text-sm font-semibold text-ink">
                      {councilAvailableWorkers.length}{' '}
                      {councilAvailableWorkers.length === 1
                        ? 'agente disponibile'
                        : 'agenti disponibili'}
                    </div>
                    <p className="mt-1 max-w-xl text-xs text-muted">
                      Vista tipo swarm: leggi ruoli, skill e ultime analisi, poi
                      copi un prompt corale oppure lo invii agli agenti con chat
                      disponibile. La dashboard non tocca il broker.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void navigator.clipboard.writeText(councilRoomPrompt)
                      }
                      className="rounded-lg border px-3 py-2 text-xs font-semibold text-muted"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      Copia prompt council
                    </button>
                    <button
                      type="button"
                      onClick={() => void dispatchCouncilPrompt()}
                      disabled={
                        councilDispatching ||
                        councilDispatchWorkers.length === 0
                      }
                      className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        borderColor:
                          'color-mix(in srgb, var(--theme-success) 50%, var(--theme-border))',
                        background:
                          'color-mix(in srgb, var(--theme-success) 12%, transparent)',
                        color: 'var(--theme-success)',
                      }}
                    >
                      {councilDispatching
                        ? 'Invio council…'
                        : 'Invia al council'}
                    </button>
                  </div>
                </div>
                <div
                  className="mt-3 rounded-lg border p-3 text-xs text-muted"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  <div className="mb-1 font-semibold text-ink">
                    Prompt corale read-only
                  </div>
                  Tecnico valida livelli, macro/news cerca rischio esterno, bull
                  costruisce il caso favorevole, bear/risk prova a smontarlo,
                  reviewer sintetizza in WATCH/PAPER/DISCARD/REVIEW.
                </div>
              </div>

              <div
                className="mb-4 rounded-xl border p-3"
                style={{
                  background: 'var(--theme-card2)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Chat rapida con agente
                </div>
                <div className="grid gap-2 sm:grid-cols-[0.45fr_1fr]">
                  <select
                    value={
                      selectedCouncilWorker?.workerId ?? selectedCouncilWorkerId
                    }
                    onChange={(event) => {
                      const worker = data.workers.find(
                        (item) => item.workerId === event.target.value,
                      )
                      setSelectedCouncilWorkerId(event.target.value)
                      if (worker?.chatPrompt) setCouncilDraft(worker.chatPrompt)
                    }}
                    className="rounded-lg border bg-transparent px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--theme-border)' }}
                  >
                    {data.workers.map((worker) => (
                      <option key={worker.workerId} value={worker.workerId}>
                        {worker.emoji ?? '🤖'} {worker.name ?? worker.workerId}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={councilDraft}
                    onChange={(event) => setCouncilDraft(event.target.value)}
                    rows={3}
                    className="rounded-lg border bg-transparent px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--theme-border)' }}
                    placeholder="Scrivi cosa vuoi chiedere all’agente…"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={selectedCouncilWorker?.chatUrl ?? '/chat/main'}
                    className="rounded-lg px-3 py-2 text-sm font-semibold"
                    style={{
                      background: 'var(--theme-accent)',
                      color: 'var(--theme-on-accent, white)',
                    }}
                  >
                    Apri chat agente
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      void navigator.clipboard.writeText(councilChatMessage)
                    }
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--theme-border)' }}
                  >
                    Copia prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendCouncilPrompt()}
                    disabled={
                      councilSending ||
                      !selectedCouncilWorker ||
                      !selectedCouncilWorker.chatAvailable
                    }
                    className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      borderColor:
                        'color-mix(in srgb, var(--theme-success) 50%, var(--theme-border))',
                      background:
                        'color-mix(in srgb, var(--theme-success) 12%, transparent)',
                      color: 'var(--theme-success)',
                    }}
                  >
                    {councilSending ? 'Invio…' : 'Invia ad agente'}
                  </button>
                  <span className="self-center text-xs text-muted">
                    invio chat reale via swarm-direct-chat; broker ed execution
                    restano separati
                  </span>
                </div>
                {councilDispatchResults.length > 0 ? (
                  <div
                    className="mt-3 rounded-lg border p-3 text-xs"
                    style={{
                      background: 'var(--theme-card2)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="mb-2 font-semibold text-ink">
                      Risposte council aggregate
                    </div>
                    <div className="space-y-2">
                      {councilDispatchResults.map((result) => (
                        <div
                          key={result.workerId}
                          className="rounded border p-2"
                          style={{
                            borderColor: result.ok
                              ? 'color-mix(in srgb, var(--theme-success) 35%, var(--theme-border))'
                              : 'color-mix(in srgb, var(--theme-danger) 45%, var(--theme-border))',
                          }}
                        >
                          <div className="font-semibold text-ink">
                            {result.workerName} · {result.role} ·{' '}
                            {result.status}
                          </div>
                          {result.error ? (
                            <div style={{ color: 'var(--theme-danger)' }}>
                              {result.error}
                            </div>
                          ) : (
                            <div className="mt-1 whitespace-pre-wrap text-muted">
                              {result.reply}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {councilSendStatus || councilSendError || councilReply ? (
                  <div
                    className="mt-3 rounded-lg border p-3 text-xs"
                    style={{
                      background: 'var(--theme-card2)',
                      borderColor: councilSendError
                        ? 'color-mix(in srgb, var(--theme-danger) 45%, var(--theme-border))'
                        : 'color-mix(in srgb, var(--theme-success) 35%, var(--theme-border))',
                    }}
                  >
                    {councilSendStatus ? (
                      <div className="font-semibold text-ink">
                        {councilSendStatus}
                      </div>
                    ) : null}
                    {councilSendError ? (
                      <div style={{ color: 'var(--theme-danger)' }}>
                        Errore invio chat: {councilSendError}
                      </div>
                    ) : null}
                    {councilReply ? (
                      <div className="mt-2 whitespace-pre-wrap text-muted">
                        {councilReply}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {data.workers.map((worker) => (
                  <details
                    key={worker.workerId}
                    open={worker.workerId === selectedCouncilWorker?.workerId}
                    className="rounded-lg border p-3"
                    style={{
                      background: 'var(--theme-card2)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-ink">
                            <span className="mr-1">{worker.emoji ?? '🤖'}</span>
                            {worker.name ?? worker.workerId}
                          </div>
                          <div className="text-xs text-muted">
                            {worker.councilRole ?? worker.workerId} ·{' '}
                            {worker.shortRole ?? 'profilo Concilium'}
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs ${stateClass(worker.state)}`}
                        >
                          {worker.state ?? 'unknown'}
                        </span>
                      </div>
                    </summary>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(worker.skills ?? []).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border px-2 py-0.5 text-[11px] text-muted"
                          style={{ borderColor: 'var(--theme-border)' }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      runtime {worker.runtimeExists ? 'ok' : 'missing'} · soul{' '}
                      {worker.soulExists ? 'ok' : 'missing'} · chat{' '}
                      {worker.chatAvailable ? 'storico ok' : 'non disponibile'}
                    </div>
                    <div className="mt-2 text-xs text-ink">
                      Task: {worker.currentTask ?? 'nessun task attivo'}
                    </div>
                    {worker.latestAnalysis ? (
                      <div
                        className="mt-3 rounded border p-2 text-xs text-muted"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        <div className="mb-1 font-semibold text-ink">
                          Ultima analisi letta
                        </div>
                        <div className="line-clamp-5 whitespace-pre-wrap">
                          {worker.latestAnalysis}
                        </div>
                      </div>
                    ) : worker.lastSummary ? (
                      <div className="mt-3 line-clamp-4 text-xs text-muted">
                        {worker.lastSummary}
                      </div>
                    ) : null}
                    {worker.recentMessages &&
                    worker.recentMessages.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          Ultimi messaggi
                        </div>
                        {worker.recentMessages.map((message) => (
                          <div
                            key={message.id}
                            className="rounded border p-2 text-xs"
                            style={{ borderColor: 'var(--theme-border)' }}
                          >
                            <div className="mb-1 font-semibold text-ink">
                              {message.role}
                            </div>
                            <div className="line-clamp-4 whitespace-pre-wrap text-muted">
                              {message.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </details>
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'impostazioni' ? (
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Card
              title="Impostazioni cockpit"
              accent="var(--theme-accent-secondary)"
            >
              <div className="flex flex-col gap-3 text-sm">
                <label
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  style={{
                    background: 'var(--theme-card2)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <span>
                    <span className="font-semibold text-ink">Auto-refresh</span>
                    <span className="block text-xs text-muted">
                      Aggiorna i dati senza ricaricare la pagina.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(event) => setAutoRefresh(event.target.checked)}
                  />
                </label>
                <label
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  style={{
                    background: 'var(--theme-card2)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <span>
                    <span className="font-semibold text-ink">
                      Intervallo refresh
                    </span>
                    <span className="block text-xs text-muted">
                      Solo preferenza locale browser.
                    </span>
                  </span>
                  <select
                    value={refreshEverySeconds}
                    onChange={(event) =>
                      setRefreshEverySeconds(Number(event.target.value))
                    }
                    className="rounded border bg-transparent px-2 py-1"
                    style={{ borderColor: 'var(--theme-border)' }}
                  >
                    <option value={30}>30 sec</option>
                    <option value={60}>60 sec</option>
                    <option value={120}>2 min</option>
                    <option value={300}>5 min</option>
                  </select>
                </label>
                <label
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  style={{
                    background: 'var(--theme-card2)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <span>
                    <span className="font-semibold text-ink">
                      Mostra JSON raw
                    </span>
                    <span className="block text-xs text-muted">
                      Espande dati tecnici shadow/council quando serve debug.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showRawJson}
                    onChange={(event) => setShowRawJson(event.target.checked)}
                  />
                </label>
                <label
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  style={{
                    background: 'var(--theme-card2)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <span>
                    <span className="font-semibold text-ink">
                      Modalità compatta
                    </span>
                    <span className="block text-xs text-muted">
                      Mostra più card bias a colpo d’occhio.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={denseMode}
                    onChange={(event) => setDenseMode(event.target.checked)}
                  />
                </label>
              </div>
            </Card>

            <Card
              title="Impostazioni bloccate per safety"
              accent="var(--theme-danger)"
            >
              <div className="flex flex-col gap-3 text-sm text-muted">
                <div
                  className="rounded-lg border p-3"
                  style={{
                    background: 'var(--theme-card2)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  Execution trading: bloccata da codice. Questa schermata non
                  può abilitarla.
                </div>
                <div
                  className="rounded-lg border p-3"
                  style={{
                    background: 'var(--theme-card2)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  Live trading: bloccato. Serve checklist separata e consenso
                  esplicito di Valerio.
                </div>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{
                    background: 'var(--theme-accent)',
                    color: 'var(--theme-on-accent, white)',
                  }}
                >
                  Aggiorna ora
                </button>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'altro' ? (
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Card title="Swarm Trading Workers" accent="var(--theme-success)">
              <div className="grid gap-3 md:grid-cols-2">
                {data.workers.map((worker) => (
                  <div
                    key={worker.workerId}
                    className="rounded-lg border p-3"
                    style={{
                      background: 'var(--theme-card2)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-ink">
                        {worker.workerId}
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${stateClass(worker.state)}`}
                      >
                        {worker.state ?? 'unknown'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      memory {worker.memoryExists ? 'ok' : 'missing'} · identity{' '}
                      {worker.identityExists ? 'ok' : 'missing'}
                    </div>
                    {worker.currentTask ? (
                      <div className="mt-2 text-xs text-ink">
                        Task: {worker.currentTask}
                      </div>
                    ) : null}
                    {worker.lastSummary ? (
                      <div className="mt-2 line-clamp-2 text-xs text-muted">
                        {worker.lastSummary}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title="Dettagli tecnici plugin"
              accent="var(--theme-accent-secondary)"
            >
              <pre
                className="max-h-[520px] overflow-auto rounded-lg border p-3 text-xs text-muted"
                style={{
                  background: 'var(--theme-card2)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                {compactJson({
                  plugin: data.plugin,
                  paths: data.paths,
                  shadow: data.shadow,
                })}
              </pre>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
