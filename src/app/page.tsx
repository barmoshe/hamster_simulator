"use client";

import { useEffect, useState } from "react";

interface HamsterStats {
  age: number;
  hunger: number;
  energy: number;
  mood: number;
  state: string;
  gender?: "male" | "female";
  maritalStatus?: string;
  maritalPartner?: string;
  childrenCount?: number;
}

export default function Home() {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [stats, setStats] = useState<HamsterStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showGenderModal, setShowGenderModal] = useState(true);
  const [chosenGender, setChosenGender] = useState<"male" | "female">("male");
  const [reproductionModalOpen, setReproductionModalOpen] = useState(false);

  // Create a new hamster workflow via the world workflow.
  useEffect(() => {
    if (!showGenderModal) {
      async function createHamster() {
        setLoading(true);
        try {
          const res = await fetch(`/api/create-hamster?gender=${chosenGender}`);
          const data = await res.json();
          if (data.workflowId) {
            console.log("Created hamster workflow:", data.workflowId);
            setWorkflowId(data.workflowId);
          } else {
            console.error("No workflowId returned", data);
          }
        } catch (error) {
          console.error("Error creating hamster workflow:", error);
        } finally {
          setLoading(false);
        }
      }
      createHamster();
    }
  }, [showGenderModal, chosenGender]);

  // Poll for hamster stats.
  useEffect(() => {
    if (!workflowId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/hamster-stats?workflowId=${workflowId}`);
        if (res.ok) {
          const data = await res.json();
          console.log("Fetched stats:", data);
          setStats(data);
          // For a female hamster, if maritalStatus is "dating", open the modal.
          if (data.gender === "female" && data.maritalStatus === "dating") {
            setReproductionModalOpen(true);
          }
        }
      } catch (error) {
        console.error("Error fetching hamster stats:", error);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [workflowId]);

  // Helper to send signals.
  async function sendSignal(action: string, value?: number | string) {
    if (!workflowId) return;
    const url = `/api/signal-hamster?workflowId=${workflowId}&action=${action}${
      value ? `&value=${value}` : ""
    }`;
    try {
      await fetch(url);
    } catch (error) {
      console.error(`Error sending signal ${action}:`, error);
    }
  }

  async function broadcastInvitation() {
    if (!workflowId) return;
    await fetch(`/api/broadcast-date?workflowId=${workflowId}`);
  }

  async function acceptInvitation() {
    await sendSignal("acceptInvitation");
    setReproductionModalOpen(false);
  }

  async function forceInvitation() {
    // For testing: simulate receiving a date invitation.
    if (!workflowId) return;
    await sendSignal("dateInvitation", "12345");
  }

  async function refreshStats() {
    if (!workflowId) return;
    try {
      const res = await fetch(`/api/hamster-stats?workflowId=${workflowId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error refreshing stats:", error);
    }
  }

  return (
    <main className="min-h-screen p-4 flex flex-col items-center space-y-8">
      {/* Gender Selection Modal */}
      {showGenderModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              Choose Your Hamster's Gender
            </h2>
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => {
                  setChosenGender("male");
                  setShowGenderModal(false);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Male
              </button>
              <button
                onClick={() => {
                  setChosenGender("female");
                  setShowGenderModal(false);
                }}
                className="bg-pink-500 text-white px-4 py-2 rounded"
              >
                Female
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p>Creating hamster workflow...</p>}

      {stats ? (
        <div className="w-full max-w-md bg-gray-100 p-4 rounded shadow">
          <h1 className="text-2xl font-bold mb-2">Hamster Simulator</h1>
          <p className="mb-2">
            <strong>Workflow ID:</strong> {workflowId!}
          </p>
          <ul className="space-y-1">
            <li>
              <strong>Age:</strong> {stats.age} seconds
            </li>
            <li>
              <strong>Hunger:</strong> {stats.hunger} / 100
            </li>
            <li>
              <strong>Energy:</strong> {stats.energy} / 100
            </li>
            <li>
              <strong>Mood:</strong> {stats.mood} / 100
            </li>
            <li>
              <strong>State:</strong> {stats.state}
            </li>
            {stats.gender && (
              <li>
                <strong>Gender:</strong> {stats.gender}
              </li>
            )}
            {stats.maritalStatus && (
              <li>
                <strong>Marital Status:</strong> {stats.maritalStatus}
              </li>
            )}
            {stats.maritalPartner && (
              <li>
                <strong>Partner ID:</strong> {stats.maritalPartner}
              </li>
            )}
            {stats.childrenCount !== undefined && (
              <li>
                <strong>Children:</strong> {stats.childrenCount}
              </li>
            )}
          </ul>
          <button
            onClick={refreshStats}
            className="mt-4 bg-gray-700 text-white px-4 py-2 rounded"
          >
            Refresh Stats
          </button>
          {stats.gender === "female" && (
            <button
              onClick={forceInvitation}
              className="mt-2 bg-orange-500 text-white px-4 py-2 rounded"
            >
              Force Invitation (Test)
            </button>
          )}
        </div>
      ) : (
        !loading && <p>No hamster stats available yet.</p>
      )}

      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => sendSignal("feed", 20)}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Feed
        </button>
        <button
          onClick={() => sendSignal("play", 10)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Play
        </button>
        <button
          onClick={() => sendSignal("sleep", 15)}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Sleep
        </button>
        <button
          onClick={() => sendSignal("pet", 10)}
          className="bg-pink-500 text-white px-4 py-2 rounded"
        >
          Pet
        </button>
        <button
          onClick={() => sendSignal("exercise", 10)}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Exercise
        </button>
        <button
          onClick={() => sendSignal("kill")}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Kill
        </button>

        {workflowId &&
          (stats?.gender === "male" || chosenGender === "male") && (
            <button
              onClick={broadcastInvitation}
              className="bg-teal-500 text-white px-4 py-2 rounded"
            >
              Broadcast Invitation
            </button>
          )}
        {workflowId &&
          (stats?.gender === "female" || chosenGender === "female") && (
            <>
              <button
                onClick={() => setReproductionModalOpen(true)}
                className="bg-indigo-500 text-white px-4 py-2 rounded"
              >
                Check Invitations
              </button>
              {/* Marriage/Dating controls */}
              {stats.maritalStatus === "dating" && (
                <>
                  <button
                    onClick={() =>
                      sendSignal("proposeMarriage", workflowId!)
                    }
                    className="bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Propose Marriage
                  </button>
                  <button
                    onClick={() => sendSignal("divorce")}
                    className="bg-red-700 text-white px-4 py-2 rounded"
                  >
                    Divorce
                  </button>
                  <button
                    onClick={acceptInvitation}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                  >
                    Accept Invitation
                  </button>
                </>
              )}
              {stats.maritalStatus === "married" && (
                <button
                  onClick={() => sendSignal("divorce")}
                  className="bg-red-700 text-white px-4 py-2 rounded"
                >
                  Divorce
                </button>
              )}
              {stats.maritalStatus === "single" &&
                stats.state === "happy" && (
                  <button
                    onClick={() => sendSignal("acceptMarriage")}
                    className="bg-green-700 text-white px-4 py-2 rounded"
                  >
                    Accept Marriage Proposal
                  </button>
                )}
            </>
          )}
      </div>

      {reproductionModalOpen &&
        stats &&
        stats.gender === "female" &&
        stats.maritalStatus === "dating" && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg">
              <h2 className="text-xl font-bold mb-4">Date Invitation</h2>
              <p className="mb-4">
                You have received a date invitation. Do you want to accept?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={acceptInvitation}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => setReproductionModalOpen(false)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}

      <div className="w-full max-w-md h-64 border-4 border-dashed border-gray-300 flex items-center justify-center">
        <span className="text-gray-500">Hamster Image Placeholder</span>
      </div>
    </main>
  );
}
