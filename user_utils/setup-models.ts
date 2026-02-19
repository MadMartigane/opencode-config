import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parse } from 'jsonc-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_ROOT_DIR = dirname(__dirname);
const CONFIG_PATH = join(CONFIG_ROOT_DIR, "opencode.jsonc");
const MODELS_DIR = join(CONFIG_ROOT_DIR, "models");

function getModelFileName(agent: any): string | null {
  const match = agent.model?.match(/\{file:\.\/models\/(.+?)\}/);
  return match ? match[1] : null;
}

const VALID_PROFILES = [
  "github-flash",
  "github-Grok",
  "github-claude",
  "ovh-qwen",
  "github-gpt",
  "OpenCode-Kimi-K2",
  "OpenCode-GLM-4.7",
  "OpenCode-Free",
];

const MODEL_PROFILES = {
  "github-flash": {
    description:
      "GitHub fast models: gemini-3-flash-preview for primary agents, grok-code-fast-1 for subagents",
    primaryModel: "github-copilot/gemini-3-flash-preview",
    subagentModel: "github-copilot/grok-code-fast-1",
  },
  "github-Grok": {
    description: "GitHub fastest model: grok-code-fast-1",
    primaryModel: "github-copilot/grok-code-fast-1",
    subagentModel: "github-copilot/grok-code-fast-1",
  },
  "github-claude": {
    description:
      "GitHub Claude models: Opus 4.6 for primary agents, Haiku 4.5 for subagents",
    primaryModel: "github-copilot/claude-opus-4.6",
    subagentModel: "github-copilot/claude-haiku-4.5",
  },
  "ovh-qwen": {
    description: "OVH Qwen3-Coder model for all agents and subagents",
    primaryModel: "ovh-ai-internal/Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8",
    subagentModel: "ovh-ai-internal/Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8",
  },
  "github-gpt": {
    description:
      "GitHub GPT models: gpt-5.2-codex for primary agents, gpt-5.1-codex-mini for subagents",
    primaryModel: "github-copilot/gpt-5.2-codex",
    subagentModel: "github-copilot/gpt-5.1-codex-mini",
  },
  "OpenCode-Kimi-K2": {
    description:
      "OpenCode models: kimi-k2.5 for primary agents, minimax-m2.1 for subagents",
    primaryModel: "opencode/kimi-k2.5",
    subagentModel: "opencode/minimax-m2.1",
  },
  "OpenCode-GLM-4.7": {
    description:
      "OpenCode models: GLM 4.7 for primary agents, minimax-m2.1 for subagents",
    primaryModel: "opencode/glm-4.7",
    subagentModel: "opencode/minimax-m2.1",
  },
  "OpenCode-Free": {
    description: "OpenCode models: Current best Free model",
    primaryModel: "opencode/minimax-free",
    subagentModel: "opencode/minimax-free",
  },
};

function displayCurrentConfigurations(agentsList: Record<string, any>) {

  console.log("\n📋 Current Model Configurations:");
  console.log("=".repeat(70));
  console.log("Agent Name".padEnd(20) + "Type".padEnd(15) + "Current Model");
  console.log("-".repeat(70));

  for (const [agentName, agent] of Object.entries(agentsList)) {
    const type = agent.mode === "subagent" ? "subagent" : "primary";
    const emoji = type === "primary" ? "🟢" : "🔵";

    // Get current model
    const fileName = getModelFileName(agent);
    let currentModel = "N/A";
    if (fileName) {
      const filePath = join(MODELS_DIR, fileName);
      if (existsSync(filePath)) {
        currentModel = readFileSync(filePath, "utf-8").trim();
      }
    }

    console.log(`${emoji} ${agentName.padEnd(18)} ${type.padEnd(13)} ${currentModel}`);
  }

  console.log("=".repeat(70));
  console.log();
}

function getAvailableModels(): Set<string> {
  try {
    const output = execSync("opencode models", { encoding: "utf-8" });
    return new Set(
      output
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    );
  } catch (error) {
    console.warn(
      "⚠️ Could not fetch available models, assuming all are unavailable",
    );
    return new Set<string>();
  }
}

function isModelAvailable(
  modelName: string,
  availableModels: Set<string>,
): boolean {
  return availableModels.has(modelName);
}

function findLatestFreeModel(availableModels: Set<string>): string | null {
  const filtered = Array.from(availableModels).filter(
    (model) => model.startsWith("opencode/") && model.endsWith("-free"),
  );

  if (filtered.length === 0) {
    return null;
  }

  filtered.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  return filtered[filtered.length - 1];
}

function getProfileAvailabilityStatus(
  profileKey: string,
  profile: { primaryModel: string; subagentModel: string },
  availableModels: Set<string>,
): { isAvailable: boolean; status: string } {
  const primaryAvailable = isModelAvailable(
    profile.primaryModel,
    availableModels,
  );
  const subagentAvailable = isModelAvailable(
    profile.subagentModel,
    availableModels,
  );

  if (profileKey === "OpenCode-Free") {
    if (primaryAvailable && subagentAvailable) {
      return { isAvailable: true, status: "✅ available" };
    }
    const fallback = findLatestFreeModel(availableModels);
    if (fallback !== null) {
      return { isAvailable: true, status: "✅ available (fallback)" };
    }
    return {
      isAvailable: false,
      status: "⚠️ unavailable (no free models)",
    };
  }

  const isAvailable = primaryAvailable && subagentAvailable;
  const status = isAvailable ? "✅ available" : "⚠️ unavailable";

  return { isAvailable, status };
}

function parseAgentsFromConfig(configContent: string): Record<string, any> {
  const config = parse(configContent);
  return config.agent;
}

function parseAgentsFromConfigFile(): Record<string, any> {
  const configContent = readFileSync(CONFIG_PATH, "utf-8");
  return parseAgentsFromConfig(configContent);
}

function findClosingBrace(str: string, start: number): number {
  let count = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === "{") count++;
    else if (str[i] === "}") {
      count--;
      if (count === 0) return i;
    }
  }
  return -1;
}

function individualizeSharedModelFiles(agentsList: Record<string, any>) {
  const fileToAgents: Record<string, string[]> = {};
  for (const [agentName, agent] of Object.entries(agentsList)) {
    const fileName = getModelFileName(agent);
    if (fileName) {
      if (!fileToAgents[fileName]) fileToAgents[fileName] = [];
      fileToAgents[fileName].push(agentName);
    }
  }
  for (const [fileName, agents] of Object.entries(fileToAgents)) {
    if (agents.length > 1) {
      const originalPath = join(MODELS_DIR, fileName);
      if (existsSync(originalPath)) {
        const content = readFileSync(originalPath, "utf-8");
        for (const agentName of agents) {
          const newFileName = `${agentName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_model.txt`;
          const newPath = join(MODELS_DIR, newFileName);
          writeFileSync(newPath, content);
          agentsList[agentName].model = `{file:./models/${newFileName}}`;
        }
      } else {
        console.warn(`⚠️ Original model file ${originalPath} not found, skipping individualization for ${agents.join(", ")}`);
      }
    }
  }
}

function updateConfigWithIndividualFiles(agentsList: Record<string, any>) {
  let configContent = readFileSync(CONFIG_PATH, "utf-8");
  const agentStart = configContent.indexOf('"agent": {');
  if (agentStart === -1) {
    console.error("❌ Could not find \"agent\": { in config");
    return;
  }
  const braceStart = agentStart + '"agent": {'.length - 1;
  const agentEnd = findClosingBrace(configContent, braceStart);
  if (agentEnd === -1) {
    console.error("❌ Could not find matching brace for agent section");
    return;
  }
  const before = configContent.substring(0, agentStart);
  const after = configContent.substring(agentEnd + 1);
  const newAgent = JSON.stringify(agentsList, null, 2);
  const updated = before + '"agent": ' + newAgent + after;
  writeFileSync(CONFIG_PATH, updated);
}

async function promptUserSelection(
  choices: string[],
  message?: string,
  displayItems?: string[],
): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\n${message}`);
  const itemsToDisplay = displayItems || choices;
  itemsToDisplay.forEach((choice, index) => {
    console.log(`${index + 1}. ${choice}`);
  });

  while (true) {
    const answer = await rl.question(
      `Select an option (1-${choices.length}): `,
    );
    const index = parseInt(answer) - 1;
    if (index >= 0 && index < choices.length) {
      rl.close();
      return choices[index];
    }
    console.log("Invalid selection, please try again.");
  }
}

async function promptAgentType(): Promise<string> {
  const choices = ["primary", "subagent", "global", "restore", "exit"];
  const displayItems = ["primary agent", "subagent", "global override", "restore from backup", "exit"];
  const message = "Do you want to configure a primary agent, a subagent, global override, restore from backup, or exit?";
  const selection = await promptUserSelection(choices, message, displayItems);
  if (selection === "exit") {
    console.log("Goodbye! Have a great day!");
    process.exit(0);
  }
  return selection;
}

async function promptSpecificAgent(agentType: string, agentsList: Record<string, any>): Promise<string> {
  const primaries = Object.keys(agentsList).filter(name => agentsList[name].mode !== "subagent");
  const subagents = Object.keys(agentsList).filter(name => agentsList[name].mode === "subagent");
  if (agentType === "subagent") {
    return await promptUserSelection(subagents, "Select a subagent:");
  } else {
    return await promptUserSelection(primaries, "Select a primary agent:");
  }
}

async function promptModelSelection(): Promise<string | null> {
  const availableModels = getAvailableModels();

  if (availableModels.size === 0) {
    console.log("No models available.");
    return null;
  }

  const modelsArray = Array.from(availableModels).sort((a, b) =>
    a.localeCompare(b),
  );
  const message = "Select a model:";

  return await promptUserSelection(modelsArray, message);
}

function initializeConfigAndModels(): Record<string, any> {
  if (!existsSync(MODELS_DIR)) {
    mkdirSync(MODELS_DIR, { recursive: true });
  }

  const agentsList = parseAgentsFromConfigFile();
  individualizeSharedModelFiles(agentsList);
  updateConfigWithIndividualFiles(agentsList);

  return agentsList;
}

function prepareModelSetup(): { modelFiles: Set<string>, availableModels: Set<string> } | null {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`❌ opencode.jsonc non trouvé à: ${CONFIG_PATH}`);
    return null;
  }

  initializeConfigAndModels();

  const agentsList = parseAgentsFromConfigFile();

  const modelFiles = new Set<string>();

  for (const [agentName, agent] of Object.entries(agentsList)) {

    const fileName = getModelFileName(agent);

    if (fileName) modelFiles.add(fileName);

  }

  if (modelFiles.size === 0) {
    console.log("❌ Aucun fichier de modèle trouvé dans opencode.jsonc");
    return null;
  }

  const availableModels = getAvailableModels();

  return { modelFiles, availableModels };
}

function writeProfileToModelFiles(modelFiles: Set<string>, profile: { primaryModel: string; subagentModel: string }, agentsList: Record<string, any>) {
  const fileToAgent: Record<string, any> = {};
  for (const [agentName, agent] of Object.entries(agentsList)) {
    const fileName = getModelFileName(agent);
    if (fileName) {
      fileToAgent[fileName] = agent;
    }
  }

  for (const fileName of modelFiles) {
    const agent = fileToAgent[fileName];
    const isSubagent = agent && agent.mode === 'subagent';

    const modelName = isSubagent
      ? profile.subagentModel
      : profile.primaryModel;

    const filePath = join(MODELS_DIR, fileName);
    writeFileSync(filePath, modelName);
    console.log(`✅ Saved: ${modelName} -> ${filePath}`);
  }

  console.log("\n✨ Configuration completed!");
}

async function interactiveSetupModels() {
  const agentsList = initializeConfigAndModels();
  displayCurrentConfigurations(agentsList);

  const agentType = await promptAgentType();

  if (agentType === "global") {
    backupCurrentModelsIfHeterogeneous(agentsList);
    const model = await promptModelSelection();
    if (model === null) {
      console.log("No model selected.");
      return;
    }
    applyGlobalOverride(model, agentsList);
    console.log(`✅ Global override applied: ${model} to all agents`);
    console.log("\n✨ Configuration completed!");
    return;
  }

  if (agentType === "restore") {
    restoreFromBackup(agentsList, MODELS_DIR);
    return;
  }

  const specificAgent = await promptSpecificAgent(agentType, agentsList);
  const model = await promptModelSelection();
  if (model === null) {
    console.log("No model selected.");
    return;
  }

  const fileName = getModelFileName(agentsList[specificAgent]);
  if (!fileName) {
    console.error(`❌ No model file found for ${specificAgent}`);
    return;
  }

  const filePath = join(MODELS_DIR, fileName);
  writeFileSync(filePath, model);
  console.log(`✅ Saved: ${model} -> ${filePath}`);
  console.log("\n✨ Configuration completed!");
}

function applyFreeProfileFallback(profile: { primaryModel: string; subagentModel: string }, availableModels: Set<string>) {
  const primaryAvailable = isModelAvailable(profile.primaryModel, availableModels);
  const subagentAvailable = isModelAvailable(profile.subagentModel, availableModels);
  if (!primaryAvailable || !subagentAvailable) {
    const fallback = findLatestFreeModel(availableModels);
    if (fallback !== null) {
      profile.primaryModel = fallback;
      profile.subagentModel = fallback;
    }
  }
}


// Vérifier si un profil est passé en argument de ligne de commande
const args = process.argv.slice(2);
if (args.length > 0) {
  const profileArg = args[0];
  if (VALID_PROFILES.includes(profileArg)) {
    // Si un profil valide est passé, l'utiliser directement
    applyProfile(profileArg);
  } else {
    console.log(`Invalid profile: ${profileArg}`);
    console.log(
      `Available profiles: ${VALID_PROFILES.join(", ")}`,
    );
    process.exit(1);
  }
} else {
  // Sinon, utiliser l'interaction utilisateur normale
  interactiveSetupModels().catch(console.error);
}

async function applyProfile(profileName: string) {
  const prep = prepareModelSetup();
  if (!prep) return;
  const { modelFiles, availableModels } = prep;

  const agentsList = parseAgentsFromConfigFile();

  const selectedProfile =
    MODEL_PROFILES[profileName as keyof typeof MODEL_PROFILES];
  if (profileName === "OpenCode-Free") {
    applyFreeProfileFallback(selectedProfile, availableModels);
  }

  console.log(`\n🔍 Found ${availableModels.size} available models`);
  const { status } = getProfileAvailabilityStatus(
    profileName,
    selectedProfile,
    availableModels,
  );
  console.log(
    `🔧 Applying profile: ${profileName} (non-interactive mode) [${status}]`,
  );

  writeProfileToModelFiles(modelFiles, selectedProfile, agentsList);
}

function isConfigurationHeterogeneous(agentsList: Record<string, any>): boolean {
  const models = new Set<string>();

  for (const [agentName, agent] of Object.entries(agentsList)) {
    const fileName = getModelFileName(agent);
    if (!fileName) {
      return true;
    }
    const filePath = join(MODELS_DIR, fileName);
    if (!existsSync(filePath)) {
      return true;
    }
    const content = readFileSync(filePath, "utf-8").trim();
    models.add(content);
  }

  return models.size > 1;
}

function backupCurrentModelsIfHeterogeneous(agentsList: Record<string, any>): void {
  if (!isConfigurationHeterogeneous(agentsList)) {
    console.log("Backup skipped: Configuration is homogeneous.");
    return;
  }

  const backupDir = join(MODELS_DIR, 'backup');
  mkdirSync(backupDir, { recursive: true });

  for (const [agentName, agent] of Object.entries(agentsList)) {
    const fileName = getModelFileName(agent);
    if (fileName) {
      const srcPath = join(MODELS_DIR, fileName);
      const destPath = join(backupDir, fileName);
      if (existsSync(srcPath)) {
        const content = readFileSync(srcPath, 'utf-8');
        writeFileSync(destPath, content);
      }
    }
  }

  console.log("Backup created: All model files copied to models/backup/");
}

function applyGlobalOverride(modelName: string, agentsList: Record<string, any>): void {
  for (const [agentName, agent] of Object.entries(agentsList)) {
    const fileName = getModelFileName(agent);
    if (fileName) {
      const filePath = join(MODELS_DIR, fileName);
      writeFileSync(filePath, modelName);
      console.log(`Updated ${filePath} with ${modelName}`);
    }
  }
}

function restoreFromBackup(agentsList: Record<string, any>, modelsDir: string): void {
  const backupDir = join(modelsDir, 'backup');
  if (!existsSync(backupDir)) {
    console.log("No backup found");
    return;
  }
  try {
    const files = readdirSync(backupDir).filter(file => file.endsWith('.txt'));
    for (const file of files) {
      const srcPath = join(backupDir, file);
      const destPath = join(modelsDir, file);
      const content = readFileSync(srcPath, 'utf-8');
      writeFileSync(destPath, content);
      console.log(`Restored: ${file}`);
    }
    console.log("Restore completed successfully");
  } catch (error) {
    console.error("Error during restore:", error);
  }
}
