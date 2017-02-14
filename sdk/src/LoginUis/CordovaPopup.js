// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var config = require('../config');

var requiredCordovaVersion = { major: 3, minor: 0 };

exports.supportsCurrentRuntime = function () {
    /// <summary>
    /// Determines whether or not this login UI is usable in the current runtime.
    /// </summary>

    // When running application inside of Ripple emulator, InAppBrowser functionality is not supported.
    // We should use Browser popup login method instead.
    return !!currentCordovaVersion() && !isRunUnderRippleEmulator();
};

function isRunUnderRippleEmulator () {
    // Returns true when application runs under Ripple emulator 
    return window.parent && !!window.parent.ripple;
}

function currentCordovaVersion() {
    // If running inside Cordova, returns a string similar to "3.5.0". Otherwise, returns a falsey value.
    // Note: We can only detect Cordova after its deviceready event has fired, so don't call login until then.
    return window.cordova && window.cordova.version;
}

// Optional callback accepting (error, user) parameters.
exports.login = function (options, callback) {
    var configuration = config.get();
    if (configuration && configuration.login && configuration.login.loginWithOptions) {
        return configuration.login.loginWithOptions(options, callback);
    }

    callback(new Error('Cordova login implementation not provided!'));
};
