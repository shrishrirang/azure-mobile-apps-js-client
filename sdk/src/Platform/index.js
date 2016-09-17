// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

if (window && window.cordova && window.cordova.version) {
    return require('./cordova');
} else {
    return require('./web');
}
