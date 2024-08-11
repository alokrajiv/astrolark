import { phase2 } from '../../../src/editor/processor/phase2';
import { FileObject_p1, FileObject_p2, ProcessorContext, MisplacedBlockError } from '../../../src/editor/processor/types';

describe('Phase 2: Identify block types', () => {
  const context: ProcessorContext = { rootDir: '/test', verbose: false };

  it('should identify full block with anchors', async () => {
    const input: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [{ type: 'edit', content: ['line1', 'line2'], blockId: 'block1' }]
      }
    ];

    const expected: FileObject_p2[] = [
      {
        path: 'test.txt',
        chunks: [{
          type: 'edit',
          content: ['line1', 'line2'],
          blockId: 'block1',
          blockType: 'full',
          topAnchor: '@@ALK_block1_ANCHOR_TOP',
          bottomAnchor: '@@ALK_block1_ANCHOR_BOTTOM'
        }]
      }
    ];

    const result = await phase2(input, context);
    expect(result).toEqual(expected);
  });

  it('should identify top, middle, and bottom blocks with anchors', async () => {
    const input: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'edit', content: ['top'], blockId: 'block1' },
          { type: 'no-change', blockId: 'block2' },
          { type: 'edit', content: ['middle'], blockId: 'block3' },
          { type: 'no-change', blockId: 'block4' },
          { type: 'edit', content: ['bottom'], blockId: 'block5' }
        ]
      }
    ];

    const expected: FileObject_p2[] = [
      {
        path: 'test.txt',
        chunks: [
          {
            type: 'edit',
            content: ['top'],
            blockId: 'block1',
            blockType: 'top',
            topAnchor: '@@ALK_block1_ANCHOR_TOP',
            bottomAnchor: '@@ALK_block1_ANCHOR_BOTTOM'
          },
          { type: 'no-change', blockId: 'block2', blockType: 'no-change' },
          {
            type: 'edit',
            content: ['middle'],
            blockId: 'block3',
            blockType: 'middle',
            topAnchor: '@@ALK_block3_ANCHOR_TOP',
            bottomAnchor: '@@ALK_block3_ANCHOR_BOTTOM'
          },
          { type: 'no-change', blockId: 'block4', blockType: 'no-change' },
          {
            type: 'edit',
            content: ['bottom'],
            blockId: 'block5',
            blockType: 'bottom',
            topAnchor: '@@ALK_block5_ANCHOR_TOP',
            bottomAnchor: '@@ALK_block5_ANCHOR_BOTTOM'
          }
        ]
      }
    ];

    const result = await phase2(input, context);
    expect(result).toEqual(expected);
  });

  it('should handle single no-change chunk between edit chunks', async () => {
    const input: FileObject_p1[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'edit', content: ['top'], blockId: 'block1' },
          { type: 'no-change', blockId: 'block2' },
          { type: 'edit', content: ['bottom'], blockId: 'block3' }
        ]
      }
    ];

    const expected: FileObject_p2[] = [
      {
        path: 'test.txt',
        chunks: [
          {
            type: 'edit',
            content: ['top'],
            blockId: 'block1',
            blockType: 'top',
            topAnchor: '@@ALK_block1_ANCHOR_TOP',
            bottomAnchor: '@@ALK_block1_ANCHOR_BOTTOM'
          },
          { type: 'no-change', blockId: 'block2', blockType: 'no-change' },
          {
            type: 'edit',
            content: ['bottom'],
            blockId: 'block3',
            blockType: 'bottom',
            topAnchor: '@@ALK_block3_ANCHOR_TOP',
            bottomAnchor: '@@ALK_block3_ANCHOR_BOTTOM'
          }
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
          { type: 'edit', content: ['top'], blockId: 'block1' },
          { type: 'edit', content: ['invalid'], blockId: 'block2' },
          { type: 'no-change', blockId: 'block3' },
          { type: 'edit', content: ['bottom'], blockId: 'block4' }
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
          { type: 'no-change', blockId: 'block1' }
        ]
      }
    ];

    const expected: FileObject_p2[] = [
      {
        path: 'test.txt',
        chunks: [
          { type: 'no-change', blockId: 'block1', blockType: 'no-change' }
        ]
      }
    ];

    const result = await phase2(input, context);
    expect(result).toEqual(expected);
  });

  it('should handle multiple files', async () => {
    const input: FileObject_p1[] = [
      {
        path: 'file1.txt',
        chunks: [
          { type: 'edit', content: ['file1 content'], blockId: 'block1' }
        ]
      },
      {
        path: 'file2.txt',
        chunks: [
          { type: 'edit', content: ['file2 top'], blockId: 'block1' },
          { type: 'no-change', blockId: 'block2' },
          { type: 'edit', content: ['file2 bottom'], blockId: 'block3' }
        ]
      }
    ];

    const expected: FileObject_p2[] = [
      {
        path: 'file1.txt',
        chunks: [
          {
            type: 'edit',
            content: ['file1 content'],
            blockId: 'block1',
            blockType: 'full',
            topAnchor: '@@ALK_block1_ANCHOR_TOP',
            bottomAnchor: '@@ALK_block1_ANCHOR_BOTTOM'
          }
        ]
      },
      {
        path: 'file2.txt',
        chunks: [
          {
            type: 'edit',
            content: ['file2 top'],
            blockId: 'block1',
            blockType: 'top',
            topAnchor: '@@ALK_block1_ANCHOR_TOP',
            bottomAnchor: '@@ALK_block1_ANCHOR_BOTTOM'
          },
          { type: 'no-change', blockId: 'block2', blockType: 'no-change' },
          {
            type: 'edit',
            content: ['file2 bottom'],
            blockId: 'block3',
            blockType: 'bottom',
            topAnchor: '@@ALK_block3_ANCHOR_TOP',
            bottomAnchor: '@@ALK_block3_ANCHOR_BOTTOM'
          }
        ]
      }
    ];

    const result = await phase2(input, context);
    expect(result).toEqual(expected);
  });
});
