/**
 * astwalk.js
 *
 * Walk the ast tree
 */

/**
 *  module dependencies
 */

var parse = require('acorn').parse
  , utils = require('./utils')
  , isArray = utils.isArray
  , objectKeys = utils.objectKeys
  , indexOf = utils.indexOf;

// expose module

module.exports = astWalk;

/**
 * [astWalk description]
 * @param  {[type]}   node   [description]
 * @param  {Function} fn     [description]
 * @param  {[type]}   parent [description]
 * @return {[type]}          [description]
 */

function astWalk(node, fn, parent) {

  var callback = fn || function(){};
  node = ('string' === typeof node)
    ? parse(node)
    : node;

  var keys = objectKeys(node);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key === 'parent') continue;

    var child = node[key];
    if (isArray(child)) {
      for (var j = 0; j < child.length; j++) {
        var c = child[j];
        if (c && typeof c.type === 'string') {
          c.parent = node;
          astWalk(c, callback, parent);
        }
      }
    } else if (child && typeof child.type === 'string') {
      child.parent = node;
      astWalk(child, callback, parent);
    }
  }
  callback(node);
}
