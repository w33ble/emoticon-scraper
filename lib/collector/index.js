var glob = require('glob');
var chalk = require('chalk');
var _ = require('lodash');
var db = require('lowdb');
var lib = require('requirefrom')('lib');

lib('db');

// var all = db('emoticons').where({ tags: ['random'] }).value();
// console.log(all, all.length);
// return;

glob.sync('./sites/*.js', { cwd: __dirname }).forEach(function (site) {
  var site = require(site);

  site.fetch()
  .then(function (emoticons) {
    console.log(chalk.black.bgYellow('Emoticons found:'), chalk.magenta(emoticons.length), chalk.green.underline(site.url));

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

      // console.log(emote);
    })
  });
})
