import type { Verteilung } from "./types.js";

export class Cache {
  private data: Record<string, [string, number][]>;
  private filePath?: string;
  private fs?: typeof import("fs");
  private path?: typeof import("path");
  private isNode: boolean;

  private constructor() {
    this.data = {};
    this.isNode = typeof process !== "undefined" && !!process.versions?.node;
  }

  public static async create(filePath: string = "./data.json"): Promise<Cache> {
    const cache = new Cache();

    if (cache.isNode) {
      cache.fs = await import("fs");
      cache.path = await import("path");
      cache.filePath = cache.path.resolve(filePath);

      if (cache.fs.existsSync(cache.filePath)) {
        const raw = cache.fs.readFileSync(cache.filePath, "utf-8").trim();
        cache.data = raw.length ? JSON.parse(raw) : {};
      } else {
        cache.save();
      }
    }

    return cache;
  }

  public get(angreifer: number, verteidiger: number): Verteilung | undefined {
    const key = `${angreifer},${verteidiger}`;
    const entry = this.data[key];
    if (!entry) return undefined;
    return new Map(entry);
  }

  public set(
    angreifer: number,
    verteidiger: number,
    resultat: Verteilung
  ): void {
    const key = `${angreifer},${verteidiger}`;
    this.data[key] = Array.from(resultat.entries());
    this.sort();

    if (this.isNode) {
      this.save();
    }
  }

  private sort() {
    this.data = Object.fromEntries(
      Object.entries(this.data).sort(([keyA], [keyB]) => {
        const [aA, aV] = keyA.split(",").map(Number) as [number, number];
        const [bA, bV] = keyB.split(",").map(Number) as [number, number];
        return aA !== bA ? aA - bA : aV - bV;
      })
    );
  }

  private save() {
    this.fs!.writeFileSync(
      this.filePath!,
      JSON.stringify(this.data, null, 2),
      "utf-8"
    );
  }
}
