/**
 * Copies the npm `tinymce` package into `public/tinymce` so the admin
 * RichTextEditor can self-host instead of depending on Tiny Cloud.
 * Tiny Cloud API keys often allow localhost but block deployed domains.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(rootDir, "node_modules", "tinymce");
const targetDir = join(rootDir, "public", "tinymce");

if (!existsSync(sourceDir)) {
  console.warn("[copy-tinymce] node_modules/tinymce not found; skipping.");
  process.exit(0);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(join(rootDir, "public"), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });
console.info("[copy-tinymce] Copied tinymce assets to public/tinymce");
