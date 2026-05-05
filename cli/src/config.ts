import fs from "fs/promises";
import os from "os";
import path from "path";
import { createInterface } from "readline/promises";

export type Config = {
  email: string;
  backendUrl: string;
  submitToken: string;
};

const CONFIG_DIR = path.join(os.homedir(), ".silver-tracker");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export async function readConfig(): Promise<Config | null> {
  try {
    const text = await fs.readFile(CONFIG_PATH, "utf8");
    return JSON.parse(text) as Config;
  } catch {
    return null;
  }
}

export async function writeConfig(config: Config): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

async function promptForConfig(): Promise<Config> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const email = (await rl.question("Email: ")).trim();
  const backendUrl = (await rl.question("Backend URL (e.g. https://yourapp.vercel.app): ")).trim().replace(/\/$/, "");
  const submitToken = (await rl.question("Submit token: ")).trim();
  rl.close();
  return { email, backendUrl, submitToken };
}

export async function loadOrInitConfig(): Promise<Config> {
  const existing = await readConfig();
  if (existing) return existing;

  console.log("First run — please provide your Silver Tracker credentials.\n");
  const config = await promptForConfig();
  await writeConfig(config);
  console.log(`\nConfig saved to ${CONFIG_PATH}\n`);
  return config;
}
