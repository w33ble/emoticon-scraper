var fs = require('fs');
var path = require('path');
var glob = require('glob');
var chalk = require('chalk');
var _ = require('lodash');
var db = require('lowdb');
var lib = require('requirefrom')('lib');

lib('db');
var reporter = lib('reporter');

// var all = db('emoticons').where({ tags: ['random'] }).value();
// console.log(all, all.length);
// return;

var site = process.argv[2];

if (! site) {
  console.log('You need to pass in a site name');
  return;
}

var sitePath = './' + path.relative(__dirname, path.join('lib', 'sites'));
if (site === 'sites') {
  console.log('Available Sites:');
  glob.sync(sitePath + '/*.js', { cwd: __dirname }).forEach(function (site) {
    var parts = site.split('/');
    site = parts[parts.length - 1];
    site = site.substr(0, site.length - 3);
    console.log('  ', site);
  });
}

var siteFile = './' + path.join(sitePath,  site);
console.log(siteFile);
if (! fs.existsSync(siteFile + '.js')) {
  console.log('So such site scraper exists:', site);
  console.log('Use `sites` for a list of available scrapers');
  return;
}

var scraper = require(siteFile);

scraper.fetch()
.then(function (emoticons) {
  reporter.summary('Emoticons found', [emoticons.length, 'from', site.url].join(' '));

  emoticons.forEach(function (emoticon) {
    var emote = db('emoticons', {string: emoticon.string});

    // record exists, append tag, if changed
    if (emote.length) {
      emote = emote[0];
      emote.tags = _.union(emote.tags, emoticon.tags);
      db('emoticons').update(emote.id, emote);
    } else {
      emote = db('emoticons', emoticon, +1);
    }
  });
});
