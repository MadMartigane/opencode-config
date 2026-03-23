import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
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

const MIGRATION_MAP: Record<string, string> = {
  "rocket_model.txt": "agentic.txt",
  "chatbot_model.txt": "agentic.txt",
  "rocket-review_model.txt": "agentic.txt",
  "code-audit_model.txt": "thinker.txt",
  "architect_model.txt": "thinker.txt",
  "critic-review_model.txt": "thinker.txt",
  "bugfinder_model.txt": "thinker.txt",
  "architect-thinker_model.txt": "thinker.txt",
  "code-only_model.txt": "coder.txt",
  "explore_model.txt": "simple-fast.txt",
  "code-smoke_model.txt": "simple-fast.txt",
  "git-expert_model.txt": "simple-fast.txt",
  "router-review_model.txt": "simple-fast.txt",
};

function resolveConfigPath(relativePath: string): string {
  const normalized = relativePath.startsWith("./") ? relativePath.slice(2) : relativePath;
  return join(CONFIG_ROOT_DIR, normalized);
}

function extractAllFileReferences(configContent: string): string[] {
  const regex = /\{file:(\.\/[^}]+)\}/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(configContent)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)];
}

function extractUniqueRoles(configContent: string): string[] {
  const regex = /\{file:\.\/models\/(.+?)\.txt\}/g;
  const roles = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(configContent)) !== null) {
    roles.add(match[1]);
  }
  return Array.from(roles);
}

function migrateOldAgentSpecificPaths(configContent: string): string {
  let updatedContent = configContent;
  let hasChanges = false;

  for (const [oldFile, newFile] of Object.entries(MIGRATION_MAP)) {
    const oldPath = `./models/${oldFile}`;
    const newPath = `./models/${newFile}`;
    if (updatedContent.includes(oldPath)) {
      const escapedOldPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedOldPath, 'g');
      updatedContent = updatedContent.replace(regex, newPath);
      hasChanges = true;
      console.log(`🔄 Migrated config: ${oldPath} -> ${newPath}`);
    }
  }

  if (hasChanges) {
    writeFileSync(CONFIG_PATH, updatedContent);
    console.log("✅ opencode.jsonc updated with new role-based paths.");
  }

  return updatedContent;
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
  roles: string[],
  presets: Record<string, Record<string, string>>,
) {
  const currentConfig: Record<string, string> = {};
  for (const role of roles) {
    const filePath = join(MODELS_DIR, `${role}.txt`);
    if (existsSync(filePath)) {
      currentConfig[role] = readFileSync(filePath, "utf-8").trim();
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

function migratePreset(preset: Record<string, string>, agentsList: Record<string, any>): Record<string, string> {
  const roleMapping: Record<string, string> = {};
  for (const [agentName, agent] of Object.entries(agentsList)) {
    const roleMatch = agent.model?.match(/\{file:\.\/models\/(.+?)\.txt\}/);
    if (roleMatch) {
      roleMapping[agentName] = roleMatch[1];
    }
  }

  const newPreset: Record<string, string> = {};
  let migrated = false;

  for (const [key, value] of Object.entries(preset)) {
    if (roleMapping[key]) {
      const role = roleMapping[key];
      if (!newPreset[role]) {
        newPreset[role] = value;
        migrated = true;
      }
    } else {
      newPreset[key] = value;
    }
  }

  if (migrated) {
    console.log("🔄 Migrated legacy preset mapping to roles.");
  }
  return newPreset;
}

function sanitizePresetAgainstConfig(
  preset: Record<string, string>,
  roles: string[]
): { sanitized: Record<string, string>; removed: string[]; missing: string[] } {
  const sanitized: Record<string, string> = {};
  const removed: string[] = [];
  const missing: string[] = [];

  for (const roleName of Object.keys(preset)) {
    if (roles.includes(roleName)) {
      sanitized[roleName] = preset[roleName];
    } else {
      removed.push(roleName);
    }
  }

  for (const roleName of roles) {
    if (!preset[roleName]) {
      missing.push(roleName);
    }
  }

  return { sanitized, removed, missing };
}

async function loadPreset(
  rl: Interface,
  presets: Record<string, Record<string, string>>,
  roles: string[],
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
  let rawPreset = presets[selectedName];

  // Try migrating if it looks like an old preset (contains agent names not in roles)
  const needsMigration = Object.keys(rawPreset).some(key => !roles.includes(key));
  if (needsMigration) {
    rawPreset = migratePreset(rawPreset, agentsList);
    presets[selectedName] = rawPreset;
    savePresetsFile(presets);
  }

  const { sanitized, removed, missing } = sanitizePresetAgainstConfig(rawPreset, roles);

  if (removed.length > 0) {
    console.warn(`⚠️ Preset contains unknown roles (skipped): ${removed.join(", ")}`);
  }

  if (missing.length > 0) {
    console.info(`ℹ️ Roles not in preset (skipped): ${missing.join(", ")}`);
  }

  for (const [roleName, modelName] of Object.entries(sanitized)) {
    const filePath = join(MODELS_DIR, `${roleName}.txt`);
    writeFileSync(filePath, modelName);
    console.log(`✅ Applied: ${modelName} -> ${roleName}`);
  }

  console.log("\n✨ Preset loaded and applied!");
}

function applyGlobalOverride(modelName: string, roles: string[]): void {
  for (const roleName of roles) {
    const filePath = join(MODELS_DIR, `${roleName}.txt`);
    writeFileSync(filePath, modelName);
    console.log(`✅ Updated ${roleName}: ${modelName}`);
  }
}

function getModelFileName(agent: any): string | null {
  const match = agent.model?.match(/\{file:\.\/models\/(.+?)\}/);
  return match ? match[1] : null;
}

function displayCurrentConfigurations(agentsList: Record<string, any>) {
  console.log("\n📋 Current Model Configurations:");
  console.log("=".repeat(85));
  console.log("Agent Name".padEnd(20) + "Role".padEnd(15) + "Type".padEnd(15) + "Current Model");
  console.log("-".repeat(85));

  for (const [agentName, agent] of Object.entries(agentsList)) {
    const type = agent.mode === "subagent" ? "subagent" : "primary";
    const emoji = type === "primary" ? "🟢" : "🔵";

    // Get role from model path
    const roleMatch = agent.model?.match(/\{file:\.\/models\/(.+?)\.txt\}/);
    const role = roleMatch ? roleMatch[1] : "N/A";

    // Get current model
    const fileName = getModelFileName(agent);
    let currentModel = "N/A";
    if (fileName) {
      const filePath = join(MODELS_DIR, fileName);
      if (existsSync(filePath)) {
        currentModel = readFileSync(filePath, "utf-8").trim();
      }
    }

    console.log(`${emoji} ${agentName.padEnd(18)} ${role.padEnd(13)} ${type.padEnd(13)} ${currentModel}`);
  }

  console.log("=".repeat(85));
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

function parseAgentsFromConfig(configContent: string): Record<string, any> {
  const config = parse(configContent);
  return config.agent;
}

function parseAgentsFromConfigFile(): Record<string, any> {
  const configContent = readFileSync(CONFIG_PATH, "utf-8");
  return parseAgentsFromConfig(configContent);
}

function cleanOrphanedModelFiles(roles: string[]): void {
  const referencedFiles = new Set(roles.map(r => `${r}.txt`));

  const allFiles = readdirSync(MODELS_DIR, { withFileTypes: true });
  for (const file of allFiles) {
    if (!file.isFile() || !file.name.endsWith(".txt")) {
      continue;
    }

    // Explicitly exclude the backup directory and any backup-prefixed entries
    if (file.name === "backup" || file.name.startsWith("backup")) {
      continue;
    }

    if (!referencedFiles.has(file.name)) {
      const filePath = join(MODELS_DIR, file.name);
      unlinkSync(filePath);
      console.log(`🗑️ Deleted orphaned model file: ${file.name}`);
    }
  }
}

function initializeConfigAndModels(): { roles: string[], agentsList: Record<string, any> } {
  let configContent = readFileSync(CONFIG_PATH, "utf-8");
  configContent = migrateOldAgentSpecificPaths(configContent);
  
  const allFileRefs = extractAllFileReferences(configContent);
  const managedFiles = filterManagedFiles(allFileRefs);
  ensureDirectoriesExist(managedFiles);
  ensureFilesExist(managedFiles);

  if (!existsSync(MODELS_DIR)) {
    mkdirSync(MODELS_DIR, { recursive: true });
  }

  const roles = extractUniqueRoles(configContent);
  const agentsList = parseAgentsFromConfigFile();
  cleanOrphanedModelFiles(roles);

  return { roles, agentsList };
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

async function promptRoleSelection(rl: Interface, roles: string[]): Promise<string> {
  const choices = [...roles, "global", "save-preset", "load-preset", "exit"];
  const displayItems = [
    ...roles.map(r => `🎭 role: ${r}`),
    "🌍 global override (all roles)",
    "💾 save current config as preset",
    "📥 load preset",
    "❌ exit"
  ];
  const message = "Select a role to configure or manage presets:";
  const selection = await promptUserSelection(rl, choices, message, displayItems);
  if (selection === "exit") {
    console.log("Goodbye! Have a great day!");
    rl.close();
    process.exit(0);
  }
  return selection;
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

async function interactiveSetupModels() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const { roles, agentsList } = initializeConfigAndModels();
    displayCurrentConfigurations(agentsList);

    const selection = await promptRoleSelection(rl, roles);

    if (selection === "save-preset") {
      const presets = loadPresetsFile();
      await saveCurrentConfigAsPreset(rl, roles, presets);
      console.log("\n✨ Configuration completed!");
      return;
    }

    if (selection === "load-preset") {
      const presets = loadPresetsFile();
      if (Object.keys(presets).length === 0) {
        console.log("No presets available.");
        return;
      }
      await loadPreset(rl, presets, roles, agentsList);
      console.log("\n✨ Configuration completed!");
      return;
    }

    if (selection === "global") {
      const model = await promptModelSelection(rl);
      if (model === null) {
        console.log("No model selected.");
        return;
      }
      applyGlobalOverride(model, roles);
      console.log("\n✨ Configuration completed!");
      return;
    }

    // Role selection
    const model = await promptModelSelection(rl);
    if (model === null) {
      console.log("No model selected.");
      return;
    }

    const filePath = join(MODELS_DIR, `${selection}.txt`);
    writeFileSync(filePath, model);
    console.log(`✅ Saved: ${model} -> ${filePath}`);
    console.log("\n✨ Configuration completed!");
  } finally {
    rl.close();
  }
}

interactiveSetupModels().catch(console.error);
