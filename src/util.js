/*
    General-purpose functions available on all pages.

    Contents:
        || Strings and Formatting
        || Package Data and Methods
        || URL Finders
        || Fetch and request helpers
        || State helper export functions
        || Server comms
        || Formatting
        || Toggle element visibility CSS class
        || DOM utils
        || DOM elements
*/

export const QTY_RE = /\d+(?=( x ))/g;

const CLASS_MESSAGE_BOX = 'system-message-box';
export const CLASS_ERROR_MESSAGE = 'temp-warning-msg';

export const CSS_GENERIC_PANEL = 'panel';
export const CSS_GENERIC_PANEL_HEADING = 'panel-header';
export const CSS_GENERIC_FORM_LIKE = 'form-like';
export const CSS_EDIT_ICON = 'edit-icon';
export const CSS_HIDE = 'hide';

const KEY_HTTP_CODE = 'http_code';
export const KEY_LOCATION = 'location';
const GOOD_RESPONSE_CODES = new Set([200, 201, 204]);

const RETURN_ERROR = -1;


// || Strings and Formatting
export function nbsp(){
    return '\u00A0';
}

export function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

export function format_money(float_value){
    if(isNaN(float_value)){
        return '-';
    }
    return float_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
}

export function format_percentage(perc, min_digits = 0){
    if(isNaN(perc)){
        return '-%';
    }
    return perc.toLocaleString(undefined, {minimumFractionDigits: min_digits, maximumFractionDigits: 2}) + '%';
}

export function format_timestamp(timeStr){
    const timeDate = new Date(timeStr);

    return `${timeDate.getFullYear()}-${timeDate.getMonth().toString().padStart(2, '0')}-${timeDate.getDate().toString().padStart(2, '0')}`;
}


// || Package Data and Methods
export function getter_and_setter(get, set){
    return {
        get, set
    }
}

// || URL Finders
export function url_for_page_load(job_id, name){
    // Loads one part of the Job page (or the main bit, depending on "name")
    return `${window.URL_GET_DATA}?job_id=${job_id}&type=page_load&name=${name}`;
}

export function url_for_url_list(){
    // Get a list of API endpoints and URLs
    // (This way Django can worry about the paths and React only needs to know the key)
    return `${window.URL_GET_DATA}?job_id=${window.JOB_ID}&type=urls`;
}

export function url_for_product_description(product_id, job_id){
    // Dropdown lists of items display the description underneath, to help distinguish between similarly-named items.
    // This endpoint gets the description (Job ID is used to determine the language)
    return `${window.URL_GET_DATA}?type=product_description&product_id=${product_id}&job_id=${job_id}`;
}

export function url_for_select_options(get_param){
    // Endpoint for getting a list to use for <option>s in a <select>
    return `${window.URL_GET_DATA}?type=select_options_list&name=${get_param}`;
}



// || Fetch and request helpers
// General use, doesn't bother with loading status
export async function fetchAndJSON(url, headers, expectedStatus){
    const response = await fetch(url, headers);
    const resp_data = await get_json_with_status(response);
    if(!status_is_good(resp_data, expectedStatus)){
        throw new Error(get_error_message(resp_data));
    }
    return resp_data;
}


// || State helper export functions
export function set_if_ok(data, key, setter){
    if(typeof data[key] !== 'undefined'){
        setter(data[key]);
        return true;
    } else {
        return false;
    }
}


// Find the current version of the object in a list, then return it with updates applied
export function getUpdatedObjectFromList(name, list, ID_KEY, idToUpdate, new_attributes){
    const oldIdx = list.findIndex(ele => ele[ID_KEY] === idToUpdate);
    if(oldIdx === -1){
        throw Error(`Unrecognised ${name} cannot be edited`);
    }
    return {
        ...list[oldIdx],
        ...new_attributes
    };
}


// Update one object in a list, then return the list
export function getUpdatedList(list, id_key, id, new_attributes){
    return list.map(ele => {
        if(ele[id_key] === id){
            return new_attributes;
        }
        return ele;
    });
}




// || Server comms
export function getRequestOptions(method, body = null){
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
export function getDjangoCsrfHeaders(){
    // Prepare for CSRF authentication
    var csrftoken = getCookie('csrftoken');
    var headers = new Headers();
    headers.append('X-CSRFToken', csrftoken);
    return headers;
}

// Taken from Django documentation for CSRF handling.
export function getCookie(name) {
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


// TO REMOVE: Used in module management, which has no other error handling
export async function update_backend(url, request_options){
    let response = await fetch(url, request_options)
    .catch(error => {
        console.log('Error: ', error);
    });

    return await get_json_with_status(response);
}

// TO REMOVE: Used in module management, document builder, which has no other error handling
export async function query_backend(url){
    let response = await fetch(url)
    .catch(error => {
        console.log('Error: ', error);
    });

    return await get_json_with_status(response); 
}


export async function get_json_with_status(response){
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


export function status_is_good(json_data, expected_response_code = null){
    const status = get_status_from_json(json_data);
    if(status === RETURN_ERROR){
        return false;
    }
    if(expected_response_code === null){
        return GOOD_RESPONSE_CODES.has(status);
    }
    return status === expected_response_code;
}


export function get_status_from_json(json_data){
    if(typeof json_data !== 'object') return RETURN_ERROR;
    if(!(KEY_HTTP_CODE in json_data)) return RETURN_ERROR;
    if(typeof json_data[KEY_HTTP_CODE] === 'string'){
        return parseInt(json_data[KEY_HTTP_CODE])
    }
    return json_data[KEY_HTTP_CODE];
}


export function get_error_message(error_info, task_failure_string = null){
    /*
        Pick out the best error message under the circumstances.
        Preference = 
            1) Error message override (expressed via passing in a string instead of an object for error_info)
            2) Helpful messages (suggesting a fix or at least specifying exactly why it went wrong)
            3) Message stating which task went wrong
            4) Vague messages
            5) Fallback message
    */
    const KEY_RESPONSE_ERROR_MSG = 'error';



    if(typeof error_info == 'string'){
        return error_info;
    }
    else if(typeof error_info == 'object'){

        if(task_failure_string !== null){
            let task_string_has_priority = true;

            let response_code = get_status_from_json(error_info);
            if(response_code !== RETURN_ERROR){
                task_string_has_priority = !prefer_response_error_to_task_error(response_code);
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

    // Helpers
    function prefer_response_error_to_task_error(response_code){
        // Note to self: you have some generic error messages based on the response code,
        // but also some tasks actually make their own custom error messages. 
    
        // A "good" status code means the server is happy, which means the task itself succeeded.
        // That means the task-related error message is flat-out *wrong* and should not be displayed to the user.
        // Prefer the response error message, whatever it is (even a blank would be preferable).
        if(GOOD_RESPONSE_CODES.has(response_code)){
            return true;
        }
    
        // Prefer codes which return messages on which the user can act (e.g. "log in"; 
        // "this clashes with another document")
        return response_code == 401 || response_code == 403 || response_code == 409;
    }
    
    
    function get_error_message_from_response(response_json){
        if(status_is_good(response_json)){
            return 'Page refresh recommended.';
        }
    
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

    function responded_with_error_reason(response_json){
        if(typeof response_json != "object"){
            return false;
        }
        return KEY_RESPONSE_ERROR_MSG in response_json;
    }
}


// || Formatting
export function get_date_time(){
    let dt = new Date();
    let display_dt = dt.toLocaleString('en-GB');
    return display_dt;
}


export function string_to_boolean(str){
    if(typeof str !== 'string') return null;
    if(typeof str === 'boolean') return str;

    let str_lower = str.toLowerCase();
    if(str_lower === 'true') return true;
    if(str_lower === 'false') return false;
    return null;
}



// || Toggle element visibility CSS class
export function hide_all_by_class(classname){
    document.querySelectorAll('.' + classname).forEach(ele => {
        ele.classList.add(CSS_HIDE);
    });
}

export function unhide_all_by_class(classname){
    document.querySelectorAll('.' + classname).forEach(ele => {
        ele.classList.remove(CSS_HIDE);
    });
}

export function disableAllByClass(classname){
    document.querySelectorAll('.' + classname).forEach(ele => {
        ele.disabled = true;
    });
}

export function enableAllByClass(classname){
    document.querySelectorAll('.' + classname).forEach(ele => {
        ele.disabled = false;
    });
}


// || DOM utils
export function get_ele_index(target_child, parent){
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

export function add_event_listener_if_element_exists(element, called_function){
    if(element !== null){
        element.addEventListener('click', called_function);
    }
}


// || DOM elements
export function create_generic_ele_dismissable_error(error_obj, task_failure_string = null){
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


export function display_document_response_message(data, string_is_error = false){
    let anchor_ele = document.querySelector('.documentWarnings');
    let message_ele = document.querySelector('.' + CLASS_MESSAGE_BOX);

    if(message_ele == null){
        message_ele = create_generic_ele_message();
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
    else if(get_error_message().responded_with_error_reason(data)){
        message_ele.classList.add(CLASS_ERROR_MESSAGE);
        message_str = `Error: ${get_error_message(data)}`;
    }  
    else {
        message_ele.classList.add(CLASS_ERROR_MESSAGE);
        message_str = 'Something went wrong, try refreshing the page';
    }

    message_ele.textContent = `${message_str} @ ${get_date_time()}`;
    
}

export function create_generic_ele_message(){
    let message_ele = document.createElement('div');
    message_ele.classList.add(CLASS_MESSAGE_BOX);

    return message_ele;
}


export function create_generic_ele_label(display_str, for_id){
    let label = document.createElement('label');
    label.innerHTML = display_str;
    label.for = for_id;
    return label;
}


export function create_generic_ele_checkbox(id, want_checked = false){
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;

    if(want_checked){
        checkbox.checked = true;
    }

    return checkbox;
}


export function create_generic_ele_cancel_button(){
    let cancel_btn = document.createElement('button');
    cancel_btn.classList.add('close');

    let hover_label_span = document.createElement('span');
    hover_label_span.innerHTML = 'close';
    cancel_btn.append(hover_label_span);

    return cancel_btn;
}


export function create_generic_ele_submit_button(){
    let submit_btn = document.createElement('button');

    submit_btn.classList.add('button-primary');
    submit_btn.innerHTML = 'submit';

    return submit_btn;
}


export function create_generic_ele_delete_button(){
    let delete_btn = document.createElement('button');
    delete_btn.innerHTML = 'delete';

    delete_btn.classList.add('button-warning');
    delete_btn.classList.add('delete-btn');

    return delete_btn;
}


export function create_generic_ele_edit_button(){
    let edit_btn = document.createElement('button');
    edit_btn.classList.add(CSS_EDIT_ICON);

    let hover_label_span = document.createElement('span');
    hover_label_span.innerHTML = 'edit';
    edit_btn.append(hover_label_span);

    return edit_btn;
}


export function create_generic_ele_jobitem_quantity_input(){
    let fld = document.createElement('input');
    fld.type = 'number';
    fld.name = 'qty';
    fld.id = 'id_qty';
    fld.required = true;
    fld.min = 1;

    return fld;
}


export function create_generic_ele_panel(){
    let div = document.createElement('div');
    div.classList.add(CSS_GENERIC_PANEL);
    return div;
}


export function create_generic_ele_formy_panel(){
    let div = create_generic_ele_panel();
    div.classList.add(CSS_GENERIC_FORM_LIKE);
    return div;
}


