/*
    This file contains React components and general JS functions for use by React-controlled portions of Adminas.

    Contents:
        || Strings and Formatting
        || "Small" components (spans, icons)
        || Buttons and Controls
        || Price Comparison Table
        || Select
        || Other Form Components
        || Package Data and Methods
        || Backend Data Loading
        || Backend Data Updating
        || Generic functions for updating states
*/

// || Status Code constants
// Notes:
//  >> matching declarations exist in models.py
//  >> these are directly used as CSS classes.
const STATUS_CODE_OK = 'status_ok';
const STATUS_CODE_ACTION = 'status_action';
const STATUS_CODE_ATTN = 'status_attn';


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

function format_timestamp(timeStr){
    const timeDate = new Date(timeStr);

    return `${timeDate.getFullYear()}-${timeDate.getMonth().toString().padStart(2, '0')}-${timeDate.getDate().toString().padStart(2, '0')}`;
}


// || "Small" components (spans, icons)
function JobItemIdIcon(props){
    return <JobItemNameTagSpan  css = "id"
                                name = { props.ji_id } 
                                />
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

    let extra_classes = 'css' in props ? ` ${props.css}` : '';
    return <span class={"name-tag" + extra_classes}>{ props.name }</span>
}

function InvalidIconUI(props){
    if(props.is_valid){
        return null;
    }
    return <div class="invalid-icon"><span>{props.message}</span></div>
}

function WarningSubsection(props){
    // Displays a warning message inside a "subsection": red background on the heading, red left side border.
    // If this boggles the eyes, consider using WarningSubSubsectionUI instead.
    if(!props.show_warning){
        return null;
    }
    return [
        <div className={`warning subsection${props.css !== undefined ? " " + props.css : ""}`}>
            <h4>{ props.title ? props.title : "Warning" }</h4>
            <p>{ props.message }</p>
        </div>
    ]
}

function WarningSubSubsectionUI(props){
    // Sometimes there's already a subsection and the warning text/content must go inside it.
    // If the subsection-within-a-subsection formatting boggles the eyes, use this instead.
    return [
        <div className={`warningSubSubsection${props.css !== undefined ? " " + props.css : ""}`}>
            <h4 className={"warningSubSubsection_heading"}>
                <img src={`${window.PATH_IMAGES}i-warning.svg`}  height="18px" aria-hidden="true" />
                { props.title ? props.title : "Warning" }
            </h4>
            <p className={"warningSubSubsection_text"}>{ props.message }</p>
            { props.children === undefined ?
                null
                : props.children
            }
        </div>
    ]
}

// || Buttons and Controls
function SubmitButton({submit, cssClasses}){
    const css = cssClasses ?? "";
    return  <button 
                className={`button-primary ${ css }`}
                onClick={ submit }
            >
                submit
            </button>
}

function DeleteButton(props){
    // Needs "user_has_permission" boolean (false = don't render) and delete()
    if(!props.user_has_permission){
        return null;
    }
    return  <button type={"button"} class="button-warning delete-btn formControls_button" onClick={ props.delete }>
                delete
            </button>
}

function CancelButton(props){
    // Needs cancel() for onClick
    return <button className={`close${props.css === undefined ? "" : " " + props.css}`} onClick = { props.cancel }><span>close</span></button>
}

function EditorControls(props){
    // Needs sumbit(), delete(), want_delete, bemClass
    return [
        <div className={`controls formControls${props.bemClass === undefined ? "" : " " + props.bemClass}`}>
            <SubmitButton   
                submit = { props.submit }
                cssClasses={"formControls_submit"}
            />
            <DeleteButton  
                delete = { props.delete } 
                user_has_permission = { props.want_delete }  
            />
        </div>
    ]
}


// || Price Comparison Table
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
            <select className={`formy_select${props.cssClasses === undefined ? "" : " " + props.cssClasses}`} name={props.select_name} id={props.select_id} required={props.is_required} onChange={ props.handle_change }>
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

function OptionEmptyDefaultUI(props){
    return <option value="" selected={ props.selected_opt_id !== null && props.selected_opt_id !== '' }>---------</option>
}

function OptionIdAndNameUI(props){
    if(props.is_selected){
        return <option value={props.id} selected>{props.name}</option>
    }
    return <option value={props.id}>{props.name}</option>
}


// || Other Form Components
function FormLabel(props){
    return  <label for={props.inputID} className={"formy_label"}>
                { props.children }
            </label>
}

function LabelFieldContainer({children}){
    return  <div className={"formy_labelFieldContainer"}>
                { children }
            </div>
}



// || Package Data and Methods
function get_actions_object(url, create_f, update_f, delete_f){
    return {
        url, create_f, update_f, delete_f
    }
}

function getter_and_setter(get, set){
    return {
        get, set
    }
}

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
function LoadingUI(props){
    return <div class="loading">Loading...</div>
}

function LoadingErrorUI(props){
    return <div class="loading error">Error loading { props.name }</div>
}

function EmptySectionUI(props){
    return <p className={`empty-section-notice${ props.css !== undefined ? ` ${props.css}` : ''}`}>{ props.message }</p>
}

const useFetch = url => {
    const [data, setData] = React.useState([]);
    const [error, setError] = React.useState(null);
    const [isLoaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            const my_fetch = await fetch(url)
            .then(response => get_json_with_status(response))
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
function url_for_page_load(api_url, job_id, name){
    return `${api_url}?job_id=${job_id}&type=page_load&name=${name}`;
}

// Helper function: add the appropriate GET params when requesting a list of options for a <select>
function url_for_url_list(api_url){
    return `${api_url}?type=urls`;
}

// Helper function. Check if the key appears in the response data and if so, use the setter to set something to it
function set_if_ok(data, key, setter){
    if(typeof data[key] !== 'undefined'){
        setter(data[key]);
    }
}


function get_if_defined(data, key, fallback){
    if(typeof data[key] !== 'undefined'){
        return data[key];
    }
    return fallback;
}

function getUpdatedObjectFromList(name, list, ID_KEY, idToUpdate, new_attributes){
    const oldIdx = list.findIndex(ele => ele[ID_KEY] === idToUpdate);
    if(oldIdx === -1){
        throw Error(`Unrecognised ${name} cannot be edited`);
    }
    return {
        ...list[oldIdx],
        ...new_attributes
    };
}




// || Backend Data Updating
function getFetchHeaders(method, body_obj = null){
    return get_request_options(method, body_obj);
}

const update_server = (url, headers, handle_response) => {
    fetch(url, headers)
    .then(response => get_json_with_status(response))
    .then(resp_json => {
        handle_response(resp_json);
    })
    .catch(error => {
        console.log('Error: ', error)
    });
};

// React component to display a warning message when the backend didn't like something about the user's request
function BackendErrorUI(props){    
    // Needs "message" -- which is null as a default -- and "turn_off_error()"
    if(props.message === null){
        return null;
    }
    return [
        <div class={CLASS_ERROR_MESSAGE}>
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
function update_list_state(listState, setListState, id_key, id, new_attributes){
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

function remove_from_list_state(listState, setListState, id_key, id){
    var index = listState.findIndex(ele => ele[id_key] === parseInt(id));
    if(index === -1){
        return;
    }
    setListState([
        ...listState.slice(0, index),
        ...listState.slice(index + 1)
    ]);  
}

function add_to_list_state(setListState, attributes){
    setListState(prevState => ([
        ...prevState,
        attributes
    ]));
}

function getUpdatedList(list, id_key, id, new_attributes){
    return list.map(ele => {
        if(ele[id_key] === id){
            return new_attributes;
        }
        return ele;
    });
}
