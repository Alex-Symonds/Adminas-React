/*
    This file contains React components and general JS functions for use by React-controlled portions of Adminas.

    Contents:
        || Strings and Formatting
        || Package Data and Methods
        || URL Finders
        || Fetch and request helpers
        || State helper functions
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

function format_timestamp(timeStr){
    const timeDate = new Date(timeStr);

    return `${timeDate.getFullYear()}-${timeDate.getMonth().toString().padStart(2, '0')}-${timeDate.getDate().toString().padStart(2, '0')}`;
}


// || Package Data and Methods
function getter_and_setter(get, set){
    return {
        get, set
    }
}

// || URL Finders
function url_for_page_load(job_id, name){
    // Loads one part of the Job page (or the main bit, depending on "name")
    return `${window.URL_GET_DATA}?job_id=${job_id}&type=page_load&name=${name}`;
}

function url_for_url_list(){
    // Get a list of API endpoints and URLs
    // (This way Django can worry about the paths and React only needs to know the key)
    return `${window.URL_GET_DATA}?job_id=${window.JOB_ID}&type=urls`;
}

function url_for_product_description(product_id, job_id){
    // Dropdown lists of items display the description underneath, to help distinguish between similarly-named items.
    // This endpoint gets the description (Job ID is used to determine the language)
    return `${window.URL_GET_DATA}?type=product_description&product_id=${product_id}&job_id=${job_id}`;
}

function url_for_select_options(get_param){
    // Endpoint for getting a list to use for <option>s in a <select>
    return `${window.URL_GET_DATA}?type=select_options_list&name=${get_param}`;
}



// || Fetch and request helpers
// GET only, reports on loading status
const useFetchWithLoading = url => {
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


// General use, doesn't bother with loading status
async function fetchAndJSON(url, headers, expectedStatus){
    const response = await fetch(url, headers);
    const resp_data = await get_json_with_status(response);
    if(!status_is_good(resp_data, expectedStatus)){
        throw new Error(get_error_message(resp_data));
    }
    return resp_data;
}


// || State helper functions
function set_if_ok(data, key, setter){
    if(typeof data[key] !== 'undefined'){
        setter(data[key]);
        return true;
    } else {
        return false;
    }
}


// Find the current version of the object in a list, then return it with updates applied
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


// Update one object in a list, then return the list
function getUpdatedList(list, id_key, id, new_attributes){
    return list.map(ele => {
        if(ele[id_key] === id){
            return new_attributes;
        }
        return ele;
    });
}

