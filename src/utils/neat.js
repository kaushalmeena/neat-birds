import {
  ADD_CONNECTION_RATE,
  ADD_NODE_RATE,
  GENE_REENABLE_RATE,
  MISMATCH_COEFFICIENT,
  WEIGHT_COEFFICIENT,
  WEIGHT_MUTATION_RATE,
  WEIGHT_PERTURB_AMOUNT,
  WEIGHT_REPLACE_RATE
} from "../constants/neat";
import { getRandomItem } from "./helper";

export const NODE_TYPES = {
  INPUT: "input",
  BIAS: "bias",
  HIDDEN: "hidden",
  OUTPUT: "output"
};

// --- Global innovation bookkeeping ---
// Innovation numbers give every connection gene a historical id, so genomes
// with different topologies can be aligned gene-by-gene during crossover and
// compared for speciation. The same structural mutation (same from->to pair)
// always receives the same innovation number.
let nextInnovation = 0;
let nextNodeId = 0;
const connectionInnovations = new Map();
// Maps a split connection's innovation to the hidden node id it produced, so
// the same split in different genomes yields the same node id
const splitNodeIds = new Map();

function getConnectionInnovation(from, to) {
  const key = `${from}->${to}`;
  if (!connectionInnovations.has(key)) {
    connectionInnovations.set(key, nextInnovation);
    nextInnovation += 1;
  }
  return connectionInnovations.get(key);
}

function getSplitNodeId(innovation) {
  if (!splitNodeIds.has(innovation)) {
    splitNodeIds.set(innovation, nextNodeId);
    nextNodeId += 1;
  }
  return splitNodeIds.get(innovation);
}

// Fast-forwards the global counters past any ids present in the given
// genomes, so mutations after loading a saved population can't collide
export function syncGenomeCounters(genomes) {
  for (const genome of genomes) {
    for (const node of genome.nodes) {
      nextNodeId = Math.max(nextNodeId, node.id + 1);
    }
    for (const conn of genome.connections) {
      nextInnovation = Math.max(nextInnovation, conn.innovation + 1);
    }
  }
}

// Steepened sigmoid as used in the original NEAT paper
function sigmoid(x) {
  return 1 / (1 + Math.exp(-4.9 * x));
}

function randomWeight() {
  return Math.random() * 2 - 1;
}

// Function to create a minimal genome: every input (plus a bias) connected
// directly to every output. Structure is grown later through mutation.
export function createGenome(inputCount, outputCount) {
  const nodes = [];
  const connections = [];
  for (let i = 0; i < inputCount; i += 1) {
    nodes.push({ id: i, type: NODE_TYPES.INPUT });
  }
  nodes.push({ id: inputCount, type: NODE_TYPES.BIAS });
  for (let i = 0; i < outputCount; i += 1) {
    nodes.push({ id: inputCount + 1 + i, type: NODE_TYPES.OUTPUT });
  }
  nextNodeId = Math.max(nextNodeId, nodes.length);
  for (const from of nodes) {
    if (from.type === NODE_TYPES.OUTPUT) {
      continue;
    }
    for (const to of nodes) {
      if (to.type === NODE_TYPES.OUTPUT) {
        connections.push({
          innovation: getConnectionInnovation(from.id, to.id),
          from: from.id,
          to: to.id,
          weight: randomWeight(),
          enabled: true
        });
      }
    }
  }
  return { nodes, connections };
}

// Function to evaluate the genome's network for the given inputs.
// Input node ids match input array indices; returns one value per output node.
export function feedForward(genome, inputs) {
  // Index enabled connections by their target node
  const incoming = new Map();
  for (const conn of genome.connections) {
    if (conn.enabled) {
      if (!incoming.has(conn.to)) {
        incoming.set(conn.to, []);
      }
      incoming.get(conn.to).push(conn);
    }
  }
  const values = new Map();
  for (const node of genome.nodes) {
    if (node.type === NODE_TYPES.INPUT) {
      values.set(node.id, inputs[node.id]);
    } else if (node.type === NODE_TYPES.BIAS) {
      values.set(node.id, 1);
    }
  }
  // Resolve each node recursively through its incoming connections
  const visiting = new Set();
  const getValue = (id) => {
    if (values.has(id)) {
      return values.get(id);
    }
    // Cycle guard - should not trigger since genomes stay feed-forward
    if (visiting.has(id)) {
      return 0;
    }
    visiting.add(id);
    let sum = 0;
    for (const conn of incoming.get(id) ?? []) {
      sum += conn.weight * getValue(conn.from);
    }
    visiting.delete(id);
    const value = sigmoid(sum);
    values.set(id, value);
    return value;
  };
  return genome.nodes
    .filter((node) => node.type === NODE_TYPES.OUTPUT)
    .map((node) => getValue(node.id));
}

// Checks whether adding a from->to connection would create a cycle,
// which would break the feed-forward evaluation
function createsCycle(genome, from, to) {
  if (from === to) {
    return true;
  }
  // If `from` is reachable by walking forward from `to`, the edge closes a loop
  const stack = [to];
  const seen = new Set();
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === from) {
      return true;
    }
    if (!seen.has(id)) {
      seen.add(id);
      for (const conn of genome.connections) {
        if (conn.from === id) {
          stack.push(conn.to);
        }
      }
    }
  }
  return false;
}

// Mutation: nudge or replace connection weights
function mutateWeights(genome) {
  for (const conn of genome.connections) {
    if (Math.random() < WEIGHT_MUTATION_RATE) {
      if (Math.random() < WEIGHT_REPLACE_RATE) {
        conn.weight = randomWeight();
      } else {
        conn.weight += (Math.random() * 2 - 1) * WEIGHT_PERTURB_AMOUNT;
      }
    }
  }
}

// Mutation: add a new connection between two previously unconnected nodes
function mutateAddConnection(genome) {
  const sources = genome.nodes.filter((n) => n.type !== NODE_TYPES.OUTPUT);
  const targets = genome.nodes.filter(
    (n) => n.type === NODE_TYPES.HIDDEN || n.type === NODE_TYPES.OUTPUT
  );
  // Random pairs may already be connected or form a cycle, so try a few times
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const from = getRandomItem(sources);
    const to = getRandomItem(targets);
    const exists = genome.connections.some(
      (c) => c.from === from.id && c.to === to.id
    );
    if (!exists && !createsCycle(genome, from.id, to.id)) {
      genome.connections.push({
        innovation: getConnectionInnovation(from.id, to.id),
        from: from.id,
        to: to.id,
        weight: randomWeight(),
        enabled: true
      });
      return;
    }
  }
}

// Mutation: split an existing connection with a new hidden node
function mutateAddNode(genome) {
  const enabled = genome.connections.filter((c) => c.enabled);
  if (enabled.length === 0) {
    return;
  }
  const conn = getRandomItem(enabled);
  const nodeId = getSplitNodeId(conn.innovation);
  // Skip if this genome already gained this node via the same split
  if (genome.nodes.some((n) => n.id === nodeId)) {
    return;
  }
  conn.enabled = false;
  genome.nodes.push({ id: nodeId, type: NODE_TYPES.HIDDEN });
  // Weight 1 into the new node and the old weight out of it, so the
  // network's behavior is initially close to unchanged
  genome.connections.push({
    innovation: getConnectionInnovation(conn.from, nodeId),
    from: conn.from,
    to: nodeId,
    weight: 1,
    enabled: true
  });
  genome.connections.push({
    innovation: getConnectionInnovation(nodeId, conn.to),
    from: nodeId,
    to: conn.to,
    weight: conn.weight,
    enabled: true
  });
}

// Function to apply weight and structural mutations to a genome
export function mutateGenome(genome) {
  mutateWeights(genome);
  if (Math.random() < ADD_CONNECTION_RATE) {
    mutateAddConnection(genome);
  }
  if (Math.random() < ADD_NODE_RATE) {
    mutateAddNode(genome);
  }
}

// Function to crossover two genomes; the fitter parent must be passed first
export function crossoverGenomes(fitter, other) {
  const otherByInnovation = new Map(
    other.connections.map((c) => [c.innovation, c])
  );
  // Matching genes (same innovation) are inherited randomly from either
  // parent; disjoint and excess genes always come from the fitter parent
  const connections = fitter.connections.map((conn) => {
    const match = otherByInnovation.get(conn.innovation);
    const source = match && Math.random() < 0.5 ? match : conn;
    const child = { ...source };
    // A gene disabled in either parent usually stays disabled in the child
    if (!conn.enabled || (match && !match.enabled)) {
      child.enabled = Math.random() < GENE_REENABLE_RATE;
    }
    return child;
  });
  // All inherited genes exist in the fitter parent, so its node set suffices
  return {
    nodes: fitter.nodes.map((node) => ({ ...node })),
    connections
  };
}

// Function to measure how structurally different two genomes are,
// used to decide whether they belong to the same species
export function compatibilityDistance(a, b) {
  const bByInnovation = new Map(b.connections.map((c) => [c.innovation, c]));
  let matching = 0;
  let weightDiff = 0;
  for (const conn of a.connections) {
    const match = bByInnovation.get(conn.innovation);
    if (match) {
      matching += 1;
      weightDiff += Math.abs(conn.weight - match.weight);
    }
  }
  const mismatched = a.connections.length + b.connections.length - 2 * matching;
  // The NEAT paper normalizes gene counts only for large genomes
  const largest = Math.max(a.connections.length, b.connections.length);
  const n = largest < 20 ? 1 : largest;
  const avgWeightDiff = matching > 0 ? weightDiff / matching : 0;
  return (
    (MISMATCH_COEFFICIENT * mismatched) / n + WEIGHT_COEFFICIENT * avgWeightDiff
  );
}
