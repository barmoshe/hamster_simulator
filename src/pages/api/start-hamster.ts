// src/pages/api/hamster-stats.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Connection, WorkflowClient } from '@temporalio/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { workflowId } = req.query;
  if (!workflowId || typeof workflowId !== 'string') {
    res.status(400).json({ error: 'workflowId required' });
    return;
  }
  
  const connection = await Connection.connect();
  const client = new WorkflowClient({ connection });
  const handle = client.getHandle(workflowId);
  
  try {
    const stats = await handle.query('getStats');
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
