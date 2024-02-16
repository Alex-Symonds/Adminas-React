/*
    "Main" Document Builder functionality, plus special instructions.
    (If you're looking for the JobItem assignments, those are in a separate file)

    "Main" = 
        > Save document
        > Issue document
        > Delete document
        > "Unsaved changes" warning
        > Response message

    Special Instructions = 
        > Update on the page

    Note: Special instructions are only saved on the server as part of saving 
    the document as a whole, so there's no independent backend stuff for them.

    Contents:
        || Issue document window
        || Update document (covers save and issue)
        || Delete document
        || Unsaved changes warning
        || Special instructions
        || Document validity
*/


const CLASS_SPECIAL_INSTRUCTION_EDITOR = 'editing-special-instruction';
const CLASS_SPECIAL_INSTRUCTION_EDIT = 'edit-special-instruction-btn';
const CLASS_SPECIAL_INSTRUCTION_DELETE = 'delete-special-instruction-btn';
const CLASS_LOCAL_NAV = 'status-controls';

const CLASS_INSTRUCTIONS_EMPTY_MESSAGE = 'no-special-instructions';
const CLASS_INSTRUCTIONS_SECTION = 'special-instructions';
const CLASS_ONE_SPECIAL_INSTRUCTION = 'read_row';

const CLASS_SHOW_ADD_INSTRUCTION_FORMLIKE = 'special-instruction';
const CLASS_HIDE_ADD_INSTRUCTION_FORMLIKE = 'close-new-instr';

const CLASS_UNSAVED_CHANGES = 'unsaved-changes';


document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('#document_save_btn').addEventListener('click', () => {
        save_document();
    });

    document.querySelector('#document_issue_btn').addEventListener('click', (e) => {
        open_issue_document_window(e);
    });

    document.querySelector('#document_delete_btn').addEventListener('click', () => {
        delete_document();
    });

    let fields_container_ele = document.querySelector('.document-fields-container');
    if(fields_container_ele != null){
        document.querySelectorAll('input').forEach(input_ele => {
            input_ele.addEventListener('input', () => {
                show_save_warning_ele();
            })
        });
    }


    const CLASS_ADD_NEW_SI = 'add-new';
    document.querySelector('.' + CLASS_SHOW_ADD_INSTRUCTION_FORMLIKE).addEventListener('click', () => {
        unhide_all_by_class(CLASS_ADD_NEW_SI);
    });
    document.querySelector('.' + CLASS_HIDE_ADD_INSTRUCTION_FORMLIKE).addEventListener('click', () => {
        hide_all_by_class(CLASS_ADD_NEW_SI);
    });

    document.querySelector('.add-special-instruction-btn').addEventListener('click', () => {
        add_special_instruction_to_page();
        hide_all_by_class(CLASS_ADD_NEW_SI);
    });

    document.querySelectorAll('.' + CLASS_SPECIAL_INSTRUCTION_EDIT).forEach(btn => {
        btn.addEventListener('click', (e) => {
            open_editor_special_instruction(e.target);
        })
    });

    document.querySelectorAll('.' + CLASS_SPECIAL_INSTRUCTION_DELETE).forEach(btn => {
        btn.addEventListener('click', (e) => {
            delete_ele_special_instruction(e.target);
        })
    });

});




// || Issue document window
function open_issue_document_window(e){
    let window = create_ele_issue_document_window();
    e.target.after(window);
}


function close_issue_document_window(btn){
    btn.parentElement.remove();
    return;
}


function create_ele_issue_document_window(){
    let div = document.createElement('div');
    div.classList.add(CSS_GENERIC_PANEL);
    div.classList.add(CSS_GENERIC_FORM_LIKE);

    div.append(create_ele_issue_document_window_cancel_btn());
    div.append(create_ele_issue_document_window_heading());
    div.append(create_ele_issue_document_window_issue_date_input());
    div.append(create_ele_issue_document_window_issue_btn());

    return div;
}


function create_ele_issue_document_window_cancel_btn(){
    let cancel_btn = create_generic_ele_cancel_button();
    cancel_btn.addEventListener('click', (e) => {
        close_issue_document_window(e.target);
    });
    return cancel_btn; 
}


function create_ele_issue_document_window_heading(){
    let heading = document.createElement('h4');
    heading.classList.add(CSS_GENERIC_PANEL_HEADING);
    heading.innerHTML = 'Issue Date';
    return heading;
}


function create_ele_issue_document_window_issue_date_input(){
    let input = document.createElement('input');
    input.classList.add('issue-date');
    input.type = 'date';
    const today = new Date();
    default_value = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    input.value = default_value;
    return input;
}


function create_ele_issue_document_window_issue_btn(){
    let issue_btn = create_generic_ele_submit_button();
    issue_btn.classList.add('full-width-button');
    issue_btn.innerHTML = 'issue';
    issue_btn.addEventListener('click', (e) => {
        issue_document(e.target);
    });
    return issue_btn;
}



// || Update document
function issue_document(btn){
    let input = btn.parentElement.querySelector('input');
    let issue_date = input.value;
    update_document(issue_date);    
}


function save_document(){
    update_document(null);
}


function update_document(issue_date){
    const DOC_ID_WHEN_CREATING_NEW = '0';
    let obj = get_document_data_as_object(issue_date);

    if(DOC_ID == DOC_ID_WHEN_CREATING_NEW){
        update_document_on_server('POST', 201, obj, `job=${JOB_ID}&type=${DOC_CODE}`);
    }
    else {
        update_document_on_server('PUT', 204, obj, `id=${DOC_ID}`);
    }
}


async function update_document_on_server(method, expected_response_code, doc_data, get_params){
    var request_options = getRequestOptions(method, doc_data);
    let resp_data = await update_backend(`${URL_DOCBUILDER}?${get_params}`, request_options);

    if(status_is_good(resp_data, expected_response_code)){
        if(expected_response_code === 201){
            window.location.href = resp_data[KEY_LOCATION];
        }
        else{
            update_page_after_successful_save(`${URL_DOCBUILDER}?${get_params}`);
        }
    }
    else {
        display_document_response_message(resp_data);
    }
}


async function update_page_after_successful_save(full_url){
    let resp_data = await query_backend(full_url);
    if(status_is_good(resp_data, 200)){
        
        if('doc_is_issued' in resp_data){

            // Once a document is issued, no further edits are permitted: redirect away from the editor page
            if(resp_data['doc_is_issued'] === true){
                window.location.href = URL_DOCMAIN;
            }

            remove_unsaved_changes_ele();
            
            if('doc_is_valid' in resp_data && 'item_is_valid' in resp_data){
                update_validity_warnings(resp_data['doc_is_valid'], resp_data['item_is_valid']);
                display_document_response_message('Document saved');
                return;
            }
        }
    }
    display_document_response_message("Page display error: refresh is recommended.", true);
}


function get_document_data_as_object(issue_date){
    let obj = {};
    obj['reference'] = document.querySelector('#id_doc_reference').value;
    obj['issue_date'] = issue_date;
    obj['assigned_items'] = get_docitems_assignment_quantity_object();
    obj['special_instructions'] = get_special_instructions_as_list();

    let req_prod_date_value = get_value_from_id('id_req_prod_date');
    if(req_prod_date_value !== null){
        obj['req_prod_date'] = req_prod_date_value;
    }

    let sched_prod_date_value = get_value_from_id('id_sched_prod_date');
    if(sched_prod_date_value !== null){
        obj['sched_prod_date'] = sched_prod_date_value;
    }

    return obj;
}


function get_value_from_id(id_str){
    let target_ele = document.getElementById(id_str);
    if(target_ele){
        var target_value = target_ele.value;
        if(target_value == ''){
            return '';
        }
        else {
            return target_value;
        }
    } 
    return null;
}


function get_docitems_assignment_quantity_object(){
    // Creates an object with a key for each JobItem ID, where the values are the quantities to assign to the document.
    //  >> JobItems entirely excluded:  value = 0
    //  >> Split JobItems:              value = included quantity
    //  >> JobItems entirely included:  value = included quantity
    let included_ul = document.querySelector('#' + ID_INCLUDES_UL);
    let excluded_ul = document.querySelector('#' + ID_EXCLUDES_UL);
    let obj_included_items_with_quantities = ul_to_docitems_assignment_quantity_object(included_ul, false);
    let obj_excluded_items_set_to_zero = ul_to_docitems_assignment_quantity_object(excluded_ul, true);
    return {...obj_excluded_items_set_to_zero, ...obj_included_items_with_quantities};
}


function ul_to_docitems_assignment_quantity_object(ul_ele, force_0_quantity){
    let result = {};
    if(null == ul_ele.querySelector('.' + CLASS_NONE_LI)){
        Array.from(ul_ele.children).forEach(ele => {
            if(ele.tagName == 'LI'){
                id_to_str = String(ele.dataset.jiid);
                result[id_to_str] = force_0_quantity ? 0 : parseInt(ele.querySelector('.display').innerHTML.match(QTY_RE)[0]);
            }
        });
    }
    return result;
}


function get_special_instructions_as_list(){
    let special_instructions = [];
    let container_ele = document.querySelector('.' + CLASS_INSTRUCTIONS_SECTION);
    let parent_ele = container_ele.querySelector('.existing');

    Array.from(parent_ele.children).forEach(ele => {
        if(!ele.classList.contains(CLASS_INSTRUCTIONS_EMPTY_MESSAGE)){
            let d = {};
            // All special instructions must have an 'id' key.
            // New special instructions won't have an assigned ID yet, so use 0
            // to indicate newness.
            d['id'] = ele.hasAttribute('siid') ? ele.dataset.siid : 0;
            d['contents'] = ele.querySelector('.contents').innerHTML;
            special_instructions.push(d);
        }
    });
    return special_instructions;
}



// || Delete document
async function delete_document(){
    let delete_confirmed = confirm('Deleting a document cannot be undone except by a system administrator. Are you sure?');
    if(delete_confirmed){
        let request_options = getRequestOptions('DELETE');
        let resp_data = await update_backend(`${URL_DOCBUILDER}?id=${DOC_ID}`, request_options);
        if(status_is_good(resp_data, 204)){
            window.location.href = JOB_URL;
        }
        else{
            display_document_response_message(resp_data);
        }
    }
}





// || Unsaved changes warning
function show_save_warning_ele(){
    let existing_unsaved_ele = document.querySelector(`.${CLASS_UNSAVED_CHANGES}`);

    if(existing_unsaved_ele == null){
        let anchor_ele = document.querySelector('.status-controls');
        let new_unsaved_ele = create_unsaved_changes_ele();
        anchor_ele.append(new_unsaved_ele);
    }
}


function create_unsaved_changes_ele(){
    let div = document.createElement('div');
    div.classList.add(CLASS_UNSAVED_CHANGES);
    div.innerHTML = 'warning: unsaved changes exist';
    return div;
}


function remove_unsaved_changes_ele(){
    let existing_unsaved_ele = document.querySelector(`.${CLASS_UNSAVED_CHANGES}`);
    if(existing_unsaved_ele != null){
        existing_unsaved_ele.remove();
    }
}





// || Special instructions
function open_editor_special_instruction(btn){
    let target_div = btn.parentElement;
    let contents_div = target_div.querySelector('.contents');
    contents_div.classList.add(CSS_HIDE);
    hide_all_by_class(CSS_EDIT_ICON);

    let old_str = contents_div.innerHTML;
    target_div.prepend(create_ele_editor_special_instruction(old_str));
}


function close_editor_special_instruction(btn){
    let edit_ele = btn.closest(`.${CLASS_SPECIAL_INSTRUCTION_EDITOR}`);
    let target_ele = edit_ele.parentElement;
    edit_ele.remove();

    let contents_div = target_ele.querySelector('.contents');
    contents_div.classList.remove(CSS_HIDE);
    unhide_all_by_class(CSS_EDIT_ICON);
}


function create_ele_editor_special_instruction(old_str){
    let edit_div = create_ele_editor_special_instruction_base();
    edit_div.append(create_ele_editor_special_instruction_cancel_button());
    edit_div.append(create_ele_editor_special_instruction_heading());
    edit_div.append(create_ele_editor_special_instruction_input(old_str));
    edit_div.append(create_ele_editor_special_instruction_button_container());

    return edit_div;
}


function create_ele_editor_special_instruction_base(){
    let edit_div = document.createElement('div');
    edit_div.classList.add(CLASS_SPECIAL_INSTRUCTION_EDITOR);
    edit_div.classList.add(CSS_GENERIC_PANEL);
    edit_div.classList.add(CSS_GENERIC_FORM_LIKE);
    return edit_div;
}


function create_ele_editor_special_instruction_cancel_button(){
    let cancel_btn = create_generic_ele_cancel_button();
    cancel_btn.addEventListener('click', (e) => {
        close_editor_special_instruction(e.target);
    });
    return cancel_btn;
}


function create_ele_editor_special_instruction_heading(){
    let heading = document.createElement('h5');
    heading.classList.add(CSS_GENERIC_PANEL_HEADING);
    heading.innerHTML = 'Edit Special Instruction';
    return heading;
}


function create_ele_editor_special_instruction_input(previous_str){
    let input = document.createElement('textarea');
    input.innerHTML = previous_str;
    return input;
}


function create_ele_editor_special_instruction_button_container(){
    let button_container = document.createElement('div');
    button_container.classList.add('controls');

    button_container.append(create_ele_editor_special_instruction_submit_button());
    button_container.append(create_ele_editor_special_instruction_delete_button());

    return button_container;
}


function create_ele_editor_special_instruction_submit_button(){
    let ok_btn = create_generic_ele_submit_button();
    ok_btn.innerHTML = 'change';
    ok_btn.addEventListener('click', (e) => {
        update_ele_special_instruction(e.target);
    });
    return ok_btn;
}


function create_ele_editor_special_instruction_delete_button(){
    let del_btn = create_generic_ele_delete_button();
    del_btn.setAttribute('data-siid', '0');
    del_btn.addEventListener('click', (e) => {
        delete_ele_special_instruction(e.target);
    }); 
    return del_btn;
}


function add_special_instruction_to_page(){
    let section_div = document.querySelector('.special-instructions');
    let input = section_div.querySelector('textarea');
    let new_contents_str = input.value;
    input.value = '';

    let destination_parent = document.querySelector('.existing');
    let new_instruction_ele = create_ele_special_instruction(new_contents_str);
    destination_parent.prepend(new_instruction_ele);

    update_emptiness_of_special_instructions();
    show_save_warning_ele();
}


function create_ele_special_instruction(display_str){
    let main_div = create_ele_special_instructions_base();
    main_div.append(create_ele_special_instruction_contents(display_str));
    main_div.append(create_ele_special_instruction_edit_btn());
    main_div.append(create_ele_special_instruction_who_and_when_placeholder());

    return main_div;
}


function create_ele_special_instructions_base(){
    let main_div = document.createElement('div');
    main_div.classList.add('read_row');
    return main_div;
}


function create_ele_special_instruction_contents(display_str){
    let contents_div = document.createElement('div');
    contents_div.classList.add('contents');
    contents_div.innerHTML = display_str;
    return contents_div;
}


function create_ele_special_instruction_edit_btn(){
    let edit_btn = create_generic_ele_edit_button();
    edit_btn.setAttribute('data-siid', '0');
    edit_btn.addEventListener('click', (e) => {
        open_editor_special_instruction(e.target);
    });
    return edit_btn;
}


function create_ele_special_instruction_who_and_when_placeholder(){
    let info_div = document.createElement('div');
    info_div.classList.add('who-and-when');

    let username_span = document.createElement('span');
    username_span.classList.add('username');
    username_span.innerHTML = 'You';
    info_div.append(username_span);

    let text_on = document.createTextNode(' on ');
    info_div.append(text_on);

    let when_span = document.createElement('span');
    when_span.classList.add('when');
    when_span.innerHTML = get_date_time();
    info_div.append(when_span);

    return info_div;
}


function update_ele_special_instruction(btn){
    let edit_ele = btn.closest(`.${CLASS_SPECIAL_INSTRUCTION_EDITOR}`);
    let input_ele = edit_ele.querySelector('textarea');
    let new_str = input_ele.value;

    let special_inst_ele = btn.closest('.read_row');
    let target_ele = special_inst_ele.querySelector('.contents');
    target_ele.innerHTML = new_str;

    target_ele.classList.remove(CSS_HIDE);

    close_editor_special_instruction(btn);
    show_save_warning_ele();
}


function delete_ele_special_instruction(btn){
    btn.closest('.' + CLASS_ONE_SPECIAL_INSTRUCTION).remove();
    update_emptiness_of_special_instructions();
    show_save_warning_ele();
}


function update_emptiness_of_special_instructions(){
    let section_div = document.querySelector('.special-instructions');
    let none_p = section_div.querySelector(`.${CLASS_INSTRUCTIONS_EMPTY_MESSAGE}`);

    let want_none_p = section_div.querySelector('.' + CLASS_ONE_SPECIAL_INSTRUCTION) == null;
    let have_none_p = none_p != null;

    if(want_none_p && !have_none_p){
        let existing = document.querySelector('.existing');
        existing.append(create_ele_empty_special_instructions()); 
    }
    else if(!want_none_p && have_none_p){
        none_p.remove();
    }
}


function create_ele_empty_special_instructions(){
    let p = document.createElement('p');
    p.classList.add(CLASS_INSTRUCTIONS_EMPTY_MESSAGE);
    p.innerHTML = "No special instructions on this document";
    return p;
}



// || Document validity
function update_validity_warnings(doc_is_valid, item_validity_list){
    clear_document_validity_warning(doc_is_valid);
    clear_lineitem_validity_warnings(item_validity_list);
}


function clear_document_validity_warning(is_valid){
    if(is_valid === true && document.contains(document.getElementById('invalid_document_warning'))){
        document.getElementById('invalid_document_warning').remove();
        document.getElementById('document_issue_btn').removeAttribute('disabled');
    }
}


function clear_lineitem_validity_warnings(item_validity_list){
    const CSS_CLASS_INVALID = 'invalid';

    document.querySelectorAll(`.${CSS_CLASS_INVALID}`).forEach((this_li) => {
        const jiid = this_li.dataset.jiid;
        if(jiid in item_validity_list && item_validity_list[jiid] === true){
            this_li.classList.remove(CSS_CLASS_INVALID);
            this_li.querySelector('.invalid-icon').remove();
        }
    });

}

