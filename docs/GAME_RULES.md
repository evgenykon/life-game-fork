# Game Rules

## Description

Each cell can send and response messages to communicate with other world (based on Vue.js emits). 
There are one coordinator (main game engine) that use interval timer to run event-triggered logic.

Each cell can be:
- race base
- researched resource cell
- resource cell with race-owned fabric
- shadowed cell (that will be a random resource after researching process ends)

There are 8 types of resources:
- FIELD
- FOREST
- GRUNT
- ROCK
- SWAMP
- SAND
- SNOW
- WATER

Each of one give some bonuses for race each tick:
- meal: +0.1
- water: +0.2
- etc

Also, race gets a skill bonuses:
- hardworking: +0.1 (how fast will be build a fabric)
- research: +0.2 (how fast will be researched a cell)
- diplomacy: +0.1 (how fast will be connected a cell)
- agressive: +0.1 (how fast a cell will be destroyed)


---

You can set race count and map size in 'Config' section.

And you can see game log with some comments what happened here.

