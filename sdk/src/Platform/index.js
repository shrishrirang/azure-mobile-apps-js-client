// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------


if (window && window.cordova && window.cordova.version) {
    module.exports = require('./cordova');
} else {
    module.exports = require('./web');
}
