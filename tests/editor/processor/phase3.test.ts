import { phase3, AstrolarkMarkersExistError } from '../../../src/editor/processor/phase3';
import { FileObject_p2, ProcessorContext } from '../../../src/editor/processor/types';
import fs from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');
jest.mock('path');

describe('Phase 3: Apply anchors', () => {
  const mockRootDir = '/mock/root';
  const context: ProcessorContext = { rootDir: mockRootDir, verbose: false };

  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.isAbsolute as jest.Mock).mockImplementation((p) => p.startsWith('/'));
  });

  it('should add anchors for a full file edit', async () => {
    const input: FileObject_p2[] = [{
      path: 'test.js',
      chunks: [{
        type: 'edit',
        content: [
          'function hello() {',
          '    console.log("Hello, world!");',
          '}'
        ],
        blockId: 'block1',
        blockType: 'full',
        topAnchor: '@@ALK_block1_ANCHOR_TOP',
        bottomAnchor: '@@ALK_block1_ANCHOR_BOTTOM'
      }]
    }];

    const originalContent = `function hello() {
    console.log("Hello, world!");
}`;

    const expectedContent = `@@ALK_block1_ANCHOR_TOP
function hello() {
    console.log("Hello, world!");
}
@@ALK_block1_ANCHOR_BOTTOM`;

    (fs.readFile as jest.Mock).mockResolvedValue(originalContent);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await phase3(input, context);

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/mock/root/test.js',
      expectedContent
    );
  });

  it('should add anchors for partial edits with no-change sections', async () => {
    const input: FileObject_p2[] = [{
      path: 'test.js',
      chunks: [
        {
          type: 'edit',
          content: [
            'function greet(name) {',
            '    console.log("Hello, " + name + "!");'
          ],
          blockId: 'block1',
          blockType: 'top',
          topAnchor: '@@ALK_block1_ANCHOR_TOP',
          bottomAnchor: '@@ALK_block1_ANCHOR_BOTTOM'
        },
        {
          type: 'no-change',
          blockId: 'block2',
          blockType: 'no-change'
        },
        {
          type: 'edit',
          content: [
            '    console.log("Enjoy your stay!");',
            '}'
          ],
          blockId: 'block3',
          blockType: 'bottom',
          topAnchor: '@@ALK_block3_ANCHOR_TOP',
          bottomAnchor: '@@ALK_block3_ANCHOR_BOTTOM'
        }
      ]
    }];

    const originalContent = `function greet(name) {
    console.log("Hello, " + name + "!");
    console.log("Welcome to our program.");
    console.log("Enjoy your stay!");
}`;

    const expectedContent = `@@ALK_block1_ANCHOR_TOP
function greet(name) {
    console.log("Hello, " + name + "!");
@@ALK_block1_ANCHOR_BOTTOM
    console.log("Welcome to our program.");
@@ALK_block3_ANCHOR_TOP
    console.log("Enjoy your stay!");
}
@@ALK_block3_ANCHOR_BOTTOM`;

    (fs.readFile as jest.Mock).mockResolvedValue(originalContent);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await phase3(input, context);

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/mock/root/test.js',
      expectedContent
    );
  });

  it('should throw an AstrolarkMarkersExistError if the file already contains Astrolark markers', async () => {
    const input: FileObject_p2[] = [{
      path: 'test.js',
      chunks: [{
        type: 'edit',
        content: ['// Some content'],
        blockId: 'block1',
        blockType: 'full',
        topAnchor: '@@ALK_block1_ANCHOR_TOP',
        bottomAnchor: '@@ALK_block1_ANCHOR_BOTTOM'
      }]
    }];

    const originalContent = `@@ALK_existing_ANCHOR_TOP
// Existing content
@@ALK_existing_ANCHOR_BOTTOM`;

    (fs.readFile as jest.Mock).mockResolvedValue(originalContent);

    await expect(phase3(input, context)).rejects.toThrow(AstrolarkMarkersExistError);
    await expect(phase3(input, context)).rejects.toThrow('File /mock/root/test.js already contains Astrolark markers');
  });

  it('should handle absolute file paths', async () => {
    const input: FileObject_p2[] = [{
      path: '/absolute/path/test.js',
      chunks: [{
        type: 'edit',
        content: ['// Original content'],
        blockId: 'block1',
        blockType: 'full',
        topAnchor: '@@ALK_block1_ANCHOR_TOP',
        bottomAnchor: '@@ALK_block1_ANCHOR_BOTTOM'
      }]
    }];

    const originalContent = '// Original content';
    const expectedContent = `// Original content
@@ALK_block1_ANCHOR_BOTTOM`;

    (fs.readFile as jest.Mock).mockResolvedValue(originalContent);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await phase3(input, context);

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/absolute/path/test.js',
      expectedContent
    );
  });

  it('should add both top and bottom anchors when content allows', async () => {
    const input: FileObject_p2[] = [{
      path: 'test.js',
      chunks: [{
        type: 'edit',
        content: [
          'function hello() {',
          '    console.log("Hello, world!");',
          '}'
        ],
        blockId: 'block1',
        blockType: 'full',
        topAnchor: '@@ALK_block1_ANCHOR_TOP',
        bottomAnchor: '@@ALK_block1_ANCHOR_BOTTOM'
      }]
    }];

    const originalContent = `// Some comment
function hello() {
    console.log("Hello, world!");
}
// Another comment`;

    const expectedContent = `// Some comment
@@ALK_block1_ANCHOR_TOP
function hello() {
    console.log("Hello, world!");
}
@@ALK_block1_ANCHOR_BOTTOM
// Another comment`;

    (fs.readFile as jest.Mock).mockResolvedValue(originalContent);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await phase3(input, context);

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/mock/root/test.js',
      expectedContent
    );
  });

});
