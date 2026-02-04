import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILESYSTEM_DIR = path.join(__dirname, '../public/filesystem');
const OUTPUT_FILE = path.join(__dirname, '../public/filesystem-manifest.json');

// Map file extensions to file types
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.md':
      return 'markdown';
    case '.txt':
      return 'text';
    case '.pdf':
      return 'pdf';
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.svg':
    case '.webp':
      return 'image';
    case '.app':
      return 'executable';
    case '.link':
      return 'link';
    default:
      return 'text';
  }
}

// Check if a file should have its content read
function shouldReadContent(fileType) {
  return ['markdown', 'text', 'link'].includes(fileType);
}

// Build file tree recursively
function buildTree(dirPath, relativePath = '') {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const children = {};

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    // Skip hidden files and directories
    if (entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      // Handle .app directories as executable files
      if (entry.name.endsWith('.app')) {
        // Read the app config if it exists
        const configPath = path.join(fullPath, 'config.json');
        let appId = entry.name.replace('.app', '').toLowerCase();

        if (fs.existsSync(configPath)) {
          try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            appId = config.appId || appId;
          } catch (e) {
            // Use default appId
          }
        }

        children[entry.name] = {
          type: 'file',
          name: entry.name,
          fileType: 'executable',
          content: appId,
        };
      } else {
        // Regular directory
        const subtree = buildTree(fullPath, entryRelativePath);
        children[entry.name] = {
          type: 'folder',
          name: entry.name,
          children: subtree,
        };
      }
    } else {
      // File
      const fileType = getFileType(entry.name);
      const fileNode = {
        type: 'file',
        name: entry.name,
        fileType,
      };

      // For content-based files, read the content
      if (shouldReadContent(fileType)) {
        try {
          fileNode.content = fs.readFileSync(fullPath, 'utf-8');
        } catch (e) {
          console.warn(`Could not read file: ${fullPath}`);
        }
      }

      // For PDFs and images, set the URL path
      if (['pdf', 'image'].includes(fileType)) {
        fileNode.url = `/filesystem/${entryRelativePath}`;
      }

      // For .link files, the content is the URL
      if (fileType === 'link' && fileNode.content) {
        fileNode.url = fileNode.content.trim();
        delete fileNode.content;
      }

      children[entry.name] = fileNode;
    }
  }

  return children;
}

// Main
function generate() {
  // Ensure filesystem directory exists
  if (!fs.existsSync(FILESYSTEM_DIR)) {
    fs.mkdirSync(FILESYSTEM_DIR, { recursive: true });
    console.log('Created filesystem directory');
  }

  const tree = buildTree(FILESYSTEM_DIR);

  const manifest = {
    type: 'folder',
    name: '',
    children: tree,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`Generated filesystem manifest: ${OUTPUT_FILE}`);
}

generate();
