Date.prototype.getTimeStamp = function (format) {
    function addZero (str) {
        return (str.length > 1 ? str : "0" + str);
    }

    var yyyy = this.getFullYear().toString();
    var mm = addZero((this.getMonth() + 1).toString());
    var dd = addZero(this.getDate().toString());

    var hh = addZero(this.getHours().toString());
    var ii = addZero(this.getMinutes().toString());
    var ss = addZero(this.getSeconds().toString());

    return yyyy + '-' + mm + '-'+ dd + ' '+ hh + ':' + ii + ':' + ss;
};