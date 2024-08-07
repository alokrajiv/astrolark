import { parseAstrolarkInput, MissingPathError, UnclosedFileSectionError, NestedFileSectionError } from '../src/editor/parser';
import {
  sampleInputBeginning,
  sampleInputMiddle,
  sampleInputEnd,
  sampleInputMultipleEdits,
  sampleInputMultipleFiles,
  sampleInputComplexScenario,
  sampleInputWithEmptyLines,
  sampleInputWithFileTag,
  sampleInputMultipleNoChange,
  sampleInputOnlyNoChange,
  sampleInputMissingPath,
  sampleInputUnclosedFile,
  sampleInputNestedFile,
  simulateLLMStreamFromString
} from './setup';

const transformerFn = simulateLLMStreamFromString;

describe('parseAstrolarkInput', () => {
  it('should parse edits at the beginning of a file', async () => {
    const result = await parseAstrolarkInput(transformerFn(sampleInputBeginning));
    expect(result).toEqual([
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'edit',
            content: ['newline1', 'newline2'],
            blockId: 'block1'
          },
          {
            type: 'no-change',
            blockId: 'block2'
          },
        ],
      },
    ]);
  });

  it('should parse edits in the middle of a file', async () => {
    const result = await parseAstrolarkInput(transformerFn(sampleInputMiddle));
    expect(result).toEqual([
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'no-change',
            blockId: 'block1'
          },
          {
            type: 'edit',
            content: ['newline3', 'newline4'],
            blockId: 'block2'
          },
          {
            type: 'no-change',
            blockId: 'block3'
          },
        ],
      },
    ]);
  });

  it('should parse edits at the end of a file', async () => {
    const result = await parseAstrolarkInput(transformerFn(sampleInputEnd));
    expect(result).toEqual([
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'no-change',
            blockId: 'block1'
          },
          {
            type: 'edit',
            content: ['newline5', 'newline6'],
            blockId: 'block2'
          },
        ],
      },
    ]);
  });

  it('should parse multiple edits in a single file', async () => {
    const result = await parseAstrolarkInput(transformerFn(sampleInputMultipleEdits));
    expect(result).toEqual([
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'edit',
            content: ['newline1'],
            blockId: 'block1'
          },
          {
            type: 'no-change',
            blockId: 'block2'
          },
          {
            type: 'edit',
            content: ['newline3'],
            blockId: 'block3'
          },
          {
            type: 'no-change',
            blockId: 'block4'
          },
          {
            type: 'edit',
            content: ['newline5'],
            blockId: 'block5'
          },
        ],
      },
    ]);
  });

  it('should parse edits for multiple files', async () => {
    const result = await parseAstrolarkInput(transformerFn(sampleInputMultipleFiles));
    expect(result).toEqual([
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'edit',
            content: ['newline1', 'newline2'],
            blockId: 'block1'
          },
          {
            type: 'no-change',
            blockId: 'block2'
          },
        ],
      },
      {
        path: 'file2.txt',
        chunks: [
          {
            type: 'edit',
            content: ['content1'],
            blockId: 'block1'
          },
          {
            type: 'no-change',
            blockId: 'block2'
          },
          {
            type: 'edit',
            content: ['content3'],
            blockId: 'block3'
          },
        ],
      },
    ]);
  });

  it('should handle a complex scenario with multiple files and edits', async () => {
    const result = await parseAstrolarkInput(transformerFn(sampleInputComplexScenario));
    expect(result).toEqual([
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'edit',
            content: ['newline1', 'newline2'],
            blockId: 'block1'
          },
          {
            type: 'no-change',
            blockId: 'block2'
          },
          {
            type: 'edit',
            content: ['newline4'],
            blockId: 'block3'
          },
          {
            type: 'no-change',
            blockId: 'block4'
          },
          {
            type: 'edit',
            content: ['newline6'],
            blockId: 'block5'
          },
        ],
      },
      {
        path: 'file2.txt',
        chunks: [
          {
            type: 'edit',
            content: ['content1'],
            blockId: 'block1'
          },
          {
            type: 'no-change',
            blockId: 'block2'
          },
          {
            type: 'edit',
            content: ['content3'],
            blockId: 'block3'
          },
        ],
      },
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'no-change',
            blockId: 'block1'
          },
          {
            type: 'edit',
            content: ['updatedline4', 'newline5'],
            blockId: 'block2'
          },
        ],
      },
    ]);
  });

  it('should handle empty lines correctly', async () => {
    const result = await parseAstrolarkInput(transformerFn(sampleInputWithEmptyLines));
    expect(result).toEqual([
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'edit',
            content: ['line1', '', 'line3'],
            blockId: 'block1'
          },
          {
            type: 'no-change',
            blockId: 'block2'
          },
          {
            type: 'edit',
            content: [''],
            blockId: 'block3'
          },
        ],
      },
    ]);
  });

  it('should handle multiple NO-CHANGE chunks correctly', async () => {
    const result = await parseAstrolarkInput(transformerFn(sampleInputMultipleNoChange));
    expect(result).toEqual([
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'edit',
            content: ['line1'],
            blockId: 'block1'
          },
          {
            type: 'no-change',
            blockId: 'block2'
          },
          {
            type: 'no-change',
            blockId: 'block3'
          },
          {
            type: 'edit',
            content: ['line2'],
            blockId: 'block4'
          },
        ],
      },
    ]);
  });

  it('should handle files with only NO-CHANGE content', async () => {
    const result = await parseAstrolarkInput(transformerFn(sampleInputOnlyNoChange));
    expect(result).toEqual([
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'no-change',
            blockId: 'block1'
          },
        ],
      },
    ]);
  });

  it('should not include @@ALK</FILE> in the content', async () => {
    const result = await parseAstrolarkInput(transformerFn(sampleInputWithFileTag));
    expect(result).toEqual([
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'edit',
            content: ['line1', 'line2'],
            blockId: 'block1'
          },
        ],
      },
    ]);
  });

  it('should not include any @@ALK< tags in the content', async () => {
    const result = await parseAstrolarkInput(transformerFn(sampleInputWithFileTag));
    expect(result).toEqual([
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'edit',
            content: ['line1', 'line2'],
            blockId: 'block1'
          },
        ],
      },
    ]);
    // Check that no chunk content includes @@ALK<
    result.forEach(file => {
      file.chunks.forEach(chunk => {
        if (chunk.type === 'edit') {
          chunk.content.forEach(line => {
            expect(line).not.toContain('@@ALK<');
          });
        }
      });
    });
  });

  it('should throw MissingPathError when FILE tag is missing path', async () => {
    await expect(parseAstrolarkInput(transformerFn(sampleInputMissingPath)))
      .rejects.toThrow(MissingPathError);
  });

  it('should throw UnclosedFileSectionError when FILE section is not closed', async () => {
    await expect(parseAstrolarkInput(transformerFn(sampleInputUnclosedFile)))
      .rejects.toThrow(UnclosedFileSectionError);
  });

  it('should throw an error for nested FILE tags', async () => {
    await expect(parseAstrolarkInput(transformerFn(sampleInputNestedFile)))
      .rejects.toThrow(NestedFileSectionError);
  });
});
