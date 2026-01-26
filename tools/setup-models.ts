import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createInterface } from "node:readline/promises";

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
    const answer = await rl.question(`Select an option (1-${choices.length}): `);
    const index = parseInt(answer) - 1;
    if (index >= 0 && index < choices.length) {
      rl.close();
      return choices[index];
    }
    console.log("Invalid selection, please try again.");
  }
}

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

  // 2. Récupérer les modèles disponibles via opencode models
  console.log("Reading available models...");
  const modelsOutput = execSync("opencode models", { encoding: "utf-8" });
  const modelLines = modelsOutput
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("INFO") && line.includes("/"));

  const providersMap = new Map<string, string[]>();
  for (const line of modelLines) {
    const [provider, ...modelParts] = line.split("/");
    const model = modelParts.join("/");
    if (!providersMap.has(provider)) {
      providersMap.set(provider, []);
    }
    providersMap.get(provider)!.push(model);
  }

  const providers = Array.from(providersMap.keys()).sort();

  // 3. Boucler sur chaque fichier et demander à l'utilisateur
  for (const fileName of modelFiles) {
    console.log(`\n>>> Configuration for: ${fileName}`);
    
    const provider = await select(`Providers for ${fileName}:`, providers);
    const availableModels = (providersMap.get(provider) || []).sort();
    const model = await select(`Models for ${provider}:`, availableModels);

    const fullModelName = `${provider}/${model}`;
    const filePath = join(modelsDir, fileName);
    
    writeFileSync(filePath, fullModelName);
    console.log(`✅ Saved: ${fullModelName} -> ${filePath}`);
  }

  console.log("\n✨ Configuration completed!");
}

setupModels().catch(console.error);
