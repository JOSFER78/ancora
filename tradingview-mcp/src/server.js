import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import http from 'http';
import * as core from './core/index.js';
import { registerHealthTools } from './tools/health.js';
import { registerChartTools } from './tools/chart.js';
import { registerPineTools } from './tools/pine.js';
import { registerDataTools } from './tools/data.js';
import { registerCaptureTools } from './tools/capture.js';
import { registerDrawingTools } from './tools/drawing.js';
import { registerAlertTools } from './tools/alerts.js';
import { registerBatchTools } from './tools/batch.js';
import { registerReplayTools } from './tools/replay.js';
import { registerIndicatorTools } from './tools/indicators.js';
import { registerWatchlistTools } from './tools/watchlist.js';
import { registerUiTools } from './tools/ui.js';
import { registerPaneTools } from './tools/pane.js';
import { registerTabTools } from './tools/tab.js';

const server = new McpServer(
  {
    name: 'tradingview',
    version: '2.0.0',
    description: 'AI-assisted TradingView chart analysis and Pine Script development via Chrome DevTools Protocol',
  },
  {
    instructions: `TradingView MCP — 78 tools for reading and controlling a live TradingView Desktop chart.

TOOL SELECTION GUIDE — use this to pick the right tool:

Reading your chart:
- chart_get_state → get symbol, timeframe, all indicator names + entity IDs (call first)
- data_get_study_values → get current numeric values from ALL visible indicators (RSI, MACD, BB, EMA, etc.)
- quote_get → get real-time price snapshot (last, OHLC, volume)
- data_get_ohlcv → get price bars. ALWAYS pass summary=true unless you need individual bars

Reading custom Pine indicator output (line.new/label.new/table.new/box.new drawings):
- data_get_pine_lines → horizontal price levels from custom indicators (deduplicated, sorted)
- data_get_pine_labels → text annotations with prices ("PDH 24550", "Bias Long", etc.)
- data_get_pine_tables → table data as formatted rows (session stats, analytics dashboards)
- data_get_pine_boxes → price zones as {high, low} pairs
- ALWAYS pass study_filter to target a specific indicator by name (e.g., study_filter="Profiler")
- Indicators must be VISIBLE on chart for these to work

Changing the chart:
- chart_set_symbol, chart_set_timeframe, chart_set_type → change ticker/resolution/style
- chart_manage_indicator → add/remove studies. USE FULL NAMES: "Relative Strength Index" not "RSI"
- chart_scroll_to_date → jump to a date (ISO format)
- indicator_set_inputs → change indicator settings (length, source, etc.)

Pine Script development:
- pine_set_source → inject code, pine_smart_compile → compile + check errors
- pine_get_errors → read errors, pine_get_console → read log output
- WARNING: pine_get_source can return 200KB+ for complex scripts — avoid unless editing

Screenshots: capture_screenshot → regions: "full", "chart", "strategy_tester"
Replay: replay_start → replay_step → replay_trade → replay_status → replay_stop
Batch: batch_run → run action across multiple symbols/timeframes
Drawing: draw_shape → horizontal_line, trend_line, rectangle, text
Alerts: alert_create, alert_list, alert_delete
Launch: tv_launch → auto-detect and start TradingView with CDP on any platform
Panes: pane_list, pane_set_layout (s, 2h, 2v, 4, 6, 8), pane_focus, pane_set_symbol
Tabs: tab_list, tab_new, tab_close, tab_switch

CONTEXT MANAGEMENT:
- ALWAYS use summary=true on data_get_ohlcv
- ALWAYS use study_filter on pine tools when you know which indicator you want
- NEVER use verbose=true unless user specifically asks for raw data
- Prefer capture_screenshot for visual context over pulling large datasets
- Call chart_get_state ONCE at start, reuse entity IDs`,
  }
);

// Register all tool groups
registerHealthTools(server);
registerChartTools(server);
registerPineTools(server);
registerDataTools(server);
registerCaptureTools(server);
registerDrawingTools(server);
registerAlertTools(server);
registerBatchTools(server);
registerReplayTools(server);
registerIndicatorTools(server);
registerWatchlistTools(server);
registerUiTools(server);
registerPaneTools(server);
registerTabTools(server);

// Startup notice (stderr so it doesn't interfere with MCP stdio protocol)
process.stderr.write('⚠  tradingview-mcp  |  Unofficial tool. Not affiliated with TradingView Inc. or Anthropic.\n');
process.stderr.write('   Ensure your usage complies with TradingView\'s Terms of Use.\n\n');

// Start stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

// HTTP Bridge on port 9223 for local React frontend
const httpMethods = {
  'chart_get_state': core.chart.getState,
  'chart_set_symbol': core.chart.setSymbol,
  'chart_set_timeframe': core.chart.setTimeframe,
  'chart_set_type': core.chart.setType,
  'chart_manage_indicator': core.chart.manageIndicator,
  'chart_get_visible_range': core.chart.getVisibleRange,
  'chart_set_visible_range': core.chart.setVisibleRange,
  'chart_scroll_to_date': core.chart.scrollToDate,
  'symbol_info': core.chart.symbolInfo,
  'symbol_search': core.chart.symbolSearch,

  'data_get_ohlcv': core.data.getOhlcv,
  'data_get_study_values': core.data.getStudyValues,
  'data_get_pine_lines': core.data.getPineLines,
  'data_get_pine_labels': core.data.getPineLabels,
  'data_get_pine_tables': core.data.getPineTables,
  'data_get_pine_boxes': core.data.getPineBoxes,
  'quote_get': core.data.getQuote,
  'depth_get': core.data.getDepth,
  'strategy_results_get': core.data.getStrategyResults,
  'trades_get': core.data.getTrades,
  'equity_get': core.data.getEquity,

  'capture_screenshot': core.capture.captureScreenshot,

  'indicator_set_inputs': core.indicators.setInputs,
  'indicator_toggle_visibility': core.indicators.toggleVisibility,
  
  'tab_list': core.tab.list,
  'tab_new': core.tab.newTab,
  'tab_close': core.tab.closeTab,
  'tab_switch': core.tab.switchTab,
  
  'pane_list': core.pane.list,
  'pane_set_layout': core.pane.setLayout,
  'pane_focus': core.pane.focus,
  'pane_set_symbol': core.pane.setSymbol,

  'ui_click': core.ui.click,
  'ui_open_panel': core.ui.openPanel,
  'ui_fullscreen': core.ui.fullscreen,
  'ui_layout_list': core.ui.layoutList,
  'ui_layout_switch': core.ui.layoutSwitch,
  'ui_keyboard': core.ui.keyboard,
  'ui_type_text': core.ui.typeText,
  'ui_hover': core.ui.hover,
  'ui_scroll': core.ui.scroll,
  'ui_mouse_click': core.ui.mouseClick,
  'ui_find_element': core.ui.findElement,
  'ui_evaluate': core.ui.uiEvaluate
};

const httpServer = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/mcp') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { tool, arguments: args } = payload;
        
        if (!tool) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing "tool" field' }));
          return;
        }

        const fn = httpMethods[tool];
        if (!fn) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Tool "${tool}" not found or not mapped in HTTP bridge` }));
          return;
        }

        // Execute core function
        const result = await fn(args || {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mcp: 'tradingview' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 9223;
httpServer.listen(PORT, () => {
  process.stderr.write(`⚠  tradingview-mcp  |  HTTP Bridge listening on http://localhost:${PORT}\n`);
});

