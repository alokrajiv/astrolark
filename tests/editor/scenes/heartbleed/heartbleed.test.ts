import fs from 'fs/promises';
import path from 'path';
import { parseAstrolarkInput } from '../../../../src/editor/parser';
import { phase1 } from '../../../../src/editor/processor/phase1';
import { phase2 } from '../../../../src/editor/processor/phase2';
import { phase3 } from '../../../../src/editor/processor/phase3';
import { simulateLLMStreamFromString } from '../../../setup';

const testDir = path.join(__dirname);

async function readJsonFile(filename: string) {
  const content = await fs.readFile(path.join(testDir, filename), 'utf-8');
  return JSON.parse(content);
}

async function saveFailedOutput(filename: string, data: any) {
  const failedFilename = filename.replace('.json', '.failed.json');
  await fs.writeFile(path.join(testDir, failedFilename), JSON.stringify(data, null, 2));
  console.log(`Failed output saved to ${failedFilename}`);
}

async function cleanupFailedJsons() {
  const files = await fs.readdir(testDir);
  for (const file of files) {
    if (file.endsWith('.failed.json') || file.endsWith('.failed.c')) {
      await fs.unlink(path.join(testDir, file));
    }
  }
}

describe('Heartbleed Scene Tests', () => {
  beforeAll(async () => {
    await cleanupFailedJsons();
  });

  afterAll(async () => {
  });

  test('Parser Test', async () => {
    const alkInput = await fs.readFile(path.join(testDir, 'edits.alk'), 'utf-8');
    const expected = await readJsonFile('stage0.json');

    const result = await parseAstrolarkInput(simulateLLMStreamFromString(alkInput));

    try {
      expect(result).toEqual(expected.result);
    } catch (error) {
      await saveFailedOutput('stage0.json', { result });
      throw error;
    }
  });

  test('Phase 1 Test', async () => {
    const input = await readJsonFile('stage0.json');
    const expected = await readJsonFile('stage1.json');

    const result = await phase1(input.result, { rootDir: testDir });

    try {
      expect(result).toEqual(expected.result);
    } catch (error) {
      await saveFailedOutput('stage1.json', { result });
      throw error;
    }
  });

  test('Phase 2 Test', async () => {
    const input = await readJsonFile('stage1.json');
    const expected = await readJsonFile('stage2.json');

    const result = await phase2(input.result, { rootDir: testDir });

    try {
      expect(result).toEqual(expected.result);
    } catch (error) {
      await saveFailedOutput('stage2.json', { result });
      throw error;
    }
  });
  test('Phase 3 Test', async () => {
    const input = await readJsonFile('stage2.json');
    const originalContent = await fs.readFile(path.join(testDir, 'original.c'), 'utf-8');
    const expectedContent = await fs.readFile(path.join(testDir, 'anchor-marked'), 'utf-8');

    // Create a temporary file for testing
    const tempFilePath = path.join(testDir, 'temp-heartbleed.c');
    await fs.writeFile(tempFilePath, originalContent);
    input.result[0].path = tempFilePath;

    try {
      await phase3(input.result, { rootDir: testDir });

      const modifiedContent = await fs.readFile(tempFilePath, 'utf-8');
      try {
        expect(modifiedContent).toEqual(expectedContent);
      } catch (error) {
        // move file from tempFilePath to failed file
        await fs.writeFile(path.join(testDir, 'temp-heartbleed.failed.c'), modifiedContent);
        throw error;
      }
    } catch (error) {
      console.error('Phase 3 Test failed:', error);
      throw error;
    } finally {
      await fs.unlink(tempFilePath);
    }
  });
});
