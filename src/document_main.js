/*
    Used on the read-only document page.
    Covers the functionality of the "replace with new version" and "revert to previous version" buttons.
*/

import {
    display_document_response_message,
    getRequestOptions,
    KEY_LOCATION,
    status_is_good,
    update_backend,
} from './util.js';


document.addEventListener('DOMContentLoaded', () => {
    const ID_DOCUMENT_REPLACEMENT_BTN = 'replace_document_btn';
    const ID_DOCUMENT_REVERT_BTN = 'revert_document_btn';

    replace_btn = document.querySelector('#' + ID_DOCUMENT_REPLACEMENT_BTN);
    if(replace_btn != null){
        replace_btn.addEventListener('click', () => {
            replace_issued_document();
        });
    }

    revert_btn = document.querySelector('#' + ID_DOCUMENT_REVERT_BTN);
    if(revert_btn != null){
        revert_btn.addEventListener('click', () => {
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

