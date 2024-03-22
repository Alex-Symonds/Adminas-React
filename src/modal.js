import {
    create_generic_ele_cancel_button,
    CSS_HIDE,
} from './util.js';

/*
    Contains reusable functions relating to modals.
*/

export const CSS_MODAL = 'modal';
const CSS_MODAL_CLOSE_BUTTON = 'modal_closeButton';
export const CSS_CLOSE_BUTTON = 'closeButton';
const CSS_MODAL_WRAPPER = "modalWrapper";
const CSS_MODAL_HEADING = "modal_heading";
export const CSS_MODAL_CONTENTS = 'modal_contents';

export function create_generic_modal(contents, css, onClose = null){
    const wrapper = create_generic_modal_wrapper();
    if(css !== "" && css !== undefined && css !== null){
        wrapper.className = `${wrapper.className} ${css}`;
    }

    const dialog = create_generic_modal_dialog();

    const closeBtn = create_generic_ele_cancel_button();
    closeBtn.classList.add(`${CSS_MODAL}_${CSS_CLOSE_BUTTON}`);
    closeBtn.addEventListener('click', () => {
        if(onClose !== null){
            onClose();
        }
        close_modal({dialog, wrapper});
    });

    dialog.append(closeBtn);
    dialog.append(contents);
    wrapper.append(dialog);
    return wrapper;
}


function create_generic_modal_dialog(){
    let dialog = document.createElement('dialog');
    dialog.classList.add(CSS_MODAL);
    return dialog;
}


function create_generic_modal_wrapper(){
    let wrapper = document.createElement('div');
    wrapper.classList.add(CSS_MODAL_WRAPPER);
    wrapper.classList.add(CSS_HIDE);
    return wrapper;
}

export function create_generic_modal_heading(level){
    let headingEle;
    if(
        typeof level !== 'number' 
        || level > 6
        || level < 1
    ){
        headingEle = document.createElement('h2');
    } else {
        headingEle = document.createElement(`h${level}`);
    }
    headingEle.classList.add(CSS_MODAL_HEADING);
    return headingEle;
}

export function open_modal(modalWrapper){
    modalWrapper.classList.remove(CSS_HIDE);
    const modalEle = modalWrapper.querySelector(`.${CSS_MODAL}`);
    modalEle.show();
}



export function close_modal({ dialog, wrapper }){
    if(wrapper !== null && wrapper !== undefined && !wrapper?.classList.contains(CSS_HIDE)){
        wrapper?.classList.add(CSS_HIDE);
    }

    if(dialog !== null && dialog !== undefined){
        dialog?.close();
    }
}


export function removeModal(cssClassToID){
    // For when the modal should be entirely removed
    const wrappers = findModalWrappersInDoc();
    const selectedWrappers = cssClassToID === undefined
        ? wrappers
        : Array.from(wrappers).filter(wrapper => wrapper.classList.contains(cssClassToID));
    selectedWrappers.forEach(wrapper => {
        wrapper?.remove();
    });
}


export function findAllModalCloseButtons(){
    return document.querySelectorAll(`.${CSS_MODAL_CLOSE_BUTTON}`);
}


function findModalDialogsInDoc(){
    const dialog = document.getElementsByTagName('dialog');
    return dialog.length > 0 ? dialog : null;
}

function findModalWrappersInDoc(){
    const wrapper = document.querySelectorAll(`.${CSS_MODAL_WRAPPER}`);
    return wrapper.length > 0 ? wrapper : null;
}

function findModalDialogFromChild(child){
    return child.closest(`.${CSS_MODAL}`);
}

function findModalWrapperFromChild(child){
    return child.closest(`.${CSS_MODAL_WRAPPER}`);
}

export function findModalWrapperFromParent(parent){
    return parent.querySelector(`.${CSS_MODAL_WRAPPER}`);
}

export function setupModalCloseButton(closeBtn){
    const dialog = findModalDialogFromChild(closeBtn);
    if(dialog !== null){
        closeBtn.addEventListener('click', () => {
            close_modal({dialog, wrapper: findModalWrapperFromChild(dialog)});
        });
        return;
    }
}


