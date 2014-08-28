var format = require('util').format;
var urlResolve = require('url').resolve;
var Promise = require('bluebird');
var request = require('superagent');
var cheerio = require('cheerio');
var chalk = require('chalk');
var _ = require('lodash');

var url = "http://hexascii.com/japanese-emoticons/";

// collect all available types
function getCategories() {
  return new Promise(function (resolve, reject) {
    request.get(url)
    .end(function (res) {
      if (!res.ok) return reject(res.error);

      var $ = cheerio.load(res.text);
      var links = $('a.info-link');

      var categories = _.map(links, function (link, i) {
        $link = $(link);
        var href = urlResolve(url, $link.attr('href'));
        var title = $('h2', $link).html();
        title = title.replace(/emoticons/i, '').trim().toLowerCase();
        return { title: title, href: href };
      });

      resolve(categories);
    });
  });
}

function getEmoticons(urls) {
  var emotes = [];
  var lastRequest = Promise.resolve();

  _.each(urls, function (url, i) {
    if (! /hiding/.test(url.href)) {
      return;
    }

    lastRequest = lastRequest.then(function () {
      return new Promise(function (resolve, reject) {
        request.get(url.href)
        .end(function(res) {
          if (!res.ok) return reject(res.error);


          var $ = cheerio.load(res.text);
          var cells = $('table td');

          console.log(chalk.cyan('Found ' + chalk.magenta(cells.length) + ' emoticons in ' + chalk.green(url.href)));

          _.each(cells, function (cell) {
            var emote = {
              tags: [url.title]
            };

            var $cell = $(cell);
            var $span = $('span', $cell);
            if ($span.length) {
              emote.string = $span.text().trim();
            } else {
              emote.string = $cell.text().trim();
            }

            if (emote.string.length) {
              emotes.push(emote);
            }
          });

          resolve();
        });
      });
    });
  });

  lastRequest = lastRequest.then(function () {
    return emotes;
  });

  return lastRequest;
}

function fetch() {
  return getCategories()
  .then(getEmoticons)
}

exports.fetch = fetch;
exports.url = url;
