/*
    Functionality for JobComments, which appear on:
        > to-do list (presently populating the home page)
        > job
        > job_comments

    This handles:
        > Edit and delete a comment from any of the three pages
        > Create a comment (from to-do and job_comments)
        > Two types of create/edit form (one with checkboxes, one without)
        > Two ways of displaying a comment (the bigger ones on the job_comments page vs. the streamlined ones on job and to-do list)
        > Toggle the status of pinned and highlight via clicking a button

    Contents:
        || Editor
        || Backend
        || Frontend Response
        || Toggles
*/

const TASK_CREATE_COMMENT = 'create';
const CLASS_SAVE_BTN = 'save';

const CLASS_ADD_BUTTON = 'add-button';
const CLASS_ADD_COMMENT = 'comment';

const DEFAULT_COMMENT_ID = '0';
const CLASS_COMMENT_EDIT_BTN = 'edit-comment';
const CLASS_COMMENT_PINNED_TOGGLE = 'pinned-toggle';
const CLASS_COMMENT_HIGHLIGHTED_TOGGLE = 'highlighted-toggle';

const CLASS_COMMENT_EDITOR = 'job-comment-cu-container';
const ID_COMMENT_TEXTAREA = 'id_comment_contents';
const ID_COMMENT_CHECKBOX_PRIVATE = 'id_private_checkbox';
const ID_COMMENT_CHECKBOX_PINNED = 'id_pinned_checkbox';
const ID_COMMENT_CHECKBOX_HIGHLIGHTED = 'id_highlighted_checkbox';

const CLASS_INDIVIDUAL_COMMENT_ELE = 'one-comment';
const CLASS_COMMENT_MAIN = 'main';
const CLASS_COMMENT_CONTENTS = 'contents';
const CLASS_COMMENT_CONTROLS = 'controls';
const CLASS_COMMENT_FOOTER = 'footer';
const CLASS_COMMENT_OWNERSHIP = 'ownership';

const CLASS_PINNED_BTN_ON = 'pinned-status-on';
const CLASS_PINNED_BTN_OFF = 'pinned-status-off';
const CLASS_PRIVACY_STATUS = 'privacy-status';

const CLASS_ACCESS_DENIED = 'temp-warning-msg';

const CLASS_COMMENT_SECTION = 'comments';
const CLASS_COMMENTS_CONTAINER = 'comment-container';
const CLASS_ALL_COMMENTS_CONTAINER = 'all-comments';
const CLASS_PINNED_COMMENTS_CONTAINER = 'pinned';
const CLASS_HIGHLIGHTED_COMMENTS_CONTAINER = 'highlighted';
const CLASS_PREFIX_FOR_COMMENT_ID = 'id-';

const SECTION_NAMES = ['all-comments', 'pinned', 'highlighted'];

const CLASS_HIGHLIGHTED_CSS = 'highlighted';
const CLASS_EMPTY_SECTION_P = 'empty-section-notice';

const ATTR_LABEL_FORM_TYPE = 'data-form_type'
const VALUE_FORM_TYPE_FULL = 'full';
const VALUE_FORM_TYPE_CONTENT_ONLY = 'content-only';
const CLASS_HOVER_PARENT = 'hover-parent';

const CLASS_JOB_PANEL = 'panel.job';
const ID_PREFIX_JOB_PANEL_ON_TODO_LIST = 'todo_panel_job_';

const CLASS_JOB_IDENTIFIER_PANEL = 'job-identifier-pane';
const CLASS_COMMENT_INPUT_CHECKBOX_CONTAINER = 'checkbox-container';

const CLASS_WANT_STREAMLINED = 'streamlined';
const CLASS_WANT_TOGGLE_H5 = 'toggle-heading';
const CLASS_WANT_EMPTY_P = 'empty-paragraph';
const STR_FALLBACK = '???';

const KEY_COMMENT_OWNERSHIP_STRING = 'footer_str';


// Used to position backend error messages when creating a new comment has failed
const CLASS_CREATE_COMMENT_CONTAINER = 'create-comments-container';



document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll(`.${CLASS_ADD_BUTTON}.${CLASS_ADD_COMMENT}`).forEach(btn => {
        btn.addEventListener('click', (e) => {
            open_jobcomment_editor_for_create(e.target);
        })
    });

    document.querySelectorAll('.' + CLASS_COMMENT_EDIT_BTN).forEach(btn => {
        btn.addEventListener('click', (e) => {
            open_jobcomment_editor_for_update(e.target);
        })
    });

    document.querySelectorAll('.' + CLASS_COMMENT_PINNED_TOGGLE).forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggle_status(e.target, 'pinned');
        });
    });

    document.querySelectorAll('.' + CLASS_COMMENT_HIGHLIGHTED_TOGGLE).forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggle_status(e.target, 'highlighted');
        });
    });

});



// || Editor
function open_jobcomment_editor_for_create(btn){
    close_jobcomment_editor();

    let editor_ele = create_ele_jobcomment_editor(DEFAULT_COMMENT_ID, btn.dataset.form_type !== VALUE_FORM_TYPE_CONTENT_ONLY, TASK_CREATE_COMMENT);
    btn.after(editor_ele);

    update_visibility_add_comment_button(false);
    hide_all_by_class(CLASS_COMMENT_EDIT_BTN);    
}


function open_jobcomment_editor_for_update(btn){
    close_jobcomment_editor();

    let comment_ele = btn.closest('.' + CLASS_INDIVIDUAL_COMMENT_ELE);
    let section_ele = comment_ele.closest('.' + CLASS_COMMENTS_CONTAINER);
    let want_checkboxes = !(section_ele != null && section_ele.classList.contains(CLASS_PINNED_COMMENTS_CONTAINER));

    let editor_ele = create_ele_jobcomment_editor(comment_ele.dataset.comment_id, want_checkboxes);
    editor_ele = populate_ele_jobcomment_editor_with_existing(editor_ele, comment_ele, want_checkboxes);
    comment_ele.prepend(editor_ele);

    update_visibility_comment_content(comment_ele, false);
}


function close_jobcomment_editor(){
    let editor_ele = document.querySelector('.' + CLASS_COMMENT_EDITOR);
    if(editor_ele == null){
        return;
    }

    let comment_ele = editor_ele.closest('.' + CLASS_INDIVIDUAL_COMMENT_ELE);
    editor_ele.remove();
    if(comment_ele != null){
        update_visibility_comment_content(comment_ele, true);
    }

    update_visibility_add_comment_button(true);
    unhide_all_by_class(CLASS_COMMENT_EDIT_BTN);
    return;
}


function create_ele_jobcomment_editor(comment_id, want_checkboxes, task_name = null){
    let settings = get_settings_jobcomment_editor(task_name);
    let form_type_attr = want_checkboxes ? VALUE_FORM_TYPE_FULL : VALUE_FORM_TYPE_CONTENT_ONLY;

    let container = create_ele_jobcomment_editor_base();
    container.append(create_ele_jobcomment_editor_close_button());
    container.append(create_ele_jobcomment_editor_heading(settings.title));
    container.append(create_ele_jobcomment_editor_contents_input());
    if(want_checkboxes) container.append(create_ele_jobcomment_editor_checkbox_container());       
    container.append(create_ele_jobcomment_editor_controls_container(comment_id, form_type_attr, settings.save_funct));        

    return container;
}


function get_settings_jobcomment_editor(task_name){
    if(task_name === TASK_CREATE_COMMENT){
        return {
            title: 'Add Comment',
            save_funct: save_new_job_comment
        }
    }
    return {
        title: 'Edit Comment',
        save_funct: save_updated_job_comment
    }
}


function create_ele_jobcomment_editor_base(){
    let container = document.createElement('div');
    container.classList.add(CLASS_COMMENT_EDITOR);
    container.classList.add(CSS_GENERIC_PANEL);
    container.classList.add(CSS_GENERIC_FORM_LIKE);
    return container;
}


function create_ele_jobcomment_editor_heading(heading_str){
    let h = document.createElement('h4');
    h.innerHTML = heading_str;
    return h; 
}


function create_ele_jobcomment_editor_contents_input(){
    let main_input = document.createElement('textarea');
    main_input.name = 'contents';
    main_input.id = ID_COMMENT_TEXTAREA;
    main_input.cols = 30;
    main_input.rows = 5;
    return main_input;
}


function create_ele_jobcomment_editor_checkbox_container(){
    let container = document.createElement('div');
    container.classList.add(CLASS_COMMENT_INPUT_CHECKBOX_CONTAINER);
    
    container.append(create_ele_jobcomment_editor_checkbox_label('Private', ID_COMMENT_CHECKBOX_PRIVATE));
    container.append(create_ele_checkbox(ID_COMMENT_CHECKBOX_PRIVATE, true));
    container.append(create_ele_jobcomment_editor_checkbox_label('Pin', ID_COMMENT_CHECKBOX_PINNED));
    container.append(create_ele_checkbox(ID_COMMENT_CHECKBOX_PINNED));
    container.append(create_ele_jobcomment_editor_checkbox_label('Highlight', ID_COMMENT_CHECKBOX_HIGHLIGHTED));
    container.append(create_ele_checkbox(ID_COMMENT_CHECKBOX_HIGHLIGHTED))

    return container;
}


function create_ele_jobcomment_editor_checkbox_label(display_str, for_id){
    let label = document.createElement('label');
    label.innerHTML = display_str;
    label.for = for_id;
    return label;
}


function create_ele_jobcomment_editor_controls_container(comment_id, form_type, save_funct){
    let container = document.createElement('div');
    container.classList.add(CLASS_COMMENT_CONTROLS);

    container.append(create_ele_jobcomment_editor_save_button(comment_id, form_type, save_funct));
    if(comment_id != DEFAULT_COMMENT_ID) container.append(create_ele_jobcomment_editor_delete_button());

    return container;
}


function create_ele_jobcomment_editor_save_button(comment_id, form_type, save_funct){
    let save_btn = create_generic_ele_submit_button();
    save_btn.classList.add(CLASS_SAVE_BTN);
    save_btn.setAttribute('data-comment_id', comment_id);
    save_btn.setAttribute(ATTR_LABEL_FORM_TYPE, form_type);

    save_btn.addEventListener('click', (e) => {
        save_funct(e.target);
    });

    return save_btn;
}


function create_ele_jobcomment_editor_close_button(){
    let close_btn = create_generic_ele_cancel_button();

    close_btn.addEventListener('click', () => {
        close_jobcomment_editor();
    });

    return close_btn;
}


function create_ele_jobcomment_editor_delete_button(){
    let delete_btn = create_generic_ele_delete_button();
    delete_btn.addEventListener('click', (e) => {
        delete_job_comment(e.target);
    });
    return delete_btn;

}


function populate_ele_jobcomment_editor_with_existing(editor_ele, comment_ele, want_settings){
    let old_contents = comment_ele.querySelector('.' + CLASS_COMMENT_CONTENTS).innerHTML.trim();
    editor_ele.querySelector('#' + ID_COMMENT_TEXTAREA).value = old_contents;

    if(want_settings){
        let is_private = string_to_boolean(comment_ele.dataset.is_private);
        if(is_private !== null){
            editor_ele.querySelector('#' + ID_COMMENT_CHECKBOX_PRIVATE).checked = is_private;
        }

        let is_pinned = string_to_boolean(comment_ele.dataset.is_pinned);
        if(is_pinned !== null){
            editor_ele.querySelector('#' + ID_COMMENT_CHECKBOX_PINNED).checked = is_pinned;
        }
    
        let is_highlighted = string_to_boolean(comment_ele.dataset.is_highlighted);
        if(is_highlighted !== null){
            editor_ele.querySelector('#' + ID_COMMENT_CHECKBOX_PINNED).checked = is_highlighted;
        }      
    }

    return editor_ele;
}


function update_visibility_comment_content(comment_ele, want_visibility){
    let details_ele = comment_ele.querySelector('details');
    if(details_ele == null) return;

    visibility_element(comment_ele.querySelector('details'), want_visibility);

    if(want_visibility){
        details_ele.removeAttribute('open');
    }
    return;
}


function update_visibility_add_comment_button(want_visibility){
    if(want_visibility){
        unhide_all_by_class(`${CLASS_ADD_BUTTON}.${CLASS_ADD_COMMENT}`);
    }
    else {
        hide_all_by_class(`${CLASS_ADD_BUTTON}.${CLASS_ADD_COMMENT}`);
    }
}



// || Backend
async function save_new_job_comment(btn){
    let data = get_comment_data_from_editor(btn);
    let response_data = await update_backend_comment(btn, data, 'POST');

    if(status_is_good(response_data, 201)){
        data['id'] = response_data['id'];
        data[KEY_COMMENT_OWNERSHIP_STRING] = `You on ${response_data['created_on']}`;
        data['job_id'] = get_job_id_for_comments(btn);
        update_job_page_comments_after_create(data); 
    }
    else {
        update_job_page_comments_after_failed_create(response_data, btn);
    }
}


async function save_updated_job_comment(btn){
    let data = get_comment_data_from_editor(btn);
    let response_data = await update_backend_comment(btn, data, 'PUT', `id=${btn.dataset.comment_id}`);

    if(status_is_good(response_data, 204)){
        data['id'] = btn.dataset.comment_id;
        data[KEY_COMMENT_OWNERSHIP_STRING] = get_ownership_string_from_existing_comment(btn);
        data['job_id'] = get_job_id_for_comments(btn);
        update_job_page_comments_after_update(data);
    }
    else {
        update_job_page_comments_after_failed_update(response_data, btn);
    }
}


async function delete_job_comment(btn){
    let comment_ele = btn.closest('.' + CLASS_INDIVIDUAL_COMMENT_ELE);
    let data = await update_backend_delete_comment(btn, comment_ele.dataset.comment_id);
    if(status_is_good(data, 204)){
        update_job_page_comments_after_delete(comment_ele.dataset.comment_id);
    } else {
        update_job_page_comments_after_failed_update(data, btn);       
    }
}


function get_comment_data_from_editor(btn){
    if(btn.dataset.form_type == VALUE_FORM_TYPE_CONTENT_ONLY){
        return get_comment_data_from_simplified_editor(btn);   
    }
    else {
        return get_comment_data_from_full_editor();
    }    
}


function get_comment_data_from_full_editor(){
    let result = get_default_comment_data();

    let private_checkbox = document.getElementById(ID_COMMENT_CHECKBOX_PRIVATE);
    if(private_checkbox != null){
        result['private'] = private_checkbox.checked;
    }

    let pinned_checkbox = document.getElementById(ID_COMMENT_CHECKBOX_PINNED);
    if(pinned_checkbox != null){
        result['pinned'] = pinned_checkbox.checked;
    }

    let highlighted_checkbox = document.getElementById(ID_COMMENT_CHECKBOX_HIGHLIGHTED);
    if(highlighted_checkbox != null){
        result['highlighted'] = highlighted_checkbox.checked;
    }    

    return result;
}


function get_comment_data_from_simplified_editor(btn){
    // Defaults are only applied as-is when creating new comments.
    // The simplified editor is only used to create comments in one place, the todo list.
    // On the todo list, only pinned comments appear.
    // Therefore, for the simplified editor, "pinned = true" is the more sensible default.
    let result = get_default_comment_data();
    result['pinned'] = true;

    // Overwrite the defaults with existing settings if the user is updating an existing comment
    let comment_ele = btn.closest(`.${CLASS_INDIVIDUAL_COMMENT_ELE}`);
    if(comment_ele != null){
        result['private'] = string_to_boolean(comment_ele.dataset.is_private);
        result['pinned'] = string_to_boolean(comment_ele.dataset.is_pinned);
        result['highlighted'] = string_to_boolean(comment_ele.dataset.is_highlighted);
    }

    return result;
}


function get_default_comment_data(){
    // Set "default statuses" for use on new comments.
    // "private = true" is a safer default than the alternative.
    // "pinned" and "highlighted" are for users to set, they default to false.
    return {
        'contents': document.getElementById(ID_COMMENT_TEXTAREA).value,
        'private': true,
        'pinned': false,
        'highlighted': false
    };
}


async function update_backend_comment(btn, data, method, get_params = null){
    let url = get_jobcomments_url(btn);
    let request_options = get_request_options(method, format_comment_data_for_be(data));

    let get_params_str = '';
    if(get_params !== null){
        get_params_str = `&${get_params}`;
    }

    return await update_backend(`${url}${get_params_str}`, request_options);
}


async function update_backend_delete_comment(btn, comment_id){
    let url = get_jobcomments_url(btn);
    let request_options = get_request_options('DELETE');
    return await update_backend(`${url}&id=${comment_id}`, request_options);
}


function get_jobcomments_url(ele_inside_comment_div){
    // The URL must include the job ID number, which needs to be handled slightly differently on different pages.

    // If the page covers a single job, the single URL is declared as a const in the script tags.
    if(typeof URL_COMMENTS_WITH_JOB !== 'undefined'){
        return URL_COMMENTS_WITH_JOB;
    }
    // That won't work on pages covering multiple jobs, so instead the URL is added as a dataset attribute to the comment section container.
    else {
        let container_div = ele_inside_comment_div.closest(`.${CLASS_COMMENT_SECTION}`);
        return container_div.dataset.url_comments;
    }
}


function format_comment_data_for_be(data){
    return {
        'contents': data['contents'],
        'private': data['private'],
        'pinned': data['pinned'],
        'highlighted': data['highlighted']
    }
}


function get_job_id_for_comments(ele_in_job_panel){
    if(typeof JOB_ID !== 'undefined'){
        return JOB_ID;
    }

    let job_panel = ele_in_job_panel.closest(`.${CLASS_JOB_PANEL}`);
    if(job_panel !== null){
        return job_panel.dataset.job_id;
    }
    
    return -1;
}


function get_ownership_string_from_existing_comment(editor_save_btn){
    let comment_ele = editor_save_btn.closest(`.${CLASS_INDIVIDUAL_COMMENT_ELE}`);
    let ownership_ele = comment_ele.querySelector(`.${CLASS_COMMENT_OWNERSHIP}`);
    return ownership_ele.innerHTML;
}


// || Frontend Response
function update_job_page_comments_after_create(comment_obj){
    close_jobcomment_editor();

    let class_to_find_comment = get_class_to_find_comment(comment_obj['id']);
    add_comment_to_section(class_to_find_comment, CLASS_ALL_COMMENTS_CONTAINER, comment_obj);

    if(comment_obj['pinned']){
        add_comment_to_section(class_to_find_comment, CLASS_PINNED_COMMENTS_CONTAINER, comment_obj);
    }

    if(comment_obj['highlighted']){
        add_comment_to_section(class_to_find_comment, CLASS_HIGHLIGHTED_COMMENTS_CONTAINER, comment_obj);
    }

    remove_all_jobcomment_warnings();
}


function update_job_page_comments_after_update(response){
    close_jobcomment_editor();

    document.querySelectorAll(`.${CLASS_PREFIX_FOR_COMMENT_ID}${response['id']}`).forEach(ele =>{
        update_comment_ele(response, ele);
    });

    update_comment_presence_in_all_filtered_sections(response);
}


function update_job_page_comments_after_delete(comment_id){
    document.querySelectorAll(`.${CLASS_PREFIX_FOR_COMMENT_ID}${comment_id}`).forEach(ele =>{
        let container = ele.closest(`.${CLASS_COMMENTS_CONTAINER}`);
        ele.remove();
        handle_section_emptiness(container);
    });
}


function update_job_page_comments_after_failed_create(response_data, submit_btn){
    let create_comment_container = submit_btn.closest(`.${CLASS_CREATE_COMMENT_CONTAINER}`);
    close_jobcomment_editor();
    remove_all_jobcomment_warnings();
    
    let error_message_ele = create_dismissable_error(response_data);
    add_error_comment_creation_failed(error_message_ele, create_comment_container);
}


function update_job_page_comments_after_failed_update(response_data, btn){
    let comment_ele = btn.closest('.' + CLASS_INDIVIDUAL_COMMENT_ELE)
    close_jobcomment_editor();

    let contents_ele = comment_ele.querySelector('.contents');
    let access_denied_ele = create_dismissable_error(response_data);
    contents_ele.prepend(access_denied_ele);
}


function add_error_comment_creation_failed(error_message_ele, button_container){
    let parent_ele = button_container.parentElement;
    let comments_container = parent_ele.querySelector(`.${CLASS_COMMENTS_CONTAINER}`);
    let button_container_index = get_ele_index(button_container, parent_ele);
    let comments_container_index = get_ele_index(comments_container, parent_ele);

    let open_editor_btn = button_container.querySelector(`.${CLASS_ADD_BUTTON}`);
    if(comments_container_index < button_container_index && comments_container_index != -1){
        open_editor_btn.before(error_message_ele);
        return;
    }
    open_editor_btn.after(error_message_ele);
}


function create_ele_comment(data, want_streamlined_comment){
    let container_ele = create_ele_comment_base(data);
    container_ele.append(create_ele_comment_contents_wrapper(data, want_streamlined_comment));
    add_event_listeners_to_comment_icons(container_ele);

    return container_ele;    
}


function create_ele_comment_base(data){
    let container_ele = document.createElement('article');

    container_ele.classList.add(CLASS_INDIVIDUAL_COMMENT_ELE);
    container_ele.classList.add(`${CLASS_PREFIX_FOR_COMMENT_ID}${data['id']}`);
    if(data['highlighted']){
        container_ele.classList.add(CLASS_HIGHLIGHTED_CSS);
    }

    container_ele.setAttribute('data-comment_id', data['id']);
    container_ele.setAttribute('data-is_private', data['private']);
    container_ele.setAttribute('data-is_pinned', data['pinned']);
    container_ele.setAttribute('data-is_highlighted', data['highlighted']);

    return container_ele;
}


function create_ele_comment_contents_wrapper(data, want_streamlined_comment){
    let my_tag = want_streamlined_comment ? 'details' : 'div';
    let details_like_ele = document.createElement(my_tag);
    details_like_ele.classList.add('wrapper');

    let child_tag = want_streamlined_comment ? 'summary' : 'div';
    details_like_ele.append(create_ele_comment_body(data, child_tag));
    details_like_ele.append(create_ele_comment_footer(data));

    return details_like_ele;
}


function create_ele_comment_body(data, tag){
    let summary_like_ele = document.createElement(tag);
    summary_like_ele.classList.add('comment-body');
    summary_like_ele.append(create_ele_comment_body_contents(data['private'], data['contents']));
    return summary_like_ele;
}


function create_ele_comment_body_contents(is_private, body_str){
    let main_ele = document.createElement('span');
    main_ele.classList.add(CLASS_COMMENT_MAIN);

    if(is_private) main_ele.append(create_ele_comment_privacy_status());
    main_ele.append(create_ele_comment_contents(body_str));

    return main_ele;
}


function create_ele_comment_privacy_status(){
    let result = document.createElement('div');
    result.classList.add(CLASS_PRIVACY_STATUS);
    result.innerHTML = '[PRIVATE]';
    return result;
}


function create_ele_comment_contents(contents){
    let ele = document.createElement('span');
    ele.classList.add(CLASS_COMMENT_CONTENTS);
    ele.innerHTML = contents;
    return ele;
}


function create_ele_comment_footer(data){
    let footer_ele = document.createElement('section');
    footer_ele.classList.add(CLASS_COMMENT_FOOTER);

    footer_ele.append(create_ele_comment_ownership(data));
    footer_ele.append(create_ele_comment_controls(data));

    return footer_ele;
}


function create_ele_comment_ownership(data){
    let result = document.createElement('div');
    result.classList.add(CLASS_COMMENT_OWNERSHIP);
   
    let str = 'Unknown user at unknown time';
    if(KEY_COMMENT_OWNERSHIP_STRING in data){
        str = data[KEY_COMMENT_OWNERSHIP_STRING];
    }
    else if('created_by' in data && 'created_on' in data){
        str = `${data['created_by']} on ${data['created_on']}`; 
    }
    result.innerHTML = str;
    
    return result;
}


function create_ele_comment_controls(data){
    let controls_ele = document.createElement('div');
    controls_ele.classList.add(CLASS_COMMENT_CONTROLS);

    controls_ele.append(create_ele_comment_pinned_button(data['pinned']));
    controls_ele.append(create_ele_comment_highlight_button());
    controls_ele.append(create_ele_comment_edit_button());

    return controls_ele;
}


function create_ele_comment_pinned_button(is_pinned){
    let settings = get_settings_comment_pinned_button(is_pinned);
    return create_ele_comment_icon_button(settings.display_str, settings.css_class);
}


function create_ele_comment_highlight_button(){
    return create_ele_comment_icon_button('+/- highlight', CLASS_COMMENT_HIGHLIGHTED_TOGGLE);
}


function create_ele_comment_edit_button(){
    return create_ele_comment_icon_button('edit', CLASS_COMMENT_EDIT_BTN);
}


function get_settings_comment_pinned_button(is_pinned){
    return {
        display_str: is_pinned ? 'unpin' : 'pin',
        css_class: is_pinned ? CLASS_PINNED_BTN_ON : CLASS_PINNED_BTN_OFF,
        unwanted_css_class: is_pinned ? CLASS_PINNED_BTN_OFF : CLASS_PINNED_BTN_ON
    }
}


function create_ele_comment_icon_button(display_str, css_class){
    let btn = document.createElement('button');
    btn.classList.add(css_class);
    btn.innerHTML = display_str;
    return btn;
}


function add_event_listeners_to_comment_icons(comment_div){
    add_event_listener_if_element_exists(comment_div.querySelector('.' + CLASS_COMMENT_EDIT_BTN), (e) => {
        open_jobcomment_editor_for_update(e.target);
    });

    add_event_listener_if_element_exists(comment_div.querySelector('.' + CLASS_COMMENT_PINNED_TOGGLE), (e) => {
        toggle_status(e.target, 'pinned');
   });

    add_event_listener_if_element_exists(comment_div.querySelector('.' + CLASS_COMMENT_HIGHLIGHTED_TOGGLE), (e) => {
         toggle_status(e.target, 'highlighted');
    });

}


function update_comment_presence_in_all_filtered_sections(response){
    for(let i = 0; i < SECTION_NAMES.length; i++){
        if(SECTION_NAMES[i] != CLASS_ALL_COMMENTS_CONTAINER){
            update_comment_presence_in_one_filtered_section(response, SECTION_NAMES[i]);
        }
    }
    return;
}


function update_comment_presence_in_one_filtered_section(response, section_class){
    // The assumption is that all filtered sections will have a single name that's used for both a CSS class and a key in the response dict to a boolean value.
    let class_to_find_comment = `${CLASS_PREFIX_FOR_COMMENT_ID}${response['id']}`;
    if(!response[section_class]){
        remove_comment_from_section(class_to_find_comment, section_class);
    }
    else if(response[section_class]){
        add_comment_to_section(class_to_find_comment, section_class, response);
    }
    return;
}


function update_comment_ele(response, comment_ele){
    let contents_ele = comment_ele.querySelector('.' + CLASS_COMMENT_CONTENTS);
    contents_ele.innerHTML = response['contents'];

    update_ele_comment_pinned_status(comment_ele, response['pinned']);
    update_ele_comment_highlighted_status(comment_ele, response['highlighted']);
    update_ele_comment_private_status(comment_ele, response['private']);
}


function get_class_to_find_comment(comment_id){
    return `${CLASS_PREFIX_FOR_COMMENT_ID}${comment_id}`;
}


function remove_all_jobcomment_warnings(){
    document.querySelectorAll('.' + CLASS_ACCESS_DENIED).forEach(ele => {
        ele.remove();
    });
}


function visibility_element(element, want_visibility){
    if(element == null) return;

    let have_visibility = !element.classList.contains('hide');
    if(want_visibility && !have_visibility){
        element.classList.remove('hide');
    }
    else if(!want_visibility && have_visibility){
        element.classList.add('hide');
    }
    return;
}


// || Toggles
async function toggle_status(btn, toggled_attribute){
    let comment_ele = btn.closest('.' + CLASS_INDIVIDUAL_COMMENT_ELE);
    var previous = get_comment_status_boolean(btn, toggled_attribute);
    let url = get_jobcomments_url(btn);
    let response_data = await update_backend_for_comment_toggle(url, comment_ele.dataset.comment_id, !previous, toggled_attribute);
    if(status_is_good(response_data, 204)){
        update_frontend_for_comment_toggle(comment_ele, !previous, toggled_attribute);
    }
    else{
        alert(get_error_message(response_data));
    }
}


function get_comment_status_boolean(btn, toggled_attribute){
    let comment_ele = btn.closest('.' + CLASS_INDIVIDUAL_COMMENT_ELE);
    if(comment_ele === null){
        return;
    }

    if('pinned' === toggled_attribute){
        var previous_attr = comment_ele.dataset.is_pinned;
    }
    else if('highlighted' === toggled_attribute){
        var previous_attr = comment_ele.dataset.is_highlighted;
    }
    else {
        return;
    }

    return string_to_boolean(previous_attr);
}


async function update_backend_for_comment_toggle(url, comment_id, new_status, toggled_attribute){
    let body_obj = {}
    body_obj[toggled_attribute] = new_status;
    
    let request_options = get_request_options('PUT', body_obj);
    return await update_backend(`${url}&id=${comment_id}`, request_options);
}


function update_frontend_for_comment_toggle(comment_ele, new_status, toggled_attribute){
    let class_to_find_comment = get_class_to_find_comment(comment_ele.dataset.comment_id);

    document.querySelectorAll(`.${class_to_find_comment}`).forEach(comment_ele => {
        if('pinned' == toggled_attribute){
            update_ele_comment_pinned_status(comment_ele, new_status);
        }
        else if('highlighted' == toggled_attribute){
            update_ele_comment_highlighted_status(comment_ele, new_status);
        }
    });

    if(new_status){
        add_comment_to_section(class_to_find_comment, toggled_attribute);
    }
    else{
        remove_comment_from_section(class_to_find_comment, toggled_attribute);
    }
}


function update_ele_comment_pinned_status(comment_ele, is_pinned){
    comment_ele.setAttribute('data-is_pinned', is_pinned);

    let pinned_btn = comment_ele.querySelector('.' + CLASS_COMMENT_PINNED_TOGGLE);
    update_comment_pinned_button(pinned_btn, is_pinned);

    return;
}

function update_ele_comment_highlighted_status(comment_ele, is_highlighted){
    comment_ele.setAttribute('data-is_highlighted', is_highlighted);

    let have_highlighted = comment_ele.classList.contains(CLASS_HIGHLIGHTED_CSS);
    if(is_highlighted && !have_highlighted){
        comment_ele.classList.add(CLASS_HIGHLIGHTED_CSS);
    }
    else if(!is_highlighted && have_highlighted){
        comment_ele.classList.remove(CLASS_HIGHLIGHTED_CSS);
    }

    return;
}

function update_ele_comment_private_status(comment_ele, is_private){
    comment_ele.setAttribute('data-is_private', is_private);
    let have_private_class = comment_ele.classList.contains('private');
    
    if(have_private_class && !is_private){
        comment_ele.classList.remove('private');
    }
    else if(!have_private_class && is_private){
        comment_ele.classList.add('private');
    }

    let privacy_ele = comment_ele.querySelector('.' + CLASS_PRIVACY_STATUS);
    let have_privacy_ele = privacy_ele !== null;

    if(have_privacy_ele && !is_private){
        privacy_ele.remove();
    }
    else if(!have_privacy_ele && is_private){
        let container_ele = comment_ele.querySelector(`.${CLASS_COMMENT_MAIN}`);
        container_ele.prepend(create_ele_comment_privacy_status());
    }
    return;
}


function OLD_update_comment_pinned_button(pinned_btn, want_on){
    let is_on = pinned_btn.classList.contains(CLASS_PINNED_BTN_ON);
    if(is_on && !want_on){
        pinned_btn.classList.remove(CLASS_PINNED_BTN_ON);
        pinned_btn.classList.add(CLASS_PINNED_BTN_OFF);
        pinned_btn.innerHTML = 'pin';
    }
    else if(!is_on && want_on){
        pinned_btn.classList.add(CLASS_PINNED_BTN_ON);
        pinned_btn.classList.remove(CLASS_PINNED_BTN_OFF);
        pinned_btn.innerHTML = 'unpin';
    }
    return;
}


function update_comment_pinned_button(pinned_btn, is_pinned_now){
    let was_pinned_before = pinned_btn.classList.contains(CLASS_PINNED_BTN_ON);
    if(was_pinned_before === is_pinned_now){
        return;
    }

    let settings = get_settings_comment_pinned_button(is_pinned_now);
    pinned_btn.classList.add(settings.css_class);
    pinned_btn.classList.remove(settings.unwanted_css_class);
    pinned_btn.innerHTML = settings.display_str;
}


function add_comment_to_section(class_to_find_comment, section_name, comment_data = null){
    let all_section_instances = document.querySelectorAll(`.${CLASS_COMMENTS_CONTAINER}.${section_name}`);
    if(all_section_instances.length == 0){
        return;
    }

    comment_data = handle_missing_comment_data(comment_data, class_to_find_comment);
    if(comment_data === null){
        return;
    }

    let section_ele = find_comment_section_ele(all_section_instances, comment_data['job_id'], section_name);
    if(section_ele === null){
        return;
    }

    let existing_comment_in_section = section_ele.querySelector(`.${class_to_find_comment}`);
    if(existing_comment_in_section !== null){
        return;
    }

    let want_streamline_comment = section_ele.classList.contains(CLASS_WANT_STREAMLINED);
    var comment_ele = create_ele_comment(comment_data, want_streamline_comment);
    section_ele.prepend(comment_ele);
    handle_section_emptiness(section_ele, section_name);
}


function remove_comment_from_section(class_to_find_comment, section_name){
    document.querySelectorAll(`.${CLASS_COMMENTS_CONTAINER}.${section_name}`).forEach(section_ele => {
        let comment_in_section = section_ele.querySelector(`.${class_to_find_comment}`);
        if(comment_in_section !== null){
            comment_in_section.remove();
            handle_section_emptiness(section_ele, section_name);
        }
    });
}


function handle_missing_comment_data(data, class_to_find_comment){
    if(data !== null){
        return data;
    }

    let existing_comment = document.querySelector(`.${class_to_find_comment}`);
    if(existing_comment !== null){
        return get_comment_data_from_comment_ele(existing_comment);
    }

    return null;
}


function get_comment_data_from_comment_ele(ele){
    let result = {};
    result['id'] = ele.dataset.comment_id;
    result['footer_str'] = ele.querySelector(`.${CLASS_COMMENT_OWNERSHIP}`).innerHTML.trim();
    result['contents'] = ele.querySelector(`.${CLASS_COMMENT_CONTENTS}`).innerHTML.trim();
    result['private'] = ele.dataset.is_private.toLowerCase() == 'true';
    result['pinned'] = ele.dataset.is_pinned.toLowerCase() == 'true';
    result['highlighted'] = ele.dataset.is_highlighted.toLowerCase() == 'true';
    result['job_id'] = get_job_id_for_comments(ele);
    return result;
}


function find_comment_section_ele(all_section_instances, job_id, section_name){
    if(all_section_instances.length === 1){
        return all_section_instances[0];
    }
    
    if(typeof job_id !== 'number' && typeof job_id !== 'string'){
        return null;
    }
    
    if(typeof job_id === 'string'){
        job_id = parseInt(job_id);
    }

    if(job_id > 0){
        let id_to_find_job_panel = `${ID_PREFIX_JOB_PANEL_ON_TODO_LIST}${comment_data['job_id']}`;
        let job_panel = document.getElementById(id_to_find_job_panel);
        if(job_panel !== null){
            return job_panel.querySelector(`.${CLASS_COMMENTS_CONTAINER}.${section_name}`);
        }
    }

    return null;
}


function handle_section_emptiness(comment_section_ele, section_name=STR_FALLBACK){
    let is_empty = comment_section_ele.querySelectorAll(`.${CLASS_INDIVIDUAL_COMMENT_ELE}`).length === 0;
    let settings = get_settings_comment_section_emptiness(comment_section_ele, is_empty);

    if(settings.want_add && settings.existing === null){
        add_new_comment_emptiness_element(comment_section_ele, section_name, settings.class_indicating_task);
    }
    else if(settings.want_remove && settings.existing !== null){
        settings.existing.remove();
    }

    return;
}


function get_settings_comment_section_emptiness(comment_section_ele, section_is_empty){
    // Settings for added/removed comment sections
    if(comment_section_ele.classList.contains(CLASS_WANT_TOGGLE_H5)){
        return {
            existing: comment_section_ele.parentElement.querySelector('h5'),
            want_add: !section_is_empty,
            want_remove: section_is_empty,
            class_indicating_task: CLASS_WANT_TOGGLE_H5
        }
    }
    // Settings for persistent comment sections which display an emptiness note
    else if(comment_section_ele.classList.contains(CLASS_WANT_EMPTY_P)){
        return {
            existing: comment_section_ele.querySelector(`.${CLASS_EMPTY_SECTION_P}`),
            want_add: section_is_empty,
            want_remove: !section_is_empty,
            class_indicating_task: CLASS_WANT_EMPTY_P
        }
    }
    return null;
}


function add_new_comment_emptiness_element(comment_section_ele, section_name, class_indicating_task){
    // Some "paths" to this function don't need to work out section_name for their own purposes, so the argument will be missing.
    // Try to work out the section name here. If you can't, no big deal: the two functions later are designed to handle STR_FALLBACK.
    if(section_name === STR_FALLBACK){
        let attempted_section_name = extract_comment_section_name_from_list(comment_section_ele);
        if(attempted_section_name !== null){
            section_name = attempted_section_name;
        }
    }

    if(class_indicating_task === CLASS_WANT_TOGGLE_H5){
        var ele = create_ele_h5_comment(section_name);
        comment_section_ele.before(ele);
    }
    else if(class_indicating_task === CLASS_WANT_EMPTY_P){
        var ele = create_ele_p_empty_comment_section(section_name);
        comment_section_ele.prepend(ele);
    }

    return;      
}

function create_ele_h5_comment(section_name){        
    let h5 = document.createElement('h5');

    let span = document.createElement('span');
    span.classList.add('hide');

    if(section_name === STR_FALLBACK){
        span.innerHTML = 'Comments';
    }
    else{
        span.innerHTML = section_name;
    }

    h5.append(span);

    return h5;
}

function create_ele_p_empty_comment_section(section_name){
    let p = document.createElement('p');
    p.classList.add(CLASS_EMPTY_SECTION_P);

    if(section_name == CLASS_HIGHLIGHTED_COMMENTS_CONTAINER || section_name == CLASS_PINNED_COMMENTS_CONTAINER){
        p.innerHTML = `No comments have been ${section_name}.`;
    }
    else {
        p.innerHTML = 'No comments yet.';
    }
    return p;
}


function extract_comment_section_name_from_list(ele){
    for(let s = 0; s < SECTION_NAMES.length; s++){
        if(ele.classList.contains(SECTION_NAMES[s])){
            return SECTION_NAMES[s];
        }
    }
    return null;
}


