import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { execFile, spawnSync } from "child_process";
import { promisify } from "util";
import { config } from "../config.js";

const execFileAsync = promisify(execFile);

const ensureTectonicAvailable = () => {
  const probe = spawnSync(config.tectonicPath, ["--version"], { encoding: "utf8" });
  if (probe.error) {
    throw new Error(
      `Tectonic binary not found. Install it from https://tectonic-typesetting.github.io/ or set TECTONIC_PATH to the executable. Original error: ${probe.error.message}`
    );
  }
};

const sanitizeLatex = (latex: string) => latex.replace(/\\input\{glyphtounicode[^}]*\}\s*/gi, "");

const buildFontconfig = async (dir: string) => {
  const platform = process.platform;
  const fontDirs = new Set<string>();

  if (platform === "win32") {
    fontDirs.add("C:/Windows/Fonts");
    if (process.env.LOCALAPPDATA) {
      fontDirs.add(path.join(process.env.LOCALAPPDATA, "Microsoft", "Windows", "Fonts"));
    }
  } else if (platform === "darwin") {
    fontDirs.add("/System/Library/Fonts");
    fontDirs.add("/Library/Fonts");
  } else {
    fontDirs.add("/usr/share/fonts");
    fontDirs.add("/usr/local/share/fonts");
  }

  const dirsXml = Array.from(fontDirs)
    .map((fontDir) => (fontDir ? `  <dir>${fontDir}</dir>` : ""))
    .join("\n");

  const xml = `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n${dirsXml}\n</fontconfig>`;
  const fontConfigPath = path.join(dir, "fonts.conf");
  await fs.writeFile(fontConfigPath, xml, "utf8");
  return fontConfigPath;
};

const compileWithTectonic = async (latex: string) => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-latex-"));
  const texPath = path.join(tmpDir, "resume.tex");
  const pdfPath = path.join(tmpDir, "resume.pdf");

  try {
    const sanitized = sanitizeLatex(latex);
    await fs.writeFile(texPath, sanitized, "utf8");
    const fontConfigPath = await buildFontconfig(tmpDir);
    const args = [
      "-o",
      tmpDir,
      "--synctex=none",
      "--keep-intermediates",
      "--keep-logs",
      texPath
    ];
    await execFileAsync(config.tectonicPath, args, {
      cwd: tmpDir,
      env: { ...process.env, FONTCONFIG_FILE: fontConfigPath }
    });
    const pdfBuffer = await fs.readFile(pdfPath);
    return pdfBuffer.toString("base64");
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr;
    const message = stderr ? stderr.split("\n").slice(-15).join("\n") : (error as Error).message;
    throw new Error(`[tectonic] ${message}`);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
};

export const compileLatexToPdf = async (latex: string) => {
  if (!latex.trim()) {
    throw new Error("LaTeX payload is empty");
  }

  ensureTectonicAvailable();
  return compileWithTectonic(latex);
};
