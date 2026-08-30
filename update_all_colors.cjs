const fs = require('fs');
const path = require('path');

function getAllFiles(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(file)) {
        files = files.concat(getAllFiles(fullPath));
      }
    } else if (['.jsx', '.js', '.css', '.html'].includes(path.extname(file))) {
      files.push(fullPath);
    }
  });
  return files;
}

const replacements = [
  { from: /#350165/gi, to: '#45055B' },
  { from: /#1E0038/gi, to: '#26002B' },
  { from: /#5A0898/gi, to: '#70148D' },
  { from: /#6E15B4/gi, to: '#8F2BAE' },
  { from: /#46037E/gi, to: '#5A0E72' }
];

const targetFiles = getAllFiles('./src').concat(['./index.html', './tailwind.config.js', './server.js']);

let updatedCount = 0;
let totalReplacements = 0;

targetFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let fileUpdated = false;

  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      totalReplacements += matches.length;
      content = content.replace(from, to);
      fileUpdated = true;
    }
  });

  if (fileUpdated) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Finished: ${totalReplacements} color replacements in ${updatedCount} files.`);
