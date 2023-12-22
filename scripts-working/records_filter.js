/*
    Enable simple filtering of the Records page.

    Contents:
        || Open menu
        || Submit Filter Options
*/


const ID_BEGIN_FILTER_BUTTON = 'id_filter_records';
const ID_FILTER_OPTIONS_ELE = 'id_filter_options';
const CLASS_FILTER_OPTIONS_BODY = 'filter-options-body';
const ID_FILTER_CONTROLS_CONTAINER = 'filter_controls';
const ID_PREFIX_FILTER_FIELDS = 'id_filter_';

const FALLBACK_STR = '-';
const RANGE_START = 's';
const RANGE_END = 'e';

const RECORDS_FILTER_SETTINGS = [
    {
        'title': 'Job Reference',
        'input_type': 'single-text',
        'id': 'ref_job'
    },
    {
        'title': 'PO Reference',
        'input_type': 'single-text',
        'id': 'ref_po'
    },
    {
        'title': 'Quote Reference',
        'input_type': 'single-text',
        'id': 'ref_quote'
    },
    {
        'title': 'Customer',
        'input_type': 'select',
        'id': 'customer'
    },
    {
        'title': 'Agent',
        'input_type': 'select',
        'id': 'agent'
    },
    {
        'title': 'Date of Entry',
        'input_type': 'range-date',
        'id': 'date'
    }
]



// Evenet listeners for existing buttons
document.addEventListener('DOMContentLoaded', () => {

    document.getElementById(ID_BEGIN_FILTER_BUTTON).addEventListener('click', () => {
        open_filter_options();
    });

});



// || Open menu
async function open_filter_options(){
    let filter_container = document.getElementById(ID_FILTER_CONTROLS_CONTAINER);
    let filter_options_ele = await create_ele_filter_options();

    const modal = create_generic_modal(filter_options_ele);
    filter_container.append(modal);
    open_modal(modal);
}


async function create_ele_filter_options(){
    let filter_options_ele = document.createElement('form');
    //filter_options_ele.classList.add(CSS_GENERIC_FORM_LIKE);
    filter_options_ele.id = ID_FILTER_OPTIONS_ELE;
    
    filter_options_ele.append(create_ele_filter_options_heading());

    const ele = document.createElement('div');
    ele.classList.add(CSS_MODAL_CONTENTS);
    ele.classList.add("recordsFilter_formContents");
    ele.classList.add("formy");

    ele.append(await create_ele_filter_options_body());
    ele.append(create_ele_filter_options_submit());

    filter_options_ele.append(ele);

    return filter_options_ele;
}

// async function create_ele_filter_options(){
//     let filter_options_ele = create_generic_ele_formy_panel();
//     filter_options_ele.id = ID_FILTER_OPTIONS_ELE;
//     filter_options_ele.classList.add()

//     filter_options_ele.append(create_ele_filter_options_close_button());
//     filter_options_ele.append(create_ele_filter_options_heading());
//     filter_options_ele.append(await create_ele_filter_options_body());
//     filter_options_ele.append(create_ele_filter_options_submit());

//     return filter_options_ele;
// }

// Open Filter Options: Component
// function create_ele_filter_options_close_button(){
//     let btn = create_generic_ele_cancel_button();
//     btn.addEventListener('click', () => {
//         let ele = document.getElementById(ID_FILTER_OPTIONS_ELE);
//         if(ele !== null){
//             ele.remove();
//         }
//     });
//     return btn;
// }


function create_ele_filter_options_heading(){
    let ele = document.createElement('h4');
    // ele.classList.add(CSS_GENERIC_PANEL_HEADING);
    ele.classList.add(CSS_MODAL_HEADING);
    ele.innerHTML = 'Filter Options';
    return ele;
}


async function create_ele_filter_options_body(){
    let ele = document.createElement('div');
    ele.classList.add("formy_inputsContainer");

    for(let i = 0; i < RECORDS_FILTER_SETTINGS.length; i++){
        if(RECORDS_FILTER_SETTINGS[i].input_type === 'single-text'){
            ele.append(create_ele_filter_option_text_input(RECORDS_FILTER_SETTINGS[i]));
        }
        else if(RECORDS_FILTER_SETTINGS[i].input_type === 'select'){
            ele.append(await create_filter_option_select(RECORDS_FILTER_SETTINGS[i]));
        }
        else if(RECORDS_FILTER_SETTINGS[i].input_type === 'range-date'){
            ele.append(create_ele_filter_option_date_range(RECORDS_FILTER_SETTINGS[i]));
        }
    }

    return ele;
}


function create_ele_filter_options_submit(){
    const container = document.createElement('div');
    container.classList.add('formControls');

    const ele = create_generic_ele_submit_button();
    ele.classList.add('button-primary');
    ele.classList.add('formControls_submit');
    ele.classList.add('recordsFilter_submit');
    ele.type = "button";
    ele.innerHTML = 'apply filter';

    ele.addEventListener('click', () => {
        reload_page_with_filters();
    });
    return ele;
}


// function create_ele_filter_options_submit(){
//     let ele = create_generic_ele_submit_button();
//     ele.classList.add('full-width-button');
//     ele.innerHTML = 'apply filter';

//     ele.addEventListener('click', () => {
//         reload_page_with_filters();
//     });
//     return ele;
// }


function create_ele_filter_option_base(FILTER_SETTINGS){
    // Use this for the stuff that'll be reused for each option, regardless of type
    const ele = create_formy_labelFieldContainer();
    const label = create_generic_ele_label(FILTER_SETTINGS.title, ID_PREFIX_FILTER_FIELDS + FILTER_SETTINGS.id);
    label.classList.add("formy_label");
    ele.append(label);

    return ele;
}


function create_formy_labelFieldContainer(){
    const ele = document.createElement('div');
    ele.classList.add("formy_labelFieldContainer");
    return ele;
}


function create_ele_filter_option_text_input(FILTER_SETTINGS){
    let ele = create_ele_filter_option_base(FILTER_SETTINGS);

    let input_ele = document.createElement('input');
    input_ele.type = 'text';
    input_ele.id = ID_PREFIX_FILTER_FIELDS + FILTER_SETTINGS.id;

    ele.append(input_ele);
    return ele;
}

function create_ele_filter_option_date_range(FILTER_SETTINGS){
    let ele = document.createElement('fieldset');

    let heading = document.createElement('legend');
    heading.classList.add("formy_label");
    heading.innerHTML = FILTER_SETTINGS.title;
    ele.append(heading);

    const container = document.createElement('div');
    container.classList.add("recordsFilter_fieldsetContainer");

    const labelInput1 = create_formy_labelFieldContainer();
    let idStartDate = `${ID_PREFIX_FILTER_FIELDS}${RANGE_START}${FILTER_SETTINGS.id}`;
    labelInput1.append(create_generic_ele_label('From', idStartDate));
    labelInput1.append(create_ele_filter_option_date_input(idStartDate));
    container.append(labelInput1);

    const labelInput2 = create_formy_labelFieldContainer();
    let idEndDate = `${ID_PREFIX_FILTER_FIELDS}${RANGE_END}${FILTER_SETTINGS.id}`;
    labelInput2.append(create_generic_ele_label('To', idEndDate));
    labelInput2.append(create_ele_filter_option_date_input(idEndDate));
    container.append(labelInput2);

    ele.append(container);
    return ele;
}

function create_ele_filter_option_date_input(id){
    let input_ele = document.createElement('input');
    input_ele.type = 'date';
    input_ele.id = id;
    return input_ele;
}


async function create_filter_option_select(FILTER_SETTINGS){
    const key_options_list = 'opt_list';

    let ele = create_ele_filter_option_base(FILTER_SETTINGS);

    let select_ele = document.createElement('select');
    select_ele.id = ID_PREFIX_FILTER_FIELDS + FILTER_SETTINGS.id;

    let default_option = document.createElement('option');
    default_option.selected = true;
    default_option.value = '0';
    default_option.innerHTML = '---------';
    select_ele.append(default_option);

    let response_data = await get_options_from_server(FILTER_SETTINGS.id);
    if(!status_is_good(response_data, 200)){
        var select_error_ele = create_generic_ele_dismissable_error(response_data, 'Error: failed to load dropdown.');
        ele.append(select_error_ele);
    }
    else{
        let list_of_options = response_data[key_options_list];
        for(let i = 0; i < list_of_options.length; i++){
            var new_option = document.createElement('option');
            new_option.value = list_of_options[i].id;
            new_option.innerHTML = list_of_options[i].display_str;
            select_ele.append(new_option);
        }
    
        ele.append(select_ele);
    }

    return ele;
}


async function get_options_from_server(field_id){
    let response = await fetch(`${URL_SELECT_OPTIONS}?type=select_options_list&name=${field_id}s`)
                    .catch(error => {
                        console.log('Error: ', error)
                    });

    return await get_json_with_status(response);
}


// || Submit Filter Options
function reload_page_with_filters(){
    let get_params = get_parameters_string_from_records_filter_inputs();
    window.location.href = `${URL_RECORDS}${get_params}`;
}

function get_parameters_string_from_records_filter_inputs(){
    let get_param_list = format_records_filter_options_as_list();

    if(get_param_list.length > 0){
        let get_param_str = `?${get_param_list[0]}`;
        for(let g = 1; g < get_param_list.length; g++){
            get_param_str += `&${get_param_list[g]}`;
        }
        return get_param_str;
    }

    return '';
}

function format_records_filter_options_as_list(){
    let get_param_list = [];

    for(let i = 0; i < RECORDS_FILTER_SETTINGS.length; i++){
        var get_param = '';
        var field_ele = document.getElementById(ID_PREFIX_FILTER_FIELDS + RECORDS_FILTER_SETTINGS[i].id);

        if(field_ele !== null){
            if(RECORDS_FILTER_SETTINGS[i].input_type === 'single-text'){
                get_param = get_param_from_input(RECORDS_FILTER_SETTINGS[i].id, field_ele.value);
            }
            else if(RECORDS_FILTER_SETTINGS[i].input_type === 'select'){
                get_param = get_param_from_select(RECORDS_FILTER_SETTINGS[i].id, field_ele.value);
            }
        }
        else if(RECORDS_FILTER_SETTINGS[i].input_type === 'range-date'){
            get_param = get_param_from_range(ID_PREFIX_FILTER_FIELDS, RECORDS_FILTER_SETTINGS[i].id);
        }

        if(get_param !== ''){
            get_param_list.push(get_param);
        }
    }

    console.log("get_param_list", get_param_list);

    return get_param_list;
}


function get_param_from_input(field_name, input_value){
    if(input_value !== ''){
        return create_string_get_param(field_name, input_value);
    } 
    return ''; 
}


function get_param_from_select(field_name, input_value){
    if(input_value !== '0'){
        return create_string_get_param(field_name, input_value);
    } 
    return '';
}

function get_param_from_range(id_prefix, field_name){
    let get_param = '';

    let input_ele = document.getElementById(id_prefix + RANGE_START + field_name);
    if(input_ele !== null){
        get_param += get_param_from_input(RANGE_START + field_name, input_ele.value);
    }

    input_ele = document.getElementById(id_prefix + RANGE_END + field_name);
    if(input_ele !== null){
        if(get_param !== ''){
            get_param += '&';
        }
        get_param += get_param_from_input(RANGE_END + field_name, input_ele.value);
    }

    return get_param;
}

function create_string_get_param(field_name, input_value){
    return `${field_name}=${input_value}`;
}

