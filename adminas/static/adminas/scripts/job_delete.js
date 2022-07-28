/*
    Delete Job button on the edit Job page.
*/

const ID_DELETE_JOB_BTN = 'delete_job_btn';

document.addEventListener('DOMContentLoaded', () => {
    let delete_btn = document.getElementById(ID_DELETE_JOB_BTN);
    if(delete_btn != null){
        delete_btn.addEventListener('click', () => {
            delete_job();
        });
    }
});


function delete_job(){
    let request_options = get_request_options('DELETE');

    fetch(URL_DELETE_JOB, request_options)
    .then(response => get_json_with_status(response))
    .then(data => {
        if(get_status_from_json(data) === 204){
            window.location.href = '/';
        }
        else if(responded_with_error(data)){
            display_delete_failed_message(data);
        }
        else {
            let error = create_error('Delete failed.');
            display_delete_failed_message(error);
        }
    })
    .catch(error => {
        console.log('Error: ', error)
    });
}

function display_delete_failed_message(error_obj){
    // If there's an existing error message with the same error, do nothing
    let message = get_message_from_error(error_obj);

    let existing_ele = document.querySelector(`.${CLASS_ERROR_MESSAGE}`);
    if (existing_ele != null && existing_ele.getElementsByTagName('DIV')[0].innerHTML == message){
        return;
    }

    // Clear out the old error message, if there is one, then replace with a
    // shiny new error message.
    if (existing_ele != null){
        existing_ele.remove();
    }
    let delete_btn = document.getElementById(ID_DELETE_JOB_BTN);
    let error_message_ele = create_dismissable_error(error_obj);
    delete_btn.after(error_message_ele);
}