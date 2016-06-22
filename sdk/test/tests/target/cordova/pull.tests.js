// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file unit tests for the 'pull' module
 * 
 * The pull module has minimal unit tests and relies more on functional tests for validation
 */

var Platform = require('Platforms/Platform'),
    Query = require('query.js').Query,
    createPullManager = require('../../../../src/sync/pull').createPullManager,
    tableConstants = require('../../../../src/constants').table,
    MobileServiceClient = require('../../../../src/MobileServiceClient'),
    storeTestHelper = require('./storeTestHelper'),
    runner = require('../../../../src/Utilities/taskRunner'),
    createOperationTableManager = require('../../../../src/sync/operations').createOperationTableManager,
    MobileServiceSqliteStore = require('Platforms/MobileServiceSqliteStore'),
    defaultPageSize = 50,
    store,
    client;
    
$testGroup('pull tests')

    // Clear the store before running each test.
    .beforeEachAsync(function() {
        return storeTestHelper.createEmptyStore().then(function(emptyStore) {
            store = emptyStore;
            client = new MobileServiceClient('http://someurl');
            return client.getSyncContext().initialize(store);
        });
    }).tests(

    $test('Valid pull settings, valid custom page size')
    .checkAsync(function () {
        return pullAndValidate({pageSize: 4321}, 4321);
    }),

    $test('Valid pull settings, undefined custom page size')
    .checkAsync(function () {
        return pullAndValidate({}, defaultPageSize);
    }),

    $test('Valid pull settings, null custom page size')
    .checkAsync(function () {
        return pullAndValidate({pageSize: null}, defaultPageSize);
    }),

    $test('Valid pull settings, Invalid custom page size - Zero')
    .checkAsync(function () {
        return pullAndValidate({pageSize: 0}, 'error');
    }),

    $test('Valid pull settings, Invalid custom page size - Negative integer')
    .checkAsync(function () {
        return pullAndValidate({pageSize: -1}, 'error');
    }),

    $test('Valid pull settings, Invalid custom page size - Float')
    .checkAsync(function () {
        return pullAndValidate({pageSize: 1.2}, 'error');
    }),

    $test('Valid pull settings, Invalid custom page size - String')
    .checkAsync(function () {
        return pullAndValidate({pageSize: '1'}, 'error');
    }),

    $test('Valid pull settings, Invalid custom page size - Object')
    .checkAsync(function () {
        return pullAndValidate({pageSize: {}}, 'error');
    }),

    $test('Invalid pull settings - string')
    .checkAsync(function () {
        return pullAndValidate('abc', 'error');
    }),

    $test('Invalid pull settings - number')
    .checkAsync(function () {
        return pullAndValidate(2, 'error');
    }),

    $test('Invalid pull settings - undefined')
    .checkAsync(function () {
        return pullAndValidate(undefined, defaultPageSize);
    }),

    $test('Invalid pull settings - null')
    .checkAsync(function () {
        return pullAndValidate(null, defaultPageSize);
    })
);

function pullAndValidate(settings, expectedPageSize) {
    client = client.withFilter( function(req, next, callback) {
        $assert.areEqual(req.url, "http://someurl/tables/sometable?$filter=(updatedAt ge datetimeoffset'1969-12-31T08:00:00.000Z')&$orderby=updatedAt&$top=" + 
                        expectedPageSize + "&__includeDeleted=true");
        callback('someerror', 'response');
    });

    var pullManager = createPullManager(client, store, runner(), createOperationTableManager(store));
    return pullManager.pull(new Query(storeTestHelper.testTableName), 'queryId', settings).then(function() {
        $assert.fail('failure expected');
    }, function(error) {
        if (expectedPageSize === 'error') {
            // NOP
        } else {
            $assert.areEqual(error.message, 'someerror');
        }
    });
}
