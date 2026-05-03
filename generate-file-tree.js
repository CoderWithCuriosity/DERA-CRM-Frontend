import fs from 'fs';
import path from 'path';

const IGNORE_FOLDERS = ["node_modules", ".git", "assets", "public"];
const IGNORE_FILES = ["generate-file-tree.js", "project-structure.txt", "project-contents.txt", ".env", ".gitignore", "pnpm-lock.yaml", "package-lock.json"];

function generateTree(dir, prefix = "") {
  let tree = "";

  const files = fs.readdirSync(dir);

  files.forEach((file, index) => {
    if (IGNORE_FOLDERS.includes(file)) return;

    const filePath = path.join(dir, file);
    const isLast = index === files.length - 1;

    const connector = isLast ? "└── " : "├── ";

    tree += `${prefix}${connector}${file}\n`;

    if (fs.statSync(filePath).isDirectory()) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      tree += generateTree(filePath, newPrefix);
    }
  });

  return tree;
}

function buildProjectTree(rootDir) {
  const projectName = path.basename(rootDir);

  let output = `${projectName}/\n`;
  output += generateTree(rootDir);

  return output;
}

function getAllFileContents(dir, baseDir = dir) {
  let contents = "";
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (IGNORE_FOLDERS.includes(file)) continue;
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      contents += getAllFileContents(filePath, baseDir);
    } else {
      if (IGNORE_FILES.includes(file)) continue;
      
      // Get relative path from root
      const relativePath = path.relative(baseDir, filePath);
      
      contents += `\n${'='.repeat(80)}\n`;
      contents += `FILE: ${relativePath}\n`;
      contents += `${'='.repeat(80)}\n\n`;
      
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        contents += fileContent;
        contents += `\n\n`;
      } catch (err) {
        contents += `[Error reading file: ${err.message}]\n\n`;
      }
    }
  }

  return contents;
}

// Root directory (current project)
const ROOT = process.cwd();

// Generate and save directory tree
const tree = buildProjectTree(ROOT);
fs.writeFileSync("project-structure.txt", tree);
console.log("✓ Project structure saved to project-structure.txt");

// Generate and save all file contents
const allContents = getAllFileContents(ROOT);
fs.writeFileSync("project-contents.txt", allContents);
console.log("✓ All file contents saved to project-contents.txt");

console.log("\n✅ Done! Created:");
console.log("   - project-structure.txt (directory tree)");
console.log("   - project-contents.txt (all file paths with content)");