"use strict";
const Parser = require('binary-parser').Parser;

const selectDataType = function() {
  if(this.type === 'IntProperty')
    return 1;
  else if(this.type === 'ArrayProperty')
    return 2;
  else if(this.type === 'StrProperty' || this.type === 'NameProperty')
    return 3;
  else if(this.type === 'ByteProperty')
    return 4;
  else if(this.type === 'QWordProperty')
    return 5;
  else if(this.type === 'BoolProperty')
    return 6;
  else if(this.type === 'FloatProperty')
    return 7;
};

const isNone = function() {
  if(this.name === 'None')
    return 1;

  return 0;
}

const readUntilNone = function(item, buf) {
    return item.name === 'None';
}

const decimalToHex = function(item) {
    var hex = parseInt(item, 10).toString(16);
    var len = 8 - hex.length;

    if (len > 0)
    {
        for(len; len > 0; --len)
            hex = '0' + hex;
    }

    return hex;
}

const IntProperty = new Parser()
    .endianess('little')
    .int32('value');

const StrProperty = new Parser()
    .endianess('little')
    .int32('value_length')
    .buffer("value", {length: function(){if(this.value_length < 0) return this.value_length * -2; else return this.value_length;}});
    //.string('value', {encoding: 'utf8', length: 'value_length', stripNull: true});

const ByteProperty = new Parser()
    .endianess('little')
    .int32('value1_length')
    .string('value1', { encoding: 'ascii', length: 'value1_length', stripNull: true })
    .int32('value2_length')
    .string('value2', { encoding: 'ascii', length: 'value2_length', stripNull: true });

const QWordProperty = new Parser()
    .endianess('little')
    .int32('hex2', { formatter: decimalToHex })
    .int32('hex1', { formatter: decimalToHex });

const BoolProperty = new Parser()
    .endianess('little')
    .bit8('value');

const FloatProperty = new Parser()
    .endianess('little')
    .float('value');

const ArrayPropertyDetail = new Parser()
    .endianess('little')
    .int32('nl')
    .string('name', {encoding: 'ascii', length: 'nl', stripNull: true })
    .choice('more', {
        tag: isNone,
        choices: {
            1: new Parser(),
            0: new Parser()
            .endianess('little')
            .int32('tl')
            .string('type', {encoding: 'ascii', length: 'tl', stripNull: true})
            .int32('unkn1')
            .int32('unkn2')
            .choice('details', {
                tag: selectDataType,
                choices: {
                    1: IntProperty,
                    3: StrProperty,
                    4: ByteProperty,
                    5: QWordProperty,
                    6: BoolProperty,
                    7: FloatProperty
                }
            })
        }
    });

const ArrayProperty = new Parser()
    .endianess('little')
    .int32('length')
    .array('array', {
        type: new Parser().array('part', { type: ArrayPropertyDetail, readUntil: readUntilNone }),
        length: 'length'
    });

const Property = new Parser()
    .endianess('little')
    .int32('name_length')
    .string('name', { encoding: 'ascii', length: 'name_length', stripNull: true })
    .choice('more', {
        tag: isNone,
        choices: {
        1: new Parser(),
        0: new Parser()
        .endianess('little')
        .int32('type_length')
        .string('type', { encoding: 'ascii', length: 'type_length', stripNull: true })
        .int32('size1') //int64: size
        .int32('size2')
        .choice('details', {
            tag: selectDataType,
            choices: {
                1: IntProperty,
                2: ArrayProperty,
                3: StrProperty,
                4: ByteProperty,
                5: QWordProperty,
                6: BoolProperty,
                7: FloatProperty
            }
        })
        }
    });

const Header = new Parser()
    .endianess('little')
    .int32('identifier')
    .int32('crc')
    .int32('version_major')
    .int32('version_minor')
    .int32('type_length')
    .string('type', { encoding: 'ascii', length: 'type_length', stripNull: true });

const SFX = new Parser()
    .endianess("little")
    .int32("name_length")
    .string("name", { encoding: "ascii", length: "name_length", stripNull: true});

const KeyFrame = new Parser()
    .endianess("little")
    .float("time")
    .int32("frame")
    .int32("file_position");

const DebugString = new Parser()
    .endianess("little")
    .int32("frame")
    .int32("username_length")
    .string("username", {encoding: "ascii", length: "username_length", stripNull: true})
    .int32("text_length")
    .string("text", {encoding: "ascii", length: "text_length", stripNull: true});

const TickMark = new Parser()
    .endianess("little")
    .int32("text_length")
    .string("type", {encoding: "ascii", length: "text_length", stripNull: true})
    .int32("frame");

const StringArray = new Parser()
    .endianess("little")
    .int32("string_length")
    .string("string", {encoding: "ascii", length: "string_length", stripNull: true});

const ClassIndex = new Parser()
    .endianess("little")
    .int32("class_length")
    .string("class", {encoding: "ascii", length: "class_length", stripNull: true})
    .int32("index");

const ClassNetCacheProperty = new Parser()
    .endianess("little")
    .int32("index")
    .int32("id");

const ClassNetCache = new Parser()
    .endianess("little")
    .int32("object_index")
    .int32("parent_id")
    .int32("id")
    .int32("properties_length")
    .array("properties", {
        type: ClassNetCacheProperty,
        length: "properties_length"
    });

const ReplayParser = new Parser()
    .endianess("little")
    .nest("header", {type: Header})
    .array('properties', {
      type: Property,
      readUntil: readUntilNone
    })
    .int32("lengthOfRemaining")
    .int32("unknown")
    .int32("sfx_length")
    .array("sfx", {
        type: SFX,
        length: "sfx_length"
    })
    .int32("keyframe_length")
    .array("keyframe", {
        type: KeyFrame,
        length: "keyframe_length"
    })
    .int32("networkstream_length")
    .buffer("networkstream", {
        length: "networkstream_length"
    })
    .int32("debugstring_length")
    .array("debugstring", {
        type: DebugString,
        length: "debugstring_length"
    })
    .int32("tickmark_length")
    .array("tickmark", {
        type: TickMark,
        length: "tickmark_length"
    })
    .int32("package_length")
    .array("package", {
        type: StringArray,
        length: "package_length"
    })
    .int32("object_length")
    .array("object", {
        type: StringArray,
        length: "object_length"
    })
    .int32("name_length")
    .array("name", {
        type: StringArray,
        length: "name_length"
    })
    .int32("class_index_length")
    .array("class_index", {
        type: ClassIndex,
        length: "class_index_length"
    })
    .int32("class_netcache_length")
    .array("class_netcache", {
        type: ClassNetCache,
        length: "class_netcache_length"
    });
    
module.exports = ReplayParser;