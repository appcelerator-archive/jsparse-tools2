
/**
 * utils.js
 *
 * utility helper functions
 *
 */

// expose module

var util = module.exports = {};

//

util.isArray = Array.isArray || function isArray(xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

//

util.objectKeys = Object.keys || function objectKeys(obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};

/**
 * [indexOf description]
 * @param  {[type]} xs [description]
 * @param  {[type]} x  [description]
 * @return {[type]}    [description]
 */

util.indexOf = function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}