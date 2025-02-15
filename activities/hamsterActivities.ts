// activities/hamsterActivities.ts
import type { HamsterStats } from '../workflows/hamsterWorkflow';

export async function updateStats(stats: HamsterStats): Promise<HamsterStats> {
  stats.age += 1;
  stats.hunger = Math.min(stats.hunger + 2, 100);
  stats.energy = Math.max(stats.energy - 1, 0);

  if (stats.hunger > 80 && stats.state !== 'hungry') {
    stats.state = 'hungry';
  }
  if (stats.hunger >= 100) {
    stats.state = 'dead';
    return stats;
  }
  if (stats.energy < 40 && stats.state !== 'hungry') {
    stats.state = 'sleeping';
    stats.energy = Math.min(stats.energy + 5, 100);
  } else if (stats.state === 'sleeping' && stats.energy >= 70) {
    stats.state = 'happy';
  }
  if (stats.state === 'happy' && Math.random() < 0.02) {
    stats.state = 'sick';
  } else if (stats.state === 'sick' && Math.random() < 0.2) {
    stats.state = 'happy';
    stats.energy = Math.min(stats.energy + 10, 100);
  }
  if (stats.state === 'hungry' && stats.hunger > 50 && stats.energy > 60) {
    if (Math.random() < 0.3) {
      stats.state = 'eating';
      stats.hunger = Math.max(stats.hunger - 20, 0);
      stats.energy = Math.min(stats.energy + 10, 100);
      stats.state = 'happy';
    }
  }
  return stats;
}
