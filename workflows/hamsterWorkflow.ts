import {
    sleep,
    defineQuery,
    setHandler,
    proxyActivities,
    defineSignal,
    getExternalWorkflowHandle,
    workflowInfo,
  } from "@temporalio/workflow";
  import type * as activities from "../activities/hamsterActivities";
  
  // Basic states for hamster's day-to-day state machine.
  export type HamsterState =
    | "born"
    | "happy"
    | "hungry"
    | "eating"
    | "sleeping"
    | "sick"
    | "exercising"
    | "dating"
    | "dead";
  
  // Extended marital statuses.
  export type HamsterMaritalStatus =
    | "single"
    | "dating"
    | "married"
    | "divorced"
    | "widowed";
  
  export interface HamsterStats {
    age: number;
    hunger: number;
    energy: number;
    mood: number;
    state: HamsterState;             // day-to-day state
    gender: "male" | "female";
    childrenCount: number;
    maritalStatus: HamsterMaritalStatus;
    maritalPartner?: string;         // partner's workflowId
  }
  
  export interface HamsterWorkflowArgs {
    gender: "male" | "female";
  }
  
  // Signals for normal interactions.
  export const feedSignal = defineSignal<[number]>("feed");
  export const playSignal = defineSignal<[number]>("play");
  export const sleepSignal = defineSignal<[number]>("sleep");
  export const petSignal = defineSignal<[number]>("pet");
  export const exerciseSignal = defineSignal<[number]>("exercise");
  export const killSignal = defineSignal("kill");
  
  // Signals for the dating / marriage flow.
  export const dateInvitationSignal = defineSignal<[string]>("dateInvitation");
  // The female calls this to accept the invitation to date.
  export const acceptInvitationSignal = defineSignal("acceptInvitation");
  // Either partner can propose marriage to the other.
  export const proposeMarriageSignal = defineSignal("proposeMarriage");
  // The receiving partner calls this to accept a marriage proposal.
  export const acceptMarriageSignal = defineSignal("acceptMarriage");
  // Either partner can call divorce.
  export const divorceSignal = defineSignal("divorce");
  
  export const getStatsQuery = defineQuery<HamsterStats>("getStats");
  
  const { updateStats } = proxyActivities<typeof activities>({
    startToCloseTimeout: "1 minute",
  });
  
  export async function hamsterLifeWorkflow(
    args: HamsterWorkflowArgs
  ): Promise<HamsterStats> {
    let stats: HamsterStats = {
      age: 0,
      hunger: 0,
      energy: 100,
      mood: 70,
      state: "born",
      gender: args.gender,
      childrenCount: 0,
      maritalStatus: "single",
    };
  
    // Start hamster as "happy".
    stats.state = "happy";
  
    // Local flags to handle pending invitations or proposals.
    let invitationPending = false;
    let marriageProposalPending = false;
  
    // The partner ID (if any) that is attempting to date or marry us.
    let partnerId: string | null = null;
  
    setHandler(getStatsQuery, () => stats);
  
    // Common signals for feeding, playing, etc.
    setHandler(feedSignal, (amount: number) => {
      stats.hunger = Math.max(stats.hunger - amount, 0);
      stats.mood = Math.min(stats.mood + Math.floor(amount / 4), 100);
    });
    setHandler(playSignal, (amount: number) => {
      stats.energy = Math.min(stats.energy + amount, 100);
      stats.hunger = Math.min(stats.hunger + Math.floor(amount / 2), 100);
      stats.mood = Math.min(stats.mood + Math.floor(amount / 3), 100);
    });
    setHandler(sleepSignal, (amount: number) => {
      stats.energy = Math.min(stats.energy + amount, 100);
      stats.mood = Math.min(stats.mood + Math.floor(amount / 5), 100);
    });
    setHandler(petSignal, (amount: number) => {
      stats.mood = Math.min(stats.mood + amount, 100);
    });
    setHandler(exerciseSignal, (amount: number) => {
      stats.energy = Math.min(stats.energy + amount, 100);
      stats.mood = Math.max(stats.mood - Math.floor(amount / 2), 0);
      stats.state = "exercising";
    });
  
    // killSignal: if hamster is "married", we notify the partner that they are now widowed.
    setHandler(killSignal, async () => {
      stats.state = "dead";
      if (stats.maritalStatus === "married" && stats.maritalPartner) {
        // Signal the partner to become widowed.
        const partnerHandle = getExternalWorkflowHandle(stats.maritalPartner);
        await partnerHandle.signal("becomeWidowed");
      }
    });
  
    // A private signal for the partner to become widowed if we died.
    // We'll define that as well:
    setHandler(defineSignal("becomeWidowed"), () => {
      if (stats.maritalStatus === "married") {
        stats.maritalStatus = "widowed";
        stats.maritalPartner = undefined;
      }
    });
  
    // dateInvitationSignal: the "male" workflow calls this on a female. 
    setHandler(dateInvitationSignal, (maleWorkflowId: string) => {
      if (stats.maritalStatus === "single") {
        invitationPending = true;
        partnerId = maleWorkflowId;
        stats.state = "dating";
        stats.maritalStatus = "dating";
        console.log(`Hamster (${stats.gender})@${workflowInfo().workflowId} received date invitation from ${maleWorkflowId}`);
        // We can optionally signal the male to update his status to "dating" immediately.
        const maleHandle = getExternalWorkflowHandle(maleWorkflowId);
        maleHandle.signal("partnerDatingStarted", workflowInfo().workflowId);
      }
    });
  
    // A private signal for the male to become "dating" if female accepted the invitation.
    setHandler(defineSignal<[string]>("partnerDatingStarted"), (femaleId: string) => {
      if (stats.maritalStatus === "single") {
        stats.maritalStatus = "dating";
        stats.maritalPartner = femaleId;
        stats.state = "dating";
        console.log(`Hamster (${stats.gender})@${workflowInfo().workflowId} is now dating with partner ${femaleId}`);
      }
    });
  
    // acceptInvitationSignal: the female calls this to confirm dating. 
    setHandler(acceptInvitationSignal, async () => {
      if (invitationPending && partnerId) {
        invitationPending = false;
        // We remain in "dating" status, but let's ensure the male is set as partner.
        stats.maritalPartner = partnerId;
        console.log(`Hamster (${stats.gender})@${workflowInfo().workflowId} accepted invitation from ${partnerId}`);
        // Signal the male to set his partner ID to me if not already.
        const maleHandle = getExternalWorkflowHandle(partnerId);
        await maleHandle.signal("partnerDatingStarted", workflowInfo().workflowId);
      }
    });
  
    // proposeMarriageSignal: either partner can do this. 
    setHandler(proposeMarriageSignal, () => {
      if (stats.maritalPartner) {
        // If we are "dating" or "single," we can propose. 
        if (stats.maritalStatus === "dating" || stats.maritalStatus === "single") {
          marriageProposalPending = true;
          console.log(`Hamster(${stats.gender})@${workflowInfo().workflowId} is proposing marriage to partner ${stats.maritalPartner}`);
          // Tell partner we are proposing 
          const partnerHandle = getExternalWorkflowHandle(stats.maritalPartner);
          partnerHandle.signal("marriageProposalReceived", workflowInfo().workflowId);
        }
      }
    });
  
    // marriageProposalReceived: the other partner receives this. 
    setHandler(defineSignal<[string]>("marriageProposalReceived"), (proposerId: string) => {
      if (stats.maritalStatus === "dating" || stats.maritalStatus === "single") {
        // Store the info that we have a marriage proposal pending from proposerId
        marriageProposalPending = true;
        partnerId = proposerId; 
        console.log(`Hamster(${stats.gender})@${workflowInfo().workflowId} got a proposal from ${proposerId}`);
      }
    });
  
    // acceptMarriageSignal: used to finalize the marriage if we have a proposal pending.
    setHandler(acceptMarriageSignal, async () => {
      if (marriageProposalPending && partnerId) {
        // We are now married
        stats.maritalStatus = "married";
        stats.maritalPartner = partnerId;
        marriageProposalPending = false;
        console.log(`Hamster(${stats.gender})@${workflowInfo().workflowId} accepted marriage proposal from ${partnerId}`);
        // Inform partner they are married to us
        const partnerHandle = getExternalWorkflowHandle(partnerId);
        await partnerHandle.signal("partnerMarried", workflowInfo().workflowId);
      }
    });
  
    // partnerMarried: private signal to finalize marriage on partner's side.
    setHandler(defineSignal<[string]>("partnerMarried"), (spouseId: string) => {
      stats.maritalPartner = spouseId;
      stats.maritalStatus = "married";
      console.log(`Hamster(${stats.gender})@${workflowInfo().workflowId} is now married to ${spouseId}`);
    });
  
    // divorceSignal: if either partner calls this, we revert both to single (or "divorced").
    setHandler(divorceSignal, async () => {
      if (stats.maritalStatus === "married" && stats.maritalPartner) {
        const exPartner = stats.maritalPartner;
        stats.maritalStatus = "divorced";
        stats.maritalPartner = undefined;
        console.log(`Hamster(${stats.gender})@${workflowInfo().workflowId} divorced from ${exPartner}`);
        // Tell the partner to do the same
        const partnerHandle = getExternalWorkflowHandle(exPartner);
        await partnerHandle.signal("becomeDivorced");
      }
    });
  
    // becomeDivorced: private signal for the partner
    setHandler(defineSignal("becomeDivorced"), () => {
      if (stats.maritalStatus === "married") {
        stats.maritalStatus = "divorced";
        stats.maritalPartner = undefined;
        console.log(`Hamster(${stats.gender})@${workflowInfo().workflowId} is now divorced`);
      }
    });
  
    // Main loop: skip day-to-day updates if there's a pending invitation or proposal 
    // to keep "dating" locked. 
    while (stats.state !== "dead") {
      const skipUpdates = invitationPending || marriageProposalPending;
      if (!skipUpdates) {
        stats = await updateStats(stats);
        if (stats.mood < 20 && stats.state !== "sick") {
          stats.state = "sick";
        } else if (stats.mood > 80 && stats.state === "sick") {
          stats.state = "happy";
        }
        stats.age += 1;
        stats.mood = Math.max(stats.mood - 1, 0);
      } else {
        // Force "dating" if in a pending invitation or proposal scenario, 
        // or keep "happy"/"married" if that is stable. 
        if (stats.maritalStatus === "dating") {
          stats.state = "dating";
        }
      }
      await sleep(1000);
    }
    return stats;
  }
  