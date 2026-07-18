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

export enum NodeType {
  INPUT = "input",
  BIAS = "bias",
  HIDDEN = "hidden",
  OUTPUT = "output"
}

export interface NodeGene {
  id: number;
  type: NodeType;
}

export interface ConnectionGene {
  innovation: number;
  from: number;
  to: number;
  weight: number;
  enabled: boolean;
}

export interface Genome {
  nodes: NodeGene[];
  connections: ConnectionGene[];
}

// --- Innovation bookkeeping ---
// Innovation numbers give every connection gene a historical id, so genomes
// with different topologies can be aligned gene-by-gene during crossover and
// compared for speciation. The same structural mutation (same from->to pair)
// always receives the same innovation number. All of this shared registry
// lives on one object so it's easy to find and reason about.
const innovations = {
  // Next id to hand out for a new connection / node
  nextInnovation: 0,
  nextNodeId: 0,
  // "from->to" key -> innovation number, so the same connection is consistent
  connections: new Map<string, number>(),
  // split connection's innovation -> hidden node id it produced, so the same
  // split in different genomes yields the same node id
  splitNodes: new Map<number, number>()
};

function getConnectionInnovation(from: number, to: number): number {
  const key = `${from}->${to}`;
  const existing = innovations.connections.get(key);
  if (existing !== undefined) {
    return existing;
  }
  const innovation = innovations.nextInnovation;
  innovations.connections.set(key, innovation);
  innovations.nextInnovation += 1;
  return innovation;
}

function getSplitNodeId(innovation: number): number {
  const existing = innovations.splitNodes.get(innovation);
  if (existing !== undefined) {
    return existing;
  }
  const nodeId = innovations.nextNodeId;
  innovations.splitNodes.set(innovation, nodeId);
  innovations.nextNodeId += 1;
  return nodeId;
}

// Fast-forwards the registry counters past any ids present in the given
// genomes, so mutations after loading a saved population can't collide
export function syncGenomeCounters(genomes: Genome[]): void {
  for (const genome of genomes) {
    for (const node of genome.nodes) {
      innovations.nextNodeId = Math.max(innovations.nextNodeId, node.id + 1);
    }
    for (const conn of genome.connections) {
      innovations.nextInnovation = Math.max(
        innovations.nextInnovation,
        conn.innovation + 1
      );
    }
  }
}

// Steepened sigmoid as used in the original NEAT paper
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-4.9 * x));
}

function randomWeight(): number {
  return Math.random() * 2 - 1;
}

// Function to create a minimal genome: every input (plus a bias) connected
// directly to every output. Structure is grown later through mutation.
export function createGenome(inputCount: number, outputCount: number): Genome {
  const nodes: NodeGene[] = [];
  const connections: ConnectionGene[] = [];
  for (let i = 0; i < inputCount; i += 1) {
    nodes.push({ id: i, type: NodeType.INPUT });
  }
  nodes.push({ id: inputCount, type: NodeType.BIAS });
  for (let i = 0; i < outputCount; i += 1) {
    nodes.push({ id: inputCount + 1 + i, type: NodeType.OUTPUT });
  }
  innovations.nextNodeId = Math.max(innovations.nextNodeId, nodes.length);
  for (const from of nodes) {
    if (from.type === NodeType.OUTPUT) {
      continue;
    }
    for (const to of nodes) {
      if (to.type === NodeType.OUTPUT) {
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
export function feedForward(genome: Genome, inputs: number[]): number[] {
  // Index enabled connections by their target node
  const incoming = new Map<number, ConnectionGene[]>();
  for (const conn of genome.connections) {
    if (conn.enabled) {
      const list = incoming.get(conn.to);
      if (list) {
        list.push(conn);
      } else {
        incoming.set(conn.to, [conn]);
      }
    }
  }
  const values = new Map<number, number>();
  for (const node of genome.nodes) {
    if (node.type === NodeType.INPUT) {
      values.set(node.id, inputs[node.id]);
    } else if (node.type === NodeType.BIAS) {
      values.set(node.id, 1);
    }
  }
  // Resolve each node recursively through its incoming connections
  const visiting = new Set<number>();
  const getValue = (id: number): number => {
    const cached = values.get(id);
    if (cached !== undefined) {
      return cached;
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
    .filter((node) => node.type === NodeType.OUTPUT)
    .map((node) => getValue(node.id));
}

// Checks whether adding a from->to connection would create a cycle,
// which would break the feed-forward evaluation
function createsCycle(genome: Genome, from: number, to: number): boolean {
  if (from === to) {
    return true;
  }
  // If `from` is reachable by walking forward from `to`, the edge closes a loop
  const stack = [to];
  const seen = new Set<number>();
  while (stack.length > 0) {
    const id = stack.pop() as number;
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
function mutateWeights(genome: Genome): void {
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
function mutateAddConnection(genome: Genome): void {
  const sources = genome.nodes.filter((n) => n.type !== NodeType.OUTPUT);
  const targets = genome.nodes.filter(
    (n) => n.type === NodeType.HIDDEN || n.type === NodeType.OUTPUT
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
function mutateAddNode(genome: Genome): void {
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
  genome.nodes.push({ id: nodeId, type: NodeType.HIDDEN });
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
export function mutateGenome(genome: Genome): void {
  mutateWeights(genome);
  if (Math.random() < ADD_CONNECTION_RATE) {
    mutateAddConnection(genome);
  }
  if (Math.random() < ADD_NODE_RATE) {
    mutateAddNode(genome);
  }
}

// Function to crossover two genomes; the fitter parent must be passed first
export function crossoverGenomes(fitter: Genome, other: Genome): Genome {
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
export function compatibilityDistance(a: Genome, b: Genome): number {
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
