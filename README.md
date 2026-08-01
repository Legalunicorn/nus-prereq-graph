## NUS module pre-requisite graph 

Made to trace the entire pre-requite chain needed to complete a set of modules/courses, or specialization planning (ie. one or more focus areas in CS)


API taken from NUSMOD


Demo: a student interest in Parallel Computing focus area
![Preview](assets/preview.png)


### usage
- does not show required grades yet 
- does not show preclusions 
#### side bar 
- search mods by code in the side bar and press enter
- click on focus area preset to browse and add categorized modules

##### graph
- hover over logic gates or mods to see edges clearly
- In the graph, searched mods have a white border, mods without borders are added due to being pre-req
- logic gates (diamond) will be marked in green if fulfilled, otherise red
- completed mods are in green in the graph
- if a logic gate is fulfiled, redundant mods (not added by user) will be hidden
- automatically simplify tree and hides pre-requisites if a mod is completed
