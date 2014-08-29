var Promise = require('bluebird');
var request = require('superagent');

exports.getPage = function (url) {
  return new Promise(function (resolve, reject) {
    request.get(url)
    .end(function (res) {
      if (! res.ok) return reject(res.error);

      resolve(res);
    });
  });
}

