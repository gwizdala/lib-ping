/*
Name: library_mfa
Description: Access and interact with MFA devices

 This script allows you to view and manage a user's MFA devices.

 Frodo command:
 frodo script import -f library_logger.js <tenant>
 
 Author: @gwizdala
 */

/**
* Note that Rhino ES2015 has the following engine compatibility: 
* https://mozilla.github.io/rhino/compat/engines.html
* Default function parameters and object destructuring are not supported
* It is suggested to stick to "vanilla javascript" where possible
*/

//// CONSTANTS
var DEVICE_PROFILE = 'DeviceProfiles';
var DEVICE_TYPE = {
    OATH: "oath",
    PUSH: "push",
    WEBAUTHN: "webauthn"
};

//// UTILITY FUNCTIONS 
function getDeviceTypeFormatted(deviceType) {
    var deviceTypeUpper = deviceType.toUpperCase();
    return DEVICE_TYPE[deviceTypeUpper] || null;
}

function getDeviceTypesFormatted(deviceTypes) {
    var formattedDeviceTypes = [];
    if (deviceTypes && Array.isArray(deviceTypes)) {
        for (var i = 0; i < deviceTypes.length; i++) {
        var deviceTypeOption = deviceTypes[i].toUpperCase();
        if (DEVICE_TYPE[deviceTypeOption]) {
            formattedDeviceTypes.push(deviceTypeOption);
        }
        }
    } else {
        // Object.values() isn't supported.
        var deviceKeys = Object.keys(DEVICE_TYPE);
        deviceKeys.forEach(function(deviceKey) {
            formattedDeviceTypes.push(DEVICE_TYPE[deviceKey]);
        });
    }
    return formattedDeviceTypes;
}

//// EXPORTS
/**
 * Returns a list of MFA metadata, keyed by the username.
 * @param {this} caller (Use `this`) The parent context, used to get FR functions
 * @param {string} uid the _id of the user
 * @param {Array} deviceTypes the device type(s) to return. Defaults to all
 * @return {object[]} the mfa metadata
 */
exports.getMFADevices = function(caller, uid, deviceTypes) {
    var idmDeviceTypes = getDeviceTypesFormatted(deviceTypes);
    var out = {};
    var identity = caller.idRepository.getIdentity(uid);
        
    for (var i = 0; i < idmDeviceTypes.length; i++) {
        var idmDeviceType = idmDeviceTypes[i];

        var response = identity.getAttributeValues(`${idmDeviceType}${DEVICE_PROFILE}`);
        out[idmDeviceType.toUpperCase()] = JSON.parse(response);
    }

    return out;
};

//// EXPORTS
/**
 * Deletes an MFA device on a user's profile.
 * @param {this} caller (Use `this`) The parent context, used to get FR functions 
 * @param {string} uid the _id of the user
 * @param {string} deviceType the type of device, e.g. oath/push/webauthn
 * @param {string} deviceId the unique uuid of the device.
 * @return {object} the updated device profile for that device type, or null
 */
exports.removeMFADevice = function(caller, uid, deviceType, deviceId) {
    var idmDeviceType = getDeviceTypeFormatted(deviceType);
    var deviceProfileAttribute = `${idmDeviceType}${DEVICE_PROFILE}`;
    var identity = caller.idRepository.getIdentity(uid); 

    // get all of the profiles for this MFA device type
    var deviceProfilesResponse = identity.getAttributeValues(deviceProfileAttribute);
    var deviceProfiles = JSON.parse(deviceProfilesResponse);
        
    var updatedDeviceProfiles = [];
    // remove the profile in question
    deviceProfiles.forEach(function(deviceProfile) {
        if (deviceProfile.uuid != deviceId) {
            updatedDeviceProfiles.push(deviceProfile);
        }
    });

    // update the profile object
    identity.setAttribute(deviceProfileAttribute, updatedDeviceProfiles);

    // persist data (throws an exception if setAttribute failed)
    try {
        identity.store();
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * 
 * @param {this} caller (Use `this`) The parent context, used to get FR functions 
 * @param {string} uid the _id of the user
 * @param {string} deviceType the type of device, e.g. oath/push/webauthn
 * @param {string} deviceId the unique uuid of the device.
 * @param {string} newDeviceName the new name to change the device to
 * @returns 
 */
exports.renameMFADevice = function(caller, uid, deviceType, deviceId, newDeviceName) {
    var idmDeviceType = getDeviceTypeFormatted(deviceType);
    var deviceProfileAttribute = `${idmDeviceType}${DEVICE_PROFILE}`;
    var identity = caller.idRepository.getIdentity(uid); 

    // get all of the profiles for this MFA device type
    var deviceProfilesResponse = identity.getAttributeValues(deviceProfileAttribute);
    var deviceProfiles = JSON.parse(deviceProfilesResponse);
    var found = false;
    var profileIndex = 0;

    // update the device name
    while(!found && profileIndex < deviceProfiles.length) {
        var deviceProfile = deviceProfiles[profileIndex];

        if (deviceProfile.uuid == deviceId) {
            deviceProfile.deviceName = newDeviceName;
            deviceProfiles[profileIndex] = deviceProfile;
        }
        profileIndex += 1;
    }

    if (found) {
        // update the profile object
        identity.setAttribute(deviceProfileAttribute, deviceProfiles);
    } else {
        return false;
    }

    // persist data (throws an exception if setAttribute failed)
    try {
        identity.store();
        return true;
    } catch (e) {
        return false;
    }
}