import { Readable } from 'stream';
import fs from 'fs/promises';
import path from 'path';

export const testDir = path.join(__dirname, 'temp');

export async function setupTestFiles() {
  await fs.mkdir(testDir, { recursive: true });
  await fs.writeFile(path.join(testDir, 'file1.txt'), originalFileContent);
  await fs.writeFile(path.join(testDir, 'file2.txt'), originalFile2Content);
}

export async function cleanupTestFiles() {
  await fs.rm(testDir, { recursive: true, force: true });
}

export const originalFileContent = `
line1
line2
line3
line4
line5
`.trim();

export const originalFile2Content = `
content1
content2
content3
content4
`.trim();

export const sampleInputBeginning = `
@@ALK<FILE path="file1.txt">
newline1
newline2
@@ALK<NO-CHANGE />
@@ALK</FILE>
`;

export const sampleInputMiddle = `
@@ALK<FILE path="file1.txt">
@@ALK<NO-CHANGE />
newline3
newline4
@@ALK<NO-CHANGE />
@@ALK</FILE>
`;

export const sampleInputEnd = `
@@ALK<FILE path="file1.txt">
@@ALK<NO-CHANGE />
newline5
newline6
@@ALK</FILE>
`;

export const sampleInputMultipleEdits = `
@@ALK<FILE path="file1.txt">
newline1
@@ALK<NO-CHANGE />
newline3
@@ALK<NO-CHANGE />
newline5
@@ALK</FILE>
`;

export const sampleInputMultipleFiles = `
@@ALK<FILE path="file1.txt">
newline1
newline2
@@ALK<NO-CHANGE />
@@ALK</FILE>

@@ALK<FILE path="file2.txt">
content1
@@ALK<NO-CHANGE />
content3
@@ALK</FILE>
`;

export const sampleInputComplexScenario = `
@@ALK<FILE path="file1.txt">
newline1
newline2
@@ALK<NO-CHANGE />
newline4
@@ALK<NO-CHANGE />
newline6
@@ALK</FILE>

@@ALK<FILE path="file2.txt">
content1
@@ALK<NO-CHANGE />
content3
@@ALK</FILE>

@@ALK<FILE path="file1.txt">
@@ALK<NO-CHANGE />
updatedline4
newline5
@@ALK</FILE>
`;

export const sampleInputWithEmptyLines = `
@@ALK<FILE path="file1.txt">
line1

line3
@@ALK<NO-CHANGE />

@@ALK</FILE>
`.trim();

export const sampleInputWithFileTag = `
@@ALK<FILE path="file1.txt">
line1
line2
@@ALK</FILE>
This line should not be included
@@ALK<NO-CHANGE />
This line should not be included either
`.trim();

export const sampleInputMultipleNoChange = `
@@ALK<FILE path="file1.txt">
line1
@@ALK<NO-CHANGE />
@@ALK<NO-CHANGE />
line2
@@ALK</FILE>
`.trim();

export const sampleInputOnlyNoChange = `
@@ALK<FILE path="file1.txt">
@@ALK<NO-CHANGE />
@@ALK</FILE>
`.trim();

export const sampleInputMissingPath = `
@@ALK<FILE>
content
@@ALK</FILE>
`.trim();

export const sampleInputUnclosedFile = `
@@ALK<FILE path="file1.txt">
content
`.trim();

export const sampleInputNestedFile = `
@@ALK<FILE path="file1.txt">
content
@@ALK<FILE path="file2.txt">
nested content
@@ALK</FILE>
@@ALK</FILE>
`.trim();



export async function readFileContent(filePath: string): Promise<string> {
  return await fs.readFile(path.join(testDir, filePath), 'utf-8');
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