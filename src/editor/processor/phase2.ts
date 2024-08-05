import { FileObject_p1, FileObject_p2, ProcessedChunk2, ProcessorPhase2, MisplacedBlockError } from './types';

export const phase2: ProcessorPhase2 = async (fileObjects, context) => {
  return fileObjects.map(fileObject => ({
    ...fileObject,
    chunks: identifyBlockTypes(fileObject)
  }));
};

function identifyBlockTypes(fileObject: FileObject_p1): ProcessedChunk2[] {
  const { chunks, path } = fileObject;
  
  if (chunks.length === 1 && chunks[0].type === 'edit') {
    return [{ ...chunks[0], blockType: 'full' }];
  }

  return chunks.map((chunk, index) => {
    if (chunk.type === 'no-change') {
      return { ...chunk, blockType: 'no-change' };
    }

    if (chunk.type === 'edit') {
      if (index === 0) {
        return { ...chunk, blockType: 'top' };
      }
      if (index === chunks.length - 1) {
        return { ...chunk, blockType: 'bottom' };
      }
      if (chunks[index - 1].type === 'no-change' && chunks[index + 1].type === 'no-change') {
        return { ...chunk, blockType: 'middle' };
      }

      throw new MisplacedBlockError(path, index);
    }

    throw new Error(`Unknown chunk type at index ${index}`);
  });
}