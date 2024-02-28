import {
    CLASS_ERROR_MESSAGE,
    get_error_message,
    getRequestOptions,
    status_is_good,
    update_backend,
} from './util.js';

function setupRemoveFromTodo(){
    const ID_PREFIX_JOB_PANEL = 'todo_panel_job_';
    const CLASS_REMOVE_JOB_BTN = 'todo-list-remove';

    // Index page has a (-) button on each panel, which removes the job from the to-do list
    document.querySelectorAll('.' + CLASS_REMOVE_JOB_BTN).forEach(btn => {
        btn.addEventListener('click', () => {
            remove_from_todo_list(btn);
        });
    });


    async function remove_from_todo_list(btn){
        let request_options = getRequestOptions('DELETE', {
            'job_id': btn.dataset.job_id
        });
        let data = await update_backend(`${URL_TODO_MANAGEMENT}`, request_options);
        clear_todo_error_from_job_panels();
        if(!status_is_good(data, 204)){
            if(!display_todo_error_on_job_panel(data, btn.dataset.job_id)){
                alert(get_error_message(data));
            }
        } else {
            update_frontend_after_removal(btn, btn.dataset.job_id);
        }
    }
    
    
    function clear_todo_error_from_job_panels(){
        document.querySelectorAll('.' + CLASS_ERROR_MESSAGE).forEach(ele => {
            ele.remove();
        });
    }
    
    
    function display_todo_error_on_job_panel(error_obj, job_id){
        active_ele = document.querySelector(`#${ID_PREFIX_JOB_PANEL}${job_id}`);
        if(active_ele){
            msg_ele = create_generic_ele_dismissable_error(error_obj);
            active_ele.prepend(msg_ele);
            return true;
        }
        return false;
    }
    
    
    function update_frontend_after_removal(btn, job_id){
        if(btn.classList.contains(CLASS_REMOVE_JOB_BTN)){
            remove_job_panel_from_todo_list(job_id);
        }  
    }
    
    
    function remove_job_panel_from_todo_list(job_id){
        const ele_to_remove = document.querySelector(`#${ID_PREFIX_JOB_PANEL}${job_id}`);
        if(ele_to_remove != null){
            ele_to_remove.remove();
        }
    }    
}
setupRemoveFromTodo();


