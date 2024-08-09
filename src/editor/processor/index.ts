import { phase1 } from './phase1.js';
import { phase2 } from './phase2.js';
import { phase3 } from './phase3.js';
import { phase4 } from './phase4.js';
import { ProcessorContext, FileObject_p0, FileObject_p1, FileObject_p2 } from './types';

export {
  phase1,
  phase2,
  phase3,
  phase4,
  ProcessorContext,
  FileObject_p0,
  FileObject_p1,
  FileObject_p2
};

export async function processEdits(fileObjects: FileObject_p0[], context: ProcessorContext): Promise<void> {
  const phase1Result = await phase1(fileObjects, context);
  const phase2Result = await phase2(phase1Result, context);
  await phase3(phase2Result, context);
  await phase4(phase2Result, context);
}
