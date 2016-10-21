var app = require('./app');
app.listen(3000 || process.env.PORT, function(){
  console.log('listening on %s', JSON.stringify(this.address()));
});
