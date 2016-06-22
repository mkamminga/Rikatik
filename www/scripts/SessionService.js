function SessionService () {
    this.items = [];
    this.gps = [];
    this.lock = false;
}

SessionService.prototype.logItem = function (data) {
    this.locked(function (service) {
        service.items.push(data);
    });
};

SessionService.prototype.logGps = function (data) {
    this.locked(function (service) {
        service.gps.push(data);
    });
};

SessionService.prototype.getItems = function () {
    return this.items;
};

SessionService.prototype.getGps = function () {
    return this.gps;
};

SessionService.prototype.clear = function () {
    this.locked(function (service) {
        service.items = [];
        service.gps = [];
    });
};

SessionService.prototype.locked = function(locked, lastlockTime){
    if (this.lock) {
        lastlockTime = lastlockTime || (lastlockTime + 47)
        var service = this;
        setTimeout(function () {
            service.locked(locked, 80);
        }, 80);
    }
    this.lock = true;
    locked(this);
    this.lock = false;
};



