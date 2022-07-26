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
    fetch(URL_DELETE_JOB, {
        method: 'DELETE',
        headers: getDjangoCsrfHeaders(),
        credentials: 'include'
    })
    .then(response => jsonOr204(response))
    .then(data => {
        if(data === 204){
            window.location.href = '/';
        }
        else{
            display_delete_failed_message(data);
        }
    })
    .catch(error => {
        console.log('Error: ', error)
    });
}

function display_delete_failed_message(error_obj){
    // If there's an existing error message with the same error, do nothing
    let err_msg = document.querySelector(`.${CLASS_ERROR_MESSAGE}`);
    if (err_msg != null && err_msg.getElementsByTagName('DIV')[0].innerHTML == message){
        return;
    }

    // Clear out the old error message, if there is one, then replace with a
    // shiny new error message.
    if (err_msg != null){
        err_msg.remove();
    }
    let delete_btn = document.getElementById(ID_DELETE_JOB_BTN);
    let error_message = create_dismissable_error(error_obj);
    delete_btn.after(error_message);
}