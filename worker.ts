// worker.ts
import { Worker } from '@temporalio/worker';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Point to the workflows directory (which contains index.ts)
const workflowsPath = join(__dirname, 'workflows');

async function run() {
  // Import activities using the .ts extension (ensure tsconfig allows importing TS extensions)
  const activities = await import('./activities/hamsterActivities.ts');

  const worker = await Worker.create({
    workflowsPath,
    activities,
    taskQueue: 'hamster',
  });

  console.log('Worker started');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
