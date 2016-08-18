var _uuid = uuid.v1();
document.querySelector('#session-code').innerText = '... loading code ...';

var host = location.origin.replace(/http/, 'ws');
var webSocket = new WebSocket(host);

webSocket.onopen = function(event) {

  // register with server
  webSocket.send(JSON.stringify({
    type: 'register',
    uuid: _uuid
  }));
};

webSocket.onmessage = function(event) {
  console.log(event);

  var data = JSON.parse(event.data);
  if (data.type === 'ack') {
    // Enable stuff on the UI here
    document.querySelector('#session-code').innerText = data.uuid;
  } else if (data.type === 'fetch') {
    if (data.who == _uuid) {
      ajax()
        .get('/mpesa_data/' + _uuid)
        .then(function(data) {
          console.log(data);
        });
    }
  }
};