import { FileObject_p2, ProcessorContext, ProcessedChunk2 } from './types.js';
import fs from 'fs/promises';
import path from 'path';

export class AstrolarkMarkersExistError extends Error {
  constructor(filePath: string) {
    super(`File ${filePath} already contains Astrolark markers`);
    this.name = 'AstrolarkMarkersExistError';
  }
}

export class NewFileContainsNoChangeBlockError extends Error {
  constructor(filePath: string) {
    super(`Newly created file ${filePath} contains a no-change block`);
    this.name = 'NewFileContainsNoChangeBlockError';
  }
}

export async function phase3(fileObjects: FileObject_p2[], context: ProcessorContext): Promise<void> {
  for (const fileObject of fileObjects) {
    let filePath = path.isAbsolute(fileObject.path) ? fileObject.path : path.join(context.rootDir, fileObject.path);

    if (context.verbose) {
      console.log(`\nProcessing file: ${filePath}`);
    }

    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    let originalContent = '';
    let isNewFile = false;
    try {
      originalContent = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        isNewFile = true;
        if (context.verbose) {
          console.log(`  Creating new file: ${filePath}`);
        }
      } else {
        throw error;
      }
    }

    // Check for no-change blocks only in newly created files
    if (isNewFile && fileObject.chunks.some(chunk => chunk.type === 'no-change')) {
      throw new NewFileContainsNoChangeBlockError(filePath);
    }

    const lines = originalContent.split('\n');

    // Check if the file already contains Astrolark markers
    if (lines.some(line => line.trim().startsWith('@@ALK'))) {
      throw new AstrolarkMarkersExistError(filePath);
    }

    let modifiedLines = [...lines];
    let offset = 0;

    for (const chunk of fileObject.chunks) {
      if (chunk.type === 'edit') {
        const { topAnchorPosition, bottomAnchorPosition } = findAnchorPositions(lines, chunk);

        if (context.verbose) {
          console.log(`  Processing chunk: ${chunk.blockId}`);
          console.log(`    Top anchor position: ${topAnchorPosition}`);
          console.log(`    Bottom anchor position: ${bottomAnchorPosition}`);
        }

        if (topAnchorPosition !== -1) {
          const topAnchorLine = `@@ALK_${chunk.blockId}_ANCHOR_TOP`;
          modifiedLines.splice(topAnchorPosition + offset, 0, topAnchorLine);
          offset++;
          if (context.verbose) {
            console.log(`    Added top anchor: ${topAnchorLine}`);
          }
        } else if (context.verbose) {
          console.log(`    Warning: Could not find position for top anchor`);
        }

        if (bottomAnchorPosition !== -1) {
          const bottomAnchorLine = `@@ALK_${chunk.blockId}_ANCHOR_BOTTOM`;
          modifiedLines.splice(bottomAnchorPosition + offset + 1, 0, bottomAnchorLine);
          offset++;
          if (context.verbose) {
            console.log(`    Added bottom anchor: ${bottomAnchorLine}`);
          }
        } else if (context.verbose) {
          console.log(`    Warning: Could not find position for bottom anchor`);
        }
      }
    }

    const modifiedContent = modifiedLines.join('\n');
    await fs.writeFile(filePath, modifiedContent);

    if (context.verbose) {
      console.log(`  File processed and saved: ${filePath}`);
    }
  }
}

function findAnchorPositions(originalLines: string[], chunk: ProcessedChunk2): { topAnchorPosition: number, bottomAnchorPosition: number } {
  let topAnchorPosition = -1;
  let bottomAnchorPosition = -1;

  if (chunk.type === 'edit') {
    const editLines = chunk.content;

    // Find bottom anchor position
    bottomAnchorPosition = findUniqueMatch(originalLines, editLines, false);

    // Find top anchor position
    if (bottomAnchorPosition !== -1) {
      topAnchorPosition = findUniqueMatch(originalLines.slice(0, bottomAnchorPosition), editLines, true);
    }
  }

  return { topAnchorPosition, bottomAnchorPosition };
}

function findUniqueMatch(originalLines: string[], searchLines: string[], isTopAnchor: boolean): number {
  let windowSize = 1;
  let matchPosition = -1;

  while (windowSize <= searchLines.length) {
    const searchWindow = isTopAnchor ? searchLines.slice(0, windowSize) : searchLines.slice(-windowSize);
    const matches = findAllMatches(originalLines, searchWindow);

    if (matches.length === 1) {
      matchPosition = isTopAnchor ? matches[0] : matches[0] + searchWindow.length - 1;
      break;
    } else if (matches.length === 0) {
      break;
    }

    windowSize++;
  }

  return matchPosition;
}

function findAllMatches(lines: string[], searchLines: string[]): number[] {
  const matches = [];
  const searchText = searchLines.join('\n');

  for (let i = 0; i <= lines.length - searchLines.length; i++) {
    const section = lines.slice(i, i + searchLines.length).join('\n');
    if (section === searchText) {
      matches.push(i);
    }
  }

  return matches;
}
