/*
Name: library_html
Description: 
    This script returns reusable javascript encapsulated in strings
    that can be injected into a journey using `callbacksBuilder.scriptTextOutputCallback(library_html.function(x))`

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

//// UTILITY FUNCTIONS

//// EXPORTS

//// GENERAL (applies to all HTML)
/**
* Sets the page title to the provided string
* @param {string} text The title with which to update the page
* @return the string including the injected javascript to update the page title.
*/
exports.setPageTitle = function(text) {
    return `document.title = "${String(text)}";`;
};

/**
 * Formats the provided input type given the values provided
 * @param name The name of the NameCallback, used to target the element
 * @param id The ID to assign to the input
 * @param type The HTML input type (e.g. text, tel, email, number)
 * @param required The HTML tag indicating the input is required
 * @returns A formatted JS string to be used in a ScriptTextOutputCallback
 */
exports.formatInput = function(name, id, type, required) {
    return `\
      var input = document.querySelector('*[data-vv-as="${name}"]');\
        input.id = "${id}";\
        input.type = "${type}";\
        input.required = ${!!required};\
    `;
};

/**
* Renders a copy button inside the card header
* @param {string} textToCopy The string that will be copied to the clipboard
* @param {string} label (optional) The label that shows up on the button. Defaults to "Copy Value(s)"
* @return the string including the injected javascript to update the page node header.
*/
exports.generateTextCopyButon = function(textToCopy,label) {    
  var html = `\
        var copyText = (text, htmlElement) => {\
          navigator.clipboard.writeText(text);\
          htmlElement.innerText = 'Copied!';\
        };\
        
        var header = document.getElementsByClassName("login-header")[0].childNodes[0];\
        
        var buttonLabel = "${label ? String(label) : 'Copy Value(s)'}";\
        var button = document.createElement('button');\
        button.id = 'copyValueButton';\
        button.classList.add('btn');\
        button.classList.add('btn-primary');\
        button.innerText = buttonLabel;\
        button.onclick = function(){ copyText('${String(textToCopy)}', this) };\
        header.appendChild(button);\
        `;
  
  return html;
};

//// PAGE NODE (applies to content in a Page Node)
/**
* Sets the Header value of a Page Node
* @param {Array[string]} content The content with which to update the header
* @return the string including the injected javascript to update the page node header.
*/
exports.setPageNodeHeader = function(content) {
    return `document.title = "${String(content)}";`;
};