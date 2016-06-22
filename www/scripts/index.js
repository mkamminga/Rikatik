// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
    "use strict";

    document.addEventListener( 'deviceready', onDeviceReady.bind( this ), false );

    function onDeviceReady() {
        // Handle the Cordova pause and resume events
        document.addEventListener('pause', onPause.bind( this ), false );
        document.addEventListener('resume', onResume.bind(this), false);

        initApp();
    };

    function initApp() {
        $.support.cors = true;
        //localStorage.clear();
        if (!localStorage.getItem("defaultsSet")) {
            $.getJSON("defaults.json", function (data) {
                $.each(data, function (key, value) {
                    localStorage.setItem(key, value);
                });
                localStorage.setItem("defaultsSet", 1);
            });
        }

        var pages = {
            "home": "HomeController",
            "session": "SessionController",
            "sessions": "SessionOverviewController",
            "show-session": "SessionItemController",
            "find-bluetooth-devices" : "FindDevicesController",
            "settings": "SettingsController",
            "register" : "RegisterController"
        };

        var pageArgs = {};
 
        //injectable in controllers
        var rootServices = {
            "eventManager": new EventManager(),
            "globals": {
                "baseUrl": "http://mob1.mjkamminga.nl",
                "testMode" : true
            },
            "scope": {},
            "gotoPage": function gotoPage(page, args) {
                pageArgs[page] = {};
                pageArgs[page] = args;
                $(":mobile-pagecontainer").pagecontainer("change", page + ".html", { role: "page" });
            }
            
        };
        //inital empty scope
        var scope = {};

        var prevPage = "";
        var currentPage = "";

        function switchController(page) {
            if (currentPage != "") {
                prevPage = currentPage;
                var prevController = pages[prevPage];
                rootServices.eventManager.publish(prevController + ".onLeave");
            }

            var controller = pages[page];

            if (!(controller in scope)) {
                scope[controller] = {};
            }
            var args = pageArgs[page] || {};
            controllers[controller](rootServices, scope[controller], args);


            currentPage = page;
            console.log("Switched to: " + page);
            if (args) {
                console.log("With arguments: ");
                console.log(args);
            }

            pageArgs[page] = {};
        }

        $(window).on("pagecontainerbeforeshow", function (event, data) {
            //Init the home controller
            switchController($(data.toPage).attr('id'));
        });
        //open the default page
        rootServices.gotoPage("home");
    }

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
} )();