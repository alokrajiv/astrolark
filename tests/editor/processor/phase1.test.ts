import { phase1 } from '../../../src/editor/processor/phase1';
import { FileObject_p0, FileObject_p1, ProcessorContext } from '../../../src/editor/processor/types';

describe('Phase 1: Remove consecutive no-change chunks', () => {
  const context: ProcessorContext = { rootDir: '/test' };

  it('should remove consecutive no-change chunks', async () => {
    const input: FileObject_p0[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'no-change', blockId: 'block1' },
          { type: 'no-change', blockId: 'block2' },
          { type: 'edit', content: ['line1'], blockId: 'block3' },
          { type: 'no-change', blockId: 'block4' },
          { type: 'no-change', blockId: 'block5' },
          { type: 'edit', content: ['line2'], blockId: 'block6' },
        ]
      }
    ];

    const expected: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'no-change', blockId: 'block1' },
          { type: 'edit', content: ['line1'], blockId: 'block3' },
          { type: 'no-change', blockId: 'block4' },
          { type: 'edit', content: ['line2'], blockId: 'block6' },
        ]
      }
    ];

    const result = await phase1(input, context);
    expect(result).toEqual(expected);
  });

  it('should preserve whitespace and empty lines in edit chunks', async () => {
    const input: FileObject_p0[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'edit', content: ['  line1', '', '    line3'], blockId: 'block1' },
          { type: 'no-change', blockId: 'block2' },
          { type: 'edit', content: ['line4', '  ', 'line6'], blockId: 'block3' },
        ]
      }
    ];

    const expected: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'edit', content: ['  line1', '', '    line3'], blockId: 'block1' },
          { type: 'no-change', blockId: 'block2' },
          { type: 'edit', content: ['line4', '  ', 'line6'], blockId: 'block3' },
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

  it('should handle file with only no-change chunks', async () => {
    const input: FileObject_p0[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'no-change', blockId: 'block1' },
          { type: 'no-change', blockId: 'block2' },
          { type: 'no-change', blockId: 'block3' },
        ]
      }
    ];

    const expected: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'no-change', blockId: 'block1' },
        ]
      }
    ];

    const result = await phase1(input, context);
    expect(result).toEqual(expected);
  });
});
