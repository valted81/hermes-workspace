// @vitest-environment jsdom
import React from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VtCapitalScreen } from './vt-capital-screen'

const reactActGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}
reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true

const payload = {
  ok: true,
  checkedAt: Date.UTC(2026, 4, 6, 17, 0, 0),
  plugin: {
    name: 'vt-capital',
    version: '0.1.0',
    mode: 'observe_only',
    executionEnabled: false,
  },
  paths: {},
  marketBias: {
    fileExists: true,
    updatedAt: Date.UTC(2026, 4, 6, 16, 30, 0),
    sizeBytes: 1024,
    latest: {
      candidates: [
        {
          asset: 'BTC',
          candidate_bias: 'WATCH',
          confidence: 'medium',
          reasons: ['range pulito', 'risk contenuto'],
        },
      ],
    },
    recent: [],
  },
  council: {
    fileExists: true,
    updatedAt: Date.UTC(2026, 4, 6, 16, 45, 0),
    sizeBytes: 2048,
    recent: [{ asset: 'BTC', decision: 'WATCH' }],
    history: {
      total: 2,
      latestDecision: 'WATCH',
      latestAsset: 'SOLUSDT',
      latestRisk: 'MACD contrario al LONG',
      counts: { PAPER: 1, WATCH: 1 },
      timeline: [
        {
          timestamp: '2026-05-07T13:20:43Z',
          asset: 'SOLUSDT',
          timeframe: '1h',
          bias: 'LONG',
          decision: 'WATCH',
          confidenceFinal: 59,
          trigger: 90.44,
          invalidation: 88.35,
          mainRisk: 'MACD contrario al LONG',
          agent: 'precheck deterministico',
          stance: 'prudente',
        },
      ],
    },
  },
  workers: [
    {
      workerId: 'tradinganalyst',
      name: 'Trading Analyst',
      emoji: '📈',
      councilRole: 'Analista tecnico',
      shortRole: 'trend, livelli, trigger, invalidazione',
      skills: ['RSI/EMA/MACD', 'ATR e stop'],
      chatPrompt: 'Analizza tecnicamente gli asset in watchlist.',
      chatUrl: '/chat/tradinganalyst',
      state: 'idle',
      currentTask: null,
      lastSummary: null,
      latestAnalysis:
        'Ultima analisi: SOL resta in watch, trigger sopra 90.44.',
      recentMessages: [
        {
          id: 'm1',
          role: 'assistant',
          content: 'SOL resta in watch, attenzione al MACD contrario.',
          timestamp: Date.UTC(2026, 4, 7, 13, 20, 0),
        },
      ],
      chatAvailable: true,
      memoryExists: true,
      identityExists: true,
      runtimeExists: false,
      soulExists: true,
    },
  ],
  autoresearch: {
    fileExists: true,
    updatedAt: Date.UTC(2026, 4, 7, 13, 0, 0),
    enabled: false,
    status: 'off',
    mode: 'observe_only',
    executionEnabled: false,
    liveTradingEnabled: false,
    demoTradingEnabled: false,
    enabledUseCases: [],
    useCases: {},
    inspirations: [
      { name: 'Karpathy-style autoresearch', type: 'method' },
      {
        name: 'Nunchi auto-researchtrading',
        repo: 'https://github.com/Nunchi-trade/auto-researchtrading',
      },
    ],
    workflow: [
      'research_concepts',
      'draft_strategy',
      'code_python_module',
      'backtest',
      'walk_forward',
      'risk_review',
      'concilium_review',
      'paper_observe_candidate',
    ],
    researchTopics: ['funding rate', 'volatility squeeze'],
    agents: [
      {
        id: 'strategy-researcher',
        name: 'Strategy Researcher',
        status: 'planned',
        role: 'Cerca concetti online e produce ipotesi testabili.',
      },
      {
        id: 'backtest-analyst',
        name: 'Backtest Analyst',
        status: 'planned',
        role: 'Esegue backtest, walk-forward e robustezza.',
      },
    ],
    safeguards: ['no_broker_calls', 'no_live_trading'],
  },
  strategyRegistry: {
    fileExists: true,
    updatedAt: Date.UTC(2026, 4, 7, 14, 0, 0),
    mode: 'observe_only',
    executionEnabled: false,
    liveTradingEnabled: false,
    pipeline: [
      'research',
      'create',
      'backtest',
      'concilium',
      'paper_observe',
      'gate',
    ],
    safeguards: [
      'no_broker_calls',
      'no_live_trading',
      'paper_only_after_backtest_pass',
    ],
    strategies: [
      {
        id: 'intraday-breakout-fast',
        name: 'Fast Breakout',
        icon: '⚡',
        book: 'trading',
        horizon: 'intraday',
        state: 'paper',
        description: 'Momentum veloce con trigger e stop ATR.',
        backtest_status: 'superato',
        symbols: ['BTC', 'ETH', 'SOL'],
        timeframes: ['15m', '35m', '1h'],
        data_source: 'bybit_ccxt_ohlcv',
        data_need: 'OHLCV exchange, fee e slippage minuti.',
        guardrail: 'PAPER solo con invalidazione chiara e risk gate ok.',
        can_paper: true,
      },
      {
        id: 'mean-reversion-rsi',
        name: 'RSI Reversion',
        icon: '↩️',
        book: 'trading',
        horizon: 'swing breve',
        state: 'backtest',
        description: 'Rimbalzi da ipervenduto confermati.',
        backtest_status: 'in_corso',
        symbols: ['BTC', 'ETH', 'SOL'],
        timeframes: ['35m', '1h', '4h'],
        data_source: 'bybit_ccxt_ohlcv',
        data_need: 'OHLCV + volume reale + volatilità.',
        guardrail: 'Non attivabile senza storico win-rate/drawdown.',
        can_paper: false,
      },
      {
        id: 'dca-core-crypto',
        name: 'DCA Core',
        icon: '🏦',
        book: 'investimenti',
        horizon: 'lungo',
        state: 'idea',
        description: 'Accumulo lento, separato dal trading.',
        backtest_status: 'manca',
        symbols: ['BTC', 'ETH'],
        timeframes: ['1d', '1w', '1M'],
        data_source: 'bybit_ccxt_ohlcv_or_macro_feed',
        data_need: 'Storico multi-anno + drawdown ciclo.',
        guardrail: 'Serve policy allocazione e drawdown massimo.',
        can_paper: false,
      },
    ],
  },
  backtestResults: {
    fileExists: true,
    updatedAt: Date.UTC(2026, 4, 7, 14, 10, 0),
    generatedAt: '2026-05-07T14:10:00+00:00',
    mode: 'observe_only',
    executionEnabled: false,
    dataDir: 'data/desks/desk-a-swing',
    results: [
      {
        strategy_id: 'intraday-breakout-fast',
        status: 'missing_data',
        coverage: { total: 9, ok: 3, missing: 6, insufficient: 6 },
      },
    ],
  },
  strategyTestLogs: {
    fileExists: true,
    updatedAt: Date.UTC(2026, 4, 8, 9, 45, 0),
    eventCount: 27,
    byStrategy: {
      'intraday-breakout-fast': 9,
      'mean-reversion-rsi': 9,
      'dca-core-crypto': 9,
    },
    recent: [
      {
        generated_at: '2026-05-08T09:45:00+00:00',
        strategy_id: 'intraday-breakout-fast',
        strategy_name: 'Fast Breakout',
        decision: 'WATCH',
        symbol: 'SOL',
        timeframe: '35m',
        candles: 120,
        variants_tested: 9,
        best_logic: 'breakout',
        best_params: { lookback: 10, hold: 4 },
        score_pct: 0.1174,
        sample: 21,
        walk_forward: { status: 'pass' },
      },
      {
        generated_at: '2026-05-08T09:45:00+00:00',
        strategy_id: 'dca-core-crypto',
        strategy_name: 'DCA Core',
        decision: 'WATCH',
        symbol: 'BTC',
        timeframe: '1w',
        candles: 180,
        variants_tested: 10,
        best_logic: 'smart_dca',
        best_params: { ma_window: 50, boost_under_ma: 2 },
        score_pct: 109.7997,
        sample: 180,
        walk_forward: { status: 'pass' },
      },
    ],
  },
  backtestData: {
    source: 'CoinGecko free',
    fetcher: 'vt_capital.fetch_candles',
    configPath: 'config/firm.yaml',
    outputDir: 'data/desks/desk-a-swing',
    fileExists: true,
    fileCount: 6,
    files: ['BTC-1h.json', 'BTC-4h.json', 'ETH-1h.json'],
    symbols: ['BTC', 'ETH', 'SOL'],
    timeframes: ['1h', '4h'],
    limitation:
      'CoinGecko OHLC free non include volume; per backtest seri serve Bybit/CCXT OHLCV.',
    nextSource: 'Bybit/CCXT OHLCV',
  },
  guardian: {
    requireOrderScope: true,
    executionMode: 'demo_guardian',
    liveBlocked: true,
    executionEnabled: false,
    lastRiskCheck: {
      symbol: 'SOL/USDT',
      decision: 'approved',
      approval_id: 'risk-123',
    },
    lastOrderProposed: {
      symbol: 'SOL/USDT',
      book: 'trading',
      strategy_id: 'demo_guardian_intraday',
      approval_id: 'risk-123',
    },
    lastOrderExecuted: {
      symbol: 'SOL/USDT',
      status: 'open',
      approval_id: 'risk-123',
    },
    demoState: {
      openOrders: 1,
      trackedOrders: 3,
      lastOrder: {
        symbol: 'SOL/USDT',
        status: 'open',
        book: 'trading',
        strategy_id: 'demo_guardian_intraday',
      },
    },
    portfolio: {
      activeTrades: 1,
      activeInvestments: 0,
      openExposure: 160,
      markToMarketValue: 176,
      unrealizedPnl: 16,
      unrealizedPnlPct: 10,
      maxRiskToStop: 4,
      assetCount: 1,
      assets: [
        {
          symbol: 'SOL/USDT',
          book: 'trading',
          strategyId: 'demo_guardian_intraday',
          openQuantity: 2,
          avgEntry: 80,
          lastPrice: 88,
          unrealizedPnl: 16,
          unrealizedPnlPct: 10,
          maxRiskToStop: 4,
          signal: 'LONG',
          confidence: 71,
        },
      ],
      activeOrders: [
        {
          id: 'open-sol',
          symbol: 'SOL/USDT',
          amount: 2,
          price: 80,
          status: 'open',
          book: 'trading',
        },
      ],
    },
    recentBlocks: [{ reason_code: 'DUPLICATE_OPEN_ORDER', symbol: 'SOL/USDT' }],
  },
  portfolio: {
    activeTrades: 1,
    activeInvestments: 0,
    openExposure: 160,
    markToMarketValue: 176,
    unrealizedPnl: 16,
    unrealizedPnlPct: 10,
    maxRiskToStop: 4,
    assetCount: 1,
    assets: [
      {
        symbol: 'SOL/USDT',
        book: 'trading',
        strategyId: 'demo_guardian_intraday',
        openQuantity: 2,
        avgEntry: 80,
        lastPrice: 88,
        openExposure: 160,
        markToMarketValue: 176,
        unrealizedPnl: 16,
        unrealizedPnlPct: 10,
        maxRiskToStop: 4,
        signal: 'LONG',
        confidence: 71,
      },
    ],
    activeOrders: [
      {
        id: 'open-sol',
        symbol: 'SOL/USDT',
        amount: 2,
        price: 80,
        status: 'open',
        book: 'trading',
      },
    ],
  },
  shadow: {
    fileExists: true,
    updatedAt: Date.UTC(2026, 4, 6, 16, 58, 0),
    eventCount: 14,
    lastEventType: 'SHADOW_CONTROLLER_TICK',
    lastTimestamp: '2026-05-07T15:09:10.901989+00:00',
    namespace: 'agents-vt-capital-shadow',
    mode: 'shadow',
    executionEnabled: false,
    brokerSupplied: false,
    recent: [],
  },
  notes: [
    {
      title: 'Market Watch',
      path: '/root/hermes-vault/03-Trading-Notes/2026-05-06-market-watch.md',
      mtimeMs: Date.UTC(2026, 4, 6, 16, 55, 0),
      size: 4096,
    },
  ],
}

async function renderScreen() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await React.act(() => {
    root.render(<VtCapitalScreen />)
  })
  await React.act(async () => {
    await Promise.resolve()
  })
  return {
    container,
    unmount: async () => {
      await React.act(() => root.unmount())
      document.body.removeChild(container)
    },
  }
}

async function clickButtonContaining(container: HTMLElement, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((item) =>
    item.textContent.includes(text),
  )
  expect(button, `button containing ${text}`).toBeDefined()
  if (!button) throw new Error(`button containing ${text} not found`)
  await React.act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

async function typeTextareaContaining(
  container: HTMLElement,
  placeholder: string,
  text: string,
) {
  const textarea = Array.from(container.querySelectorAll('textarea')).find(
    (item) => item.getAttribute('placeholder')?.includes(placeholder),
  )
  expect(textarea, `textarea containing ${placeholder}`).toBeDefined()
  if (!textarea) throw new Error(`textarea containing ${placeholder} not found`)
  await React.act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )?.set
    setter?.call(textarea, text)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

function controlInsideLabel(container: HTMLElement, labelText: string) {
  const label = Array.from(container.querySelectorAll('label')).find((item) =>
    item.textContent.includes(labelText),
  )
  expect(label, `label containing ${labelText}`).toBeDefined()
  if (!label) throw new Error(`label containing ${labelText} not found`)
  return label.querySelector<HTMLInputElement | HTMLSelectElement>(
    'input, select',
  )
}

describe('VtCapitalScreen', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    window.localStorage.clear()
    originalFetch = global.fetch
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    ) as typeof global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('renders a plugin-scoped observability cockpit, not a generic dashboard clone', async () => {
    const { container, unmount } = await renderScreen()

    expect(
      container.querySelector('[data-plugin-surface="vt-capital"]'),
    ).not.toBeNull()
    expect(container.textContent).toContain('Plugin VT Capital')
    expect(container.textContent).toContain('Modalità osservazione')
    expect(container.textContent).toContain('Esecuzione disattivata')
    expect(container.textContent).toContain('Scope: solo plugin')
    expect(container.textContent).toContain('Worker runtime1/1')
    expect(container.textContent).toContain('Trading Analystonline')
    expect(container.textContent).toContain('Mappa interattiva progetto')
    expect(container.textContent).toContain('Dettaglio componente')
    expect(container.textContent).toContain('Chat swarm nativa')
    expect(container.textContent).toContain('Performance board')
    expect(container.textContent).toContain('Regola sicurezza')
    await clickButtonContaining(container, 'Trading Analyst')
    expect(container.textContent).toContain('Skill agente')
    expect(container.textContent).toContain('Ultima analisi mappa')
    expect(container.textContent).toContain('Apri chat da mappa')
    expect(container.textContent).toContain('Ultimi messaggi mappa')
    expect(container.textContent).toContain('RSI/EMA/MACD')
    expect(container.textContent).toContain('SOL resta in watch')
    const buttons = container.querySelectorAll('button')
    await React.act(() => {
      buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(container.textContent).toContain('BTC')
    expect(container.textContent).toContain('Guardian / OMS')
    expect(container.textContent).toContain('require_order_scope attivo')
    expect(container.textContent).toContain('Ultimo risk.check')
    expect(container.textContent).toContain('Ultimo order.proposed')
    expect(container.textContent).toContain('Ultimo order.executed')
    expect(container.textContent).toContain('demo_guardian_intraday')
    expect(container.textContent).toContain('DUPLICATE_OPEN_ORDER')
    expect(container.textContent).toContain('Safety Gates')
    expect(container.textContent).toContain('Observe-only confermato')
    expect(container.textContent).toContain('Live bloccato')
    expect(container.textContent).toContain('Shadow audit')
    expect(container.textContent).toContain('14 eventi')
    expect(container.textContent).toContain('SHADOW_CONTROLLER_TICK')
    expect(container.textContent).toContain('agents-vt-capital-shadow')
    expect(container.textContent).toContain('broker non fornito')
    expect(container.textContent).toContain('Concilium')
    expect(container.textContent).toContain('Impostazioni')
    await clickButtonContaining(container, 'Strategie')
    expect(container.textContent).toContain('Strategy Lab')
    expect(container.textContent).toContain('Fast Breakout')
    expect(container.textContent).toContain('15m / 35m / 1h')
    expect(container.textContent).toContain('Target: trading')
    expect(container.textContent).toContain('coverage: 3/9 ok')
    expect(container.textContent).toContain('Paper observe')
    expect(container.textContent).toContain('Pipeline strategia')
    expect(container.textContent).toContain('AutoResearch')
    expect(container.textContent).toContain('Strategy Researcher')
    expect(container.textContent).toContain('Backtest Analyst')
    expect(container.textContent).toContain('Karpathy-style autoresearch')
    expect(container.textContent).toContain('Nunchi auto-researchtrading')
    expect(container.textContent).toContain('research_concepts')
    expect(container.textContent).toContain('volatility squeeze')
    expect(container.textContent).toContain('demo off')
    expect(container.textContent).toContain('live off')
    expect(container.textContent).toContain('Dati backtest')
    expect(container.textContent).toContain('CoinGecko free')
    expect(container.textContent).toContain('Bybit/CCXT OHLCV')
    expect(container.textContent).toContain('non abilitano live trading')
    await clickButtonContaining(container, 'Log test')
    expect(container.textContent).toContain('Log strategie')
    expect(container.textContent).toContain('Tutti i test')
    expect(container.textContent).toContain('Test salvati27')
    expect(container.textContent).toContain('intraday-breakout-fast')
    expect(container.textContent).toContain('SOL 35m')
    expect(container.textContent).toContain('logic: breakout')
    expect(container.textContent).toContain('walk-forward: pass')
    await clickButtonContaining(container, 'Portafoglio')
    expect(container.textContent).toContain('Portafoglio attivo')
    expect(container.textContent).toContain('PnL non realizzato')
    expect(container.textContent).toContain('16,00')
    expect(container.textContent).toContain('Drawdown / rischio a stop')
    expect(container.textContent).toContain('Performance board')
    expect(container.textContent).toContain('Score provvisorio')
    expect(container.textContent).toContain('PAPER rate')
    expect(container.textContent).toContain('demo sotto osservazione')
    expect(container.textContent).toContain('SOL/USDT')
    await clickButtonContaining(container, 'Concilium')
    expect(container.textContent).toContain('Storico Concilium')
    expect(container.textContent).toContain('MACD contrario al LONG')
    expect(container.textContent).toContain('Concilium swarm')
    expect(container.textContent).toContain('Sala agenti')
    expect(container.textContent).toContain('1 agente disponibile')
    expect(container.textContent).toContain('Prompt corale read-only')
    expect(container.textContent).toContain('Copia prompt council')
    expect(container.textContent).toContain('Invia al council')
    expect(container.textContent).toContain('Chat rapida con agente')
    expect(container.textContent).toContain('Analista tecnico')
    expect(container.textContent).toContain('RSI/EMA/MACD')
    expect(container.textContent).toContain('Ultima analisi letta')
    expect(container.textContent).toContain('SOL resta in watch')
    await clickButtonContaining(container, 'Impostazioni')
    expect(container.textContent).toContain('Impostazioni cockpit')
    expect(global.fetch).toHaveBeenCalledWith('/api/vt-capital', {
      cache: 'no-store',
    })

    await unmount()
  })

  it('mostra le sezioni VT Capital come card compatte con icone', async () => {
    const { container, unmount } = await renderScreen()

    const nav = container.querySelector('[aria-label="Sezioni VT Capital"]')
    expect(nav).not.toBeNull()
    expect(nav?.className).toContain('grid')
    expect(nav?.querySelectorAll('[data-vt-tab-card="true"]').length).toBe(9)
    expect(nav?.textContent).toContain('🗺️Mappa')
    expect(nav?.textContent).toContain('📈Trading')
    expect(nav?.textContent).toContain('🧪Strategie')
    expect(nav?.textContent).toContain('📜Log test')
    expect(nav?.textContent).toContain('💼Portafoglio')
    expect(nav?.textContent).toContain('🧠Concilium')
    expect(nav?.textContent).toContain('🏦Investimenti')
    expect(nav?.textContent).toContain('⚙️Impostazioni')
    expect(nav?.textContent).toContain('🧩Altro')
    expect(nav?.textContent).toContain('Schema')
    expect(nav?.textContent).toContain('Ordini')
    expect(nav?.textContent).toContain('Lab')
    expect(nav?.textContent).toContain('Test')
    expect(nav?.textContent).toContain('PNL')
    expect(nav?.textContent).toContain('Agenti')
    expect(nav?.textContent).not.toContain(
      'Vista cliccabile di componenti, agenti, strategie e mancanze.',
    )

    await unmount()
  })

  it('gestisce il Strategy Lab con stati locali e paper solo dopo backtest', async () => {
    const { container, unmount } = await renderScreen()

    await clickButtonContaining(container, 'Strategie')
    expect(container.textContent).toContain('Strategy Lab')
    expect(container.textContent).toContain('Fast Breakout')
    expect(container.textContent).toContain('RSI Reversion')
    expect(container.textContent).toContain('DCA Core')
    expect(container.textContent).toContain('backtest: superato')
    expect(container.textContent).toContain('Non')

    const paperButtons = Array.from(
      container.querySelectorAll('button'),
    ).filter((item) => item.textContent.includes('Paper observe'))
    expect(paperButtons.length).toBe(3)
    expect(paperButtons[0].disabled).toBe(false)
    expect(paperButtons[1].disabled).toBe(true)
    expect(paperButtons[2].disabled).toBe(true)

    await clickButtonContaining(container, 'Disabilita')
    expect(window.localStorage.getItem('vt-capital-strategy-lab')).toBe(
      JSON.stringify({ 'intraday-breakout-fast': 'disabled' }),
    )
    expect(container.textContent).toContain('Disabilitata')

    await unmount()
  })

  it('persiste le impostazioni locali modificabili del cockpit senza toccare execution', async () => {
    window.localStorage.setItem(
      'vt-capital-cockpit-settings',
      JSON.stringify({
        autoRefresh: false,
        refreshEverySeconds: 120,
        showRawJson: true,
        denseMode: true,
      }),
    )

    const { container, unmount } = await renderScreen()
    await clickButtonContaining(container, 'Impostazioni')

    const autoRefresh = controlInsideLabel(
      container,
      'Auto-refresh',
    ) as HTMLInputElement
    const refreshEverySeconds = controlInsideLabel(
      container,
      'Intervallo refresh',
    ) as HTMLSelectElement
    const showRawJson = controlInsideLabel(
      container,
      'Mostra JSON raw',
    ) as HTMLInputElement
    const denseMode = controlInsideLabel(
      container,
      'Modalità compatta',
    ) as HTMLInputElement

    expect(autoRefresh.checked).toBe(false)
    expect(refreshEverySeconds.value).toBe('120')
    expect(showRawJson.checked).toBe(true)
    expect(denseMode.checked).toBe(true)
    expect(container.textContent).toContain(
      'Execution trading: bloccata da codice',
    )
    expect(container.textContent).toContain('Live trading: bloccato')

    await React.act(() => {
      autoRefresh.click()
      refreshEverySeconds.value = '300'
      refreshEverySeconds.dispatchEvent(new Event('change', { bubbles: true }))
      showRawJson.click()
      denseMode.click()
    })

    expect(window.localStorage.getItem('vt-capital-cockpit-settings')).toBe(
      JSON.stringify({
        autoRefresh: true,
        refreshEverySeconds: 300,
        showRawJson: false,
        denseMode: false,
      }),
    )

    await unmount()
  })

  it('sends a real observe-only chat prompt to the selected Concilium agent', async () => {
    global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/vt-capital') {
        return Promise.resolve(
          new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
      }
      if (url === '/api/swarm-direct-chat') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ok: true,
              workerId: 'tradinganalyst',
              delivered: true,
              sessionId: 'session-1',
              sessionTitle: 'Trading Analyst',
              messages: [
                {
                  id: 'reply-1',
                  role: 'assistant',
                  content: 'Risposta agente: mantengo WATCH su SOL.',
                  timestamp: Date.UTC(2026, 4, 7, 13, 30, 0),
                },
              ],
              source: 'state.db',
              fetchedAt: Date.UTC(2026, 4, 7, 13, 31, 0),
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
        )
      }
      return Promise.resolve(new Response('{}', { status: 404 }))
    }) as typeof global.fetch

    const { container, unmount } = await renderScreen()
    await clickButtonContaining(container, 'Concilium')
    await typeTextareaContaining(
      container,
      'Scrivi cosa vuoi chiedere',
      'Verifica SOL ora in observe-only.',
    )

    await clickButtonContaining(container, 'Invia ad agente')

    expect(global.fetch).toHaveBeenCalledWith('/api/swarm-direct-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: 'tradinganalyst',
        prompt:
          '[VT Capital / Concilium / Analista tecnico]\nVerifica SOL ora in observe-only.',
        limit: 30,
        timeoutMs: 120_000,
      }),
    })
    expect(container.textContent).toContain('Prompt inviato a Trading Analyst')
    expect(container.textContent).toContain(
      'Risposta agente: mantengo WATCH su SOL.',
    )

    await unmount()
  })

  it('dispatches an observe-only prompt to the available Concilium council and shows aggregated replies', async () => {
    global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/vt-capital') {
        return Promise.resolve(
          new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
      }
      if (url === '/api/swarm-direct-chat') {
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          workerId: string
        }
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ok: true,
              workerId: body.workerId,
              delivered: true,
              sessionId: 'session-council',
              sessionTitle: 'Council',
              messages: [
                {
                  id: 'reply-council-1',
                  role: 'assistant',
                  content: 'Council reply: stance neutral, decisione WATCH.',
                  timestamp: Date.UTC(2026, 4, 7, 13, 40, 0),
                },
              ],
              source: 'state.db',
              fetchedAt: Date.UTC(2026, 4, 7, 13, 41, 0),
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
        )
      }
      return Promise.resolve(new Response('{}', { status: 404 }))
    }) as typeof global.fetch

    const { container, unmount } = await renderScreen()
    await clickButtonContaining(container, 'Concilium')
    await typeTextareaContaining(
      container,
      'Scrivi cosa vuoi chiedere',
      'Valuta SOL come council, solo observe-only.',
    )

    await clickButtonContaining(container, 'Invia al council')

    expect(global.fetch).toHaveBeenCalledWith('/api/swarm-direct-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: 'tradinganalyst',
        prompt:
          '[VT Capital / Concilium / Council completo]\nModalità observe-only. Nessun ordine, nessuna execution.\n\nAgenti disponibili:\n- Trading Analyst: Analista tecnico; skill RSI/EMA/MACD, ATR e stop\n\nRichiesta:\nValuta SOL come council, solo observe-only.\n\nOutput atteso: decisione WATCH/PAPER/DISCARD/REVIEW, trigger, invalidazione, rischio principale e disaccordo agenti.\n\nTu sei: Trading Analyst / Analista tecnico.\nRispondi dal tuo ruolo, sintetico, con: stance, trigger, invalidazione, rischio principale, decisione proposta.',
        limit: 30,
        timeoutMs: 120_000,
      }),
    })
    expect(container.textContent).toContain(
      'Dispatch council completato: 1/1 agenti hanno risposto',
    )
    expect(container.textContent).toContain('Risposte council aggregate')
    expect(container.textContent).toContain(
      'Trading Analyst · Analista tecnico · risposta ricevuta',
    )
    expect(container.textContent).toContain(
      'Council reply: stance neutral, decisione WATCH.',
    )

    await unmount()
  })
})
