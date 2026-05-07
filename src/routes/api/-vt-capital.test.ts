import { describe, expect, it } from 'vitest'
import {
  buildPortfolioSnapshot,
  resolveGuardianOrderEvents,
  summarizeCouncilHistory,
  summarizeShadowAudit,
} from './vt-capital'

describe('VT Capital guardian API event summary', () => {
  it('uses executed source_proposal as last order.proposed fallback when proposed queue is missing', () => {
    const executedRecord = {
      topic: 'order.executed',
      payload: {
        source_proposal: {
          symbol: 'SOL/USDT',
          book: 'trading',
          strategy_id: 'demo_guardian_intraday',
          intent: 'entry',
          position_horizon: 'intraday',
          approval_id: 'risk-123',
          source: 'demo_guardian_loop',
        },
        order: {
          symbol: 'SOL/USDT',
          status: 'open',
          approval_id: 'risk-123',
        },
      },
    }

    const summary = resolveGuardianOrderEvents([], [executedRecord])

    expect(summary.lastOrderProposed).toMatchObject({
      symbol: 'SOL/USDT',
      book: 'trading',
      strategy_id: 'demo_guardian_intraday',
      intent: 'entry',
      position_horizon: 'intraday',
      approval_id: 'risk-123',
      source: 'demo_guardian_loop',
    })
    expect(summary.lastRiskCheck).toEqual(summary.lastOrderProposed)
    expect(summary.lastOrderExecuted).toMatchObject({
      symbol: 'SOL/USDT',
      status: 'open',
      book: 'trading',
      strategy_id: 'demo_guardian_intraday',
      intent: 'entry',
      position_horizon: 'intraday',
      approval_id: 'risk-123',
    })
  })
})

describe('VT Capital shadow audit API summary', () => {
  it('summarizes observe-only shadow audit status for dashboard safety panels', () => {
    const summary = summarizeShadowAudit(
      [
        {
          event_type: 'RUNTIME_SHADOW_TICK',
          ts: '2026-05-07T15:09:10.901853+00:00',
          payload: {
            audit_namespace: 'agents-vt-capital-shadow',
            broker_supplied: false,
            execution_enabled: false,
            mode: 'shadow',
          },
        },
        {
          event_type: 'SHADOW_CONTROLLER_TICK',
          ts: '2026-05-07T15:09:10.901989+00:00',
          payload: {
            audit_namespace: 'agents-vt-capital-shadow',
            broker_supplied: false,
            execution_enabled: false,
            mode: 'shadow',
            tick_count: 1,
          },
        },
      ],
      14,
      12345,
    )

    expect(summary).toMatchObject({
      fileExists: true,
      updatedAt: 12345,
      eventCount: 14,
      lastEventType: 'SHADOW_CONTROLLER_TICK',
      lastTimestamp: '2026-05-07T15:09:10.901989+00:00',
      namespace: 'agents-vt-capital-shadow',
      mode: 'shadow',
      executionEnabled: false,
      brokerSupplied: false,
    })
  })
})

describe('VT Capital council and portfolio summaries', () => {
  it('normalizes council history into readable agent decisions with risk context', () => {
    const summary = summarizeCouncilHistory([
      {
        generated_at: '2026-05-07T12:20:12Z',
        asset: 'SOLUSDT',
        timeframe: '1h',
        bias: 'LONG',
        decision: 'PAPER',
        confidence_initial: 85,
        confidence_final: 85,
        trigger: 90.44,
        invalidation: 88.82,
        main_risk: 'nessun blocco prudenziale rilevato',
        rule_source: 'python_precheck',
      },
      {
        generated_at: '2026-05-07T13:20:43Z',
        asset: 'SOLUSDT',
        timeframe: '1h',
        bias: 'LONG',
        decision: 'WATCH',
        confidence_initial: 71,
        confidence_final: 59,
        trigger: 90.44,
        invalidation: 88.35,
        main_risk: 'MACD contrario al LONG',
        rule_source: 'python_precheck',
      },
    ])

    expect(summary).toMatchObject({
      total: 2,
      latestDecision: 'WATCH',
      latestAsset: 'SOLUSDT',
      latestRisk: 'MACD contrario al LONG',
      counts: { PAPER: 1, WATCH: 1 },
    })
    expect(summary.timeline[0]).toMatchObject({
      asset: 'SOLUSDT',
      agent: 'precheck deterministico',
      decision: 'WATCH',
      confidenceFinal: 59,
      stance: 'prudente',
    })
  })

  it('builds active portfolio, trade exposure, pnl and drawdown from demo orders and latest prices', () => {
    const snapshot = buildPortfolioSnapshot(
      {
        orders: [
          {
            id: 'open-sol',
            symbol: 'SOL/USDT',
            side: 'buy',
            amount: 2,
            price: 80,
            status: 'open',
            book: 'trading',
            strategy_id: 'demo_guardian_intraday',
          },
          {
            id: 'closed-btc',
            symbol: 'BTC/USDT',
            side: 'buy',
            amount: 0.01,
            price: 79000,
            status: 'canceled',
            book: 'investment',
          },
        ],
      },
      {
        latest: {
          raw: {
            assets: {
              SOLUSDT: { price: 88, signal: 'LONG', confidence: 71 },
              BTCUSDT: { price: 80000, signal: 'SHORT', confidence: 38 },
            },
          },
        },
      },
    )

    expect(snapshot).toMatchObject({
      activeTrades: 1,
      activeInvestments: 0,
      openExposure: 160,
      markToMarketValue: 176,
      unrealizedPnl: 16,
      unrealizedPnlPct: 10,
      maxRiskToStop: 0,
      assets: [
        {
          symbol: 'SOL/USDT',
          openQuantity: 2,
          avgEntry: 80,
          lastPrice: 88,
          unrealizedPnl: 16,
          unrealizedPnlPct: 10,
        },
      ],
    })
  })
})
