import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const indexPath = join(here, 'game', 'index.html');
if (!existsSync(indexPath)) {
  console.error(`Error: Missing required entrypoint game/index.html at ${indexPath}`);
  process.exit(1);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

function countFiles(dir) {
  let count = 0;
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        count += countFiles(full);
      } else {
        count++;
      }
    }
  } catch {}
  return count;
}

const gameFileCount = countFiles(join(out, 'game'));
const shotFileCount = existsSync(join(out, 'screenshots')) ? countFiles(join(out, 'screenshots')) : 0;

const dossierContent = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(out, 'dossier.json'), dossierContent);

console.log(`Build complete. Copied ${gameFileCount} game files and ${shotFileCount} screenshots. Dossier size: ${Buffer.byteLength(dossierContent)} bytes.`);

