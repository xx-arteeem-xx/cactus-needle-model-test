import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

let changelogMd = '';
try {
  changelogMd = fs.readFileSync(CHANGELOG_PATH, 'utf8');
} catch {
  changelogMd = '';
}

export { changelogMd };
