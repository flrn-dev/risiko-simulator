# Risiko-Simulator

Berechnet die Eroberungswahrscheinlichkeiten für einzelne Gebiete oder ganze Gebiets-Sequenzen in Risiko. 

## Web-Version

- `index.html`
  Stellt eine Webpage zur Verfügung die die gesamte Funktionalität im Browser ermöglicht.

## API-Version

- `api.ts`
  Exposed `/berechne` als API-Endpoint. Bsp: `/berechne?angreifer=5&verteidiger=3&verteidiger=2`.

## Core

- `simulator.ts`
  Stellt die eigentlichen Funktionen bereicht.

- `cache.ts`
  Stellt einen Cache bereit, der bereits berechnete Werte zwischenspeichert. In der Web-Version ist die Implementierung eine simple in-memory Map - in der API-Version werden die Werte zusätzlich in eine Datei (standardmäßig ./data.json) geschrieben.
  
## Deployment

- GitHub Pages (Web-Version)
- To-Do: Dockerfile (API-Version) 
- To-Do: Dockerfile (Web-Version + nginx)
