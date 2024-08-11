import { FileObject, Chunk, EditChunk, NoChangeChunk } from '../parser.js';

// Parser output (Phase 0)
export interface FileObject_p0 extends Omit<FileObject, 'chunks'> {
  chunks: (Chunk & { blockId: string })[];
}

// Phase 1 output
export interface FileObject_p1 extends Omit<FileObject, 'chunks'> {
  chunks: ProcessedChunk[];
}

// Phase 2 output
export interface FileObject_p2 extends Omit<FileObject_p1, 'chunks'> {
  chunks: ProcessedChunk2[];
}

export type ProcessedChunk = ProcessedEditChunk | ProcessedNoChangeChunk;

export interface ProcessedEditChunk extends EditChunk {
  blockId: string;
  blockType?: 'full' | 'top' | 'middle' | 'bottom' | 'misplaced';
  topAnchor?: string;
  bottomAnchor?: string;
}

export interface ProcessedNoChangeChunk extends NoChangeChunk {
  blockId: string;
  blockType?: 'no-change';
}

export type ProcessedChunk2 = ProcessedEditChunk | ProcessedNoChangeChunk;

export interface ProcessorContext {
  rootDir: string;
  verbose: boolean;
}

export type ProcessorPhase1 = (
  fileObjects: FileObject_p0[],
  context: ProcessorContext
) => Promise<FileObject_p1[]>;

export type ProcessorPhase2 = (
  fileObjects: FileObject_p1[],
  context: ProcessorContext
) => Promise<FileObject_p2[]>;

export class MisplacedBlockError extends Error {
  constructor(public filePath: string, public chunkIndex: number) {
    super(`Misplaced block found in file ${filePath} at chunk index ${chunkIndex}`);
    this.name = 'MisplacedBlockError';
  }
}
