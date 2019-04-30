const mongo = require('mongodb').MongoClient;
const io = require('socket.io').listen(4000).sockets;

// Connection URL
const url = 'mongodb://127.0.0.1/mongochat'; 

// Connect to Mongo
mongo.connect(url, (err, client) => {
	if (err) {
		throw err;
	}

	console.log('DB connected...');
	// Connect to socket.io
	io.on('connection', socket => {
		let chat = client.db('mongochat').collection('chats');

		// function to send status
		sendStatus = function(s) {
			socket.emit('status', s);
		}

		// get chats from mongo collection
		chat.find().limit(100).sort({_id:1}).toArray((err, res) => {
			if (err) {
				throw err;
			}

			// emit messages
			socket.emit('output', res);

			// handle input events
			socket.on('input', data => {
				let name = data.name;
				let message = data.message;
				let email = validateEmail(data.email);
				console.log(data);

				// check for name and message
				if (name == '' || message == '' || email == '') {
					// send error status
					sendStatus('Please enter a name, email and message');
				} else {
					// insert message to db
					chat.insert({name: name,email: email, message: message}, function(){
						io.emit('output', [data]);

						//send status object
						sendStatus({
							message: 'Message sent',
							clear: true
						});
					});
				}
			});

			// handle clear 
			socket.on('clear', data => {
				// remove all chats from the collection
				chat.remove({}, () => {
					// emit cleared
					socket.emit('cleared');
				});
			});
		});
	});
});

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}