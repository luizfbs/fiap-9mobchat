var communicator = (function () {
    var savedMessages = [];
    var messagesHtml = $('#messages');

    var to = "unknown";
    var from = "unknown";
    var localStorageKey = "messages" + "_" + from + '_' + to;

    var onSendMessage = function () {
        var message = $('#message').val();

        webSocket.sendMessage(message, 'text', to, from);
        $('#message').val('');
    };

    var onGetPhotoSuccess = function (imageData) {
        webSocket.sendMessage(imageData, 'image64', to, from);
    }

    var saveMessage = function (value, type, _to, _from) {
        console.log(_from, from, _to, to)
        if ((from == _from && to == _to) || (from == _to && to == _from)) {
            var message = { value: value, type: type, from: _from, to: _to, time: new Date().getTime() };
            savedMessages.push(message);

            window.localStorage.setItem(localStorageKey, JSON.stringify(savedMessages));
            renderMessages(true);
        }

    }

    var onGetPhoto = function () {
        var options = {
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            destinationType: Camera.DestinationType.DATA_URL
        };
        navigator.camera.getPicture(onGetPhotoSuccess, onGetPhotoError, options);
    };

    var onGetPhotoError = function (err) {
        console.error(err);
    }

    var onDeleteMessages = function () {
        window.localStorage.clear();
        savedMessages = [];
        renderMessages(true);
    };

    var renderMessages = function (refresh) {
        messagesHtml.html('');

        if (!savedMessages.length) {

            appendMessage('no messages', 'text');

        } else {

            savedMessages.forEach(function (msg) {
                appendMessage(msg.value, msg.type, msg.from, msg.to, msg.time);
            });

        }

        if (refresh)
            $('#messages').listview('refresh');
    };

    var appendMessage = function (value, type, _from, _to, time) {
        var li = $('<li>');
        if (type == 'text') {
            if(!!_from){
                li.text('(' + formatTime(time) + ') ' + _from + ': ' + value);
            } else {
                li.text(value);
            }
        } else if (type == 'image64') {
            var img = $('<img />').attr('src', 'data:image/jpeg;base64,' + value);
            var div = $('<div>');

            div.text('(' + formatTime(time) + ') ' + _from + ': ');
            li.append(div);
            li.append(+img);
        } else {
            alert('Command not found');
        }
        $('#messages').append(li);
    }

    function formatTime(time) {
        var date = new Date(time);
        return dateFormat = //date.getFullYear() + "-" + fixZero(date.getMonth() + 1) + "-" + fixZero(date.getDay()) + " " +
            fixZero(date.getHours()) + ":" + fixZero(date.getMinutes()) + ":" + fixZero(date.getSeconds());
    }

    function fixZero(i) {
        return i < 10 ? '0' + i : i;
    }

    return {
        init: function (user) {
            to = user;
            from = $('#user-select').val();
            localStorageKey = "messages" + "_" + from + '_' + to;

            $('#send-message').unbind('tap').on('tap', onSendMessage);
            $('#get-photo').unbind('taphold').on('taphold', onGetPhoto);
            $('#delete-messages').on('tap', onDeleteMessages);

            savedMessages = JSON.parse(window.localStorage.getItem(localStorageKey)) || [];
            renderMessages();
        },
        saveMessage: saveMessage
    };
})();

var userData = (function () {

    var userList = Array();

    var getUsersList = function () {
        $.ajax({
            url: 'http://www.mocky.io/v2/56f0a2ef1000007f018ef257',
            jsonpCallback: 'jsonCallback',
            contentType: 'application/json',
            dataType: 'jsonp',
            crossDomain: true,
            success: onGetUsersListSuccess
        });

        return {
            myKey: 'a',
            init: function () {
                getUsersList
            }
        }
    }

    var onGetUsersListSuccess = function (list) {
        userList = list;
        renderUser();
        $('#users:visible').listview('refresh');
    }

    $('#user-select').bind('change', function () {
        var val = $(this).val();
        if (val.length) {
            $(this).selectmenu('disable');
            $('#users').fadeIn();

            $('#users li a').each(function () {
                if ($(this).data('user') === val) {
                    $(this).parent().remove();
                }
            });

            $('#users').listview('refresh');
        }
    });

    var renderUser = function () {
        $('#users').empty();

        $(userList).each(function (index, row) {

            //Fill select
            var opt = $('<option>');
            opt.val(row.user);
            opt.text(row.user);
            $('#user-select').append(opt);
            $('#user-select').selectmenu("refresh");

            //Fill listview            
            var li = $('<li>');
            var a = $('<a>');
            var div = $('<div>');
            var img = $('<img>');

            li.append(a);
            a.append(div);
            div.append(img);
            a.append(row.user);

            a.addClass('conversation');
            a.data('user', row.user);
            div.addClass('square');
            img.attr('id', 'box-phone-d' + (index + 1));
            img.attr('src', 'img/phone.png');

            $('#users').append(li);
        });

        bindPageNavigationEvent();
    }

    var bindPageNavigationEvent = function () {
        $('.conversation').tap(pageChangeTap);
        $(document).on('pagebeforechange', onPageBeforeChange);
    }

    var pageChangeTap = function () {
        $.mobile.pageContainer.pagecontainer('change', '#page', {
            user: $(this).data('user'),
            transition: 'flip'
        });
    }

    var onPageBeforeChange = function (e, data) {
        if (data.toPage === '#page') {
            $('#chatName').text(data.options.user);

            var to = data.options.user;
            var from = $('#user-select').val();

            communicator.init(to);
            webSocket.init(from);
        }
    }

    return {
        init: function () {
            getUsersList();
        }
    }



})();

var accelerometer = (function () {
    var transforms = ['-webkit-transform', '-moz-transform', '-ms-transform', 'transform'];

    var accelerometerSuccess = function (data) {
        var rotate = {};

        transforms.forEach(function (attr) {

            var rotateX = 'rotateX(' + (data.x * 100) + 'deg)';
            var rotateY = 'rotateY(' + (data.y * 100) + 'deg)';
            var rotateZ = 'rotateZ(' + (data.z * 100) + 'deg)';

            rotate[attr] = rotateX + rotateY + rotateZ;
        });

        $('#box-phone-d1').css(rotate);
    };

    var accelerometerError = function () {
        console.log('accelerometerError');
    };

    return {
        init: function () {
            var options = { frequency: 2000 };
            navigator.accelerometer.watchAcceleration(
            accelerometerSuccess,
            accelerometerError,
            options
        );
        }
    };
})();

var webSocket = (function () {
    var endpoint = "ws://server-9mobchat.rhcloud.com:8000"; 
    var socket = null;

    var userId = null;
    var connected = false;

    var onSocketError = function (error) {
        console.log('Websocket error: ', error);
    };

    var onSocketOpen = function (event) {
        console.log('Connected to: ' + endpoint);
        connected = true;

        var data = JSON.stringify({ type: 'register', id: userId });
        socket.send(data);
    };

    var onSocketMessage = function (event) {
        var message = event.data;
        console.log('Received: ' + message);

        var data = JSON.parse(message);
        communicator.saveMessage(data.message, data.type, data.to, data.from);
    };

    var onSocketClose = function (event) {
        console.log('Disconnected');
    };

    return {
        init: function (user) {
            if (socket != null)
                socket.close();

            socket = new WebSocket(endpoint);
            socket.onmessage = onSocketMessage;
            socket.onerror = onSocketError;
            socket.onopen = onSocketOpen;
            socket.onclose = onSocketClose;

            userId = user;
        },
        sendMessage: function (message, type, to, from) {
            if (socket && connected) {
                var data = JSON.stringify({ message: message, type: type, to: to, from: from });
                socket.send(data);
            }
        }
    };

})();

// prevent user to reload page from chat window
window.location.hash = "";

/* For having a faster transition */
$(document).on("mobileinit", function () {
    $.mobile.defaultPageTransition = "none";
    $.mobile.defaultDialogTransition = "none";

    accelerometer.init();
    userData.init();
});