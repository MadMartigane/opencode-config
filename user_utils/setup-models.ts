import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

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
    console.warn("⚠️ Could not fetch available models, assuming all are unavailable");
    return new Set<string>();
  }
}

function isModelAvailable(modelName: string, availableModels: Set<string>): boolean {
  return availableModels.has(modelName);
}

function getProfileAvailabilityStatus(
  profile: { primaryModel: string; subagentModel: string },
  availableModels: Set<string>,
): { isAvailable: boolean; status: string } {
  const primaryAvailable = isModelAvailable(profile.primaryModel, availableModels);
  const subagentAvailable = isModelAvailable(profile.subagentModel, availableModels);
  
  const isAvailable = primaryAvailable && subagentAvailable;
  const status = isAvailable ? "✅ available" : "⚠️ unavailable";
  
  return { isAvailable, status };
}

async function select(message: string, choices: string[], displayItems?: string[]): Promise<string> {
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

// Profils prédéfinis avec leurs modèles associés
const MODEL_PROFILES = {
  "github-flash": {
    description:
      "GitHub fast models: gemini-3-flash-preview for primary agents, grok-code-fast-1 for subagents",
    primaryModel: "github-copilot/gemini-3-flash-preview",
    subagentModel: "github-copilot/grok-code-fast-1",
  },
  "github-Grok": {
    description:
      "GitHub fastest model: grok-code-fast-1",
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
    description:
      "OpenCode models: Current Free for primary agents, big-pickle for subagents",
    primaryModel: "opencode/minimax-m2.5-free",
    subagentModel: "opencode/big-pickle",
  },
};

async function setupModels() {
  const configRootDir = dirname(dirname(__filename));
  const configPath = join(configRootDir, "opencode.jsonc");
  const modelsDir = join(configRootDir, "models");

  if (!existsSync(configPath)) {
    console.error(`❌ opencode.jsonc non trouvé à: ${configPath}`);
    return;
  }

  if (!existsSync(modelsDir)) {
    mkdirSync(modelsDir, { recursive: true });
  }

  // 1. Lire opencode.jsonc et extraire les fichiers de modèles
  const configContent = readFileSync(configPath, "utf-8");
  const modelFileRegex = /"{file:\.\/models\/(.+?)}"/g;
  const modelFiles = new Set<string>();
  let match: RegExpExecArray | null;

  while (true) {
    match = modelFileRegex.exec(configContent);
    if (match === null) break;
    modelFiles.add(match[1]);
  }

  if (modelFiles.size === 0) {
    console.log("❌ Aucun fichier de modèle trouvé dans opencode.jsonc");
    return;
  }

  // 2. Récupérer les modèles disponibles et préparer l'affichage des profils
  const availableModels = getAvailableModels();
  console.log(`\n🔍 Found ${availableModels.size} available models`);
  
  const profileChoices = Object.keys(MODEL_PROFILES);
  const profileDescriptions = profileChoices.map((profileKey) => {
    const profile = MODEL_PROFILES[profileKey as keyof typeof MODEL_PROFILES];
    const { status } = getProfileAvailabilityStatus(profile, availableModels);
    return `${profileKey}: ${profile.description} [${status}]`;
  });

  const selectedProfileKey = await select(
    "📋 Available profiles:",
    profileChoices,
    profileDescriptions
  );

  const selectedProfile =
    MODEL_PROFILES[selectedProfileKey as keyof typeof MODEL_PROFILES];

  // 3. Appliquer les modèles selon le profil sélectionné
  console.log(`\n🔧 Applying profile: ${selectedProfileKey}`);

  for (const fileName of modelFiles) {
    // Déterminer si c'est un fichier pour un sous-agent
    // Les sous-agents sont : Code-Only, Git-Expert, Code-Validator, Test-Expert
    const isSubagent =
      fileName.includes("code_only") ||
      fileName.includes("git_expert") ||
      fileName.includes("code_validator") ||
      fileName.includes("code_audit");

    // Choisir le modèle approprié selon le type d'agent
    const modelName = isSubagent
      ? selectedProfile.subagentModel
      : selectedProfile.primaryModel;

    const filePath = join(modelsDir, fileName);
    writeFileSync(filePath, modelName);
    console.log(`✅ Saved: ${modelName} -> ${filePath}`);
  }

  console.log("\n✨ Configuration completed!");
}

// Obtenir __dirname et __filename en mode ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Vérifier si un profil est passé en argument de ligne de commande
const args = process.argv.slice(2);
if (args.length > 0) {
  const profileArg = args[0];
  if (profileArg in MODEL_PROFILES) {
    // Si un profil valide est passé, l'utiliser directement
    applyProfileDirectly(profileArg);
  } else {
    console.log(`Invalid profile: ${profileArg}`);
    console.log(
      `Available profiles: ${Object.keys(MODEL_PROFILES).join(", ")}`,
    );
    process.exit(1);
  }
} else {
  // Sinon, utiliser l'interaction utilisateur normale
  setupModels().catch(console.error);
}

async function applyProfileDirectly(profileName: string) {
  const configRootDir = dirname(dirname(__filename));
  const configPath = join(configRootDir, "opencode.jsonc");
  const modelsDir = join(configRootDir, "models");

  if (!existsSync(configPath)) {
    console.error(`❌ opencode.jsonc non trouvé à: ${configPath}`);
    return;
  }

  if (!existsSync(modelsDir)) {
    mkdirSync(modelsDir, { recursive: true });
  }

  // Lire opencode.jsonc et extraire les fichiers de modèles
  const configContent = readFileSync(configPath, "utf-8");
  const modelFileRegex = /"{file:\.\/models\/(.+?)}"/g;
  const modelFiles = new Set<string>();
  let match: RegExpExecArray | null;

  while (true) {
    match = modelFileRegex.exec(configContent);
    if (match === null) break;
    modelFiles.add(match[1]);
  }

  if (modelFiles.size === 0) {
    console.log("❌ Aucun fichier de modèle trouvé dans opencode.jsonc");
    return;
  }

  // Appliquer le profil sélectionné
  const selectedProfile =
    MODEL_PROFILES[profileName as keyof typeof MODEL_PROFILES];
  
  // Check and display availability status
  const availableModels = getAvailableModels();
  console.log(`\n🔍 Found ${availableModels.size} available models`);
  const { status } = getProfileAvailabilityStatus(selectedProfile, availableModels);
  console.log(`🔧 Applying profile: ${profileName} (non-interactive mode) [${status}]`);

  for (const fileName of modelFiles) {
    // Déterminer si c'est un fichier pour un sous-agent
    // Les sous-agents sont : Code-Only, Git-Expert, Code-Validator, Test-Expert
    const isSubagent =
      fileName.includes("code_only") ||
      fileName.includes("git_expert") ||
      fileName.includes("code_validator") ||
      fileName.includes("code_audit");

    // Choisir le modèle approprié selon le type d'agent
    const modelName = isSubagent
      ? selectedProfile.subagentModel
      : selectedProfile.primaryModel;

    const filePath = join(modelsDir, fileName);
    writeFileSync(filePath, modelName);
    console.log(`✅ Saved: ${modelName} -> ${filePath}`);
  }

  console.log("\n✨ Configuration completed!");
}
