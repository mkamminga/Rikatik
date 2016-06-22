function EventManager () {
	this.subscriptions = {};
};

EventManager.prototype.subscribe = function(event, callback) {
	if (!(event in this.subscriptions)){
		this.subscriptions[event] = [];
	}

	this.subscriptions[event].push(callback);
};

EventManager.prototype.unsubscribe = function(event, callback) {
	if (event in this.subscriptions){
		for (var i = 0; i < this.subscriptions[event].length; i++) {
			if (this.subscriptions[event][i] == callback) {
				this.subscriptions[event].splice(i, 1);
				break;
			}
		}
	}
};

EventManager.prototype.publish = function (event, data, allowUndefined) {
	if (event in this.subscriptions){
		
		if (typeof data == 'undefined' && (typeof allowUndefined == 'undefined' || allowUndefined == false)) {
			data = null;
		}

		for (var i = 0; i < this.subscriptions[event].length; i++) {
			this.subscriptions[event][i](data);
		}
	}
};
