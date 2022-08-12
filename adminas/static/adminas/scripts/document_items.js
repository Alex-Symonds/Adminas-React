/*
    Document Builder page's item assignment functionality.
    (Main document functions and special instructions are in a separate file.)

    Covers:
        > The split button/s
        > The incl. and excl. buttons

    Contents:
        || Toggle docitems between included/excluded
        || Split docitems
        || Invalid DocItems
*/


const ID_INCLUDES_UL = 'included';
const ID_EXCLUDES_UL = 'excluded';
const CLASS_SPLIT_PREVIEW_INCLUDES = 'included';
const CLASS_SPLIT_PREVIEW_EXCLUDES = 'excluded';

const CLASS_NONE_LI = 'none';
const CLASS_SPLIT_BTN = 'split-docitem-btn';
const CLASS_TOGGLE_BTN = 'toggle-docitem-btn';
const CLASS_DISPLAY_SPAN = 'display';

const CLASS_SPLIT_WINDOW = 'split-docitem-window';
const CLASS_SPLIT_DIRECTION_SETTER = 'split-direction-setter';
const CLASS_SPLIT_DIRECTION_STRIP = 'split-direction-strip';
const CLASS_SPLIT_STATUS_CONTAINER = 'docitem-split-status-container';
const ID_SPLIT_WINDOW_INCLUDES_ARROWS = 'id_split_includes_arrows';
const ID_SPLIT_WINDOW_EXCLUDES_ARROWS = 'id_split_excludes_arrows';
const ID_SPLIT_WINDOW_DIRECTION = 'id_split_controls';

const STR_INCLUDES_BTN = '&laquo; incl.';
const STR_EXCLUDES_BTN = 'excl. &raquo;';
const STR_SPLIT_BTN = '&laquo; split &raquo;';

const CSS_CLASS_INVALID_LI = 'invalid';
const CSS_CLASS_INVALID_ICON = 'invalid-icon';



document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.' + CLASS_TOGGLE_BTN).forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggle_doc_item(e);
        })
    });

    document.querySelectorAll('.' + CLASS_SPLIT_BTN).forEach(btn => {
        btn.addEventListener('click', (e) => {
            split_doc_item(e);
        })
    });

});



// || Toggle docitems between included/excluded
function toggle_doc_item(e){
    const docitem_ele = e.target.closest('li');
    const src_ul = docitem_ele.parentElement;
    const dst_ul = get_dest_docitem_ul(src_ul);
    if(dst_ul == null){
        return;
    }
    update_both_docitem_ul_for_toggle(dst_ul, src_ul, docitem_ele);
    show_save_warning_ele();
    return;
}


function update_both_docitem_ul_for_toggle(dst_ul, src_ul, docitem_ele){

    if(docitem_is_invalid(docitem_ele)){
        if(!fix_invalid_docitem_ele(docitem_ele)){
            docitem_ele.remove();
            update_none_li(src_ul, dst_ul);
            return;
        }        
    }

    move_docitem_li(dst_ul, docitem_ele);
    update_none_li(src_ul, dst_ul);
}


function get_dest_docitem_ul(src_ul){   
    if(src_ul.id === ID_INCLUDES_UL){
        var dst_ul = document.querySelector('#' + ID_EXCLUDES_UL);
        
    } else if (src_ul.id === ID_EXCLUDES_UL){
        var dst_ul = document.querySelector('#' + ID_INCLUDES_UL);

    } else {
        return null;
    }
    return dst_ul;
}


function move_docitem_li(dst_ul, src_li){
    // If there's already a li for this item in the destination ul (following a split), 
    // the "move" will consist of updating the quantity displayed in the destination li 
    // and deleting the source li.
    const dst_li = get_ele_li_with_same_jiid(dst_ul, src_li.dataset.jiid);
    if(dst_li != null){
        merge_into_dst_docitem_li(src_li, dst_li);
    }
    else {
        let toggle_btn_str = get_toggle_button_display_str(dst_ul);
        src_li.querySelector('.' + CLASS_TOGGLE_BTN).innerHTML = toggle_btn_str;
        dst_ul.append(src_li);
    }
    return;
}


function get_toggle_button_display_str(dst_ul){
    let display_str = 'toggle';

    if(dst_ul.id === ID_EXCLUDES_UL){
        display_str = STR_INCLUDES_BTN;
    }
    else if(dst_ul.id === ID_INCLUDES_UL){
        display_str = STR_EXCLUDES_BTN;
    }

    return display_str;
}


function update_none_li(src_ul, dst_ul){
    // An otherwise empty ul should show one li for "None".
    remove_none_li(dst_ul);
    if(!ul_contains_li(src_ul)){
        src_ul.append(create_ele_none_li());
    }
}


function remove_none_li(ul_ele){
    const none_li = ul_ele.querySelector('.' + CLASS_NONE_LI);
    if(none_li != null){
        none_li.remove();
    }  
}


function ul_contains_li(ul_ele){
    for(i = 0; i < ul_ele.children.length; i++){
        if(ul_ele.children[i].nodeName == 'LI'){
            return true;
        }
    }
    return false;
}


function create_ele_none_li(){
    const li = document.createElement('li');
    li.classList.add(CLASS_NONE_LI);
    li.append(document.createTextNode('None'));
    return li;
}


function get_ele_li_with_same_jiid(target_ul, jiid){
    for(i = 0; i < target_ul.children.length; i++){
        if(target_ul.children[i].dataset.jiid){
            if(jiid == target_ul.children[i].dataset.jiid){
                return target_ul.children[i];
            }
        }
    }
    return null;
}


function merge_into_dst_docitem_li(src_li, dst_li){
    const dst_span = dst_li.querySelector('.' + CLASS_DISPLAY_SPAN);
    const src_span = src_li.querySelector('.' + CLASS_DISPLAY_SPAN);
    dst_span.innerHTML = get_combined_docitem_text(src_span.innerHTML, dst_span.innerHTML);
    src_li.remove();
    return;
}


function get_combined_docitem_text(src_text, dst_text){
    let qty_src = parseInt(src_text.match(QTY_RE)[0]);
    let qty_dst = parseInt(dst_text.match(QTY_RE)[0]);
    let qty_sum = qty_src + qty_dst;
    return dst_text.replace(QTY_RE, qty_sum);
}




// || Split docitems
function split_doc_item(e){
    open_docitem_split_window(e.target);
}


function open_docitem_split_window(split_btn){
    close_docitem_split_window();

    const li_ele = split_btn.closest('li');
    const calling_ul_id = li_ele.parentElement.id;
    li_ele.append(create_ele_docitem_split_window(li_ele, calling_ul_id));
    hide_all_by_class(CLASS_SPLIT_BTN);
    hide_all_by_class(CLASS_TOGGLE_BTN);
}


function close_docitem_split_window(){
    let existing_window = document.querySelector('.' + CLASS_SPLIT_WINDOW);
    if(existing_window){
        existing_window.remove();
    }
    unhide_all_by_class(CLASS_SPLIT_BTN);
    unhide_all_by_class(CLASS_TOGGLE_BTN);
}


function create_ele_docitem_split_window(docitem_ele, calling_ul_id){
    let jobitem_id = docitem_ele.dataset.jiid;

    let div = document.createElement('div');
    div.classList.add(CLASS_SPLIT_WINDOW);
    div.classList.add(CSS_GENERIC_FORM_LIKE);
    div.classList.add(CSS_GENERIC_PANEL);

    div.append(create_ele_docitem_split_window_heading());
    if(split_window_needs_invalid_warning(jobitem_id)){
        div.append(create_ele_docitem_invalid_split_warning());
    }
    div.append(create_ele_docitem_desc(jobitem_id));
    div.append(create_ele_docitem_split_window_controls(jobitem_id, calling_ul_id, docitem_ele));
    div.append(create_ele_docitem_split_window_status_container(jobitem_id));
    div.append(create_ele_docitem_split_window_submit_btn());
    
    return div;
}


function create_ele_docitem_split_window_heading(){
    let ele = document.createElement('div');
    ele.classList.add(CSS_GENERIC_PANEL_HEADING);
    let heading = document.createElement('h5');
    heading.innerHTML = 'Edit Split';
    ele.append(create_ele_docitem_split_window_cancel_btn());
    ele.append(heading);
    return ele;
}


function create_ele_docitem_desc(jobitem_id){
    let desc = document.createElement('p');
    desc.innerHTML = 'Splitting ' + get_combined_docitem_text_from_jobitem_id(jobitem_id);
    return desc;
}


function get_combined_docitem_text_from_jobitem_id(jobitem_id){
    let inc_text = get_individual_docitem_text_from_jobitem_id(ID_INCLUDES_UL, jobitem_id);
    let exc_text = get_individual_docitem_text_from_jobitem_id(ID_EXCLUDES_UL, jobitem_id);

    if(inc_text == ''){
        return exc_text;
    } else if(exc_text == ''){
        return inc_text;
    } else {
        return get_combined_docitem_text(inc_text, exc_text);
    }
}


function get_individual_docitem_text_from_jobitem_id(ul_id, jobitem_id){
    let ul = document.querySelector('#' + ul_id);
    let li = get_ele_li_with_same_jiid(ul, jobitem_id);

    if(li != null){
        return get_valid_description(li);
    } else {
        return '';
    } 
}


function split_window_needs_invalid_warning(jobitem_id){
    const includes_ul = document.querySelector('#' + ID_INCLUDES_UL);
    const docitem_ele = get_ele_li_with_same_jiid(includes_ul, jobitem_id);
    return docitem_is_invalid(docitem_ele);
}


function create_ele_docitem_invalid_split_warning(){
    let result = document.createElement('div');
    result.classList.add('invalid');

    let icon_ele = document.querySelector(`.${CSS_CLASS_INVALID_ICON}`).cloneNode(true);
    result.append(icon_ele);

    let text = document.createTextNode('Invalid quantity detected and corrected');
    result.append(text);

    return result;
}


function create_ele_docitem_split_window_controls(jobitem_id, calling_ul_id, docitem_ele){
    const div = document.createElement('div');
    div.classList.add(CLASS_SPLIT_DIRECTION_SETTER);
    div.append(create_ele_docitem_split_window_direction(calling_ul_id));

    if(docitem_is_invalid(docitem_ele)){
        var default_qty = docitem_ele.dataset.max_available;
    } else {
        var default_qty = get_docitem_qty(calling_ul_id, jobitem_id);
    }
    const input_fld = create_ele_docitem_edit_field(default_qty);
    div.append(input_fld);

    return div;
}


function create_ele_docitem_split_window_direction(called_from){
    const direction_div = document.createElement('div');
    direction_div.classList.add(CLASS_SPLIT_DIRECTION_STRIP);

    const includes_div = document.createElement('div');
    const excludes_div = document.createElement('div');

    includes_div.id = ID_SPLIT_WINDOW_INCLUDES_ARROWS;
    excludes_div.id = ID_SPLIT_WINDOW_EXCLUDES_ARROWS;

    if(called_from === ID_INCLUDES_UL){
        includes_div.innerHTML = '&laquo;&laquo;&laquo;';
        excludes_div.innerHTML = '';
        var middle_display_str = CLASS_SPLIT_PREVIEW_INCLUDES;
    }
    else if(called_from === ID_EXCLUDES_UL){
        includes_div.innerHTML = '';
        excludes_div.innerHTML = '&raquo;&raquo;&raquo;';
        var middle_display_str = CLASS_SPLIT_PREVIEW_EXCLUDES;
    }

    direction_div.append(includes_div);

    const middle_div = document.createElement('div');
    middle_div.id = ID_SPLIT_WINDOW_DIRECTION;
    middle_div.innerHTML = middle_display_str;
    middle_div.addEventListener('click', (e) => {
        toggle_docitem_split_window_direction(e);
    });
    direction_div.append(middle_div);

    direction_div.append(excludes_div);
    return direction_div;
}


function create_ele_docitem_edit_field(default_qty){
    // JobItem quantity fields are usually used in cases where min=1 makes sense.
    // Here, 0 makes sense too, so adjust the min.
    let fld = get_jobitem_qty_field();
    fld.min = 0;
    fld.value = default_qty;

    fld.addEventListener('change', (e) => {
        update_split_window(e.target);
    });

    fld.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            update_split_window(e.target);
            process_split_request(e.target);
        }
    });

    return fld;
}


function create_ele_docitem_split_window_status_container(jobitem_id){
    let container = document.createElement('div');
    container.classList.add(CLASS_SPLIT_STATUS_CONTAINER);
    container.append(create_ele_docitem_split_window_category_div(CLASS_SPLIT_PREVIEW_INCLUDES, jobitem_id));
    container.append(create_ele_docitem_split_window_category_div(CLASS_SPLIT_PREVIEW_EXCLUDES, jobitem_id));
    return container;
}


function create_ele_docitem_split_window_category_div(class_name, jobitem_id){
    const div = document.createElement('div');
    div.classList.add(class_name);
    div.classList.add('container');

    const heading = document.createElement('h5');
    heading.innerHTML = class_name[0].toUpperCase() + class_name.substring(1);
    div.append(heading);

    let default_qty = get_docitem_qty(class_name, jobitem_id);
    let result_span = document.createElement('span');
    result_span.innerHTML = default_qty;
    div.append(result_span);

    return div;
}


function create_ele_docitem_split_window_submit_btn(){
    let btn = create_generic_ele_submit_button();
    btn.classList.add('full-width-button');
    btn.innerHTML = 'split';
    btn.addEventListener('click', (e) => {
        process_split_request(e.target);
    });
    return btn;
}


function create_ele_docitem_split_window_cancel_btn(){
    let btn = create_generic_ele_cancel_button();
    btn.addEventListener('click', () => {
        close_docitem_split_window();
    });
    return btn;
}


function toggle_docitem_split_window_direction(e){
    let original_id = e.target.innerHTML;
    let includes_div = document.querySelector('#' + ID_SPLIT_WINDOW_INCLUDES_ARROWS);
    let excludes_div = document.querySelector('#' + ID_SPLIT_WINDOW_EXCLUDES_ARROWS);
    let direction_div = document.querySelector('#' + ID_SPLIT_WINDOW_DIRECTION);

    if(original_id === ID_INCLUDES_UL){
        includes_div.innerHTML = '';
        excludes_div.innerHTML = '&raquo;&raquo;&raquo;';
        direction_div.innerHTML = ID_EXCLUDES_UL;

    } else if (original_id === ID_EXCLUDES_UL){
        includes_div.innerHTML = '&laquo;&laquo;&laquo;';
        excludes_div.innerHTML = '';
        direction_div.innerHTML = ID_INCLUDES_UL;
    }
}


function update_split_window(input_fld){
    let controls_state = get_docitem_split_controls_state();

    let selected_class = controls_state;
    let other_class = toggle_docitem_membership_id(controls_state);

    let selected_ele = get_docitem_split_window_result_ele(selected_class);
    let other_ele = get_docitem_split_window_result_ele(other_class);
    let selected_qty = parseInt(input_fld.value);
    let total_qty = get_total_qty(input_fld.closest('li').dataset.jiid);
    set_docitem_split_window(selected_ele, other_ele, total_qty, selected_qty);
}


function toggle_docitem_membership_id(in_id){
    if(in_id == CLASS_SPLIT_PREVIEW_INCLUDES){
        return CLASS_SPLIT_PREVIEW_EXCLUDES;
    }
    return CLASS_SPLIT_PREVIEW_INCLUDES;
}


function get_docitem_split_controls_state(){
    let split_controls_ele = document.querySelector('#' + ID_SPLIT_WINDOW_DIRECTION);
    let display_text = split_controls_ele.innerHTML.toLowerCase();

    if(display_text.includes(CLASS_SPLIT_PREVIEW_EXCLUDES)){
        return CLASS_SPLIT_PREVIEW_EXCLUDES;
    }
    else if(display_text.includes(CLASS_SPLIT_PREVIEW_INCLUDES)){
        return CLASS_SPLIT_PREVIEW_INCLUDES;
    }
    return
}


function set_docitem_split_window(selected_ele, other_ele, total_qty, selected_qty){
    if(selected_qty <= 0){
        selected_ele.innerHTML = 0;
        other_ele.innerHTML = total_qty;
    }
    else if(selected_qty <= total_qty){
        selected_ele.innerHTML = selected_qty;
        other_ele.innerHTML = total_qty - selected_qty;
    }
    else if(selected_qty > total_qty){
        selected_ele.innerHTML = total_qty;
        other_ele.innerHTML = 0;        
    }
}


function get_total_qty(jiid){
    let result = 0;

    let includes_qty = get_docitem_qty(ID_INCLUDES_UL, jiid);
    result += includes_qty;

    let excludes_qty = get_docitem_qty(ID_EXCLUDES_UL, jiid);
    result += excludes_qty;

    return result;
}


function get_docitem_qty(class_name, jiid){
    const ul = document.querySelector('#' + class_name);
    const docitem_ele = get_ele_li_with_same_jiid(ul, jiid);

    if(docitem_is_invalid(docitem_ele)){
        let max_available = parseInt(docitem_ele.dataset.max_available);
        return max_available < 0 ? 0 : max_available;
    }

    return get_docitem_qty_from_li(docitem_ele);
}


function get_docitem_qty_from_li(docitem_ele){
    if(docitem_ele != null){
        return parseInt(docitem_ele.querySelector('.' + CLASS_DISPLAY_SPAN).innerHTML.match(QTY_RE)[0])
    }
    return 0;
}


function process_split_request(calling_ele){
    update_split_window(document.querySelector('#id_qty'));

    const docitem_li = calling_ele.closest('li');
    const jobitem_id = docitem_li.dataset.jiid;

    let window_result_span = get_docitem_split_window_result_ele(CLASS_SPLIT_PREVIEW_INCLUDES);
    const incl_value = parseInt(window_result_span.innerHTML);

    window_result_span = get_docitem_split_window_result_ele(CLASS_SPLIT_PREVIEW_EXCLUDES);
    const excl_value = parseInt(window_result_span.innerHTML);

    /*  
    If either value is 0, the goal is one <li> located in the non-0 <ul> and 
    the display text will show whatever the total quantity is for that JobItem ID.
    */
    if(incl_value === 0){
        process_docitem_split_N_and_0(ID_INCLUDES_UL, jobitem_id);
    }
    else if(excl_value === 0){
        process_docitem_split_N_and_0(ID_EXCLUDES_UL, jobitem_id);
    }

    /*
    If neither value is 0, the goal is one <li> in each of the two <ul>s, with 
    the description in each modified in accordance with the user's input.
    */
    else{
        process_docitem_split_N_and_N(incl_value, excl_value, jobitem_id);
    }

    // The items just changed, so show the "unsaved changes" warning; then close this panel.
    show_save_warning_ele();
    close_docitem_split_window();
}


function process_docitem_split_N_and_0(ul_id_with_0, jobitem_id){
    // Use cases:
    //  1)  ul-to-be-0 has an unwanted <li> in it, which must be moved/merged to the other <ul>
    //  2)  The "calling" docitem is invalid. The user is splitting off N valid items to keep, then disposing of the rest
    //  3)  User decided not to make any changes, but clicked "submit" with the same quantities rather than closing the window

    var src_ul = document.querySelector('#' + ul_id_with_0);
    const li_to_move = get_ele_li_with_same_jiid(src_ul, jobitem_id);

    // Case #1: Moving/merging a <li> from one <ul> to the other is the job of the toggle function
    // (note: the toggle function has its own handling for invalid docitems, so don't need to worry about that here)
    if(li_to_move != null){
        var dst_ul = get_dest_docitem_ul(src_ul);
        update_both_docitem_ul_for_toggle(dst_ul, src_ul, li_to_move);
        return;
    }

    // Determine if Case #2 applies by grabbing the <li> in "includes" (if it exists), since that's the potentially "invalid" one
    var includes_ul = document.querySelector(`#${ID_INCLUDES_UL}`);
    var includes_li = get_ele_li_with_same_jiid(includes_ul, jobitem_id);

    // Case #2: The splitter enforces valid quantities, so if one <ul> is to contain 0, the other must contain max_available
    // Therefore "splitting off N valid items to keep" = fixing an invalid docitem
    // "Disposing of the rest" is what happens naturally, unless you make an effort to stop it, so we just... won't
    if(docitem_is_invalid(includes_li)){
        fix_invalid_docitem_ele(includes_li);
        return;
    }

    // Case #3: no toggling or fixing is required, so do nothing.
    return;
}


function process_docitem_split_N_and_N(incl_value, excl_value, jobitem_id){
    const description = get_combined_docitem_text_from_jobitem_id(jobitem_id);
    process_docitem_split_set_ul(ID_INCLUDES_UL, incl_value, jobitem_id, description);
    process_docitem_split_set_ul(ID_EXCLUDES_UL, excl_value, jobitem_id, description);
}


function process_docitem_split_set_ul(ul_id, new_quantity, jobitem_id, description){
    const target_ul = document.querySelector('#' + ul_id);
    const target_li = get_ele_li_with_same_jiid(target_ul, jobitem_id);

    const have_li = target_li != null;
    let new_display_string = description.replace(QTY_RE, new_quantity);

    if(have_li){
        let display_span = target_li.querySelector('.' + CLASS_DISPLAY_SPAN);
        display_span.innerHTML = new_display_string;

        // If it was previously invalid, the splitter should have enforced a valid quantity now.
        // We already updated the desciption, so all that remains is to wipe the formatting.
        if(docitem_is_invalid(target_li)){
            wipe_invalid_formatting(target_li);
        }
    }
    else {
        let new_li = create_ele_docitem_li(jobitem_id, new_display_string, ul_id);
        target_ul.append(new_li);
        remove_none_li(target_ul);
    }
}


function get_docitem_split_window_result_ele(result_preview_class){
    let window_div = document.querySelector('.' + CLASS_SPLIT_WINDOW);
    return window_div.querySelector('.' + result_preview_class).querySelector('span');
}


function create_ele_docitem_li(jobitem_id, description, ul_id){
    const li = document.createElement('li');
    li.setAttribute('data-jiid', jobitem_id);

    const span = document.createElement('span');
    span.classList.add(CLASS_DISPLAY_SPAN);
    span.innerHTML = description;
    li.append(span);

    const button_container = document.createElement('div');
    button_container.classList.add('button-container');

    const split_btn = document.createElement('button');
    split_btn.classList.add(CLASS_SPLIT_BTN);
    split_btn.classList.add('button-primary-hollow');
    split_btn.innerHTML = STR_SPLIT_BTN;
    split_btn.addEventListener('click', (e) => {
        split_doc_item(e);
    });
    
    
    const toggle_btn = document.createElement('button');
    toggle_btn.classList.add(CLASS_TOGGLE_BTN);
    toggle_btn.classList.add('button-primary');

    if(ul_id == ID_INCLUDES_UL){
        toggle_btn.innerHTML = STR_EXCLUDES_BTN;
    }
    else if(ul_id == ID_EXCLUDES_UL){
        toggle_btn.innerHTML = STR_INCLUDES_BTN;
    }

    toggle_btn.addEventListener('click', (e) => {
        toggle_doc_item(e);
    });
    button_container.append(toggle_btn);
    button_container.append(split_btn);
    

    li.append(button_container);

    return li;

}







// || Invalid DocItems
function docitem_is_invalid(docitem_ele){
    if(docitem_ele == null){
        return false;
    }
    return docitem_ele.classList.contains(CSS_CLASS_INVALID_LI);
}


function get_valid_description(docitem_ele){
    const display_span = docitem_ele.querySelector('.' + CLASS_DISPLAY_SPAN);
    if(display_span == null){
        return 'Description not found';
    }
    
    if(!docitem_is_invalid(docitem_ele)){
        return display_span.innerHTML;
    }

    /*
    "max_available" reflects the quantity on the JobItem minus the quantities
    assigned to other documents of the same type as this one. It is possible 
    for it to be a negative number (e.g. suppose the JobItem has qty=1 and another
    document has qty=2, the max_available for this document will be -1).

    In the event of a negative max_available, qty=0 is sufficient for THIS document to 
    be valid and that's all we care about right now (the -1 is the other document's problem).
    */
    var max_available = parseInt(docitem_ele.dataset.max_available);
    max_available = max_available > 0 ? max_available : 0;
    return display_span.innerHTML.replace(QTY_RE, max_available);
}


function fix_invalid_docitem_ele(docitem_ele){
    if(parseInt(docitem_ele.dataset.max_available) <= 0){
        return false;
    }

    replace_invalid_description(docitem_ele);
    wipe_invalid_formatting(docitem_ele);
    return true;
}


function replace_invalid_description(docitem_ele){
    if(element_does_not_exist(docitem_ele)){
        return;
    }
    const display_span = docitem_ele.querySelector('.' + CLASS_DISPLAY_SPAN);
    display_span.innerHTML = get_valid_description(docitem_ele);
}


function wipe_invalid_formatting(docitem_ele){
    remove_invalid_css(docitem_ele);
    remove_invalid_icon(docitem_ele);
}


function remove_invalid_css(docitem_ele){
    if(element_does_not_exist(docitem_ele)){
        return;
    }

    docitem_ele.classList.remove(CSS_CLASS_INVALID_LI); 
}


function remove_invalid_icon(docitem_ele){
    if(element_does_not_exist(docitem_ele)){
        return;
    }
    if(!element_does_not_exist(docitem_ele.querySelector(`.${CSS_CLASS_INVALID_ICON}`))){
        docitem_ele.querySelector(`.${CSS_CLASS_INVALID_ICON}`).remove();
    }  
}

function element_does_not_exist(ele){
    if(ele == null){
        return true;
    }
    return false;
}