/*
    Support for read-only doucments page
        > Replace document with a new version
        > Revert document to rpevious version
    
    Shared document stuff
        > display_document_response_message()
*/

import {
    create_generic_ele_cancel_button,
    get_date_time,
    getRequestOptions,
    KEY_LOCATION,
    status_is_good,
    update_backend,
} from './util.js';


document.addEventListener('DOMContentLoaded', () => {
    const replaceBtn = document.querySelector('.replaceIconTextButton');
    if(replaceBtn !== null){
        replaceBtn.addEventListener('click', () => {
            replace_issued_document();
        });
    }

    const revertBtn = document.querySelector('.revertIconTextButton');
    if(revertBtn !== null){
        revertBtn.addEventListener('click', () => {
            revert_issued_document();
        });
    }
});

async function replace_issued_document(){
    const request_options = getRequestOptions('POST');
    const resp_data = await update_backend(`${URL_DOC_MAIN}?doc_id=${DOC_ID}&task=replace`, request_options);

    if(status_is_good(resp_data, 201)){
        window.location.href = resp_data[KEY_LOCATION];
    }
    else {
        display_document_response_message(resp_data);
    }
}

async function revert_issued_document(){
    const request_options = getRequestOptions('POST');
    const resp_data = await update_backend(`${URL_DOC_MAIN}?doc_id=${DOC_ID}&task=revert`, request_options);

    if(status_is_good(resp_data, 200)){
        window.location.href = resp_data[KEY_LOCATION];
    }
    else {
        display_document_response_message(resp_data);
    }
}


export function display_document_response_message(data, string_is_error = false){
    // CSS class names, for DOM element creation and finding
    const CSS_MESSAGE_BOX = 'documentResponseMessage';
    const CSS_ERROR = 'documentResponseMessage-error';
    const CSS_NEUTRAL = 'documentResponseMessage-neutral';

    const CSS_MAINCONTENT = 'documentResponseMessage_content';
    const CSS_TIMESTAMP = 'documentResponseMessage_timestamp';
    const CSS_CLOSEBTN = 'documentResponseMessage_closeBtn';

    // The main bit
    const anchor_ele = document.querySelector('.documentWarnings');
    const message_ele = getMessageEle();
    const settings = determineSettings();
    updateMessageContents(message_ele, settings);
    return;

    // Helper: either grab the existing message ele or make a new one
    function getMessageEle(){
        let message_ele = document.querySelector(`.${CSS_MESSAGE_BOX}`);
        if(message_ele === null){
            message_ele = create_ele_document_message();
            anchor_ele.append(message_ele);
        }
        return message_ele;
    }

    // Helper: use args to work out the message content and status CSS
    function determineSettings(){
        // Init to fallback values
        let contentStr = 'Something went wrong, try refreshing the page';
        let css = CSS_ERROR;

        // Case: manual usage. Data is the string to display, bool sets formatting
        if(typeof data === 'string'){
            contentStr = data;
            css = string_is_error
            ? CSS_ERROR
            : CSS_NEUTRAL;
        }
        // Case: server returned a message to display on the page which isn't an error
        else if('message' in data){
            contentStr = data['message'];
            css = CSS_NEUTRAL;
        }
        // Case: server returned an error code
        else if(get_error_message().responded_with_error_reason(data)){
            contentStr = `Error: ${get_error_message(data)}`;
            css = CSS_ERROR;
        }  

        return {
            contentStr,
            statusModifierCSS: css
        }
    }
   

    // Helpers: Update an existing message ele
    function updateMessageContents(ele, settings){
        clearAllStatusModifierCSS(ele);
        ele.classList.add(settings.statusModifierCSS);

        const mainContent = findMainContentEleInside(message_ele);
        if(mainContent !== null){
            mainContent.textContent = settings.contentStr;
        }

        const timestamp = findTimestampEleInside(message_ele);
        if(timestamp !== null){
            timestamp.textContent = get_date_time();
        }
    }

    function clearAllStatusModifierCSS(ele){
        ele.classList.remove(CSS_ERROR);
        ele.classList.remove(CSS_NEUTRAL);
    }

    // Helpers: Find child elements
    function findMainContentEleInside(ele){
        return ele.querySelector(`.${CSS_MAINCONTENT}`);
    }

    function findTimestampEleInside(ele){
        return ele.querySelector(`.${CSS_TIMESTAMP}`);
    }

    // Helper: Build new message element
    function create_ele_document_message(){
        const ele = create_ele_document_message_base();

        const mainMessage = create_ele_main_message();
        ele.append(mainMessage);

        const timestamp = create_ele_timestamp();
        ele.append(timestamp);

        const closeBtn = create_ele_closeBtn();
        closeBtn.addEventListener('click', () => {
            ele.remove();
        });
        ele.append(closeBtn);

        return ele;
    }

    function create_ele_document_message_base(){
        const message_ele = document.createElement('div');
        message_ele.classList.add(CSS_MESSAGE_BOX);
    
        return message_ele;
    }

    function create_ele_main_message(){
        const mainMessage = document.createElement('p');
        mainMessage.classList.add(CSS_MAINCONTENT);

        return mainMessage;
    }

    function create_ele_timestamp(){
        const timestamp = document.createElement('p');
        timestamp.classList.add(CSS_TIMESTAMP);

        return timestamp;
    }

    function create_ele_closeBtn(){
        const closeBtn = create_generic_ele_cancel_button();
        closeBtn.classList.add(CSS_CLOSEBTN);
        return closeBtn;
    }
}

