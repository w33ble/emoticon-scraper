var chalk = require('chalk');

exports.countIn = function (count, name) {
  console.log(chalk.cyan('Found ' + chalk.magenta(count) + ' emoticons in ' + chalk.green(name)));
};

exports.summary = function (label, text) {
  console.log(chalk.black.bgYellow(' ' + label + ' '), chalk.gray(text));
};
