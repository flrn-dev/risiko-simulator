import { Cache } from "./cache.js";
import type { Verteilung } from "./types.js";

function berechneKampfergebnisse(
  angWuerfel: number,
  defWuerfel: number
): { verlusteAng: 0 | 1 | 2; verlusteDef: 0 | 1 | 2; p: number }[] {
  if (angWuerfel === 3 && defWuerfel === 2) {
    return [
      { verlusteAng: 2, verlusteDef: 0, p: 2275 / 7776 },
      { verlusteAng: 1, verlusteDef: 1, p: 2611 / 7776 },
      { verlusteAng: 0, verlusteDef: 2, p: 2890 / 7776 },
    ];
  }
  if (angWuerfel === 3 && defWuerfel === 1) {
    return [
      { verlusteAng: 1, verlusteDef: 0, p: 441 / 1296 },
      { verlusteAng: 0, verlusteDef: 1, p: 855 / 1296 },
    ];
  }
  if (angWuerfel === 2 && defWuerfel === 2) {
    return [
      { verlusteAng: 2, verlusteDef: 0, p: 581 / 1296 },
      { verlusteAng: 1, verlusteDef: 1, p: 420 / 1296 },
      { verlusteAng: 0, verlusteDef: 2, p: 295 / 1296 },
    ];
  }
  if (angWuerfel === 2 && defWuerfel === 1) {
    return [
      { verlusteAng: 1, verlusteDef: 0, p: 91 / 216 },
      { verlusteAng: 0, verlusteDef: 1, p: 125 / 216 },
    ];
  }
  if (angWuerfel === 1 && defWuerfel === 2) {
    return [
      { verlusteAng: 1, verlusteDef: 0, p: 161 / 216 },
      { verlusteAng: 0, verlusteDef: 1, p: 55 / 216 },
    ];
  }
  if (angWuerfel === 1 && defWuerfel === 1) {
    return [
      { verlusteAng: 1, verlusteDef: 0, p: 21 / 36 },
      { verlusteAng: 0, verlusteDef: 1, p: 15 / 36 },
    ];
  }
  throw new Error("Ungültige Würfel-Kombination");
}

/**
 * Einzelkampf, gerechnet nur mit effektiven Angreifern.
 * - eff: Anzahl der Angreifer, die wirklich würfeln dürfen.
 * - def: Anzahl der Verteidiger auf diesem Gebiet.
 */
function berechneEroberung(eff: number, def: number, cache: Cache): Verteilung {
  const cached = cache.get(eff, def);
  if (cached) return cached;

  const result: Verteilung = new Map();

  if (eff <= 0) {
    result.set(`0,${def}`, 1);
    cache.set(eff, def, result);
    return result;
  }
  if (def <= 0) {
    result.set(`${Math.max(eff - 1, 0)},0`, 1);
    cache.set(eff, def, result);
    return result;
  }

  const angWuerfel = Math.min(3, eff);
  const defWuerfel = Math.min(2, def);

  for (const outcome of berechneKampfergebnisse(angWuerfel, defWuerfel)) {
    const nextEff = eff - outcome.verlusteAng;
    const nextDef = def - outcome.verlusteDef;

    const nextDist = berechneEroberung(nextEff, nextDef, cache);
    for (const [key, p] of nextDist) {
      result.set(key, (result.get(key) ?? 0) + p * outcome.p);
    }
  }

  cache.set(eff, def, result);
  return result;
}

/**
 * Sequenz mehrerer Gebiete.
 * - effAngStart: effektive Angreifer zu Beginn.
 * - verteidiger: Liste mit den Verteidigern jedes Gebiets.
 */
export function berechneEroberungsSequenz(
  effAngStart: number,
  verteidiger: number[],
  cache: Cache
): Verteilung {
  let aktuelle: Verteilung = new Map([
    [`${effAngStart},${verteidiger.join(",")}`, 1],
  ]);

  for (let i = 0; i < verteidiger.length; i++) {
    const neue: Verteilung = new Map();

    for (const [state, prob] of aktuelle) {
      const [eff, ...defs] = state.split(",").map(Number) as [
        number,
        ...number[]
      ];

      if (eff <= 0) {
        neue.set(state, (neue.get(state) ?? 0) + prob);
        continue;
      }

      const defNow = defs[i]!;
      if (defNow <= 0) {
        neue.set(state, (neue.get(state) ?? 0) + prob);
        continue;
      }

      const ver = berechneEroberung(eff, defNow, cache);

      for (const [pair, p] of ver) {
        const [effNext, defNext] = pair.split(",").map(Number);
        const newDefs = [...defs];
        newDefs[i] = defNext!;
        const newKey = [effNext, ...newDefs].join(",");
        neue.set(newKey, (neue.get(newKey) ?? 0) + prob * p);
      }
    }

    aktuelle = neue;
  }

  return auswertenUndSortieren(aktuelle);
}

/**
 * Auswertung und Sortierung der Endverteilung:
 * - "Gewonnen" Aggregat
 * - "Verloren" Aggregat
 * - Zustände nach der Anzahl der Verlusten (für den Angreifer) aufsteigend sortiert
 */
export function auswertenUndSortieren(verteilung: Verteilung): Verteilung {
  let sumGewonnen = 0;
  let sumVerloren = 0;

  const keys = [...verteilung.keys()];

  const wins = keys
    .filter((k) => {
      const [_, ...defs] = k.split(",").map(Number) as [number, ...number[]];
      if (!defs.some((d) => d > 0)) {
        sumGewonnen += verteilung.get(k)!;
        return true;
      }
      return false;
    })
    .sort((a, b) => Number(b.split(",")[0]) - Number(a.split(",")[0]));

  const losses = keys
    .filter((k) => {
      const [ang, ...defs] = k.split(",").map(Number) as [number, ...number[]];
      if (defs.some((d) => d > 0)) {
        sumVerloren += verteilung.get(k)!;
        return true;
      }
      return false;
    })
    .sort((a, b) => {
      const da = a.split(",").slice(1).map(Number);
      const db = b.split(",").slice(1).map(Number);
      for (let i = 0; i < Math.max(da.length, db.length); i++) {
        const ai = da[i] ?? 0,
          bi = db[i] ?? 0;
        if (ai !== bi) return ai - bi;
      }
      return 0;
    });

  const out: Verteilung = new Map();
  out.set("Gewonnen", sumGewonnen);
  out.set("Verloren", sumVerloren);
  wins.forEach((k) => out.set(k, verteilung.get(k)!));
  losses.forEach((k) => out.set(k, verteilung.get(k)!));

  return out;
}
