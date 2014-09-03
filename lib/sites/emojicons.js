var Promise = require('bluebird');
var cheerio = require('cheerio');
var _ = require('lodash');

var lib = require('requirefrom')('lib');
lib('db');
var db = require('lowdb');
var scraper = lib('scraper');

var url = "http://emojicons.com/";

var paths = [
  'table-flipping',
  'cute',
  'love',
  'rage',
  'animals',
  'funfunfunfun',
  'holidays',
  'meh',
  'sadface',
  'startups'
];

var tagMap = {
  kitten: 'cat',
  yay: 'happy',
  shrug: 'whatever',
  sadface: 'sad',
  happytime: 'happy',
  'table flipping': 'table flip',
  'fun fun fun fun': 'fun'
};

var tagList = db('tags').pluck('title').value();

var processQueue = Promise.resolve();
var emoticons = []; // emoticons to return

function processTags(tags) {
  tags = tags.map(function(tag) {
    if (tagMap[tag]) {
      return tagMap[tag];
    }

    var idx = tagList.indexOf(tag);
    if (idx !== -1) {
      return tagList[idx];
    }
    return false;
  });

  return _.compact(_.union(tags));
}

function getEmotes(url) {
  var chain;
  console.log('processing', url);

  return scraper.getPage(url)
  .then(function (res) {
    var $ = cheerio.load(res.text);
    var items = $('.emoticon-item');
    var pagination = $('.pagination');

    // if there are other pages, process them first
    if (pagination.length) {
      var currentPage = $('em', $(pagination)).text();

      if (currentPage <= 1) {
        var pages = getPages($, pagination);

        chain = Promise.map(pages, function(page) {
          return getEmotes(page);
        });
      } else {
        chain = Promise.resolve();
      }
    } else {
      chain = Promise.resolve();
    }

    // extract emotes
    chain.then(function () {
      var emotes = items.map(function (i, item) {
        var string = $('.listing textarea', $(item)).text();
        var tags = $('.tags a', $(item)).map(function (i, tag) {
          return $(tag).text();
        }).get();

        tags = processTags(tags);
        console.log(string, tags);

        if (! tags.length) {
          return false;
        }

        return {
          string: string,
          tags: tags
        };
      }).get();

      emoticons = emoticons.concat(_.compact(emotes));
    });

    return chain;
  });
}

function getPages($, pagination) {
  var pages = $('a', $(pagination)).map(function(i, link) {
    var text = $(link).text();

    if (parseInt(text, 10)) {
      return url + $(link).attr('href');
    }

    return false;
  }).get();

  return _.compact(pages);
}


exports.fetch = function() {
  var stack = [];
  paths = paths.map(function (path) {
    return url + path;
  }).forEach(function (url, i) {
    console.log('adding', url);

    if (i === 4) {
      stack.push(getEmotes(url));
      console.log('running', url);
    }
  });

  return Promise.all(stack)
  .then(function() {
    console.log(emoticons.length, 'emotes');
  });
};

exports.url = url;