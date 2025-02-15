// workflows/worldWorkflow.ts
import { startChild, sleep, defineSignal, setHandler, defineQuery } from '@temporalio/workflow';
import { hamsterLifeWorkflow, HamsterWorkflowArgs } from './hamsterWorkflow.ts';

export interface WorldState {
  femaleHamsters: string[];
  maleHamsters: string[];
  nextChildId: number;
}

let state: WorldState = {
  femaleHamsters: [],
  maleHamsters: [],
  nextChildId: 1,
};

// Signal to create a new hamster child workflow. It accepts HamsterWorkflowArgs.
export const createHamsterSignal = defineSignal<[HamsterWorkflowArgs]>('createHamster');
// Signal for broadcasting a date invitation (from a male); argument is the male's workflow ID.
export const broadcastInvitationSignal = defineSignal<[string]>('broadcastInvitation');
// Query to get the current world state.
export const getWorldStateQuery = defineQuery<WorldState>('getWorldState');

// When a createHamster signal is received, spawn a child workflow using a deterministic ID.
setHandler(createHamsterSignal, async (hamsterArgs: HamsterWorkflowArgs) => {
  // Generate a child workflow ID deterministically using a counter.
  const childWorkflowId = `hamster-${state.nextChildId}-${hamsterArgs.gender}`;
  state.nextChildId += 1;
  // Start the child workflow.
  const childHandle = await startChild(hamsterLifeWorkflow, {
    args: [hamsterArgs],
    workflowId: childWorkflowId,
  });
  // Register the child by gender.
  if (hamsterArgs.gender === 'female') {
    state.femaleHamsters.push(childWorkflowId);
  } else {
    state.maleHamsters.push(childWorkflowId);
  }
});

// When a broadcast invitation is received, log the event.
setHandler(broadcastInvitationSignal, async (maleWorkflowId: string) => {
  console.log(
    `World received broadcast invitation from male ${maleWorkflowId}. Registered females: ${state.femaleHamsters.join(', ')}`
  );
  // (In a real implementation, you might trigger external signaling here.)
});

// Query handler returns the current world state.
setHandler(getWorldStateQuery, () => state);

export async function worldWorkflow(): Promise<WorldState> {
  while (true) {
    await sleep(1000);
  }
}
