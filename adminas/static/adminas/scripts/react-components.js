/*
    This file contains React components and general JS functions for use by React-controlled portions of Adminas.

    Contents:
        || Strings and Formatting
        || Buttons and Controls
        || Price Comparison Table
        || Select
        || Package Data and Methods
        || Backend Data Loading
        || Backend Data Updating
        || Generic functions for updating states
*/


// || Strings and Formatting
function nbsp(){
    return '\u00A0';
}

function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

function format_money(float_value){
    if(isNaN(float_value)){
        return '-';
    }
    return float_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
}

function format_percentage(perc, min_digits = 0){
    if(isNaN(perc)){
        return '-%';
    }
    return perc.toLocaleString(undefined, {minimumFractionDigits: min_digits, maximumFractionDigits: 2}) + '%';
}

function JobItemIdIcon(props){
    if(props.ji_id === null){
        return null;
    }
    return <span class="name-tag id">{ props.ji_id }</span>
}

function JobItemPriceListIconSpan(props){
    let price_list_name = props.price_list_name;
    if(price_list_name === null){
        price_list_name = 'TBC';
    }

    return <JobItemNameTagSpan name = { price_list_name } />
}

function JobItemNameTagSpan(props){
    if(props.name === null){
        return null;
    }

    return <span class="name-tag">{ props.name }</span>
}


// || Buttons and Controls
function SubmitButton(props){
    // Needs submit()
    return <button class="button-primary" onClick={ props.submit }>submit</button>
}

function DeleteButton(props){
    // Needs "user_has_permission" boolean (false = don't render) and delete()
    if(!props.user_has_permission){
        return null;
    }
    return <button class="button-warning delete-btn" onClick={ props.delete }>delete</button>
}

function CancelButton(props){
    // Needs cancel() for onClick
    return <button class="close" onClick = { props.cancel }><span>close</span></button>
}

function EditorControls(props){
    // Needs sumbit(), delete(), want_delete
    return [
        <div class="controls">
            <SubmitButton   submit = { props.submit }/>
            <DeleteButton   delete = { props.delete } 
                            user_has_permission = { props.want_delete }  />
        </div>
    ]
}



// || Price Comparison Table
// The Job pages compares the sum total of all the individual items entered against the total PO value and the total list price.
// Both sections display a similar table.
function PriceComparisonTable(props){
    let difference_as_perc = 0;
    if(props.second_value !== 0){
        difference_as_perc = props.difference / props.second_value * 100;
    }
    
    return <PriceComparisonTableUI  currency = { props.currency }
                                    difference = { props.difference }
                                    difference_as_perc = { difference_as_perc }
                                    first_title = { props.first_title }
                                    first_value = { props.first_value }
                                    second_title = { props.second_title }
                                    second_value = { props.second_value }
                                    />
}

function PriceComparisonTableUI(props){
    return [
        <table id="po-discrepancy" class="price-comparison">
            <tr><th>{props.first_title}</th><td>{props.currency}</td><td class="po-total-price-f number">{format_money(props.first_value)}</td><td></td></tr>
            <tr><th>{props.second_title}</th><td>{props.currency }</td><td class="selling-price number">{format_money(props.second_value)}</td><td></td></tr>
            <tr class="conclusion"><th>Difference</th><td>{props.currency}</td><td class="diff-val number">{format_money(props.difference)}</td><td><span class="diff-perc">{format_percentage(props.difference_as_perc)}</span></td></tr>
        </table>
    ]
}

function QuantityNameLi(props){
    return [
        <li>{ props.quantity } x {props.name}</li>
    ]
}



// || Select (React component)
// Create a <select> element with a list of valid options obtained from the backend.
function SelectBackendOptions(props){
    const url = props.api_url + '?type=select_options_list&name=' + props.get_param;
    const { data, error, isLoaded } = useFetch(url);
    if(error){
        return <LoadingErrorUI name='dropdown' />
    }
    
    else if (!isLoaded || typeof data.opt_list === 'undefined'){
        return <LoadingUI />
    }

    else{
        return [
            <select name={props.select_name} id={props.select_id} required={props.is_required} onChange={ props.handle_change }>
                <OptionEmptyDefaultUI selected_opt_id = {props.selected_opt_id}/>
                {
                    data.opt_list.map((option) => {
                        var is_selected = option.id == props.selected_opt_id;

                        return <OptionIdAndNameUI   key = {option.id.toString()}
                                                    id = {option.id}
                                                    is_selected = {is_selected}
                                                    name = {option.display_str}
                                                    />
                    })
                }
            </select>
        ]
    }
}

// Part of <select>. This is a "none" option to add above the "real" options.
function OptionEmptyDefaultUI(props){
    return <option value="" selected={ props.selected_opt_id !== null && props.selected_opt_id !== '' }>---------</option>
}

// Part of <select>. Add an option using a single id / name pair.
function OptionIdAndNameUI(props){
    if(props.is_selected){
        return <option value={props.id} selected>{props.name}</option>
    }
    return <option value={props.id}>{props.name}</option>
}


// || Package Data and Methods
// Group together URL for backend access with state management functions
function get_actions_object(url, create_f, update_f, delete_f){
    return {
        url, create_f, update_f, delete_f
    }
}

// Group a state and its updater for convenient passing as props
function get_and_set(get, set){
    return {
        get, set
    }
}

// Group edit mode stuff, i.e turn on/off and info to determine "should I be on or off?"
function get_editor_object(this_id, state_id, update_state){
    function edit_on(){
        update_state(this_id);
    }
    function edit_off(){
        update_state(null);
    }
    return {
        'on': edit_on,
        'off': edit_off,
        'active_id': state_id,
        'is_active': state_id === this_id
    };
}

// || Backend Data Loading
// Component to display when waiting for data from the server
function LoadingUI(props){
    return <div class="loading">Loading...</div>
}

// Component to display when loading data from the server has gone horribly wrong
function LoadingErrorUI(props){
    return <div class="loading error">Error loading { props.name }</div>
}

// Component to display when there was no data to display.
function EmptySectionUI(props){
    return <p class="empty-section-notice">{ props.message }</p>
}

// Reusable function to GET data from the server, also returning the "error" and "isLoaded"
// variables used to activate the loading elements
const useFetch = url => {
    const [data, setData] = React.useState([]);
    const [error, setError] = React.useState(null);
    const [isLoaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            const my_fetch = await fetch(url)
            .then(response => response.json())
            .then(resp_json => {
                if(!status_is_good(resp_json)){
                    setError(get_error_message(resp_json));
                }
                setData(resp_json);
                setLoaded(true);
            })
            .catch(error => {
                setError(error);
                setLoaded(true);
            });
        };
        fetchData();
    }, [url]);

    return { data, error, isLoaded };
};


// Helper function: add the appropriate GET params to requests for initial page data
function url_for_page_load(main_url, job_id, name){
    return `${main_url}?job_id=${job_id}&type=page_load&name=${name}`;
}

// Helper function: add the appropriate GET params when requesting a list of options for a <select>
function url_for_url_list(main_url, job_id){
    return `${main_url}?job_id=${job_id}&type=urls`;
}

// Helper function. Check if the key appears in the response data and if so, use the setter to set something to it
function set_if_ok(data, key, setter){
    if(typeof data[key] !== 'undefined'){
        setter(data[key]);
    }
}





// || Backend Data Updating
// Generate a set of headers
function getFetchHeaders(method, body_obj){
    const headers = {
        method: method,
        headers: getDjangoCsrfHeaders(),
        credentals: 'include' 
    }

    if(body_obj !== null){
        headers.body = JSON.stringify(body_obj)
    }

    return headers;
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

// Send data to the server
const update_server = (url, headers, handle_response) => {
    fetch(url, headers)
    .then(response => jsonWithStatus(response))
    .then(resp_json => {
        handle_response(resp_json);
    })
    .catch(error => {
        console.log('Error: ', error)
    });
};

// When deleting something where the server may respond 204, check for that before attempting to JSON anything.
async function jsonOr204(response){
    if(response.status === 204) return 204;
    return await response.json();
}

async function jsonWithStatus(response){
    const content_type = response.headers.get("content-type");
    if(content_type && content_type.indexOf("application/json") !== -1){
        var response_data = await response.json();
    } else {
        var response_data = {};
    }
    response_data[KEY_HTTP_CODE] = response.status;
    return response_data;
}

function get_status_from_json(json_data){
    const ERROR = -1;
    if(typeof json_data !== 'object') return ERROR;
    if(!(KEY_HTTP_CODE in json_data)) return ERROR;
    return json_data[KEY_HTTP_CODE];
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
//const KEY_RESPONSE_ERROR_MSG = 'error';
function responded_with_error(response_json){
    if(typeof response_json != "object"){
        return false;
    }
    return KEY_RESPONSE_ERROR_MSG in response_json;
}

function responded_with_error_reason(response_json){
    if(typeof response_json != "object"){
        return false;
    }
    return KEY_RESPONSE_ERROR_MSG in response_json;
}

function get_error_message(response_json){

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
            return 'Request was forbidden by the server.'
        case 404:
            return "Requested information was not found."
        case 409:
            if(responded_with_error_reason(response_json)){
                return response_json[KEY_RESPONSE_ERROR_MSG];
            }
            return 'Request clashed with information on server. (The server won.)'
        case 500:
            return 'A server error has occurred.';
        default:
            return 'Error: something went wrong.'
    }
}

// React component to display a warning message when the backend didn't like something about the user's request
function BackendErrorUI(props){    
    // Needs "message" -- which is null as a default -- and "turn_off_error()"
    if(props.message === null){
        return null;
    }
    return [
        <div class="temp-warning-msg">
            <div class="message">{ props.message }</div>
            <CancelButton   cancel = { props.turn_off_error } />
        </div>]
}

// When passing backend errors as props, I usually want some combination of contents, set and clear. It'd be nice to pass
// contents and clear together (and set, if the fetch is in a different component to the state), so here's a grouping
function get_backend_error_object(property, updater){
    function set(message){
        updater(message);
    }
    function clear(){
        updater(null);
    }
    return {
        message: property,
        set: set,
        clear: clear
    }
}



// || Generic functions for updating states
function list_state_update(listState, setListState, id_key, id, new_attributes){
    var index = listState.findIndex(ele => ele[id_key] === parseInt(id));
    if(index === -1){
        return;
    }
    setListState([
        ...listState.slice(0, index),
        Object.assign(listState[index], new_attributes),
        ...listState.slice(index + 1)
    ]);
}

function list_state_delete(listState, setListState, id_key, id){
    var index = listState.findIndex(ele => ele[id_key] === parseInt(id));
    if(index === -1){
        return;
    }
    setListState([
        ...listState.slice(0, index),
        ...listState.slice(index + 1)
    ]);  
}

function list_state_create_one(setListState, attributes){
    setListState(prevState => ([
        ...prevState,
        attributes
    ]));
}