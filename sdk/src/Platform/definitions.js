// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

// Module to hold custom definitions of properties, methods, etc used by this library
// By default, it defines nothing. Users of this library can add custom definitions.

var defs;

function set(definitions) {
    defs = definitions;
}

function get() {
    return defs;
}

module.exports = {
    set: set,
    get: get
};
