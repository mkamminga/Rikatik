function toast(msg, delay) {
    delay = delay || 1500;
    $("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all toast'><h3>" + msg + "</h3></div>")
    .css({
        left: ($(window).width() - 284) / 2,
        top: $(window).height() / 2
    })
    .appendTo($.mobile.pageContainer).delay(2000)
    .fadeOut(1000, function () {
        $(this).remove();
    });
}

function displayErrorMessages(frame, messages) {
    frame.html("<div class=\"callout alert\"><ul class=\"errors\" /></div>");
    var errorFrame = frame.find('.errors');
    $.each(messages, function (key, message) {
        errorFrame.append("<li>" + message + "</li>");
    });
}

function displayWarning(frame, message) {
    frame.html("<div class=\"callout warning\"><p>"+ message +"</p></div>");
}

function displaySuccessMessage(frame, message) {
    frame.html("<div class=\"callout success\"><p>" + message + "</p></div>")
}