/**
 * Lexical Scope
 *
 * Get JS Source's Lexical Scope
 */


/**
 *  module dependencies
 */

var walk = require('./astwalk')
  , utils = require('./utils');


// shortcuts

var isArray = utils.isArray
  , objectKeys = utils.objectKeys
  , indexOf = utils.indexOf;

// expose module

module.exports = lexScope;

/**
 * lexScope
 *
 * output js string's lexical scope
 *
 * @param  String
 * @return Object
 */

function lexScope(src) {
  var locals = {};
  var implicit = {};
  var exported = {};

  src = String(src).replace(/^#![^\n]*\n/, '');

  walk(src, function(node) {

    if (node.type === 'VariableDeclaration') {
      // take off the leading `var `
      var id = getScope(node);
      for (var i = 0; i < node.declarations.length; i++) {
        var d = node.declarations[i];
        locals[id][d.id.name] = d;
      }
    } else if (node.type === 'CatchClause') {
      var id = getScope(node);
      for (var i = 0; i < node.body.length; i++) {
        var d = node.params[i];
        locals[id][d.id.name] = d;
      }
    } else if (isFunction(node)) {
      var id = getScope(node.parent);
      if (node.id) locals[id][node.id.name] = node;
      var nid = node.params.length && getScope(node);
      if (nid && !locals[nid]) locals[nid] = {};
      for (var i = 0; i < node.params.length; i++) {
        var p = node.params[i];
        locals[nid][p.name] = p;
      }
    }
  });

  walk(src, function(node) {
    if (node.type === 'Identifier' && lookup(node) === undefined) {

      if (node.parent.type === 'Property' && node.parent.key === node) return;
      if (node.parent.type === 'MemberExpression' && node.parent.property === node) return;
      if (isFunction(node.parent)) return;
      if (node.parent.type === 'LabeledStatement') return;
      if (node.parent.type === 'ContinueStatement') return;
      if (node.parent.type === 'BreakStatement') return;

      if (node.parent.type === 'AssignmentExpression') {
        var isLeft0 = node.parent.left.type === 'MemberExpression' && node.parent.left.object === node.name;
        var isLeft1 = node.parent.left.type === 'Identifier' && node.parent.left.name === node.name;
        if (isLeft0 || isLeft1) {
          exported[node.name] = keyOf(node).length;
        }
      }
      if (!exported[node.name] || exported[node.name] < keyOf(node).length) {
        // ignore try catch response vars
        if (node.parent.type === 'CatchClause') return;
        implicit[node.name] = keyOf(node).length;
      }
    }
  });

  var localScopes = {};
  var lexVars = {};
  var lks = objectKeys(locals);
  for (var i = 0; i < lks.length; i++) {
    var key = lks[i];
    localScopes[key] = objectKeys(locals[key]);
    lexVars[key] = locals[key];
  }

  return {
    locals: localScopes,
    lexvars: lexVars,
    globals: {
      implicit: objectKeys(implicit),
      exported: objectKeys(exported)
    }
  };

  function lookup(node) {
    for (var p = node; p; p = p.parent) {
      if (isFunction(p) || p.type === 'Program') {
        var id = getScope(p);
        if (locals[id][node.name]) {
          return id;
        }
      }
    }
    return undefined;
  }

  function getScope(node) {
    for (
      var p = node; !isFunction(p) && p.type !== 'Program'; p = p.parent
    );
    var id = idOf(p);
    if (!locals[id]) locals[id] = {};
    return id;
  }

};

/**
 * [isFunction description]
 * @param  {[type]}  x [description]
 * @return {Boolean}   [description]
 */

function isFunction(x) {
  return x.type === 'FunctionDeclaration' || x.type === 'FunctionExpression';
}

/**
 * [idOf description]
 * @param  {[type]} node [description]
 * @return {[type]}      [description]
 */

function idOf(node) {
  var id = [];
  for (var n = node; n.type !== 'Program'; n = n.parent) {
    var key = keyOf(n).join('.');
    id.unshift(key);
  }
  return id.join('.');
}

/**
 * [keyOf description]
 * @param  {[type]} node [description]
 * @return {[type]}      [description]
 */

function keyOf(node) {
  if (node.lexicalScopeKey) return node.lexicalScopeKey;
  var p = node.parent;
  var ks = objectKeys(p);
  var kv = {
    keys: [],
    values: [],
    top: []
  };

  for (var i = 0; i < ks.length; i++) {
    var key = ks[i];
    kv.keys.push(key);
    kv.values.push(p[key]);
    kv.top.push(undefined);

    if (isArray(p[key])) {
      var keys = objectKeys(p[key]);
      kv.keys.push.apply(kv.keys, keys);
      kv.values.push.apply(kv.values, p[key]);

      var nkeys = [];
      for (var j = 0; j < keys.length; j++) nkeys.push(key);
      kv.top.push.apply(kv.top, nkeys);
    }
  }
  var ix = indexOf(kv.values, node);
  var res = [];
  if (kv.top[ix]) res.push(kv.top[ix]);
  if (kv.keys[ix]) res.push(kv.keys[ix]);
  if (node.parent.type === 'CallExpression') {
    res.unshift.apply(res, keyOf(node.parent.parent));
  }
  return node.lexicalScopeKey = res;
}