import { describe, expect, it, vi } from "vitest";
import type { Genome } from "../utils/neat";
import {
  compatibilityDistance,
  createGenome,
  crossoverGenomes,
  feedForward,
  mutateGenome,
  NodeType
} from "../utils/neat";

const sigmoid = (x: number) => 1 / (1 + Math.exp(-4.9 * x));

// inputs 0 and 1, bias 2, output 3, hidden 4: 0 -> 4 -> 3, 1 -> 3, 2 -> 3
function createHiddenGenome(): Genome {
  return {
    nodes: [
      { id: 0, type: NodeType.INPUT },
      { id: 1, type: NodeType.INPUT },
      { id: 2, type: NodeType.BIAS },
      { id: 3, type: NodeType.OUTPUT },
      { id: 4, type: NodeType.HIDDEN }
    ],
    connections: [
      { innovation: 900, from: 0, to: 4, weight: 0.5, enabled: true },
      { innovation: 901, from: 4, to: 3, weight: -1, enabled: true },
      { innovation: 902, from: 1, to: 3, weight: 2, enabled: true },
      { innovation: 903, from: 2, to: 3, weight: 0.25, enabled: true }
    ]
  };
}

describe("createGenome", () => {
  it("connects every input and the bias to every output", () => {
    const genome = createGenome(5, 1);
    const types = genome.nodes.map((node) => node.type);
    expect(types.filter((t) => t === NodeType.INPUT)).toHaveLength(5);
    expect(types.filter((t) => t === NodeType.BIAS)).toHaveLength(1);
    expect(types.filter((t) => t === NodeType.OUTPUT)).toHaveLength(1);
    expect(genome.connections).toHaveLength(6);
    expect(genome.connections.every((conn) => conn.enabled)).toBe(true);
  });

  it("gives the same connection the same innovation in every genome", () => {
    const a = createGenome(5, 1);
    const b = createGenome(5, 1);
    expect(a.connections.map((c) => c.innovation)).toEqual(
      b.connections.map((c) => c.innovation)
    );
  });
});

describe("feedForward", () => {
  it("computes a direct network", () => {
    const genome = createGenome(2, 1);
    const weights = [0.3, -0.7, 0.1];
    genome.connections.forEach((conn, index) => {
      conn.weight = weights[index];
    });
    const [output] = feedForward(genome, [0.5, 0.2]);
    expect(output).toBeCloseTo(sigmoid(0.3 * 0.5 - 0.7 * 0.2 + 0.1));
  });

  it("computes through hidden nodes", () => {
    const [output] = feedForward(createHiddenGenome(), [0.8, 0.1]);
    const hidden = sigmoid(0.5 * 0.8);
    expect(output).toBeCloseTo(sigmoid(-1 * hidden + 2 * 0.1 + 0.25));
  });

  it("ignores disabled connections", () => {
    const genome = createHiddenGenome();
    genome.connections[2].enabled = false;
    const [output] = feedForward(genome, [0.8, 0.1]);
    const hidden = sigmoid(0.5 * 0.8);
    expect(output).toBeCloseTo(sigmoid(-1 * hidden + 0.25));
  });

  it("gives the same answer on repeated (cached) calls", () => {
    const genome = createHiddenGenome();
    const first = feedForward(genome, [0.3, 0.9]);
    expect(feedForward(genome, [0.3, 0.9])).toEqual(first);
    expect(feedForward(genome, [0.9, 0.3])).not.toEqual(first);
  });
});

describe("mutateGenome", () => {
  // Many rounds of mutation across a population, so structural mutations
  // (2-8% per round) happen often
  const genomes = Array.from({ length: 20 }, () => createGenome(5, 1));
  for (let round = 0; round < 300; round += 1) {
    genomes.forEach(mutateGenome);
  }

  it("grows structure", () => {
    const hidden = genomes.flatMap((genome) =>
      genome.nodes.filter((node) => node.type === NodeType.HIDDEN)
    );
    expect(hidden.length).toBeGreaterThan(0);
  });

  it("never duplicates a connection", () => {
    for (const genome of genomes) {
      const pairs = genome.connections.map((c) => `${c.from}->${c.to}`);
      expect(new Set(pairs).size).toBe(pairs.length);
    }
  });

  it("keeps innovations consistent across genomes", () => {
    const byPair = new Map<string, number>();
    for (const genome of genomes) {
      for (const conn of genome.connections) {
        const key = `${conn.from}->${conn.to}`;
        expect(byPair.get(key) ?? conn.innovation).toBe(conn.innovation);
        byPair.set(key, conn.innovation);
      }
    }
  });

  it("stays a valid feed-forward network", () => {
    for (const genome of genomes) {
      const [output] = feedForward(genome, [0.1, 0.2, 0.3, 0.4, 0.5]);
      expect(output).toBeGreaterThanOrEqual(0);
      expect(output).toBeLessThanOrEqual(1);
    }
  });
});

describe("crossoverGenomes", () => {
  it("inherits structure only from the fitter parent", () => {
    const fitter = createHiddenGenome();
    const other = createHiddenGenome();
    other.connections.push({
      innovation: 950,
      from: 1,
      to: 4,
      weight: 1,
      enabled: true
    });
    const child = crossoverGenomes(fitter, other);
    expect(child.nodes).toEqual(fitter.nodes);
    expect(child.connections.map((c) => c.innovation)).toEqual(
      fitter.connections.map((c) => c.innovation)
    );
  });

  it("takes matching weights from one parent or the other", () => {
    const fitter = createHiddenGenome();
    const other = createHiddenGenome();
    other.connections.forEach((conn) => {
      conn.weight += 10;
    });
    const child = crossoverGenomes(fitter, other);
    child.connections.forEach((conn, index) => {
      expect([
        fitter.connections[index].weight,
        other.connections[index].weight
      ]).toContain(conn.weight);
    });
  });
});

describe("compatibilityDistance", () => {
  it("is zero for identical genomes and symmetric otherwise", () => {
    const a = createHiddenGenome();
    const b = createHiddenGenome();
    expect(compatibilityDistance(a, b)).toBe(0);
    b.connections[0].weight = 2;
    b.connections.pop();
    expect(compatibilityDistance(a, b)).toBeGreaterThan(0);
    expect(compatibilityDistance(a, b)).toBeCloseTo(
      compatibilityDistance(b, a)
    );
  });
});

describe("syncGenomeCounters", () => {
  it("moves new ids past every loaded id", async () => {
    // A fresh module instance, so the shared registry starts empty
    vi.resetModules();
    const neat = await import("../utils/neat");
    const loaded = createHiddenGenome();
    loaded.connections[0].innovation = 5000;
    loaded.nodes[4].id = 70;
    neat.syncGenomeCounters([loaded]);
    const fresh = neat.createGenome(2, 1);
    expect(fresh.connections.map((c) => c.innovation)).toEqual([
      5001, 5002, 5003
    ]);
    expect(fresh.nodes.map((node) => node.id)).toEqual([0, 1, 2, 3]);
  });
});
