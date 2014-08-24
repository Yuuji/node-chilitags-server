var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Chilitags = require('node-chilitags');

var xRes = 1280;
var yRes = 720;

var chilitags = new Chilitags.Chilitags(xRes, yRes);

var chilitagsData = false;

var detect = function() {
    var data = chilitags.detect();
    data.imageBuffer = new Buffer(data.image, 'base64');
    data.tags.length = Object.keys(data.tags).length;
    data.tags = Array.prototype.slice.call(data.tags, 0);
    chilitagsData = data;
    io.to('tags').emit('tags', {
        processingTime: chilitagsData.processingTime,
        tags: chilitagsData.tags
    });
    io.to('image').emit('image', data.image);
    setTimeout(detect, 500);
};

app.get('/image.png', function(req, res){
    if (chilitagsData && chilitagsData.imageBuffer) {
        res.set('Content-Type', 'image/png');
        res.send(chilitagsData.imageBuffer);
    } else {
        res.status(404).end();
    }
});

io.on('connection', function(socket){
    socket.emit('settings', {
        xRes: xRes,
        yRes: yRes
    });

    socket.on('join', function(room) {
        socket.join(room);
    });
});

http.listen(4000, function(){
    console.log('listening on *:4000');
    detect();
});
