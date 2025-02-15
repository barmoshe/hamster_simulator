// start-world.ts
import { Connection, WorkflowClient } from '@temporalio/client';

async function startWorldWorkflow() {
  const connection = await Connection.connect(); // defaults to localhost:7233
  const client = new WorkflowClient({ connection });

  try {
    // Try to query the world workflow (assuming it is already running with id "world")
    const handle = client.getHandle('world');
    await handle.query('getWorldState');
    console.log('World workflow already running.');
  } catch (err: any) {
    console.log('World workflow not found. Starting new world workflow...');
    // Instead of importing the workflow function, start the workflow by name.
    const handle = await client.start('worldWorkflow', {
      taskQueue: 'hamster',
      workflowId: 'world',
    });
    console.log(`World workflow started with workflowId: ${handle.workflowId}`);
  }
}

startWorldWorkflow().catch((err) => {
  console.error('Failed to start world workflow', err);
  process.exit(1);
});
