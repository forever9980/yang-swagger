// Generated by CoffeeScript 1.11.1
(function() {
  var Yang, debug, definitions, discoverOperations, discoverPathParameters, discoverPaths, serializeJSchema, traverse, yaml, yang2jschema, yang2jsobj, yang2jstype;

  if (process.env.DEBUG != null) {
    debug = require('debug')('yang-swagger');
  }

  traverse = require('traverse');

  Yang = require('yang-js');

  yaml = require('js-yaml');

  definitions = {};

  yang2jstype = function(schema) {
    var datatype, js, k, ref1, ref2, v;
    js = {
      description: (ref1 = schema.description) != null ? ref1.tag : void 0,
      "default": (ref2 = schema["default"]) != null ? ref2.tag : void 0
    };
    if (schema.type == null) {
      return js;
    }
    datatype = (function() {
      switch (schema.type.primitive) {
        case 'uint8':
        case 'int8':
          return {
            type: 'integer',
            format: 'byte'
          };
        case 'uint16':
        case 'uint32':
        case 'uint64':
        case 'int16':
        case 'int32':
        case 'int64':
          return {
            type: 'integer',
            format: schema.type.primitive
          };
        case 'binary':
          return {
            type: 'string',
            format: 'binary'
          };
        case 'decimal64':
          return {
            type: 'number',
            format: 'double'
          };
        case 'union':
          return {
            type: 'string',
            format: schema.type.tag
          };
        case 'boolean':
          return {
            type: 'boolean',
            format: schema.type.tag
          };
        case 'enumeration':
          return {
            type: 'string',
            format: schema.type.tag,
            "enum": schema.type["enum"].map(function(e) {
              return e.tag;
            })
          };
        default:
          return {
            type: 'string',
            format: schema.type.tag
          };
      }
    })();
    for (k in datatype) {
      v = datatype[k];
      js[k] = v;
    }
    return js;
  };

  yang2jsobj = function(schema) {
    var js, property, ref, ref1, ref2, refs, required;
    if (schema == null) {
      return {};
    }
    js = {
      description: (ref1 = schema.description) != null ? ref1.tag : void 0
    };
    required = [];
    property = schema.nodes.filter(function(x) {
      return x.parent === schema;
    }).map(function(node) {
      var ref2;
      if (((ref2 = node.mandatory) != null ? ref2.valueOf() : void 0) === true) {
        required.push(node.tag);
      }
      return {
        name: node.tag,
        schema: yang2jschema(node)
      };
    });
    refs = (ref2 = schema.uses) != null ? ref2.filter(function(x) {
      return x.parent === schema;
    }) : void 0;
    if (refs != null ? refs.length : void 0) {
      refs.forEach(function(ref) {
        if (definitions[ref.tag] == null) {
          if (typeof debug === "function") {
            debug("[yang2jsobj] defining " + ref.tag + " using " + schema.trail);
          }
          definitions[ref.tag] = true;
          return definitions[ref.tag] = yang2jsobj(ref.state.grouping.origin);
        }
      });
      if (refs.length > 1 || property.length) {
        js.allOf = refs.map(function(ref) {
          return {
            '$ref': "#/definitions/" + ref.tag
          };
        });
        if (property.length) {
          js.allOf.push({
            required: required.length ? required : void 0,
            property: property
          });
        }
      } else {
        ref = refs[0];
        js['$ref'] = "#/definitions/" + ref.tag;
      }
    } else {
      js.type = 'object';
      if (property.length) {
        js.property = property;
      }
      if (required.length) {
        js.required = required;
      }
    }
    return js;
  };

  yang2jschema = function(schema, item) {
    if (item == null) {
      item = false;
    }
    if (schema == null) {
      return {};
    }
    switch (schema.kind) {
      case 'leaf':
        return yang2jstype(schema);
      case 'leaf-list':
        return {
          type: 'array',
          items: yang2jstype(schema)
        };
      case 'list':
        if (!item) {
          return {
            type: 'array',
            items: yang2jsobj(schema)
          };
        } else {
          return yang2jsobj(schema);
        }
        break;
      case 'grouping':
        return {};
      default:
        return yang2jsobj(schema);
    }
  };

  discoverOperations = function(schema, item) {
    var deprecated, ref1, ref10, ref11, ref12, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
    if (item == null) {
      item = false;
    }
    if (typeof debug === "function") {
      debug("[discoverOperations] inspecting " + schema.trail);
    }
    deprecated = ((ref1 = schema.status) != null ? ref1.valueOf() : void 0) === 'deprecated';
    switch (false) {
      case (ref2 = schema.kind) !== 'rpc' && ref2 !== 'action':
        return [
          {
            method: 'post',
            description: (ref3 = schema.description) != null ? ref3.tag : void 0,
            summary: "Invokes " + schema.tag + " in " + schema.parent.tag,
            deprecated: deprecated,
            parameter: [
              {
                name: schema.tag + ":input",
                "in": 'body',
                description: (ref4 = schema.input) != null ? (ref5 = ref4.description) != null ? ref5.tag : void 0 : void 0,
                schema: yang2jschema(schema.input)
              }
            ],
            response: [
              {
                code: 200,
                description: "Expected response of " + schema.tag,
                schema: yang2jschema(schema.output)
              }
            ]
          }
        ];
      case !(schema.kind === 'list' && !item):
        return [
          {
            method: 'post',
            description: (ref6 = schema.description) != null ? ref6.tag : void 0,
            summary: "Creates one or more new " + schema.tag + " in " + schema.parent.tag,
            deprecated: deprecated,
            parameter: [
              {
                name: "" + schema.tag,
                "in": 'body',
                description: (ref7 = schema.description) != null ? ref7.tag : void 0,
                schema: yang2jschema(schema)
              }
            ],
            response: [
              {
                code: 200,
                description: "Expected response for creating " + schema.tag + "(s) in collection",
                schema: yang2jschema(schema)
              }
            ]
          }, {
            method: 'get',
            summary: "List all " + schema.tag + "s from " + schema.parent.tag,
            deprecated: deprecated,
            response: [
              {
                code: 200,
                description: "Expected response of " + schema.tag + "s",
                schema: yang2jschema(schema)
              }
            ]
          }, {
            method: 'put',
            summary: "Replace the entire " + schema.tag + " collection",
            deprecated: deprecated,
            parameter: [
              {
                name: "" + schema.tag,
                "in": 'body',
                description: (ref8 = schema.description) != null ? ref8.tag : void 0,
                schema: yang2jschema(schema)
              }
            ],
            response: [
              {
                code: 201,
                description: "Expected response for replacing collection"
              }
            ]
          }, {
            method: 'patch',
            summary: "Merge items into the " + schema.tag + " collection",
            deprecated: deprecated,
            parameter: [
              {
                name: "" + schema.tag,
                "in": 'body',
                description: (ref9 = schema.description) != null ? ref9.tag : void 0,
                schema: yang2jschema(schema)
              }
            ],
            response: [
              {
                code: 201,
                description: "Expected response for merging into collection"
              }
            ]
          }
        ];
      default:
        return [
          {
            method: 'get',
            description: (ref10 = schema.description) != null ? ref10.tag : void 0,
            summary: "View detail on " + schema.tag,
            deprecated: deprecated,
            response: [
              {
                code: 200,
                description: "Expected response of " + schema.tag,
                schema: yang2jschema(schema, item)
              }
            ]
          }, {
            method: 'put',
            summary: "Update details on " + schema.tag,
            deprecated: deprecated,
            parameter: [
              {
                name: "" + schema.tag,
                "in": 'body',
                description: (ref11 = schema.description) != null ? ref11.tag : void 0,
                schema: yang2jschema(schema, item)
              }
            ],
            response: [
              {
                code: 200,
                description: "Expected response of " + schema.tag,
                schema: yang2jschema(schema, item)
              }
            ]
          }, {
            method: 'patch',
            summary: "Merge details on " + schema.tag,
            deprecated: deprecated,
            parameter: [
              {
                name: "" + schema.tag,
                "in": 'body',
                description: (ref12 = schema.description) != null ? ref12.tag : void 0,
                schema: yang2jschema(schema, item)
              }
            ],
            response: [
              {
                code: 200,
                description: "Expected response of " + schema.tag,
                schema: yang2jschema(schema, item)
              }
            ]
          }, {
            method: 'delete',
            summary: "Delete " + schema.tag + " from " + schema.parent.tag,
            deprecated: deprecated,
            response: [
              {
                code: 204,
                description: "Expected response for delete"
              }
            ]
          }
        ];
    }
  };

  discoverPathParameters = function(schema) {
    var k, key, param, ref1, ref2, v;
    if (typeof debug === "function") {
      debug("[discoverPathParameters] inspecting " + schema.trail);
    }
    key = "" + ((ref1 = schema.key) != null ? ref1.valueOf() : void 0);
    switch (false) {
      case !(schema.key == null):
        return [
          {
            name: 'index',
            "in": 'path',
            required: true,
            type: 'integer',
            format: 'int64',
            description: "An index key identifying " + schema.tag + " item (may change over time)"
          }
        ];
      case !(schema.key.tag.length > 1):
        return [
          {
            name: key,
            "in": 'path',
            required: true,
            type: 'string',
            format: 'composite',
            description: "A composite key uniquely identifying " + schema.tag + " item"
          }
        ];
      default:
        param = {
          name: key,
          "in": 'path',
          required: true,
          description: "A key uniquely identifying " + schema.tag + " item"
        };
        ref2 = yang2jstype(schema.locate(key));
        for (k in ref2) {
          v = ref2[k];
          if (v != null) {
            param[k] = v;
          }
        }
        return [param];
    }
  };

  discoverPaths = function(schema) {
    var key, name, params, paths, ref1, ref2, ref3, ref4, sub, subpaths;
    if ((ref1 = schema.kind) !== 'list' && ref1 !== 'container' && ref1 !== 'rpc' && ref1 !== 'action') {
      return [];
    }
    if (schema['if-feature'] != null) {
      return [];
    }
    name = "/" + schema.datakey;
    if (typeof debug === "function") {
      debug("[discoverPaths] inspecting " + schema.trail);
    }
    paths = [
      {
        name: name,
        operation: discoverOperations(schema)
      }
    ];
    subpaths = (ref2 = []).concat.apply(ref2, (function() {
      var i, len, ref2, results;
      ref2 = schema.nodes;
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        sub = ref2[i];
        results.push(discoverPaths(sub));
      }
      return results;
    })());
    switch (schema.kind) {
      case 'list':
        key = (ref3 = (ref4 = schema.key) != null ? ref4.valueOf() : void 0) != null ? ref3 : 'index';
        params = discoverPathParameters(schema);
        paths.push({
          name: name + "/{" + key + "}",
          parameter: params,
          operation: discoverOperations(schema, true)
        });
        subpaths.forEach(function(x) {
          var ref5;
          x.name = (name + "/{" + key + "}") + x.name;
          if ((ref5 = x.parameter) != null) {
            if (typeof ref5.push === "function") {
              ref5.push.apply(ref5, params);
            }
          }
          return x.parameter != null ? x.parameter : x.parameter = params;
        });
        break;
      case 'container':
        subpaths.forEach(function(x) {
          return x.name = name + x.name;
        });
    }
    if (typeof debug === "function") {
      debug("[discoverPaths] discovered " + paths.length + " paths with " + subpaths.length + " subpaths inside " + schema.trail);
    }
    return paths.concat.apply(paths, subpaths);
  };

  serializeJSchema = function(jschema) {
    var k, o, ref1, ref2, ref3, ref4, v;
    if (jschema == null) {
      return;
    }
    o = {};
    for (k in jschema) {
      v = jschema[k];
      if (k !== 'property') {
        o[k] = v;
      }
    }
    o.properties = (ref1 = jschema.property) != null ? ref1.reduce((function(a, _prop) {
      a[_prop.name] = serializeJSchema(_prop.schema);
      return a;
    }), {}) : void 0;
    o.items = serializeJSchema(o.items);
    o.allOf = (ref2 = o.allOf) != null ? ref2.map(function(x) {
      return serializeJSchema(x);
    }) : void 0;
    o.anyOf = (ref3 = o.anyOf) != null ? ref3.map(function(x) {
      return serializeJSchema(x);
    }) : void 0;
    o.oneOf = (ref4 = o.oneOf) != null ? ref4.map(function(x) {
      return serializeJSchema(x);
    }) : void 0;
    return o;
  };

  module.exports = require('./yang-openapi.yang').bind({
    transform: function() {
      var k, modules, v;
      modules = this.input.modules.map((function(_this) {
        return function(name) {
          return _this.schema.constructor["import"](name);
        };
      })(this));
      if (typeof debug === "function") {
        debug("[transform] transforming " + this.input.modules);
      }
      definitions = {};
      return this.output = {
        spec: {
          swagger: '2.0',
          info: this.get('/info'),
          consumes: ["application/json"],
          produces: ["application/json"],
          path: modules.map(function(m) {
            var i, len, ref1, results, schema;
            ref1 = m.nodes;
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              schema = ref1[i];
              results.push(discoverPaths(schema));
            }
            return results;
          }).reduce((function(a, b) {
            return a.concat.apply(a, b);
          }), []),
          definition: (function() {
            var results;
            results = [];
            for (k in definitions) {
              v = definitions[k];
              results.push({
                name: k,
                schema: v
              });
            }
            return results;
          })()
        }
      };
    },
    '{specification}/serialize': function() {
      var ref1, spec;
      if (typeof debug === "function") {
        debug("[" + this.path + "] serializing specification");
      }
      spec = this.parent.toJSON(false);
      spec.paths = spec.path.reduce((function(a, _path) {
        var i, k, len, op, operation, path, ref1, ref2, v;
        path = a[_path.name] = {
          '$ref': _path['$ref']
        };
        ref2 = (ref1 = _path.operation) != null ? ref1 : [];
        for (i = 0, len = ref2.length; i < len; i++) {
          op = ref2[i];
          operation = path[op.method] = {};
          for (k in op) {
            v = op[k];
            if (k !== 'method' && k !== 'parameter' && k !== 'response') {
              operation[k] = v;
            }
          }
          operation.parameters = traverse(op.parameter).map(function(x) {
            if (this.key === 'schema') {
              return this.update(serializeJSchema(x), true);
            }
          });
          operation.responses = op.response.reduce((function(x, _res) {
            x[_res.code] = {
              description: _res.description,
              schema: serializeJSchema(_res.schema)
            };
            return x;
          }), {});
        }
        path.parameters = _path.parameter;
        return a;
      }), {});
      spec.definitions = (ref1 = spec.definition) != null ? ref1.reduce((function(a, _def) {
        a[_def.name] = serializeJSchema(_def.schema);
        return a;
      }), {}) : void 0;
      delete spec.path;
      delete spec.definition;
      delete spec.serialize;
      spec = traverse(spec).map(function(x) {
        if (x == null) {
          return this.remove();
        }
      });
      return this.output = {
        data: (function() {
          switch (this.input.format) {
            case 'json':
              return JSON.stringify(spec, null, 2);
            case 'yaml':
              return yaml.dump(spec);
          }
        }).call(this)
      };
    }
  });

}).call(this);
