// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

// Module to hold custom configuration provided by users of the library.

var configuration;

function set(config) {
    configuration = config;
}

function get() {
    return configuration;
}

module.exports = {
    set: set,
    get: get
};
