/*
    Document Builder page's item assignment functionality.
    (Main document functions and special instructions are in a separate file.)

    Covers:
        > The split button/s
        > The incl. and excl. buttons

    Contents:
        || Settings      (info and helpers for included and excluded)
        || Toggle docitems
        || Split docitems
        || Create and Update Split/Join Form
        || Invalid DocItems
        || General Helpers
*/

import {
    unsavedDocumentChangesWarning
} from './document_builder_main.js';

import { 
    removeModal,
    create_generic_modal, 
    create_generic_modal_heading,
    open_modal
} from './modal.js';

import { 
    create_generic_ele_submit_button,
    QTY_RE,
} from './util.js';


export const CLASS_NONE_LI = 'none';
export const CSS_DOCITEM_DESC_STRING = 'documentPageItems_itemDisplayText';

const CSS_CLASS_INVALID_LI = 'documentPageItems_itemLi-invalid';
const CSS_CLASS_INVALID_ICON = 'invalid-icon';

const CLASS_SPLIT_BTN = 'documentPageItems_splitButton';

const CLASS_SPLIT_MODAL = 'splitDocitemModal';
const CLASS_SPLIT_WINDOW = 'splitDocitemModal_content';
const CSS_SPLIT_PREVIEW_ONE_VALUE = 'splitDocitemForm_previewOneResultValue';
const ID_SPLIT_DIRECTION_SELECT = 'id_set_split_direction';
const ID_SPLIT_QTY_INPUT = 'id_set_split_quantity'; 


document.addEventListener('DOMContentLoaded', () => {
    setupDocumentBuilderItemSelection();
});

function setupDocumentBuilderItemSelection(){

    document.querySelectorAll('.documentPageItems_includeButton').forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggle_doc_item(e);
        })
    });

    document.querySelectorAll('.documentPageItems_excludeButton').forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggle_doc_item(e);
        })
    });

    document.querySelectorAll('.' + CLASS_SPLIT_BTN).forEach(btn => {
        btn.addEventListener('click', (e) => {
            split_doc_item(e);
        })
    });

}

// || Settings      (info and helpers for included and excluded)
const CSS_INCLUDES_UL = 'documentPageItems_itemsUl-included';
const includedInfo = {
    resultPreviewCSS: 'splitDocitemForm_previewIncludedResult',
    resultPreviewString: 'Included',
    splitFormCategory: 'included',
    toggleBtnClass: 'documentPageItems_excludeButton',
    toggleBtnStr: 'exclude',
    ulClass: CSS_INCLUDES_UL,
    ulEle: document.querySelector(`.${CSS_INCLUDES_UL}`),
}

const CSS_EXCLUDES_UL = 'documentPageItems_itemsUl-excluded';
const excludedInfo = {
    liClass: 'documentPageItems_itemLi-excluded',
    resultPreviewCSS: 'splitDocitemForm_previewExcludedResult',
    resultPreviewString: 'Excluded',
    splitFormCategory: 'excluded',
    toggleBtnClass: 'documentPageItems_includeButton',
    toggleBtnStr: 'include',
    ulClass: CSS_EXCLUDES_UL,
    ulEle: document.querySelector(`.${CSS_EXCLUDES_UL}`),
}


function getToggleSettings(ulEle){
    return isIncludedUl(ulEle)
        ? { src: includedInfo, dst: excludedInfo }
        : isExcludedUl(ulEle)
            ? { src: excludedInfo, dst: includedInfo }
            : null;
}

function isIncludedUl(ele){
    return ele.classList.contains(includedInfo.ulClass);
}

function isExcludedUl(ele){
    return ele.classList.contains(excludedInfo.ulClass);
}

function isItemToggleButton(ele){
    return ele.classList.contains(includedInfo.toggleBtnClass)
        || ele.classList.contains(excludedInfo.toggleBtnClass);
}

// Export just the bit that's needed
export function findIncludedUl(){
    return includedInfo.ulEle;
}

export function findExcludedUl(){
    return excludedInfo.ulEle;
}


// || Toggle docitems between included/excluded
function toggle_doc_item(e){
    const activeLi = e.target.closest('li');
    const src_ul = activeLi.parentElement;
    const settings = getToggleSettings(src_ul);
    if(settings == null){
        return;
    }
    updateBothUlForToggle(settings, activeLi);
    unsavedDocumentChangesWarning().on();
    return;
}


function updateBothUlForToggle(settings, activeLi){
    if(docitem_is_invalid(activeLi) && !fix_invalid_docitem_ele(activeLi)){
        activeLi.remove();     
    }
    else {
        moveDocitemLi(settings, activeLi);
    }
    updateUlEmptiness(settings);

    // Helpers
    function moveDocitemLi(settings, activeLi){
        // If there's already a li for this item in the destination ul (following a split), 
        // the "move" will consist of updating the quantity displayed in the destination li 
        // and deleting the source li.
        const dst_li = get_ele_li_with_same_jiid(settings.dst.ulEle, activeLi.dataset.jiid);
        if(dst_li != null){
            mergeIntoDstLi(activeLi, dst_li);
        }
        else {
            updateLiAfterToggle(activeLi, settings);
            settings.dst.ulEle.append(activeLi);
        }
    }


    function updateLiAfterToggle(activeLi, settings){
        // There's a CSS class for the excluded <li> to add the italics/greying.
        // The included <li>s don't have one, since they're just the default.
        if(isExcludedUl(settings.dst.ulEle)){
            activeLi.classList.add(settings.dst.liClass);
        }
        else {
            activeLi.classList.remove(settings.src.liClass);
        }
    
        updateToggleButton(activeLi, settings);
    }


    function updateToggleButton(liEle, settings){
        const buttons = liEle.getElementsByTagName('button');
        if(buttons === null){
            return;
        }
    
        let toggleButton;
        if(buttons.length > 1){
            toggleButton = Array.from(buttons).find((ele) => isItemToggleButton(ele));
        }
        else{
            toggleButton = buttons[0];
        }
    
        toggleButton.classList.remove(settings.src.toggleBtnClass);
        toggleButton.classList.add(settings.dst.toggleBtnClass);
    
        updateToggleSpan(liEle, settings);
    }


    function updateToggleSpan(liEle, settings){
        const SPAN_CLASS = 'hoverLabel';
        const targetSpan = liEle.querySelector(`.${SPAN_CLASS}`);
        targetSpan.textContent = settings.dst.toggleBtnStr;
    }


    function mergeIntoDstLi(src_li, dst_li){
        const dst_span = dst_li.querySelector('.' + CSS_DOCITEM_DESC_STRING);
        const src_span = src_li.querySelector('.' + CSS_DOCITEM_DESC_STRING);
        dst_span.textContent = get_combined_docitem_text(src_span.textContent, dst_span.textContent);
        src_li.remove();
    }


    function updateUlEmptiness(settings){
        // An otherwise empty ul should show one li for "None".
        remove_none_li(settings.dst.ulEle);
        if(!ul_contains_li(settings.src.ulEle)){
            settings.src.ulEle.append(create_ele_none_li());
        }
    }


    function ul_contains_li(ul_ele){
        for(let i = 0; i < ul_ele.children.length; i++){
            if(ul_ele.children[i].nodeName === 'LI'){
                return true;
            }
        }
        return false;
    }


    function create_ele_none_li(){
        const li = document.createElement('li');
        li.classList.add(CLASS_NONE_LI);
        li.append(document.createTextNode('No line items in this section'));
        return li;
    }
}



// || Split docitems
function split_doc_item(e){
    open_docitem_split_window(e.target);
}


function open_docitem_split_window(split_btn){
    close_docitem_split_window();

    const li_ele = split_btn.closest('li');
    const calling_ul = li_ele.parentElement;
    const splitWindowContent = create_ele_docitem_split_modal_content(li_ele, calling_ul);
    const modal = create_generic_modal(splitWindowContent, CLASS_SPLIT_MODAL, close_docitem_split_window);
    li_ele.append(modal);
    open_modal(modal);
    manageSplitAndToggleDisabled().disable();
}


function close_docitem_split_window(){
    let existing_window = document.querySelector('.' + CLASS_SPLIT_WINDOW);
    if(existing_window){
        existing_window.remove();
    }
    manageSplitAndToggleDisabled().enable();
    removeModal(CLASS_SPLIT_MODAL);
}


function manageSplitAndToggleDisabled(){
    const buttonClasses = ['documentPageItems_splitButton', 'documentPageItems_excludeButton', 'documentPageItems_includeButton',];

    function enable() {
        setDisabled(false);
    }

    function disable(){
        setDisabled(true);
    } 

    function setDisabled(setTo){
        buttonClasses.values().forEach(cssClass => {
            const buttons = document.querySelectorAll(`.${cssClass}`);
            buttons.forEach(btn => {
                btn.disabled = setTo;
            });
        })
    }

    return {
        enable,
        disable,
    }
}


// || Create and Update Split/Join Form
function create_ele_docitem_split_modal_content(docitem_ele, calling_ul){
    const CSS = {
        form: 'splitDocitemForm',
        buttonContainer: 'splitDocitemForm_buttonContainer',
        directionWrapper: 'splitDocitemForm_direction',
        inputWrapper: 'splitDocitemForm_inputWrapper',
        introduction: 'splitDocitemModal_introduction',
        invalid: 'splitDocitemModal_invalidSplit',
        label: 'splitDocitemForm_label',
        labelStr: 'splitDocitemForm_labelStr',
        labelSubStr: 'splitDocitemForm_labelSubStr',
        previewContainer: 'splitDocitemForm_previewResults',
        previewHeading: 'splitDocitemForm_previewResultsHeading',
        previewOneResultName: 'splitDocitemForm_previewOneResultName',
        previewOneResultValue: CSS_SPLIT_PREVIEW_ONE_VALUE,
        quantityWrapper: 'splitDocitemForm_quantityWrapper',
        submitBtn: 'splitDocitemForm_submitBtn',
    }

    let jobitem_id = docitem_ele.dataset.jiid;

    let div = document.createElement('div');
    div.classList.add(CLASS_SPLIT_WINDOW);

    const heading = create_generic_modal_heading(2);
    heading.innerText = "Edit Split";

    div.append(heading);
    if(needInvalidWarning(jobitem_id)){
        div.append(create_ele_invalid_split_warning());
    }
    div.append(create_ele_introduction(jobitem_id));

    const form = document.createElement('form');
    form.classList.add(CSS.form);
    form.append(create_ele_inputs(jobitem_id, calling_ul, docitem_ele));
    form.append(create_ele_result_preview_container(jobitem_id));
    form.append(create_ele_submit_btn_container());
    div.append(form);

    return div;

    // Helpers
    function needInvalidWarning(jobitem_id){
        const includes_ul = findIncludedUl();
        const docitem_ele = get_ele_li_with_same_jiid(includes_ul, jobitem_id);
        return docitem_is_invalid(docitem_ele);
    }

    // Children
    function create_ele_introduction(jobitem_id){
        let desc = document.createElement('p');
        desc.classList.add(CSS.introduction);
        desc.innerHTML = 'Splitting ' + get_combined_docitem_text_from_jobitem_id(jobitem_id);
        return desc;
    }

    function create_ele_submit_btn_container(){
        const container = document.createElement('div');
        container.classList.add(CSS.buttonContainer);
        container.append(create_ele_submit_btn());
        return container;
    }

    function create_ele_submit_btn(){
        let btn = create_generic_ele_submit_button();
        btn.classList.add(CSS.submitBtn);
        btn.type = 'button';
        btn.textContent = 'split / join';
        btn.addEventListener('click', (e) => {
            process_split_request(e.target);
        });
        return btn;
    }

    function create_ele_invalid_split_warning(){
        let result = document.createElement('div');
        result.classList.add(CSS.invalid);
    
        let icon_ele = document.querySelector(`.${CSS_CLASS_INVALID_ICON}`).cloneNode(true);
        result.append(icon_ele);
    
        let text = document.createTextNode('Invalid quantity detected and corrected');
        result.append(text);
    
        return result;
    }

    function create_ele_inputs(jobitem_id, calling_ul, docitem_ele){
        const div = document.createElement('div');
        div.classList.add(CSS.inputWrapper);
        div.append(create_ele_direction());
    
        if(docitem_is_invalid(docitem_ele)){
            var default_qty = docitem_ele.dataset.max_available;
        } else {
            var default_qty = get_docitem_qty(calling_ul, jobitem_id);
        }
    
        const inputDiv = document.createElement('div');
        inputDiv.classList.add(CSS.quantityWrapper);
        const input_label = create_ele_qty_label();
        inputDiv.append(input_label);

        const input_fld = create_ele_qty_input(default_qty);
        inputDiv.append(input_fld);

        div.append(inputDiv);
    
        return div;
    }

    function create_ele_qty_label(){
        const qtyLabel = document.createElement('label');
        qtyLabel.htmlFor = ID_SPLIT_QTY_INPUT;
        qtyLabel.textContent = 'Enter quantity';
        return qtyLabel;
    }

    function create_ele_qty_input(default_qty){
        let fld = document.createElement('input');
        fld.id = ID_SPLIT_QTY_INPUT;
        fld.type = 'number';
        fld.min = 0;
        fld.value = default_qty;
    
        fld.addEventListener('change', (e) => {
            update_ele_docitem_split_modal_content(e.target);
        });
    
        fld.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                update_ele_docitem_split_modal_content(e.target);
                process_split_request(e.target);
            }
        });
    
        return fld;
    }


    function create_ele_direction(){
        const direction_div = document.createElement('div');
        direction_div.classList.add(CSS.directionWrapper);
    
        const label = create_ele_direction_label();
        direction_div.append(label);

        const select = create_ele_direction_select();
        direction_div.append(select);
    
        return direction_div;
    }


    function create_ele_direction_label(){
        const label = document.createElement('label');
        label.for = ID_SPLIT_DIRECTION_SELECT;
        label.classList.add(CSS.label);
    
        const mainSpan = document.createElement('span');
        mainSpan.classList.add(CSS.labelStr);
        mainSpan.textContent = 'Select which quantity to input';
        label.append(mainSpan);
    
        const tipSpan = document.createElement('span');
        tipSpan.classList.add(CSS.labelSubStr);
        tipSpan.textContent = '(the other will be set automatically)';
        label.append(tipSpan);

        return label;
    }

    function create_ele_direction_select(){
        const select = document.createElement('select');
        select.id = ID_SPLIT_DIRECTION_SELECT;
    
        const optionInc = create_ele_direction_option(includedInfo);
        const optionEx = create_ele_direction_option(excludedInfo);
        select.append(optionInc);
        select.append(optionEx);

        return select;
    }

    function create_ele_direction_option(info){
        const optionEle = document.createElement('option');
        optionEle.name = info.splitFormCategory;
        optionEle.value = info.splitFormCategory;
        optionEle.textContent = info.splitFormCategory;
        return optionEle;
    }

    function create_ele_result_preview_container(jobitem_id){
        let container = document.createElement('div');
        container.classList.add(CSS.previewContainer);
    
        const heading = document.createElement('h3');
        heading.textContent = 'Result preview';
        heading.classList.add(CSS.previewHeading);
        container.append(heading);
        container.append(create_ele_preview_category(includedInfo.splitFormCategory, jobitem_id));
        container.append(create_ele_preview_category(excludedInfo.splitFormCategory, jobitem_id));
        return container;
    }

    function create_ele_preview_category(splitFormCategory, jobitem_id){
        const info = splitFormCategory === includedInfo.splitFormCategory 
            ? includedInfo
            : excludedInfo;

        const div = document.createElement('div');
        div.classList.add(info.resultPreviewCSS);
    
        const heading = document.createElement('span');
        heading.classList.add(CSS.previewOneResultName);
        heading.textContent = info.resultPreviewString;
        div.append(heading);
    
        let default_qty = get_docitem_qty(info.ulEle, jobitem_id);
        let result_span = document.createElement('span');
        result_span.classList.add(CSS.previewOneResultValue);
        result_span.textContent = default_qty;
        div.append(result_span);
    
        return div;
    }
}


function update_ele_docitem_split_modal_content(input_fld){
    const infoQtyRefersTo = getActiveInfo();
    if(infoQtyRefersTo === null){
        console.log("Error: can't find active info");
        return;
    }
    const infoRemainder = getRemainderInfo(infoQtyRefersTo.splitFormCategory);

    const qtyRefersToResultEle = get_docitem_split_window_result_ele(infoQtyRefersTo);
    const remainderResultEle = get_docitem_split_window_result_ele(infoRemainder);
    const selected_qty = parseInt(input_fld.value);
    const total_qty = get_total_qty(input_fld.closest('li').dataset.jiid);
    set_docitem_split_window(qtyRefersToResultEle, remainderResultEle, total_qty, selected_qty);

    // Helpers
    function getActiveInfo(){
        const selectEle = document.querySelector('#' + ID_SPLIT_DIRECTION_SELECT);
        const selectValue = selectEle.value.toLowerCase();
        
        return selectValue === excludedInfo.splitFormCategory
            ? excludedInfo
            : selectValue === includedInfo.splitFormCategory
                ? includedInfo
                : null;
    }
    

    function getRemainderInfo(oldSplitFormCategory){
        if(oldSplitFormCategory === includedInfo.splitFormCategory){
            return excludedInfo;
        }
        return includedInfo;
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
    
        const includes_qty = get_docitem_qty(includedInfo.ulEle, jiid);
        result += includes_qty;
    
        const excludes_qty = get_docitem_qty(excludedInfo.ulEle, jiid);
        result += excludes_qty;
    
        return result;
    }

}


function get_combined_docitem_text_from_jobitem_id(jobitem_id){
    let inc_text = get_individual_docitem_text_from_jobitem_id(findIncludedUl(), jobitem_id);
    let exc_text = get_individual_docitem_text_from_jobitem_id(findExcludedUl(), jobitem_id);

    if(inc_text === ''){
        return exc_text;
    } else if(exc_text === ''){
        return inc_text;
    }
    return get_combined_docitem_text(inc_text, exc_text);


    function get_individual_docitem_text_from_jobitem_id(ulEle, jobitem_id){
        const li = get_ele_li_with_same_jiid(ulEle, jobitem_id);
    
        if(li != null){
            return get_valid_description(li);
        } else {
            return '';
        } 
    }
}


function get_docitem_qty(itemsUl, jiid){
    const docitem_ele = get_ele_li_with_same_jiid(itemsUl, jiid);

    if(docitem_is_invalid(docitem_ele)){
        let max_available = parseInt(docitem_ele.dataset.max_available);
        return max_available < 0 ? 0 : max_available;
    }

    return get_docitem_qty_from_li(docitem_ele);


    function get_docitem_qty_from_li(docitem_ele){
        if(docitem_ele != null){
            return parseInt(docitem_ele.querySelector('.' + CSS_DOCITEM_DESC_STRING).textContent.match(QTY_RE)[0])
        }
        return 0;
    }
    
}


function process_split_request(calling_ele){
    update_ele_docitem_split_modal_content(document.querySelector(`#${ID_SPLIT_QTY_INPUT}`));

    const docitem_li = calling_ele.closest('li');
    const jobitem_id = docitem_li.dataset.jiid;

    let window_result_span = get_docitem_split_window_result_ele(includedInfo);
    const incl_value = parseInt(window_result_span.innerHTML);

    window_result_span = get_docitem_split_window_result_ele(excludedInfo);
    const excl_value = parseInt(window_result_span.innerHTML);

    /*  
    If either value is 0, the goal is one <li> located in the non-0 <ul> and 
    the display text will show whatever the total quantity is for that JobItem ID.
    */
    if(incl_value === 0){
        process_docitem_split_N_and_0(includedInfo, jobitem_id);
    }
    else if(excl_value === 0){
        process_docitem_split_N_and_0(excludedInfo, jobitem_id);
    }

    /*
    If neither value is 0, the goal is one <li> in each of the two <ul>s, with 
    the description in each modified in accordance with the user's input.
    */
    else{
        process_docitem_split_N_and_N(incl_value, excl_value, jobitem_id, docitem_li);
    }

    // The items just changed, so show the "unsaved changes" warning; then close this panel.
    //show_save_warning_ele();
    unsavedDocumentChangesWarning().on();
    close_docitem_split_window();


    function process_docitem_split_N_and_0(infoUlToBe0, jobitem_id){
        // Use cases:
        //  1)  ul-to-be-0 has an unwanted <li> in it, which must be moved/merged to the other <ul>
        //  2)  The "calling" docitem is invalid. The user is splitting off N valid items to keep, then disposing of the rest
        //  3)  User decided not to make any changes, but clicked "submit" with the same quantities rather than closing the window
    
        const src_ul = infoUlToBe0.ulEle;
        const li_to_move = get_ele_li_with_same_jiid(src_ul, jobitem_id);
    
        // Case #1: Moving/merging a <li> from one <ul> to the other is the job of the toggle function
        // (note: the toggle function has its own handling for invalid docitems, so don't need to worry about that here)
        if(li_to_move !== null){
            const settings = getToggleSettings(src_ul);
            updateBothUlForToggle(settings, li_to_move);
            return;
        }
    
        // Determine if Case #2 applies by grabbing the <li> in "includes" (if it exists), since that's the potentially "invalid" one
        const includes_ul = findIncludedUl();
        const includes_li = get_ele_li_with_same_jiid(includes_ul, jobitem_id);
    
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


    function process_docitem_split_N_and_N(incl_value, excl_value, jobitem_id, docitem_li){
        const description = get_combined_docitem_text_from_jobitem_id(jobitem_id);
        process_docitem_split_set_ul(includedInfo.ulEle, incl_value, jobitem_id, description, docitem_li);
        process_docitem_split_set_ul(excludedInfo.ulEle, excl_value, jobitem_id, description, docitem_li);
    }


    function process_docitem_split_set_ul(target_ul, new_quantity, jobitem_id, description, docitem_li){
        const target_li = get_ele_li_with_same_jiid(target_ul, jobitem_id);
    
        const have_li = target_li !== null;
        const new_display_string = description.replace(QTY_RE, new_quantity);
    
        if(have_li){
            let display_span = target_li.querySelector('.' + CSS_DOCITEM_DESC_STRING);
            display_span.textContent = new_display_string;
    
            // If it was previously invalid, the splitter should have enforced a valid quantity now.
            // We already updated the desciption, so all that remains is to wipe the formatting.
            if(docitem_is_invalid(target_li)){
                wipe_invalid_formatting(target_li);
            }
        }
        else {
            const new_li = docitem_li.cloneNode(true);
            updateClonedItemLi(new_li, new_display_string, target_ul);
    
            target_ul.append(new_li);
            remove_none_li(target_ul);
        }
    }
    
}


function get_docitem_split_window_result_ele(info){
    const resultPreviewEle = document.querySelector(`.${info.resultPreviewCSS}`);
    return resultPreviewEle.querySelector(`.${CSS_SPLIT_PREVIEW_ONE_VALUE}`);
}


function updateClonedItemLi(clonedLi, description, target_ul){
    updateClonedItemLiClassList(clonedLi, target_ul);
    updateClonedItemLiDescription(clonedLi, description);
    updateClonedItemLiSplitBtn(clonedLi);
    updateClonedItemLiToggleBtn(clonedLi, target_ul);

    // Helpers
    function updateClonedItemLiClassList(clonedLi, target_ul){
        const CSS_EXCLUDED_LI = 'documentPageItems_itemLi-excluded';
        const wantExcludedCSS = isExcludedUl(target_ul);
        const hasExcludedCSS = clonedLi.classList.contains(CSS_EXCLUDED_LI);
    
        if(wantExcludedCSS && !hasExcludedCSS){
            clonedLi.classList.add(CSS_EXCLUDED_LI);
        } else if(!wantExcludedCSS && hasExcludedCSS){
            clonedLi.classList.remove(CSS_EXCLUDED_LI);
        }
    }

    function updateClonedItemLiDescription(clonedLi, description){
        const descEle = clonedLi.querySelector(`.${CSS_DOCITEM_DESC_STRING}`);
        descEle.textContent = description;
    }

    function updateClonedItemLiSplitBtn(clonedLi){
        const splitBtn = clonedLi.querySelector(`.${CLASS_SPLIT_BTN}`);
        splitBtn.addEventListener('click', (e) => {
            split_doc_item(e);
        });
    }

    function updateClonedItemLiToggleBtn(clonedLi, target_ul){
        const info = isIncludedUl(target_ul)
            ? { src: excludedInfo,  dst: includedInfo }
            : { src: includedInfo,  dst: excludedInfo };
    
        /*
            Find the toggle button in the cloned <li>, even if something
            has gone wrong and it's the wrong type of toggle button, somehow
        */
        const toggle_btn 
            = clonedLi.querySelector(`.${info.src.toggleBtnClass}`)
            ?? clonedLi.querySelector(`.${info.dst.toggleBtnClass}`);
        
        toggle_btn.addEventListener('click', (e) => {
            toggle_doc_item(e);
        });
    
        // Add the correct class, unless it's somehow already there.
        if(!(toggle_btn.classList.contains(info.dst.toggleBtnClass))){
            toggle_btn.classList.add(info.dst.toggleBtnClass);
        }
        toggle_btn.classList.remove(info.src.toggleBtnClass);
        
        const toggleLabel = toggle_btn.querySelector('.hoverLabel');
        toggleLabel.textContent = info.dst.toggleBtnStr;
    }
}



// || Invalid DocItems
function docitem_is_invalid(docitem_ele){
    if(docitem_ele == null){
        return false;
    }
    return docitem_ele.classList.contains(CSS_CLASS_INVALID_LI);
}


function get_valid_description(docitem_ele){
    const display_span = docitem_ele.querySelector('.' + CSS_DOCITEM_DESC_STRING);
    if(display_span === null){
        return 'Description not found';
    }
    
    if(!docitem_is_invalid(docitem_ele)){
        return display_span.textContent;
    }

    /*
    "max_available" reflects the quantity on the JobItem minus the quantities
    assigned to other documents of the same type as this one. It is possible 
    for it to be a negative number (e.g. suppose the JobItem has qty=1 and another
    document has qty=2, the max_available for this document will be -1).

    In the event of a negative max_available, qty=0 is sufficient for THIS document to 
    be valid and that's all we care about right now (the -1 is the other document's problem).
    */
    let max_available = parseInt(docitem_ele.dataset.max_available);
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

    // Helpers
    function replace_invalid_description(docitem_ele){
        if(element_does_not_exist(docitem_ele)){
            return;
        }
        const display_span = docitem_ele.querySelector('.' + CSS_DOCITEM_DESC_STRING);
        display_span.innerHTML = get_valid_description(docitem_ele);
    }
}


function wipe_invalid_formatting(docitem_ele){
    remove_invalid_css(docitem_ele);
    remove_invalid_icon(docitem_ele);

    // Helpers
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
}


// || General Helpers
function element_does_not_exist(ele){
    if(ele == null){
        return true;
    }
    return false;
}


function get_ele_li_with_same_jiid(target_ul, jiid){
    for(let i = 0; i < target_ul.children.length; i++){
        if(target_ul.children[i].dataset.jiid){
            if(jiid === target_ul.children[i].dataset.jiid){
                return target_ul.children[i];
            }
        }
    }
    return null;
}


function get_combined_docitem_text(src_text, dst_text){
    let qty_src = parseInt(src_text.match(QTY_RE)[0]);
    let qty_dst = parseInt(dst_text.match(QTY_RE)[0]);
    let qty_sum = qty_src + qty_dst;
    return dst_text.replace(QTY_RE, qty_sum);
}


function remove_none_li(ul_ele){
    const none_li = ul_ele.querySelector('.' + CLASS_NONE_LI);
    if(none_li != null){
        none_li.remove();
    }  
}

