// Network inputs/outputs (a bias node is added automatically)
export const INPUT_COUNT = 5;
export const OUTPUT_COUNT = 1;

// Chance that each connection weight is mutated at all
export const WEIGHT_MUTATION_RATE = 0.8;
// When a weight mutates: chance it is replaced outright instead of perturbed
export const WEIGHT_REPLACE_RATE = 0.1;
// Maximum size of a weight perturbation
export const WEIGHT_PERTURB_AMOUNT = 0.5;

// Chance of structural mutations per offspring
export const ADD_CONNECTION_RATE = 0.08;
export const ADD_NODE_RATE = 0.02;

// Chance a gene disabled in a parent is re-enabled in the child
export const GENE_REENABLE_RATE = 0.25;

// Chance offspring come from crossover (otherwise a mutated clone)
export const CROSSOVER_RATE = 0.75;

// Genomes closer than this compatibility distance share a species
export const COMPATIBILITY_THRESHOLD = 3.0;
// Weighting of disjoint/excess genes vs average weight difference
export const MISMATCH_COEFFICIENT = 1.0;
export const WEIGHT_COEFFICIENT = 0.4;

// Fraction of each species (fittest first) allowed to reproduce
export const SURVIVAL_RATE = 0.5;
// Species at least this big carry their champion over unchanged
export const ELITE_SPECIES_SIZE = 5;
