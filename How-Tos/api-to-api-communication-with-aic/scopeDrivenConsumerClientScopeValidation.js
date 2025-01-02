/**
 * DISCLAIMER: This code is provided to you expressly as an example (“Sample Code”). It is the responsibility of the individual recipient user, in his/her sole discretion, to diligence such Sample Code for accuracy, completeness, security, and final determination for appropriateness of use.
 * ANY SAMPLE CODE IS PROVIDED ON AN “AS IS” IS BASIS, WITHOUT WARRANTY OF ANY KIND. FORGEROCK AND ITS LICENSORS EXPRESSLY DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, OR FITNESS FOR A PARTICULAR PURPOSE.
 * FORGEROCK SHALL NOT HAVE ANY LIABILITY ARISING OUT OF OR RELATING TO ANY USE, IMPLEMENTATION, INTEGRATION, OR CONFIGURATION OF ANY SAMPLE CODE IN ANY PRODUCTION ENVIRONMENT OR FOR ANY COMMERCIAL DEPLOYMENT(S).
 */

/* scopeDrivenConsumerClientScopeValidation
 * 
 * Offloads scope validation to the Policy Engine via the policyEvalMod script.
 * 
 * This script is used as a Scope Validation Script under the OAuth2 Provider Overrides.
 * It should be used by itself.
 * 
 */
function validateScopes() {
  var frJava = JavaImporter(
    org.forgerock.oauth2.core.exceptions.InvalidScopeException
  )

  var scopes
  if (requestedScopes) {
    scopes = requestedScopes
  } else {
    scopes = defaultScopes
  }

  if (scopes) 
  {
      // Validation succeeded.
      return scopes
  } 
  else 
  {
    scopes = new java.util.HashSet()
    scopes.add('no_scopes')
    return scopes
  }
}

function validateAuthorizationScope() {
  return validateScopes()
}

function validateAccessTokenScope() {
  return validateScopes()
}

function validateRefreshTokenScope() {
  return validateScopes()
}

function validateBackChannelAuthorizationScope() {
  return validateScopes()
}