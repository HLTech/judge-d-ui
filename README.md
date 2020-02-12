# judge-d-ui

[![Build Status](https://travis-ci.org/HLTech/judge-d-ui.svg?branch=master)](https://travis-ci.org/HLTech/judge-d-ui.svg?branch=master)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/HLTech/judge-d-ui/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/HLTech/judge-d-ui/?branch=master)

This project serves as a graphic representation of data offered by Judge-Dredd API.

It will present all services as nodes and draw all contracts between them as arrows
(drawn from consumer to provider). By default, nodes are shaped as rectangles and are labelled
by service name. More sophisticated shape of a node is determined by whether it is a provider or
consumer(or both) in any contract. Services that are providers are concaved on their left side,
while services that are consumers are convexed on their right side.

## Functionalities

User is able to click on connected nodes to highlight clicked node as well as all nodes that are
directly connected to it. In order to highlight further connections, see
[Keyboard Support](#keyboard-support) section.

#### Keyboard support

##### Arrow up ↑

Zooms in

##### Arrow down ↓

Zooms out

##### Arrow left ←

Available only after clicking on a node.

Contracts highlight by one level of depth

##### Arrow right →

Available only after clicking on a node.

Expands highlight by one level of depth

## Setting up a local demo

In order to run demo, you need to launch demoGenerator.sh script.
There are 2 directories: environments and contracts.
Firstly, the script updates environments. One file means one new environment. Its name is taken from file name.
Content of this file represents an environment as Judge-d expects.
Subsequently, the script updates contracts. One file represents one service. Its name and version is taken from its name:
<name>\_<version>.json. Content of this file represents a contract as Judge-d expects.

##### Demo on heroku

The newest version of application on master branch is available on heroku.

Link: http://judge-d-ui.herokuapp.com/
