import { Readable } from 'stream';
import readline from 'readline';

export type FilePath = string;

export interface EditChunk {
  type: 'edit';
  content: string[];
  blockId: string;
}

export interface NoChangeChunk {
  type: 'no-change';
  blockId: string;
}

export type Chunk = EditChunk | NoChangeChunk;

export interface FileObject {
  path: FilePath;
  chunks: Chunk[];
}


export class MissingPathError extends Error {
  constructor() {
    super('FILE tag is missing path');
    this.name = 'MissingPathError';
  }
}

export class NestedFileSectionError extends Error {
  constructor() {
    super('Nested FILE tags are not allowed');
    this.name = 'NestedFileSectionError';
  }
}

export class UnexpectedFileEndError extends Error {
  constructor() {
    super('Unexpected FILE end tag');
    this.name = 'UnexpectedFileEndError';
  }
}

export class UnclosedFileSectionError extends Error {
  constructor() {
    super('FILE section is not closed');
    this.name = 'UnclosedFileSectionError';
  }
}

export async function parseAstrolarkInput(readStream: Readable): Promise<FileObject[]> {
  const fileObjects: FileObject[] = [];
  let currentFileObject: FileObject | null = null;
  let currentChunk: EditChunk | null = null;
  let blockCounter = 0;

  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim().startsWith('@@ALK<FILE')) {
      if (currentFileObject !== null) {
        throw new NestedFileSectionError();
      }
      const pathMatch = line.match(/path="([^"]+)"/);
      if (!pathMatch) {
        throw new MissingPathError();
      }
      currentFileObject = { path: pathMatch[1], chunks: [] };
      blockCounter = 0;
    } else if (line.trim() === '@@ALK</FILE>') {
      if (currentFileObject === null) {
        throw new UnexpectedFileEndError();
      }
      if (currentChunk !== null) {
        currentFileObject.chunks.push(currentChunk);
      }
      fileObjects.push(currentFileObject);
      currentFileObject = null;
      currentChunk = null;
    } else if (currentFileObject !== null) {
      if (line.trim() === '@@ALK<NO-CHANGE />') {
        if (currentChunk !== null) {
          currentFileObject.chunks.push(currentChunk);
        }
        currentFileObject.chunks.push({ type: 'no-change', blockId: `block${++blockCounter}` });
        currentChunk = null;
      } else {
        if (currentChunk === null) {
          currentChunk = { type: 'edit', content: [], blockId: `block${++blockCounter}` };
        }
        currentChunk.content.push(line);
      }
    }
  }

  if (currentFileObject !== null) {
    throw new UnclosedFileSectionError();
  }

  return fileObjects;
}
