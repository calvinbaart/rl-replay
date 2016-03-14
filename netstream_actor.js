/*
{
    "id": 147,
    "state": "existing",
    "flag": false,
    "typeId": 209,
    "typeName": "Archetypes.Car.Car_Default",
    "className": ".Car_TA",
    "position": {
        "x": 256,
        "y": 3840,
        "z": 44
    },
    "rotation": {
        "x": 0,
        "y": 192,
        "z": 0
    },
    "properties": {
        "Engine.Pawn:PlayerReplicationInfo": [
            true,
            33
        ],
        "TAGame.Car_TA:TeamPaint": {
            "Team": 1,
            "TeamColorID": 1,
            "CustomColorID": 28,
            "TeamFinishID": 280,
            "CustomFinishID": 276
        },
        "TAGame.RBActor_TA:ReplicatedRBState": {
            "sleeping": false,
            "position": {
                "x": -1102,
                "y": 4021,
                "z": 19
            },
            "rotation": {
                "x": 0.9926450392162847,
                "y": 0.24915311136204107,
                "z": -0.999664296395764
            },
            "linearVelocity": {
                "x": -9609,
                "y": -8616,
                "z": 81
            },
            "angularVelocity": {
                "x": 0,
                "y": 0,
                "z": 2350
            }
        },
        "TAGame.Vehicle_TA:ReplicatedThrottle": 251,
        "TAGame.Vehicle_TA:ReplicatedSteer": 255,
        "TAGame.Vehicle_TA:bDriving": true,
        "TAGame.Vehicle_TA:bReplicatedHandbrake": false
    }
}
*/

var Car = function(id){
    this.type = "Car";
    this.id = id;

    this.position = {x: 0, y: 0, z: 0};
    this.rotation = {x: 0, y: 0, z: 0};
    this.velocity = {x: 0, y: 0, z: 0};
    this.angularVelocity = {x: 0, y: 0, z: 0};
    this.player = null;
    this.driving = false;
    this.components = {};

    this.update = function(frame, actorState){
        if(actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"] === undefined)
        {
            return;
        }

        if(actorState.properties["Engine.Pawn:PlayerReplicationInfo"] !== undefined)
        {
            this.player = frame.get_parsed_actor(actorState.properties["Engine.Pawn:PlayerReplicationInfo"][1]);
            if(this.player != null)
                this.player.car = this;
        }

        this.position = actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"].position;
        this.rotation = actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"].rotation;
        this.driving = actorState.properties["TAGame.Vehicle_TA:bDriving"];

        if(!actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"].sleeping)
        {
            this.velocity = actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"].linearVelocity;
            this.angularVelocity = actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"].angularVelocity;
        }
    };
};

var CarComponentBoost = function(id){
    this.type = "CarComponentBoost";
    this.id = id;
    this.car = null;
    this.active = false;

    this.update = function(frame, actorState){
        if(actorState.properties === undefined)
            return;

        if(actorState.properties["TAGame.CarComponent_TA:Vehicle"] !== undefined)
        {
            this.car = frame.get_parsed_actor(actorState.properties["TAGame.CarComponent_TA:Vehicle"][1]);
            this.car.components["boost"] = this;
        }

        if(actorState.properties["TAGame.CarComponent_TA:ReplicatedActive"] !== undefined)
        {
            this.active = (actorState.properties["TAGame.CarComponent_TA:ReplicatedActive"] % 2) != 0;
        }

        /*if(this.car != null && this.car.player != null && this.car.player.name == "Calsmurf2904")
        {
            console.log(JSON.stringify(actorState, null, 4));
        }*/
    };
};

var CarComponentDodge = function(id){
    this.type = "CarComponentDodge";
    this.id = id;
    this.car = null;
    this.active = false;

    this.update = function(frame, actorState){
        if(actorState.properties === undefined)
            return;

        if(actorState.properties["TAGame.CarComponent_TA:Vehicle"] !== undefined)
        {
            this.car = frame.get_parsed_actor(actorState.properties["TAGame.CarComponent_TA:Vehicle"][1]);
            this.car.components["dodge"] = this;
        }

        if(actorState.properties["TAGame.CarComponent_TA:ReplicatedActive"] !== undefined)
        {
            this.active = (actorState.properties["TAGame.CarComponent_TA:ReplicatedActive"] % 2) != 0;
        }
    };
};

var CarComponentJump = function(id){
    this.type = "CarComponentJump";
    this.id = id;
    this.car = null;
    this.active = false;

    this.update = function(frame, actorState){
        if(actorState.properties === undefined)
            return;

        if(actorState.properties["TAGame.CarComponent_TA:Vehicle"] !== undefined)
        {
            this.car = frame.get_parsed_actor(actorState.properties["TAGame.CarComponent_TA:Vehicle"][1]);
            this.car.components["jump"] = this;
        }

        if(actorState.properties["TAGame.CarComponent_TA:ReplicatedActive"] !== undefined)
        {
            this.active = (actorState.properties["TAGame.CarComponent_TA:ReplicatedActive"] % 2) != 0;
        }
    };
};

/*
"TAGame.CarComponent_FlipCar_TA:FlipCarTime": 0.3885131776332855,
"TAGame.CarComponent_FlipCar_TA:bFlipRight": true
*/

var CarComponentFlipCar = function(id){
    this.type = "CarComponentFlipCar";
    this.id = id;
    this.car = null;
    this.active = false;

    this.update = function(frame, actorState){
        if(actorState.properties === undefined)
            return;

        if(actorState.properties["TAGame.CarComponent_TA:Vehicle"] !== undefined)
        {
            this.car = frame.get_parsed_actor(actorState.properties["TAGame.CarComponent_TA:Vehicle"][1]);
            this.car.components["flipCar"] = this;
        }

        if(actorState.properties["TAGame.CarComponent_TA:ReplicatedActive"] !== undefined)
        {
            this.active = (actorState.properties["TAGame.CarComponent_TA:ReplicatedActive"] % 2) != 0;
        }
    };
};

var CarComponentDoubleJump = function(id){
    this.type = "CarComponentDoubleJump";
    this.id = id;
    this.car = null;
    this.active = false;

    this.update = function(frame, actorState){
        if(actorState.properties === undefined)
            return;

        if(actorState.properties["TAGame.CarComponent_TA:Vehicle"] !== undefined)
        {
            this.car = frame.get_parsed_actor(actorState.properties["TAGame.CarComponent_TA:Vehicle"][1]);
            this.car.components["doubleJump"] = this;
        }

        if(actorState.properties["TAGame.CarComponent_TA:ReplicatedActive"] !== undefined)
        {
            this.active = (actorState.properties["TAGame.CarComponent_TA:ReplicatedActive"] % 2) != 0;
        }
    };
};

/*
{
    "id": 33,
    "state": "existing",
    "flag": false,
    "type_id": 136,
    "type_name": "TAGame.Default__PRI_TA",
    "class_name": ".PRI_TA",
    "position": {
        "x": 0,
        "y": 0,
        "z": 0
    },
    "properties": {
        "Engine.PlayerReplicationInfo:Ping": 8,
        "Engine.PlayerReplicationInfo:PlayerName": "JiBiBi",
        "Engine.PlayerReplicationInfo:Team": [
            true,
            17
        ],
        "Engine.PlayerReplicationInfo:bReadyToPlay": true,
        "Engine.PlayerReplicationInfo:UniqueId": [
            1,
            94319267,
            0
        ],
        "Engine.PlayerReplicationInfo:PlayerID": 435,
        "TAGame.PRI_TA:TotalXP": 3693595,
        "TAGame.PRI_TA:CameraSettings": {
            "fov": 110,
            "height": 100,
            "pitch": -6,
            "distance": 290,
            "stiffness": 0,
            "swivel": 2.5
        },
        "TAGame.PRI_TA:ClientLoadout": [
            10,
            [
                403,
                507,
                519,
                36,
                7,
                640,
                0
            ]
        ],
        "TAGame.PRI_TA:ReplicatedGameEvent": [
            true,
            3
        ],
        "TAGame.PRI_TA:bUsingSecondaryCamera": true,
        "TAGame.PRI_TA:MatchScore": 390,
        "Engine.PlayerReplicationInfo:Score": 2,
        "TAGame.PRI_TA:MatchGoals": 2,
        "TAGame.PRI_TA:CameraYaw": 128,
        "TAGame.PRI_TA:CameraPitch": 128,
        "TAGame.PRI_TA:MatchShots": 2,
        "TAGame.PRI_TA:bUsingBehindView": false
    }
}
*/

var Player = function(id){
    this.type = "Player";
    this.id = id;

    this.name = "";
    this.teamId = -1;
    this.car = null;
    this.team = null;
    this.goals = 0;
    this.assists = 0;
    this.shots = 0;
    this.saves = 0;
    this.score = 0;
    this.ping = 0;
    this.readyToPlay = true;

    this.getSystemForType = function(type){
        if(type == 0)
            return "SplitScreen";
        else if(type == 1)
            return "Steam";
        else if(type == 2)
            return "PS4";

        return "Unknown";
    };

    this.require = function(propertyName){
        if(this.actorState.properties[propertyName] === undefined)
            return false;

        return true;
    }

    this.update = function(frame, actorState){
        this.actorState = actorState;
        if(!this.require("Engine.PlayerReplicationInfo:PlayerName") || !this.require("Engine.PlayerReplicationInfo:Team") || !this.require("Engine.PlayerReplicationInfo:UniqueId"))
        {
            return;
        }

        this.team = frame.get_parsed_actor(actorState.properties["Engine.PlayerReplicationInfo:Team"][1]);
        this.name = actorState.properties["Engine.PlayerReplicationInfo:PlayerName"];
        this.teamId = actorState.properties["Engine.PlayerReplicationInfo:Team"][1];
        this.uid = actorState.properties["Engine.PlayerReplicationInfo:UniqueId"][1];
        this.systemType = this.getSystemForType(actorState.properties["Engine.PlayerReplicationInfo:UniqueId"][0]);

        if(this.require("TAGame.PRI_TA:MatchGoals"))
        {
            this.goals = actorState.properties["TAGame.PRI_TA:MatchGoals"];
        }

        if(this.require("TAGame.PRI_TA:MatchShots"))
        {
            this.shots = actorState.properties["TAGame.PRI_TA:MatchShots"];
        }

        if(this.require("TAGame.PRI_TA:MatchAssists"))
        {
            this.assists = actorState.properties["TAGame.PRI_TA:MatchAssists"];
        }

        if(this.require("TAGame.PRI_TA:MatchScore"))
        {
            this.score = actorState.properties["TAGame.PRI_TA:MatchScore"];
        }

        if(this.require("TAGame.PRI_TA:MatchSaves"))
        {
            this.saves = actorState.properties["TAGame.PRI_TA:MatchSaves"];
        }

        if(this.require("Engine.PlayerReplicationInfo:Ping"))
        {
            this.ping = actorState.properties["Engine.PlayerReplicationInfo:Ping"];
        }

        if(this.require("Engine.PlayerReplicationInfo:bReadyToPlay"))
        {
            this.readyToPlay = actorState.properties["Engine.PlayerReplicationInfo:bReadyToPlay"];
        }

        if(this.require("TAGame.PRI_TA:ReplicatedGameEvent"))
        {
            this.gameEvent = frame.get_parsed_actor(actorState.properties["TAGame.PRI_TA:ReplicatedGameEvent"][1]);
        }

        this.actorState = undefined;
    };
};

/*
{
    "id": 146,
    "state": "existing",
    "flag": false,
    "typeId": 69,
    "typeName": "Archetypes.Ball.Ball_Default",
    "className": ".Ball_TA",
    "position": {
        "x": -256,
        "y": -256,
        "z": -148
    },
    "rotation": {
        "x": 0,
        "y": 0,
        "z": 0
    },
    "properties": {
        "TAGame.RBActor_TA:ReplicatedRBState": {
            "sleeping": false,
            "position": {
                "x": -1017,
                "y": 2318,
                "z": 522
            },
            "rotation": {
                "x": 0.7896664326914273,
                "y": -0.14218573564867093,
                "z": 0.728232673116245
            },
            "linearVelocity": {
                "x": -60516,
                "y": -25382,
                "z": -61873
            },
            "angularVelocity": {
                "x": -702,
                "y": 2196,
                "z": 5539
            }
        },
        "TAGame.Ball_TA:GameEvent": [
            true,
            3
        ],
        "TAGame.Ball_TA:HitTeamNum": 1
    }
}
*/
var Ball = function(id){
    this.type = "Ball";
    this.id = id;

    this.position = {x: 0, y: 0, z: 0};
    this.rotation = {x: 0, y: 0, z: 0};
    this.velocity = {x: 0, y: 0, z: 0};
    this.angularVelocity = {x: 0, y: 0, z: 0};
    this.gameEvent = null;

    this.update = function(frame, actorState){
        //if(frame.id <= 300)
        //    console.log(frame.id + ": " + JSON.stringify(actorState, null, 4));

        if(actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"] === undefined)
        {
            return;
        }

        this.position = actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"].position;
        this.rotation = actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"].rotation;

        if(actorState.properties["TAGame.Ball_TA:GameEvent"] !== undefined)
        {
            this.gameEvent = frame.get_parsed_actor(actorState.properties["TAGame.Ball_TA:GameEvent"][1]);
        }

        if(!actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"].sleeping)
        {
            this.velocity = actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"].linearVelocity;
            this.angularVelocity = actorState.properties["TAGame.RBActor_TA:ReplicatedRBState"].angularVelocity;
        }
    };
};

/*
{
   "id":17,
   "state":"existing",
   "flag":false,
   "typeId":220,
   "typeName":"Archetypes.Teams.Team1",
   "className":".Team_TA",
   "position":{
      "x":0,
      "y":0,
      "z":0
   },
   "properties":{
      "TAGame.Team_TA:GameEvent":[
         true,
         3
      ],
      "Engine.TeamInfo:Score":4
   }
}
*/

var Team = function(id){
    this.type  = "Team";
    this.id = id;

    this.teamId = "";
    this.score = 0;
    this.gameEvent = null;

    this.update = function(frame, actorState){
        if(actorState.type_name == "Archetypes.Teams.Team0")
        {
            this.teamId = "blue";
        }else if(actorState.type_name == "Archetypes.Teams.Team1")
        {
            this.teamId = "red";
        }else{
            this.teamId = "unknown";
        }

        if(actorState.properties["TAGame.Team_TA:GameEvent"] !== undefined)
        {
            this.gameEvent = frame.get_parsed_actor(actorState.properties["TAGame.Team_TA:GameEvent"][1]);
        }

        if(actorState.properties["Engine.TeamInfo:Score"] !== undefined)
        {
            this.score = actorState.properties["Engine.TeamInfo:Score"];
        }
    };
};

var BoostPickup = function(id){
    this.type = "BoostPickup";
    this.id = id;

    this.update = function(frame, actorState){
        //console.log(JSON.stringify(actorState, null, 4));
    }
};

var GameEventSoccar = function(id){
    this.type = "GameEventSoccar";
    this.id = id;

    this.update = function(frame, actorState){
        //console.log(JSON.stringify(actorState, null, 4));
    }
};

var ActorMapper = {
    ".Car_TA": Car,
    ".PRI_TA": Player,
    ".Ball_TA": Ball,
    ".Team_TA": Team,
    ".VehiclePickup_Boost_TA": BoostPickup,
    ".CarComponent_Boost": CarComponentBoost,
    ".CarComponent_Dodge": CarComponentDodge,
    ".CarComponent_Jump": CarComponentJump,
    ".CarComponent_FlipCar": CarComponentFlipCar,
    ".CarComponent_DoubleJump": CarComponentDoubleJump,
    ".GameEvent_Soccar": GameEventSoccar
};

module.exports = ActorMapper;
