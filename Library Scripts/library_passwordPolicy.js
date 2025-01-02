/*
Name: library_passwordPolicy
Description: Takes a password configuration and evaluates the inputted password based on that configuration.

This library script evaluates password policy requirements. Used to provide custom password policies through Journeys.

This script expects the creation of a passwordPolicy object, with its values translated into the configuration variables defined in the constructor.
For ease of use, it is suggested to add a passwordPolicy object attribute on your Organization for quick administrative updating.

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

/**
 * Takes a password configuration and evaluates the inputted password based on that configuration.
 * 
 * Example Usage:
 * ```
 * const config = {
 *  minPasswordLength: 5,
 *  requireUpperCase: true,
 *  requireLowerCase: true,
 *  requireNumber: true,
 *  requireSpecialChar: true,
 *  requireNoRepeatChars: true
 * };
 * console.log(passwordPolicy.evaluatePassword(this, config, 'Example!123ee', userId)); // { valid: false, message: ["Must not contain any repeated characters (e.g. aaa)"]}
 * ```
 */

//// METHODS
/**
 * @param {this} caller (Use `this`) The parent context, used to get FR functions
 * @param config the config gathered for this policy
 * @param config.oid the organization identifier
 * @param config.minPasswordLength the minimum password length allowed. Must be greater than 0
 * @param config.disallowedUserAttributes a list of user attributes not allowed within the password
 * @param config.disallowedOrgAttributes a list of organization attributes not allowed within the password - requires config.oid
 * @param config.reqireNoCommonlyUsedPasswords no commonly used passwords
 * @param config.requireUpperCase > 1 Upper Case Letter (English)
 * @param config.requireLowerCase > 1 Lower Case Letter (English)
 * @param config.requireNumber > 1 Number (0-9)
 * @param config.requireSpecialChar > 1 Special Character (e.g. !@#$%)
 * @param config.requireNoRepeatChars No Repetitive Characters (e.g. aaa)
 * @param password the password to evaluate
 * @param uid the user which is looking to use this password - can be null 
 * @return {object} whether or not the password is valid. Returns {valid: boolean, evaluation: Array({valid: boolean, evaluation: {policy: message, passed: true/false}})}
 */
exports.evaluatePassword = (caller, config, password, uid) => {
  this.minPasswordLength = (config.minPasswordLength && typeof config.minPasswordLength === 'number') ? config.minPasswordLength : 1;
  this.disallowedUserAttributes = config.disallowedUserAttributes ? config.disallowedUserAttributes : [];
  this.disallowedOrgAttributes = config.disallowedOrgAttributes ? config.disallowedOrgAttributes : [];
  this.requireUpperCase = !!config.requireUpperCase || false;
  this.requireLowerCase = !!config.requireLowerCase || false;
  this.requireNumber = !!config.requireNumber || false;
  this.requireSpecialChar = !!config.requireSpecialChar || false;
  this.requireNoRepeatChars = !!config.requireNoRepeatChars || false;

  // Object of policy requirements. In object here to make localization easier - add country codes to this section and it will apply to each policy
  this.policyRequirements = {
      minPasswordLength: `Must be at least ${this.minPasswordLength} characters long`,
      disallowedUserAttributes: `Must not contain values that are part of your account (e.g. name, email, username)`,
      disallowedOrgAttributes: `Must not contain easy-to-guess values that relate back to the platform (e.g. the Company Name)`,
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
    policyEval = this.evaluatePasswordLength(password);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.minPasswordLength,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
  }
  if (this.disallowedUserAttributes.length > 0) {
    policyEval = this.evaluateDisallowedUserAttributes(caller, password, uid, disallowedUserAttributes);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.disallowedUserAttributes,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
  }
  if (this.disallowedOrgAttributes.length > 0) {
    // @TODO: pass orgID vs userId
    policyEval = this.evaluateDisallowedOrgAttributes(caller, password, uid, disallowedOrgAttributes);
    
    policiesEvaluated.push({
       policy: this.policyRequirements.disallowedOrgAttributes,
       passed: policyEval
    });

    totalPolicyEval = totalPolicyEval & policyEval;
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
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluatePasswordLength(password) {
  return password.length >= this.minPasswordLength;
}

/**
     * Determines if the password contains any attributes defined on the user object
     * @param {this} caller (Use `this`) The parent context, used to get FR functions
     * @param password the password to evaluate
     * @param uid the user identifier, used to evaluate if the user's attributes exist in this password
     * @param {array} attributes the attributes validated to not be within the user's password
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluateDisallowedUserAttributes(caller, password, uid, attributes) {
  // @TODO add in logic here. Will require openidm context passed OR user attributes (during registration)
  return true;
}

/**
     * Determines if the password contains any attributes defined on the org object
     * @param {this} caller (Use `this`) The parent context, used to get FR functions
     * @param password the password to evaluate
     * @param orgId the org identifier, used to evaluate if the org's attributes exist in this password
     * @param {array} attributes the attributes validated to not be within the user's password
     * @return {boolean} whether or not the password passes evaluation
     */
function evaluateDisallowedOrgAttributes(caller, password, orgId, attributes) {
  // @TODO add in logic here. Will require openidm context passed
  return true;
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