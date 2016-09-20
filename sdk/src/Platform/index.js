// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var target = require('./environment').getTarget();

if (environment.getTarget() === 'Cordova') {
    module.exports = require('./cordova');
} else if (environment.getTarget() === 'Web') {
    module.exports = require('./web');
} else {
    throw new Error('Unsupported target');
}
