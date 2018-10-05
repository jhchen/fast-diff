var _ = require('lodash');
var googlediff = require('googlediff');
var seedrandom = require('seedrandom');
var diff = require('./diff.js');

googlediff = new googlediff();

var ITERATIONS = 1000;
var ALPHABET = 'GATTACA';
var LENGTH = 100;

var seed = Math.floor(Math.random() * 10000);
var random = seedrandom(seed);

console.log('Running computing ' + ITERATIONS + ' diffs with seed ' + seed + '...');

console.log('Generating strings...');
var strings = [];
for(var i = 0; i <= ITERATIONS; ++i) {
  var chars = [];
  for(var l = 0; l < LENGTH; ++l) {
    var letter = ALPHABET.substr(Math.floor(random() * ALPHABET.length), 1);
    chars.push(letter);
  }
  strings.push(chars.join(''));
}

console.log('Running tests *without* cursor information...');
for(var i = 0; i < ITERATIONS; ++i) {
  var result = diff(strings[i], strings[i+1]);
  var expected = googlediff.diff_main(strings[i], strings[i+1]);
  if (!_.isEqual(result, expected)) {
    console.log('Expected', expected);
    console.log('Result', result);
    throw new Error('Diff produced difference results.');
  }
}

console.log('Running tests *with* cursor information');
for(var i = 0; i < ITERATIONS; ++i) {
  var cursor_pos = Math.floor(random() * strings[i].length + 1);
  var diffs = diff(strings[i], strings[i+1], cursor_pos);
  var patch = googlediff.patch_make(strings[i], strings[i+1], diffs);
  var expected = googlediff.patch_apply(patch, strings[i])[0];
  if (expected !== strings[i+1]) {
    console.log('Expected', expected);
    console.log('Result', strings[i+1]);
    throw new Error('Diff produced difference results.');
  }
}

function parseDiff(str) {
  if (!str) {
    return [];
  }
  return str.split(/(?=[+\-=])/).map(function (piece) {
    var symbol = piece.charAt(0);
    var text = piece.slice(1);
    return [
      symbol === '+' ? diff.INSERT : symbol === '-' ? diff.DELETE : diff.EQUAL,
      text
    ]
  });
}

console.log('Running cursor tests');
[
  ['', 0, '', null, ''],

  ['', 0, 'a', null, '+a'],
  ['a', 0, 'aa', null, '+a=a'],
  ['a', 1, 'aa', null, '=a+a'],
  ['aa', 0, 'aaa', null, '+a=aa'],
  ['aa', 1, 'aaa', null, '=a+a=a'],
  ['aa', 2, 'aaa', null, '=aa+a'],
  ['aaa', 0, 'aaaa', null, '+a=aaa'],
  ['aaa', 1, 'aaaa', null, '=a+a=aa'],
  ['aaa', 2, 'aaaa', null, '=aa+a=a'],
  ['aaa', 3, 'aaaa', null, '=aaa+a'],

  ['a', 0, '', null, '-a'],
  ['a', 1, '', null, '-a'],
  ['aa', 0, 'a', null, '-a=a'],
  ['aa', 1, 'a', null, '-a=a'],
  ['aa', 2, 'a', null, '=a-a'],
  ['aaa', 0, 'aa', null, '-a=aa'],
  ['aaa', 1, 'aa', null, '-a=aa'],
  ['aaa', 2, 'aa', null, '=a-a=a'],
  ['aaa', 3, 'aa', null, '=aa-a'],

  ['', 0, '', 0, ''],

  ['', 0, 'a', 1, '+a'],
  ['a', 0, 'aa', 1, '+a=a'],
  ['a', 1, 'aa', 2, '=a+a'],
  ['aa', 0, 'aaa', 1, '+a=aa'],
  ['aa', 1, 'aaa', 2, '=a+a=a'],
  ['aa', 2, 'aaa', 3, '=aa+a'],
  ['aaa', 0, 'aaaa', 1, '+a=aaa'],
  ['aaa', 1, 'aaaa', 2, '=a+a=aa'],
  ['aaa', 2, 'aaaa', 3, '=aa+a=a'],
  ['aaa', 3, 'aaaa', 4, '=aaa+a'],

  ['a', 1, '', 0, '-a'],
  ['aa', 1, 'a', 0, '-a=a'],
  ['aa', 2, 'a', 1, '=a-a'],
  ['aaa', 1, 'aa', 0, '-a=aa'],
  ['aaa', 2, 'aa', 1, '=a-a=a'],
  ['aaa', 3, 'aa', 2, '=aa-a'],

  ['a', 1, '', 0, '-a'],
  ['aa', 1, 'a', 0, '-a=a'],
  ['aa', 2, 'a', 1, '=a-a'],
  ['aaa', 1, 'aa', 0, '-a=aa'],
  ['aaa', 2, 'aa', 1, '=a-a=a'],
  ['aaa', 3, 'aa', 2, '=aa-a'],

  // forward-delete
  ['a', 0, '', 0, '-a'],
  ['aa', 0, 'a', 0, '-a=a'],
  ['aa', 1, 'a', 1, '=a-a'],
  ['aaa', 0, 'aa', 0, '-a=aa'],
  ['aaa', 1, 'aa', 1, '=a-a=a'],
  ['aaa', 2, 'aa', 2, '=aa-a'],

  ['bob', 0, 'bobob', null, '+bo=bob'],
  ['bob', 1, 'bobob', null, '=b+ob=ob'],
  ['bob', 2, 'bobob', null, '=bo+bo=b'],
  ['bob', 3, 'bobob', null, '=bob+ob'],
  ['bob', 0, 'bobob', 2, '+bo=bob'],
  ['bob', 1, 'bobob', 3, '=b+ob=ob'],
  ['bob', 2, 'bobob', 4, '=bo+bo=b'],
  ['bob', 3, 'bobob', 5, '=bob+ob'],
  ['bobob', 2, 'bob', null, '-bo=bob'],
  ['bobob', 3, 'bob', null, '=b-ob=ob'],
  ['bobob', 4, 'bob', null, '=bo-bo=b'],
  ['bobob', 5, 'bob', null, '=bob-ob'],
  ['bobob', 2, 'bob', 0, '-bo=bob'],
  ['bobob', 3, 'bob', 1, '=b-ob=ob'],
  ['bobob', 4, 'bob', 2, '=bo-bo=b'],
  ['bobob', 5, 'bob', 3, '=bob-ob'],

  ['bob', 1, 'b', null, '=b-ob'],

  ['hello', [0, 5], 'h', 1, '-hello+h'],
  ['yay', [0, 3], 'y', 1, '-yay+y'],
  ['bobob', [1, 4], 'bob', 2, '=b-obo+o=b'],

].forEach(function (data) {
  var oldText = data[0];
  var newText = data[2];
  var oldSelection = typeof data[1] === 'number' ?
  { index: data[1], length: 0 } :
  { index: data[1][0], length: data[1][1] - data[1][0] };
  var newSelection = typeof data[3] === 'number' ?
    { index: data[3], length: 0 } :
    data[3] === null ? null : { index: data[3][0], length: data[3][1] - data[3][0] };
  var expected = parseDiff(data[4]);
  if (newSelection === null && typeof data[1] !== 'number') {
    throw new Error('invalid test case');
  }
  var selectionInfo = newSelection === null ? data[1] : {
    oldSelection: oldSelection,
    newSelection: newSelection,
  };
  doCursorTest(oldText, newText, selectionInfo, expected);
  doCursorTest('x' + oldText, 'x' + newText, shiftSelectionInfo(selectionInfo, 1), diffPrepend(expected, 'x'));
  doCursorTest(oldText + 'x', newText + 'x', selectionInfo, diffAppend(expected, 'x'));
});

function diffPrepend(tuples, text) {
  if (tuples.length > 0 && tuples[0][0] === diff.EQUAL) {
    return [[diff.EQUAL, text + tuples[0][1]]].concat(tuples.slice(1));
  } else {
    return [[diff.EQUAL, text]].concat(tuples);
  }
}

function diffAppend(tuples, text) {
  var lastTuple = tuples[tuples.length - 1];
  if (lastTuple && lastTuple[0] === diff.EQUAL) {
    return tuples.slice(0, -1).concat([[diff.EQUAL, lastTuple[1] + text]]);
  } else {
    return tuples.concat([[diff.EQUAL, text]]);
  }
}

function shiftSelectionInfo(selectionInfo, amount) {
  if (typeof selectionInfo === 'number') {
    return selectionInfo + amount;
  } else {
    return {
      oldSelection: {
        index: selectionInfo.oldSelection.index + amount,
        length: selectionInfo.oldSelection.length,
      },
      newSelection: {
        index: selectionInfo.newSelection.index + amount,
        length: selectionInfo.newSelection.length,
      },
    }
  }
}

function doCursorTest(oldText, newText, selectionInfo, expected) {
  var result = diff(oldText, newText, selectionInfo);
  if (!_.isEqual(result, expected)) {
    console.log([oldText, newText, selectionInfo]);
    console.log(result, '!==', expected);
    throw new Error('cursor test failed');
  }
}

console.log('Running emoji tests');
(function() {
  var result = diff('🐶', '🐯');
  var expected = parseDiff('-🐶+🐯');
  if (!_.isEqual(result, expected)) {
    console.log(result, '!==', expected);
    throw new Error('Emoji simple case test failed');
  }
})();

(function() {
  var result = diff('👨🏽', '👩🏽');
  var expected = parseDiff('-👨+👩=🏽');
  if (!_.isEqual(result, expected)) {
    console.log(result, '!==', expected);
    throw new Error('Emoji before case test failed');
  }
})();

(function() {
  var result = diff('👩🏼', '👩🏽');
  var expected = parseDiff('=👩-🏼+🏽');
  if (!_.isEqual(result, expected)) {
    console.log(result, '!==', expected);
    throw new Error('Emoji after case test failed');
  }
})();

console.log("Success!");
