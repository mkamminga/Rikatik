var controllers = {
    HomeController: function (rootServices, scope) {
        function init() {
            if (localStorage.getItem("user.id") != null) {
                $("#home-register-btn").hide();
                $("#home-start-session-btn").show();
                $("#home-footer").show();
            } else {
                $("#home-register-btn").show();
                $("#home-start-session-btn").hide();
                $("#home-footer").hide();
            }
        }

        init();
    },
    FindDevicesController: function (rootServices, scope) {
        function isEnabled () {
            ble.isEnabled(function () {
                $("#found-devices-frame").show("slow");
            }, function () {
                toast("Zet bluetooth aan!");
            });
        }
        function startScan () {
            console.log("Starting scan");
            toast("Begonnen met scannen!");
            ble.startScan([], scanSuccess, scanError);
            
            setTimeout(stopScan,
                8000,
                function () { console.log("startScan success!"); },
                function () { console.log("startScan failed"); }
            );
        }

        function scanSuccess(data) {
            toast("Nieuw apparaat gevonden!");
            var index = scope.services.length;
            scope.services.push(data);
            $("#found-devices-container").append("<span class=\"ui-btn device\" data-index=\""+ index +"\">" + data.name + "</span>");
        }

        function scanError(error) { }

        function stopScan() {
            console.log("Stopping scan");
            ble.stopScan(stopScanningSuccess, function (error) {
                console.log("Coudn't stop scanning: "+ error);
            });
        }

        function stopScanningSuccess() {
            $("#start-scan-btn").show();
        }

        function connect(index) {
            var service = scope.services[index];
            ble.connect(service.id, function (success) {
                localStorage.setItem("device", service.id);

                rootServices.globals.device = success;
                toast("Verbonden met: "+ service.name);

                rootServices.globals.connectedDevice = success;
                
            }, function (failure) {
                console.log("Failure to connect to device: "+ failure);
                toast("Kon niet verbinden met: " + service.name + "!");
            });
        }

        function init() {
            isEnabled();
            /*
                bindings
            */
           scope.initialized = scope.initialized || false;
           if (!scope.initialized) {
                scope.services = [];
                $("#start-scan-btn").click(function () {
                    $(this).hide();
                    $("#stop-scan-btn").show();
                    startScan();
                });
                $("#stop-scan-btn").click(function () {
                    $(this).hide();
                    $("#start-scan-btn").show();
                    stopScan();
                });

                $("#found-devices-container").on("click", ".device", function () {
                    var index = $(this).data("index");
                    connect(index);
                });

                scope.initialized = true;
            }
            /*
                misc
            */
            $("#stop-scan-btn, #found-devices-frame").hide();
        }

        init();
    },
    SessionOverviewController: function (rootServices, scope) {
        function removeSession(id) {
            if (!id || id == '') {
                toast("Er is een onbekende fout opgetreden!");
                return;
            }
            $.ajax({
                type: "DELETE",
                url: rootServices.globals.baseUrl + "/sessions/" + id,
                crossDomain: true,
                beforeSend: function () { $.mobile.loading('show') },
                complete: function () { $.mobile.loading('hide') },
                dataType: 'json',
                success: function (response) {
                    $("#session-row-"+ id).remove();
                },
                error: function (error) {
                    toast("Kon sissie niet verwijderen!");
                }
            });
        }

        function getAllSessions() {
            console.log("UserId: " + localStorage.getItem("user.id"));
            $.ajax({
                type: "GET",
                url: rootServices.globals.baseUrl + "/sessions",
                crossDomain: true,
                beforeSend: function () { $.mobile.loading('show') },
                complete: function () { $.mobile.loading('hide') },
                dataType: 'json',
                cache: false,
                data: {'user_id' : localStorage.getItem("user.id")},
                success: function (response) {
                    //console.error(JSON.stringify(response));
                    var data = response.result;
                    var sessionTable = $("#sessions-overview-table tbody");
                    sessionTable.html("");

                    $.each(data, function (key, row) {
                        sessionTable.append(
                            "<tr data-id=\"" + row.id + "\" id=\"session-row-"+ row.id +"\">" +
                                "<td>"+ row.date_added +"</td>" + 
                                "<td>"+ row.session_time +"</td> " + 
                                "<td>"+
                                    "<button class=\"ui-btn ui-btn-icon-right ui-shadow ui-corner-allui-btn ui-btn-icon-notext ui-corner-all ui-icon-action show-session-btn\" data-id=\"" + row.id + "\"></button>" +
                                    "<button class=\"ui-btn ui-btn-icon-right ui-shadow ui-corner-allui-btn ui-btn-icon-notext ui-corner-all ui-icon-delete remove-session-btn\" data-id=\"" + row.id + "\"></button>" +
                                "</td>" +
                            "</tr>");
                    });
                    
                },
                error: function (error) {
                    toast("Kon geen sessie laden!");
                }
            });
        }

        function init() {

            getAllSessions();

            if (!scope.bindingsInitialized) {
                $("#session-overview-refresh-btn").click(function () {
                    toast("Herladen...");
                    getAllSessions();
                });
                scope.bindingsInitialized = true;

                $(document).on("click", '.remove-session-btn', function () {
                    var id = $(this).data('id');
                    removeSession(id);
                });

                $(document).on("click", '.show-session-btn', function () {
                    var id = $(this).data('id');

                    $.ajax({
                        type: "GET",
                        url: rootServices.globals.baseUrl + "/sessions/" + id,
                        data: { 'user_id': localStorage.getItem("user.id") },
                        crossDomain: true,
                        beforeSend: function () { $.mobile.loading('show') },
                        complete: function () { $.mobile.loading('hide') },
                        dataType: 'json',
                        success: function (response) {
                            //console.error(JSON.stringify(response));
                            var data = response.result;
                            rootServices.gotoPage("show-session", { "item": data });
                    
                        },
                        error: function (error) {
                            toast("Kon geen sessie laden!");
                        }
                    });
                    
                });
            }
        }

        init();
    },
    SessionController: function (rootServices, scope) {
        function subscribe(device) {
            var heartRate = {
                service: '180d',
                measurement: '2a37'
            };
            ble.startNotification(device, heartRate.service, heartRate.measurement, subscriptionSuccess, subscriptionError);
        }

        function subscriptionSuccess(data) {
            if (!scope.subscribed){
                scope.subscribed = true;
                $("#session-data-frame").show();
                $("#session-controls").show();
            }

            //console.log("Data received!");
            var heartRateData = new Uint8Array(data); 
            $("#heartbeat-text").text(heartRateData[1]);
            //console.log("Beat: "+ heartRateData[1]);

            var dateTimestamp = (new Date).getTimeStamp();
            

            if (scope.sessionRunning) {
                scope.SessionService.logItem({
                    'timestamp': dateTimestamp,
                    'heart_rate': heartRateData[1]
                });
                //alert user if heart rate either more or less than the set bounds
                if (heartRateData[1] > parseInt(localStorage.getItem("heartRate.max")) 
                || heartRateData[1] < parseInt(localStorage.getItem("heartRate.min"))) {
                    navigator.vibrate(500);
                }
            }
        }

        function gpsOnUpdate(position) {
            if (!scope.gpsSubscribed) {
                scope.gpsSubscribed = true;
                scope.distance = 0;
                scope.gpsCount = 0;
            }

            if (!position.coords.latitude || !position.coords.longitude || !position.timestamp) {
                return;
            }

            var currentUpdate = position;
            currentUpdate.timestamp = position.timestamp;
            currentUpdate.position = new LatLon(position.coords.latitude, position.coords.longitude);
            //start..
            if (scope.gpsLastUpdate) {
                var lastUpdate = scope.gpsLastUpdate;
               
                currentUpdate.deltaDistMetres = lastUpdate.position.distanceTo(currentUpdate.position);
 
                var timeDiff = ((currentUpdate.timestamp - lastUpdate.timestamp) / 1000);
                console.log("Timediff: "+ timeDiff);
                console.log("Metres: " + currentUpdate.deltaDistMetres);
                   
                currentUpdate.speed = parseFloat(parseFloat(currentUpdate.deltaDistMetres) / timeDiff);

                if (currentUpdate.speed > 0 && scope.gpsCount > 2 && scope.sessionRunning) {

                    console.log("Distance: " + scope.distance + " -> " + (parseFloat(currentUpdate.deltaDistMetres) + scope.distance));
                    scope.distance+= parseFloat(currentUpdate.deltaDistMetres);
                }
                
                if (currentUpdate.speed >= 0) {
                    currentUpdate.speed = parseFloat(currentUpdate.speed);
                    var speedInKmPerHour = (currentUpdate.speed * 3.6).toFixed(2);
                    
                    $("#gps-data-speed").html(speedInKmPerHour);
                }

                $("#gps-data-distance").html(parseFloat(scope.distance).toFixed(2));
                
                if (scope.sessionRunning) {
                    var dateTimestamp = (new Date).getTimeStamp();
                    scope.SessionService.logGps({
                        'timestamp': dateTimestamp,
                        'distance_traveled': parseFloat(currentUpdate.deltaDistMetres).toFixed(2),
                        'speed': parseFloat(currentUpdate.speed).toFixed(2),
                        'lat' : position.coords.latitude, 
                        'lon': position.coords.longitude
                    });
                }
            }
            scope.gpsCount++;
            scope.gpsLastUpdate = currentUpdate;
        }

        function gpsError(error) {
            console.log("gps error: "+ error);
            toast("Error receiving data from gps. Please make sure that gps is enabled!");
        }

        function subscriptionError(error) {
            console.log(error);
            toast("Geen data ontvangen van hartslag meter! Probeer opnieuw te verbinden!");
        }

        function startSession () {
            console.log("Start session btn");
            if (!scope.subscribed) {
                toast("Niet verbonden met hartslagmeter!");
                return;
            }

            if (scope.sessionRunning) {
                toast("Al een actieve sessie. Stop eerst de huidige sessie alvooreens een nieuwe te starten!");
                return;
            }
            //Create session
            scope.currentSessionId = null;
            $.ajax({
                type: "POST",
                url: rootServices.globals.baseUrl + "/sessions",
                crossDomain: true,
                beforeSend: function () { $.mobile.loading('show') },
                complete: function () { $.mobile.loading('hide') },
                data: {
                    'user_id': localStorage.getItem("user.id")
                },
                dataType: 'json',
                success: function (response) {
                    console.log(response);
                    scope.currentSessionId = response.result.id;
                    console.log("Created session: " + scope.currentSessionId);
                    scope.sessionRunning = true;
                    scope.startTime = (new Date).getTimeStamp();
                    startTimer();
                    scope.storeItemsTimer = setInterval(function () {
                        storeItems();
                    }, 7000);

                    rootServices.eventManager.publish("SessionController.sessionStarterd");
                },
                error: function (error) {
                    toast("Kon geen sessie starten!");
                }
            });
        }

        function storeItems() {
            if (scope.SessionService.getItems().length > 0 && scope.sessionRunning) {
                var postData = {
                    'items': (scope.SessionService.getItems()),
                    'gps': (scope.SessionService.getGps())
                };

                scope.SessionService.clear();
                console.log("Saving items to: " + scope.currentSessionId);
                $.ajax({
                    type: "POST",
                    url: rootServices.globals.baseUrl + "/sessions/" + scope.currentSessionId + "/items",
                    crossDomain: true,
                    data: postData,
                    dataType: 'json',
                    success: function (response) {
                        console.log("Success");
                    },
                    error: function (error) {
                        console.log(error);
                        toast("Kan data niet verzenden naar server! Controleer je verbinding!");
                    }
                });
            }
        }

        function startTimer() {
            var hours = 0;
            var minutes = 0;
            var seconds = 0;
            scope.timer = setInterval(function () {
                if (minutes == 59) {
                    hours++;
                    minutes = 0;
                } else if (seconds == 59) {
                    minutes++;
                    seconds = 0;
                } else {
                    seconds++;
                }

                $("#timer").text(
                        (hours > 9 ? hours : "0" + hours) + ":"
                        + (minutes > 9 ? minutes : "0" + minutes) + ":"
                        + (seconds > 9 ? seconds : "0" + seconds)
                );
            }, 1000);
        }

        function stopSession() {
            if (!scope.sessionRunning) {
                toast("Geen actieve sessie om te stoppen.");
                return;
            }
            //Save the remaining items
            storeItems();
            clearInterval(scope.timer);
            clearInterval(scope.storeItemsTimer);

            var heartRate = {
                service: '180d',
                measurement: '2a37'
            };
            /*ble.stopNotification(
                device,
                heartRate.service,
                heartRate.measurement,
                function () { console.log("No longer listening"); },
                function (error) { console.log("disconnected failure"); }
            );*/


            //on success, reset all current session vars
            scope.sessionRunning = false;

            if (rootServices.globals.testMode) {
                clearInterval(scope.testSubscriber);
            }

            if (scope.gpsWatcher) {
                clearGps();
            }

            var dateTimestamp = (new Date).getTimeStamp();

            $.ajax({
                type: "PUT",
                url: rootServices.globals.baseUrl + "/sessions/" + scope.currentSessionId,
                crossDomain: true,
                data: {
                    'startdate' : scope.startTime,
                    'enddate': dateTimestamp
                },
                dataType: 'json',
                success: function (response) {
                    scope.currentSessionId = null;
                    toast("Sessie is opgeslagen!");
                    rootServices.eventManager.publish("SessionController.sessionStopped");
                },
                error: function (error) {
                    console.log(error);
                    toast("Kon huidige sessie niet stoppen!");
                }
            });
        }

        function onLeave() {
            if (scope.sessionRunning) {
                stopSession();
            }
        }

        function init() {
            scope.sessionRunning = false;
            scope.gpsSubscribed = false;
            scope.subscribed = false;
            //init heart rate deice
            initHeartRate();

            if (!scope.SessionService) {
                scope.SessionService = new SessionService();
            }

            if (!scope.bindingsInitialized) {
                rootServices.eventManager.subscribe("SessionController.onLeave", onLeave);
                scope.bindingsInitialized = true;
            }
            $("#start-session-btn").click(function () {
                startSession();
            });

            rootServices.eventManager.subscribe("SessionController.sessionStarterd", function () {
                $("#start-session-btn").hide();
                $("#stop-session-btn").show();
            });

            rootServices.eventManager.subscribe("SessionController.sessionStopped", function () {
                $("#start-session-btn").show();
                $("#stop-session-btn").hide();
            });

            $("#stop-session-btn").click(function () {
                stopSession();
            });

            $("#stop-session-btn").hide();

            $("#gps-flip").on("change", function () {
                var val = $(this).val();
                if (val == "on") {
                    //init gps
                    initGps();
                } else {
                    clearGps();
                }
            });
        }

        function initHeartRate() {
            var testMode = localStorage.getItem("testMode");
            if (localStorage.getItem("testMode") == "1" || localStorage.getItem("testMode") == 1) {
                scope.testSubscriber = setInterval(function () {
                    subscriptionSuccess([0, Math.floor((Math.random() * 80) + 70)]);
                }, 1000);
            } else if (rootServices.globals.connectedDevice) {
                //init heart rate
                subscribe(rootServices.globals.connectedDevice.id);
            } else {
                if (localStorage.getItem("device") != "" && localStorage.getItem("device") != null) {
                    //attempt auto-connect to known device
                    ble.isEnabled(function () {
                        var deviceId = localStorage.getItem("device");
                        ble.connect(deviceId, function (success) {
                            rootServices.globals.connectedDevice = success;
                            subscribe(localStorage.getItem("device"));
                        }, function (error) {
                            console.log(error);
                            toast("Kon niet verbinden met hartslag meter!");
                        });
                    }, function () {
                        toast("Zet eerst bluetooth aan!");
                    });
                }
                else {
                    //connect to device
                    toast("Verbind eerst met een hartslag meter alvooreens te kunnen starten!");
                }
            }
        }

        function initGps() {
            try {
                scope.gpsWatcher = navigator.geolocation.watchPosition(gpsOnUpdate, gpsError, { enableHighAccuracy: true });
            } catch (e) {
                console.log(e);
            }
        }

        function clearGps() {
            scope.gpsLastUpdate = null;
            navigator.geolocation.clearWatch(scope.gpsWatcher);
        }

        init();
    },
    SessionItemController: function (rootServices, scope, args) {
        function init() {
            if (!args.item) {
                toast("Geen data!");
                return;
            }
            var item = args.item;
            item.distance_traveled      = (item.distance_traveled != null ? parseFloat(item.distance_traveled).toFixed(3) : 0);
            item.avg_speed              = (item.avg_speed != null ? parseFloat(item.avg_speed).toFixed(1) : 0);
            item.max_speed              = (item.max_speed != null? parseFloat(item.max_speed).toFixed(1) : 0);

            $("[from]").each(function (index) {
                var key = $(this).attr('from');
                var value = (item[key] ? item[key] : null);
                $(this).html(value);
            });
        }

        init();
    },
    SettingsController: function (rootServices, scope) {
        function validateFields() {
            var fieldsToValidate = {
                'heartRate.min': 'Minimale hartslag',
                'heartRate.max': 'Maximale hartslag'
            };

            var errors = {};

            $.each(fieldsToValidate, function (key, message) {
                var val = $('input[name="' + key + '"]').val();
                if (val == '') {
                    errors[key] = message + ' is verplicht!'
                } else if (!(/^[0-9]+$/.test(val))) {
                    errors[key] = message + ' is geen getal!'
                }
            });

            return {
                'passes': jQuery.isEmptyObject(errors),
                'errors' : errors
            };
        }

        function save() {
            var validatedForm = validateFields();
            if (validatedForm.passes) {
                localStorage.setItem("heartRate.max", $('input[name="heartRate.max"]').val());
                localStorage.setItem("heartRate.min", $('input[name="heartRate.min"]').val());
                var testMode = $('select[name="testMode"]').val();
                localStorage.setItem("testMode", testMode);

                displaySuccessMessage($("#setting-messages"), "Uw instellingen zijn opgeslagen!");
                $("#setting-messages").fadeOut(2600, function () {
                    $("#setting-messages").html("").show();
                });
            } else {
                //display errors
                displayErrorMessages($("#setting-messages"), validatedForm.errors);
            }
        }

        function init() {
            $('input[name="heartRate.max"]').val(localStorage.getItem("heartRate.max"));
            $('input[name="heartRate.min"]').val(localStorage.getItem("heartRate.min"));
            $('#testmodus-flip').val(localStorage.getItem("testMode")).flipswitch("refresh");
            $("#settings-form").submit(function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();

                save();
            });
        }

        init();
    },
    RegisterController: function (rootServices, scope) {
        function post(params) {
            $.ajax({
                type: "POST",
                url: rootServices.globals.baseUrl + "/users",
                crossDomain: true,
                beforeSend: function () { $.mobile.loading('show') },
                complete: function () { $.mobile.loading('hide') },
                data: params,
                dataType: 'json',
                cache: false,
                success: function (response) {
                    //console.error(JSON.stringify(response));
                    var data = response.result;

                    localStorage.setItem("user.id", data.id);
                    localStorage.setItem("user.username", data.username);
                    localStorage.setItem("user.email", data.email);
                    displaySuccessMessage($("#register-messages"), "U heeft zich succesvol geregistreerd!");

                    //redirect
                    setTimeout(function () {
                        rootServices.gotoPage("home");
                    }, 2600);
                },
                error: function (error, data, xhr) {
                    displayErrorMessages($("#register-messages"), error.responseJSON.error.messages);
                }
            });
        }

        function init() {
            if (localStorage.getItem("user.id") != null) {
                $("#register-form").remove();
                displayWarning($("#register-messages"), "U heeft zich al geregistreerd!");
            } else {
                scope.bindingsInitialized = scope.bindingsInitialized || false;
                if (!scope.bindingsInitialized) {
                    $("#register-form").on("submit", function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        e.stopPropagation();

                        post($(this).serializeArray());
                    });
                }
        }
        }
        init();
    }
};