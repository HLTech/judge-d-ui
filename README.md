[![Build Status](https://travis-ci.org/HLTech/judge-d-ui.svg?branch=master)](https://travis-ci.org/HLTech/judge-d-ui.svg?branch=master)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/HLTech/judge-d-ui/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/HLTech/judge-d-ui/?branch=master)

# Demo
In order to run demo, you need to launch demoGenerator.sh script. 
There are 2 directories: environments and contracts.
Firstly, the script updates environments. One file means one new environment. Its name is taken from file name.
Content of this file represents an environment as Judge-d expects.
Subsequently, the script updates contracts. One file represents one service. Its name and version is taken from its name:
<name>_<version>.json. Content of this file represents a contract as Judge-d expects.