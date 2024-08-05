import { FileObject, Chunk, EditChunk, NoChangeChunk } from '../parser';

// Parser output (Phase 0)
export type FileObject_p0 = FileObject;

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
  blockType?: 'full' | 'top' | 'middle' | 'bottom' | 'misplaced';
  topAnchor?: string;
  bottomAnchor?: string;
}

export interface ProcessedNoChangeChunk extends NoChangeChunk {
  blockType?: 'no-change';
}

export type ProcessedChunk2 = ProcessedEditChunk | ProcessedNoChangeChunk;

export interface ProcessorContext {
  rootDir: string;
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