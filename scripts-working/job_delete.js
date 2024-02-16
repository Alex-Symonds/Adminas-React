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


async function delete_job(){
    let request_options = getRequestOptions('DELETE');

    let response_data = await update_backend(URL_DELETE_JOB, request_options);
    if(get_status_from_json(response_data) === 204){
        window.location.href = '/';
    }
    else if(!status_is_good(response_data)){
        display_delete_failed_message(response_data);
    }
}

function display_delete_failed_message(error_obj){
    let message = get_error_message(error_obj);

    let existing_ele = document.querySelector(`.${CLASS_ERROR_MESSAGE}`);
    if (existing_ele != null && existing_ele.getElementsByTagName('DIV')[0].innerHTML == message){
        return;
    }

    if (existing_ele != null){
        existing_ele.remove();
    }
    let delete_btn = document.getElementById(ID_DELETE_JOB_BTN);
    let error_message_ele = create_generic_ele_dismissable_error(error_obj);
    delete_btn.after(error_message_ele);
}