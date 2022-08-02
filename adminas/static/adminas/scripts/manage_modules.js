/*
    Module Management page functionality.
        > Click an empty slot to open a panel with options to assign an existing JobItem to the slot or create a new JobItem
            >> Adding a new JobItem opens a form inside the slot
        > Click the "+Slot" button to add more slots of a particular type.
        > Edit an existing slot
*/

// Used for both creating and locating elements
const CLASS_EDITOR_SLOT_FILLER_QUANTITY = 'editor-slot-filler-quantity';
const CLASS_OPTION_EXISTING_ITEM = 'bucket-item';
const CLASS_MODULE_SLOT_GENERAL = 'module-slot';
const CLASS_MODULE_SLOT_IS_EMPTY = 'empty';
const CLASS_MODULE_SLOT_FILLER_POPOUT_MENU = 'module-bucket-container';
const CLASS_NEW_ITEMS_CONTAINER = 'new-slot-filler-inputs';
const CLASS_PRODUCT_DESC = 'product_desc';
const ID_CREATE_JOBITEM_SUBMIT_BUTTON = 'id_submit_new';
const ID_EDIT_FORM_SUBMIT_BUTTON = 'id_submit_qty_edit';

// Used for finding/identifying elements, but not for creation
const CLASS_PARENT_ITEM_CONTAINER = 'modular-item-container';
const CLASS_SLOT_CONTAINER = 'modular-slot-container';

// Used for creating/modifying elements, but not for location
const CLASS_MODULE_SLOT_IN_EDIT_MODE = 'editing';
const CLASS_EXCESS_MODULES = 'excess-modules';
const CLASS_INDICATOR_IS_FULL = 'filled';


// Add event handlers to elements created by Django
document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.' + CLASS_MODULE_SLOT_GENERAL + '.' + CLASS_MODULE_SLOT_IS_EMPTY).forEach(div => {
        div.addEventListener('click', (e) =>{
            open_module_slot_filler_menu(e);
        })
    });

    document.querySelectorAll('.add-slot').forEach(div =>{
        div.addEventListener('click', (e) =>{
            add_empty_module_slot_ele(e);
        })
    });

    document.querySelectorAll('.edit-slot-filler-btn').forEach(btn =>{
        btn.addEventListener('click', (e) => {
            open_editor_module_slot_filler(e);
        })
    });
});



// General Support: get slot and parent IDs from the single point of authority
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




// -------------------------------------------------------------------
// Adding extra "slots" to the page
// -------------------------------------------------------------------
// Add New Slot: called onclick of a + Slot button
function add_empty_module_slot_ele(e){
    let slot_ele = e.target.closest('.' + CLASS_SLOT_CONTAINER);
    let contents_ele = slot_ele.querySelector('.contents');
    let new_slot = create_ele_module_slot_empty();

    contents_ele.append(new_slot);
}



// -------------------------------------------------------------------------------
// Opening the bucket of options
// -------------------------------------------------------------------------------
// Module Slot Filler: called onClick of an empty slot, opens a "bucket menu" of eligible JobItems and an "add new item" button
async function open_module_slot_filler_menu(e){
    let anchor_ele = find_anchor_ele_module_slot_filler_menu(e.target);

    let id_obj = get_slot_and_parent_ids(e.target);
    let bucket_div = await create_ele_module_slot_filler_menu(id_obj.slot, id_obj.parent);
    anchor_ele.after(bucket_div);

    remove_all_error_eles();
}

// Module Slot Filler: close the bucket window
function close_module_slot_filler_menu(){
    document.querySelector('.' + CLASS_MODULE_SLOT_FILLER_POPOUT_MENU).remove();
}

// Module Slot Filler: find the div for the "empty slot", regardless of whether the clicked element counts as that div or a child of the div
function find_anchor_ele_module_slot_filler_menu(target){
    if(target.classList.contains(CLASS_MODULE_SLOT_IS_EMPTY)){
        return target;
    } else {
        return target.closest('.' + CLASS_MODULE_SLOT_GENERAL + '.' + CLASS_MODULE_SLOT_IS_EMPTY);
    }
}

// Module Slot Filler: create a div element for the bucket menu and fill it with stuff created by other functions
async function create_ele_module_slot_filler_menu(slot_id, parent_id){

    let div = document.createElement('div');
    div.classList.add(CLASS_MODULE_SLOT_FILLER_POPOUT_MENU);
    div.classList.add(CSS_GENERIC_PANEL);
    div.classList.add(CSS_GENERIC_FORM_LIKE);
    div.classList.add('popout');

    div.append(create_ele_module_slot_filler_menu_cancel_btn());

    let json_response = await get_list_for_module_slot(slot_id, parent_id, 'jobitems');
    if(!status_is_good(json_response, 200)){
        div.append(create_ele_module_slot_error(json_response, 'Failed to load.'));
        return div;
    }
    
    div.append(create_ele_module_slot_filler_menu_title(json_response['parent_quantity']));
    div.append(create_ele_module_slot_filler_menu_existing_items(json_response));
    div.append(create_ele_module_slot_filler_menu_new_jobitem_btn());
    return div;
}

// Module Slot Filler: Get a h# element for the bucket
function create_ele_module_slot_filler_menu_title(parent_quantity){
    let h = document.createElement('h4');
    h.classList.add(CSS_GENERIC_PANEL_HEADING);

    if(typeof parent_quantity === 'undefined'){
        h.innerHTML = `Assign item`;
    }
    else{
        h.innerHTML = `Assign ${parent_quantity} x ...`;
    }
    return h;
}

// Module Slot Filler: Close the bucket menu without doing anything else
function create_ele_module_slot_filler_menu_cancel_btn(){
    let btn = create_generic_ele_cancel_button();

    btn.addEventListener('click', () => {
        close_module_slot_filler_menu();
    });

    return btn;
}

// Module Slot Filler: Request a list of elligible existing JobItems, then add appropriate elements to the bucket div 
function create_ele_module_slot_filler_menu_existing_items(json_data){
    let existing_ji = json_data['opt_list'];

    if(typeof existing_ji === 'undefined' || existing_ji.length === 0){
        let p = document.createElement('p');
        p.innerHTML = 'There are no unassigned items on this job which are suitable for this slot.';
        return p;
    }

    let option_bucket = document.createElement('div');
    option_bucket.classList.add('bucket-options-container');
    for(var i=0; i < existing_ji.length; i++){
        var ji_option_div = create_ele_module_slot_filler_menu_existing_option(existing_ji[i], parseInt(json_data['parent_quantity']));
        option_bucket.append(ji_option_div);
    }
    return option_bucket;
}

// Module Slot Filler: Contact the server to get a list of something relating to module assignments (something can be: JobItems, products or max_quantity)
async function get_list_for_module_slot(slot_id, parent_id, list_type){
    let url = `${URL_GENERAL_API}?type=select_options_list&name=slot_options_${list_type}&parent=${parent_id}&slot=${slot_id}`;
    return await query_backend(url);
}


// Module Slot Filler: Create a div for one JobItem in the bucket
function create_ele_module_slot_filler_menu_existing_option(data, qty){
    var ji_option_div = document.createElement('div');
    ji_option_div.classList.add(CLASS_OPTION_EXISTING_ITEM);

    const required_fields = ['id', 'name', 'quantity_available', 'quantity_total'];
    if(!required_fields_are_present(data, required_fields)){
        ji_option_div.innerHTML = 'Error: option failed to load';
        return;
    }

    ji_option_div.setAttribute('data-child', data['id']);
    if(qty > parseInt(data['quantity_available'])){
        ji_option_div.classList.add('jobitem_usedup');

    } else {
        ji_option_div.classList.add('jobitem');
        ji_option_div.addEventListener('click', (e) =>{
            assign_jobitem_to_slot(e);
        });
    }

    desc_span = document.createElement('span');
    desc_span.classList.add(CLASS_PRODUCT_DESC);
    desc_span.innerHTML = data['name'];
    ji_option_div.append(desc_span);

    let availability = document.createElement('div');
    availability.classList.add('availability');
    availability.innerHTML = `${data['quantity_available']}/${data['quantity_total']} available`;
    ji_option_div.append(availability);

    return ji_option_div;
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


// Module Slot Filler: Add the button to summon a form for entering a new JobItem to the order
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




















// --------------------------------------------------------------
// Fill slot with a new JobItem
// -------------------------------------------------------------
// New JI Form: onclick, replaces an empty slot with a form for adding a new item to fill the module
async function open_module_slot_new_jobitem_form(e){
    let bucket_div = e.target.closest('.' + CLASS_MODULE_SLOT_FILLER_POPOUT_MENU);
    let empty_slot = bucket_div.previousSibling;

    let id_obj = get_slot_and_parent_ids(e.target);
    let new_div = await create_ele_module_slot_new_jobitem_form(id_obj.slot, id_obj.parent);

    empty_slot.after(new_div);

    empty_slot.remove();
    bucket_div.remove();
}

// Cancel New JI Form: onclick, replaces the form with an empty slot
function close_module_slot_new_jobitem_form(btn){
    let new_slot_div = btn.closest('.' + CLASS_MODULE_SLOT_GENERAL);
    let empty_slot = create_ele_module_slot_empty();

    new_slot_div.after(empty_slot);
    new_slot_div.remove();
    return;
}

// New JI Form: create an element with a new item form inside
async function create_ele_module_slot_new_jobitem_form(slot_id, parent_id){
    let div = document.createElement('div');
    div.classList.add(CLASS_MODULE_SLOT_GENERAL);
    div.classList.add(CLASS_NEW_ITEMS_CONTAINER);

    let heading = document.createElement('H5');
    heading.innerHTML = 'Fill slot with new item';
    div.append(heading);

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


// New JI Form: get a select element with options from the server (list of products suitable for this slot, in asc price order)
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

    let qty_fld = get_jobitem_qty_field();
    qty_fld.value = 1;
    result.append(qty_fld);

    result.append(create_ele_module_slot_new_jobitem_form_submit_btn()); 
    return result;
}


// New JI Form: get a submit button for the form
function create_ele_module_slot_new_jobitem_form_submit_btn(){
    let btn = create_generic_ele_submit_button();
    btn.id = ID_CREATE_JOBITEM_SUBMIT_BUTTON;

    btn.addEventListener('click', (e) => {
        add_new_jobitem_and_jobmodule(e);
    });

    return btn;
}


// New JI Form: get a cancel button
function create_ele_module_slot_new_jobitem_form_cancel_btn(){
    let btn = create_generic_ele_cancel_button();

    btn.addEventListener('click', (e) => {
        close_module_slot_new_jobitem_form(e.target);
    });

    return btn; 
}




// New JI Form Action: onclick of new item submit btn
async function add_new_jobitem_and_jobmodule(e){
    let id_obj = get_slot_and_parent_ids(e.target);
    let form_div = e.target.closest(`.${CLASS_NEW_ITEMS_CONTAINER}`);
    let error_anchor = form_div.lastChild;
    let assignment_qty = form_div.querySelector('input[name="qty"]').value;
    
    let child_id = await add_new_jobitem_for_jobmodule(e, form_div, id_obj, assignment_qty, error_anchor);
    if(child_id === null) return;
 
    let jobmod_id = await add_new_jobmodule(child_id, id_obj, assignment_qty, error_anchor);
    if(jobmod_id === null) return;

    let product_text = get_product_desc_from_select_desc(form_div.querySelector('select'));
    let description = `${assignment_qty} x ${product_text}`;
    add_filled_module_slot(jobmod_id, assignment_qty, description, form_div);

    form_div.remove();
}

async function add_new_jobitem_for_jobmodule(e, form_div, id_obj, assignment_qty, error_anchor_ele){

    let parent_ele = e.target.closest(`.${CLASS_PARENT_ITEM_CONTAINER}`);
    let total_qty =  assignment_qty * parent_ele.dataset.quantity;
    let product_id = form_div.querySelector('select').value;

    let jobitem_resp = await update_server_create_jobitem(id_obj.parent, total_qty, product_id);
    if(!status_is_good(jobitem_resp, 201)){
        display_module_error(error_anchor_ele, jobitem_resp, 'Failed to add new item to job.');
        return null;
    }

    let child_id = jobitem_resp['id'];
    if(typeof child_id === 'undefined'){
        display_module_error(error_anchor_ele, "Error: item not assigned to slot.");
        return null;
    }

    return child_id;
}

async function add_new_jobmodule(child_id, id_obj, assignment_qty, error_anchor_ele){
    let json_resp = await update_server_create_jobmodule(child_id, id_obj.parent, id_obj.slot, assignment_qty);
    if(!status_is_good(json_resp)){
        display_module_error(error_anchor_ele, json_resp, 'Failed to assign item to slot.');
        return null;
    }

    let jobmod_id = json_resp['id'];
    if(typeof jobmod_id === 'undefined'){
        display_module_error(error_anchor_ele, "Display error: try refreshing the page.");
        return null;
    }

    return jobmod_id;
}


function add_filled_module_slot(jobmod_id, quantity, description, anchor_ele){
    if(typeof jobmod_id === 'undefined'){
        display_module_error(anchor_ele, "Display error: try refreshing the page.");
        return;
    }

    let filled_slot = create_ele_module_slot_filled(description, quantity, jobmod_id);
    anchor_ele.after(filled_slot);
    update_module_slot_status(filled_slot);
}






// New JI Form Action: takes "ABC123456: Thingummyjigger @ GBP 12,3456.00" and extracts the first bit with the part num and desc
function get_product_desc_from_select_desc(select_ele){
    let desc_with_price = select_ele.options[select_ele.selectedIndex].text;
    let re = /^.+(?=( @ ))/;
    return desc_with_price.match(re)[0];
}

// New JI Form Action: POST new JI info to the server
async function update_server_create_jobitem(parent_id, qty, product){
    let request_options = get_request_options('POST', {
        'quantity': qty,
        'product': product,
        'parent': parent_id
    });

    return await update_backend(URL_ITEMS, request_options);
}




// ------------------------------------------------------------------------
// Assigning a JobItem to a module
// ------------------------------------------------------------------------
// Assignment (existing JI only): called onClick of one of the existing JobItems in the bucket menu
async function assign_jobitem_to_slot(e){
    if(e.target.classList.contains(CLASS_OPTION_EXISTING_ITEM)){
        var ji_ele = e.target;
    }
    else{
        var ji_ele = e.target.closest(`.${CLASS_OPTION_EXISTING_ITEM}`);
    }

    let bucket_div = e.target.closest('.' + CLASS_MODULE_SLOT_FILLER_POPOUT_MENU);
    let empty_slot = bucket_div.previousSibling;
    let id_obj = get_slot_and_parent_ids(e.target);
    let assignment_qty = 1;

    let jobmod_id = await add_new_jobmodule(ji_ele.dataset.child, id_obj, assignment_qty, empty_slot);
    if(jobmod_id !== null){
        let parent_ele = e.target.closest(`.${CLASS_PARENT_ITEM_CONTAINER}`);
        let description = `${parent_ele.dataset.quantity} x ${ji_ele.querySelector(`.${CLASS_PRODUCT_DESC}`).innerHTML}`;
        add_filled_module_slot(jobmod_id, assignment_qty, description, empty_slot);
        empty_slot.remove();
    }

    bucket_div.remove();
}


// Assignment: create a new JobModule on the server, storing the relationship between the parent, slot, and child
async function update_server_create_jobmodule(child_id, parent_id, slot_id, quantity = 1){ 
    let request_options = get_request_options('POST', {
        'parent': parent_id,
        'child': child_id,
        'slot': slot_id,
        'quantity': quantity
    });

    return await update_backend(URL_ASSIGNMENTS, request_options);
}



// General Support: create an empty slot div
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

// Assignment: Create a div to "fill the slot" with the selected JobItem
function create_ele_module_slot_filled(description, quantity, jobmod_id){
    let div = document.createElement('div');
    div.classList.add(CLASS_MODULE_SLOT_GENERAL);
    div.classList.add('jobitem');

    div.append(create_ele_slot_filler_edit_btn(jobmod_id));
    div.append(create_ele_slot_filler_desc_span(description, quantity));
    
    return div;
}


// Assignment: Create an edit button for a filled slot
function create_ele_slot_filler_edit_btn(jobmod_id){
    let btn = create_generic_ele_edit_button();

    btn.setAttribute('data-jobmod', jobmod_id);
    btn.addEventListener('click', (e) => {
        open_editor_module_slot_filler(e);
    })
    return btn;
}


// Assignment: Creates a span containing "$N x [ABC123456] Thingummy Jigger", where $N is replaced by the second arg to the function
function create_ele_slot_filler_desc_span(description, quantity){
    let re = QTY_RE;
    let span = document.createElement('span');
    span.classList.add('child-desc');
    span.innerHTML = description.replace(re, quantity); 
    return span;
}













// ------------------------------------------------------------------------
// Delete Assignment
// ------------------------------------------------------------------------
// Delete Assignment: called onClick by the [x] button on filled slots. Manages removing a JobItem from a slot
async function remove_jobmodule(e){
    let resp = await update_server_delete_assignment(e);

    if(!status_is_good(resp)){
        let submit_btn = document.getElementById(ID_EDIT_FORM_SUBMIT_BUTTON);
        display_module_error(submit_btn, resp, 'Failed to empty slot.');
        return;
    }

    unfill_slot_on_page(e);
}

// Delete Assignment: Backend removal of the JobItem from the slot
async function update_server_delete_assignment(e){
    let request_options = get_request_options('DELETE');
    return await update_backend(`${URL_ASSIGNMENTS}?id=${e.target.dataset.jobmod}`, request_options);
}

// Delete Assignment: Frontend removal of the JobItem from the slot
function unfill_slot_on_page(e){
    let slot_filler = e.target.closest(`.${CLASS_MODULE_SLOT_GENERAL}`);
    let empty_slot = create_ele_module_slot_empty();
    
    slot_filler.after(empty_slot);
    slot_filler.remove();
    update_module_slot_status(empty_slot);
    
    close_editor_module_slot_filler(e.target);
}















// -----------------------------------------------------------------------------
// Edit mode for filled slots
// -----------------------------------------------------------------------------
// Edit Filled Slot: Called onClick of the [edit] button on a filled slot
function open_editor_module_slot_filler(e){
    // Find the "main" slot div and the span with the display text
    let filler_div = e.target.closest(`.${CLASS_MODULE_SLOT_GENERAL}`);
    let desc_span = filler_div.querySelector('.child-desc');

    // Prep values, then call a function to generate a suitable edit-mode form and add it to the page
    let jobmod_id = e.target.dataset.jobmod;
    let qty_and_desc = desc_span.innerHTML;
    filler_div.prepend(create_editor_module_slot_filler(jobmod_id, qty_and_desc));

    // Hide all the edit and remove buttons
    desc_span.innerHTML = qty_and_desc.replace(QTY_RE, '');
    filler_div.classList.add(CLASS_MODULE_SLOT_IN_EDIT_MODE);
    desc_span.classList.add('hide');
    hide_all_by_class('edit-icon');
    hide_all_by_class('remove-from-slot-btn');
}

// Edit mode, close: called onclick of the cancel button, exits edit mode on the page without troubling the server
function close_editor_module_slot_filler(ele, new_qty){
    // Find the parent filler div, then work from there
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
    if(desc_span.classList.contains('hide')){
        desc_span.classList.remove('hide');
    }

    if(filler_div.classList.contains(CLASS_MODULE_SLOT_IN_EDIT_MODE)){
        filler_div.classList.remove(CLASS_MODULE_SLOT_IN_EDIT_MODE);
    }

    unhide_all_by_class('edit-icon');
    remove_all_error_eles();
}



function create_editor_module_slot_filler(jobmod_id, filler_text){
    let result = document.createElement('div');
    result.classList.add(CLASS_EDITOR_SLOT_FILLER_QUANTITY);

    result.append(create_ele_module_slot_filler_editor_cancel_btn());
    result.append(create_ele_module_slot_filler_editor_description(filler_text));
    result.append(create_ele_module_slot_filler_editor_delete_btn(jobmod_id));
    result.append(create_ele_module_slot_filler_editor_quantity_and_submit(jobmod_id, filler_text));

    return result;
}

function remove_quantity_from_description(description){
    // Expected input = "### x String-to-keep"
    // Expected output = "String-to-keep"
    let re_qty_x = /^.+( x )/;
    return description.trim().replace(re_qty_x, '');
}

function create_ele_module_slot_filler_editor_description(description){
    let result = document.createElement('span');
    result.classList.add('desc');

    result.innerHTML = remove_quantity_from_description(description);

    return result;
}

function create_ele_module_slot_filler_editor_quantity_and_submit(jobmod_id, filler_text){
    let result = document.createElement('span');
    result.classList.add('combo-input-and-button');

    result.append(create_ele_module_slot_filler_editor_quantity_field(jobmod_id, filler_text));
    result.append(create_ele_module_slot_filler_editor_submit_btn());

    return result;
}

function create_ele_module_slot_filler_editor_quantity_field(jobmod_id, filler_text){
    let result = get_jobitem_qty_field();

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




// Edit mode: submit button for the "form"
function create_ele_module_slot_filler_editor_submit_btn(){
    let btn = create_generic_ele_submit_button();
    btn.id = ID_EDIT_FORM_SUBMIT_BUTTON;
    btn.addEventListener('click', (e) => {
        update_module_slot_quantity(e.target.previousSibling);
    });

    return btn;
}


// Edit Mode: Creates a "-" button for removing the JobItem from the slot
function create_ele_module_slot_filler_editor_delete_btn(jobmod_id){
    let btn = document.createElement('button');
    btn.classList.add('delete-panel');

    let span = document.createElement('span');
    span.innerHTML = 'unassign';
    btn.append(span);

    btn.setAttribute('data-jobmod', jobmod_id);
    btn.addEventListener('click', (e) => {
        remove_jobmodule(e);
    });
    return btn;
}

// Edit mode: button to cancel edit mode
function create_ele_module_slot_filler_editor_cancel_btn(){
    let btn = create_generic_ele_cancel_button();

    btn.classList.add('close-edit-mode');
    btn.addEventListener('click', (e) => {
        close_editor_module_slot_filler(e.target);
    });

    return btn;
}






// Edit Mode Action: called onclick of the submit button
async function update_module_slot_quantity(qty_field){
    let response_data = await update_server_module_slot_quantity(qty_field);
    if(!status_is_good(response_data, 200)){
        display_module_error(qty_field.parentElement, data);
    }
    else {
        update_page_module_slot_quantity(qty_field, qty_field.dataset.id);
    }
}

async function update_server_module_slot_quantity(qty_field){
    let request_options = get_request_options('PUT', {
        'qty': qty_field.value,
        'prev_qty': qty_field.dataset.prev_qty,
        'id': qty_field.dataset.id
    });

    return await update_backend(URL_ASSIGNMENTS, request_options);
}






// Edit Mode: Update the qty in the filled div, then get rid of the edit "form"
function update_page_module_slot_quantity(qty_field, jobmod_id){
    // input=number allows some inputs that can be valid as part of a number, but aren't numbers on their own (e.g. 'e', '-')
    // If the user enters something unsuitable, the server will ignore it, so ignore it on the page too: close the form as it it were cancelled
    if(qty_field.value === '' || parseFloat(qty_field.value) <= 0){
        close_editor_module_slot_filler(qty_field);
        return;
    }

    // Otherwise update slot status and close edit mode, sending the qty field to the function so it can replace the quantity in the display text
    update_module_slot_status(qty_field, jobmod_id);
    close_editor_module_slot_filler(qty_field, qty_field.value);   
}

// Edit Mode: users are not allowed to add new JobItems via edit mode on the module management page. If they try, display a warning.
function display_module_error(preceding_ele, error_info, task_failed_string = null){
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




// Edit Mode: remove the error message. (This is called when opening the bucket menu and when closing edit mode,
//                                        i.e. when the user indicates they're doing something to fix it)
function remove_all_error_eles(){
    document.querySelectorAll('.' + CLASS_ERROR_MESSAGE).forEach(div => {
        div.remove();
    });
}

























// --------------------------------------------------------------------------------
// Slot Status Indicators
// --------------------------------------------------------------------------------
// Slot Status: called during create, edit and delete, i.e. anything that can alter the slot status
async function update_module_slot_status(ele){
    let id_obj = get_slot_and_parent_ids(ele);
    let url = `${URL_ASSIGNMENTS}?parent_id=${id_obj.parent}&slot_id=${id_obj.slot}`;
    let slot_data = await query_backend(url);

    let jobitem_ele = ele.closest(`.${CLASS_PARENT_ITEM_CONTAINER}`);
    update_ele_excess_modules_css(jobitem_ele, slot_data['jobitem_has_excess']);

    let subsection = ele.closest('.' + 'subsection');
    update_ele_excess_modules_css(subsection, parseInt(slot_data['slot_num_excess']) > 0);

    // Update the indicators in the "spine"
    let slot_ele = ele.closest('.' + CLASS_SLOT_CONTAINER);
    update_ele_slot_status_indicator(slot_ele, 'required', slot_data['required_str']);
    update_ele_slot_status_indicator(slot_ele, 'optional', slot_data['optional_str']);
    update_ele_excess_slot_status_indicator(slot_ele, 'excess', slot_data['slot_num_excess']);
}

// Slot Status: toggle the "excess" CSS class on and off as needed
function update_ele_excess_modules_css(element, has_excess){
    let has_excess_class = element.classList.contains(CLASS_EXCESS_MODULES);

    if(has_excess && !has_excess_class){
        element.classList.add(CLASS_EXCESS_MODULES);
    }
    else if(!has_excess && has_excess_class){
        element.classList.remove(CLASS_EXCESS_MODULES);
    }
    return;
}

// Slot Status: Update numbers and CSS in indicators (for req and opt indicators)
function update_ele_slot_status_indicator(slot_ele, class_indicator, display_text){
    let indicator_ele = slot_ele.querySelector('.' + class_indicator)
    let text_ele = indicator_ele.querySelector('.body');

    text_ele.innerHTML = display_text;
    text_is_full = display_text_shows_full_slot(display_text);
    css_is_full = indicator_ele.classList.contains(CLASS_INDICATOR_IS_FULL);

    if(text_is_full && !css_is_full){
        indicator_ele.classList.add(CLASS_INDICATOR_IS_FULL);
    }
    else if(!text_is_full && css_is_full){
        indicator_ele.classList.remove(CLASS_INDICATOR_IS_FULL);
    } 

    return;
}

// Slot Status: check if the indicator shows a full slot
function display_text_shows_full_slot(text){
    let str_arr = text.split('/');
    return str_arr[0] === str_arr[1];
}


// Slot status: update the number (for excess indicator)
function update_ele_excess_slot_status_indicator(slot_ele, class_indicator, display_text){
    // The excess indicator is a bit special. It's /removed/ when the value is 0; it only displays the total excess (i.e. "2" instead of "2/0")
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
        // Update the text (but not the CSS, so don't get any ideas about reusing the function handling req and opt as-is)
        let result_ele = slot_ele.querySelector('.' + class_indicator).querySelector('.body');
        result_ele.innerHTML = display_text;
    }
} 


// Slot Status: create a new excess indicator div
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








