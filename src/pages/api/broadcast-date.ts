// src/pages/api/broadcast-date.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Connection, WorkflowClient } from '@temporalio/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // The male hamster's workflowId is passed as a query parameter.
  const { workflowId } = req.query;
  if (!workflowId || typeof workflowId !== 'string') {
    res.status(400).json({ error: 'Male workflowId is required' });
    return;
  }
  
  const connection = await Connection.connect();
  const client = new WorkflowClient({ connection });
  
  // Get the world workflow handle.
  const worldHandle = client.getHandle('world');
  
  // Query the world workflow for its state to get all registered female hamster IDs.
  const worldState = await worldHandle.query<{ femaleHamsters: string[] }>('getWorldState');
  const registeredFemales = worldState.femaleHamsters;
  
  // For each registered female, signal her with a date invitation containing the male's workflowId.
  for (const femaleId of registeredFemales) {
    const femaleHandle = client.getHandle(femaleId);
    await femaleHandle.signal('dateInvitation', workflowId);
  }
  
  res.status(200).json({ success: true });
}
