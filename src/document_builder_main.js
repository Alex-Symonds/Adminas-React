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

import { 
    create_generic_ele_delete_button,
    create_generic_ele_edit_button,
    create_generic_ele_submit_button,
    CSS_EDIT_ICON,
    CSS_HIDE,
    disableAllByClass,
    enableAllByClass,
    get_date_time,
    getRequestOptions,
    hide_all_by_class, 
    KEY_LOCATION,
    QTY_RE,
    query_backend,
    status_is_good,
    unhide_all_by_class,
    update_backend,
} from "./util.js";

import {
    display_document_response_message
} from './document_main.js';

import { 
    CLASS_NONE_LI,
    findIncludedUl,
    findExcludedUl,
    CSS_DOCITEM_DESC_STRING,
} from './document_builder_items.js';

import { 
    create_generic_modal, 
    create_generic_modal_heading, 
    CSS_MODAL, 
    open_modal 
} from "./modal.js";


const CLASS_INSTRUCTIONS_EMPTY_MESSAGE = 'no-special-instructions';

const CSS_IDENTIFYING_SPECINSTR_EDIT = 'editSpecialInstructionModal';
const CLASS_SPECIAL_INSTRUCTION_EDITOR = 'editSpecialInstructionModal_contents';

const CSS_SPECIALINSTR_FORM = 'documentPageSpecialInstructions_form';

const CSS_SPECIALINSTR_ONE = 'documentPageSpecialInstructions_specialInstructionContainer';
const CSS_SPECIALINSTR_CONTENTS = 'documentPageSpecialInstructions_specialInstructionContents';


document.addEventListener('DOMContentLoaded', () => {
    setupDocumentBuilderMainControls();
});


function setupDocumentBuilderMainControls(){

    // Main control bar

    // Save button
    findSaveButton()?.addEventListener('click', () => {
        save_document();
    });

    // Issue button
    document.querySelector('.issueFinalIconTextButton').addEventListener('click', (e) => {
        open_issue_document_window(e);
    });

    // Delete button
    document.querySelector('.deleteIconTextButton').addEventListener('click', () => {
        delete_document();
    });



    // General Section
    // Add "unsaved changes" warning to every inpuyt
    const fields_container_ele = document.querySelector('.documentPageGeneral');
    if(fields_container_ele != null){
        document.querySelectorAll('input').forEach(input_ele => {
            input_ele.addEventListener('input', () => {
                unsavedDocumentChangesWarning().on();
            })
        });
    }


    // Special Instructions: Creation Form
    // Note: this form was created in the Django template, with "hidden" CSS class, so we just need to
    // add functionality to the existing DOM elements

    // Active show button
    const CSS_IDENTIFYING_SPECINSTR = 'addNewSpecialInstructionModal';
    document.querySelector('.openCreateSpecialInstruction')?.addEventListener('click', () => {
        unhide_all_by_class(CSS_IDENTIFYING_SPECINSTR);
        const wrapperQuery = document.querySelectorAll(`.${CSS_IDENTIFYING_SPECINSTR}`);
        if(wrapperQuery.length === 1){
            const dialog = wrapperQuery[0].querySelectorAll(`.${CSS_MODAL}`)[0];
            dialog?.show();
        }
    });
    // Active close button
    document.querySelector('.close-new-instr')?.addEventListener('click', () => {
        hideAddSpecialInstructions();
    });

    // Activate submit button
    document.querySelector('.add-special-instruction-btn').addEventListener('click', () => {
        add_special_instruction_to_page();
        hideAddSpecialInstructions();
    });

    function hideAddSpecialInstructions(){
        hide_all_by_class(CSS_IDENTIFYING_SPECINSTR);
        const wrapperQuery = document.querySelectorAll(`.${CSS_IDENTIFYING_SPECINSTR}`);
        if(wrapperQuery.length === 1){
            const dialog = wrapperQuery[0].querySelectorAll(`.${CSS_MODAL}`)[0];
            dialog?.close();
        }
    }

    // Special Instructions: Editing
    document.querySelectorAll('.documentPageSpecialInstructions_specialInstructionEditBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            open_editor_special_instruction(e.target);
        })
    });
}






// || Issue document window
export function open_issue_document_window(e){
    const content = create_ele_issue_document_content();
    const modal = create_generic_modal(content, "", null);
    e.target.after(modal);
    open_modal(modal);
}


function create_ele_issue_document_content(){
    const content = document.createElement('div');
    content.classList.add('docBuilderIssueDoc');

    const heading = create_generic_modal_heading(2);
    heading.textContent = "Issue Final";
    content.append(heading);

    const form = create_ele_issue_document_form();
    content.append(form);

    return content;
}


function create_ele_issue_document_form(){
    const form = document.createElement('form');
    form.classList.add('docBuilderIssueDoc_form');

    form.append(create_ele_issue_document_window_issue_date());
    form.append(create_ele_issue_document_window_issue_btn());

    return form;
}


function create_ele_issue_document_window_issue_date(){
    const labelAndInputWrapper = document.createElement('div');
    labelAndInputWrapper.classList.add('docBuilderIssueDoc_formRow');

    const ID_FOR_ISSUE_DATE = 'id_docBuilder_issueDate';
    labelAndInputWrapper.append(create_ele_issue_document_window_issue_date_label(ID_FOR_ISSUE_DATE));
    labelAndInputWrapper.append(create_ele_issue_document_window_issue_date_input(ID_FOR_ISSUE_DATE));
    
    return labelAndInputWrapper;
}


function create_ele_issue_document_window_issue_date_label(ID_FOR_ISSUE_DATE){
    const label = document.createElement('label');
    label.htmlFor = ID_FOR_ISSUE_DATE;
    label.textContent = 'Issue Date';
    return label;
}


function create_ele_issue_document_window_issue_date_input(ID_FOR_ISSUE_DATE){
    const input = document.createElement('input');
    input.id = ID_FOR_ISSUE_DATE;
    input.classList.add('issue-date');
    input.type = 'date';
    const today = new Date();
    const default_value = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    input.value = default_value;
    return input;
}


function create_ele_issue_document_window_issue_btn(){
    const issue_btn = create_generic_ele_submit_button();
    issue_btn.classList.add('docBuilderIssueDoc_submitBtn');
    issue_btn.type = 'button';
    issue_btn.innerHTML = 'issue';
    issue_btn.addEventListener('click', (e) => {
        issue_document(e.target);
    });
    return issue_btn;
}



// || Update document
function issue_document(btn){
    const input = btn.parentElement.querySelector('input');
    const issue_date = input.value;
    update_document(issue_date);    
}


export function save_document(){
    update_document(null);
}


function update_document(issue_date){
    const DOC_ID_WHEN_CREATING_NEW = '0';
    const obj = get_document_data_as_object(issue_date);

    console.log(obj);
    console.log("DOC_ID", DOC_ID);
    if(DOC_ID === DOC_ID_WHEN_CREATING_NEW){
        console.log("creating a new document", DOC_ID);
        update_document_on_server('POST', 201, obj, `job=${JOB_ID}&type=${DOC_CODE}`);
    }
    else {
        console.log("saving an existing document", DOC_ID);
        update_document_on_server('PUT', 204, obj, `id=${DOC_ID}`);
    }
}


async function update_document_on_server(method, expected_response_code, doc_data, get_params){
    const request_options = getRequestOptions(method, doc_data);
    const resp_data = await update_backend(`${URL_DOCBUILDER}?${get_params}`, request_options);

    if(status_is_good(resp_data, expected_response_code)){
        // If a new document was just created, there is now an "editor" page for it. Redirect there.
        if(expected_response_code === 201){
            window.location.href = resp_data[KEY_LOCATION];
        }
        // If an existing document was edited, we're already on the editor page, so update it.
        else{
            update_page_after_successful_save(`${URL_DOCBUILDER}?${get_params}`);
        }
    }
    else {
        display_document_response_message(resp_data, true);
    }
}


async function update_page_after_successful_save(full_url){
    const resp_data = await query_backend(full_url);
    if(status_is_good(resp_data, 200)){
        if('doc_is_issued' in resp_data){
            // Once a document is issued, no further edits are permitted: redirect away from the editor page
            if(resp_data['doc_is_issued'] === true){
                window.location.href = window.URL_DOCMAIN;
                return;
            }

            unsavedDocumentChangesWarning().off();
            
            console.log("page updated, checking validity");
            console.log("\tresp data", resp_data);
            if('doc_is_valid' in resp_data && 'item_is_valid' in resp_data){
                console.log("\tall is valid");
                update_validity_warnings(resp_data['doc_is_valid'], resp_data['item_is_valid']);
                display_document_response_message('Document saved');
                return;
            }
        }
    }
    display_document_response_message("Page display error: refresh is recommended.", true);
}


function get_document_data_as_object(issue_date){
    const obj = {};
    obj['reference'] = document.querySelector('#id_doc_reference').value;
    obj['issue_date'] = issue_date;
    obj['assigned_items'] = get_docitems_assignment_quantity_object();
    obj['special_instructions'] = get_special_instructions_as_list();

    const req_prod_date_value = get_value_from_id('id_req_prod_date');
    if(req_prod_date_value !== null){
        obj['req_prod_date'] = req_prod_date_value;
    }

    const sched_prod_date_value = get_value_from_id('id_sched_prod_date');
    if(sched_prod_date_value !== null){
        obj['sched_prod_date'] = sched_prod_date_value;
    }

    return obj;
}


function get_value_from_id(id_str){
    const target_ele = document.getElementById(id_str);
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
    const included_ul = findIncludedUl();
    const excluded_ul = findExcludedUl();
    const obj_included_items_with_quantities = ul_to_docitems_assignment_quantity_object(included_ul, false);
    const obj_excluded_items_set_to_zero = ul_to_docitems_assignment_quantity_object(excluded_ul, true);
    return {...obj_excluded_items_set_to_zero, ...obj_included_items_with_quantities};
}


function ul_to_docitems_assignment_quantity_object(ul_ele, force_0_quantity){
    const result = {};
    if(null === ul_ele.querySelector('.' + CLASS_NONE_LI)){
        Array.from(ul_ele.children).forEach(ele => {
            if(ele.tagName === 'LI'){
                const id_to_str = String(ele.dataset.jiid);
                result[id_to_str] = force_0_quantity ? 0 : parseInt(ele.querySelector(`.${CSS_DOCITEM_DESC_STRING}`).innerHTML.match(QTY_RE)[0]);
            }
        });
    }
    return result;
}


function get_special_instructions_as_list(){
    const special_instructions = [];
    const container_ele = document.querySelector('.documentPageSpecialInstructions');
    const parent_ele = container_ele.querySelector('.existing');

    Array.from(parent_ele.children).forEach(ele => {
        if(!ele.classList.contains(CLASS_INSTRUCTIONS_EMPTY_MESSAGE)){
            let d = {};
            // All special instructions must have an 'id' key.
            // New special instructions won't have an assigned ID yet, so use 0
            // to indicate newness.
            d['id'] = ele.hasAttribute('siid') ? ele.dataset.siid : 0;
            d['contents'] = ele.querySelector(`.${CSS_SPECIALINSTR_CONTENTS}`).innerHTML;
            special_instructions.push(d);
        }
    });
    return special_instructions;
}



// || Delete document
export async function delete_document(){
    let delete_confirmed = window.confirm('Deleting a document cannot be undone except by a system administrator. Are you sure?');
    if(delete_confirmed){
        let request_options = getRequestOptions('DELETE');
        try{
            let resp_data = await update_backend(`${URL_DOCBUILDER}?id=${DOC_ID}`, request_options);
            if(status_is_good(resp_data, 204)){
                window.location.href = JOB_DOCTAB_URL;
            }
            else{
                display_document_response_message(resp_data);
            }
        }
        catch(error){
            display_document_response_message("Delete failed. Try again later.", true);
        }

    }
}


function findSaveButton(){
    return document.querySelector('.saveIconTextButton');
}




// || Unsaved changes warning
export function unsavedDocumentChangesWarning(){
    const CLASS_UNSAVED_CHANGES = 'documentPageWarnings_unsavedChanges';

    const CSS_OFF = `${CLASS_UNSAVED_CHANGES}-off`;
    const CSS_ON = `${CLASS_UNSAVED_CHANGES}-on`;

    function findUnsavedChangesWarning(){
        return document.querySelector(`.${CLASS_UNSAVED_CHANGES}`);
    }

    function on(){
        const ele = findUnsavedChangesWarning();
        if(ele.classList.contains(CSS_OFF)){
            ele.classList.remove(CSS_OFF);
            ele.classList.add(CSS_ON);
            ele.innerHTML = 'Warning: unsaved changes exist';
        }
    
        const saveButton = findSaveButton();
        if(saveButton !== null){
            saveButton.disabled = false;
        }
    }

    function off(){
        const ele = findUnsavedChangesWarning();
        if(ele.classList.contains(CSS_ON)){
            ele.classList.remove(CSS_ON);
            ele.classList.add(CSS_OFF);
            ele.innerHTML = '';
        }

        const saveButton = findSaveButton();
        if(saveButton !== null){
            saveButton.disabled = true;
        }
    }

    return { on, off };
}


// || Special instructions
export function open_editor_special_instruction(btn){
    disableAllByClass(CSS_EDIT_ICON);
    
    const target_div = btn.parentElement;
    const contents_div = target_div.querySelector(`.${CSS_SPECIALINSTR_CONTENTS}`);
    const old_str = contents_div.innerHTML;
    const contents = create_ele_editor_special_instruction(old_str);

    const modal = create_generic_modal(contents, CSS_IDENTIFYING_SPECINSTR_EDIT, closeSpecialInstructionsEditor);
    target_div.prepend(modal);
    open_modal(modal);
}


function closeSpecialInstructionsEditor(){
    const editors = document.querySelectorAll(`.${CSS_IDENTIFYING_SPECINSTR_EDIT}`);
    if(editors.length === 1){
        editors[0].remove();
    }

    enableAllByClass(CSS_EDIT_ICON);
}


function create_ele_editor_special_instruction(old_str){
    let edit_div = document.createElement('div');
    edit_div.classList.add(CLASS_SPECIAL_INSTRUCTION_EDITOR);

    const heading = create_generic_modal_heading(2);
    heading.textContent = "Special Instructions";
    edit_div.append(heading);

    const ID_FOR_TEXTAREA = 'id_specialInstructionContentInEditMode';
    const form = create_ele_editor_special_instruction_form_base();
    form.append(create_ele_editor_special_instruction_label(ID_FOR_TEXTAREA));
    form.append(create_ele_editor_special_instruction_input(old_str, ID_FOR_TEXTAREA));
    form.append(create_ele_editor_special_instruction_button_container());

    edit_div.append(form);
    return edit_div;


    function create_ele_editor_special_instruction_form_base(){
        let edit_div = document.createElement('form');
        edit_div.classList.add(CSS_SPECIALINSTR_FORM);
        edit_div.method = 'post';
        return edit_div;
    }
    
    
    function create_ele_editor_special_instruction_label(forIdStr){
        const label = document.createElement('label');
        label.classList.add('documentPageSpecialInstructions_label');
        label.htmlFor = forIdStr;
        label.textContent = 'Edit special instruction';
        return label;
    }
    
    
    function create_ele_editor_special_instruction_input(previous_str, idStr){
        let input = document.createElement('textarea');
        input.id = idStr;
        input.classList.add('documentPageSpecialInstructions_textarea');
        input.innerHTML = previous_str;
        return input;
    }


    function create_ele_editor_special_instruction_button_container(){
        let button_container = document.createElement('div');
        button_container.classList.add('documentPageSpecialInstructions_controlsContainer');
    
        button_container.append(create_ele_editor_special_instruction_submit_button());
        button_container.append(create_ele_editor_special_instruction_delete_button());
    
        return button_container;
    }

    
    function create_ele_editor_special_instruction_submit_button(){
        let ok_btn = create_generic_ele_submit_button();
        ok_btn.innerHTML = 'change';
        ok_btn.type = 'button';
        ok_btn.classList.add('documentPageSpecialInstructions_button');
        ok_btn.addEventListener('click', (e) => {
            update_ele_special_instruction(e.target);
        });
        return ok_btn;
    }
    
    
    function create_ele_editor_special_instruction_delete_button(){
        let del_btn = create_generic_ele_delete_button();
        del_btn.type = 'button';
        del_btn.classList.add('documentPageSpecialInstructions_button');
        del_btn.setAttribute('data-siid', '0');
        del_btn.addEventListener('click', (e) => {
            delete_ele_special_instruction(e.target);
        }); 
        return del_btn;
    }
}


export function add_special_instruction_to_page(){
    const section_div = document.querySelector('.addNewSpecialInstructionModal');
    const input = section_div.querySelector('textarea');
    const new_contents_str = input.value;
    input.value = '';

    const destination_parent = document.querySelector('.existing');
    const new_instruction_ele = create_ele_special_instruction(new_contents_str);
    destination_parent.prepend(new_instruction_ele);

    update_emptiness_of_special_instructions();
    unsavedDocumentChangesWarning().on();
}


function create_ele_special_instruction(display_str){
    const main_div = create_ele_special_instructions_base();
    main_div.append(create_ele_special_instruction_contents(display_str));
    main_div.append(create_ele_special_instruction_edit_btn());
    main_div.append(create_ele_special_instruction_who_and_when_placeholder());

    return main_div;


    function create_ele_special_instructions_base(){
        const main_div = document.createElement('div');
        main_div.classList.add(CSS_SPECIALINSTR_ONE);
        return main_div;
    }


    function create_ele_special_instruction_contents(display_str){
        const contents_div = document.createElement('div');
        contents_div.classList.add(CSS_SPECIALINSTR_CONTENTS);
        contents_div.innerHTML = display_str;
        return contents_div;
    }
    
    
    function create_ele_special_instruction_edit_btn(){
        const edit_btn = create_generic_ele_edit_button();
        edit_btn.classList.add('documentPageSpecialInstructions_specialInstructionEditBtn');
        edit_btn.setAttribute('data-siid', '0');
        edit_btn.addEventListener('click', (e) => {
            open_editor_special_instruction(e.target);
        });
        return edit_btn;
    }
    
    
    function create_ele_special_instruction_who_and_when_placeholder(){
        const info_div = document.createElement('div');
        info_div.classList.add('documentPageSpecialInstructions_specialInstructionWhoAndWhen');
    
        const username_span = document.createElement('span');
        username_span.classList.add('username');
        username_span.innerHTML = 'You';
        info_div.append(username_span);
    
        const text_on = document.createTextNode(' on ');
        info_div.append(text_on);
    
        const when_span = document.createElement('span');
        when_span.classList.add('when');
        when_span.innerHTML = get_date_time();
        info_div.append(when_span);
    
        return info_div;
    }
}


function update_ele_special_instruction(btn){
    const edit_ele = btn.closest(`.${CLASS_SPECIAL_INSTRUCTION_EDITOR}`);
    const input_ele = edit_ele.querySelector('textarea');
    const new_str = input_ele.value;

    const special_inst_ele = btn.closest(`.${CSS_SPECIALINSTR_ONE}`);
    const target_ele = special_inst_ele.querySelector(`.${CSS_SPECIALINSTR_CONTENTS}`);
    target_ele.innerHTML = new_str;

    target_ele.classList.remove(CSS_HIDE);

    closeSpecialInstructionsEditor();
    unsavedDocumentChangesWarning().on();
}


export function delete_ele_special_instruction(btn){
    btn.closest('.' + CSS_SPECIALINSTR_ONE).remove();
    update_emptiness_of_special_instructions();
    unsavedDocumentChangesWarning().on();
}


function update_emptiness_of_special_instructions(){
    let section_div = document.querySelector('.documentPageSpecialInstructions');
    let none_p = section_div.querySelector(`.${CLASS_INSTRUCTIONS_EMPTY_MESSAGE}`);

    let want_none_p = section_div.querySelector('.' + CSS_SPECIALINSTR_ONE) == null;
    let have_none_p = none_p != null;

    if(want_none_p && !have_none_p){
        let existing = document.querySelector('.existing');
        existing.append(create_ele_empty_special_instructions()); 
    }
    else if(!want_none_p && have_none_p){
        none_p.remove();
    }
    return;

    function create_ele_empty_special_instructions(){
        let p = document.createElement('p');
        p.classList.add(CLASS_INSTRUCTIONS_EMPTY_MESSAGE);
        p.innerHTML = "No special instructions on this document";
        return p;
    }
}


// || Document validity
function update_validity_warnings(doc_is_valid, item_validity_list){
    clear_document_validity_warning(doc_is_valid);
    clear_lineitem_validity_warnings(item_validity_list);
    return;


    function clear_document_validity_warning(is_valid){
        const bigWarningEle = document.querySelector('.documentPageWarnings_invalid');
    
        if(is_valid === true && bigWarningEle !== null){
            bigWarningEle.remove();
            document.querySelector('.issueFinalIconTextButton').removeAttribute('disabled');
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
}

