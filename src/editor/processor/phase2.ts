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
    return [{
      ...chunks[0],
      blockType: 'full',
      topAnchor: `@@ALK_${chunks[0].blockId}_ANCHOR_TOP`,
      bottomAnchor: `@@ALK_${chunks[0].blockId}_ANCHOR_BOTTOM`
    }];
  }

  return chunks.map((chunk, index) => {
    if (chunk.type === 'no-change') {
      return { ...chunk, blockType: 'no-change' };
    }

    if (chunk.type === 'edit') {
      let blockType: 'top' | 'middle' | 'bottom';
      if (index === 0) {
        blockType = 'top';
      } else if (index === chunks.length - 1) {
        blockType = 'bottom';
      } else if (chunks[index - 1].type === 'no-change' && chunks[index + 1].type === 'no-change') {
        blockType = 'middle';
      } else {
        throw new MisplacedBlockError(path, index);
      }

      return {
        ...chunk,
        blockType,
        topAnchor: `@@ALK_${chunk.blockId}_ANCHOR_TOP`,
        bottomAnchor: `@@ALK_${chunk.blockId}_ANCHOR_BOTTOM`
      };
    }

    throw new Error(`Unknown chunk type at index ${index}`);
  });
}
