import { BIRD_COLORS, BIRD_CREATE_LIMIT } from "../constants/bird";
import {
  COMPATIBILITY_THRESHOLD,
  CROSSOVER_RATE,
  ELITE_SPECIES_SIZE,
  GLOBAL_ELITE_COUNT,
  SURVIVAL_RATE
} from "../constants/neat";
import { createBird } from "./bird";
import { createCopy, getRandomItem } from "./helper";
import { compatibilityDistance, crossoverGenomes, mutateGenome } from "./neat";

// Function to group birds into species by genome compatibility, so new
// topologies compete within their own niche instead of against the whole
// population before they've had time to optimize
function speciate(birds) {
  const species = [];
  for (const bird of birds) {
    const home = species.find(
      (s) =>
        compatibilityDistance(s.representative, bird.brain) <
        COMPATIBILITY_THRESHOLD
    );
    if (home) {
      home.members.push(bird);
    } else {
      species.push({ representative: bird.brain, members: [bird] });
    }
  }
  return species;
}

// Function to breed one offspring from a pool of parent birds
function createChild(parents, color) {
  const partnerA = getRandomItem(parents);
  let brain;
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
  return createBird({ brain, color });
}

// Cycle species through the available colors so speciation is
// visible during training
const SPECIES_COLORS = Object.values(BIRD_COLORS);

function getSpeciesColor(index) {
  return SPECIES_COLORS[index % SPECIES_COLORS.length];
}

// Function to create an initial population of birds
export function createPopulation() {
  const birds = [];
  for (let i = 0; i < BIRD_CREATE_LIMIT; i += 1) {
    birds.push(createBird({ color: BIRD_COLORS.RED }));
  }
  return birds;
}

// Function to generate the next generation of birds using NEAT:
// speciation, fitness sharing, elitism, then crossover and mutation
export function nextGeneration(birds) {
  // Fitness rewards longer survival superlinearly
  for (const bird of birds) {
    bird.fitness = bird.distance ** 2;
  }

  const species = speciate(birds);

  // Fitness sharing: a species is scored by its mean fitness, so large
  // species don't crowd out small ones exploring new structures
  let totalScore = 0;
  for (const s of species) {
    s.members.sort((a, b) => b.fitness - a.fitness);
    s.score =
      s.members.reduce((sum, bird) => sum + bird.fitness, 0) / s.members.length;
    totalScore += s.score;
  }

  const newBirds = [];

  // Global elitism: the overall fittest birds always carry over unchanged,
  // even if their species is too small for per-species elitism. This makes
  // the recorded best distance monotonic - the champion can never be lost.
  const ranked = [...birds].sort((a, b) => b.fitness - a.fitness);
  for (let i = 0; i < GLOBAL_ELITE_COUNT && i < ranked.length; i += 1) {
    newBirds.push(
      createBird({ brain: ranked[i].brain, color: ranked[i].color })
    );
  }

  species.forEach((s, index) => {
    const color = getSpeciesColor(index);
    // Offspring quota proportional to the species' share of total score;
    // species that round down to zero die out
    let quota = Math.round((s.score / totalScore) * BIRD_CREATE_LIMIT);
    // Only the fittest part of a species gets to reproduce
    const parents = s.members.slice(
      0,
      Math.max(1, Math.ceil(s.members.length * SURVIVAL_RATE))
    );
    // Elitism - big species carry their champion over unchanged
    if (s.members.length >= ELITE_SPECIES_SIZE && quota > 0) {
      newBirds.push(createBird({ brain: s.members[0].brain, color }));
      quota -= 1;
    }
    for (let i = 0; i < quota; i += 1) {
      newBirds.push(createChild(parents, color));
    }
  });

  // Rounding can leave the population slightly off target
  while (newBirds.length > BIRD_CREATE_LIMIT) {
    newBirds.pop();
  }
  const best = birds.reduce(
    (a, b) => (b.fitness > a.fitness ? b : a),
    birds[0]
  );
  while (newBirds.length < BIRD_CREATE_LIMIT) {
    newBirds.push(createChild([best], best.color));
  }

  return { birds: newBirds, speciesCount: species.length };
}
