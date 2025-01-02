/*
Checks if the user has an existing session, and if so, logs them out.
 
 This script expects the following ESV to be set:
 	esv.cookie - the cookie of the tenant (found in "Tenant Settings")
 
 The scripted decision node needs the following outcomes defined:
 - Success
 - Failure
 - No Session
 - Error
 
 Author: david.gwizdala@forgerock.com
 */

//// CONSTANTS
// Request Params
var HOST = requestHeaders.get("host").get(0);
var AM_BASE_URL = "https://" + HOST + "/am/";
// Long-Lived API Token
var TENANT_COOKIE = systemEnv.getProperty("esv.cookie");

/**
With Next Gen Scripting, you can import Library Scripts to reuse functionality without copy/pasting code
Rather than writing external REST calls into functions like this, consider writing a utility script
And then importing it here.
Docs: https://backstage.forgerock.com/docs/idcloud/latest/am-scripting/library-scripts.html
*/
// var externalAPI = require('myExternalAPI');

var OUTCOMES = {
  SUCCESS: "Success",
  FAILURE: "Failure",
  NO_SESSION: "No Session",
  ERROR: "Error"
};

//// HELPERS
/**
 * Finds the user's session cookie, stored under the tenant cookie identifier
 * @returns {string} The user's cookie, or null if not found
 */
function getSessionCookie() {
  var userCookieString = requestHeaders.get("cookie").get(0);
  // parse the cookies
  if (userCookieString) {
    var userCookies = userCookieString.split("; ");
    // look for the right cookie
    for (var i = 0; i < userCookies.length; i++) {
      var userCookieData = userCookies[i].split("=");
      if (userCookieData[0] == TENANT_COOKIE) {
      	return userCookieData[1]; 
      }
    }
  }
}

/**
 * Kills all of a user's sessions based on their identifier
 * https://backstage.forgerock.com/docs/idcloud/latest/am-sessions/managing-sessions-REST.html#invalidate-sessions-user
 * @param {string} sessionCookie the user's cookie containing their session authorization
 * @param {string} uid the universal identifier of the user
 * @returns {boolean} whether or not the invalidation was successful
 */
function logoutByUser(sessionCookie, uid) {
  var wasLogoutSuccessful = false;
  
  var options = {
    method: 'POST',
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Accept-API-Version": "resource=5.1, protocol=1.0"
    },
    body: {
      username: uid
    }
  };
  options.headers[TENANT_COOKIE] = sessionCookie;
  
  var requestURL = `${AM_BASE_URL}json/realms/root/realms/alpha/sessions/?_action=logoutByUser`;

  var response = httpClient.send(requestURL, options).get();

  if (response.status === 200) {
    var payload = response.text();
    var jsonResult = JSON.parse(payload);
    wasLogoutSuccessful = jsonResult.result;
  }
  
  return wasLogoutSuccessful;
}


//// MAIN
(function () {
  // Default outcome
  outcome = OUTCOMES.ERROR;
  
  var sessionCookie = getSessionCookie();
  var uid = nodeState.get("_id").toString();
  
  if (!sessionCookie || !uid) {
    outcome = OUTCOMES.NO_SESSION; 
  } else if (logoutByUser(sessionCookie, uid)) {
    // If you had an external REST API, you could call the library script here
    // e.g. externalAPI.logoutByUser(uid, ssoToken);
    outcome = OUTCOMES.SUCCESS;
  } else {
    outcome = OUTCOMES.FAILURE;
  }

  action.goTo(outcome);
}());