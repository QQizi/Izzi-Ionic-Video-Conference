/**
 * Created by quentinmangin on 18/01/2016.
 */

var io = require('socket.io')(3000);

var users = [];

/*SOCKET IO*/
io.on('connection', function (socket) {

    socket.on('init_user_media', function(data) {
        var user = {
            'pseudo' : data["pseudo"],
            'id'     : socket.id
        };
        users.push(user);

        io.sockets.emit("send_liste_users",{ users: users });
        socket.emit("send_user_id",{ socketID: socket.id });
    });

    socket.on('disconnect', function() {
        for(var i = 0; i < users.length ; i++){
            if(socket.id == users[i].id){
                users.splice(i, 1);
            }
        }

        io.sockets.emit("send_liste_users",{ users: users });
    });

    socket.on('make_call', function(data) {
        io.to(data["id"]).emit('get_call_event', {pseudo : data["pseudo"], id : socket.id});
    });

    socket.on('accept_call', function(data) {
        io.to(data["id"]).emit('accepted_call_event', {});
    });

    socket.on('end_call', function(data) {
        io.to(data["id"]).emit('end_call_event', {});
    });

    socket.on('set_remote_description', function(data) {
        io.to(data["id"]).emit('set_remote_description_event', { data: data["data"] });
    });

    socket.on('set_local_description', function(data) {
        io.to(data["id"]).emit('set_local_description_event', { data: data["data"] });
    });

    socket.on('add_remote_candidate', function(data) {
        io.to(data["id"]).emit('add_remote_candidate_event', { data: data["data"] });
    });

    socket.on('add_local_candidate', function(data) {
        io.to(data["id"]).emit('add_local_candidate_event', { data: data["data"] });
    });

});