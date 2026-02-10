import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

async function select(message: string, choices: string[]): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\n${message}`);
  choices.forEach((choice, index) => {
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
  "github-fast": {
    description:
      "GitHub fast models: gemini-3-flash-preview for primary agents, grok-code-fast-1 for subagents",
    primaryModel: "github-copilot/gemini-3-flash-preview",
    subagentModel: "github-copilot/grok-code-fast-1",
  },
  "github-claude": {
    description:
      "GitHub Claude models: claude-opus-4.6 for primary agents, claude-sonnet-4.5 for subagents",
    primaryModel: "github-copilot/claude-opus-4.6",
    subagentModel: "github-copilot/claude-sonnet-4.5",
  },
  "ovh-qwen": {
    description: "OVH Qwen model for all agents and subagents",
    primaryModel: "ovh-ai-internal/Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8",
    subagentModel: "ovh-ai-internal/Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8",
  },
  "github-gpt": {
    description:
      "GitHub GPT models: gpt-5.2-codex for primary agents, gpt-5.1-codex-mini for subagents",
    primaryModel: "github-copilot/gpt-5.2-codex",
    subagentModel: "github-copilot/gpt-5.1-codex-mini",
  },
  opencode: {
    description:
      "OpenCode models: kimi-k2.5 for primary agents, glm-4.7 for subagents",
    primaryModel: "opencode/kimi-k2.5",
    subagentModel: "opencode/glm-4.7",
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

  // 2. Afficher les profils disponibles et demander à l'utilisateur de choisir
  const profileChoices = Object.keys(MODEL_PROFILES);
  const profileDescriptions = profileChoices.map(
    (profile) =>
      `${profile}: ${MODEL_PROFILES[profile as keyof typeof MODEL_PROFILES].description}`,
  );

  console.log("\n📋 Available profiles:");
  profileDescriptions.forEach((desc, index) => {
    console.log(`${index + 1}. ${desc}`);
  });

  const selectedProfileKey = await select(
    "Select a profile for your models:",
    profileChoices,
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
  console.log(`\n🔧 Applying profile: ${profileName} (non-interactive mode)`);

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
