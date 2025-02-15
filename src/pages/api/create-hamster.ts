// src/pages/api/create-hamster.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Connection, WorkflowClient } from '@temporalio/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get gender from query (default to "male").
  const { gender } = req.query;
  const chosenGender = (gender === 'female' ? 'female' : 'male') as 'male' | 'female';

  const connection = await Connection.connect();
  const client = new WorkflowClient({ connection });

  // Get a handle to the world workflow.
  const worldHandle = client.getHandle('world');

  // Signal the world workflow to create a new hamster.
  await worldHandle.signal('createHamster', { gender: chosenGender });

  // Wait briefly for the world workflow to spawn the new child.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Query the world workflow for its state.
  const worldState = await worldHandle.query<{ femaleHamsters: string[]; maleHamsters: string[] }>('getWorldState');
  let newWorkflowId: string | undefined;
  if (chosenGender === 'female' && worldState.femaleHamsters.length > 0) {
    newWorkflowId = worldState.femaleHamsters[worldState.femaleHamsters.length - 1];
  } else if (chosenGender === 'male' && worldState.maleHamsters.length > 0) {
    newWorkflowId = worldState.maleHamsters[worldState.maleHamsters.length - 1];
  }

  if (!newWorkflowId) {
    res.status(500).json({ error: 'Failed to create hamster workflow' });
    return;
  }

  res.status(200).json({ workflowId: newWorkflowId });
}
