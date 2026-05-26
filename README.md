# 'Life Game' 

## Description

Sample project with Vue.js and SCSS just for fun :)

I always want to build my own RPG-like game with races, crafting an so on... Well, I have some time and an idea about what it should be. 

At the beginning I want to develop a singleton module for all game engine general logic (not liked after some tries).

Then I want to see some race skills, add resource types, their bonuses... And stops when try to build a map module. Its look like very complexity logic with cycles for calculate each map cell's state.

After that I found a nice solution: what if each cell can send and response messages to communicate with other world? 

[See more about game logic](docs/GAME_RULES.md) 