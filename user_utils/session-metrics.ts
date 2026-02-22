import { Database } from "bun:sqlite";
import { join } from "path";
import { homedir } from "os";

/**
 * Interface for the raw data stored in the 'message' or 'part' table's 'data' column.
 */
interface MetricsData {
  agent?: string;
  mode?: string;
  modelID?: string;
  model?: {
    modelID?: string;
  };
  tokens?: {
    input?: number;
    output?: number;
    reasoning?: number;
    cache?: {
      read?: number;
      write?: number;
    };
  };
  cost?: number;
  type?: string;
  tool?: string;
  state?: {
    metadata?: {
      sessionId?: string;
    };
  };
  input?: {
    subagent_type?: string;
  };
}

/**
 * Aggregated metrics for a specific agent/model combination.
 */
interface AgentMetrics {
  agent: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cacheTokens: number;
  cost: number;
}

interface SessionResult {
  metricsMap: Map<string, AgentMetrics>;
  workflow: string[];
  totals: {
    input: number;
    output: number;
    reasoning: number;
    cache: number;
    cost: number;
  };
}

/**
 * Main function to analyze session metrics.
 */
function analyzeSession() {
  const sessionId = Bun.argv[2];

  if (!sessionId) {
    console.error("Usage: bun user_utils/session-metrics.ts <session_id>");
    process.exit(1);
  }

  // Expand home directory for the database path
  const dbPath = join(homedir(), ".local/share/opencode/opencode.db");

  let db: Database;
  try {
    db = new Database(dbPath, { readonly: true });
  } catch (error) {
    console.error(`Error: Could not open database at ${dbPath}`);
    process.exit(1);
  }

  try {
    const processedSessions = new Set<string>();
    const result = processSession(db, sessionId, processedSessions);

    if (!result) {
      console.log(`No data found for session ID: ${sessionId}`);
      return;
    }

    printSummary(result.workflow, Array.from(result.metricsMap.values()), result.totals);

  } finally {
    db.close();
  }
}

/**
 * Recursively processes a session and its sub-sessions.
 */
function processSession(
  db: Database,
  sessionId: string,
  processedSessions: Set<string>,
  agentNameOverride?: string
): SessionResult | null {
  if (processedSessions.has(sessionId)) {
    return null;
  }
  processedSessions.add(sessionId);

  // Query both message data and part data for the given session
  const query = db.query(`
    SELECT 'message' as source, id as message_id, data, time_created
    FROM message
    WHERE session_id = ?
    UNION ALL
    SELECT 'part' as source, message_id, data, time_created
    FROM part
    WHERE session_id = ?
    ORDER BY time_created ASC, source DESC
  `);

  const rows = query.all(sessionId, sessionId) as {
    source: string;
    message_id: string;
    data: string;
    time_created: number;
  }[];

  if (rows.length === 0) {
    return null;
  }

  const metricsMap = new Map<string, AgentMetrics>();
  const workflow: string[] = [];
  const seenMetrics = new Set<string>();

  // Maps to track agent and model for each message, to be used by its parts
  const messageAgents = new Map<string, string>();
  const messageModels = new Map<string, string>();

  let totalInput = 0;
  let totalOutput = 0;
  let totalReasoning = 0;
  let totalCache = 0;
  let totalCost = 0;

  for (const row of rows) {
    let data: MetricsData;
    try {
      data = JSON.parse(row.data);
    } catch {
      continue;
    }

    // Sub-session detection: type === 'tool' and tool === 'task'
    if (row.source === 'part' && data.type === 'tool' && data.tool === 'task') {
      const subSessionId = data.state?.metadata?.sessionId;
      const subAgentType = data.input?.subagent_type;

      if (subSessionId) {
        const subResult = processSession(db, subSessionId, processedSessions, subAgentType);
        if (subResult) {
          // Aggregate sub-session metrics
          for (const [key, m] of subResult.metricsMap) {
            const existing = metricsMap.get(key) || {
              agent: m.agent,
              model: m.model,
              inputTokens: 0,
              outputTokens: 0,
              reasoningTokens: 0,
              cacheTokens: 0,
              cost: 0,
            };
            existing.inputTokens += m.inputTokens;
            existing.outputTokens += m.outputTokens;
            existing.reasoningTokens += m.reasoningTokens;
            existing.cacheTokens += m.cacheTokens;
            existing.cost += m.cost;
            metricsMap.set(key, existing);
          }

          // Aggregate workflow
          for (const agent of subResult.workflow) {
            if (workflow.length === 0 || workflow[workflow.length - 1] !== agent) {
              workflow.push(agent);
            }
          }

          // Aggregate totals
          totalInput += subResult.totals.input;
          totalOutput += subResult.totals.output;
          totalReasoning += subResult.totals.reasoning;
          totalCache += subResult.totals.cache;
          totalCost += subResult.totals.cost;
        }
      }
      continue;
    }

    // If it's a part, only process 'step-finish' type for metrics
    if (row.source === 'part' && data.type !== 'step-finish') {
      continue;
    }

    // Extract Agent: Look for 'agent' key, fallback to 'mode' or message-level info
    let agentName = agentNameOverride || data.agent || data.mode || messageAgents.get(row.message_id) || "unknown";
    if (data.agent || data.mode) {
      messageAgents.set(row.message_id, data.agent || data.mode || "unknown");
    }

    // Extract Model: Look for 'modelID', fallback to 'model.modelID' or message-level info
    const modelId = data.modelID || data.model?.modelID || messageModels.get(row.message_id) || "N/A";
    if (data.modelID || data.model?.modelID) {
      messageModels.set(row.message_id, data.modelID || data.model?.modelID || "N/A");
    }

    // Extract Tokens and Cost
    const tokens = data.tokens || {};
    const input = tokens.input || 0;
    const output = tokens.output || 0;
    const reasoning = tokens.reasoning || 0;
    const cache = (tokens.cache?.read || 0) + (tokens.cache?.write || 0);
    const cost = data.cost || 0;

    // Skip if no meaningful metrics
    if (input === 0 && output === 0 && cost === 0) {
      continue;
    }

    // Avoid double counting: check if we've seen these exact metrics for this message
    const metricsKey = `${row.message_id}:${input}:${output}:${reasoning}:${cache}:${cost.toFixed(10)}`;
    if (seenMetrics.has(metricsKey)) {
      continue;
    }
    seenMetrics.add(metricsKey);

    // Track workflow
    if (workflow.length === 0 || workflow[workflow.length - 1] !== agentName) {
      workflow.push(agentName);
    }

    // Aggregate metrics by agent and model
    const key = `${agentName}:${modelId}`;
    const existing = metricsMap.get(key) || {
      agent: agentName,
      model: modelId,
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      cacheTokens: 0,
      cost: 0,
    };

    existing.inputTokens += input;
    existing.outputTokens += output;
    existing.reasoningTokens += reasoning;
    existing.cacheTokens += cache;
    existing.cost += cost;

    metricsMap.set(key, existing);

    // Global totals
    totalInput += input;
    totalOutput += output;
    totalReasoning += reasoning;
    totalCache += cache;
    totalCost += cost;
  }

  return {
    metricsMap,
    workflow,
    totals: {
      input: totalInput,
      output: totalOutput,
      reasoning: totalReasoning,
      cache: totalCache,
      cost: totalCost,
    },
  };
}

/**
 * Prints a formatted summary of the session metrics.
 */
function printSummary(
  workflow: string[],
  agentMetrics: AgentMetrics[],
  totals: { input: number; output: number; reasoning: number; cache: number; cost: number }
) {
  console.log("\n=== Session Metrics Summary ===");
  console.log(`\nWorkflow: ${workflow.join(" -> ")}`);

  console.log("\n" + "".padEnd(100, "-"));
  console.log(
    `${"Agent".padEnd(20)} | ${"Model".padEnd(30)} | ${"Input".padStart(10)} | ${"Output".padStart(10)} | ${"Cost ($)".padStart(10)}`
  );
  console.log("".padEnd(100, "-"));

  for (const m of agentMetrics) {
    console.log(
      `${m.agent.padEnd(20)} | ${m.model.substring(0, 30).padEnd(30)} | ${m.inputTokens.toString().padStart(10)} | ${m.outputTokens.toString().padStart(10)} | ${m.cost.toFixed(6).padStart(10)}`
    );
  }

  console.log("".padEnd(100, "-"));
  console.log(
    `${"TOTAL".padEnd(53)} | ${totals.input.toString().padStart(10)} | ${totals.output.toString().padStart(10)} | ${totals.cost.toFixed(6).padStart(10)}`
  );
  
  if (totals.reasoning > 0 || totals.cache > 0) {
    console.log("\nAdditional Info:");
    if (totals.reasoning > 0) console.log(`- Total Reasoning Tokens: ${totals.reasoning}`);
    if (totals.cache > 0) console.log(`- Total Cache Tokens: ${totals.cache}`);
  }
  console.log("");
}

analyzeSession();
