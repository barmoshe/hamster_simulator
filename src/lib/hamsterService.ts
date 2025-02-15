// src/lib/hamsterService.ts

export type HamsterState =
  | "born"
  | "happy"
  | "hungry"
  | "eating"
  | "sleeping"
  | "sick"
  | "dead";

export interface HamsterStats {
  age: number;    // in seconds for simulation purposes
  hunger: number; // 0 to 100, where 100 is starving
  energy: number; // 0 to 100
  state: HamsterState;
}

export class HamsterSimulator {
  private age: number;
  private hunger: number;
  private energy: number;
  private state: HamsterState;
  private intervalId: ReturnType<typeof setInterval> | null;

  constructor() {
    this.age = 0;
    this.hunger = 0; // starts full
    this.energy = 100;
    this.state = "born";
    this.intervalId = null;
  }

  /**
   * Starts the simulation.
   * @param updateCallback A callback that receives the latest hamster stats.
   */
  start(updateCallback: (stats: HamsterStats) => void) {
    // Initialize state as happy after being born
    this.state = "happy";
    updateCallback(this.getStats());

    this.intervalId = setInterval(() => {
      this.tick();
      updateCallback(this.getStats());
    }, 1000); // update every second
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
    if (this.state === "dead") return;

    // Increase age
    this.age += 1;

    // Increase hunger and decrease energy over time
    this.hunger = Math.min(this.hunger + 5, 100);
    this.energy = Math.max(this.energy - 3, 0);

    // Update state based on conditions
    if (this.hunger > 70 && this.state !== "hungry") {
      this.state = "hungry";
    }

    // If hunger reaches 100, the hamster dies.
    if (this.hunger >= 100) {
      this.state = "dead";
      return;
    }

    // If energy is low, the hamster goes to sleep to regain energy.
    if (this.energy < 30 && this.state !== "hungry") {
      this.state = "sleeping";
      this.energy = Math.min(this.energy + 10, 100); // recovering energy while sleeping
    } else if (this.state === "sleeping" && this.energy >= 80) {
      this.state = "happy";
    }

    // Random chance to get sick when happy.
    if (this.state === "happy" && Math.random() < 0.05) {
      this.state = "sick";
    } else if (this.state === "sick" && Math.random() < 0.3) {
      // chance to recover from sickness
      this.state = "happy";
      this.energy = Math.min(this.energy + 20, 100);
    }

    // Optionally, simulate eating behavior to reduce hunger.
    if (this.state === "hungry" && this.hunger > 50 && this.energy > 50) {
      // 50% chance to start eating
      if (Math.random() < 0.5) {
        this.state = "eating";
        // Eating reduces hunger and restores some energy.
        this.hunger = Math.max(this.hunger - 30, 0);
        this.energy = Math.min(this.energy + 15, 100);
        // After eating, the hamster becomes happy.
        this.state = "happy";
      }
    }
  }

  getStats(): HamsterStats {
    return {
      age: this.age,
      hunger: this.hunger,
      energy: this.energy,
      state: this.state,
    };
  }
}
