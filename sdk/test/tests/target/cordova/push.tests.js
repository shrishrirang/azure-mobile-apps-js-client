// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file unit tests for the 'push' module
 * 
 * The push module has minimal unit tests and relies more on functional tests for validation
 */

var Platform = require('Platforms/Platform'),
    Query = require('azure-query-js').Query,
    createPushManager = require('../../../../src/sync/push').createPushManager,
    tableConstants = require('../../../../src/constants').table,
    MobileServiceClient = require('../../../../src/MobileServiceClient'),
    storeTestHelper = require('./storeTestHelper'),
    runner = require('../../../../src/Utilities/taskRunner'),
    createOperationTableManager = require('../../../../src/sync/operations').createOperationTableManager,
    MobileServiceSqliteStore = require('Platforms/MobileServiceSqliteStore'),
    store,
    filter,
    client;
    
$testGroup('push tests')

    // Clear the store before running each test.
    .beforeEachAsync(function() {
        return storeTestHelper.createEmptyStore().then(function(emptyStore) {
            store = emptyStore;
            client = new MobileServiceClient('http://someurl');
            filter = undefined;
            client = client.withFilter(function(req, next, callback) {
                if (filter) {
                    filter(req, next, callback);
                }
            });

            return store.defineTable({
                name: storeTestHelper.testTableName,
                columnDefinitions: {
                    id: 'string',
                    price: 'int'
                }
            }).then(function() {
                return client.getSyncContext().initialize(store);
            });
        });
    }).tests(

    $test('Insert - verify X-ZUMO-FEATURES')
    .checkAsync(function () {
        var table = client.getSyncTable(storeTestHelper.testTableName);
        return table.insert({
            id: '1',
            price: 2
        }).then(function() {
            return pushAndValidateFeatures(false /* incremental sync */);
        });
    }),

    $test('Update - verify X-ZUMO-FEATURES')
    .checkAsync(function () {
        var table = client.getSyncTable(storeTestHelper.testTableName);
        return store.upsert(storeTestHelper.testTableName, {
            id: '1',
            price: 2
        }).then(function() {
            return table.update({
                id: '1',
                price: 2
            });
        }).then(function() {
            return pushAndValidateFeatures(false /* incremental sync */);
        });
    }),

    $test('Delete - verify X-ZUMO-FEATURES')
    .checkAsync(function () {
        var table = client.getSyncTable(storeTestHelper.testTableName);
        return store.upsert(storeTestHelper.testTableName, {
            id: '1',
            price: 2
        }).then(function() {
            return table.del({
                id: '1',
                price: 2
            });
        }).then(function() {
            return pushAndValidateFeatures(false /* incremental sync */);
        });
    })
);

function pushAndValidateFeatures(incrementalSync) {
    var filterInvoked = false;
    var offlineFeatureAdded = false;
    filter = function(req, next, callback) {
        var features = req.headers['X-ZUMO-FEATURES'];
        offlineFeatureAdded = features && features.indexOf('OL') > -1;
        filterInvoked = true;
        callback('someerror');
    };

    return client.getSyncContext().push().then(function() {
        $assert.fail('failure expected');
    }, function(error) {
        $assert.isTrue(filterInvoked);
        $assert.isTrue(offlineFeatureAdded); // expect the offline feature to be added to the X-ZUMO-FEATURES header
    }).then(function() {
        filterInvoked = false;
        return client.getTable(storeTestHelper.testTableName).insert({id: '1'});
    }).then(function() {
        $assert.fail('failure expected');
    }, function(error) {
        $assert.isTrue(filterInvoked);
        $assert.isFalse(offlineFeatureAdded); // Don't expect the offline feature to be added this time.
    });
}
