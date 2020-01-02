const Koa = require('koa');
const app =  new Koa();
const router =  require('koa-router')();
const static = require('koa-static');
const bodyParser = require('koa-bodyparser');
const IO = require('koa-socket');
const url = require('url');
const fs = require('fs');
const io = new IO({
    namespace: 'chat'
});
let roomInfo = {};
io.attach(app);



// 处理静态资源文件
app.use(static('./public'));

app.use(router.allowedMethods())




app._io.on('connection', socket => {
    
    console.log('建立连接了！')
    var roomId = url.parse(socket.request.url,true).query.roomId;
    var userName = url.parse(socket.request.url,true).query.userName;
    if (!roomInfo[roomId]) {
        roomInfo[roomId] = [];
    };
    roomInfo[roomId].push(userName);
    socket.join(roomId); //加入房间/加入分组

    socket.emit('serverEmit', {type: 'tip', userName: userName,data: '欢迎' + userName + '加入房间！'});
    socket.to(roomId).emit('serverEmit', {type: 'tip', userName: userName, data: '欢迎' + userName + '加入房间！'});
    // 获取客户端的连接数量
    var clients_in_the_room = socket.adapter.rooms[roomId]; 
    console.log(clients_in_the_room.sockets); // 该房间里面客户端连接的数量
    console.log(roomInfo);
   

    socket.on('message', data => {
        data.id = socket.id;
        data.time = new Date();
        socket.emit('serverEmit', data);
        socket.to(roomId).emit('serverEmit', data);
    });
    socket.on('disconnect', data => {
        socket.emit('serverEmit', {type: 'tip', userName: userName,data: userName + '离开了房间！'});
        socket.to(roomId).emit('serverEmit', {type: 'tip', userName: userName, data: userName + '离开了房间！'});
        roomInfo[roomId] = roomInfo[roomId].filter(item => item !== userName);
        console.log(roomInfo);
    });
});

router.get('/room', ctx  => {

    var roomId = ctx.request.query.roomID;

    // 渲染页面数据(见views/room.hbs)
    ctx.body = {
        roomID: roomId,
        users: roomInfo[roomId]
    };
});
app.use(router.routes())


app.listen(3000, () => {
    console.log('server runing in http://localhost:3000')
});
