/*
    Used on the read-only document page.
    Covers the functionality of the "replace with new version" and "revert to previous version" buttons.
*/

const ID_DOCUMENT_REPLACEMENT_BTN = 'replace_document_btn';
const ID_DOCUMENT_REVERT_BTN = 'revert_document_btn';

const CLASS_SPECIAL_INSTRUCTION_EDIT = 'edit-special-instruction-btn';
const CLASS_SPECIAL_INSTRUCTION_DELETE = 'delete-special-instruction-btn';
const CLASS_LOCAL_NAV = 'status-controls';

const CLASS_INSTRUCTIONS_SECTION = 'special-instructions';

const CLASS_SHOW_ADD_INSTRUCTION_FORMLIKE = 'special-instruction';
const CLASS_HIDE_ADD_INSTRUCTION_FORMLIKE = 'close-new-instr';

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {

    replace_btn = document.querySelector('#' + ID_DOCUMENT_REPLACEMENT_BTN);
    if(replace_btn != null){
        replace_btn.addEventListener('click', () => {
            next_or_previous_document_version('replace');
        });
    }

    revert_btn = document.querySelector('#' + ID_DOCUMENT_REVERT_BTN);
    if(revert_btn != null){

        revert_btn.addEventListener('click', () => {
            next_or_previous_document_version('revert');
        });

    }
});


// Adjust the version on the server and update the frontend
function next_or_previous_document_version(taskname){
    let request_options = get_request_options('POST', { 'task': taskname });

    fetch(`${URL_DOC_MAIN}`, request_options)
    .then(response => response.json())
    .then(data => {
        if('redirect' in data){
            window.location.href = data['redirect'];
        }
        else {
            if(!responded_with_error(data)) {
                data = create_error('Something went wrong');
            }
            display_document_response_message(data);
        }
    })
    .catch(error => {
        console.log('Error: ', error)
    })
}