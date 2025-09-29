import express, { type Request, type Response } from "express";
import { Cache } from "./cache.js";
import { berechneEroberungsSequenz } from "./simulator.js";

const app = express();
const cache = await Cache.create("./data.json");

app.get("/berechne", (req: Request, res: Response) => {
  const { angreifer: angreiferParam, verteidiger: verteidigerParam } =
    req.query;

  const angreifer = parseInt(angreiferParam as string, 10);
  const verteidiger = Array.isArray(verteidigerParam)
    ? verteidigerParam.map((v) => parseInt(v as string, 10))
    : [parseInt(verteidigerParam as string, 10)];

  if (
    !angreiferParam ||
    !verteidigerParam ||
    isNaN(angreifer) ||
    verteidiger.some((v) => isNaN(v))
  ) {
    return res
      .status(400)
      .send(
        '{\n  error: "Request-Parameter fehlerhaft oder nicht vorhanden!"\n}\n'
      );
  }

  if (
    angreifer < 1 ||
    verteidiger.some((v) => v < 1)
  ) {
    return res
      .status(400)
      .send(
        '{\n  error: "Ungültiger Wert für Angreifer und/oder Verteidiger!"\n}\n'
      );
  }

  const result = berechneEroberungsSequenz(angreifer, verteidiger, cache);

  res.send(JSON.stringify(Object.fromEntries(result), null, 2) + "\n");
});

app.listen(3000, () => {
  console.log(
    "API läuft auf http://localhost:3000/berechne"
  );
});
