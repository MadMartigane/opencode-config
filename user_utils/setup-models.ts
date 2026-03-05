import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createInterface, type Interface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parse } from 'jsonc-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_ROOT_DIR = dirname(__dirname);
const CONFIG_PATH = join(CONFIG_ROOT_DIR, "opencode.jsonc");
const MODELS_DIR = join(CONFIG_ROOT_DIR, "models");
const PRESETS_PATH = join(__dirname, "model-presets.json");

function resolveConfigPath(relativePath: string): string {
  const normalized = relativePath.startsWith("./") ? relativePath.slice(2) : relativePath;
  return join(CONFIG_ROOT_DIR, normalized);
}

function extractAllFileReferences(configContent: string): string[] {
  const regex = /\{file:(\.\/[^}]+)\}/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(configContent)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)];
}

function filterManagedFiles(filePaths: string[]): string[] {
  return filePaths.filter(
    (path) => (path.startsWith("./keys/") || path.startsWith("./models/")) && !path.startsWith("./prompts/")
  );
}

function ensureDirectoriesExist(filePaths: string[]): void {
  const directories = new Set<string>();
  for (const filePath of filePaths) {
    const absolutePath = resolveConfigPath(filePath);
    const dir = dirname(absolutePath);
    if (dir && dir !== ".") {
      directories.add(dir);
    }
  }
  for (const dir of directories) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }
}

function ensureFilesExist(filePaths: string[]): void {
  for (const filePath of filePaths) {
    const absolutePath = resolveConfigPath(filePath);
    if (!existsSync(absolutePath)) {
      let content = "";
      if (filePath.startsWith("./models/") && filePath.endsWith(".txt")) {
        content = "opencode/kimi-k2.5";
      } else if (filePath.startsWith("./keys/") && filePath.endsWith(".txt")) {
        content = "";
      }
      writeFileSync(absolutePath, content);
      console.log(`📝 Created file: ${filePath}`);
    }
  }
}

function loadPresetsFile(): Record<string, Record<string, string>> {
  if (!existsSync(PRESETS_PATH)) {
    return {};
  }
  try {
    const content = readFileSync(PRESETS_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("⚠️ Error parsing presets file, returning empty object.");
    return {};
  }
}

function savePresetsFile(presets: Record<string, Record<string, string>>) {
  try {
    writeFileSync(PRESETS_PATH, JSON.stringify(presets, null, 2));
  } catch (error) {
    console.error("❌ Error saving presets file:", error);
  }
}

async function saveCurrentConfigAsPreset(
  rl: Interface,
  agentsList: Record<string, any>,
  presets: Record<string, Record<string, string>>,
) {
  const currentConfig: Record<string, string> = {};
  for (const [agentName, agent] of Object.entries(agentsList)) {
    const fileName = getModelFileName(agent);
    if (!fileName) continue;

    const filePath = join(MODELS_DIR, fileName);
    if (existsSync(filePath)) {
      currentConfig[agentName] = readFileSync(filePath, "utf-8").trim();
    }
  }

  const presetNames = Object.keys(presets);

  if (presetNames.length > 0) {
    const action = await promptUserSelection(
      rl,
      ["new", "update"],
      "Do you want to create a new preset or update an existing one?",
      ["📝 create new preset", "✏️ update existing preset"]
    );

    if (action === "new") {
      const presetName = await promptForPresetName(rl, presets);
      if (!presetName) return;
      presets[presetName] = currentConfig;
      savePresetsFile(presets);
      console.log(`✅ Preset saved: ${presetName}`);
    } else {
      const selectedName = await promptUserSelection(rl, presetNames, "Select a preset to update:");
      const confirm = await rl.question(`Update preset "${selectedName}"? (yes/no): `);

      if (confirm.toLowerCase() === "yes" || confirm.toLowerCase() === "y") {
        presets[selectedName] = currentConfig;
        savePresetsFile(presets);
        console.log(`✅ Preset updated: ${selectedName}`);
      } else {
        console.log("Update cancelled.");
      }
    }
  } else {
    const presetName = await promptForPresetName(rl, presets);
    if (!presetName) return;
    presets[presetName] = currentConfig;
    savePresetsFile(presets);
    console.log(`✅ Preset saved: ${presetName}`);
  }
}

async function promptForPresetName(
  rl: Interface,
  presets: Record<string, Record<string, string>>
): Promise<string | null> {
  const presetName = await rl.question("Enter preset name: ");

  if (!presetName.trim()) {
    console.log("❌ Invalid preset name.");
    return null;
  }

  if (presets[presetName.trim()]) {
    console.log(`⚠️ Preset "${presetName.trim()}" already exists. Use the update option to modify it.`);
    return null;
  }

  return presetName.trim();
}

function getTopModelsInPreset(preset: Record<string, string>): Array<{ model: string; count: number }> {
  const modelCounts: Record<string, number> = {};

  for (const model of Object.values(preset)) {
    modelCounts[model] = (modelCounts[model] || 0) + 1;
  }

  return Object.entries(modelCounts)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

async function loadPreset(
  rl: Interface,
  presets: Record<string, Record<string, string>>,
  agentsList: Record<string, any>,
) {
  const presetNames = Object.keys(presets);
  if (presetNames.length === 0) {
    console.log("No presets available");
    return;
  }

  const displayItems = presetNames.map(name => {
    const topModels = getTopModelsInPreset(presets[name]);
    const modelStr = topModels.map(m => `${m.model}: ${m.count}x`).join(", ");
    return `${name} (${modelStr})`;
  });

  const selectedName = await promptUserSelection(rl, presetNames, "Select a preset to load:", displayItems);
  const preset = presets[selectedName];

  for (const [agentName, modelName] of Object.entries(preset)) {
    const agent = agentsList[agentName];
    if (!agent) {
      console.warn(`⚠️ Agent ${agentName} not found in current config, skipping.`);
      continue;
    }

    const fileName = getModelFileName(agent);
    if (!fileName) continue;

    const filePath = join(MODELS_DIR, fileName);
    writeFileSync(filePath, modelName);
    console.log(`✅ Applied: ${modelName} -> ${agentName}`);
  }

  console.log("\n✨ Preset loaded and applied!");
}

function applyGlobalOverride(modelName: string, agentsList: Record<string, any>): void {
  for (const [agentName, agent] of Object.entries(agentsList)) {
    const fileName = getModelFileName(agent);
    if (fileName) {
      const filePath = join(MODELS_DIR, fileName);
      writeFileSync(filePath, modelName);
      console.log(`✅ Updated ${agentName}: ${modelName}`);
    }
  }
}

function getModelFileName(agent: any): string | null {
  const match = agent.model?.match(/\{file:\.\/models\/(.+?)\}/);
  return match ? match[1] : null;
}

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
  rl: Interface,
  choices: string[],
  message?: string,
  displayItems?: string[],
): Promise<string> {
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
      return choices[index];
    }
    console.log("Invalid selection, please try again.");
  }
}

async function promptAgentType(rl: Interface): Promise<string> {
  const choices = ["primary", "subagent", "global", "save-preset", "load-preset", "exit"];
  const displayItems = [
    "🟢 primary agent",
    "🔵 subagent",
    "🌍 global override (all agents)",
    "💾 save current config as preset",
    "📥 load preset",
    "❌ exit"
  ];
  const message = "Do you want to configure a primary agent, a subagent, or manage presets?";
  const selection = await promptUserSelection(rl, choices, message, displayItems);
  if (selection === "exit") {
    console.log("Goodbye! Have a great day!");
    rl.close();
    process.exit(0);
  }
  return selection;
}

async function promptSpecificAgent(rl: Interface, agentType: string, agentsList: Record<string, any>): Promise<string> {
  const primaries = Object.keys(agentsList).filter(name => agentsList[name].mode !== "subagent");
  const subagents = Object.keys(agentsList).filter(name => agentsList[name].mode === "subagent");
  if (agentType === "subagent") {
    return await promptUserSelection(rl, subagents, "Select a subagent:");
  } else {
    return await promptUserSelection(rl, primaries, "Select a primary agent:");
  }
}

async function promptModelSelection(rl: Interface): Promise<string | null> {
  const availableModels = getAvailableModels();

  if (availableModels.size === 0) {
    console.log("No models available.");
    return null;
  }

  const modelsArray = Array.from(availableModels).sort((a, b) =>
    a.localeCompare(b),
  );
  const message = "Select a model:";

  return await promptUserSelection(rl, modelsArray, message);
}

function initializeConfigAndModels(): Record<string, any> {
  const configContent = readFileSync(CONFIG_PATH, "utf-8");
  const allFileRefs = extractAllFileReferences(configContent);
  const managedFiles = filterManagedFiles(allFileRefs);
  ensureDirectoriesExist(managedFiles);
  ensureFilesExist(managedFiles);

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
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const agentsList = initializeConfigAndModels();
    displayCurrentConfigurations(agentsList);

    const agentType = await promptAgentType(rl);

    if (agentType === "save-preset") {
      const presets = loadPresetsFile();
      await saveCurrentConfigAsPreset(rl, agentsList, presets);
      console.log("\n✨ Configuration completed!");
      return;
    }

    if (agentType === "load-preset") {
      const presets = loadPresetsFile();
      if (Object.keys(presets).length === 0) {
        console.log("No presets available.");
        return;
      }
      await loadPreset(rl, presets, agentsList);
      console.log("\n✨ Configuration completed!");
      return;
    }

    if (agentType === "global") {
      const model = await promptModelSelection(rl);
      if (model === null) {
        console.log("No model selected.");
        return;
      }
      applyGlobalOverride(model, agentsList);
      console.log("\n✨ Configuration completed!");
      return;
    }

    const specificAgent = await promptSpecificAgent(rl, agentType, agentsList);
    const model = await promptModelSelection(rl);
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
  } finally {
    rl.close();
  }
}

interactiveSetupModels().catch(console.error);
