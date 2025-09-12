/*
Scripted Decision Node Example. Put this into a Journey to see how the Library Script 'library_callbacks' works.
This example renders a series of interactive callbacks from a library script, optionally formats them and then stores the results into a collection in shared state.

This script does not need to be parametrized. It will work properly as is.
This script expects the library script 'library_callbacks' to function.
 
 The scripted decision node needs the following outcomes defined:
    - Success
    - Error

author: @gwizdala
*/

//// CONSTANTS
var libraryCallbacks = require('library_callbacks');
var CONSTANTS = {
    SHARED_STATE_KEY: "inputValues"
};

var NodeOutcome = {
    SUCCESS: "Success",
    ERROR: "Error"
};

var INPUTS = [
    {
        id: "customNameCallback",
        type: "NameCallback",
        label: "Custom Name Callback",
        value: "An Example Default Value"
    },
    {
        id: "customNameCallbackNoValue",
        type: "NameCallback",
        label: "Custom Name Callback without Default Value"
    },
    {
        id: "customNameCallbackWithStyling",
        type: "NameCallback",
        label: "Custom Name Callback With Styling",
        tooltip: "<p>This is an example tooltip.</p><p>It can be <i>styled</i> with HTML!<p>Tooltips and descriptions work on all input types except for:</p><ul><li>BooleanAttributeInputCallbacks</li><li>ChoiceCallbacks</li><li>ConfirmationCallbacks</li></ul>",
        description: "This is an example description. It can only be a string.",
        required: true
    },
    {
        id: "customNameCallbackMultiValue",
        type: "NameCallback",
        label: "Custom Name Callback With Multi Value (Space Separated)",
        delimiter: " ",
        value: "default values supported"
    },
    {
        id: "customPasswordCallback",
        type: "PasswordCallback",
        label: "Custom Password Callback"
    },
    {
        id: "customHiddenValueCallback",
        type: "HiddenValueCallback",
        value: "The Hidden Value"
    },
    {
        id: "customNumberAttributeInputCallback",
        type: "NumberAttributeInputCallback",
        label: "Custom Number Attribute Input Callback",
        value: 10,
        required: false
    },
    {
        id: "customBooleanAttributeInputCallback",
        type: "BooleanAttributeInputCallback",
        label: "Custom Boolean Attribute Input Callback",
        value: true,
        required: false
    },
    {
        id: "customChoiceCallback",
        type: "ChoiceCallback",
        label: "Custom Choice Callback",
        choices: [
            {
                label: "1",
                value: 'First Option Selected'
                
            },
            {
                label: "2",
                value: 2
            },
            {
                label: "3",
                value: {
                    'description': 'values can be any type, including objects!',
                    'value': 'Third Option Selected'
                }
            },
            {
                label: "4",
                value: 'Fourth Option Selected'
            }
        ]
    },
    {
        id: "customConfirmationCallback",
        type: "ConfirmationCallback",
        label: "Custom Confirmation Callback",
        choices: [
            {
                label: "Yes",
                value: 'Yes Selected'
            },
            {
                label: "No",
                value: 'No Selected'
            },
            {
                label: "Maybe",
                value: {
                    'description': 'values can be any type, including objects!',
                    'value': 'Maybe Selected'
                }
            }
        ]
    }
];

//// MAIN
(function() {
    outcome = NodeOutcome.SUCCESS;
    try {
        if (callbacks.isEmpty()) {
            libraryCallbacks.renderInteractiveCallbackOptions(INPUTS, callbacksBuilder);
            libraryCallbacks.formatInteractiveCallbackOptions(INPUTS, callbacksBuilder);
        } else {
            var responses = libraryCallbacks.gatherInteractiveCallbackResponses(INPUTS, callbacks);
            nodeState.putShared(CONSTANTS.SHARED_STATE_KEY, responses);
        }
    } catch(e) {
        logger.error(e);
        outcome = NodeOutcome.ERROR;
    }
    action.goTo(outcome);
}());