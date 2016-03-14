var readFlaggedInt = function(stream){
    var flag = stream.readBool();
    var num = stream.readInt32();

    if(!flag)
        num = 0;

    return [flag, num];
};

var readInt = function(stream){
    return stream.readInt32();
};

var readByte = function(stream){
    return stream.readByte();
};

var readBool = function(stream){
    return stream.readBool();
};

var readFloat = function(stream){
    return stream.readFloat();
};

var readString = function(stream){
    var length = stream.readInt32();
    if(length < 0)
    {
        return stream.readStringUTF16(length * -2);
    }

    return stream.readStringUTF8(length);
};

var readRigidBodyState = function(stream){
    var sleeping = stream.readBool();
    var position = stream.readVector();
    var rotation = stream.readFloatVector();

    var result = {
        sleeping: sleeping,
        position: position,
        rotation: rotation
    };

    if(!sleeping)
    {
        result.linearVelocity = stream.readVector();
        result.angularVelocity = stream.readVector();
    }

    return result;
};

var readLocation = function(stream){
    return stream.readVector();
};

var readUniqueId = function(stream){
    var system = stream.readByte();
    var uid = 0;

    if(system == 0) //splitscreen
    {
        uid = stream.readBits(24);
    }else if(system == 1) //steam
    {
        uid = stream.readBits(64);
    }else if(system == 2) //PS4
    {
        uid = "unimplemented_ps4";
        stream.skip(256);
    }else{
        console.log("Unknown system: " + system);
    }

    var splitscreen_id = stream.readByte();
    return [system, uid, splitscreen_id];
};

var readCameraSettings = function(stream){
    return {
        fov: stream.readFloat(),
        height: stream.readFloat(),
        pitch: stream.readFloat(),
        distance: stream.readFloat(),
        stiffness: stream.readFloat(),
        swivel: stream.readFloat()
    };
};

var readLoadout = function(stream){
    var index = stream.readByte();
    var values = [];
    for(var i = 0;i<6;i++)
    {
        values.push(stream.readInt32());
    }
    var unk = stream.readInt32();

    if(index > 10)
        values.push(stream.readInt32());

    return [index, values];
};

var readLoadoutOnline = function(stream){
    var data = [
        stream.readInt32(),
        stream.readInt32(),
        stream.readInt32()
    ];

    return data;
};

var readTeampaint = function(stream){
    return {
        "Team": stream.readByte(),
        "TeamColorID": stream.readByte(),
        "CustomColorID": stream.readByte(),
        "TeamFinishID": stream.readInt32(),
        "CustomFinishID": stream.readInt32(),
    };
};

var readExplosion = function(stream){
    var nogoal = stream.readBool();
    if(nogoal)
    {
        return [nogoal, -1, stream.readVector()];
    }

    return [nogoal, stream.readInt32(), stream.readVector()];
};

var readEnum = function(stream){
    var e = stream.readBits(11);
    return e;
};

var readQWord = function(stream){
    return [stream.readInt32(), stream.readInt32()];
};

var readReservations = function(stream){
    var unknown = stream.readBits(3);
    var id = readUniqueId(stream);
    var name = "Not Set";

    if(id[0] != 0)
        name = readString(stream);
    var flag_1 = stream.readBool();
    var flag_2 = stream.readBool();

    return [unknown, name, flag_1, flag_2];
};

var readPickup = function(stream){
    var instigator = stream.readBool();
    if(instigator)
    {
        return [stream.readInt32(), stream.readBool()]; //instigator_id, picked_up
    }

    return [-1, stream.readBool()]; //no instigator, picked_up
};

var readDemolish = function(stream){
    var result = {};
    var atk_present = stream.readBool();
    result['attacker'] = stream.readInt32();
    var vic_present = stream.readBool();
    result['victim'] = stream.readInt32();
    result['attacker_vector'] = stream.readVector();
    result['victim_vector'] = stream.readVector();

    return result;
};

var readMusicStinger = function(stream){
    var flag = stream.readBool();
    var soundcue = stream.readInt32();
    var trigger = stream.readByte();

    return [flag, soundcue, trigger];
};

const NamePassword = 1;
const PartyOnly = 0;

var readPrivateSettings = function(stream){
    var mutators = readString(stream).split(',');
    var joinableBy = stream.readInt32();
    var maxPlayers = stream.readInt32();
    var name = readString(stream);
    var password = readString(stream);
    var flag = stream.readBool();

    return [mutators, joinableBy, maxPlayers, name, password, flag];
};

var PropertyMappper = {
    "TAGame.Team_TA:GameEvent": readFlaggedInt,
    "TAGame.CrowdActor_TA:ReplicatedOneShotSound": readFlaggedInt,
    "TAGame.CrowdManager_TA:ReplicatedGlobalOneShotSound": readFlaggedInt,
    "Engine.Actor:Owner": readFlaggedInt,
    "Engine.GameReplicationInfo:GameClass": readFlaggedInt,
    "Engine.PlayerReplicationInfo:Team": readFlaggedInt,
    "TAGame.CrowdManager_TA:GameEvent": readFlaggedInt,
    "Engine.Pawn:PlayerReplicationInfo": readFlaggedInt,
    "TAGame.PRI_TA:ReplicatedGameEvent": readFlaggedInt,
    "TAGame.Ball_TA:GameEvent": readFlaggedInt,
    "Engine.Actor:ReplicatedCollisionType": readFlaggedInt,
    "TAGame.CrowdActor_TA:GameEvent": readFlaggedInt,
    "TAGame.Team_TA:LogoData": readFlaggedInt,
    "TAGame.CarComponent_TA:Vehicle": readFlaggedInt,

    "TAGame.GameEvent_Soccar_TA:SecondsRemaining": readInt,
    "TAGame.GameEvent_TA:ReplicatedGameStateTimeRemaining": readInt,
    "TAGame.CrowdActor_TA:ReplicatedCountDownNumber": readInt,
    "TAGame.GameEvent_Team_TA:MaxTeamSize": readInt,
    "Engine.PlayerReplicationInfo:PlayerID": readInt,
    "TAGame.PRI_TA:TotalXP": readInt,
    "TAGame.PRI_TA:MatchScore": readInt,
    "TAGame.GameEvent_Soccar_TA:RoundNum": readInt,
    "TAGame.GameEvent_TA:BotSkill": readInt,
    "TAGame.PRI_TA:MatchShots": readInt,
    "TAGame.PRI_TA:MatchSaves": readInt,
    "ProjectX.GRI_X:ReplicatedGamePlaylist": readInt,
    "Engine.TeamInfo:Score": readInt,
    "Engine.PlayerReplicationInfo:Score": readInt,
    "TAGame.PRI_TA:MatchGoals": readInt,
    "TAGame.PRI_TA:MatchAssists": readInt,
    "ProjectX.GRI_X:ReplicatedGameMutatorIndex": readInt,
    "TAGame.PRI_TA:Title": readInt,

    "Engine.PlayerReplicationInfo:Ping": readByte,
    "TAGame.Vehicle_TA:ReplicatedSteer": readByte,
    "TAGame.Vehicle_TA:ReplicatedThrottle": readByte,
    "TAGame.CarComponent_Boost_TA:ReplicatedBoostAmount": readByte,
    "TAGame.PRI_TA:CameraYaw": readByte,
    "TAGame.PRI_TA:CameraPitch": readByte,
    "TAGame.Ball_TA:HitTeamNum": readByte,
    "TAGame.GameEvent_Soccar_TA:ReplicatedScoredOnTeam": readByte,
    "TAGame.GameEvent_TA:ReplicatedStateIndex": readByte,  // maybe?
    "TAGame.CarComponent_TA:ReplicatedActive": readByte,

    "Engine.Actor:bCollideWorld": readBool,
    "Engine.PlayerReplicationInfo:bReadyToPlay": readBool,
    "TAGame.Vehicle_TA:bReplicatedHandbrake": readBool,
    "TAGame.Vehicle_TA:bDriving": readBool,
    "Engine.Actor:bNetOwner": readBool,
    "Engine.Actor:bBlockActors": readBool,
    "TAGame.GameEvent_TA:bHasLeaveMatchPenalty": readBool,
    "TAGame.PRI_TA:bUsingBehindView": readBool,
    "TAGame.PRI_TA:bUsingSecondaryCamera": readBool,
    "TAGame.GameEvent_TA:ActivatorCar": readBool,
    "TAGame.GameEvent_Soccar_TA:bOverTime": readBool,
    "ProjectX.GRI_X:bGameStarted": readBool,
    "Engine.Actor:bCollideActors": readBool,
    "TAGame.PRI_TA:bReady": readBool,
    "TAGame.RBActor_TA:bFrozen": readBool,
    "Engine.Actor:bHidden": readBool,
    "Engine.Actor:bTearOff": readBool,
    "TAGame.CarComponent_FlipCar_TA:bFlipRight": readBool,
    "Engine.PlayerReplicationInfo:bBot": readBool,
    "Engine.PlayerReplicationInfo:bWaitingPlayer": readBool,
    "TAGame.RBActor_TA:bReplayActor": readBool,
    "TAGame.PRI_TA:bIsInSplitScreen": readBool,
    "Engine.GameReplicationInfo:bMatchIsOver": readBool,
    "TAGame.CarComponent_Boost_TA:bUnlimitedBoost": readBool,
    "TAGame.GameEvent_Soccar_TA:bBallHasBeenHit": readBool,

    "TAGame.CarComponent_FlipCar_TA:FlipCarTime": readFloat,
    "TAGame.Ball_TA:ReplicatedBallScale": readFloat,
    "TAGame.CarComponent_Boost_TA:RechargeDelay": readFloat,
    "TAGame.CarComponent_Boost_TA:RechargeRate": readFloat,
    "TAGame.Ball_TA:ReplicatedAddedCarBounceScale": readFloat,
    "TAGame.Ball_TA:ReplicatedBallMaxLinearSpeedScale": readFloat,
    "TAGame.Ball_TA:ReplicatedWorldBounceScale": readFloat,
    "TAGame.CarComponent_Boost_TA:BoostModifier": readFloat,
    "Engine.Actor:DrawScale": readFloat,
    "TAGame.CrowdActor_TA:ModifiedNoise": readFloat,

    "Engine.GameReplicationInfo:ServerName": readString,
    "Engine.PlayerReplicationInfo:PlayerName": readString,
    "TAGame.Team_TA:CustomTeamName": readString,

    "TAGame.RBActor_TA:ReplicatedRBState": readRigidBodyState,
    "Engine.Actor:Location": readLocation,
    "TAGame.CarComponent_Dodge_TA:DodgeTorque": readLocation,
    "Engine.PlayerReplicationInfo:UniqueId": readUniqueId,
    "TAGame.PRI_TA:PartyLeader": readUniqueId,
    "TAGame.PRI_TA:CameraSettings": readCameraSettings,
    "TAGame.PRI_TA:ClientLoadout": readLoadout,
    "TAGame.PRI_TA:ClientLoadoutOnline": readLoadoutOnline,
    "TAGame.Car_TA:TeamPaint": readTeampaint,
    "TAGame.Ball_TA:ReplicatedExplosionData": readExplosion,
    "Engine.Actor:Role": readEnum,
    "ProjectX.GRI_X:GameServerID": readQWord,
    "ProjectX.GRI_X:Reservations": readReservations,
    "TAGame.VehiclePickup_TA:ReplicatedPickupData": readPickup,
    "TAGame.Car_TA:ReplicatedDemolish": readDemolish,
    "TAGame.GameEvent_Soccar_TA:ReplicatedMusicStinger": readMusicStinger,
    "TAGame.GameEvent_SoccarPrivate_TA:MatchSettings": readPrivateSettings
};

module.exports = PropertyMappper;
