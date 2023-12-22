const CSS_MODAL = 'modal';
const CSS_CLOSE_BUTTON = 'closeButton';
const CSS_MODAL_WRAPPER = "modalWrapper";
const CSS_MODAL_HEADING = "modal_heading";
const CSS_MODAL_CONTENTS = 'modal_contents';

function create_generic_modal(contents){
    const wrapper = create_generic_modal_wrapper();
    const dialog = create_generic_modal_dialog();

    const closeBtn = create_generic_ele_cancel_button();
    closeBtn.classList.add(`${CSS_MODAL}_${CSS_CLOSE_BUTTON}`);
    closeBtn.addEventListener('click', () => {
        if(!wrapper.classList.contains(CSS_HIDE)){
            wrapper.classList.add(CSS_HIDE);
        }
        dialog.close();
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

function open_modal(modalWrapper){
    modalWrapper.classList.remove(CSS_HIDE);
    const modalEle = modalWrapper.querySelector(`.${CSS_MODAL}`);
    modalEle.show();
}