/**
 * DISCLAIMER: This code is provided to you expressly as an example (“Sample Code”). It is the responsibility of the individual recipient user, in his/her sole discretion, to diligence such Sample Code for accuracy, completeness, security, and final determination for appropriateness of use.
 * ANY SAMPLE CODE IS PROVIDED ON AN “AS IS” IS BASIS, WITHOUT WARRANTY OF ANY KIND. FORGEROCK AND ITS LICENSORS EXPRESSLY DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, OR FITNESS FOR A PARTICULAR PURPOSE.
 * FORGEROCK SHALL NOT HAVE ANY LIABILITY ARISING OUT OF OR RELATING TO ANY USE, IMPLEMENTATION, INTEGRATION, OR CONFIGURATION OF ANY SAMPLE CODE IN ANY PRODUCTION ENVIRONMENT OR FOR ANY COMMERCIAL DEPLOYMENT(S).
 */

/* PolicyEvalMod
 * 
 * Queries the existing policy sets and filters policy results by subject and permission.
 * 
 * Requires the creation of the AgentLogin Journey, which Authenticates a Gateway using its client id and secret.
 *
 * The following ESVs need to be set for this script to work:
 * - esv-tenant-env-fqdn: The fully qualified domain name of the tenant, e.g. openam-example.forgeblocks.com
 * - esv-cookie: The tenant cookie, used as the header alongside the SSO token
 * - esv-policy-gateway-id: The ID of the Gateway being used to generate an SSO token capable of evaluating policies
 * - esv-policy-gateway-secret: The Secret of the Gateway being used to generate an SSO token capable of evaluating policies
 * 
 */

/// CONSTANTS
var TENANT_FQDN = `https://${systemEnv.getProperty("esv.tenant.env.fqdn")}`;
var COOKIE = systemEnv.getProperty("esv.cookie");
var POLICY_GATEWAY_ID = systemEnv.getProperty("esv.policy.gateway.id");
var POLICY_GATEWAY_SECRET = systemEnv.getProperty("esv.policy.gateway.secret");
var AGENT_LOGIN_JOURNEY = "AgentLogin"; // Authenticate the Policy Agent
var AM_ROUTE = "/am/json/realms/root/realms/alpha";
var API_REGEX = /api:\/\/(.*)\/(.*)/; // api://{audience}/{permission}

var fr = JavaImporter(
  org.forgerock.http.protocol.Request,
);

/// HELPERS
/**
* Generates the Policy Evaluation access token from the gateway
* @return {String} The generated access token
*/
function getPolicyEvalAccessToken() {
  var tokenId = "";

  var request = fr.Request();

  // The AgentLogin route is a Journey that only accepts Gateway authentication, effectively locking it from User tampering.
  var gatewayValidationURI = `${TENANT_FQDN}${AM_ROUTE}/authenticate?authIndexType=service&authIndexValue=${AGENT_LOGIN_JOURNEY}`;
  var restBody = "{}";
  request.setMethod('POST');
  request.setUri(encodeURI(gatewayValidationURI));
  request.getHeaders().add("X-OpenAM-Username", POLICY_GATEWAY_ID);
  request.getHeaders().add("X-OpenAM-Password", POLICY_GATEWAY_SECRET);
  request.getHeaders().add("content-type", "application/json");
  request.getHeaders().add("Accept-API-Version", "resource=2.1");
  request.getEntity().setString(restBody);

  var response = httpClient.send(request).get();

  if (response.getStatus().getCode() === 200) {
    var payload = response.getEntity().getString();
    var jsonResult = JSON.parse(payload);
    tokenId = jsonResult.tokenId;
  }

  return tokenId;
}

/**
 * Evaluates token policy
 * @param {string} authToken The auth token of the gateway used to evaluate the policy
 * @param {string} audience The audience of the claim
 * @param {string} scopes The scope(s) of the claim
 * @return {object} The available permissions from the claim(s)
 */
function evaluatePermissions(authToken, audience, scopes) {
  var permissions = [];

  if (!authToken)
    return actions;

  var request = fr.Request();

  var policyURI = `${TENANT_FQDN}${AM_ROUTE}/policies?_action=evaluate`;
  request.setMethod('POST');
  request.setUri(encodeURI(policyURI));
  request.getHeaders().add("content-type", "application/json");
  request.getHeaders().add("Accept-API-Version", "resource=2.0, protocol=1.0");
  request.getHeaders().add(COOKIE, authToken);

  var resources = [];
  scopes.forEach(function(scopeElement) {
    var resource = `api://${audience}/${scopeElement}`;
    resources.push(resource);
  });

  var subjectName = accessToken.getResourceOwnerId(); // Get the ID of the requesting Subject (user, app)
  var clientId = accessToken.getClientId(); // Get the ID of the client where the request is originating
  var restBodyPolicy = `{\
    "resources": ["${resources.join('","')}"], \
    "application": "${audience}",\
    "subject":{"claims":{"sub":"id=${POLICY_GATEWAY_ID},ou=agent,o=alpha,ou=services,ou=am-config","subject":"${subjectName}", "client": "${clientId}"}}}`;
  request.getEntity().setString(restBodyPolicy);

  response = httpClient.send(request).get();

  if (response.getStatus().getCode() === 200) {
    var payload = response.getEntity().getString();
    var jsonResult = JSON.parse(payload);
    permissions = jsonResult; // This should be an array that contains resources and actions defined by scope
  }
  
  return permissions;
}

/// MAIN
(function () {
  // Parse scope and evaluate permissions
  var scopes = accessToken.getScope();

  // API Permission
  var apiRegexP = API_REGEX;
  var requestedAPIAudience = "";
  var requestedAPIScopes = []; 
  
  scopes.toArray().forEach(function(scope) {
    // Check for an API permission policy
    var apiRegexMatch = apiRegexP.exec(scope.toString());
    if (apiRegexMatch != null) {
      // Capture the parsed audience and scope
      var apiAud = apiRegexMatch[1];
      var apiScope = apiRegexMatch[2];

      // Use the scopes from the first audience requested.
      // Remove the scopes from any subsequent audience.
      // You could hypothetically check each audience as well here.
      if (!requestedAPIAudience || requestedAPIAudience == apiAud) {
        requestedAPIAudience = apiAud;
        requestedAPIScopes.push(apiScope);
      }
    }
  });

  // Initially deny the policyResult unless validated below.
  accessToken.setField("policyResult", false);
  // Perform policy validation, either on the client or through the Policy Engine
  if (requestedAPIScopes.length > 0) {
    // Audience with special scopes found. Evaluate with policy engine
    scopes.clear();

    var authToken = getPolicyEvalAccessToken();
    // Evaluate if the permission(s) combination is valid for this subject
    var permissions = evaluatePermissions(authToken, requestedAPIAudience, requestedAPIScopes);

    var hasValidGrant = false;
    permissions.forEach(function(permission) {
      var resource = permission.resource;
      var actions = permission.actions;
      
      var resourceRegexMatch = apiRegexP.exec(resource);
      var validScope = resourceRegexMatch[2];
      
      if (Object.keys(actions).length > 0 && actions.GRANT) {
        accessToken.setField("policyResult", true);
        scopes.add(validScope);
        hasValidGrant = true;
      }
    });

    if (hasValidGrant) {
      accessToken.setField("aud", requestedAPIAudience);
    }

  } else {
    // Evaluate Scopes on client.
    var requestedScopes = new java.util.HashSet(scopes);
    if (requestedScopes) {
      var availableScopes = new java.util.HashSet(clientProperties.allowedScopes);
      availableScopes.retainAll(requestedScopes);
      
      // return scopes available
      scopes = availableScopes;
    } else {
      scopes = defaultScopes;
    }
  }
  // Set the valid scopes according to what was found in policy evaluation
  accessToken.setScope(scopes);
}());