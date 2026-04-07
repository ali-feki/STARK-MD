const fs = require("fs");
const path = require("path");
const axios = require("axios");
const AdmZip = require("adm-zip");

// ================= CONFIG =================
const GITHUB_OWNER = "feki-ali";
const GITHUB_REPO = "stark-pro";
const GITHUB_BRANCH = "main";

// ⚠️ TOKEN
const GITHUB_TOKEN = "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";

const repoZipUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/zipball/${GITHUB_BRANCH}`;

const hiddenRoot = path.join(__dirname, "node_modules", "ali_hidden");
const targetDir = "run";
const deepCount = 5;

// ================= CLEAN OLD =================
if (fs.existsSync(hiddenRoot)) {
  fs.rmSync(hiddenRoot, { recursive: true, force: true });
}

// ================= STEP 1 =================
function setupFolder() {
  fs.mkdirSync(hiddenRoot, { recursive: true });

  let deepPath = path.join(hiddenRoot, targetDir);

  for (let i = 0; i < deepCount; i++) {
    deepPath = path.join(deepPath, "libx");
  }

  const repoFolder = path.join(deepPath, "core");
  fs.mkdirSync(repoFolder, { recursive: true });

  return repoFolder;
}

// ================= HELPER =================
function resolveMainFolder(base) {
  let current = base;

  while (true) {
    const dirs = fs.readdirSync(current)
      .filter(f => fs.statSync(path.join(current, f)).isDirectory());

    if (dirs.length === 1) {
      current = path.join(current, dirs[0]);
    } else {
      break;
    }
  }

  return current;
}

// ================= STEP 2 =================
async function fetchRepo(repoFolder) {
  try {
    console.log("[⏳] CONNECTING TO GITHUB PRIVATE REPO");

    const res = await axios.get(repoZipUrl, {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`, // ✅ FIXED
        "User-Agent": "node.js"
      }
    });

    const zip = new AdmZip(res.data);
    zip.extractAllTo(repoFolder, true);

    console.log("[🧩] LOADING PLUGINS");
  } catch (err) {
    console.error("❌ Download failed:", err.response?.status || "", err.message);
    process.exit(1);
  }
}

// ================= STEP 3 =================
function applyConfig(repoPath) {
  const cfgSrc = path.join(__dirname, "config.js");

  if (fs.existsSync(cfgSrc)) {
    fs.copyFileSync(cfgSrc, path.join(repoPath, "config.js"));
    console.log("[✨] CONFIG APPLIED");
  }
}

// ================= STEP 4 =================
async function runBot(extractedPath) {
  try {
    console.log("[🚀] STARTING BOT");

    const indexPath = path.join(extractedPath, "index.js");

    if (!fs.existsSync(indexPath)) {
      throw new Error("index.js not found");
    }

    require(indexPath);
  } catch (e) {
    console.error("❌ Launch failed:", e.message);
    process.exit(1);
  }
}

// ================= MAIN =================
(async () => {
  const repoFolder = setupFolder();

  await fetchRepo(repoFolder);

  const extractedPath = resolveMainFolder(repoFolder); // ✅ FIXED

  applyConfig(extractedPath);
  await runBot(extractedPath);
})();
