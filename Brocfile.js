var Funnel = require('broccoli-funnel');
var less = require('broccoli-less-single');
var mergeTrees = require('broccoli-merge-trees');

var styles = less('assets', 'style/style.less', 'style/style.css');
var assets = new Funnel('assets');
module.exports = mergeTrees([assets, styles]);
