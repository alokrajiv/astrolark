import { FileObject, Chunk, EditChunk, NoChangeChunk } from '../parser';

// Parser output (Phase 0)
export type FileObject_p0 = FileObject;

// Phase 1 output
export interface FileObject_p1 extends Omit<FileObject, 'chunks'> {
  chunks: ProcessedChunk[];
}

export type ProcessedChunk = ProcessedEditChunk | ProcessedNoChangeChunk;

export interface ProcessedEditChunk extends EditChunk {
  blockType?: 'full' | 'top' | 'middle' | 'bottom';
  topAnchor?: string;
  bottomAnchor?: string;
}

export interface ProcessedNoChangeChunk extends NoChangeChunk {
  blockType?: 'no-change';
}

export interface ProcessorContext {
  rootDir: string;
}

export type ProcessorPhase1 = (
  fileObjects: FileObject_p0[],
  context: ProcessorContext
) => Promise<FileObject_p1[]>;

// You can add more phases as needed, for example:
// export type ProcessorPhase2 = (
//   fileObjects: FileObject_p1[],
//   context: ProcessorContext
// ) => Promise<FileObject_p2[]>;

// ... and so on for subsequent phases