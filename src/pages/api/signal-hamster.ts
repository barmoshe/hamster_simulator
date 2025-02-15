// src/pages/api/signal-hamster.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Connection, WorkflowClient } from "@temporalio/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { workflowId, action, value } = req.query;
  if (
    !workflowId ||
    typeof workflowId !== "string" ||
    !action ||
    typeof action !== "string"
  ) {
    res.status(400).json({ error: "workflowId and action are required" });
    return;
  }

  const connection = await Connection.connect();
  const client = new WorkflowClient({ connection });
  const handle = client.getHandle(workflowId);

  try {
    switch (action) {
      case "feed":
        await handle.signal("feed", Number(value) || 10);
        break;
      case "play":
        await handle.signal("play", Number(value) || 10);
        break;
      case "sleep":
        await handle.signal("sleep", Number(value) || 10);
        break;
      case "pet":
        await handle.signal("pet", Number(value) || 10);
        break;
      case "exercise":
        await handle.signal("exercise", Number(value) || 10);
        break;
      case "kill":
        await handle.signal("kill");
        break;
      case "acceptInvitation":
        await handle.signal("acceptInvitation");
        break;
      case "proposeMarriage":
        // 'value' is expected to be a string (the proposer’s workflowId)
        await handle.signal("proposeMarriage", value);
        break;
      case "acceptMarriage":
        await handle.signal("acceptMarriage");
        break;
      case "divorce":
        await handle.signal("divorce");
        break;
      default:
        res.status(400).json({ error: "Unknown action" });
        return;
    }
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
