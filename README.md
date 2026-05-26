# 'Life Game' 

**Live demo:** [evgenykon.github.io/life-game-fork](https://evgenykon.github.io/life-game-fork/)

## Description

Sample project with Vue.js and SCSS just for fun :)

I always wanted to build my own RPG-like game with races, crafting and so on... Well, I have some time and an idea about what it should be. 

At the beginning I wanted to develop a singleton module for all game engine general logic (which I didn't like after some tries).

Then I wanted to see some race skills, add resource types, their bonuses... And stopped when trying to build a map module. It looks like very complex logic with cycles to calculate each map cell's state.

After that I found a nice solution: what if each cell can send and respond to messages to communicate with the other world? 

![Game screenshot](public/screen.52.07.png)

[See more about game logic](docs/GAME_RULES.md) 
