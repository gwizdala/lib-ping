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
/**
 * Given an input object, return a formatted string that can be used to render the input in a ScriptTextOutputCallback.
 * This function is not supported natively in the SDK.
 * @param {Object} input - The input object containing the properties needed to render the input.
 * @param {Object} callbacksBuilder - The callbacks builder object used to render the callbacks.
 * @returns {string} - The formatted string that can be used to render the input.
 */
exports.formatInteractiveCallbackOptions = function(inputs, callbacksBuilder) {
    var css = `\
    .info-details {\
        text-align: right;\
        position: absolute;\
        padding: 5px;\
        top: 7px;\
        right: -15px;\
        z-index: 2;\
    }\
    .info-details[open] {\
        z-index: 3;\
    }\
    `;
    var script = `\
    var updateInput = function(label, required, description, tooltip) {\
        var input = document.querySelector('*[data-vv-as="' + label + '"]');\
        if (!input) {\
            return;\
        }\
        input.required = !!required;\
        if (description) {\
            var labelElement = document.createElement("p");\
            labelElement.textContent = description;\
            labelElement.style = "font-size: smaller; text-align: left";\
            input.parentNode.appendChild(labelElement);\
        }\
        if (tooltip) {\
            var details = document.createElement("details");\
            details.className = "btn btn-primary info-details";\
            var summary = document.createElement("summary");\
            summary.textContent = "?";\
            var description = document.createElement("p");\
            description.innerHTML = tooltip;\
            description.style = "font-size: smaller; text-align: right";\
            details.appendChild(summary);\
            details.appendChild(description);\
            input.parentNode.parentNode.appendChild(details);\
        }\
    };\
    var updateInputs = function() {\
        var inputs = ${JSON.stringify(inputs)};\
        if (!Array.isArray(inputs)) {\
            inputs = [inputs];\
        }\
        if (inputs.length === 0) {\
            return;\
        }\  
        inputs.forEach(function(input) {\
            updateInput(input.label, input.required, input.description, input.tooltip);\
        });\

        document.head.appendChild(document.createElement("style")).textContent = "${css}";\
    };\
    if (document.readState === "loading") {
        document.addEventListener("DOMContentLoaded", updateInputs);
    } else {
        updateInputs();
    }`;

    callbacksBuilder.scriptTextOutputCallback(String(script));
}

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