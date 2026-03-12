
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../');
const srcDir = path.join(projectRoot, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

const files = getAllFiles(srcDir);

files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
        let content = fs.readFileSync(file, 'utf8');
        let original = content;

        // Replace .tsx with .jsx
        content = content.replace(/from\s+['"](.+?)\.tsx['"]/g, (match, p1) => {
            return `from "${p1}.jsx"`;
        });
        // Replace .ts with .js
        content = content.replace(/from\s+['"](.+?)\.ts['"]/g, (match, p1) => {
            return `from "${p1}.js"`;
        });

        // Handle dynamic imports or requires if any? (unlikely in this codebase but good practice)
        // Also handle relative imports that might explicitly extensions

        if (content !== original) {
            fs.writeFileSync(file, content);
            console.log(`Updated imports in: ${file}`);
        }
    }
});
