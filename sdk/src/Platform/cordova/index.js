// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * Defines Cordova implementation of target independent APIs.
 * For now, the browser implementation works as-is for Cordova, so we 
 * just reuse the browser definitions.
 */

var browserExports = require('../web');

// Add each export individually to module.exports instead of 
// simply returning browserExports to work around a limitation / bug
// in browserify's cyclic dependency handling 
for (var i in browserExports) {
    exports[i] = browserExports[i];
}

exports.sdkExports = require('./sdkExports');
