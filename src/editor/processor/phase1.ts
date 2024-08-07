import { FileObject_p0, FileObject_p1, ProcessedChunk, ProcessorPhase1 } from './types';
import { Chunk, EditChunk } from '../parser';

export const phase1: ProcessorPhase1 = async (fileObjects, context) => {
  return fileObjects.map(fileObject => ({
    ...fileObject,
    chunks: removeConsecutiveNoChange(fileObject.chunks)
    // chunks: removeWhitespaceAroundNoChange(removeConsecutiveNoChange(fileObject.chunks))
  }));
};

function removeConsecutiveNoChange(chunks: Chunk[]): Chunk[] {
  return chunks.filter((chunk, index, array) =>
    chunk.type !== 'no-change' ||
    (index === 0 || array[index - 1].type !== 'no-change')
  );
}

// function removeWhitespaceAroundNoChange(chunks: Chunk[]): ProcessedChunk[] {
//   return chunks.reduce((acc: ProcessedChunk[], chunk, index, array) => {
//     if (chunk.type === 'edit') {
//       const isFirstChunk = index === 0;
//       const isLastChunk = index === array.length - 1;
//       const prevIsNoChange = !isFirstChunk && array[index - 1].type === 'no-change';
//       const nextIsNoChange = !isLastChunk && array[index + 1].type === 'no-change';

//       const trimmedContent = (chunk as EditChunk).content
//         .filter(line => line.trim() !== '')
//         .map((line, lineIndex, contentArray) => {
//           if ((lineIndex === 0 && prevIsNoChange) || (lineIndex === contentArray.length - 1 && nextIsNoChange)) {
//             return line.trim();
//           }
//           return line;
//         });

//       if (trimmedContent.length > 0) {
//         acc.push({
//           ...chunk,
//           content: trimmedContent
//         } as ProcessedChunk);
//       }
//     } else {
//       acc.push(chunk as ProcessedChunk);
//     }
//     return acc;
//   }, []);
// }
