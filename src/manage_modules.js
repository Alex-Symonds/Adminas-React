/*
    Module Management page functionality.
        > Click an empty slot to open a panel with options to assign an existing JobItem to the slot or create a new JobItem
            >> Adding a new JobItem opens a form inside the slot
        > Click the "+Slot" button to add more empty slots
        > Edit an existing slot, to change the quantity (limited) or remove it

    Contents:
        || Constants
        || DOMContentLoaded event listeners
        || General Support
        || Adding extra empty slots
        || Menu for filling a slot with products from existing JobItems, with a button to instead open a form for adding a new JobItem        
        || "Form" to create a new JobItem and fill the slot with its product
        || Assigning a product to a slot
        || Editor for slot fillers (quantity / delete)
        || Deleting an assignment
        || Slot Status Indicators
        || Error messages
*/

import {
    create_generic_ele_cancel_button,
    create_generic_ele_edit_button,
    create_generic_ele_jobitem_quantity_input,
    create_generic_ele_submit_button,
    CLASS_ERROR_MESSAGE,
    CSS_EDIT_ICON,
    CSS_GENERIC_FORM_LIKE,
    CSS_GENERIC_PANEL,
    CSS_GENERIC_PANEL_HEADING,
    CSS_HIDE,
    getRequestOptions,
    hide_all_by_class,
    QTY_RE,
    query_backend,
    status_is_good,
    unhide_all_by_class,
    update_backend,
} from './util.js';


// || Constants
const CLASS_ADD_SLOT_BUTTON = 'add-slot';
const CLASS_EDITOR_SLOT_FILLER_QUANTITY = 'editor-slot-filler-quantity';
const CLASS_EXCESS_MODULES = 'excess-modules';
const CLASS_INDICATOR_IS_FULL = 'filled';
const CLASS_OPTION_EXISTING_ITEM = 'bucket-item';
const CLASS_MODULE_SLOT_GENERAL = 'module-slot';
const CLASS_MODULE_SLOT_IN_EDIT_MODE = 'editing';
const CLASS_MODULE_SLOT_IS_EMPTY = 'empty';
const CLASS_MODULE_SLOT_FILLER_POPOUT_MENU = 'module-bucket-container';
const CLASS_NEW_ITEMS_CONTAINER = 'new-slot-filler-inputs';
const CLASS_PARENT_ITEM_CONTAINER = 'modular-item-container';
const CLASS_PRODUCT_DESC = 'product_desc';
const CLASS_SLOT_CONTAINER = 'modular-slot-container';
const ID_CREATE_JOBITEM_SUBMIT_BUTTON = 'id_submit_new';
const ID_EDIT_FORM_SUBMIT_BUTTON = 'id_submit_qty_edit';


// || DOMContentLoaded event listeners
document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.' + CLASS_MODULE_SLOT_GENERAL + '.' + CLASS_MODULE_SLOT_IS_EMPTY).forEach(div => {
        div.addEventListener('click', (e) =>{
            open_module_slot_filler_menu(e);
        })
    });

    document.querySelectorAll(`.${CLASS_ADD_SLOT_BUTTON}`).forEach(div =>{
        div.addEventListener('click', (e) =>{
            add_ele_module_slot_empty(e);
        })
    });

    document.querySelectorAll('.edit-slot-filler-btn').forEach(btn =>{
        btn.addEventListener('click', (e) => {
            open_editor_module_slot_filler(e);
        })
    });
});



// || General Support
function get_slot_and_parent_ids(slot_specific_ele){
    if(slot_specific_ele.classList.contains(CLASS_SLOT_CONTAINER)){
        var slot_container_ele = slot_specific_ele;
    }
    else{
        var slot_container_ele = slot_specific_ele.closest('.' + CLASS_SLOT_CONTAINER);
    }

    if(slot_container_ele === null){
        return null;
    }

    return {
        'slot': slot_container_ele.dataset.slot,
        'parent': slot_container_ele.dataset.parent
    }
}


function required_fields_are_present(data, required_fields_list){
    for(let idx = 0; idx < required_fields_list.length; idx++){
        var req_fld = required_fields_list[idx];
        if(typeof data[req_fld] === 'undefined'){
            return false;
        }
    }
    return true;
}



// || Adding extra empty slots
function add_ele_module_slot_empty(e){
    let slot_ele = e.target.closest('.' + CLASS_SLOT_CONTAINER);
    let contents_ele = slot_ele.querySelector('.contents');
    let new_slot = create_ele_module_slot_empty();

    contents_ele.append(new_slot);
}


function create_ele_module_slot_empty(){
    let div = document.createElement('div');
    div.classList.add(CLASS_MODULE_SLOT_GENERAL);
    div.classList.add(CLASS_MODULE_SLOT_IS_EMPTY);

    let it = document.createElement('i');
    it.innerHTML = 'Click to fill';
    div.append(it);

    div.addEventListener('click', (e) =>{
        open_module_slot_filler_menu(e);
    });
    return div;
}



// || Menu for filling a slot with products from existing JobItems, with a button to instead open a form for adding a new JobItem 
async function open_module_slot_filler_menu(e){
    let anchor_ele = find_anchor_ele_module_slot_filler_menu(e.target);

    let id_obj = get_slot_and_parent_ids(e.target);
    let menu_ele = await create_ele_module_slot_filler_menu(id_obj.slot, id_obj.parent);
    anchor_ele.after(menu_ele);

    remove_ele_all_errors();
}


function close_module_slot_filler_menu(){
    document.querySelector('.' + CLASS_MODULE_SLOT_FILLER_POPOUT_MENU).remove();
}


function find_anchor_ele_module_slot_filler_menu(target){
    if(target.classList.contains(CLASS_MODULE_SLOT_IS_EMPTY)){
        return target;
    } else {
        return target.closest('.' + CLASS_MODULE_SLOT_GENERAL + '.' + CLASS_MODULE_SLOT_IS_EMPTY);
    }
}


async function create_ele_module_slot_filler_menu(slot_id, parent_id){

    let div = create_ele_module_slot_filler_menu_base();
    div.append(create_ele_module_slot_filler_menu_cancel_btn());

    let json_response = await get_list_for_module_slot(slot_id, parent_id, 'jobitems');
    if(!status_is_good(json_response, 200)){
        div.append(create_ele_module_slot_error(json_response, 'Failed to load.'));
        return div;
    }

    const key_parent_quantity = 'parent_quantity';
    const key_options_list = 'opt_list';
    const required_fields = [key_parent_quantity, key_options_list];
    if(!required_fields_are_present(json_response, required_fields)){
        div.append(create_ele_module_slot_error('Failed to load.'));
        return div;
    }

    div.append(create_ele_module_slot_filler_menu_title(json_response[key_parent_quantity]));
    div.append(create_ele_module_slot_filler_menu_existing_items(json_response));
    div.append(create_ele_module_slot_filler_menu_new_jobitem_btn());
    return div;
}


function create_ele_module_slot_filler_menu_base(){
    let div = document.createElement('div');
    div.classList.add(CLASS_MODULE_SLOT_FILLER_POPOUT_MENU);
    div.classList.add(CSS_GENERIC_PANEL);
    div.classList.add(CSS_GENERIC_FORM_LIKE);
    div.classList.add('popout');
    return div;
}


function create_ele_module_slot_filler_menu_title(parent_quantity){
    let h = document.createElement('h4');
    h.classList.add(CSS_GENERIC_PANEL_HEADING);
    h.innerHTML = `Assign ${parent_quantity} x ...`;
    return h;
}


function create_ele_module_slot_filler_menu_cancel_btn(){
    let btn = create_generic_ele_cancel_button();

    btn.addEventListener('click', () => {
        close_module_slot_filler_menu();
    });

    return btn;
}


function create_ele_module_slot_filler_menu_existing_items(json_data){
    let existing_ji = json_data['opt_list'];

    if(existing_ji.length === 0){
        let p = document.createElement('p');
        p.innerHTML = 'There are no unassigned items on this job which are suitable for this slot.';
        return p;
    }

    let option_bucket = document.createElement('div');
    option_bucket.classList.add('bucket-options-container');
    for(var i=0; i < existing_ji.length; i++){
        var existing_options_ele = create_ele_module_slot_filler_menu_existing_option(existing_ji[i], parseInt(json_data['parent_quantity']));
        option_bucket.append(existing_options_ele);
    }
    return option_bucket;
}


async function get_list_for_module_slot(slot_id, parent_id, list_type){
    let url = `${URL_GENERAL_API}?type=select_options_list&name=slot_options_${list_type}&parent=${parent_id}&slot=${slot_id}`;
    return await query_backend(url);
}


function create_ele_module_slot_filler_menu_existing_option(data, qty){
    var existing_option_ele = document.createElement('div');
    existing_option_ele.classList.add(CLASS_OPTION_EXISTING_ITEM);

    const key_id = 'id';
    const key_name = 'name';
    const key_qty_available = 'quantity_available';
    const key_qty_total = 'quantity_total';
    const required_fields = [key_id, key_name, key_qty_available, key_qty_total];
    if(!required_fields_are_present(data, required_fields)){
        existing_option_ele.innerHTML = 'Error: failed to load';
        return existing_option_ele;
    }

    existing_option_ele.setAttribute('data-child', data[key_id]);
    if(qty > parseInt(data[key_qty_available])){
        existing_option_ele.classList.add('jobitem_usedup');

    } else {
        existing_option_ele.classList.add('jobitem');
        existing_option_ele.addEventListener('click', (e) =>{
            assign_existing_jobitem_product_to_slot(e);
        });
    }

    existing_option_ele.append(create_ele_module_slot_filler_menu_existing_option_jobitem_name(data[key_name]));
    existing_option_ele.append(create_ele_module_slot_filler_menu_existing_option_quantity_available(data[key_qty_available], data[key_qty_total]));
    return existing_option_ele;
}


function create_ele_module_slot_filler_menu_existing_option_jobitem_name(jobitem_name){
    let desc_span = document.createElement('span');
    desc_span.classList.add(CLASS_PRODUCT_DESC);
    desc_span.innerHTML = jobitem_name;
    return desc_span;
}


function create_ele_module_slot_filler_menu_existing_option_quantity_available(qty_available, qty_total){
    let availability = document.createElement('div');
    availability.classList.add('availability');
    availability.innerHTML = `${qty_available}/${qty_total} available`;
    return availability;
}


function create_ele_module_slot_filler_menu_new_jobitem_btn(){
    let btn = document.createElement('button');
    btn.innerHTML = 'new item to job';

    btn.classList.add('add-button');
    btn.classList.add('module');

    btn.addEventListener('click', (e) => {
        open_module_slot_new_jobitem_form(e);
    });

    return btn;
}



// || "Form" to create a new JobItem and fill the slot with its product
async function open_module_slot_new_jobitem_form(e){
    let menu_ele = e.target.closest('.' + CLASS_MODULE_SLOT_FILLER_POPOUT_MENU);
    let empty_slot = menu_ele.previousSibling;

    let id_obj = get_slot_and_parent_ids(e.target);
    let new_jobitem_form = await create_ele_module_slot_new_jobitem_form(id_obj.slot, id_obj.parent);

    empty_slot.after(new_jobitem_form);

    empty_slot.remove();
    menu_ele.remove();
}


function close_module_slot_new_jobitem_form(btn){
    let new_slot_div = btn.closest('.' + CLASS_MODULE_SLOT_GENERAL);
    let empty_slot = create_ele_module_slot_empty();

    new_slot_div.after(empty_slot);
    new_slot_div.remove();
    return;
}


async function create_ele_module_slot_new_jobitem_form(slot_id, parent_id){
    let div = create_ele_module_slot_new_jobitem_form_main();
    div.append(create_ele_module_slot_new_jobitem_form_heading());
    div.append(create_ele_module_slot_new_jobitem_form_cancel_btn());

    let json_response = await get_list_for_module_slot(slot_id, parent_id, 'products');
    if(!status_is_good(json_response, 200) || typeof json_response['opt_list'] === 'undefined'){
        div.append(create_ele_module_slot_error(json_response, 'Failed to load dropdown.'));
        return;
    }

    div.append(create_ele_module_slot_product_options_dropdown(json_response['opt_list']));
    div.append(create_ele_module_slot_new_jobitem_form_quantity_and_submit());
    return div;
}


function create_ele_module_slot_new_jobitem_form_main(){
    let div = document.createElement('div');
    div.classList.add(CLASS_MODULE_SLOT_GENERAL);
    div.classList.add(CLASS_NEW_ITEMS_CONTAINER);
    return div;
}


function create_ele_module_slot_new_jobitem_form_heading(){
    let heading = document.createElement('H5');
    heading.innerHTML = 'Fill slot with new item';
    return heading;
}


function create_ele_module_slot_product_options_dropdown(list_of_valid_options){
    let sel = document.createElement('select');
    sel.name = 'product';

    for(let i=0; i < list_of_valid_options.length; i++){
        var opt_data = list_of_valid_options[i];
        var opt = document.createElement('option');
        opt.value = opt_data['id'];
        opt.innerHTML = `${opt_data['name']} @ ${opt_data['price_f']}`;
        sel.append(opt);
    }

    return sel;
}


function create_ele_module_slot_new_jobitem_form_quantity_and_submit(){
    let result = document.createElement('div');
    result.classList.add('combo-input-and-button');

    let qty_fld = create_generic_ele_jobitem_quantity_input();
    qty_fld.value = 1;
    result.append(qty_fld);

    result.append(create_ele_module_slot_new_jobitem_form_submit_btn()); 
    return result;
}


function create_ele_module_slot_new_jobitem_form_submit_btn(){
    let btn = create_generic_ele_submit_button();
    btn.id = ID_CREATE_JOBITEM_SUBMIT_BUTTON;

    btn.addEventListener('click', (e) => {
        assign_new_jobitem_product_to_slot(e);
    });

    return btn;
}


function create_ele_module_slot_new_jobitem_form_cancel_btn(){
    let btn = create_generic_ele_cancel_button();

    btn.addEventListener('click', (e) => {
        close_module_slot_new_jobitem_form(e.target);
    });

    return btn; 
}



// || Assigning a product to a slot
async function assign_new_jobitem_product_to_slot(e){
    let id_obj = get_slot_and_parent_ids(e.target);
    let new_jobitem_form = e.target.closest(`.${CLASS_NEW_ITEMS_CONTAINER}`);
    let assignment_qty = new_jobitem_form.querySelector('input[name="qty"]').value;
    let error_anchor = new_jobitem_form.lastChild;
    let failed_task_string = 'Failed to fill slot. Try refreshing the page.';
    
    let ji_id = await update_server_create_jobitem(e, new_jobitem_form, id_obj, assignment_qty, error_anchor);
    if(ji_id === null) return;

    let jobitem_data = await get_jobitem_data(ji_id, error_anchor, failed_task_string);
    if(jobitem_data === null) return;
 
    const key_product_id = 'product_id';
    if(jobitem_data[key_product_id] === 'undefined'){
        add_ele_module_slot_error(error_anchor, failed_task_text);
        return;
    }

    let jobmod_id = await update_server_create_jobmodule(jobitem_data[key_product_id], id_obj, assignment_qty, error_anchor);
    if(jobmod_id === null) return;

    let product_text = get_product_desc_from_select_desc(new_jobitem_form.querySelector('select'));
    let description = `${assignment_qty} x ${product_text}`;
    add_ele_filled_module_slot(jobmod_id, assignment_qty, description, new_jobitem_form);

    new_jobitem_form.remove();
}


async function get_jobitem_data(ji_id, error_anchor_ele, failed_task_text){
    let url = `${URL_ITEMS}?ji_id=${ji_id}`;
    let jobitem_data = await query_backend(url);
    if(!status_is_good(jobitem_data, 200)){
        add_ele_module_slot_error(error_anchor_ele, jobitem_data, failed_task_text);
        return null;
    }
    
    return jobitem_data;
}


async function assign_existing_jobitem_product_to_slot(e){
    let id_obj = get_slot_and_parent_ids(e.target);
    let ji_ele = find_existing_jobitem_ele(e.target);
    let assignment_qty = 1;
    let menu_ele = e.target.closest('.' + CLASS_MODULE_SLOT_FILLER_POPOUT_MENU);
    let empty_slot = menu_ele.previousSibling;
    
    let jobmod_id = await update_server_create_jobmodule(ji_ele.dataset.child, id_obj, assignment_qty, empty_slot);
    if(jobmod_id !== null){
        let parent_ele = e.target.closest(`.${CLASS_PARENT_ITEM_CONTAINER}`);
        let description = `${parent_ele.dataset.quantity} x ${ji_ele.querySelector(`.${CLASS_PRODUCT_DESC}`).innerHTML}`;
        add_ele_filled_module_slot(jobmod_id, assignment_qty, description, empty_slot);
        empty_slot.remove();
    }

    menu_ele.remove();
}


function find_existing_jobitem_ele(ele){
    if(ele.classList.contains(CLASS_OPTION_EXISTING_ITEM)){
        return ele;
    }
    else{
        return ele.closest(`.${CLASS_OPTION_EXISTING_ITEM}`);
    }
}


function add_ele_filled_module_slot(jobmod_id, quantity, description, anchor_ele){
    if(typeof jobmod_id === 'undefined'){
        add_ele_module_slot_error(anchor_ele, "Display error: try refreshing the page.");
        return;
    }

    let filled_slot = create_ele_module_slot_filled(description, quantity, jobmod_id);
    anchor_ele.after(filled_slot);
    update_module_slot_status(filled_slot);
}


async function update_server_create_jobitem(e, form_div, id_obj, assignment_qty, error_anchor_ele){
    let parent_ele = e.target.closest(`.${CLASS_PARENT_ITEM_CONTAINER}`);
    let total_qty =  assignment_qty * parent_ele.dataset.quantity;
    let product_id = form_div.querySelector('select').value;

    let jobitem_resp = await update_server_post_jobitem(id_obj.parent, total_qty, product_id);
    if(!status_is_good(jobitem_resp, 201)){
        add_ele_module_slot_error(error_anchor_ele, jobitem_resp, 'Failed to add new item to job.');
        return null;
    }

    let child_id = jobitem_resp['id'];
    if(typeof child_id === 'undefined'){
        add_ele_module_slot_error(error_anchor_ele, "Error: item not assigned to slot.");
        return null;
    }

    return child_id;
}


async function update_server_create_jobmodule(child_id, id_obj, assignment_qty, error_anchor_ele){
    let json_resp = await update_server_post_jobmodule(child_id, id_obj.parent, id_obj.slot, assignment_qty);
    if(!status_is_good(json_resp)){
        add_ele_module_slot_error(error_anchor_ele, json_resp, 'Failed to assign item to slot.');
        return null;
    }

    let jobmod_id = json_resp['id'];
    if(typeof jobmod_id === 'undefined'){
        add_ele_module_slot_error(error_anchor_ele, "Display error: try refreshing the page.");
        return null;
    }

    return jobmod_id;
}


async function update_server_post_jobitem(parent_id, qty, product){
    let request_options = getRequestOptions('POST', {
        'quantity': qty,
        'product': product,
        'parent': parent_id
    });

    // TODO: switch this to fetchAndJSON after adding something to catch errors
    return await update_backend(URL_ITEMS, request_options);
}


async function update_server_post_jobmodule(child_id, parent_id, slot_id, quantity = 1){ 
    let request_options = getRequestOptions('POST', {
        'parent': parent_id,
        'child': child_id,
        'slot': slot_id,
        'quantity': quantity
    });
    
    // TODO: switch this to fetchAndJSON after adding something to catch errors
    return await update_backend(URL_ASSIGNMENTS, request_options);
}


function get_product_desc_from_select_desc(select_ele){
    // Expected input format =      12345: Blah blah blah @ GBP 1,000.00
    // Expected output format =     12345: Blah blah blah
    let desc_with_price = select_ele.options[select_ele.selectedIndex].text;
    let re = /^.+(?=( @ ))/;
    return desc_with_price.match(re)[0];
}


function create_ele_module_slot_filled(description, quantity, jobmod_id){
    let div = document.createElement('div');
    div.classList.add(CLASS_MODULE_SLOT_GENERAL);
    div.classList.add('jobitem');

    div.append(create_ele_slot_filler_edit_btn(jobmod_id));
    div.append(create_ele_slot_filler_desc_span(description, quantity));
    
    return div;
}


function create_ele_slot_filler_edit_btn(jobmod_id){
    let btn = create_generic_ele_edit_button();

    btn.setAttribute('data-jobmod', jobmod_id);
    btn.addEventListener('click', (e) => {
        open_editor_module_slot_filler(e);
    })
    return btn;
}


function create_ele_slot_filler_desc_span(description, quantity){
    let re = QTY_RE;
    let span = document.createElement('span');
    span.classList.add('child-desc');
    span.innerHTML = description.replace(re, quantity); 
    return span;
}



// || Editor for slot fillers (quantity / delete)
function open_editor_module_slot_filler(e){
    let filler_div = e.target.closest(`.${CLASS_MODULE_SLOT_GENERAL}`);
    let desc_span = filler_div.querySelector('.child-desc');

    let jobmod_id = e.target.dataset.jobmod;
    let qty_and_desc = desc_span.innerHTML;
    filler_div.prepend(create_ele_editor_module_slot_filler(jobmod_id, qty_and_desc));

    // Hide all the edit and remove buttons in an attempt to discourage users from trying to do two things at once
    desc_span.innerHTML = qty_and_desc.replace(QTY_RE, '');
    filler_div.classList.add(CLASS_MODULE_SLOT_IN_EDIT_MODE);
    desc_span.classList.add(CSS_HIDE);
    hide_all_by_class(CSS_EDIT_ICON);
    hide_all_by_class('remove-from-slot-btn');
}


function close_editor_module_slot_filler(ele, new_qty){
    let filler_div = ele.closest(`.${CLASS_MODULE_SLOT_GENERAL}`);

    let edit_form = filler_div.querySelector('input');
    let qty_txt = edit_form.dataset.prev_qty;
    if (typeof new_qty != 'undefined'){
        qty_txt = new_qty;
    }

    let editor_formlike = filler_div.querySelector(`.${CLASS_EDITOR_SLOT_FILLER_QUANTITY}`);
    if(editor_formlike){
        editor_formlike.remove();
    }

    let desc_span = filler_div.querySelector('.child-desc');
    desc_span.innerHTML = qty_txt + desc_span.innerHTML;
    if(desc_span.classList.contains(CSS_HIDE)){
        desc_span.classList.remove(CSS_HIDE);
    }

    if(filler_div.classList.contains(CLASS_MODULE_SLOT_IN_EDIT_MODE)){
        filler_div.classList.remove(CLASS_MODULE_SLOT_IN_EDIT_MODE);
    }

    unhide_all_by_class(CSS_EDIT_ICON);
    remove_ele_all_errors();
}


function create_ele_editor_module_slot_filler(jobmod_id, filler_text){
    let result = document.createElement('div');
    result.classList.add(CLASS_EDITOR_SLOT_FILLER_QUANTITY);

    result.append(create_ele_module_slot_filler_editor_cancel_btn());
    result.append(create_ele_module_slot_filler_editor_description(filler_text));
    result.append(create_ele_module_slot_filler_editor_delete_btn(jobmod_id));
    result.append(create_ele_module_slot_filler_editor_quantity_and_submit(jobmod_id, filler_text));

    return result;
}


function create_ele_module_slot_filler_editor_description(description){
    let result = document.createElement('span');
    result.classList.add('desc');
    result.innerHTML = get_description_without_quantity_x(description);
    return result;
}


function get_description_without_quantity_x(description){
    // Expected input = "### x String-to-keep"
    // Expected output = "String-to-keep"
    let re_qty_x = /^.+( x )/;
    return description.trim().replace(re_qty_x, '');
}


function create_ele_module_slot_filler_editor_quantity_and_submit(jobmod_id, filler_text){
    let result = document.createElement('span');
    result.classList.add('combo-input-and-button');

    result.append(create_ele_module_slot_filler_editor_quantity_field(jobmod_id, filler_text));
    result.append(create_ele_module_slot_filler_editor_submit_btn());

    return result;
}


function create_ele_module_slot_filler_editor_quantity_field(jobmod_id, filler_text){
    let result = create_generic_ele_jobitem_quantity_input();

    result.value = filler_text.match(QTY_RE);
    result.setAttribute('data-id', jobmod_id);
    result.setAttribute('data-prev_qty', filler_text.match(QTY_RE));

    result.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            update_module_slot_quantity(e.target);
        }
    });

    return result;
}


function create_ele_module_slot_filler_editor_submit_btn(){
    let btn = create_generic_ele_submit_button();
    btn.id = ID_EDIT_FORM_SUBMIT_BUTTON;
    btn.addEventListener('click', (e) => {
        update_module_slot_quantity(e.target.previousSibling);
    });

    return btn;
}


function create_ele_module_slot_filler_editor_delete_btn(jobmod_id){
    let btn = document.createElement('button');
    btn.classList.add('delete-panel');

    let span = document.createElement('span');
    span.innerHTML = 'unassign';
    btn.append(span);

    btn.setAttribute('data-jobmod', jobmod_id);
    btn.addEventListener('click', (e) => {
        remove_jobitem_from_slot(e);
    });
    return btn;
}


function create_ele_module_slot_filler_editor_cancel_btn(){
    let btn = create_generic_ele_cancel_button();

    btn.classList.add('close-edit-mode');
    btn.addEventListener('click', (e) => {
        close_editor_module_slot_filler(e.target);
    });

    return btn;
}


async function update_module_slot_quantity(qty_field){
    let response_data = await update_server_put_module_slot_quantity(qty_field);
    if(!status_is_good(response_data, 204)){
        add_ele_module_slot_error(qty_field.parentElement, data);
    }
    else {
        update_page_module_slot_quantity(qty_field, qty_field.dataset.id);
    }
}


async function update_server_put_module_slot_quantity(qty_field){
    let request_options = getRequestOptions('PUT', {
        'qty': qty_field.value,
        'prev_qty': qty_field.dataset.prev_qty,
        'id': qty_field.dataset.id
    });

    return await update_backend(URL_ASSIGNMENTS, request_options);
}


function update_page_module_slot_quantity(qty_field, jobmod_id){
    // input=number allows some inputs that can be valid as part of a number, but aren't numbers on their own (e.g. 'e', '-')
    // If the user enters something like that, the server will ignore it, so ignore it on the page too.
    if(qty_field.value === '' || parseFloat(qty_field.value) <= 0){
        close_editor_module_slot_filler(qty_field);
        return;
    }

    update_module_slot_status(qty_field, jobmod_id);
    close_editor_module_slot_filler(qty_field, qty_field.value);   
}



// || Deleting an assignment
async function remove_jobitem_from_slot(e){

    let resp = await update_server_delete_jobmodule(e);
    if(!status_is_good(resp)){
        let submit_btn = document.getElementById(ID_EDIT_FORM_SUBMIT_BUTTON);
        add_ele_module_slot_error(submit_btn, resp, 'Failed to empty slot.');
        return;
    }

    update_page_remove_jobitem_from_slot(e);
}


async function update_server_delete_jobmodule(e){
    let request_options = getRequestOptions('DELETE');
    return await update_backend(`${URL_ASSIGNMENTS}?id=${e.target.dataset.jobmod}`, request_options);
}


function update_page_remove_jobitem_from_slot(e){
    let empty_slot = create_ele_module_slot_empty();
    
    let slot_filler = e.target.closest(`.${CLASS_MODULE_SLOT_GENERAL}`);
    slot_filler.after(empty_slot);
    slot_filler.remove();

    update_module_slot_status(empty_slot);
    close_editor_module_slot_filler(e.target);
}



// || Slot Status Indicators
async function update_module_slot_status(ele){

    let error_anchor_ele = ele.closest(`.${CLASS_SLOT_CONTAINER}`).querySelector(`.${CLASS_ADD_SLOT_BUTTON}`);
    let failed_task_text = 'Refresh page to update slot status.';

    let data = await get_module_slot_status(ele, error_anchor_ele, failed_task_text);
    if(data === null){
        return;
    }

    const key_required_str = 'required_str';
    const key_optional_str = 'optional_str';
    const key_num_excess = 'slot_num_excess';
    const key_has_excess = 'jobitem_has_excess';
    const required_fields_list = [key_required_str, key_optional_str, key_num_excess, key_has_excess];
    if(!required_fields_are_present(data, required_fields_list)){
        add_ele_module_slot_error(error_anchor_ele, failed_task_text);
        return;
    }

    update_page_module_slot_status(ele, data[key_required_str], data[key_optional_str], data[key_num_excess], data[key_has_excess]);
}


async function get_module_slot_status(ele, error_anchor_ele, failed_task_text){
    let id_obj = get_slot_and_parent_ids(ele);
    let url = `${URL_ASSIGNMENTS}?parent_id=${id_obj.parent}&slot_id=${id_obj.slot}`;

    let slot_data = await query_backend(url);
    if(!status_is_good(slot_data, 200)){
        add_ele_module_slot_error(error_anchor_ele, slot_data, failed_task_text);
        return null;
    }
    
    return slot_data;
}


function update_page_module_slot_status(ele, required_str, optional_str, num_excess, has_excess){
    let slot_ele = ele.closest(`.${CLASS_SLOT_CONTAINER}`);
    update_ele_slot_status_indicator(slot_ele, 'required', required_str);
    update_ele_slot_status_indicator(slot_ele, 'optional', optional_str);
    update_ele_slot_status_indicator_excess(slot_ele, 'excess', num_excess);

    let subsection = ele.closest('.subsection');
    update_conditional_css_class(subsection, CLASS_EXCESS_MODULES, parseInt(num_excess) > 0);

    let jobitem_ele = ele.closest(`.${CLASS_PARENT_ITEM_CONTAINER}`);
    update_conditional_css_class(jobitem_ele, CLASS_EXCESS_MODULES, has_excess);
}


function update_conditional_css_class(element, css_class, want_css_class){
    let has_css_class = element.classList.contains(css_class);
    if(want_css_class && !has_css_class){
        element.classList.add(css_class);
    }
    else if(!want_css_class && has_css_class){
        element.classList.remove(css_class);
    }
}


function update_ele_slot_status_indicator(slot_ele, class_indicator, display_text){
    let indicator_ele = slot_ele.querySelector('.' + class_indicator)
    let text_ele = indicator_ele.querySelector('.body');

    text_ele.innerHTML = display_text;
    const text_is_full = slot_status_display_text_shows_full_slot(display_text);
    update_conditional_css_class(indicator_ele, CLASS_INDICATOR_IS_FULL, text_is_full);
}


function slot_status_display_text_shows_full_slot(text){
    let str_arr = text.split('/');
    return str_arr[0] === str_arr[1];
}


function update_ele_slot_status_indicator_excess(slot_ele, class_indicator, display_text){
    // Excess indicator has conditional existence, rather than conditional CSS class
    let excess_indicator = slot_ele.querySelector('.' + class_indicator);
    let does_exist = excess_indicator !== null;
    let should_exist = parseInt(display_text) > 0;

    if (!should_exist && does_exist){
        slot_ele.querySelector('.' + class_indicator).remove();
        return;

    } else if(should_exist && !does_exist){
        let div = create_ele_excess_slot_status_indicator(display_text);
        let target = slot_ele.querySelector('.slot-info');
        target.append(div);
        return;

    } else if(should_exist && does_exist){
        let result_ele = slot_ele.querySelector('.' + class_indicator).querySelector('.body');
        result_ele.innerHTML = display_text;
    }
} 


function create_ele_excess_slot_status_indicator(num_excess){
    let div = document.createElement('div');
    div.classList.add('excess');  

    let head_span = document.createElement('span');
    head_span.classList.add('head');
    head_span.innerHTML = 'excess';
    div.append(head_span);

    let body_span = document.createElement('span');
    body_span.classList.add('body');
    body_span.innerHTML = num_excess;
    div.append(body_span);

    return div;
}



// || Error messages
function add_ele_module_slot_error(preceding_ele, error_info, task_failed_string = null){
    let error_msg = create_ele_module_slot_error(error_info, task_failed_string);
    preceding_ele.after(error_msg);
}


function create_ele_module_slot_error(error_info, task_failed_string = null){
    let ele = document.createElement('div');
    ele.classList.add(CLASS_ERROR_MESSAGE);
    ele.innerHTML = get_error_message(error_info, task_failed_string);
    return ele;
}


function is_error_ele(ele){
    return CLASS_ERROR_MESSAGE in ele.classList;
}


function remove_ele_all_errors(){
    document.querySelectorAll('.' + CLASS_ERROR_MESSAGE).forEach(div => {
        div.remove();
    });
}