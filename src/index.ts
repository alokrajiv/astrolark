#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ignore from 'ignore';
import clipboard from 'clipboardy';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import yaml from 'js-yaml';
import chalk from 'chalk';

const LOCK_FILES = ['package-lock.json', 'yarn.lock', 'bun.lockb', 'Pipfile.lock', 'poetry.lock', 'Gemfile.lock'];
const ALWAYS_IGNORE = ['.git', '.DS_Store'];
const ASTROLARK_EXTENSIONS = ['.astrolark.xml', '.astrolark.yaml', '.astrolark.yml'];
const ASTROLARK_MARKER = 'ASTROLARK_GENERATED_FILE';

const argv = yargs(hideBin(process.argv))
  .option('copy', {
    alias: 'c',
    description: 'Copy the output to clipboard',
    type: 'boolean',
    default: true
  })
  .option('output', {
    alias: 'o',
    description: 'Specify the output file name/path',
    type: 'string',
  })
  .option('format', {
    alias: 'f',
    description: 'Output format (xml or yaml)',
    choices: ['xml', 'yaml'],
    default: 'yaml',
  })
  .option('verbose', {
    alias: 'v',
    description: 'Enable verbose output',
    type: 'boolean',
    default: false,
  })
  .help()
  .alias('help', 'h')
  .argv;

function readGitignore(dirPath: string): string[] {
  try {
    return fs.readFileSync(path.join(dirPath, '.gitignore'), 'utf-8')
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'));
  } catch (error) {
    return [];
  }
}

function isBinaryFile(filePath: string): boolean {
  if (fs.statSync(filePath).isDirectory()) {
    return false;  // Directories are not binary files
  }

  const buffer = Buffer.alloc(4096);
  const fd = fs.openSync(filePath, 'r');
  const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
  fs.closeSync(fd);

  for (let i = 0; i < bytesRead; i++) {
    if (buffer[i] === 0) {
      return true;  // NULL byte found, likely a binary file
    }
  }

  // Check for common binary file signatures
  const fileSignature = buffer.toString('hex', 0, 8).toUpperCase();
  const binarySignatures = [
    'FFD8FF',    // JPEG
    '89504E47',  // PNG
    '47494638',  // GIF
    '25504446',  // PDF
    '504B0304',  // ZIP
    '52617221',  // RAR
    '1F8B08',    // GZIP
  ];

  return binarySignatures.some(sig => fileSignature.startsWith(sig));
}

function isIgnored(filePath: string, rootPath: string, ig: ReturnType<typeof ignore>): boolean {
  const relativePath = path.relative(rootPath, filePath);
  const stats = fs.statSync(filePath);
  
  if (stats.isDirectory()) {
    return ig.ignores(relativePath) || 
           ALWAYS_IGNORE.includes(path.basename(filePath));
  }
  
  return ig.ignores(relativePath) || 
         LOCK_FILES.includes(path.basename(filePath)) || 
         ALWAYS_IGNORE.includes(path.basename(filePath)) ||
         ASTROLARK_EXTENSIONS.some(ext => filePath.endsWith(ext)) ||
         isBinaryFile(filePath);
}

function encodeXML(input: string): string {
  return input.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}

function generateOverview(rootPath: string, format: 'xml' | 'yaml'): { 
  content: string, 
  ignoredFiles: Map<string, string[]>
} {
  const gitignorePatterns = readGitignore(rootPath);
  const ig = ignore().add(gitignorePatterns).add(ALWAYS_IGNORE);
  let structure: string[] = [];
  let files: { [key: string]: string } = {};
  let ignoredFiles: Map<string, string[]> = new Map();

  function traverseDirectory(dir: string, depth: number = 0): void {
    const filesInDir = fs.readdirSync(dir);
    filesInDir.forEach((file, index) => {
      const filePath = path.join(dir, file);
      const relativePath = path.relative(rootPath, filePath);
      
      const ignoreReasons: string[] = [];
      if (LOCK_FILES.includes(path.basename(filePath))) {
        ignoreReasons.push('lock');
      } else {
        if (ig.ignores(relativePath)) ignoreReasons.push('gitignore');
        if (ALWAYS_IGNORE.includes(path.basename(filePath))) ignoreReasons.push('always_ignore');
        if (ASTROLARK_EXTENSIONS.some(ext => filePath.endsWith(ext))) ignoreReasons.push('astrolark');
        if (isBinaryFile(filePath)) ignoreReasons.push('binary');
      }
      
      if (ignoreReasons.length > 0) {
        ignoredFiles.set(relativePath, ignoreReasons);
        return;
      }

      const isLast = index === filesInDir.length - 1;
      const prefix = '  '.repeat(depth) + (isLast ? '└─ ' : '├─ ');
      structure.push(`${prefix}${file}`);

      if (fs.statSync(filePath).isDirectory()) {
        traverseDirectory(filePath, depth + 1);
      } else {
        const content = fs.readFileSync(filePath, 'utf-8');
        files[relativePath] = content;
      }
    });
  }

  traverseDirectory(rootPath);

  let content: string;
  if (format === 'xml') {
    content = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${ASTROLARK_MARKER} -->
<project-overview>
  <description>
    This file was generated by astrolark. It provides an XML representation of a project's structure ('structure' section) + contents of text files. Binary files, lock files, and files matching .gitignore patterns are excluded.
  </description>
  <structure>
${structure.map(line => `    ${encodeXML(line)}`).join('\n')}
  </structure>
  <files>
${Object.entries(files).map(([path, content]) => `    <file path="${encodeXML(path)}">
<![CDATA[${content}]]>
    </file>`).join('\n')}
  </files>
</project-overview>`;
  } else {
    content = `# ${ASTROLARK_MARKER}\n` + yaml.dump({
      description: "This file was generated by astrolark. It provides a YAML representation of a project's structure and contents of text files. Binary files, lock files, and files matching .gitignore patterns are excluded.",
      structure: structure,
      files: files
    });
  }

  return { content, ignoredFiles };
}

async function main() {
  const projectPath = process.cwd();
  const format = (await argv).format as 'xml' | 'yaml';
  const verbose = (await argv).verbose;
  const { content, ignoredFiles } = generateOverview(projectPath, format);
  
  if ((await argv).copy) {
    await clipboard.write(content);
    console.log(chalk.green('Project overview copied to clipboard'));
  }
  
  const outputPath = (await argv).output || `project_overview.astrolark.${format}`;
  fs.writeFileSync(outputPath, content);
  console.log(chalk.blue(`Project overview generated in ${chalk.bold(outputPath)}`));

  // Categorize ignored files
  const lockFiles = new Set<string>();
  const binaryFiles = new Set<string>();
  const gitignoreFiles = new Set<string>();
  const astrolarkFiles = new Set<string>();
  const otherIgnoredFiles = new Set<string>();

  ignoredFiles.forEach((reasons, file) => {
    if (reasons.includes('lock')) {
      lockFiles.add(file);
    } else if (reasons.includes('binary')) {
      binaryFiles.add(file);
    } else if (reasons.includes('gitignore')) {
      gitignoreFiles.add(file);
    } else if (reasons.includes('astrolark')) {
      astrolarkFiles.add(file);
    } else {
      otherIgnoredFiles.add(file);
    }
  });

  // Display ignored files
  if (lockFiles.size > 0) {
    console.log(chalk.yellow('Lock files skipped:'), chalk.dim(Array.from(lockFiles).join(', ')));
  }

  if (binaryFiles.size > 0) {
    console.log(chalk.yellow('Binary files skipped:'), chalk.dim(Array.from(binaryFiles).join(', ')));
  }

  // Verbose mode output
  if (verbose) {
    if (gitignoreFiles.size > 0) {
      console.log(chalk.cyan('Files skipped due to .gitignore patterns:'));
      console.log(chalk.dim(Array.from(gitignoreFiles).join(', ')));
    }

    if (astrolarkFiles.size > 0) {
      console.log(chalk.cyan('Astrolark files skipped:'), chalk.dim(Array.from(astrolarkFiles).join(', ')));
    }

    if (otherIgnoredFiles.size > 0) {
      console.log(chalk.cyan('Other files intelligently skipped:'));
      console.log(chalk.dim(Array.from(otherIgnoredFiles).join(', ')));
    }
  }
}

main().catch(error => console.error(chalk.red('Error:', error.message)));