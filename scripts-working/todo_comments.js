/*
    Handles clicking the pinned comment on a todo list row to open a modal containing all
    pinned comments and a button to add new ones.

    Notes:
    > This assumes that the Django template has already created a dialog element for 
      each item in the todo list, so all we need to do here is .show() the right one
    > This is achieved via setting an ID on each dialog element and adding that ID as
      a dataset attribute on the button
    > This file only contains functions specific to the todo list. Generic comment 
      editing/creating/deleting stuff is in job_comments.js
    
    Contents:
        || Modal Opener
        || Control Front-End Update
        || Extract Data
        || Find DOM Elements
        || Update Todo List Element
*/


document.addEventListener('DOMContentLoaded', () => {
    const BUTTON_CLASS = "pinnedModalOpener";
    document.querySelectorAll(`.${BUTTON_CLASS}`).forEach(btn => {
        btn.addEventListener('click', (e) => openPinnedCommentsModal(e));
    });

})


// || Modal Opener
function openPinnedCommentsModal(e){
    const targetID = e.target.closest('[data-target_id]').dataset.target_id;
    if(targetID === undefined){
        window.alert("Can't open pinned comments");
        return;
    }

    const modalWrapper = document.getElementById(targetID);
    modalWrapper.classList.remove('hide');
    
    const modalEle = modalWrapper.querySelector('.modal');
    modalEle.show();

    const closeButton = modalWrapper.querySelector('.modal_closeButton');
    if(closeButton !== undefined){
        closeButton.addEventListener('click', () => {
            modalWrapper.classList.add('hide');
            modalEle.close();
        });
    }
}


// || Control Front-End Update
function toggle_todo_list(comment_ele, new_status, toggled_attribute){
    const task = 'pinned' === toggled_attribute && !new_status ?
        'delete'
        : 'update';
    const commentData = {
        ...get_comment_data_from_comment_ele(comment_ele),
        [toggled_attribute]: new_status
    };
    commentData.contents = newlines_to_spaces(commentData.contents);
    update_todo_list_row_pinned(commentData, task);
}


function update_todo_list_row_pinned(commentData, task){
    const buttonEleOrNull = find_pinned_button_which_opened_modal();
    if(buttonEleOrNull === null){
        return;
    }

    const displayedCommentWasEdited = buttonEleOrNull.dataset.comment_id === commentData.id;
    if(displayedCommentWasEdited || task === 'create'){
        update_ele_todo_pinned_comment(
            buttonEleOrNull, 
            commentData,
            buttonEleOrNull.dataset.jobName,
        );
    } else if(task === 'delete') {
        const data = get_data_for_next_pinned_comment(commentData.id);
        if(data !== null){
            update_ele_todo_pinned_comment(
                buttonEleOrNull, 
                data,
                buttonEleOrNull.dataset.jobName,
            );
        } else{
            update_ele_todo_pinned_comment(
                buttonEleOrNull, 
                {
                    id: DEFAULT_COMMENT_ID,
                    contents: null,
                    pinned: true,
                    highlighted: false,
                    private: true,
                },
                buttonEleOrNull.dataset.jobName,
            );
        }
    }
}


// || Extract Data
function get_data_for_next_pinned_comment(removedCommentID){
    /*
    Suppose there were three pinned comments, but the user has just deleted or unpinned
    the most recent.

    The todo list element should now update to display the most recent of the remaining 
    two pinned comments in its pinned comment <td>.

    To achieve this without an API call, we will grab the comment information from the
    element inside the modal dialog.
    */

    const openModal = find_open_modal();
    if(!is_pinned_comments_modal(openModal)){
        return null;
    }

    const pinnedComments = openModal.querySelectorAll(`.${CLASS_COMMENT}`);
    if(pinnedComments === null){
        return null;
    }

    for(let i = 0; i < pinnedComments.length; i++){
        const idClass = `${CLASS_PREFIX_FOR_COMMENT_ID}${removedCommentID}`;
        if(!(pinnedComments[i].classList.contains(idClass))){
            return get_comment_data_from_comment_ele(pinnedComments[i]);
        }
    }
    return null;
}


// || Find DOM Elements
function find_pinned_button_which_opened_modal(){
    const openModal = find_open_modal();
    if(!is_pinned_comments_modal(openModal)){
        return null;
    }

    const modalWrapper = openModal.parentNode;
    const buttonEle = find_pinned_button_with_data_target_id(modalWrapper.id);
    return buttonEle;
}


function is_pinned_comments_modal(modalEle){
    const CLASS_PINNED_COMMENTS_MODAL = "pinnedCommentsModal";
    return modalEle !== null && modalEle.classList.contains(CLASS_PINNED_COMMENTS_MODAL);
}


function find_open_modal(){
    const modalEles = document.querySelectorAll(".modal");
    let modalEle = null;
    for(let i = 0; i < modalEles.length; i++){
        if(modalEles[i].open){
            modalEle = modalEles[i];
            break;
        }
    }
    return modalEle;
}


function find_pinned_button_with_data_target_id(modalID){
    const modalOpeners = document.querySelectorAll(".pinnedModalOpener");
    let buttonEle = null;
    for(let j = 0; j < modalOpeners.length; j++){
        if(modalOpeners[j].dataset.target_id === modalID){
            buttonEle = modalOpeners[j];
            break;
        }
    }
    return buttonEle;
}


// || Update Todo List Element
function update_ele_todo_pinned_comment(ele, commentData, jobName){

    ele.setAttribute('data-comment_id', commentData.id);

    const CLASS_TODO_PINNED_EMPTY = 'todoJob_pinnedComment-empty';
    const CLASS_TODO_PINNED_HIGHLIGHTED = 'todoJob_pinnedComment-highlighted';

    if(commentData.contents === null || commentData.contents === "" || commentData.contents === undefined){
        if(!(ele.classList.contains(CLASS_TODO_PINNED_EMPTY))){
            ele.classList.add(CLASS_TODO_PINNED_EMPTY);
        }
        ele.classList.remove(CLASS_TODO_PINNED_HIGHLIGHTED);
        ele.replaceChildren(create_ele_todo_pinned_comment_contents("Click to add pinned comments"));
    }
    else{
        if(!commentData.highlighted){
            ele.classList.remove(CLASS_TODO_PINNED_HIGHLIGHTED);
        }
        else if(!(ele.classList.contains(CLASS_TODO_PINNED_HIGHLIGHTED))){
            ele.classList.add(CLASS_TODO_PINNED_HIGHLIGHTED);
        }
        ele.classList.remove(CLASS_TODO_PINNED_EMPTY);
        ele.replaceChildren(
            create_ele_todo_pinned_comment_srButtonLabel(jobName),
            create_ele_todo_pinned_comment_privacyIcon(commentData.private),
            create_ele_todo_pinned_comment_contents(newlines_to_spaces(commentData.contents)),
        );
    }
}


function create_ele_todo_pinned_comment_srButtonLabel(jobName){
    const srSpan = document.createElement('span')
    srSpan.className = 'sr-only';
    srSpan.innerText = `pinned comments for ${jobName}`;
    return srSpan;
}


function create_ele_todo_pinned_comment_privacyIcon(isPrivate){
    const privacySpan = document.createElement('span');
    privacySpan.classList.add('todoJob_pinnedPrivacyStatus');
    privacySpan.classList.add(`todoJob_pinnedPrivacyStatus-${isPrivate ? 'private' : 'public'}`);
    privacySpan.innerText = `[${isPrivate ? 'PRIVATE' : 'public'}]`;
    return privacySpan;
}


function create_ele_todo_pinned_comment_contents(contentsStr){
    const ele = document.createElement('p');
    ele.className = "todoJob_pinnedContents";
    ele.innerText = contentsStr;
    return ele;
}


function newlines_to_spaces(str){
    return str.replaceAll('\n', ' ');
}