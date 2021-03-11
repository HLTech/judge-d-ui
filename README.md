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

### Docker

Judge-d-ui pushes new version of docker image to
[Docker registry](https://hub.docker.com/r/hltech/judge-d-ui) each time
a CI build is triggered when on master branch. Executing below commands will
pull latest version of app's docker image and then run it at port 8081 with backend configured as
https://judge-d.herokuapp.com:

```
docker pull hltech/judge-d-ui
docker run -p 8081:80 -t -d -e BASE_PATH=https://judge-d.herokuapp.com -e PORT=80 hltech/judge-d-ui
```

You can also build your own image locally. It is available in [./docker/](docker/) directory in this repository

#### Docker-compose

A [./demo/docker-compose.yml](demo/docker-compose.yml) file was created to easily run judge-d, postgres database and judge-d-ui services.

Services are exposed via following ports:

| Service    | Port            |
| ---------- | --------------- |
| judge-d    | 8080            |
| judge-d-ui | 8081            |
| postgres   | - (not exposed) |

#### Populate backend app with data

In order to populate judge-d service with data, you need to launch [./demo/demoGenerator.sh](demo/demoGenerator.sh) script.
There are 2 directories inside [./demo](demo/) directory: environments and contracts.
Firstly, the script updates environments. One file means one new environment. Its name is taken from file name.
Content of this file represents an environment as Judge-d expects.
Subsequently, the script updates contracts. One file represents one service. Its name and version is taken from its name:
<name>\_<version>.json. Content of this file represents a contract as Judge-d expects.

The script takes backend service url as optional first parameter, with `localhost:8080` being a default value (will be used if no args are passed to `demoGenerator.sh` script).

If you want to populate backend app that is deployed on heroku, you have to pass an url as first parameter to it, which is `judge-d.herokuapp.com`.
Script execution for heroku app would then be `./demoGenerator.sh "judge-d.herokuapp.com"`.

##### Demo on heroku

The newest version of application on master branch is available on heroku.

Link: http://judge-d-ui.herokuapp.com/
