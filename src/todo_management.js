// /*
//     Adjust which Jobs appear on the user's to-do list.
// */

// import {
//     CLASS_ERROR_MESSAGE,
//     get_error_message,
//     getRequestOptions,
//     status_is_good,
//     update_backend,
// } from './util.js';

// const CLASS_REMOVE_JOB_BTN = 'todo-list-remove';
// const CLASS_ADD_JOB_BTN = 'todo-list-add';
// const ID_PREFIX_JOB_PANEL = 'todo_panel_job_';
// const CLASS_TODO_ERROR_MSG = 'todo-error-message';

// const CLASS_JOB_PANEL_DETAILS = 'job-details';


// export function setupRemoveFromTodo(){
//     // Index page has a (-) button on each panel, which removes the job from the to-do list
//     document.querySelectorAll('.' + CLASS_REMOVE_JOB_BTN).forEach(btn => {
//         btn.addEventListener('click', () => {
//             remove_from_todo_list(btn);
//         });
//     });
// }

// export function setupAddToTodoFromRecords(){
//     // Records page has a [+] button for each <tr> not on the to-do list, which adds that job to the to-do list
//     document.querySelectorAll('.' + CLASS_ADD_JOB_BTN).forEach(btn => {
//         btn.addEventListener('click', () => {
//             add_to_todo_list(btn);
//         });
//     });
// }


// // document.addEventListener('DOMContentLoaded', () => {

// //     // Index page has a (-) button on each panel, which removes the job from the to-do list
// //     document.querySelectorAll('.' + CLASS_REMOVE_JOB_BTN).forEach(btn => {
// //         btn.addEventListener('click', () => {
// //             remove_from_todo_list(btn);
// //         });
// //     });

// //     // Records page has a [+] button for each <tr> not on the to-do list, which adds that job to the to-do list
// //     document.querySelectorAll('.' + CLASS_ADD_JOB_BTN).forEach(btn => {
// //         btn.addEventListener('click', () => {
// //             add_to_todo_list(btn);
// //         });
// //     });
// // });


// export async function remove_from_todo_list(btn){
//     let request_options = getRequestOptions('DELETE', {
//         'job_id': btn.dataset.job_id
//     });
//     let data = await update_backend(`${URL_TODO_MANAGEMENT}`, request_options);
//     clear_todo_error_from_job_panels();
//     if(!status_is_good(data, 204)){
//         if(!display_todo_error_on_job_panel(data, btn.dataset.job_id)){
//             alert(get_error_message(data));
//         }
//     } else {
//         update_frontend_after_removal(btn, btn.dataset.job_id);
//     }
// }


// export async function add_to_todo_list(btn){
//     let request_options = getRequestOptions('PUT', {
//         'job_id': btn.dataset.job_id
//     });
//     let data = await update_backend(`${URL_TODO_MANAGEMENT}`, request_options);
//     if(!status_is_good(data, 204)){
//         alert(get_error_message(data));
//     } else {
//         update_frontend_after_add(btn);
//     }
// }


// function update_frontend_after_removal(btn, job_id){
//     if(btn.classList.contains(CLASS_REMOVE_JOB_BTN)){
//         remove_job_panel_from_todo_list(job_id);
//     }  
// }


// function update_frontend_after_add(btn){
//     const CSS_TODO_CIRCLE_BUTTON_ON = "recordsTable_todoButton-on";
//     const CSS_TODO_CIRCLE_BUTTON_OFF = "recordsTable_todoButton-off";
//     const CSS_TODO_CIRCLE_BUTTON_SPAN = "recordsTable_todoButtonSpan";

//     if(btn.classList.contains(CLASS_ADD_JOB_BTN)){
//         btn.disabled = true;
//         btn.classList.remove(CSS_TODO_CIRCLE_BUTTON_OFF);
//         if(!btn.classList.contains(CSS_TODO_CIRCLE_BUTTON_ON)){
//             btn.classList.add(CSS_TODO_CIRCLE_BUTTON_ON);
//         }
//         const span = btn.querySelector(`.${CSS_TODO_CIRCLE_BUTTON_SPAN}`);
//         span.textContent = "on todo list";
//     } 
// }


// function display_todo_error_on_job_panel(error_obj, job_id){
//     active_ele = document.querySelector(`#${ID_PREFIX_JOB_PANEL}${job_id}`);
//     if(active_ele){
//         msg_ele = create_generic_ele_dismissable_error(error_obj);
//         active_ele.prepend(msg_ele);
//         return true;
//     }
//     return false;
// }


// function clear_todo_error_from_job_panels(){
//     document.querySelectorAll('.' + CLASS_ERROR_MESSAGE).forEach(ele => {
//         ele.remove();
//     });
// }


// function remove_job_panel_from_todo_list(job_id){
//     const ele_to_remove = document.querySelector(`#${ID_PREFIX_JOB_PANEL}${job_id}`);
//     if(ele_to_remove != null){
//         ele_to_remove.remove();
//     }
// }
