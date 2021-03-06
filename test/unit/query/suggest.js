
var generate = require('../../../query/suggest');
var queryMixer = require('../../../helper/queryMixer');

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('valid interface', function(t) {
    t.equal(typeof generate, 'function', 'valid function');
    t.end();
  });
};

module.exports.tests.query = function(test, common) {
  test('valid query', function(t) {
    var query = generate({
      input: 'test', size: 10,
      lat: 0, lon: 0, zoom:1,
      layers: ['test']
    });
    var expected = {
      text: 'test',
      0: {
        completion: {
          field: 'suggest',
          size: 10,
          context: {
            dataset: [ 'test' ],
            location: {
              precision: 1,
              value: [ 0, 0 ]
            }
          },
          fuzzy: { fuzziness: 0 },
        }
      }
    };
    t.deepEqual(query, expected, 'valid suggest query');
    t.end();
  });

  test('valid query without lat/lon', function(t) {
    var query = generate({
      input: 'test', size: 10,
      layers: ['test']
    });
    var expected = {
      text: 'test',
      0: {
        completion: {
          field: 'suggest',
          size: 10,
          context: {
            dataset: [ 'test' ],
            location: {
              precision: 1,
              value: null
            }
          },
          fuzzy: { fuzziness: 0 },
        }
      }
    };
    t.deepEqual(query, expected, 'valid suggest query');
    t.end();
  });
};

module.exports.tests.precision = function(test, common) {
  var test_cases = [
    {zoom:1, precision:1},
    {zoom:2, precision:1},
    {zoom:3, precision:1},
    {zoom:4, precision:2},
    {zoom:5, precision:2},
    {zoom:6, precision:3},
    {zoom:7, precision:3},
    {zoom:8, precision:3},
    {zoom:9, precision:3},
    {zoom:10, precision:4},
    {zoom:11, precision:4},
    {zoom:12, precision:4},
    {zoom:13, precision:4},
    {zoom:14, precision:4},
    {zoom:15, precision:4},
    {zoom:16, precision:5},
    {zoom:17, precision:5},
    {zoom:18, precision:5},
    {zoom:19, precision:5},
    {zoom:'', precision:1},
    {zoom:null, precision:1},
    {zoom:undefined, precision:1}
  ];
  test('valid precision', function(t) {
    test_cases.forEach( function( test_case ){
      var query = generate({
        input: 'test', size: 10,
        lat: 0, lon: 0, zoom:test_case.zoom,
        layers: ['test']
      });
      var expected = {
        text: 'test',
        0: {
          completion: {
            field: 'suggest',
            size: 10,
            context: {
              dataset: [ 'test' ],
              location: {
                precision: test_case.precision,
                value: [ 0, 0 ]
              }
            },
            fuzzy: { fuzziness: 0 },
          }
        }
      };
      t.deepEqual(query, expected, 'valid suggest query for zoom = ' + test_case.zoom);
    });
    t.end();
  });
};

module.exports.tests.fuzziness = function(test, common) {
  var test_cases = [0,1,2,'AUTO', undefined, null, ''];
  test('valid fuzziness', function(t) {
    test_cases.forEach( function( test_case ){
      var query = generate({
        input: 'test', size: 10,
        lat: 0, lon: 0, zoom:0,
        layers: ['test']
      }, undefined, test_case);
      var expected = {
        text: 'test',
        0: {
          completion: {
            field: 'suggest',
            size: 10,
            context: {
              dataset: [ 'test' ],
              location: {
                precision: 1,
                value: [ 0, 0 ]
              }
            },
            fuzzy: { fuzziness: test_case || 0 },
          }
        }
      };
      t.deepEqual(query, expected, 'valid suggest query for fuziness = ' + test_case);
    });
    t.end();
  });
};

module.exports.tests.queryMixer = function(test, common) {
  test('valid query mixer', function(t) {
    for (var suggester in queryMixer) {
      var queryMix = queryMixer[suggester];

      var number_of_suggesters = queryMix.reduce(function(sum, query) { 
        return sum + (query.precision.length || 1); 
      }, 0); 

      var query = generate({
        input: 'test', size: 10,
        lat: 0, lon: 0, zoom:0
      }, queryMix);

      // adding one to number_of_suggesters to account for the key "text" in query.
      t.deepEqual(Object.keys(query).length, number_of_suggesters + 1, 
        suggester + ' has correct number of suggesters'
      );
    }
    
    t.end();
  });
};

var isValidLayer = function(t, query, layers) {
  for(var qKey in query) {
    var q = query[qKey];
    if (q.completion) {
      var query_layers = q.completion.context.dataset;
      t.deepEqual(query_layers, layers, layers + ' layers set correctly');  
    }  
  }
};

module.exports.tests.layers = function(test, common) {
  test('valid layers with query-mixers', function(t) {
    for (var suggester in queryMixer) {
      var queryMix = queryMixer[suggester];
      var layers= ['geoname', 'osm'];
      var query = generate({
        input: 'test', size: 10,
        lat: 0, lon: 0, zoom:0,
        layers: layers
      }, queryMix);

      isValidLayer(t, query, layers);
    }
    
    t.end();
  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('suggest query ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};