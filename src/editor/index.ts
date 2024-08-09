import { Readable } from 'stream';
import { parseAstrolarkInput } from './parser.js';
import { processEdits, FileObject_p0, ProcessorContext } from './processor/index.js';

export {
  parseAstrolarkInput,
  processEdits,
  FileObject_p0,
  ProcessorContext
};

export async function applyEdits(clipboardContent: string, context: ProcessorContext): Promise<void> {
  const fileObjects = await parseAstrolarkInput(createReadableStream(clipboardContent));
  await processEdits(fileObjects, context);
}

export function createReadableStream(input: string): Readable {
  return Readable.from(input);
}

/**
 * Creates a readable stream that emulates an LLM API response stream.
 * It chunks the input string randomly to simulate the unpredictable nature of LLM streams.
 *
 * @param input The input string to be streamed
 * @param minChunkSize The minimum size of each chunk (default: 1)
 * @param maxChunkSize The maximum size of each chunk (default: 10)
 * @param delayBetweenChunks The delay between chunks in milliseconds (default: 10)
 * @returns A readable stream that emits the input string in chunks
 */
export function simulateLLMStreamFromString(
  input: string,
  minChunkSize: number = 1,
  maxChunkSize: number = 10,
  delayBetweenChunks: number = 10
): Readable {
  const stream = new Readable({
    read() {}
  });

  let index = 0;

  function pushNextChunk() {
    if (index >= input.length) {
      stream.push(null);
      return;
    }

    const chunkSize = Math.floor(Math.random() * (maxChunkSize - minChunkSize + 1)) + minChunkSize;
    const end = Math.min(index + chunkSize, input.length);
    const chunk = input.slice(index, end);

    stream.push(chunk);
    index = end;

    setTimeout(pushNextChunk, delayBetweenChunks);
  }

  // Start pushing chunks
  pushNextChunk();

  return stream;
}
