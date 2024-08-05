import { phase1 } from '../../../src/editor/processor/phase1';
import { FileObject_p0, FileObject_p1, ProcessorContext } from '../../../src/editor/processor/types';

describe('Phase 1: Remove meaningless patterns', () => {
  const context: ProcessorContext = { rootDir: '/test' };

  it('should remove consecutive no-change chunks', async () => {
    const input: FileObject_p0[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'no-change' },
          { type: 'no-change' },
          { type: 'edit', content: ['line1'] },
          { type: 'no-change' },
          { type: 'no-change' },
          { type: 'edit', content: ['line2'] },
        ]
      }
    ];

    const expected: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'no-change' },
          { type: 'edit', content: ['line1'] },
          { type: 'no-change' },
          { type: 'edit', content: ['line2'] },
        ]
      }
    ];

    const result = await phase1(input, context);
    expect(result).toEqual(expected);
  });

  it('should remove whitespace-only edit chunks between no-change and file start/end', async () => {
    const input: FileObject_p0[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'edit', content: ['', '  ', ''] },
          { type: 'no-change' },
          { type: 'edit', content: ['line1', 'line2'] },
          { type: 'no-change' },
          { type: 'edit', content: ['', '  ', ''] },
        ]
      }
    ];

    const expected: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'no-change' },
          { type: 'edit', content: ['line1', 'line2'] },
          { type: 'no-change' },
        ]
      }
    ];

    const result = await phase1(input, context);
    expect(result).toEqual(expected);
  });

  it('should trim whitespace from edit chunks adjacent to no-change chunks', async () => {
    const input: FileObject_p0[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'edit', content: ['  line1', 'line2  '] },
          { type: 'no-change' },
          { type: 'edit', content: ['  line3', 'line4  '] },
        ]
      }
    ];

    const expected: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'edit', content: ['  line1', 'line2'] },
          { type: 'no-change' },
          { type: 'edit', content: ['line3', 'line4  '] },
        ]
      }
    ];

    const result = await phase1(input, context);
    expect(result).toEqual(expected);
  });

  it('should handle empty input', async () => {
    const input: FileObject_p0[] = [];
    const result = await phase1(input, context);
    expect(result).toEqual([]);
  });
});