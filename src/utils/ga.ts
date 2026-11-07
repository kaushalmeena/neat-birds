import { BirdColor, BIRD_CREATE_LIMIT } from "../constants/bird";
import {
  COMPATIBILITY_THRESHOLD,
  CROSSOVER_RATE,
  ELITE_SPECIES_SIZE,
  GLOBAL_ELITE_COUNT,
  SPECIES_STAGNATION_LIMIT,
  SURVIVAL_RATE
} from "../constants/neat";
import type { Bird, Species } from "../types";
import type { Genome } from "./neat";
import { createBird } from "./bird";
import { createCopy, getRandomItem } from "./helper";
import { compatibilityDistance, crossoverGenomes, mutateGenome } from "./neat";

const SPECIES_COLORS: BirdColor[] = Object.values(BirdColor);

// Next id for a newly founded species
const speciesIds = { next: 0 };

// Keeps new species ids ahead of loaded ones, like syncGenomeCounters()
export function syncSpeciesIds(species: Species[]): void {
  for (const s of species) {
    speciesIds.next = Math.max(speciesIds.next, s.id + 1);
  }
}

// A new species takes the color fewest living species wear, so colors
// stay as distinct as the palette allows
function pickSpeciesColor(species: Species[]): BirdColor {
  const counts = new Map<BirdColor, number>(
    SPECIES_COLORS.map((color) => [color, 0])
  );
  for (const s of species) {
    counts.set(s.color, (counts.get(s.color) ?? 0) + 1);
  }
  return SPECIES_COLORS.reduce((best, color) =>
    (counts.get(color) ?? 0) < (counts.get(best) ?? 0) ? color : best
  );
}

// Function to sort birds into species by genome compatibility, so new
// topologies compete within their own niche instead of against the whole
// population before they've had time to optimize. Existing species are
// tried first (in order), a bird that fits none founds a new species, and
// every bird takes its species' color. Species left empty are dropped.
export function speciate(birds: Bird[], species: Species[]): Species[] {
  for (const s of species) {
    s.members = [];
  }
  for (const bird of birds) {
    let home = species.find(
      (s) =>
        compatibilityDistance(s.representative, bird.brain) <
        COMPATIBILITY_THRESHOLD
    );
    if (!home) {
      home = {
        id: speciesIds.next,
        color: pickSpeciesColor(species),
        representative: bird.brain,
        members: [],
        bestFitness: 0,
        staleGenerations: 0
      };
      speciesIds.next += 1;
      species.push(home);
    }
    home.members.push(bird);
    bird.color = home.color;
  }
  return species.filter((s) => s.members.length > 0);
}

// Function to breed one offspring from a pool of parent birds
function createChild(parents: Bird[]): Bird {
  const partnerA = getRandomItem(parents);
  let brain: Genome;
  if (Math.random() < CROSSOVER_RATE) {
    // Crossover requires the fitter parent first
    const partnerB = getRandomItem(parents);
    if (partnerA.fitness >= partnerB.fitness) {
      brain = crossoverGenomes(partnerA.brain, partnerB.brain);
    } else {
      brain = crossoverGenomes(partnerB.brain, partnerA.brain);
    }
  } else {
    brain = createCopy(partnerA.brain);
  }
  mutateGenome(brain);
  return createBird({ brain });
}

// Function to create an initial population of birds, already speciated
export function createPopulation(): { birds: Bird[]; species: Species[] } {
  const birds: Bird[] = [];
  for (let i = 0; i < BIRD_CREATE_LIMIT; i += 1) {
    birds.push(createBird());
  }
  return { birds, species: speciate(birds, []) };
}

// Updates a species' record and stagnation counter from this generation's
// best member (members must be sorted fittest first)
function trackProgress(s: Species): void {
  const best = s.members[0].fitness;
  if (best > s.bestFitness) {
    s.bestFitness = best;
    s.staleGenerations = 0;
  } else {
    s.staleGenerations += 1;
  }
}

// Function to generate the next generation from the species of the one
// that just finished: fitness sharing, stagnation culling, elitism, then
// crossover and mutation. Returns the new birds and the species they were
// sorted into.
export function nextGeneration(species: Species[]): {
  birds: Bird[];
  species: Species[];
} {
  const birds = species.flatMap((s) => s.members);
  // Fitness rewards longer survival superlinearly
  for (const bird of birds) {
    bird.fitness = bird.distance ** 2;
  }
  const ranked = [...birds].sort((a, b) => b.fitness - a.fitness);
  const champion = ranked[0];

  for (const s of species) {
    s.members.sort((a, b) => b.fitness - a.fitness);
    trackProgress(s);
  }

  // Stagnant species stop reproducing, except the champion's own
  const survivors = species.filter(
    (s) =>
      s.staleGenerations < SPECIES_STAGNATION_LIMIT ||
      s.members.includes(champion)
  );

  // Fitness sharing: a species is scored by its mean fitness, so large
  // species don't crowd out small ones exploring new structures
  const scores = survivors.map(
    (s) =>
      s.members.reduce((sum, bird) => sum + bird.fitness, 0) / s.members.length
  );
  const totalScore = scores.reduce((sum, score) => sum + score, 0);

  const newBirds: Bird[] = [];

  // Global elitism: the overall fittest birds always carry over unchanged,
  // even if their species is too small for per-species elitism. This makes
  // the recorded best distance monotonic - the champion can never be lost.
  for (let i = 0; i < GLOBAL_ELITE_COUNT && i < ranked.length; i += 1) {
    newBirds.push(createBird({ brain: ranked[i].brain }));
  }

  survivors.forEach((s, index) => {
    // Offspring quota proportional to the species' share of total score;
    // species that round down to zero die out
    let quota = Math.round((scores[index] / totalScore) * BIRD_CREATE_LIMIT);
    // Only the fittest part of a species gets to reproduce
    const parents = s.members.slice(
      0,
      Math.max(1, Math.ceil(s.members.length * SURVIVAL_RATE))
    );
    // Elitism - big species carry their champion over unchanged
    if (s.members.length >= ELITE_SPECIES_SIZE && quota > 0) {
      newBirds.push(createBird({ brain: s.members[0].brain }));
      quota -= 1;
    }
    for (let i = 0; i < quota; i += 1) {
      newBirds.push(createChild(parents));
    }
  });

  // Rounding can leave the population slightly off target
  while (newBirds.length > BIRD_CREATE_LIMIT) {
    newBirds.pop();
  }
  while (newBirds.length < BIRD_CREATE_LIMIT) {
    newBirds.push(createChild([champion]));
  }

  // As in the NEAT paper, each species is represented next generation by a
  // random member of this one, so a species drifts along with its members
  for (const s of survivors) {
    s.representative = getRandomItem(s.members).brain;
  }
  return { birds: newBirds, species: speciate(newBirds, survivors) };
}
