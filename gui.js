var express = require('express');

function broc(){
    var Broccoli = require('broccoli');
    var BroccoliWatcher = require('broccoli/lib/watcher');
    var BroccoliMiddleware = require('broccoli/lib/middleware');
    var brocTree = Broccoli.loadBrocfile();
    var brocBuilder = new Broccoli.Builder(brocTree);
    var brocWatcher = new BroccoliWatcher(brocBuilder);
    var brocAssets = new BroccoliMiddleware(brocWatcher);
    return brocAssets;
}

var app = express()
.use(broc())
.use('/ng', function(req, res){
    // res.render('index');
    res.sendFile(__dirname + '/views/index.html');
})
.use('/', require('./app'))
.listen(process.env.PORT || 3000, function(){
    console.log('listening on %d', this.address().port);
});
