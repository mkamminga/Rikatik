function notSupported() {
    console.log('BLE is not supported on the browser');
}

var gatt = Windows.Devices.Bluetooth.GenericAttributeProfile; 
var pnp = Windows.Devices.Enumeration.Pnp; 
var watcher;
var watcherStatus = "";
var defaultSelector = "System.Devices.InterfaceClassGuid:=\"{6E3BB679-4372-40C8-9EAA-4509DF260CD8}\" AND System.Devices.InterfaceEnabled:=System.StructuredQueryType.Boolean#True";
var BlueTooth = {};
var devices = {};
var service;
var serviceInitialized = false;
//Scan
BlueTooth.scan = function (services, seconds, success, failure) {
    notSupported();
    if (failure) failure();
};

BlueTooth.startScan = function (services, success, failure) {
    try {
        if (watcherStatus == "started") {
            failure({
                "error": "startScan",
                "message": "scan already started!"
            });
            return;
        }

        if (!watcher) {
            watcher = Windows.Devices.Enumeration.DeviceInformation.createWatcher(gatt.GattDeviceService.getDeviceSelectorFromUuid(gatt.GattServiceUuids.heartRate), ["System.Devices.ContainerId"]);

            // Add event handlers
            var found = [];
            watcher.addEventListener("added", function (devinfo) {
                if (found.indexOf(devinfo.properties["System.Devices.ContainerId"]) != -1) {
                    return;
                }
                found.push(devinfo.properties["System.Devices.ContainerId"]);
                console.log("Found: " + devinfo.properties["System.Devices.ContainerId"]);
		        devices[devinfo.id] = devinfo;
                success({
                    name: devinfo.name,
                    id: devinfo.id,
                    advertisement: devinfo,
                    rssi: 0,
                });
            });
        }
        // Start enumerating and listening for events
        watcher.start();
        watcherStatus = "started";
    } catch (e) {
        failure({
            "error": "startScan",
            "message": e.message
        });
    }
};

BlueTooth.stopScan = function (success, failure) {
    try {
        if (watcherStatus != "started") {
            failure("scan not started!");
            return;
        }
        watcher.stop();
        success("scan wil be stoppped");
    }
    catch (e) {
        failure("Couldn't stop scan: " + e.message);
    }
};

BlueTooth.connect = function (device_id, connectSuccess, connectFailure) {
    var getDeviceInformationById = function () {
        return new WinJS.Promise(function (onComplete, onError) {
            if (device_id in devices) {
                return onComplete(devices[device_id]);
            } else {
                Windows.Devices.Enumeration.DeviceInformation.createFromIdAsync(device_id, ["System.Devices.ContainerId"]).then(function (devInfo) {
                    return onComplete(devInfo);
                }, function (error) {
                    return onError(error);
                });
            }
        });
    };

    getDeviceInformationById().then(function (devInfo){ 
        gatt.GattDeviceService.fromIdAsync(devInfo.id).then(function (deviceService) {
            if (deviceService) {
                service = deviceService;
                serviceInitialized = true;

                //var deviceContainerId = device.properties["System.Devices.ContainerId"].toString(); 
                pnp.PnpObject.createFromIdAsync(pnp.PnpObjectType.deviceContainer, devInfo.properties["System.Devices.ContainerId"], ["System.Devices.Connected"]).done(function (deviceObject) {
                    var isConnected = deviceObject.properties["System.Devices.Connected"];
                    if (isConnected) {
                        console.log("Connected to: ");
                        console.log(deviceObject);
                        connectSuccess(deviceObject);
                    } else {
                        connectFailure("Connection failure");
                    }
                });

            } else {
                connectFailure("Access to the device is denied, because the application was not " +
                    "granted access, or the device is currently in use by another application.");
                return;
            }
        }, function (error) {
            connectFailure("Failed to connect: " + error);
        });
    }, function (error) {
        console.log(error);
        connectFailure("Failed to connect to device with id: "+ device_id);
    });
};

BlueTooth.disconnect = function (device_id, connectSuccess, connectFailure) {

};

BlueTooth.read = function (device_id, service_uuid, characteristic_uuid, success, failure) {
    notSupported();
    if (failure) failure();
};

BlueTooth.write = function (device_id, service_uuid, characteristic_uuid, data, success, failure) {
    notSupported();
    if (failure) failure();
};

BlueTooth.writeWithoutResponse =function (device_id, service_uuid, characteristic_uuid, data, success, failure) {
    notSupported();
    if (failure) failure();
};

BlueTooth.startNotification = function (device_id, service_uuid, characteristic_uuid, success, failure) {
    // The Heart Rate profile states that there must be one HeartRateMeasurement characteristic for the service 
    var characteristic = service.getCharacteristics(gatt.GattCharacteristicUuids.heartRateMeasurement)[0];
    
    // Register the event handler for receiving device notification data 
    characteristic.onvaluechanged = function (data) {
        return success(data.characteristicValue);
    };

    var descriptorValue = gatt.GattClientCharacteristicConfigurationDescriptorValue.notify;
    //descriptorValue = gatt.GattClientCharacteristicConfigurationDescriptorValue.indicate;
    
    characteristic.writeClientCharacteristicConfigurationDescriptorAsync(descriptorValue).done(function (result) {
        if (result != gatt.GattCommunicationStatus.success) {
            return failure("Device unreachable.");
        } else {
            console.log("Success");
        }
    }, function (error) {
        console.log(error);
        return failure(error);
    });
};

BlueTooth.stopNotifcation = function (device_id, service_uuid, characteristic_uuid, success, failure) {

};

BlueTooth.isEnabled = function (success, failure) {
    Windows.Devices.Enumeration.DeviceInformation.findAllAsync(defaultSelector, null).done(function (services) {
        if (services.length > 0) {
            success();
        } else {
            console.log("Not enabled");
            failure();
        }
    }, function (error) {
        console.log(error);
        failure();
    });
};

BlueTooth.isConnected = function (device_id, success, failure) {
    notSupported();
    if (failure) failure();
};

BlueTooth.showBluetoothSettings = function (success, failure) {
    notSupported();
    if (failure) failure();
};

BlueTooth.enable = function (success, failure) {
    notSupported();
    if (failure) failure();
};

module.exports = BlueTooth;