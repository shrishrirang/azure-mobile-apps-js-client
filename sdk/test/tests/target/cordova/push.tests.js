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
    MobileServiceSqliteStore = require('Platforms/MobileServiceSqliteStore');

var operationTableName = tableConstants.operationTableName,
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
                    price: 'int',
                    version: 'string'
                }
            }).then(function() {
                return client.getSyncContext().initialize(store);
            });
        });
    }).tests(

    $test('Local insert - verify X-ZUMO-FEATURES')
    .checkAsync(function () {
        var table = client.getSyncTable(storeTestHelper.testTableName);
        return table.insert({
            id: '1',
            price: 2
        }).then(function() {
            return pushAndValidateFeatures(false /* incremental sync */);
        });
    }),

    $test('Local update - verify X-ZUMO-FEATURES')
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

    $test('Local delete - verify X-ZUMO-FEATURES')
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
    }),

    $test('Verify push uses correct version - insert')
    .checkAsync(function () {
        return pushAndValidateIfMatch('insert');
    }),

    $test('Verify push uses correct version - update')
    .checkAsync(function () {
        return pushAndValidateIfMatch('update');
    }),

    $test('Verify push uses correct version - delete')
    .checkAsync(function () {
        return pushAndValidateIfMatch('delete');
    })
);

function pushAndValidateFeatures() {
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

function pushAndValidateIfMatch(action) {

    var logOperation = {
        tableName: operationTableName,
        action: 'upsert',
        data: {
            id: 1,
            tableName: storeTestHelper.testTableName,
            action: action,
            itemId: '1'
        }
    };

    var batch = [];
    // If action is insert / update, add a record to the local table, but
    // skip adding metadata to the log record be sure that push uses the metadata/version from the sync table record.
    // For delete, simply add metadata to the log record.
    if (action === 'insert' || action === 'update') { 
        batch.push({
            tableName: storeTestHelper.testTableName,
            action: 'upsert',
            data: {
                id: '1',
                price: 2,
                version: 'testversion'
            }
        });
    } else { // action === 'delete'
        logOperation.data.metadata = {version: 'testversion'};
    }

    batch.push(logOperation);

    return store.executeBatch(batch).then(function() {
        return pushAndValidateHeader(action);
    });
}

function pushAndValidateHeader(action) {
    var filterInvoked = false;
    filter = function(req, next, callback) {

        // Verify the If-Match header
        var expectedHeader;
        if (action !== 'insert') {
            expectedHeader = '"testversion"';
        }
        $assert.areEqual(req.headers['If-Match'], expectedHeader);

        filterInvoked = true;
        callback('someerror');
    };

    return client.getSyncContext().push().then(function() {
        $assert.fail('failure expected');
    }, function(error) {
        $assert.isTrue(filterInvoked);
    });
}
