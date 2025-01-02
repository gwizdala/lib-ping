/*
  Name: library_logger
  Description: Logs function details with a custom tag for ease of finding within logs

 This script outputs logs in a consistent format including a custom identifier stored in an ESV.
 If no ESV is provided, the log identifier defaults to `Zephyr`.
 Expected esv:
 - esv.log-identifier The identifier for the logger

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
// https://backstage.forgerock.com/docs/idcloud/latest/am-scripting/next-generation-scripts.html#v2-logger
const LOG_LEVELS = {
    TRACE: "trace",
    DEBUG: "debug", 	// default for Development and Sandbox Environments
    INFO: "info",
    WARN: "warn", 	// default for Staging and Production Environments
    ERROR: "error"
};
const DEFAULT_LOG_LEVEL = LOG_LEVELS.DEBUG;

/**
 * Logs to the ForgeRock AM console in a standardized way
 * @param {this} caller (Use `this`) The parent context, used to get FR functions
 * @param {object} options The details to return in the function
 * @param {string} options.callingFunction The name of the function where the log is executed
 * @param {string} options.identifier The unique string prepended to the log to help in searching. Defaults to an environment variable or "Zephyr"
 * @param {string} options.level The log level to send. Options are found at https://backstage.forgerock.com/docs/idcloud/latest/am-scripting/next-generation-scripts.html#v2-logger
 * @param {string} options.message The message to include with the log
 * @param {string} options.scriptName The AM Auth Script this log is called in. Can be retrieved with `scriptName`
 * @return null
 */
exports.logFormatted = function(caller, options) {
    const LOG_IDENTIFIER = caller.systemEnv.getProperty('esv.log.identifier', 'Zephyr');
    // Default values for options
    const response = {
        callingFunction: "N/A",
        identifier: LOG_IDENTIFIER,
        level: DEFAULT_LOG_LEVEL,
        message: "N/A",
        scriptName: "N/A"
    };
    const now = new Date();

    // Union the options with the defaults (options override)
    Object.assign(response, options);

    if (!LOG_LEVELS[response.level.toUpperCase()]) {
        // Ensure that the log level exists
        response.level = DEFAULT_LOG_LEVEL;
    } else {
        // Ensure that the log level matches the function syntax
        response.level = response.level.toLowerCase();
    }

    const output = `**** Log ID: ${response.identifier} ****
    ==== START LOG ====
    Logged At	: ${now.toISOString()}
    Log Level	: ${response.level}
    Script	: ${response.scriptName}
    Function	: ${response.callingFunction}
    Message	: ${response.message}
    ==== END LOG ====`;

    caller.logger[response.level](output);
};