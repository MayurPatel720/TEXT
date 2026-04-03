const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /bg-\[\#0a0a0a\]/g, replace: 'bg-[var(--bg-primary)]' },
  { search: /bg-\[\#111111\]/g, replace: 'bg-[var(--bg-secondary)]' },
  { search: /bg-\[\#1a1a1a\]/g, replace: 'bg-[var(--bg-elevated)]' },
  { search: /bg-\[\#222\]/g, replace: 'bg-[var(--bg-card)]' },
  { search: /border-white\/5/g, replace: 'border-[var(--border)]' },
  { search: /border-white\/10/g, replace: 'border-[var(--border)]' },
  { search: /border-white\/20/g, replace: 'border-[var(--border-hover)]' },
  { search: /text-white\/90/g, replace: 'text-[var(--text-primary)]' },
  { search: /text-white\/80/g, replace: 'text-[var(--text-primary)]' },
  { search: /text-white\/70/g, replace: 'text-[var(--text-secondary)]' },
  { search: /text-white\/60/g, replace: 'text-[var(--text-secondary)]' },
  { search: /text-white\/50/g, replace: 'text-[var(--text-tertiary)]' },
  { search: /text-white\/40/g, replace: 'text-[var(--text-tertiary)]' },
  { search: /text-white\/30/g, replace: 'text-[var(--text-tertiary)]' },
  { search: /placeholder-white\/30/g, replace: 'placeholder-[var(--text-tertiary)]' },
  { search: /bg-white\/5/g, replace: 'bg-[var(--bg-secondary)]' },
  { search: /bg-white\/10/g, replace: 'bg-[var(--bg-elevated)]' },
  { search: /hover:bg-white\/5/g, replace: 'hover:bg-[var(--bg-elevated)]' },
  { search: /hover:bg-white\/10/g, replace: 'hover:bg-[var(--bg-secondary)]' },
  { search: /hover:bg-white\/20/g, replace: 'hover:bg-[var(--border-hover)]' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      // Careful with text-white as it might be used correctly for buttons.
      // We will only do the explicit bg and opacity ones automatically.
      for (const r of replacements) {
        content = content.replace(r.search, r.replace);
      }

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

// We will only run this on studio, history, gpu-marketplace, share, (auth), components
const dirs = ['app/studio', 'app/history', 'app/gpu-marketplace', 'app/share', 'app/(auth)', 'components'];
for (const d of dirs) {
    const fullDir = path.join(__dirname, d);
    if (fs.existsSync(fullDir)) processDirectory(fullDir);
}
