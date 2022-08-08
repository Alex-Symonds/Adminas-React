/*
    General-purpose functions available on all pages.
*/

const QTY_RE = /\d+(?=( x ))/g;
const CLASS_MESSAGE_BOX = 'system-message-box';
const CLASS_ERROR_MESSAGE = 'temp-warning-msg';

const CSS_GENERIC_PANEL = 'panel';
const CSS_GENERIC_PANEL_HEADING = 'panel-header';
const CSS_GENERIC_FORM_LIKE = 'form-like';

const KEY_RESPONSE_ERROR_MSG = 'error';
const KEY_HTTP_CODE = 'http_code';
const KEY_LOCATION = 'location';


async function update_backend(url, request_options){
    let response = await fetch(url, request_options)
    .catch(error => {
        console.log('Error: ', error);
    });

    return await get_json_with_status(response);
}

async function query_backend(url){
    let response = await fetch(url)
    .catch(error => {
        console.log('Error: ', error);
    });

    return await get_json_with_status(response); 
}


// When deleting something, check for 204 before attempting to JSON anything.
async function jsonOr204(response){
    if(response.status === 204) return 204;
    return await response.json();
}

async function OLDget_json_with_status(response){
    let result = await response.json();
    result[KEY_HTTP_CODE] = response.status;
    return result;
}

function get_status_from_json(json_data){
    const ERROR = -1;
    if(typeof json_data !== 'object') return ERROR;
    if(!(KEY_HTTP_CODE in json_data)) return ERROR;
    return json_data[KEY_HTTP_CODE];
}

async function get_json_with_status(response){
    const content_type = response.headers.get("content-type");
    if(content_type && content_type.indexOf("application/json") !== -1){
        var response_data = await response.json();
    } else {
        var response_data = {};
    }
    response_data[KEY_HTTP_CODE] = response.status;
    response_data[KEY_LOCATION] = response.headers.get("Location");
    return response_data;
}

function status_is_good(json_data, expected_response_code = null){
    const status = get_status_from_json(json_data);
    if(status === -1){
        return false;
    }

    if(expected_response_code === null){
        return status === 200 || status === 201 || status === 204;
    }
    return status === expected_response_code;
}


// Identify when the backend responded with a home-made error; extract the message for display
function responded_with_error_reason(response_json){
    if(typeof response_json != "object"){
        return false;
    }
    return KEY_RESPONSE_ERROR_MSG in response_json;
}

// function get_error_message(response_json){

//     // Handle cases where this is called because the server returned an
//     // unexpected success code.
//     if(status_is_good(response_json)){
//         return 'Page refresh recommended.';
//     }

//     // Handle actual error codes.
//     const status = get_status_from_json(response_json);
//     switch(status){
//         case 400:
//             return 'Invalid inputs.';
//         case 401:
//             return 'You must be logged in.';
//         case 403:
//             if(responded_with_error_reason(response_json)){
//                 return response_json[KEY_RESPONSE_ERROR_MSG];
//             }
//             return 'Request was forbidden by the server.'
//         case 404:
//             return "Requested information was not found."
//         case 409:
//             if(responded_with_error_reason(response_json)){
//                 return response_json[KEY_RESPONSE_ERROR_MSG];
//             }
//             return 'Request clashed with information on server. (The server won.)'
//         case 500:
//             return 'A server error has occurred.';
//         default:
//             return 'Error: something went wrong.'
//     }
// }





// Identify when the backend responded with a home-made error; extract the message for display
function responded_with_error_reason(response_json){
    if(typeof response_json != "object"){
        return false;
    }
    return KEY_RESPONSE_ERROR_MSG in response_json;
}

function get_error_message_from_response(response_json){

    // Handle cases where this is called because the server returned an
    // unexpected success code.
    if(status_is_good(response_json)){
        return 'Page refresh recommended.';
    }

    // Handle actual error codes.
    const status = get_status_from_json(response_json);
    switch(status){
        case 400:
            return 'Invalid inputs.';
        case 401:
            return 'You must be logged in.';
        case 403:
            if(responded_with_error_reason(response_json)){
                return response_json[KEY_RESPONSE_ERROR_MSG];
            }
            return 'Request was forbidden by the server.';
        case 404:
            return "Requested information was not found.";
        case 409:
            if(responded_with_error_reason(response_json)){
                return response_json[KEY_RESPONSE_ERROR_MSG];
            }
            return 'Request clashed with information on server. (The server won.)'
        case 500:
            return 'A server error has occurred.';
        default:
            return 'Error: something went wrong.';
    }
}

function get_error_message(error_info, task_failure_string = null){
    /*
        Pick out the best error message under the circumstances.
        Preference = 
            1) Error message override (expressed via passing in a string instead of an object for error_info)
            2) Helpful error message ("ok on server, but refresh the page", "log in first", "forbidden because it's on an issued document")
            3) Message specifying which task has gone wrong (if one has been passed in)
            4) Vague, generic error message purely based on the response code ("Invalid input.", "Server error.")
            5) Fallback message
    */


    if(typeof error_info == 'string'){
        return error_info;
    }
    else if(typeof error_info == 'object'){

        if(task_failure_string !== null){
            let task_string_has_priority = true;
            if('status' in error_info){
                task_string_has_priority = !error_message_has_high_priority(error_info['status']);
            }

            if(task_string_has_priority){
                return task_failure_string;
            }
        }

        return get_error_message_from_response(error_info);
    }
    else if(task_failure_string !== null){
        return task_failure_string;
    }

    return 'Error: something went wrong.';
}

function error_message_has_high_priority(response_code){
    // If everything is fine on the server and it just returned a slightly different "good"
    // code to the one expected (e.g. 200 instead of 201) then we want to display the
    // "everything's ok, just refresh the page" message and not anything error-y.
    if(status_is_good(response_json)){
        return true;
    }

    // These codes tend to return messages on which the user can act (e.g. "log in"; 
    // "this clashes with another document"), so prefer these
    return response_code == 401 || response_code == 403 || response_code == 409;
}






// Avoid JS errors on conditionally displayed elements
function add_event_listener_if_element_exists(element, called_function){
    if(element !== null){
        element.addEventListener('click', called_function);
    }
}

function responded_with_error(response_json){
    if(typeof response_json != "object"){
        return false;
    }
    return KEY_RESPONSE_ERROR_MSG in response_json;
}

function create_error(message){
    // Create something that will pass the "responded_with_error" test.
    let result = {};
    result[KEY_RESPONSE_ERROR_MSG] = message;
    return result;
}

function get_message_from_error(error_obj){
    return error_obj[KEY_RESPONSE_ERROR_MSG];
}



// Add comma for thousands separator
function numberWithCommas(num) {
    // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    return num.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

// Get the date, localised
function get_date_time(){
    let dt = new Date();
    let display_dt = dt.toLocaleString('en-GB');
    return display_dt;
}


// Obtain the value of the selected option based on the display text
function index_from_display_text(select_ele, display_text){
    for(let s = 0; s < select_ele.options.length; s++){
        if(select_ele.options[s].text === display_text){
            return s;
        }
    }
    return 0;
}

// Find the last element of a type
function get_last_element(selector){
    let elements = document.querySelectorAll(selector);
    let arr_id = elements.length - 1;
    return elements[arr_id];
}

// previously "get_fetch_dict"
function get_request_options(method, body = null){
    let request_options = {
        method: method,
        headers: getDjangoCsrfHeaders(),
        credentials: 'include'         
    }

    if(body != null){
        request_options.body = JSON.stringify(body);
    }

    return request_options;
}


// Taken from Django documentation for CSRF handling.
function getDjangoCsrfHeaders(){
    // Prepare for CSRF authentication
    var csrftoken = getCookie('csrftoken');
    var headers = new Headers();
    headers.append('X-CSRFToken', csrftoken);
    return headers;
}

// Taken from Django documentation for CSRF handling.
function getCookie(name) {
    // Gets a cookie.
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Hiding/showing things will be done via a "hide" CSS class. Use these to apply/unapply based on class.
function hide_all_by_class(classname){
    document.querySelectorAll('.' + classname).forEach(ele => {
        ele.classList.add('hide');
    });
}

function unhide_all_by_class(classname){
    document.querySelectorAll('.' + classname).forEach(ele => {
        ele.classList.remove('hide');
    });
}


// Wipe data from a form row
function wipe_data_from_form(form_ele){
    let targets = form_ele.children;
    for(var i=0; i < targets.length; i++){
        if(targets[i].tagName === 'INPUT' && (targets[i].type === 'number' || targets[i].type === 'text')){
            targets[i].value = '';
        }
        if(targets[i].tagName === 'SELECT'){
            targets[i].selectedIndex = 0;
        }
    }
    return false;
}


// Used to determine the order in which elements appear within a parent
function get_ele_index(target_child, parent){
    let index = -1;

    if(!target_child || !parent){
        return index;
    }

    let children = parent.children;
    let children_arr = [...children];
    for(let i = 0; i < children_arr.length; ++i){
        if(children_arr[i] == target_child){
            index = i;
            break;
        }
    }

    return index;
}


// -------------------------------------
// CREATE GENERIC DOM ELEMENTS
// -------------------------------------

// Response message (general)
function create_message_ele(){
    let message_ele = document.createElement('div');
    message_ele.classList.add(CLASS_MESSAGE_BOX);

    return message_ele;
}

function create_dismissable_error(error_obj, task_failure_string = null){
    let error_message_ele = document.createElement('div');
    error_message_ele.classList.add(CLASS_ERROR_MESSAGE);

    let display_str_ele = document.createElement('div');
    display_str_ele.innerHTML = get_error_message(error_obj, task_failure_string);
    error_message_ele.append(display_str_ele);

    let dismiss_btn = create_generic_ele_cancel_button();
    dismiss_btn.addEventListener('click', (e) => {
        e.target.closest(`.${CLASS_ERROR_MESSAGE}`).remove();
    })
    error_message_ele.append(dismiss_btn);

    return error_message_ele;
}

// Response message (documents, used by both Builder and Main)
function display_document_response_message(data, string_is_error = false){
    let anchor_ele = document.querySelector('.status-controls');
    let message_ele = document.querySelector('.' + CLASS_MESSAGE_BOX);

    if(message_ele == null){
        message_ele = create_message_ele();
        anchor_ele.append(message_ele);
    }

    let message_str;
    if(typeof data === 'string'){
        if(string_is_error) message_ele.classList.add(CLASS_ERROR_MESSAGE);
        message_str = data;
    }
    else if('message' in data){
        message_str = data['message'];
    }
    else if(responded_with_error_reason(data)){
        message_ele.classList.add(CLASS_ERROR_MESSAGE);
        message_str = `Error: ${get_error_message(data)} @ ${get_date_time()}`;
    }  
    else {
        message_ele.classList.add(CLASS_ERROR_MESSAGE);
        message_str = 'Something went wrong, try refreshing the page';
    }

    message_ele.innerHTML = `${message_str} @ ${get_date_time()}`;
    
}


// Forms or "forms". New JI Form, Edit Filled Slot: create a quantity field
function get_jobitem_qty_field(){
    let fld = document.createElement('input');
    fld.type = 'number';
    fld.name = 'qty';
    fld.id = 'id_qty';
    fld.required = true;
    fld.min = 1;

    return fld;
}

// Create a "panel"
function create_generic_ele_panel(){
    let div = document.createElement('div');
    div.classList.add('panel');
    return div;
}

// Create a "panel" which is pretending to be a form
function create_generic_ele_formy_panel(){
    let div = create_generic_ele_panel();
    div.classList.add('form-like');
    return div;
}

// Create a "cancel" button which doesn't do anything yet, to go in the top right of a panel
function create_generic_ele_cancel_button(){
    let cancel_btn = document.createElement('button');
    cancel_btn.classList.add('close');

    let hover_label_span = document.createElement('span');
    hover_label_span.innerHTML = 'close';
    cancel_btn.append(hover_label_span);

    return cancel_btn;
}

// Create a "submit" button, which doesn't do anything yet
function create_generic_ele_submit_button(){
    let submit_btn = document.createElement('button');

    submit_btn.classList.add('button-primary');
    submit_btn.innerHTML = 'submit';

    return submit_btn;
}

// Create a "delete" button, which doesn't do anything yet
function create_generic_ele_delete_button(){
    let delete_btn = document.createElement('button');
    delete_btn.innerHTML = 'delete';

    delete_btn.classList.add('button-warning');
    delete_btn.classList.add('delete-btn');

    return delete_btn;
}

// Create an "edit" button, which doesn't do anything yet
function create_generic_ele_edit_button(){
    let edit_btn = document.createElement('button');
    edit_btn.classList.add('edit-icon');

    let hover_label_span = document.createElement('span');
    hover_label_span.innerHTML = 'edit';
    edit_btn.append(hover_label_span);

    return edit_btn;
}