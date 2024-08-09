import fs from 'fs/promises';
import path from 'path';
import { FileObject_p2, ProcessorContext } from './types.js';

export class AnchorNotFoundError extends Error {
  constructor(filePath: string, anchor: string) {
    super(`Anchor "${anchor}" not found in file ${filePath}`);
    this.name = 'AnchorNotFoundError';
  }
}

export async function phase4(fileObjects: FileObject_p2[], context: ProcessorContext): Promise<void> {
  for (const fileObject of fileObjects) {
    const filePath = path.isAbsolute(fileObject.path) ? fileObject.path : path.join(context.rootDir, fileObject.path);
    let content = await fs.readFile(filePath, 'utf-8');

    for (const chunk of fileObject.chunks) {
      if (chunk.type === 'edit') {
        if (chunk.blockType === 'full') {
          // For full blocks, replace the entire file content
          content = chunk.content.join('\n');
        } else {
          const startAnchor = chunk.topAnchor;
          const endAnchor = chunk.bottomAnchor;

          if (!startAnchor || !endAnchor) {
            throw new Error(`Missing anchors for chunk in file ${fileObject.path}`);
          }

          const startIndex = content.indexOf(startAnchor);
          const endIndex = content.indexOf(endAnchor);

          if (startIndex === -1 || endIndex === -1) {
            throw new AnchorNotFoundError(fileObject.path, startIndex === -1 ? startAnchor : endAnchor);
          }

          // Replace the content between anchors, removing the anchors themselves
          content = content.slice(0, startIndex) +
                    chunk.content.join('\n') +
                    content.slice(endIndex + endAnchor.length);
        }
      }
    }

    // Write the modified content back to the file
    await fs.writeFile(filePath, content);
  }
}
