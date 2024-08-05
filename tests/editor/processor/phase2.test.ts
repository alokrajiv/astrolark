import { phase2 } from '../../../src/editor/processor/phase2';
import { FileObject_p1, FileObject_p2, ProcessorContext, MisplacedBlockError } from '../../../src/editor/processor/types';

describe('Phase 2: Identify block types', () => {
  const context: ProcessorContext = { rootDir: '/test' };

  it('should identify full block', async () => {
    const input: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [{ type: 'edit', content: ['line1', 'line2'] }]
      }
    ];

    const expected: FileObject_p2[] = [
      {
        path: 'test.txt',
        chunks: [{ type: 'edit', content: ['line1', 'line2'], blockType: 'full' }]
      }
    ];

    const result = await phase2(input, context);
    expect(result).toEqual(expected);
  });

  it('should identify top, middle, and bottom blocks', async () => {
    const input: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'edit', content: ['top'] },
          { type: 'no-change' },
          { type: 'edit', content: ['middle'] },
          { type: 'no-change' },
          { type: 'edit', content: ['bottom'] }
        ]
      }
    ];

    const expected: FileObject_p2[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'edit', content: ['top'], blockType: 'top' },
          { type: 'no-change', blockType: 'no-change' },
          { type: 'edit', content: ['middle'], blockType: 'middle' },
          { type: 'no-change', blockType: 'no-change' },
          { type: 'edit', content: ['bottom'], blockType: 'bottom' }
        ]
      }
    ];

    const result = await phase2(input, context);
    expect(result).toEqual(expected);
  });

  it('should throw MisplacedBlockError for invalid block placement', async () => {
    const input: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'edit', content: ['top'] },
          { type: 'edit', content: ['invalid'] },
          { type: 'no-change' },
          { type: 'edit', content: ['bottom'] }
        ]
      }
    ];

    await expect(phase2(input, context)).rejects.toThrow(MisplacedBlockError);
  });

  it('should handle empty input', async () => {
    const input: FileObject_p1[] = [];
    const result = await phase2(input, context);
    expect(result).toEqual([]);
  });

  it('should handle file with only no-change chunks', async () => {
    const input: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'no-change' },
          { type: 'no-change' }
        ]
      }
    ];

    const expected: FileObject_p2[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'no-change', blockType: 'no-change' },
          { type: 'no-change', blockType: 'no-change' }
        ]
      }
    ];

    const result = await phase2(input, context);
    expect(result).toEqual(expected);
  });
});