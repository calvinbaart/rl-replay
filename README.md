# rl-replay
RocketLeague replay parser for Node.JS

## Installation
```
npm install rl-replay
```

Alternatively you could do this:
```
git clone https://github.com/calvinbaart/rl-replay.git
cd rl-replay
npm install
```

## Usage
```
const Replay = require("rl-replay");

var replay = new Replay("test.replay");
replay.load().then(function(){
  console.log("All loaded!");
}, function(err){
  console.log("Error!");
}, function(progress){
  console.log("Loading at " + (progress * 100) + "%");
});
```

## API
### Replay
  
#### .constructor(file)
Constructor of the replay format.
    
#### .load(options)
This function starts the load of a new replay. If file is a buffer it parses the buffer directly, if file
is a string it first checks if it starts with http/https. If so, then it download the replay and parses it, otherwise
it loads the file from the filesystem and parses it. This function returns a promise.

options is a optional variable and when passed should be an object containing one or more of the following options:
- parse_netcache: when set to false the netcache (and the netstream) won't be parsed. Defaults to **true**.
- parse_frame: when set to false the frames won't be parsed. Defaults to **true**.
    
#### .data
Raw data parsed with binary-parser. This is used to fill in the rest of the variables.

#### .header
Header of the replay file.

#### .properties
Name/Value dictionary of the properties defined in the replay format.
    
#### .sfx
Array of strings of the SFX strings in the replay format.
    
#### .object
Array of strings of the various object types in the replay format.
    
#### .name
Array of strings of the names in the replay format.
    
#### .package
Array of strings of the packages in the replay format.
    
#### .frame
Array of frames parsed from the netstream.
    
#### .goal
Array of goals objects: {frame, type} where type = "red" or "blue" depending on who scored. This is
extracted from the tickmarks in the replay format.
    
#### .netcache
Array of NetCache objects parsed from the replay format.

## TODO
- Figure out the CRC check algorithm.
- Optimize the parsed classes code. (Currently it creates a new parsed object per frame).
- Add more options for load.

## License
This library is licensed under the General Public License version 3.0.

## Credits
Some code is based on other existing parsers: https://github.com/rocket-league-replays/rocket-league-replays/wiki/Rocket-League-Replay-Parsers
