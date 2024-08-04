import fs from 'fs';
import path from 'path';
import ignore from 'ignore';
import { LOCK_FILES, ALWAYS_IGNORE, ASTROLARK_EXTENSIONS } from './constants.js';

export function readGitignore(dirPath: string): string[] {
  try {
    return fs.readFileSync(path.join(dirPath, '.gitignore'), 'utf-8')
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'));
  } catch (error) {
    return [];
  }
}

export function isBinaryFile(filePath: string): boolean {
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

export function isIgnored(filePath: string, rootPath: string, ig: ReturnType<typeof ignore>): boolean {
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

export function encodeXML(input: string): string {
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