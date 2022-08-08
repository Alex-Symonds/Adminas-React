/*
    Adjust which Jobs appear on the user's to-do list.
*/

const CLASS_REMOVE_JOB_BTN = 'todo-list-remove';
const CLASS_ADD_JOB_BTN = 'todo-list-add';
const ID_PREFIX_JOB_PANEL = 'todo_panel_job_';
const CLASS_TODO_ERROR_MSG = 'todo-error-message';

const CLASS_JOB_PANEL_DETAILS = 'job-details';


document.addEventListener('DOMContentLoaded', () => {

    // Index page has a (-) button on each panel, which removes the job from the to-do list
    document.querySelectorAll('.' + CLASS_REMOVE_JOB_BTN).forEach(btn => {
        btn.addEventListener('click', () => {
            remove_from_todo_list(btn);
        });
    });

    // Records page has a [+] button for each <tr> not on the to-do list, which adds that job to the to-do list
    document.querySelectorAll('.' + CLASS_ADD_JOB_BTN).forEach(btn => {
        btn.addEventListener('click', () => {
            add_to_todo_list(btn);
        });
    });
});




// Remove from To-Do List: backend, then conditional frontend response
function remove_from_todo_list(btn){
    let request_options = get_request_options('DELETE', {
        'job_id': btn.dataset.job_id
    });

    fetch(`${URL_TODO_MANAGEMENT}`, request_options)
    .then(response => get_json_with_status(response))
    .then(data => {
        clear_todo_error_from_job_panels();
        if(!status_is_good(data, 204)){
            if(!display_todo_error_on_job_panel(data, btn.dataset.job_id)){
                alert(get_error_message(data));
            }
        } else {
            update_frontend_after_removal(btn, btn.dataset.job_id);
        }
    })
    .catch(error => {
        console.log('Error: ', error);
    })
}

// Add to To-Do List: backend, then conditional frontend response
function add_to_todo_list(btn){
    let request_options = get_request_options('PUT', {
        'job_id': btn.dataset.job_id
    });

    fetch(`${URL_TODO_MANAGEMENT}`, request_options)
    .then(response => get_json_with_status(response))
    .then(data => {
        if(!status_is_good(data, 204)){
            alert(get_error_message(data));
        } else {
            update_frontend_after_add(btn);
        }
    })
    .catch(error => {
        console.log('Error: ', error);
    })
}





// Remove: main function called by the fetch block to conditionally handle frontend updates
function update_frontend_after_removal(btn, job_id){
    if(btn.classList.contains(CLASS_REMOVE_JOB_BTN)){
        remove_job_panel_from_todo_list(job_id);
    }  
}


// Add: main function called by the fetch block to conditionally handle frontend updates
function update_frontend_after_add(btn){
    // If request came from an on/off toggle, run the function to change off to on
    if(btn.classList.contains(CLASS_ADD_JOB_BTN)){
        replace_todo_add_btn_with_on(btn);
    } 
}







// Remove via Job panel: attempt to display an error message inside a Job panel and report if it worked
function display_todo_error_on_job_panel(error_obj, job_id){
    active_ele = document.querySelector(`#${ID_PREFIX_JOB_PANEL}${job_id}`);
    if(active_ele){
        msg_ele = create_dismissable_error(error_obj);
        active_ele.prepend(msg_ele);
        return true;
    }
    return false;
}

// Remove via Job panel: get rid of the error messages so they don't stay there for ever
function clear_todo_error_from_job_panels(){
    document.querySelectorAll('.' + CLASS_ERROR_MESSAGE).forEach(ele => {
        ele.remove();
    });
}

// Remove via Job panel: get rid of a Job panel element from the todo list / index page
function remove_job_panel_from_todo_list(job_id){
    ele_to_remove = document.querySelector(`#${ID_PREFIX_JOB_PANEL}${job_id}`);
    if(ele_to_remove != null){
        ele_to_remove.remove();
    }
}







// Add via [+] button: replace the button with a span saying "on"
function replace_todo_add_btn_with_on(btn){
    let span = document.createElement('span');
    span.classList.add(CLASS_ADD_JOB_BTN);
    span.innerHTML = 'on';
    btn.before(span);
    btn.remove();
}
