/*
    Adjust which Jobs appear on the user's to-do list.
*/

import {
    get_error_message,
    getRequestOptions,
    status_is_good,
    update_backend,
} from './util.js';


function setupAddToTodoFromRecords(){
    const CLASS_ADD_JOB_BTN = 'todo-list-add';

    // Records page has a [+] button for each <tr> not on the to-do list, which adds that job to the to-do list
    document.querySelectorAll('.' + CLASS_ADD_JOB_BTN).forEach(btn => {
        btn.addEventListener('click', () => {
            add_to_todo_list(btn);
        });
    });

    async function add_to_todo_list(btn){
        let request_options = getRequestOptions('PUT', {
            'job_id': btn.dataset.job_id
        });
        let data = await update_backend(`${URL_TODO_MANAGEMENT}`, request_options);
        if(!status_is_good(data, 204)){
            alert(get_error_message(data));
        } else {
            update_frontend_after_add(btn);
        }
    }
    
    
    function update_frontend_after_add(btn){
        const CSS_TODO_CIRCLE_BUTTON_ON = "recordsTable_todoButton-on";
        const CSS_TODO_CIRCLE_BUTTON_OFF = "recordsTable_todoButton-off";
        const CSS_TODO_CIRCLE_BUTTON_SPAN = "recordsTable_todoButtonSpan";
    
        if(btn.classList.contains(CLASS_ADD_JOB_BTN)){
            btn.disabled = true;
            btn.classList.remove(CSS_TODO_CIRCLE_BUTTON_OFF);
            if(!btn.classList.contains(CSS_TODO_CIRCLE_BUTTON_ON)){
                btn.classList.add(CSS_TODO_CIRCLE_BUTTON_ON);
            }
            const span = btn.querySelector(`.${CSS_TODO_CIRCLE_BUTTON_SPAN}`);
            span.textContent = "on todo list";
        } 
    }
}
setupAddToTodoFromRecords();

