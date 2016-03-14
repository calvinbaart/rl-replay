"use strict";
const Q = require("q");
const fs = require("fs");
const BitStream = require('./bit-buffer/bit-buffer.js').BitStream;
const PropertyMapper = require("./netstream_property.js");
const ActorMapper = require("./netstream_actor.js");
const request = require("request");
const ReplayParser = require("./parser.js");

const TeamRed = 0;
const TeamBlue = 1;

class NetStreamReader
{
    constructor(buffer)
    {
        this.internal = new BitStream(buffer);
    }

    readFloat()
    {
        return this.internal.readFloat32();
    }

    readInt32()
    {
        return this.internal.readBits(32, true);
    }

    readByte()
    {
        return this.internal.readBits(8, false);
    }

    readBool()
    {
        return this.readBit() == 1;
    }

    readBit()
    {
        var bit = this.internal._view._getBit(this.internal._index);
        this.internal._index++;

        return bit;
    }

    readBits(num, signed)
    {
        return this.internal.readBits(num, signed);
    }

    readSerializedInt(max_value)
    {
        if(max_value === undefined)
        {
            throw new Error("Undefined max value when calling readSerializedInt in NetStreamReader.");
        }

        var max_bits = Math.floor(Math.log(max_value) / Math.log(2)) + 1;
        var value = 0;
        for(var i = 0; i < max_bits && (value + (1<< i)) < max_value; ++i)
        {
            value += (this.readBool() ? 1: 0) << i;
        }

        return value;
    }

    readSerializedFloat(max_value, numbits)
    {
        var max_bit_value = (1 << (numbits - 1)) - 1;
        var bias = (1 << (numbits - 1));
        var ser_int_max = (1 << (numbits - 0));
        var delta = this.readSerializedInt(ser_int_max);
        var unscaled_value = delta - bias;
        var value = 0.0;

        if(max_value > max_bit_value)
        {
            var inv_scale = max_value / max_bit_value;
            value = unscaled_value * inv_scale;
        }else{
            var scale = max_bit_value / max_value
            var inv_scale = 1.0/scale
            value = unscaled_value * inv_scale
        }

        return value;
    }

    readVector()
    {
        var numBits = this.readSerializedInt(20);
        var bias = 1 << (numBits + 1);
        var maxBits = numBits + 2;

        var dx = this.readBits(maxBits, true);
        var dy = this.readBits(maxBits, true);
        var dz = this.readBits(maxBits, true);

        var ret = {
            x: dx - bias,
            y: dy - bias,
            z: dz - bias
        }

        return ret;
    }

    readByteVector()
    {
        var x, y, z;
        x = y = z = 0;

        if(this.readBool())
            x = this.readByte();

        if(this.readBool())
            y = this.readByte();

        if(this.readBool())
            z = this.readByte();

        return {
            x: x,
            y: y,
            z: z
        }
    }

    readFloatVector()
    {
        return {
            x: this.readSerializedFloat(1, 16),
            y: this.readSerializedFloat(1, 16),
            z: this.readSerializedFloat(1, 16)
        };
    }

    readStringUTF8(length)
    {
        var bytes = [];
        for(var i = 0;i<length;i++)
            bytes.push(this.readByte());

        var str = "";
        for(var i = 0;i<bytes.length;i++)
        {
            str += String.fromCharCode(bytes[i]);
        }

        return str;
    }

    readStringUTF16(length)
    {
        var bytes = [];
        for(var i = 0;i<length;i+=2)
            bytes.push(this.readBits(16));

        var str = "";
        for(var i = 0;i<bytes.length;i++)
        {
            str += String.fromCharCode(bytes[i]);
        }

        return str;
    }

    peakBits(num, format, formatType)
    {
        var a = [];
        var str = "";

        if(!format || (format && formatType == "binary"))
        {
            for(var i = 0;i<num;i++)
            {
                var bit = this.internal._view._getBit(this.internal._index + i);
                a.push(bit);

                if(format && formatType == "binary")
                {
                    str += bit;
                    if((i + 1) % 8 == 0)
                        str += " ";
                }
            }
        }

        if(format)
        {
            if(formatType == "hex")
            {
                var str = "";
                for(var i = 0;i<num;i+=8)
                {
                    var byte = this.internal._view.getBitsUnsigned(this.internal._index + i, 8);
                    var hex = byteToHex(byte);

                    str += hex + " ";
                }
            }

            return str;
        }

        return a;
    }

    skip(num)
    {
        this.internal._index += num;
    }
}

class ActorState
{
    constructor(replay, stream, alive_buffer)
    {
        this.replay = replay;
        this.stream = stream;
        this.alive_buffer = alive_buffer;

        this.state = ActorState.UNKNOWN;
        this.id = null;
        this.flag = null;
        this.type_id = null;
        this.type_name = null;
        this.class_name = null;
        this.start_position = null;
        this.start_rotation = null;
        this.properties = null;
        this.parsed = null;
    }

    parse()
    {
        this.id = this.stream.readBits(10);

        var alive = this.stream.readBool();
        if(alive)
        {
            var is_new = this.stream.readBool();
            if(is_new)
            {
                this.state = ActorState.NEW;
                this.flag = this.stream.readBool();
                this.type_id = this.stream.readInt32();
                this.type_name = this.replay.object[this.type_id];
                this.class_name = this.replay.convert_arch_type_to_class_name(this.type_name);
                this.properties = {};

                this.alive_buffer[this.id] = this;
                if(this.type_name.indexOf("TheWorld") != -1)
                {
                    //not sure if this if is even needed
                    return;
                }

                this.start_position = this.stream.readVector();
                if(this.type_name.indexOf("Archetypes.Ball") != -1 || this.type_name.indexOf("Car_Default") != -1)
                    this.start_rotation = this.stream.readByteVector();

                this.create_parsed();
            }else{
                this.state = ActorState.EXISTING;
                this.copy(this.alive_buffer[this.id]);

                var cache = this.replay.get_cache_for_type(this.class_name);
                while(this.stream.readBool())
                {
                    var prop_id = this.stream.readSerializedInt(cache.get_max_property_id() + 1);
                    var prop_name = this.replay.object[cache.get_property(prop_id)];

                    if(PropertyMapper[prop_name] === undefined)
                    {
                        throw new Error("No mapping available for property '" + prop_name + "'.");
                    }

                    this.properties[prop_name] = PropertyMapper[prop_name](this.stream);
                }

                //extremely inefficient
                this.create_parsed();
                this.alive_buffer[this.id] = this;
            }
        }else{
            this.state = ActorState.DEAD;
            this.parsed = null;
            delete this.alive_buffer[this.id];
        }
    }

    copy(other)
    {
        this.flag = other.flag;
        this.type_id = other.type_id;
        this.type_name = other.type_name;
        this.class_name = other.class_name;
        this.start_position = other.start_position;
        this.start_rotation = other.start_rotation;
        this.properties = JSON.parse(JSON.stringify(other.properties)); //deep-clone
        this.parsed = null;
    }

    create_parsed()
    {
        for(var key in ActorMapper)
        {
            if(this.class_name.indexOf(key) != -1)
            {
                this.parsed = new ActorMapper[key](this.id);
                break;
            }
        }
    }

    //workaround because javascript doesn't allow static constant properties.
    static get UNKNOWN()
    {
        return 0;
    }

    static get NEW()
    {
        return 1;
    }

    static get EXISTING()
    {
        return 2;
    }

    static get DEAD()
    {
        return 3;
    }
}

class NetStreamFrame
{
    constructor(replay, stream, alive_buffer)
    {
        this.replay = replay;
        this.stream = stream;
        this.alive_buffer = alive_buffer;

        this.id = 0;
        this.time = null;
        this.delta = null;
        this.actor = null;
        this.parsed_actor = null;
    }

    get_actor(id)
    {
        if(this.actor[id] === undefined)
            return null;

        return this.actor[id];
    }

    get_parsed_actor(id)
    {
        if(this.parsed_actor[id] === undefined)
            return null;

        return this.parsed_actor[id].parsed;
    }

    get_player_by_name(name)
    {
        for(var j in this.parsed_actor)
        {
            if(this.parsed_actor[j].parsed.type == "Player")
            {
                if(this.parsed_actor[j].parsed.name == name)
                {
                    return this.parsed_actor[j].parsed;
                }
            }
        }

        return null;
    }

    add_actor(state)
    {
        if(this.actor[state.id] !== undefined)
            return;

        if(state.parsed)
        {
            this.parsed_actor[state.id] = state;
        }else if(this.parsed_actor[state.id] !== undefined)
        {
            delete this.parsed_actor[state.id];
        }

        this.actor[state.id] = state;
    }

    parse()
    {
        this.time = this.stream.readFloat();
        this.delta = this.stream.readFloat();
        this.actor = {};
        this.parsed_actor = {};

        while(true)
        {
            var actorPresent = this.stream.readBool();
            if(!actorPresent)
                break;

            var state = new ActorState(this.replay, this.stream, this.alive_buffer);
            state.parse();

            if(state.state == ActorState.DEAD)
                this.add_actor(state);
        }

        for(var key in this.alive_buffer)
        {
            this.add_actor(this.alive_buffer[key]);
        }

        for(var key in this.parsed_actor)
        {
            this.parsed_actor[key].parsed.update(this, this.parsed_actor[key]);
        }
    }
}

class NetCache
{
    constructor(cache)
    {
        this.class_id = cache.object_index;
        this.parent_id = cache.parent_id;
        this.id = cache.id;
        this.mapping = {};
        this.parent = null;
        this.children = [];
        this.max_property_id = 0;

        for(var i = 0;i<cache.properties.length;i++)
        {
            if(cache.properties[i].id > this.max_property_id)
                this.max_property_id = cache.properties[i].id;

            this.mapping[cache.properties[i].id] = cache.properties[i].index;
        }
    }

    add_child(child)
    {
        child.parent = this;
        child.set_max_property_id(this.max_property_id);
        this.children.push(child);
    }

    get_property(id)
    {
        if(this.mapping[id] !== undefined) return this.mapping[id];
        if(this.parent != null) return this.parent.get_property(id);
        return null;
    }

    set_max_property_id(id)
    {
        if(id <= this.max_property_id)
            return;

        this.max_property_id = id;
        for(var i = 0;i<this.children.length;i++)
        {
            this.children[i].set_max_property_id(id);
        }
    }

    get_max_property_id()
    {
        return this.max_property_id;
    }
}

class Replay
{
    constructor(file)
    {
        this.file = file;
        this.data = null;
        this.header = null;
        this.properties = null;
        this.sfx = null;
        this.object = null;
        this.name = null;
        this.package = null;
        this.frame = null;
        this.goal = null;

        this.loaded = false;
        this.loadInProgress = null;
    }

    load(options)
    {
        if(this.loaded)
            return;

        if(this.loadInProgress !== null)
            return this.loadInProgress;

        options = options || {};

        var defer = Q.defer();
        this.loadInProgress = defer;

        this.asyncCall(function(){
            if(typeof this.file === "string")
            {
                var callback = function(err, buffer){
                    if(err)
                    {
                        return defer.reject(err);
                    }

                    this.parse(buffer, options).then(function(){
                        this.loaded = true;
                        this.loadInProgress = null;

                        defer.resolve();
                    }.bind(this), function(err){
                        this.loadInProgress = null;
                        defer.reject(err);
                    }.bind(this), function(progress){
                        this.loadInProgress = null;
                        defer.notify(progress);
                    }.bind(this));
                }.bind(this);

                //check if its an url
                if(/^http(?:s)?\:\/\//i.exec(this.file) !== null)
                {
                    Replay.download(this.file, callback);
                }else{
                    fs.readFile(this.file, callback);
                }
            }else{
                this.parse(this.file, options).then(function(){
                    this.loaded = true;
                    this.loadInProgress = null;
                    defer.resolve();
                }.bind(this), function(err){
                    this.loadInProgress = null;
                    defer.reject(err);
                }.bind(this), function(progress){
                    this.loadInProgress = null;
                    defer.notify(progress);
                }.bind(this));
            }
        });

        return defer.promise;
    }

    parse(buffer, options)
    {
        var defer = Q.defer();

        this.asyncCall(function(){
            var data = ReplayParser.parse(buffer);

            this.data = data;
            this.header = data.header;
            this.properties = {};
            this.sfx = [];
            this.object = [];
            this.name = [];
            this.package = [];
            this.frame = [];
            this.goal = [];

            for(var i = 0;i<data.sfx.length;i++) this.sfx.push(data.sfx[i].name);
            for(var i = 0;i<data.object.length;i++) this.object.push(data.object[i].string);
            for(var i = 0;i<data.name.length;i++) this.name.push(data.name[i].string);
            for(var i = 0;i<data.package.length;i++) this.package.push(data.package[i].string);

            for(var i = 0;i<data.tickmark.length;i++)
            {
                var mark = data.tickmark[i];
                if(mark.type == "Team0Goal")
                {
                    this.goal.push({
                        frame: mark.frame,
                        type: "blue"
                    });
                }
                else if(mark.type == "Team1Goal")
                {
                    this.goal.push({
                        frame: mark.frame,
                        type: "red"
                    });
                }else{
                    //unknown tickmark, might be useful in the future
                    //console.log("Tickmark: " + mark.type);
                }
            }

            this.parse_properties();

            if(options.parse_netcache === undefined || options.parse_netcache)
            {
                this.parse_netcache();

                if(options.parse_frame === undefined || options.parse_frame)
                    this.parse_frames();
            }

            defer.resolve();
        });

        return defer.promise;
    }

    static download(url, callback)
    {
        request({url: url, encoding: null}, function(error, response, body){
            if(error)
                return callback(error, null);

            return callback(null, body);
        });
    }

    parse_property(property)
    {
        if(property.more.type == "ArrayProperty")
        {
            var data = [];
            for(var j = 0;j<property.more.details.array.length;j++)
            {
                var sub = {};
                for(var k = 0;k<property.more.details.array[j].part.length;k++)
                {
                    var sub_property = property.more.details.array[j].part[k];
                    if(sub_property.name == "None")
                        continue;

                    sub[sub_property.name] = this.parse_property(sub_property);
                }

                data.push(sub);
            }

            return data;
        }

        if(property.more.type == "StrProperty")
        {
            var str = null;
            if(property.more.details.value_length < 0)
                str = property.more.details.value.toString("ucs2");
            else
                str = property.more.details.value.toString("utf8");

            return str;
        }

        if(property.more.details.value === undefined)
        {
            return [property.more.details.value1, property.more.details.value2];
        }

        return property.more.details.value;
    }

    parse_properties()
    {
        for(var i = 0;i<this.data.properties.length;i++)
        {
            var property = this.data.properties[i];
            if(property.name == "None")
                continue;

            this.properties[property.name] = this.parse_property(property);
        }
    }

    parse_netcache()
    {
        var temp_cache = [];
        var pri_netcache = null;
        var prix_netcache = null;
        var prita_netcache = null;

        for(var i = 0;i<this.data.class_netcache.length;i++)
        {
            var cache = new NetCache(this.data.class_netcache[i]);

            var typename = this.object[cache.class_id];
            if(typename == "Engine.PlayerReplicationInfo") pri_netcache = cache;
            if(typename == "ProjectX.PRI_X") prix_netcache = cache;
            if(typename == "TAGame.PRI_TA") prita_netcache = cache;

            temp_cache.push(cache);
        }

        temp_cache.reverse();
        for(var i = 0;i<temp_cache.length - 1;i++)
        {
            var cache = temp_cache[i];
            var j = i + 1;

            while(j < temp_cache.length)
            {
                var item = temp_cache[j];
                if(item.id == cache.parent_id)
                {
                    item.add_child(cache);
                    break;
                }else{
                    j++;
                }
            }
        }

        // 2016/02/10 patch replays have TAGame.PRI_TA classes with no parent, this should be a temporary fix till we figure out why they have no parent.
        if(prix_netcache.parent == null)
        {
            pri_netcache.add_child(prix_netcache);
        }

        if(prita_netcache.parent == null)
        {
            prix_netcache.add_child(prita_netcache);
        }

        this.netcache = temp_cache.slice(0, -1);
    }

    parse_frames()
    {
        var stream = new NetStreamReader(this.data.networkstream);
        var alive_buffer = {};

        for(var i = 0;i<this.properties["NumFrames"];i++)
        {
            this.frame.push(this.parse_frame(i, stream, alive_buffer));
            this.loadInProgress.notify(i / this.properties["NumFrames"]);
        }
    }

    parse_frame(id, stream, alive_buffer)
    {
        var frame = new NetStreamFrame(this, stream, alive_buffer);
        frame.id = id;
        frame.parse();

        return frame;
    }

    convert_arch_type_to_class_name(arch_type)
    {
        if(arch_type == "GameInfo_Soccar.GameInfo.GameInfo_Soccar:GameReplicationInfoArchetype")
            return "TAGame.GRI_TA";
        else if(arch_type == "GameInfo_Season.GameInfo.GameInfo_Season:GameReplicationInfoArchetype")
            return "TAGame.GRI_TA";
        else if(arch_type == "Archetypes.GameEvent.GameEvent_Season:CarArchetype")
            return "TAGame.Car_Season_TA";
        else if(arch_type.indexOf("Archetypes.Ball") != -1)
            return "TAGame.Ball_TA";
        else
        {
            var name = arch_type.replace(/_\d+/, "").split(".").slice(-1)[0].split(":").slice(-1)[0];
            name = name.replace("_Default", "_TA");
            name = name.replace("Archetype", "");
            name = name.replace("_0", "");
            name = name.replace("0", "_TA");
            name = name.replace("1", "_TA");
            name = name.replace("Default__", "");
            name = "." + name;

            return name;
        }
    }

    get_cache_for_type(type)
    {
        for(var i = 0;i<this.netcache.length;i++)
        {
            if(this.object[this.netcache[i].class_id].indexOf(type) != -1)
            {
                return this.netcache[i];
            }
        }

        return null;
    }

    asyncCall(func)
    {
        setTimeout(func.bind(this), 0);
    }
}

module.exports = Replay;

if(require.main === module)
{
    function getFiles (dir, files_){
        files_ = files_ || [];
        var files = fs.readdirSync(dir);
        for (var i in files){
            var name = dir + '\\' + files[i];
            if (fs.statSync(name).isDirectory()){
                getFiles(name, files_);
            } else {
                files_.push(name);
            }
        }
        return files_;
    }

    //var replay = new Replay("https://rocketleaguereplays-media.s3-eu-west-1.amazonaws.com/uploads/replay_files/862E5E0F40CF0DC42AE62FB32FD9D7C3.replay");

    var samples = getFiles(process.env["USERPROFILE"] + "\\Documents\\My games\\Rocket League\\TAGame\\Demos");
    var test = function(i, done){
        if(i >= samples.length)
            return done();

        try
        {
            var replay = new Replay(samples[i]);
            replay.load().then(function(){
                console.log("Test succeeded, file '" + samples[i] + "'.");
                test(i + 1, done);
            }, function(e){
                console.log("Test failed, file '" + samples[i] + "', error: " + e);
                test(i + 1, done);
            });
        }
        catch(e)
        {
            console.log("Test failed, file '" + samples[i] + "', error: " + e);
            test(i + 1, done);
        }
    };

    test(0);
}
