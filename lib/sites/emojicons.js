var urlResolve = require('url').resolve;
var Promise = require('bluebird');
var cheerio = require('cheerio');
var _ = require('lodash');

var lib = require('requirefrom')('lib');
lib('db');
var db = require('lowdb');
var scraper = lib('scraper');
var reporter = lib('reporter');

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
  var chain = Promise.resolve();

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

        pages.map(function(page) {
          chain = chain.then(function () {
            return getEmotes(page);
          });
          return chain;
        });
      }
    }

    // extract emotes
    chain = chain.then(function () {
      reporter.countIn(items.length, url);

      var emotes = items.map(function (i, item) {
        var string = $('.listing textarea', $(item)).text();
        var tags = $('.tags a', $(item)).map(function (i, tag) {
          return $(tag).text();
        }).get();

        tags = processTags(tags);

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
      return urlResolve(url, $(link).attr('href'));
    }

    return false;
  }).get();

  return _.compact(pages);
}


exports.fetch = function() {
  var stack = [];
  paths = paths.map(function (path) {
    return urlResolve(url, path);
  }).forEach(function (url, i) {
    stack.push(getEmotes(url));
  });

  return Promise.all(stack)
  .then(function() {
    return emoticons;
  });
};

exports.url = url;