# 'Life Game' 

## Description

Sample project with Vue.js and SCSS just for fun :)

I always want to build my own RPG-like game with races, crafting an so on... Well, I have some time and an idea about what it should be. 

At the beginning I want to develop a singleton module for all game engine general logic (not liked after some tries).

Then I want to see some race skills, add resource types, their bonuses... And stops when try to build a map module. Its look like very complexity logic with cycles for calculate each map cell's state.

After that I found a nice solution: what if each cell can send and response messages to communicate with other world? And there are one coordinator (main game engine) that use interval timer to run event-triggered logic. 

Each cell can be:
- race base
- researched resource cell
- resource cell with builded fabric by someone race
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

Each of one give some bonuses for race each tick. For example, a SNOW gives:
- meal: +0.1 
- water: +0.2

Also, race gets a skill bonuses:
- hardworking: +0.1 (how fast will be build a fabric)
- research: +0.2 (how fast will be researched a cell)
- diplomacy: +0.1 (how fast will be connected a cell)
- agressive: +0.1 (how fast a cell will be destroyed)


---

![Game sample](https://i.ibb.co/LzwVSbg/2021-01-12-23-24-14.png)
Game screen with 4 races


## Interface comments

![Interface](https://i.ibb.co/qyFKkqk/2021-01-12-23-25-21.png)
1. Race base cells. Each race look around this cells and choose what to do next time according to skills.
2. Researched cell. Its is not matter who research this cell. If green race start to build own fabric early next time, they gets this cell as owners.
3. Some action processing on cell by green race. Race can process one action per tick. This action shows on blue badge at the top (see #5)
4. Current tick number. If it stops after you start the game.. something goes wrong. 
5. Current race action. Usually, its similar to one of 4 race skills. But some times the value is 'Thinking'. That means race sends messages to some cell and do not receive any reply by some reason. For example, the reason is cell already been processed at same time by another race.
6. Race skills. Better if value is big. Skills relates to cell processing time.
7. Resources of race. If its empty - that bad.

You can set race count and map size in 'Config' section.

And you can see game log with some comments what happened here.

### PS

Big thanks to https://game-icons.net/ for icons.



## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
