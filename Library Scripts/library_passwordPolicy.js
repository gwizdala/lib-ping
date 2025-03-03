/*
 This library script evaluates password policy requirements. Used to provide custom password policies through Journeys.

 This script expects the creation of a passwordPolicy object, with its values translated into the variables defined in the constructor.
 For ease of use, it is suggested to add a passwordPolicy object attribute on your Organization for quick administrative updating.

 Frodo command:
 frodo script import -f library_passwordPolicy.js <tenant> 

 Author: @gwizdala
 */

/**
* Note that Rhino ES2015 has the following engine compatibility: 
* https://mozilla.github.io/rhino/compat/engines.html
* Default function parameters and object destructuring are not supported
* It is suggested to stick to "vanilla javascript" where possible
*/

/**
 * Takes a password and a password policy and evaluates the inputted password based on that policy.
 * 
 * Example Usage:
 * ```
 * const passwordPolicy = {
 *  requireUpperCase: true,
 *  requireNoRepeatChars: true
 * };
 * logger.info(passwordPolicy.evaluatePassword(this, passwordPolicy, 'Example!123ee')); 
 * // { valid: false, evaluation: [{ policy: "Must not contain any repeated characters (e.g. aaa)", passed: false }, { policy: "Must contain at least one uppercase character", passed: true }]}
 * logger.info(passwordPolicy.evaluatePassword(this, passwordPolicy, 'example!')); 
 * // { valid: false, evaluation: [{ policy: "Must not contain any repeated characters (e.g. aaa)", passed: true }, { policy: "Must contain at least one uppercase character", passed: false }]}
 * 
 * const userConfig = {
 *  uid: 123-456-789,
 *  orgId: 098-765-432,
 *  objectAttributes: {
 *    givenName: 'MyNew',
 *    sn: 'Name',
 *    userName: 'example'
 *  }
 * }
 * 
 * const userAttributeConfig = {
 *  disallowedUserAttributes: ['userName', 'givenName', 'sn', 'mail']
 * };
 * // User's username is "example"
 * logger.info(passwordPolicy.evaluatePassword(this, userAttributeConfig, 'Example!123ee', userConfig)); 
 * // { valid: false, evaluation: [{ policy: "Must not contain values that are part of your account (e.g. name, email, username)" passed: false }]}
 * 
 * const orgAttributeConfig = {
 *  disallowedOrgAttributes: ['name', 'description']
 * };
 * // Org's name is 'Org'
 * logger.info(passwordPolicy.evaluatePassword(this, orgAttributeConfig, 'Org!123ee', userConfig)); 
 * // { valid: false, evaluation: [{ policy: "Must not contain easy-to-guess values that relate back to the platform (e.g. the Company Name)", passed: false }]}
 * ```
 */

//// UTILITY FUNCTIONS
function getFieldsFromAttributesArray(attributes) {
    var fields = "";
    if (attributes) {
      for (var i = 0; i < attributes.length; i++) {
        if (i > 0) {
          fields += ","; 
        }
        fields += attributes[i];
      }   
    }

    return fields;
}

//// METHODS
/**
 * @param {this} caller (Use `this`) The parent context, used to get FR functions
 * -- Password Config
 * @param passwordPolicy the passwordPolicy gathered for this policy
 * @param passwordPolicy.minPasswordLength the minimum password length allowed. Must be greater than 0
 * @param passwordPolicy.maxPasswordLength the maximum password length allowed. Must be greater than or equal to minPasswordLength
 * @param passwordPolicy.disallowedUserAttributes a list of user attributes not allowed within the password - requires userId or objectAttributes
 * @param passwordPolicy.disallowedOrgAttributes a list of organization attributes not allowed within the password - requires orgId
 * @param passwordPolicy.reqireNoCommonlyUsedPasswords no commonly used passwords. Uses the EXTERNAL HaveIBeenPwned API - use at your own risk
 * @param passwordPolicy.requireUpperCase > 1 Upper Case Letter (English)
 * @param passwordPolicy.requireLowerCase > 1 Lower Case Letter (English)
 * @param passwordPolicy.requireNumber > 1 Number (0-9)
 * @param passwordPolicy.requireSpecialChar > 1 Special Character (e.g. !@#$%)
 * @param passwordPolicy.requireNoRepeatChars No Repetitive Characters (e.g. aaa)
 * -- The Password
 * @param password the password to evaluate
 * -- Nullable Values:
 * @param userContext.uid the user's _id. Used to evaluate disallowedUserAttributes
 * @param userContext.orgId the organization that this password is related to. Used to evaluate disallowedOrgAttributes
 * @param userContext.objectAttributes the values that the user is looking to use to update/create alongside their password. Used along with uid to evaluate disallowedUserAttributes
 * @return {object} whether or not the password is valid. Returns {valid: boolean, evaluation: Array({valid: boolean, evaluation: {id: passwordPolicyKey, policy: message, passed: true/false}})}
 */
exports.evaluatePassword = (caller, passwordPolicy, password, userContext) => {
  this.minPasswordLength = (passwordPolicy.minPasswordLength && typeof passwordPolicy.minPasswordLength === 'number') ? passwordPolicy.minPasswordLength : 1;
  this.maxPasswordLength = (passwordPolicy.maxPasswordLength && typeof passwordPolicy.maxPasswordLength === 'number') ? passwordPolicy.maxPasswordLength : null;
  this.disallowedUserAttributes = passwordPolicy.disallowedUserAttributes ? passwordPolicy.disallowedUserAttributes : [];
  this.disallowedOrgAttributes = passwordPolicy.disallowedOrgAttributes ? passwordPolicy.disallowedOrgAttributes : [];
  this.reqireNoCommonlyUsedPasswords = !!passwordPolicy.reqireNoCommonlyUsedPasswords || false;
  this.requireUpperCase = !!passwordPolicy.requireUpperCase || false;
  this.requireLowerCase = !!passwordPolicy.requireLowerCase || false;
  this.requireNumber = !!passwordPolicy.requireNumber || false;
  this.requireSpecialChar = !!passwordPolicy.requireSpecialChar || false;
  this.requireNoRepeatChars = !!passwordPolicy.requireNoRepeatChars || false;

  // Object of policy requirements. In object here to make localization easier - add country codes to this section and it will apply to each policy
  // e.g. minPasswordLength: { "en": "The english requirements", "es": "Los requisitos españoles" }
  this.policyRequirements = {
      minPasswordLength: `Must be at least ${this.minPasswordLength} characters long`,
      maxPasswordLength: `Must be at most ${this.maxPasswordLength} characters long`,
      disallowedUserAttributes: `Must not contain values that are part of your account (e.g. name, email, username)`,
      disallowedOrgAttributes: `Must not contain easy-to-guess values that relate back to the platform (e.g. the Company Name)`,
      requireNoCommonlyUsedPasswords: `Must not be a commonly used password (e.g. 'Password123')`,
      requireUpperCase: `Must contain at least one uppercase character`,
      requireLowerCase: `Must contain at least one lowercase character`,
      requireNumber: `Must contain at least one number`,
      requireSpecialChar: `Must contain at least one special character (e.g. !@#$%^&)`,
      requireNoRepeatChars: `Must not contain any repeated characters (e.g. aaa)`
  };
    
  var policiesEvaluated = []; // { policy: description, passed: true/false } All policies evaluated and what succeeded/failed
  var policyEval = true; // the evaluation value. Will be tested for each policy 
  var totalPolicyEval = true; // the complete evaluation of the whole policy. Will return false if any policy fails

  if (this.minPasswordLength) {
    policyEval = this.evaluatePasswordLength(password, this.minPasswordLength);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.minPasswordLength,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
  }
  if (this.maxPasswordLength) {
    policyEval = this.evaluatePasswordLength(password, this.minPasswordLength, this.maxPasswordLength);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.maxPasswordLength,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
  }
  if (this.disallowedUserAttributes.length > 0) {
    policyEval = this.evaluateDisallowedUserAttributes(caller, password, userContext, this.disallowedUserAttributes);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.disallowedUserAttributes,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
  }
  if (this.disallowedOrgAttributes.length > 0) {
    policyEval = this.evaluateDisallowedOrgAttributes(caller, password, userContext, this.disallowedOrgAttributes);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.disallowedOrgAttributes,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
  }
  if (this.reqireNoCommonlyUsedPasswords) {
    policyEval = this.evaluateNoCommonlyUsedPasswords(caller, password);

    policiesEvaluated.push({
      policy: this.policyRequirements.requireNoCommonlyUsedPasswords,
      passed: policyEval
    })
  }
  if (this.requireUpperCase) {
    policyEval = this.evaluateUpperCase(password);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.requireUpperCase,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
  }
  if (this.requireLowerCase) {
    policyEval = this.evaluateLowerCase(password);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.requireLowerCase,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
  }
  if(this.requireNumber) {
    policyEval = this.evaluateNumber(password);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.requireNumber,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
  }
  if (this.requireSpecialChar) {
    policyEval = this.evaluateSpecialChars(password);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.requireSpecialChar,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
  }
  if (this.requireNoRepeatChars) {
    policyEval = this.evaluateRepetitiveChars(password);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.requireNoRepeatChars,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
  }

  return {
    valid: totalPolicyEval,
    evaluation: policiesEvaluated
  };
}

/// Private Methods
/**
     * Determines if the password meets minimum password requirements
     * @param password the password to evaluate
     * @param minLength the minimum length of the password. Must be greater than 0
     * @param maxLength the maximum length of the password. Must be greater than minLength
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluatePasswordLength(password, minLength, maxLength) {
  var minLengthToEvaluate = 1;
  var isCompliant = true;

  if (minLength && minLength > 0) {
    isCompliant = password.length >= minLength;
    minLengthToEvaluate = minLength;
  }
  
  if (maxLength && maxLength >= minLengthToEvaluate) {
    isCompliant = password.length <= maxLength;
  }

  return isCompliant;
}

/**
     * Determines if the password contains any attributes defined on the user object.
     * If the user does not exist, then the policy will evaluate to true.
     * @param {this} caller (Use `this`) The parent context, used to get FR functions
     * @param password the password to evaluate
     * @param userAttributes the metadata on the user to evaluate
     * @param {array} attributesToEvaluate the attributes validated to not be within the user's password
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluateDisallowedUserAttributes(caller, password, userAttributes, attributesToEvaluate) {
  // Evaluate if any of the attributes trigger a policy violation
  var isCompliant = true;
  var attributesIndex = 0;

  if (!!userAttributes) {
    // Get pre-existing user data, if it exists
    var userMetadata = !!userAttributes.uid ? caller.openidm.read(`managed${caller.realm}_user/${userAttributes.uid}`, null, attributesToEvaluate) : {};
    // Merge the data with the updated values
    if (!!userAttributes.objectAttributes) {
      Object.assign(userMetadata, userAttributes.objectAttributes);
    }

    if (!!userMetadata && Object.keys(userMetadata).length > 0) {
      while(isCompliant && attributesIndex < attributesToEvaluate.length) {
        var attribute = attributesToEvaluate[attributesIndex];
        var attributeValue = userMetadata[attribute];
    
        isCompliant = !password.includes(attributeValue);
    
        attributesIndex += 1;
      } 
    }
  }

  return isCompliant;
}

/**
     * Determines if the password contains any attributes defined on the org object.
     * If the org does not exist, then the policy will evaluate to true.
     * @param {this} caller (Use `this`) The parent context, used to get FR functions
     * @param password the password to evaluate
     * @param userAttributes the metadata on the user to evaluate
     * @param {array} attributesToEvaluate the attributes validated to not be within the user's password
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluateDisallowedOrgAttributes(caller, password, userAttributes, attributesToEvaluate) {
  var orgMetadata = !!userAttributes && !!userAttributes.orgId ? caller.openidm.read(`managed${caller.realm}_organization/${userAttributes.orgId}`, null, attributesToEvaluate) : null;

  // Evaluate if any of the attributes trigger a policy violation
  var isCompliant = true;
  var attributesIndex = 0;

  if (!!orgMetadata && Object.keys(orgMetadata).length > 0) {
    while(isCompliant && attributesIndex < attributesToEvaluate.length) {
      var attribute = attributesToEvaluate[attributesIndex];
      var attributeValue = orgMetadata[attribute];
  
      isCompliant = !password.includes(attributeValue);
  
      attributesIndex += 1;
    } 
  }

  return isCompliant;
}

/**
     * Determines if the password is found on the common list of passwords defined at [HaveIBeenPwned](https://haveibeenpwned.com/Passwords).
     * This search uses a k-Anonymity model to protect the value of the source password ([link](https://haveibeenpwned.com/API/v2#PwnedPasswords)), 
     * however you should still exercise caution when sending sensitive data via a public REST API. Use this policy with caution.
     * @param {this} caller (Use `this`) The parent context, used to get FR functions
     * @param password the password to evaluate
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluateNoCommonlyUsedPasswords(caller, password) {
  var passwordData = caller.utils.types.stringToBytes(password);
  var passwordHash = caller.utils.crypto.subtle.digest("SHA-1", passwordData);
  var passwordHashString = String(passwordHash.map((byte) => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join("")).toUpperCase(); // converts bytes to hex string
  var hashPrefix = passwordHashString.substring(0,5);
  var hashSuffix = passwordHashString.substring(5);
  var isCompliant = true;

  var requestURL = `https://api.pwnedpasswords.com/range/${hashPrefix}`;
  var options = {
    method: "GET"
  };
  var response = caller.httpClient.send(requestURL, options).get();

  if (response.status === 200) {
    var payload = response.text();
    var hashData = payload.split('\n');

    var hashDataIndex = 0;

    // Check if this password is on the compromised list
    while(isCompliant && hashDataIndex < hashData.length) {
      var hashDataValue = hashData[hashDataIndex];
      var hashDataSuffix = hashDataValue.split(':')[0];

      isCompliant = hashSuffix != hashDataSuffix;

      hashDataIndex += 1;
    }
  } else {
    throw(`HaveIBeenPwned API returned error: ${e}`);
  }

  return isCompliant;
}

/**
     * Determines if the password contains any uppercase letters
     * @param password the password to evaluate
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluateUpperCase(password) {
  const isContainsUppercase = /^(?=.*[A-Z]).*$/;
  return isContainsUppercase.test(password);
}

/**
     * Determines if the password contains any lowercase letters
     * @param password the password to evaluate
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluateLowerCase(password) {
  const isContainsLowercase = /^(?=.*[a-z]).*$/; 
  return isContainsLowercase.test(password);
}

/**
     * Determines if the password contains any numbers
     * @param password the password to evaluate
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluateNumber(password) {
  const isContainsNumber = /^(?=.*[0-9]).*$/;
  return isContainsNumber.test(password);
}

/**
     * Determines if the password contains any special chars
     * @param password the password to evaluate
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluateSpecialChars(password) {
  const isContainsSymbol = /^(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹]).*$/; 
  return isContainsSymbol.test(password);
}

/**
     * Determines if the password contains any repetitive characters
     * @param password the password to evaluate
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluateRepetitiveChars(password) {
  var chars = password.split("");
  var prevValue = "";
  for (var i = 0; i < chars.length; i++) {
    var char = chars[i];
    if (prevValue === char) {
      return false;
    }

    prevValue = char;
  }

  return true;
}