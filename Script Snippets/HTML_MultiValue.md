# Multi-Value HTML Input

## Details

- Connector: HTTP
- Capability: Custom HTML Template
- Description: Renders a multi-valued input and stores that input value as a string. Values can be pasted or added with the "enter" key
- Prerequisites: This node expects that the css files `https://assets.pingone.com/ux/end-user-nano/0.1.0-alpha.9/end-user-nano.css` and `https://assets.pingone.com/ux/astro-nano/0.1.0-alpha.11/icons.css` have been added to this flow (Settings -> Customizatons -> Custom CSS Rules).

## Fields

| Field | Value |
|-------|------------------|
| Output Fields List: Field 1 Property Name | buttonValue        |
| Output Fields List: Field 2 Property Name | multiValueString   |

## Snippets


`HTML Template`

```HTML
<div class="end-user-nano">
  <div
    class="bg-light d-flex flex-column justify-content-center align-items-center position-absolute top-0 start-0 bottom-0 end-0">
    <div style="max-width: 400px; width: 100%">
      <div class="card shadow mb-5">
        <div class="card-body p-5 d-flex flex-column">

          {{#if title}}
          <h1 class="text-center mb-4">{{title}}</h1>
          {{/if}}

          {{#if textOne}}
          <p class="text-muted text-center">{{textOne}}</p>
          {{/if}}

          {{#if textTwo}}
          <p class="text-muted text-center">{{textTwo}}</p>
          {{/if}}


          <!-- Generic Error Message -->
          <p id="feedback" data-id="feedback" class="text-danger mdi mdi-alert-circle" data-skcomponent="skerror"></p>

          <!-- Field Validation Error Messages -->

          <form id="myForm" data-id="myForm" class="form">
            <div class="mb-4 form-floating">
              <div id="multiValueContainer" class="form-control d-flex flex-wrap align-items-center gap-2 mb-3 multi-value-container" style="height: 100%;">
                <!-- We are injecting tags here -->
                <input 
                  id="tagInput" 
                  class="form-control border-0 shadow-none flex-grow-1 p-0 bg-transparent text-dark" 
                  type="text" 
                  name="tagInput" 
                  placeholder="{{#if multiValueInputPlaceholder}}{{multiValueInputPlaceholder}}{{else}}example{{/if}}" 
                  aria-label="{{#if multiValueInputLabel}}{{multiValueInputLabel}}{{else}}Input(s){{/if}}"
                  autocomplete="off" 
                  />
              </div>
              <label id="tagInputLabel" class="form-label" for="tagInput">
                {{#if multiValueInputLabel}}
                  {{multiValueInputLabel}}
                {{else}}
                  Input(s)
                {{/if}}
              </label>
            </div>
            <!-- Store the array of values -->
            <input id="multiValueString" data-id="multiValueString" type="hidden" name="multiValueString" autocomplete="off" />
            <div class="d-flex flex-column">
              {{#if continueButtonLabel}}
              <button
                id="submitBtn"
                data-id="submitBtn"
                class="btn btn-primary mb-3"
                type="submit"
                data-skcomponent="skbutton"
                data-skbuttontype="form-submit"
                data-skform="myForm"
                data-skbuttonvalue="CREATE">
              {{continueButtonLabel}}
            </button>
              {{/if}}
              {{#if cancelButtonLabel}}
              <button
                id="cancelBtn"
                data-id="cancelBtn"
                class="btn btn-link"
                type="submit"
                data-skcomponent="skbutton"
                data-skbuttontype="next-event"
                data-skform="myForm"
                data-skbuttonvalue="CANCEL">
              {{cancelButtonLabel}}
            </button>
              {{/if}}
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
```

`CSS`

```CSS
/* Custom styling for the multi-value container to mimic form-control focus */
.multi-value-container {
    height: 100%;
}
.multi-value-container:focus-within {
    color: #3d454d;
    background-color: var(--bs-body-bg);
    border-color: #93bdd2;
    outline: 0;
    box-shadow: 0 0 0 0.25rem rgba(39, 123, 165, 0.25);
}
.tag-remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    height: 10px;
    width: 10px;
    color: inherit; /* Inherit color from badge */
    opacity: 0.7;
    transition: opacity 0.15s ease-in-out;
}
.tag-remove-btn:hover {
    opacity: 1;
}
.tag-remove-btn svg {
    vertical-align: middle;
}
```

`Script`

```JS
// Get references to DOM elements
const delimiter = '|'; // Define the delimiter for multiple values
const multiValueContainer = document.getElementById('multiValueContainer');
const tagInput = document.getElementById('tagInput');
const hiddenAltIdInput = document.getElementById('multiValueString');
const submitButton = document.getElementById('submit-button');

// Array to store current values
let values = [];

/**
 * Adds a new tag to the UI and updates the hidden inputs.
 * @param {string} valueToAdd - The value to add as a tag.
 */
function addTag(valueToAdd) {
    const trimmedValue = valueToAdd.trim().replace(delimiter, '');
    if (trimmedValue === '') {
        return; // Don't add empty tags
    }

    // Prevent duplicate tags
    if (values.includes(trimmedValue)) {
        // Optionally, add a visual cue for duplicates
        tagInput.value = ''; // Clear input if duplicate
        return;
    }

    // Add value to the array
    values.push(trimmedValue);

    // Create the tag element
    const tagElement = document.createElement('span');
    tagElement.id = `tag-${trimmedValue}`;
    tagElement.classList.add(
        'badge', 'bg-primary', 'text-white', 'py-2', 'px-3', 'rounded-pill', 'me-2', 'mt-2', 'mb-2',
        'd-inline-flex', 'align-items-center'
    );
    const title = document.createElement('span');
    title.appendChild(document.createTextNode(trimmedValue));
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `tag-remove-${trimmedValue}`;
    button.classList.add('tag-remove-btn', 'ms-2');
    button.setAttribute('data-value', trimmedValue);
    button.setAttribute('aria-label', `Remove ${trimmedValue}`);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'h-4 w-4');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M6 18L18 6M6 6l12 12');
    svg.appendChild(path);
    button.appendChild(svg);
    button.addEventListener('click', handleClick);
    tagElement.appendChild(title);
    tagElement.appendChild(button);
    // Insert tag before the input field
    multiValueContainer.insertBefore(tagElement, tagInput);

    // Create hidden input for the value
    window.updateFieldValue(hiddenAltIdInput,values.join(delimiter));

    // Clear the input field
    tagInput.value = '';
    tagInput.focus();
}

function handleClick(event) {
    const removeButton = event.target.closest('button[data-value]');

    if (removeButton) {
        const valueToRemove = removeButton.getAttribute('data-value');
        removeTag(valueToRemove);
    }
}

/**
 * Removes a tag from the UI and updates the hidden inputs.
 * @param {string} valueToRemove - The value of the tag to remove.
 */
function removeTag(valueToRemove) {
    // Remove from the values array
    values = values.filter(value => value !== valueToRemove);

    // Remove tag element from UI
    const tagElement = document.getElementById(`tag-${valueToRemove}`);
    if (tagElement) {
        document.getElementById(`tag-remove-${valueToRemove}`).removeEventListener('click', handleClick);
        tagElement.remove();
    }

    // Create hidden input for the value
    window.updateFieldValue(hiddenAltIdInput,values.join(delimiter));
}

// Event listener for adding tags (Enter key or blur)
tagInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission if input is part of a form
        addTag(tagInput.value);
    }
});

tagInput.addEventListener('blur', () => {
    addTag(tagInput.value);
});
```

`Input Schema`

```JSON
{
    "type": "object",
    "properties": {
        "title": {
            "type": "string",
            "displayName": "Title",
            "preferredControlType": "textField",
            "enableParameters": true,
            "propertyName": "title"
        },
        "textOne": {
            "type": "string",
            "displayName": "Text One",
            "preferredControlType": "textField",
            "enableParameters": true,
            "propertyName": "textOne"
        },
        "textTwo": {
            "type": "string",
            "displayName": "Text Two",
            "preferredControlType": "textField",
            "enableParameters": true,
            "propertyName": "textTwo"
        },
        "multiValueInputLabel": {
            "type": "string",
            "displayName": "Multi-Value Input Label",
            "preferredControlType": "textField",
            "enableParameters": true,
            "propertyName": "multiValueInputLabel"
        },
        "multiValueInputPlaceholder": {
            "type": "string",
            "displayName": "Multi-Value Input Placeholder",
            "preferredControlType": "textField",
            "enableParameters": true,
            "propertyName": "multiValueInputPlaceholder"
        },
        "continueButtonLabel": {
            "type": "string",
            "displayName": "Continue Button Label",
            "preferredControlType": "textField",
            "enableParameters": true,
            "propertyName": "continueButtonLabel"
        },
        "cancelButtonLabel": {
            "type": "string",
            "displayName": "Cancel Button Label",
            "preferredControlType": "textField",
            "enableParameters": true,
            "propertyName": "cancelButtonLabel"
        }
    }
}
```

## Connector Metadata


```
JTdCJTIyY2xvbmVkTm9kZXMlMjIlM0ElNUIlN0IlMjJkYXRhJTIyJTNBJTdCJTIyaWQlMjIlM0ElMjJ4NWNlNXJyMGIyJTIyJTJDJTIybm9kZVR5cGUlMjIlM0ElMjJDT05ORUNUSU9OJTIyJTJDJTIyY29ubmVjdGlvbklkJTIyJTNBJTIyODY3ZWQ0MzYzYjJiYzIxYzg2MDA4NWFkMmJhYTgxN2QlMjIlMkMlMjJjb25uZWN0b3JJZCUyMiUzQSUyMmh0dHBDb25uZWN0b3IlMjIlMkMlMjJuYW1lJTIyJTNBJTIySHR0cCUyMiUyQyUyMmxhYmVsJTIyJTNBJTIySHR0cCUyMiUyQyUyMnN0YXR1cyUyMiUzQSUyMmNvbmZpZ3VyZWQlMjIlMkMlMjJjYXBhYmlsaXR5TmFtZSUyMiUzQSUyMmN1c3RvbUhUTUxUZW1wbGF0ZSUyMiUyQyUyMnR5cGUlMjIlM0ElMjJ0cmlnZ2VyJTIyJTJDJTIycHJvcGVydGllcyUyMiUzQSU3QiUyMm5vZGVUaXRsZSUyMiUzQSU3QiUyMnZhbHVlJTIyJTNBJTIyTXVsdGktVmFsdWUlMjBFeGFtcGxlJTIyJTdEJTJDJTIybm9kZURlc2NyaXB0aW9uJTIyJTNBJTdCJTIydmFsdWUlMjIlM0ElMjJFbnRlciUyME11bHRpcGxlJTIwVmFsdWVzJTIyJTdEJTJDJTIyY3VzdG9tSFRNTCUyMiUzQSU3QiUyMnZhbHVlJTIyJTNBJTIyJTNDZGl2JTIwY2xhc3MlM0QlNUMlMjJlbmQtdXNlci1uYW5vJTVDJTIyJTNFJTVDbiUyMCUyMCUzQ2RpdiU1Q24lMjAlMjAlMjAlMjBjbGFzcyUzRCU1QyUyMmJnLWxpZ2h0JTIwZC1mbGV4JTIwZmxleC1jb2x1bW4lMjBqdXN0aWZ5LWNvbnRlbnQtY2VudGVyJTIwYWxpZ24taXRlbXMtY2VudGVyJTIwcG9zaXRpb24tYWJzb2x1dGUlMjB0b3AtMCUyMHN0YXJ0LTAlMjBib3R0b20tMCUyMGVuZC0wJTVDJTIyJTNFJTVDbiUyMCUyMCUyMCUyMCUzQ2RpdiUyMHN0eWxlJTNEJTVDJTIybWF4LXdpZHRoJTNBJTIwNDAwcHglM0IlMjB3aWR0aCUzQSUyMDEwMCUyNSU1QyUyMiUzRSU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlM0NkaXYlMjBjbGFzcyUzRCU1QyUyMmNhcmQlMjBzaGFkb3clMjBtYi01JTVDJTIyJTNFJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ2RpdiUyMGNsYXNzJTNEJTVDJTIyY2FyZC1ib2R5JTIwcC01JTIwZC1mbGV4JTIwZmxleC1jb2x1bW4lNUMlMjIlM0UlNUNuJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU3QiU3QiUyM2lmJTIwdGl0bGUlN0QlN0QlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTNDaDElMjBjbGFzcyUzRCU1QyUyMnRleHQtY2VudGVyJTIwbWItNCU1QyUyMiUzRSU3QiU3QnRpdGxlJTdEJTdEJTNDJTJGaDElM0UlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdCJTdCJTJGaWYlN0QlN0QlNUNuJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU3QiU3QiUyM2lmJTIwdGV4dE9uZSU3RCU3RCU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NwJTIwY2xhc3MlM0QlNUMlMjJ0ZXh0LW11dGVkJTIwdGV4dC1jZW50ZXIlNUMlMjIlM0UlN0IlN0J0ZXh0T25lJTdEJTdEJTNDJTJGcCUzRSU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlN0IlN0IlMkZpZiU3RCU3RCU1Q24lNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdCJTdCJTIzaWYlMjB0ZXh0VHdvJTdEJTdEJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ3AlMjBjbGFzcyUzRCU1QyUyMnRleHQtbXV0ZWQlMjB0ZXh0LWNlbnRlciU1QyUyMiUzRSU3QiU3QnRleHRUd28lN0QlN0QlM0MlMkZwJTNFJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU3QiU3QiUyRmlmJTdEJTdEJTVDbiU1Q24lNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTNDIS0tJTIwR2VuZXJpYyUyMEVycm9yJTIwTWVzc2FnZSUyMC0tJTNFJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ3AlMjBpZCUzRCU1QyUyMmZlZWRiYWNrJTVDJTIyJTIwZGF0YS1pZCUzRCU1QyUyMmZlZWRiYWNrJTVDJTIyJTIwY2xhc3MlM0QlNUMlMjJ0ZXh0LWRhbmdlciUyMG1kaSUyMG1kaS1hbGVydC1jaXJjbGUlNUMlMjIlMjBkYXRhLXNrY29tcG9uZW50JTNEJTVDJTIyc2tlcnJvciU1QyUyMiUzRSUzQyUyRnAlM0UlNUNuJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQyEtLSUyMEZpZWxkJTIwVmFsaWRhdGlvbiUyMEVycm9yJTIwTWVzc2FnZXMlMjAtLSUzRSU1Q24lNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTNDZm9ybSUyMGlkJTNEJTVDJTIybXlGb3JtJTVDJTIyJTIwZGF0YS1pZCUzRCU1QyUyMm15Rm9ybSU1QyUyMiUyMGNsYXNzJTNEJTVDJTIyZm9ybSU1QyUyMiUzRSU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NkaXYlMjBjbGFzcyUzRCU1QyUyMm1iLTQlMjBmb3JtLWZsb2F0aW5nJTVDJTIyJTNFJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ2RpdiUyMGlkJTNEJTVDJTIybXVsdGlWYWx1ZUNvbnRhaW5lciU1QyUyMiUyMGNsYXNzJTNEJTVDJTIyZm9ybS1jb250cm9sJTIwZC1mbGV4JTIwZmxleC13cmFwJTIwYWxpZ24taXRlbXMtY2VudGVyJTIwZ2FwLTIlMjBtYi0zJTIwbXVsdGktdmFsdWUtY29udGFpbmVyJTVDJTIyJTIwc3R5bGUlM0QlNUMlMjJoZWlnaHQlM0ElMjAxMDAlMjUlM0IlNUMlMjIlM0UlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTNDIS0tJTIwV2UlMjBhcmUlMjBpbmplY3RpbmclMjB0YWdzJTIwaGVyZSUyMC0tJTNFJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ2lucHV0JTIwJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGlkJTNEJTVDJTIydGFnSW5wdXQlNUMlMjIlMjAlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwY2xhc3MlM0QlNUMlMjJmb3JtLWNvbnRyb2wlMjBib3JkZXItMCUyMHNoYWRvdy1ub25lJTIwZmxleC1ncm93LTElMjBwLTAlMjBiZy10cmFuc3BhcmVudCUyMHRleHQtZGFyayU1QyUyMiUyMCU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjB0eXBlJTNEJTVDJTIydGV4dCU1QyUyMiUyMCU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBuYW1lJTNEJTVDJTIydGFnSW5wdXQlNUMlMjIlMjAlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwcGxhY2Vob2xkZXIlM0QlNUMlMjIlN0IlN0IlMjNpZiUyMG11bHRpVmFsdWVJbnB1dFBsYWNlaG9sZGVyJTdEJTdEJTdCJTdCbXVsdGlWYWx1ZUlucHV0UGxhY2Vob2xkZXIlN0QlN0QlN0IlN0JlbHNlJTdEJTdEZXhhbXBsZSU3QiU3QiUyRmlmJTdEJTdEJTVDJTIyJTIwJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGFyaWEtbGFiZWwlM0QlNUMlMjIlN0IlN0IlMjNpZiUyMG11bHRpVmFsdWVJbnB1dExhYmVsJTdEJTdEJTdCJTdCbXVsdGlWYWx1ZUlucHV0TGFiZWwlN0QlN0QlN0IlN0JlbHNlJTdEJTdESW5wdXQocyklN0IlN0IlMkZpZiU3RCU3RCU1QyUyMiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBhdXRvY29tcGxldGUlM0QlNUMlMjJvZmYlNUMlMjIlMjAlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTJGJTNFJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQyUyRmRpdiUzRSU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NsYWJlbCUyMGlkJTNEJTVDJTIydGFnSW5wdXRMYWJlbCU1QyUyMiUyMGNsYXNzJTNEJTVDJTIyZm9ybS1sYWJlbCU1QyUyMiUyMGZvciUzRCU1QyUyMnRhZ0lucHV0JTVDJTIyJTNFJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU3QiU3QiUyM2lmJTIwbXVsdGlWYWx1ZUlucHV0TGFiZWwlN0QlN0QlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdCJTdCbXVsdGlWYWx1ZUlucHV0TGFiZWwlN0QlN0QlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdCJTdCZWxzZSU3RCU3RCU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBJbnB1dChzKSU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlN0IlN0IlMkZpZiU3RCU3RCU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0MlMkZsYWJlbCUzRSU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0MlMkZkaXYlM0UlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTNDIS0tJTIwU3RvcmUlMjB0aGUlMjBhcnJheSUyMG9mJTIwdmFsdWVzJTIwLS0lM0UlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTNDaW5wdXQlMjBpZCUzRCU1QyUyMm11bHRpVmFsdWVTdHJpbmclNUMlMjIlMjBkYXRhLWlkJTNEJTVDJTIybXVsdGlWYWx1ZVN0cmluZyU1QyUyMiUyMHR5cGUlM0QlNUMlMjJoaWRkZW4lNUMlMjIlMjBuYW1lJTNEJTVDJTIybXVsdGlWYWx1ZVN0cmluZyU1QyUyMiUyMGF1dG9jb21wbGV0ZSUzRCU1QyUyMm9mZiU1QyUyMiUyMCUyRiUzRSU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NkaXYlMjBjbGFzcyUzRCU1QyUyMmQtZmxleCUyMGZsZXgtY29sdW1uJTVDJTIyJTNFJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU3QiU3QiUyM2lmJTIwY29udGludWVCdXR0b25MYWJlbCU3RCU3RCU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0NidXR0b24lNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwaWQlM0QlNUMlMjJzdWJtaXRCdG4lNUMlMjIlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwZGF0YS1pZCUzRCU1QyUyMnN1Ym1pdEJ0biU1QyUyMiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBjbGFzcyUzRCU1QyUyMmJ0biUyMGJ0bi1wcmltYXJ5JTIwbWItMyU1QyUyMiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjB0eXBlJTNEJTVDJTIyc3VibWl0JTVDJTIyJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGRhdGEtc2tjb21wb25lbnQlM0QlNUMlMjJza2J1dHRvbiU1QyUyMiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBkYXRhLXNrYnV0dG9udHlwZSUzRCU1QyUyMmZvcm0tc3VibWl0JTVDJTIyJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGRhdGEtc2tmb3JtJTNEJTVDJTIybXlGb3JtJTVDJTIyJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGRhdGEtc2tidXR0b252YWx1ZSUzRCU1QyUyMkNSRUFURSU1QyUyMiUzRSU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlN0IlN0Jjb250aW51ZUJ1dHRvbkxhYmVsJTdEJTdEJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQyUyRmJ1dHRvbiUzRSU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlN0IlN0IlMkZpZiU3RCU3RCU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlN0IlN0IlMjNpZiUyMGNhbmNlbEJ1dHRvbkxhYmVsJTdEJTdEJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQ2J1dHRvbiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBpZCUzRCU1QyUyMmNhbmNlbEJ0biU1QyUyMiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBkYXRhLWlkJTNEJTVDJTIyY2FuY2VsQnRuJTVDJTIyJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGNsYXNzJTNEJTVDJTIyYnRuJTIwYnRuLWxpbmslNUMlMjIlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwdHlwZSUzRCU1QyUyMnN1Ym1pdCU1QyUyMiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBkYXRhLXNrY29tcG9uZW50JTNEJTVDJTIyc2tidXR0b24lNUMlMjIlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwZGF0YS1za2J1dHRvbnR5cGUlM0QlNUMlMjJuZXh0LWV2ZW50JTVDJTIyJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGRhdGEtc2tmb3JtJTNEJTVDJTIybXlGb3JtJTVDJTIyJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGRhdGEtc2tidXR0b252YWx1ZSUzRCU1QyUyMkNBTkNFTCU1QyUyMiUzRSU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlN0IlN0JjYW5jZWxCdXR0b25MYWJlbCU3RCU3RCU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlM0MlMkZidXR0b24lM0UlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdCJTdCJTJGaWYlN0QlN0QlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTNDJTJGZGl2JTNFJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUzQyUyRmZvcm0lM0UlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTNDJTJGZGl2JTNFJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUzQyUyRmRpdiUzRSU1Q24lMjAlMjAlMjAlMjAlM0MlMkZkaXYlM0UlNUNuJTIwJTIwJTNDJTJGZGl2JTNFJTVDbiUzQyUyRmRpdiUzRSUyMiU3RCUyQyUyMmN1c3RvbUNTUyUyMiUzQSU3QiUyMnZhbHVlJTIyJTNBJTIyJTJGKiUyMEN1c3RvbSUyMHN0eWxpbmclMjBmb3IlMjB0aGUlMjBtdWx0aS12YWx1ZSUyMGNvbnRhaW5lciUyMHRvJTIwbWltaWMlMjBmb3JtLWNvbnRyb2wlMjBmb2N1cyUyMColMkYlNUNuLm11bHRpLXZhbHVlLWNvbnRhaW5lciUyMCU3QiU1Q24lMjAlMjAlMjAlMjBoZWlnaHQlM0ElMjAxMDAlMjUlM0IlNUNuJTdEJTVDbi5tdWx0aS12YWx1ZS1jb250YWluZXIlM0Fmb2N1cy13aXRoaW4lMjAlN0IlNUNuJTIwJTIwJTIwJTIwY29sb3IlM0ElMjAlMjMzZDQ1NGQlM0IlNUNuJTIwJTIwJTIwJTIwYmFja2dyb3VuZC1jb2xvciUzQSUyMHZhcigtLWJzLWJvZHktYmcpJTNCJTVDbiUyMCUyMCUyMCUyMGJvcmRlci1jb2xvciUzQSUyMCUyMzkzYmRkMiUzQiU1Q24lMjAlMjAlMjAlMjBvdXRsaW5lJTNBJTIwMCUzQiU1Q24lMjAlMjAlMjAlMjBib3gtc2hhZG93JTNBJTIwMCUyMDAlMjAwJTIwMC4yNXJlbSUyMHJnYmEoMzklMkMlMjAxMjMlMkMlMjAxNjUlMkMlMjAwLjI1KSUzQiU1Q24lN0QlNUNuLnRhZy1yZW1vdmUtYnRuJTIwJTdCJTVDbiUyMCUyMCUyMCUyMGJhY2tncm91bmQlM0ElMjBub25lJTNCJTVDbiUyMCUyMCUyMCUyMGJvcmRlciUzQSUyMG5vbmUlM0IlNUNuJTIwJTIwJTIwJTIwY3Vyc29yJTNBJTIwcG9pbnRlciUzQiU1Q24lMjAlMjAlMjAlMjBwYWRkaW5nJTNBJTIwMCUzQiU1Q24lMjAlMjAlMjAlMjBoZWlnaHQlM0ElMjAxMHB4JTNCJTVDbiUyMCUyMCUyMCUyMHdpZHRoJTNBJTIwMTBweCUzQiU1Q24lMjAlMjAlMjAlMjBjb2xvciUzQSUyMGluaGVyaXQlM0IlMjAlMkYqJTIwSW5oZXJpdCUyMGNvbG9yJTIwZnJvbSUyMGJhZGdlJTIwKiUyRiU1Q24lMjAlMjAlMjAlMjBvcGFjaXR5JTNBJTIwMC43JTNCJTVDbiUyMCUyMCUyMCUyMHRyYW5zaXRpb24lM0ElMjBvcGFjaXR5JTIwMC4xNXMlMjBlYXNlLWluLW91dCUzQiU1Q24lN0QlNUNuLnRhZy1yZW1vdmUtYnRuJTNBaG92ZXIlMjAlN0IlNUNuJTIwJTIwJTIwJTIwb3BhY2l0eSUzQSUyMDElM0IlNUNuJTdEJTVDbi50YWctcmVtb3ZlLWJ0biUyMHN2ZyUyMCU3QiU1Q24lMjAlMjAlMjAlMjB2ZXJ0aWNhbC1hbGlnbiUzQSUyMG1pZGRsZSUzQiU1Q24lN0QlMjIlN0QlMkMlMjJjdXN0b21TY3JpcHQlMjIlM0ElN0IlMjJ2YWx1ZSUyMiUzQSUyMiUyRiUyRiUyMEdldCUyMHJlZmVyZW5jZXMlMjB0byUyMERPTSUyMGVsZW1lbnRzJTVDbmNvbnN0JTIwZGVsaW1pdGVyJTIwJTNEJTIwJyU3QyclM0IlMjAlMkYlMkYlMjBEZWZpbmUlMjB0aGUlMjBkZWxpbWl0ZXIlMjBmb3IlMjBtdWx0aXBsZSUyMHZhbHVlcyU1Q25jb25zdCUyMG11bHRpVmFsdWVDb250YWluZXIlMjAlM0QlMjBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbXVsdGlWYWx1ZUNvbnRhaW5lcicpJTNCJTVDbmNvbnN0JTIwdGFnSW5wdXQlMjAlM0QlMjBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFnSW5wdXQnKSUzQiU1Q25jb25zdCUyMGhpZGRlbkFsdElkSW5wdXQlMjAlM0QlMjBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbXVsdGlWYWx1ZVN0cmluZycpJTNCJTVDbmNvbnN0JTIwc3VibWl0QnV0dG9uJTIwJTNEJTIwZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N1Ym1pdC1idXR0b24nKSUzQiU1Q24lNUNuJTJGJTJGJTIwQXJyYXklMjB0byUyMHN0b3JlJTIwY3VycmVudCUyMHZhbHVlcyU1Q25sZXQlMjB2YWx1ZXMlMjAlM0QlMjAlNUIlNUQlM0IlNUNuJTVDbiUyRioqJTVDbiUyMColMjBBZGRzJTIwYSUyMG5ldyUyMHRhZyUyMHRvJTIwdGhlJTIwVUklMjBhbmQlMjB1cGRhdGVzJTIwdGhlJTIwaGlkZGVuJTIwaW5wdXRzLiU1Q24lMjAqJTIwJTQwcGFyYW0lMjAlN0JzdHJpbmclN0QlMjB2YWx1ZVRvQWRkJTIwLSUyMFRoZSUyMHZhbHVlJTIwdG8lMjBhZGQlMjBhcyUyMGElMjB0YWcuJTVDbiUyMColMkYlNUNuZnVuY3Rpb24lMjBhZGRUYWcodmFsdWVUb0FkZCklMjAlN0IlNUNuJTIwJTIwJTIwJTIwY29uc3QlMjB0cmltbWVkVmFsdWUlMjAlM0QlMjB2YWx1ZVRvQWRkLnRyaW0oKS5yZXBsYWNlKGRlbGltaXRlciUyQyUyMCcnKSUzQiU1Q24lMjAlMjAlMjAlMjBpZiUyMCh0cmltbWVkVmFsdWUlMjAlM0QlM0QlM0QlMjAnJyklMjAlN0IlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwcmV0dXJuJTNCJTIwJTJGJTJGJTIwRG9uJ3QlMjBhZGQlMjBlbXB0eSUyMHRhZ3MlNUNuJTIwJTIwJTIwJTIwJTdEJTVDbiU1Q24lMjAlMjAlMjAlMjAlMkYlMkYlMjBQcmV2ZW50JTIwZHVwbGljYXRlJTIwdGFncyU1Q24lMjAlMjAlMjAlMjBpZiUyMCh2YWx1ZXMuaW5jbHVkZXModHJpbW1lZFZhbHVlKSklMjAlN0IlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTJGJTJGJTIwT3B0aW9uYWxseSUyQyUyMGFkZCUyMGElMjB2aXN1YWwlMjBjdWUlMjBmb3IlMjBkdXBsaWNhdGVzJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMHRhZ0lucHV0LnZhbHVlJTIwJTNEJTIwJyclM0IlMjAlMkYlMkYlMjBDbGVhciUyMGlucHV0JTIwaWYlMjBkdXBsaWNhdGUlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwcmV0dXJuJTNCJTVDbiUyMCUyMCUyMCUyMCU3RCU1Q24lNUNuJTIwJTIwJTIwJTIwJTJGJTJGJTIwQWRkJTIwdmFsdWUlMjB0byUyMHRoZSUyMGFycmF5JTVDbiUyMCUyMCUyMCUyMHZhbHVlcy5wdXNoKHRyaW1tZWRWYWx1ZSklM0IlNUNuJTVDbiUyMCUyMCUyMCUyMCUyRiUyRiUyMENyZWF0ZSUyMHRoZSUyMHRhZyUyMGVsZW1lbnQlNUNuJTIwJTIwJTIwJTIwY29uc3QlMjB0YWdFbGVtZW50JTIwJTNEJTIwZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpJTNCJTVDbiUyMCUyMCUyMCUyMHRhZ0VsZW1lbnQuaWQlMjAlM0QlMjAlNjB0YWctJTI0JTdCdHJpbW1lZFZhbHVlJTdEJTYwJTNCJTVDbiUyMCUyMCUyMCUyMHRhZ0VsZW1lbnQuY2xhc3NMaXN0LmFkZCglNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJ2JhZGdlJyUyQyUyMCdiZy1wcmltYXJ5JyUyQyUyMCd0ZXh0LXdoaXRlJyUyQyUyMCdweS0yJyUyQyUyMCdweC0zJyUyQyUyMCdyb3VuZGVkLXBpbGwnJTJDJTIwJ21lLTInJTJDJTIwJ210LTInJTJDJTIwJ21iLTInJTJDJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCdkLWlubGluZS1mbGV4JyUyQyUyMCdhbGlnbi1pdGVtcy1jZW50ZXInJTVDbiUyMCUyMCUyMCUyMCklM0IlNUNuJTIwJTIwJTIwJTIwY29uc3QlMjB0aXRsZSUyMCUzRCUyMGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSUzQiU1Q24lMjAlMjAlMjAlMjB0aXRsZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0cmltbWVkVmFsdWUpKSUzQiU1Q24lMjAlMjAlMjAlMjBjb25zdCUyMGJ1dHRvbiUyMCUzRCUyMGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpJTNCJTVDbiUyMCUyMCUyMCUyMGJ1dHRvbi50eXBlJTIwJTNEJTIwJ2J1dHRvbiclM0IlNUNuJTIwJTIwJTIwJTIwYnV0dG9uLmlkJTIwJTNEJTIwJTYwdGFnLXJlbW92ZS0lMjQlN0J0cmltbWVkVmFsdWUlN0QlNjAlM0IlNUNuJTIwJTIwJTIwJTIwYnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3RhZy1yZW1vdmUtYnRuJyUyQyUyMCdtcy0yJyklM0IlNUNuJTIwJTIwJTIwJTIwYnV0dG9uLnNldEF0dHJpYnV0ZSgnZGF0YS12YWx1ZSclMkMlMjB0cmltbWVkVmFsdWUpJTNCJTVDbiUyMCUyMCUyMCUyMGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnJTJDJTIwJTYwUmVtb3ZlJTIwJTI0JTdCdHJpbW1lZFZhbHVlJTdEJTYwKSUzQiU1Q24lMjAlMjAlMjAlMjBjb25zdCUyMHN2ZyUyMCUzRCUyMGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cCUzQSUyRiUyRnd3dy53My5vcmclMkYyMDAwJTJGc3ZnJyUyQyUyMCdzdmcnKSUzQiU1Q24lMjAlMjAlMjAlMjBzdmcuc2V0QXR0cmlidXRlKCdjbGFzcyclMkMlMjAnaC00JTIwdy00JyklM0IlNUNuJTIwJTIwJTIwJTIwc3ZnLnNldEF0dHJpYnV0ZSgnZmlsbCclMkMlMjAnbm9uZScpJTNCJTVDbiUyMCUyMCUyMCUyMHN2Zy5zZXRBdHRyaWJ1dGUoJ3N0cm9rZSclMkMlMjAnY3VycmVudENvbG9yJyklM0IlNUNuJTIwJTIwJTIwJTIwc3ZnLnNldEF0dHJpYnV0ZSgndmlld0JveCclMkMlMjAnMCUyMDAlMjAyNCUyMDI0JyklM0IlNUNuJTIwJTIwJTIwJTIwc3ZnLnNldEF0dHJpYnV0ZSgneG1sbnMnJTJDJTIwJ2h0dHAlM0ElMkYlMkZ3d3cudzMub3JnJTJGMjAwMCUyRnN2ZycpJTNCJTVDbiUyMCUyMCUyMCUyMGNvbnN0JTIwcGF0aCUyMCUzRCUyMGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cCUzQSUyRiUyRnd3dy53My5vcmclMkYyMDAwJTJGc3ZnJyUyQyUyMCdwYXRoJyklM0IlNUNuJTIwJTIwJTIwJTIwcGF0aC5zZXRBdHRyaWJ1dGUoJ3N0cm9rZS1saW5lY2FwJyUyQyUyMCdyb3VuZCcpJTNCJTVDbiUyMCUyMCUyMCUyMHBhdGguc2V0QXR0cmlidXRlKCdzdHJva2UtbGluZWpvaW4nJTJDJTIwJ3JvdW5kJyklM0IlNUNuJTIwJTIwJTIwJTIwcGF0aC5zZXRBdHRyaWJ1dGUoJ3N0cm9rZS13aWR0aCclMkMlMjAnMicpJTNCJTVDbiUyMCUyMCUyMCUyMHBhdGguc2V0QXR0cmlidXRlKCdkJyUyQyUyMCdNNiUyMDE4TDE4JTIwNk02JTIwNmwxMiUyMDEyJyklM0IlNUNuJTIwJTIwJTIwJTIwc3ZnLmFwcGVuZENoaWxkKHBhdGgpJTNCJTVDbiUyMCUyMCUyMCUyMGJ1dHRvbi5hcHBlbmRDaGlsZChzdmcpJTNCJTVDbiUyMCUyMCUyMCUyMGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljayclMkMlMjBoYW5kbGVDbGljayklM0IlNUNuJTIwJTIwJTIwJTIwdGFnRWxlbWVudC5hcHBlbmRDaGlsZCh0aXRsZSklM0IlNUNuJTIwJTIwJTIwJTIwdGFnRWxlbWVudC5hcHBlbmRDaGlsZChidXR0b24pJTNCJTVDbiUyMCUyMCUyMCUyMCUyRiUyRiUyMEluc2VydCUyMHRhZyUyMGJlZm9yZSUyMHRoZSUyMGlucHV0JTIwZmllbGQlNUNuJTIwJTIwJTIwJTIwbXVsdGlWYWx1ZUNvbnRhaW5lci5pbnNlcnRCZWZvcmUodGFnRWxlbWVudCUyQyUyMHRhZ0lucHV0KSUzQiU1Q24lNUNuJTIwJTIwJTIwJTIwJTJGJTJGJTIwQ3JlYXRlJTIwaGlkZGVuJTIwaW5wdXQlMjBmb3IlMjB0aGUlMjB2YWx1ZSU1Q24lMjAlMjAlMjAlMjB3aW5kb3cudXBkYXRlRmllbGRWYWx1ZShoaWRkZW5BbHRJZElucHV0JTJDdmFsdWVzLmpvaW4oZGVsaW1pdGVyKSklM0IlNUNuJTVDbiUyMCUyMCUyMCUyMCUyRiUyRiUyMENsZWFyJTIwdGhlJTIwaW5wdXQlMjBmaWVsZCU1Q24lMjAlMjAlMjAlMjB0YWdJbnB1dC52YWx1ZSUyMCUzRCUyMCcnJTNCJTVDbiUyMCUyMCUyMCUyMHRhZ0lucHV0LmZvY3VzKCklM0IlNUNuJTdEJTVDbiU1Q25mdW5jdGlvbiUyMGhhbmRsZUNsaWNrKGV2ZW50KSUyMCU3QiU1Q24lMjAlMjAlMjAlMjBjb25zdCUyMHJlbW92ZUJ1dHRvbiUyMCUzRCUyMGV2ZW50LnRhcmdldC5jbG9zZXN0KCdidXR0b24lNUJkYXRhLXZhbHVlJTVEJyklM0IlNUNuJTVDbiUyMCUyMCUyMCUyMGlmJTIwKHJlbW92ZUJ1dHRvbiklMjAlN0IlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwY29uc3QlMjB2YWx1ZVRvUmVtb3ZlJTIwJTNEJTIwcmVtb3ZlQnV0dG9uLmdldEF0dHJpYnV0ZSgnZGF0YS12YWx1ZScpJTNCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMHJlbW92ZVRhZyh2YWx1ZVRvUmVtb3ZlKSUzQiU1Q24lMjAlMjAlMjAlMjAlN0QlNUNuJTdEJTVDbiU1Q24lMkYqKiU1Q24lMjAqJTIwUmVtb3ZlcyUyMGElMjB0YWclMjBmcm9tJTIwdGhlJTIwVUklMjBhbmQlMjB1cGRhdGVzJTIwdGhlJTIwaGlkZGVuJTIwaW5wdXRzLiU1Q24lMjAqJTIwJTQwcGFyYW0lMjAlN0JzdHJpbmclN0QlMjB2YWx1ZVRvUmVtb3ZlJTIwLSUyMFRoZSUyMHZhbHVlJTIwb2YlMjB0aGUlMjB0YWclMjB0byUyMHJlbW92ZS4lNUNuJTIwKiUyRiU1Q25mdW5jdGlvbiUyMHJlbW92ZVRhZyh2YWx1ZVRvUmVtb3ZlKSUyMCU3QiU1Q24lMjAlMjAlMjAlMjAlMkYlMkYlMjBSZW1vdmUlMjBmcm9tJTIwdGhlJTIwdmFsdWVzJTIwYXJyYXklNUNuJTIwJTIwJTIwJTIwdmFsdWVzJTIwJTNEJTIwdmFsdWVzLmZpbHRlcih2YWx1ZSUyMCUzRCUzRSUyMHZhbHVlJTIwISUzRCUzRCUyMHZhbHVlVG9SZW1vdmUpJTNCJTVDbiU1Q24lMjAlMjAlMjAlMjAlMkYlMkYlMjBSZW1vdmUlMjB0YWclMjBlbGVtZW50JTIwZnJvbSUyMFVJJTVDbiUyMCUyMCUyMCUyMGNvbnN0JTIwdGFnRWxlbWVudCUyMCUzRCUyMGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCU2MHRhZy0lMjQlN0J2YWx1ZVRvUmVtb3ZlJTdEJTYwKSUzQiU1Q24lMjAlMjAlMjAlMjBpZiUyMCh0YWdFbGVtZW50KSUyMCU3QiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCglNjB0YWctcmVtb3ZlLSUyNCU3QnZhbHVlVG9SZW1vdmUlN0QlNjApLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJyUyQyUyMGhhbmRsZUNsaWNrKSUzQiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjB0YWdFbGVtZW50LnJlbW92ZSgpJTNCJTVDbiUyMCUyMCUyMCUyMCU3RCU1Q24lNUNuJTIwJTIwJTIwJTIwJTJGJTJGJTIwQ3JlYXRlJTIwaGlkZGVuJTIwaW5wdXQlMjBmb3IlMjB0aGUlMjB2YWx1ZSU1Q24lMjAlMjAlMjAlMjB3aW5kb3cudXBkYXRlRmllbGRWYWx1ZShoaWRkZW5BbHRJZElucHV0JTJDdmFsdWVzLmpvaW4oZGVsaW1pdGVyKSklM0IlNUNuJTdEJTVDbiU1Q24lMkYlMkYlMjBFdmVudCUyMGxpc3RlbmVyJTIwZm9yJTIwYWRkaW5nJTIwdGFncyUyMChFbnRlciUyMGtleSUyMG9yJTIwYmx1ciklNUNudGFnSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93biclMkMlMjAoZXZlbnQpJTIwJTNEJTNFJTIwJTdCJTVDbiUyMCUyMCUyMCUyMGlmJTIwKGV2ZW50LmtleSUyMCUzRCUzRCUzRCUyMCdFbnRlcicpJTIwJTdCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGV2ZW50LnByZXZlbnREZWZhdWx0KCklM0IlMjAlMkYlMkYlMjBQcmV2ZW50JTIwZm9ybSUyMHN1Ym1pc3Npb24lMjBpZiUyMGlucHV0JTIwaXMlMjBwYXJ0JTIwb2YlMjBhJTIwZm9ybSU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBhZGRUYWcodGFnSW5wdXQudmFsdWUpJTNCJTVDbiUyMCUyMCUyMCUyMCU3RCU1Q24lN0QpJTNCJTVDbiU1Q250YWdJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJyUyQyUyMCgpJTIwJTNEJTNFJTIwJTdCJTVDbiUyMCUyMCUyMCUyMGFkZFRhZyh0YWdJbnB1dC52YWx1ZSklM0IlNUNuJTdEKSUzQiUyMiU3RCUyQyUyMmlucHV0U2NoZW1hJTIyJTNBJTdCJTIydmFsdWUlMjIlM0ElMjIlN0IlNUNuJTIwJTIwJTIwJTIwJTVDJTIydHlwZSU1QyUyMiUzQSUyMCU1QyUyMm9iamVjdCU1QyUyMiUyQyU1Q24lMjAlMjAlMjAlMjAlNUMlMjJwcm9wZXJ0aWVzJTVDJTIyJTNBJTIwJTdCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMnRpdGxlJTVDJTIyJTNBJTIwJTdCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMnR5cGUlNUMlMjIlM0ElMjAlNUMlMjJzdHJpbmclNUMlMjIlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIyZGlzcGxheU5hbWUlNUMlMjIlM0ElMjAlNUMlMjJUaXRsZSU1QyUyMiUyQyU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJwcmVmZXJyZWRDb250cm9sVHlwZSU1QyUyMiUzQSUyMCU1QyUyMnRleHRGaWVsZCU1QyUyMiUyQyU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJlbmFibGVQYXJhbWV0ZXJzJTVDJTIyJTNBJTIwdHJ1ZSUyQyU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJwcm9wZXJ0eU5hbWUlNUMlMjIlM0ElMjAlNUMlMjJ0aXRsZSU1QyUyMiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlN0QlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIydGV4dE9uZSU1QyUyMiUzQSUyMCU3QiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJ0eXBlJTVDJTIyJTNBJTIwJTVDJTIyc3RyaW5nJTVDJTIyJTJDJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMmRpc3BsYXlOYW1lJTVDJTIyJTNBJTIwJTVDJTIyVGV4dCUyME9uZSU1QyUyMiUyQyU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJwcmVmZXJyZWRDb250cm9sVHlwZSU1QyUyMiUzQSUyMCU1QyUyMnRleHRGaWVsZCU1QyUyMiUyQyU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJlbmFibGVQYXJhbWV0ZXJzJTVDJTIyJTNBJTIwdHJ1ZSUyQyU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJwcm9wZXJ0eU5hbWUlNUMlMjIlM0ElMjAlNUMlMjJ0ZXh0T25lJTVDJTIyJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU3RCUyQyU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJ0ZXh0VHdvJTVDJTIyJTNBJTIwJTdCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMnR5cGUlNUMlMjIlM0ElMjAlNUMlMjJzdHJpbmclNUMlMjIlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIyZGlzcGxheU5hbWUlNUMlMjIlM0ElMjAlNUMlMjJUZXh0JTIwVHdvJTVDJTIyJTJDJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMnByZWZlcnJlZENvbnRyb2xUeXBlJTVDJTIyJTNBJTIwJTVDJTIydGV4dEZpZWxkJTVDJTIyJTJDJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMmVuYWJsZVBhcmFtZXRlcnMlNUMlMjIlM0ElMjB0cnVlJTJDJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMnByb3BlcnR5TmFtZSU1QyUyMiUzQSUyMCU1QyUyMnRleHRUd28lNUMlMjIlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdEJTJDJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMm11bHRpVmFsdWVJbnB1dExhYmVsJTVDJTIyJTNBJTIwJTdCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMnR5cGUlNUMlMjIlM0ElMjAlNUMlMjJzdHJpbmclNUMlMjIlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIyZGlzcGxheU5hbWUlNUMlMjIlM0ElMjAlNUMlMjJNdWx0aS1WYWx1ZSUyMElucHV0JTIwTGFiZWwlNUMlMjIlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIycHJlZmVycmVkQ29udHJvbFR5cGUlNUMlMjIlM0ElMjAlNUMlMjJ0ZXh0RmllbGQlNUMlMjIlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIyZW5hYmxlUGFyYW1ldGVycyU1QyUyMiUzQSUyMHRydWUlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIycHJvcGVydHlOYW1lJTVDJTIyJTNBJTIwJTVDJTIybXVsdGlWYWx1ZUlucHV0TGFiZWwlNUMlMjIlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdEJTJDJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMm11bHRpVmFsdWVJbnB1dFBsYWNlaG9sZGVyJTVDJTIyJTNBJTIwJTdCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMnR5cGUlNUMlMjIlM0ElMjAlNUMlMjJzdHJpbmclNUMlMjIlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIyZGlzcGxheU5hbWUlNUMlMjIlM0ElMjAlNUMlMjJNdWx0aS1WYWx1ZSUyMElucHV0JTIwUGxhY2Vob2xkZXIlNUMlMjIlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIycHJlZmVycmVkQ29udHJvbFR5cGUlNUMlMjIlM0ElMjAlNUMlMjJ0ZXh0RmllbGQlNUMlMjIlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIyZW5hYmxlUGFyYW1ldGVycyU1QyUyMiUzQSUyMHRydWUlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIycHJvcGVydHlOYW1lJTVDJTIyJTNBJTIwJTVDJTIybXVsdGlWYWx1ZUlucHV0UGxhY2Vob2xkZXIlNUMlMjIlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdEJTJDJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMmNvbnRpbnVlQnV0dG9uTGFiZWwlNUMlMjIlM0ElMjAlN0IlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIydHlwZSU1QyUyMiUzQSUyMCU1QyUyMnN0cmluZyU1QyUyMiUyQyU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJkaXNwbGF5TmFtZSU1QyUyMiUzQSUyMCU1QyUyMkNvbnRpbnVlJTIwQnV0dG9uJTIwTGFiZWwlNUMlMjIlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIycHJlZmVycmVkQ29udHJvbFR5cGUlNUMlMjIlM0ElMjAlNUMlMjJ0ZXh0RmllbGQlNUMlMjIlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIyZW5hYmxlUGFyYW1ldGVycyU1QyUyMiUzQSUyMHRydWUlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIycHJvcGVydHlOYW1lJTVDJTIyJTNBJTIwJTVDJTIyY29udGludWVCdXR0b25MYWJlbCU1QyUyMiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlN0QlMkMlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIyY2FuY2VsQnV0dG9uTGFiZWwlNUMlMjIlM0ElMjAlN0IlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIydHlwZSU1QyUyMiUzQSUyMCU1QyUyMnN0cmluZyU1QyUyMiUyQyU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJkaXNwbGF5TmFtZSU1QyUyMiUzQSUyMCU1QyUyMkNhbmNlbCUyMEJ1dHRvbiUyMExhYmVsJTVDJTIyJTJDJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMnByZWZlcnJlZENvbnRyb2xUeXBlJTVDJTIyJTNBJTIwJTVDJTIydGV4dEZpZWxkJTVDJTIyJTJDJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMmVuYWJsZVBhcmFtZXRlcnMlNUMlMjIlM0ElMjB0cnVlJTJDJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMnByb3BlcnR5TmFtZSU1QyUyMiUzQSUyMCU1QyUyMmNhbmNlbEJ1dHRvbkxhYmVsJTVDJTIyJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU3RCU1Q24lMjAlMjAlMjAlMjAlN0QlNUNuJTdEJTIyJTdEJTJDJTIyZm9ybUZpZWxkc0xpc3QlMjIlM0ElN0IlMjJ2YWx1ZSUyMiUzQSU1QiU3QiUyMnByb3BlcnR5TmFtZSUyMiUzQSUyMmJ1dHRvblZhbHVlJTIyJTJDJTIycHJlZmVycmVkQ29udHJvbFR5cGUlMjIlM0ElMjJ0ZXh0RmllbGQlMjIlMkMlMjJwcmVmZXJyZWREYXRhVHlwZSUyMiUzQSUyMnN0cmluZyUyMiUyQyUyMnZhbHVlJTIyJTNBJTIyJTIyJTJDJTIyaGFzaGVkVmlzaWJpbGl0eSUyMiUzQWZhbHNlJTdEJTJDJTdCJTIycHJvcGVydHlOYW1lJTIyJTNBJTIybXVsdGlWYWx1ZVN0cmluZyUyMiUyQyUyMnByZWZlcnJlZENvbnRyb2xUeXBlJTIyJTNBJTIydGV4dEZpZWxkJTIyJTJDJTIycHJlZmVycmVkRGF0YVR5cGUlMjIlM0ElMjJzdHJpbmclMjIlMkMlMjJ2YWx1ZSUyMiUzQSUyMiUyMiUyQyUyMmhhc2hlZFZpc2liaWxpdHklMjIlM0FmYWxzZSU3RCU1RCU3RCUyQyUyMnRpdGxlJTIyJTNBJTdCJTIydmFsdWUlMjIlM0ElMjIlNUIlNUNuJTIwJTIwJTdCJTVDbiUyMCUyMCUyMCUyMCU1QyUyMmNoaWxkcmVuJTVDJTIyJTNBJTIwJTVCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCU3QiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJ0ZXh0JTVDJTIyJTNBJTIwJTVDJTIyRW50ZXIlMjBWYWx1ZShzKSU1QyUyMiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlN0QlNUNuJTIwJTIwJTIwJTIwJTVEJTVDbiUyMCUyMCU3RCU1Q24lNUQlMjIlN0QlMkMlMjJ0ZXh0VHdvJTIyJTNBJTdCJTIydmFsdWUlMjIlM0ElMjIlNUIlNUNuJTIwJTIwJTdCJTVDbiUyMCUyMCUyMCUyMCU1QyUyMmNoaWxkcmVuJTVDJTIyJTNBJTIwJTVCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCU3QiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJ0ZXh0JTVDJTIyJTNBJTIwJTVDJTIyRW50ZXIlMjBpbiUyMHRoZSUyMHZhbHVlKHMpJTIweW91J2QlMjBsaWtlJTIwdG8lMjBhZGQuJTVDJTIyJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCU3RCU1Q24lMjAlMjAlMjAlMjAlNUQlNUNuJTIwJTIwJTdEJTVDbiU1RCUyMiU3RCUyQyUyMm11bHRpVmFsdWVJbnB1dExhYmVsJTIyJTNBJTdCJTIydmFsdWUlMjIlM0ElMjIlNUIlNUNuJTIwJTIwJTdCJTVDbiUyMCUyMCUyMCUyMCU1QyUyMmNoaWxkcmVuJTVDJTIyJTNBJTIwJTVCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCU3QiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJ0ZXh0JTVDJTIyJTNBJTIwJTVDJTIyTXklMjBWYWx1ZShzKSU1QyUyMiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlN0QlNUNuJTIwJTIwJTIwJTIwJTVEJTVDbiUyMCUyMCU3RCU1Q24lNUQlMjIlN0QlMkMlMjJtdWx0aVZhbHVlSW5wdXRQbGFjZWhvbGRlciUyMiUzQSU3QiUyMnZhbHVlJTIyJTNBJTIyJTVCJTVDbiUyMCUyMCU3QiU1Q24lMjAlMjAlMjAlMjAlNUMlMjJjaGlsZHJlbiU1QyUyMiUzQSUyMCU1QiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlN0IlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTVDJTIydGV4dCU1QyUyMiUzQSUyMCU1QyUyMkV4YW1wbGUlMjBWYWx1ZSU1QyUyMiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlN0QlNUNuJTIwJTIwJTIwJTIwJTVEJTVDbiUyMCUyMCU3RCU1Q24lNUQlMjIlN0QlMkMlMjJjb250aW51ZUJ1dHRvbkxhYmVsJTIyJTNBJTdCJTIydmFsdWUlMjIlM0ElMjIlNUIlNUNuJTIwJTIwJTdCJTVDbiUyMCUyMCUyMCUyMCU1QyUyMmNoaWxkcmVuJTVDJTIyJTNBJTIwJTVCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCU3QiU1Q24lMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlNUMlMjJ0ZXh0JTVDJTIyJTNBJTIwJTVDJTIyQ29udGludWUlNUMlMjIlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTdEJTVDbiUyMCUyMCUyMCUyMCU1RCU1Q24lMjAlMjAlN0QlNUNuJTVEJTIyJTdEJTJDJTIyY2FuY2VsQnV0dG9uTGFiZWwlMjIlM0ElN0IlMjJ2YWx1ZSUyMiUzQSUyMiU1QiU1Q24lMjAlMjAlN0IlNUNuJTIwJTIwJTIwJTIwJTVDJTIyY2hpbGRyZW4lNUMlMjIlM0ElMjAlNUIlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTdCJTVDbiUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU1QyUyMnRleHQlNUMlMjIlM0ElMjAlNUMlMjJDYW5jZWwlNUMlMjIlNUNuJTIwJTIwJTIwJTIwJTIwJTIwJTdEJTVDbiUyMCUyMCUyMCUyMCU1RCU1Q24lMjAlMjAlN0QlNUNuJTVEJTIyJTdEJTdEJTJDJTIyaWRVbmlxdWUlMjIlM0ElMjJteG1uZjl1aWRtJTIyJTdEJTJDJTIycG9zaXRpb24lMjIlM0ElN0IlMjJ4JTIyJTNBMzMwJTJDJTIyeSUyMiUzQTMwMCU3RCUyQyUyMmdyb3VwJTIyJTNBJTIybm9kZXMlMjIlMkMlMjJyZW1vdmVkJTIyJTNBZmFsc2UlMkMlMjJzZWxlY3RlZCUyMiUzQWZhbHNlJTJDJTIyc2VsZWN0YWJsZSUyMiUzQXRydWUlMkMlMjJsb2NrZWQlMjIlM0FmYWxzZSUyQyUyMmdyYWJiYWJsZSUyMiUzQXRydWUlMkMlMjJwYW5uYWJsZSUyMiUzQWZhbHNlJTJDJTIyY2xhc3NlcyUyMiUzQSUyMiUyMiU3RCU1RCUyQyUyMmNsb25lZEVkZ2VzJTIyJTNBJTVCJTVEJTdE
```
