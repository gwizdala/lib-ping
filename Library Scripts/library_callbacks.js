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
                // callbacksBuilder.nameCallback(prompt, defaultName)
                // You can optionally provide a delimiter to split the value into multiple values for a single input field.
                if (input.value && input.value.length > 0) {
                    if (!!input.delimiter && Array.isArray(input.value)) {
                        var valuesString = input.value.join(input.delimiter);
                        callbacksBuilder.nameCallback(input.label, valuesString);
                    } else {
                        callbacksBuilder.nameCallback(input.label, input.value);
                    }
                } else {
                    callbacksBuilder.nameCallback(input.label);
                }
                break;
            case "PasswordCallback":
                // callbacksBuilder.passwordCallback(prompt, echoOn)
                callbacksBuilder.passwordCallback(input.label, false);
                break;
            case "HiddenValueCallback":
                // callbacksBuilder.hiddenValueCallback(id, value)
                callbacksBuilder.hiddenValueCallback(input.id, input.value);
                break;
            case "NumberAttributeInputCallback":
                // callbacksBuilder.numberAttributeInputCallback(name, prompt, value, required)
                callbacksBuilder.numberAttributeInputCallback(input.id, input.label, parseInt(input.value, 10), !!input.required);
                break;
            case "BooleanAttributeInputCallback":
                // callbacksBuilder.booleanAttributeInputCallback(name, prompt, value, required)
                callbacksBuilder.booleanAttributeInputCallback(input.id, input.label, !!input.value, !!input.required);
                break;
            case "ChoiceCallback":
                var choices = [];
                input.choices.forEach(function(choice) {
                    choices.push(choice.label);
                });
                // callbacksBuilder.choiceCallback(prompt, choices, defaultChoice, multipleSelectionsAllowed)
                callbacksBuilder.choiceCallback(input.label, choices, 0, false);
                break;
            case "ConfirmationCallback":
                // WARNING: You probably only want one confirmationcallback, as this renders buttons for the user to select from
                var choices = [];
                input.choices.forEach(function(choice) {
                    choices.push(choice.label);
                });
                // callbacksBuilder.confirmationCallback(messageType, options, defaultOption)
                // messageType: 0 = INFO, 1 = WARNING, 2 = ERROR
                callbacksBuilder.confirmationCallback(0, choices, 0);
                break;
            default:
                throw(`Unknown Callback: ${input.type} | ${input.label}`);
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
                if (!!input.delimiter && input.delimiter.length > 0) {
                    // Custom multi-value
                    if (currentCallback.length > 0) {
                        responses[input.id] = currentCallback.split(input.delimiter).map(function(value) {
                            return value.trim();
                        });
                    } else {
                        responses[input.id] = [];
                    }
                } else {
                    responses[input.id] = currentCallback;
                }
                break;
            case "PasswordCallback":
                responses[input.id] = currentCallback;
                break;
            case "HiddenValueCallback":
                // We aren't updating this value, so we just store what was hidden
                responses[input.id] = input.value;
                break;
            case "NumberAttributeInputCallback":
                responses[input.id] = currentCallback;
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
                throw(`Unknown Callback: ${input.type} | ${input.label}`);
        }
    });
    return responses;
};