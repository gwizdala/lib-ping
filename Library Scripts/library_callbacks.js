/*
Name: library_callbacks
Description: 
    This script collapses the required logic needed to render complicated callback chains within a node
    using the callbacksBuilder (https://docs.pingidentity.com/pingoneaic/latest/am-authentication/callbacks-supported.html)

Frodo command:
frodo script import -f library_callbacks.js <tenant>
 
 Author: @gwizdala
 */

/**
* Note that Rhino ES2015 has the following engine compatibility: 
* https://mozilla.github.io/rhino/compat/engines.html
* Default function parameters and object destructuring are not supported
* It is suggested to stick to "vanilla javascript" where possible
*/

//// UTILITY FUNCTIONS

//// EXPORTS
/**
 * Given a list of interactive callbacks, render each callback option.
 * @param {Array} inputs - The list of callback options to render.
 * @param {Object} callbacksBuilder - The callbacks builder object used to render the callbacks.
 * @throws {Error} - If the callback type is unknown.
 */
exports.renderInteractiveCallbackOptions = function(inputs, callbacksBuilder) {
    inputs.forEach(function(input) {
        switch(input.type) {
            case "NameCallback":
                if (input.name) {
                    callbacksBuilder.nameCallback(input.label, input.name);
                } else {
                    callbacksBuilder.nameCallback(input.label);
                }
                break;
            case "PasswordCallback":
                callbacksBuilder.passwordCallback(input.label, false);
                break;
            case "HiddenValueCallback":
                callbacksBuilder.hiddenValueCallback(input.id, input.value);
                break;
            case "BooleanAttributeInputCallback":
                callbacksBuilder.booleanAttributeInputCallback(input.id, input.label, !!input.value, false);
                break;
            case "ChoiceCallback":
                var choices = [];
                input.choices.forEach(function(choice) {
                    choices.push(choice.label);
                });
                callbacksBuilder.choiceCallback(input.label, choices, 0, false);
                break;
            case "ConfirmationCallback":
                // WARNING: You probably only want one confirmationcallback, as this renders buttons for the user to select from
                var choices = [];
                input.choices.forEach(function(choice) {
                    choices.push(choice.label);
                });
                callbacksBuilder.confirmationCallback(0, choices, 0);
                break;
            default:
                throw(`Unknown Callback: ${input.label}`);
        }
    });
};

/**
 * Given a list of interactive callbacks, gather each callback option
 * @param {Array} inputs - The list of callback options to gather.
 * @param {Object} callbacks - The callbacks object used to gather the responses.
 * @returns {Object} - The gathered callback responses, keyed to their ID
 * @throws {Error} - If the callback type is unknown.
 */
exports.gatherInteractiveCallbackResponses = function(inputs, callbacks) {
    var responses = {};
    var receivedCallbacks = {}; // callbackType: { callbacksObject, currentIndex }
    inputs.forEach(function(input) {
        if (receivedCallbacks[input.type]) {
            receivedCallbacks[input.type].index += 1;
        } else {
            receivedCallbacks[input.type] = {
                callbacksObject: callbacks[`get${input.type}s`](),
                index: 0
            };
        }
        var currentCallback = receivedCallbacks[input.type].callbacksObject.get(receivedCallbacks[input.type].index);
        switch(input.type) {
            case "NameCallback":
                responses[input.id] = currentCallback;
                break;
            case "PasswordCallback":
                responses[input.id] = currentCallback;
                break;
            case "HiddenValueCallback":
                // We aren't updating this value, so we just store what was hidden
                responses[input.id] = input.value;
                break;
            case "BooleanAttributeInputCallback":
                responses[input.id] = currentCallback ? true : false;
                break;
            case "ChoiceCallback":
                // Gather the value stored within the input array itself. To do this, we get the received callback index and then reference the "value" key
                responses[input.id] = input.choices[currentCallback[0]].value;
                break;
            case "ConfirmationCallback":
                responses[input.id] = input.choices[currentCallback].value;
                break;
            default:
                throw(`Unknown Callback: ${input.label}`);
        }
    });
    return responses;
};