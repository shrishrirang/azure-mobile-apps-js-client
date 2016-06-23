// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file MobileServiceSyncTable unit tests
 */

var Platform = require('Platforms/Platform'),
    Query = require('query.js').Query,
    operations = require('../../../../src/sync/operations'),
    MobileServiceClient = require('../../../../src/MobileServiceClient'),
    tableConstants = require('../../../../src/constants').table,
    MobileServiceSyncContext = require('../../../../src/sync/MobileServiceSyncContext'),
    storeTestHelper = require('./storeTestHelper'),
    MobileServiceSqliteStore = require('Platforms/MobileServiceSqliteStore');
    
var store,
    table,
    client;

$testGroup('MobileServiceSyncTable tests')

    // Clear the local store before running each test.
    .beforeEachAsync(function() {
        return storeTestHelper.createEmptyStore().then(function(emptyStore) {
            store = emptyStore;
        }).then(function() {
            return store.defineTable({
                name: storeTestHelper.testTableName,
                columnDefinitions: {
                    id: 'string',
                    text: 'string'
                }
            });
        }).then(function() {
            client = new MobileServiceClient('someurl');
            return client.getSyncContext().initialize(store);
        }).then(function() {
            table = client.getSyncTable(storeTestHelper.testTableName);
        });
    }).tests(
        
    $test('table.where operator')
    .checkAsync(function () {
        var record1 = { id: '1', text: 'abc' },
            record2 = { id: '2', text: 'def' },
            record3 = { id: '3', text: 'def' },
            record4 = { id: '4', text: 'abc' };
            
        return store.upsert(storeTestHelper.testTableName, [record1, record2, record3, record4]).then(function() {
            return table
                    .where({text: 'abc'})
                    .orderByDescending('id')
                    .read();
        }).then(function(result) {
            $assert.isNotNull(result);
            $assert.areEqual(result.length, 2);
            $assert.areEqual(result[0], record4);
            $assert.areEqual(result[1], record1);
        });
    }),
    
    $test('table.read')
    .checkAsync(function () {
        var record1 = { id: '1', text: 'abc' },
            record2 = { id: '2', text: 'def' },
            record3 = { id: '3', text: 'def' },
            record4 = { id: '4', text: 'abc' };
            
        return store.upsert(storeTestHelper.testTableName, [record1, record2, record3, record4]).then(function() {
            return table.read(new Query(storeTestHelper.testTableName).orderBy('id'));
        }).then(function(result) {
            $assert.isNotNull(result);
            $assert.areEqual(result.length, 4);
            $assert.areEqual(result[0], record1);
            $assert.areEqual(result[1], record2);
            $assert.areEqual(result[2], record3);
            $assert.areEqual(result[3], record4);
        });
    }),
    
    $test('table.pull')
    .description('Tests that the pull API simply calls MobileServiceSyncContext.pull() and returns whatever it returns')
    .check(function () {

        // The pull params defined below have invalid values, but that does not matter
        // as all we want to test is that pull acts as a passthrough function.
        var query = 'query',
            queryId = 'queryId',
            settings = 'settings',
            result = 'result';

        client.getSyncContext().pull = function(queryParam, queryIdParam, settingsParam, more) {
            $assert.areEqual(queryParam, query);
            $assert.areEqual(queryIdParam, queryId);
            $assert.areEqual(settingsParam, settings);
            $assert.isNull(more);
            return result;
        };

        $assert.areEqual(table.pull(query, queryId, settings, 'fourth_param_just_in_case_pull_starts_taking_more_params_in_the_future'), result);
    })
);