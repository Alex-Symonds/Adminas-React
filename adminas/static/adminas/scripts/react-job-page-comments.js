// || JobComments
// This file contains:
//      JobComments section on the Job page
//      Collapsable Comments (the vanilla JS "full" comments don't appear on the Job page)
//      Comment Editor

const DEFAULT_COMMENT_ID = '0';

function JobComments(props){

    // Comment-related states
    const [urlComments, setUrl] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [comments, setComments] = React.useState([]);
    const [activeEdit, setActiveEdit] = React.useState([null, null]);

    // Load inital comments data from server
    const { data, error, isLoaded } = useFetch(url_for_page_load(props.URL_GET_DATA, props.job_id, 'comments'));
    React.useEffect(() => {
        if(typeof data.url !== 'undefined'){
            setUrl(data.url);
        }

        if(typeof data.username !== 'undefined'){
            setUsername(data.username);
        }

        if(typeof data.comments !== 'undefined'){
            setComments(data.comments);
        }
    }, [data]);


    // Handle edits (whether to content or toggling pinned/highlighted)
    function update_active_edit(settings){
        setActiveEdit(settings);
    }

    function update_comment(comment_id, comment_attributes){
        var index = comments.findIndex(c => c.id === parseInt(comment_id));
        if(index === -1){
            return;
        }
        setComments([
            ...comments.slice(0, index),
            Object.assign(comments[index], comment_attributes),
            ...comments.slice(index + 1)
        ]);
    }

    function delete_comment(comment_id){
        var index = comments.findIndex(c => c.id === parseInt(comment_id));
        if(index === -1){
            return;
        }
        setComments([
            ...comments.slice(0, index),
            ...comments.slice(index + 1)
        ]);  
    }

    // Rendering
    if(error){
        return <LoadingErrorEle name='comments' />
    }
    else if (!isLoaded){
        return <LoadingEle />
    }
    return <JobCommentsRender   username = { username }
                                comments = { comments }
                                active_edit = { activeEdit }
                                update_active_edit = { update_active_edit }
                                update_comment = { update_comment }
                                delete_comment = { delete_comment }
                                url_comments = { urlComments }
                                />
}

function JobCommentsRender(props){
    return [
        <section id="job_comments" class="item">
            <h3>Comments</h3>
            <a href={`${props.url_comments}?page=1`}>See all {props.comments.length} comments</a>
            <JobCommentsSubsection title='Pinned'       css_class='pinned'      username = { props.username } 
                                                                                comments = { props.comments } 
                                                                                active_edit = { props.active_edit }
                                                                                update_active_edit = { props.update_active_edit }
                                                                                update_comment = { props.update_comment }
                                                                                delete_comment = { props.delete_comment }
                                                                                url_comments = { props.url_comments }/>
            <JobCommentsSubsection title='Highlighted'  css_class='highlighted' username = { props.username } 
                                                                                comments = { props.comments } 
                                                                                active_edit = { props.active_edit }
                                                                                update_active_edit = { props.update_active_edit }
                                                                                update_comment = { props.update_comment }
                                                                                delete_comment = { props.delete_comment }
                                                                                url_comments = { props.url_comments } />
        </section>
    ]
}

// One "subsection" in the Comments panel, including a heading
function JobCommentsSubsection(props){
    var css_classes = 'comment-container empty-paragraph ' + props.css_class;
    var filtered_comments = filter_comments(props.comments, props.css_class);

    if (filtered_comments.length == 0){
        var content = <p class="empty-section-notice">No comments have been { props.css_class }.</p>;
    }
    else {
        var content = <CommentsBlock    comments = { filtered_comments }
                                        update_comment = { props.update_comment }
                                        delete_comment = { props.delete_comment }
                                        section_name = { props.css_class }
                                        active_edit = { props.active_edit }
                                        update_active_edit = { props.update_active_edit }
                                        url_comments = { props.url_comments }
                                        />
    }

    return [
        <section class="subsection">
            <h4>{props.title} by {props.username}</h4>
            <div class={css_classes}>
                {content}
            </div>
        </section>
    ]
}

function filter_comments(comments, css_class){
    if(css_class == "pinned"){
        return comments.filter(c => c.pinned);
    }
    else if (css_class == "highlighted"){
        return comments.filter(c => c.highlighted);
    }
    return comments;
}


// Just Comments, one after another
function CommentsBlock(props){
    return [
        <div>
            {props.comments.map((comment) => {
                return <Comment key={comment.id.toString()}
                                c={comment}
                                update_comment = { props.update_comment } 
                                delete_comment = { props.delete_comment }
                                section_name = { props.section_name }
                                active_edit = { props.active_edit }
                                update_active_edit = { props.update_active_edit }
                                url_comments = { props.url_comments }
                />
            })}
        </div>
    ]
}



// Individual comment components below here ----------------------------------------------------------------------------
function Comment(props){
    // Note re. vanilla JS portions of Adminas.
    // On the Job page only the "collapsed" comments are used, so only collapsed comments are setup in React atm.

    // Notes re. edit mode
    // A Comment can be in "read mode" or "edit mode". Only one comment on the page is allowed to be in edit mode at a time:
    // setting Comment B to edit mode should return Comment A to read mode. To enable siblings to affect one another, 
    // the "active edit" state has been lifted up. It is possible for the same comment ID to appear twice (if it is both pinned 
    // and highlighted, it will appear in both sections) so to ensure only one editor is open at a time, we must consider
    // both the comment_id and the section it's in.

    // Set the comment ID and section name here, so children don't have to worry about those implementation details.
    function edit_mode(want_edit){
        if(!want_edit){
            var new_settings = [null, null];
        }
        else {
            var new_settings = [props.c.id, props.section_name];
        }
        props.update_active_edit(new_settings);
    }

    // Determine if this comment is the active_edit comment. If so, render the editor.
    if(props.c.id === props.active_edit[0] && props.section_name === props.active_edit[1]){
        return <CommentEditor   comment = {props.c}
                                update_comment = { props.update_comment }
                                delete_comment = { props.delete_comment }
                                edit_mode = { edit_mode }
                                url_comments = { props.url_comments } />
    }
    // Otherwise render the "normal" comment
    return <CommentRead     c = {props.c}
                            edit_mode = { edit_mode }
                            update_comment = { props.update_comment } />
}

// "Normal" readable comment component
function CommentRead(props){
    var css_class_list = "one-comment id-" + props.c.id;
    props.c.private ? css_class_list += ' private' : css_class_list += ' public';
    if(props.c.highlighted){
        css_class_list += ' highlighted';
    }

    return [
        <article
            class={css_class_list}
            data-comment_id={props.c.id}
            data-is_private={props.c.private}
            data-is_pinned={props.c.pinned}
            data-is_highlighted={props.c.highlighted}
        >
            <details>
                <summary>
                    <CommentContentsMain    user_is_owner = { props.c.user_is_owner }
                                            private = { props.c.private }
                                            contents = { props.c.contents } />
                </summary>
                <CommentContentsFooter  created_by = { props.c.created_by }
                                        created_on = { props.c.created_on }
                                        comment_id = { props.c.id }
                                        pinned = { props.c.pinned }
                                        highlighted = { props.c.highlighted }
                                        user_is_owner ={ props.c.user_is_owner }
                                        edit_mode = { props.edit_mode }
                                        update_comment = { props.update_comment } />
            </details>
        </article>  
    ]
}

// Read Comment: the section with the "private" icon and the user's waffle
function CommentContentsMain(props){
    return [
        <span class="main">
            {props.user_is_owner && props.private ? <div class="privacy-status">[PRIVATE]</div>: ''}
            <span class="contents">{props.contents}</span>
        </span>
    ]
}

// Read Comment: the bit at the bottom, with the author, timestamp and buttons (pin, highlight and edit)
function CommentContentsFooter(props){

    function toggle_highlight(){
        var want_highlight = !props.highlighted;
        props.update_comment(props.comment_id, {highlighted: want_highlight});
    }

    return [
        <section class="footer">
            <div class="ownership">
                {props.created_by} on {props.created_on }
            </div>
            <div class="controls">
                <CommentPinnedButton    pinned = { props.pinned }
                                        update_comment = { props.update_comment } 
                                        comment_id = { props.comment_id } />
                <button class="highlighted-toggle" onClick={toggle_highlight}>+/- highlight</button>
                <CommentEditButton  user_is_owner = { props.user_is_owner }
                                    edit_mode = { props.edit_mode } />
            </div>
        </section>
    ]
}

// Read Comment: the pinned button at the bottom
function CommentPinnedButton(props){
    function toggle_pinned(){
        var want_pin = !props.pinned;
        props.update_comment(props.comment_id, {pinned: want_pin});
    }

    var display_text = props.pinned ? 'unpin' : 'pin';
    var css_class_list = "pinned-toggle pinned-status-";   
    props.pinned ? css_class_list += 'on' : css_class_list += 'off';

    return <button class={css_class_list} onClick={toggle_pinned}>{display_text}</button>
}

// Read Comment: edit button at the bottom
function CommentEditButton(props){
    if(!props.user_is_owner){
        return null;
    }
    return <button class="edit-comment" onClick={() => props.edit_mode(true)}>edit</button>
}



// Comment Editor main
function CommentEditor(props){
    // Set local states for the editor (changes should only be passed up to the "main" state on submit)
    const [contents, setContents] = React.useState(props.comment.contents);
    const [isPrivate, setPrivate] = React.useState(props.comment.private);
    const [isPinned, setPinned] = React.useState(props.comment.pinned);
    const [isHighlighted, setHighlighted] = React.useState(props.comment.highlighted);

    const [backendError, setBackendError] = React.useState(null);

    function handle_content_change(e){
        setContents(e.target.value);
    }
    function update_private(e){
        setPrivate(e.target.checked);
    }
    function update_pinned(e){
        setPinned(e.target.checked);
    }
    function update_highlighted(e){
        setHighlighted(e.target.checked);
    }

    // Changes to "pass up" on submit or delete
    function submit_comment(){
        save_comment();
    }

    const save_comment = () => {
        const url = `${props.url_comments}?id=${props.comment.id}`;
        const headers = getFetchHeaders('PUT', state_to_object_be());
        
        fetch(url, headers)
        .then(response => response.json())
        .then(resp_data => {
            if('message' in resp_data){
                setBackendError(resp_data.message);
            }
            else if('job_id' in resp_data){
                props.update_comment(props.comment.id, state_to_object_fe());
                props.edit_mode(false);
            }
        })
        .catch(error => console.log('Error: ', error))
    };

    function state_to_object_be(){
        return {
            contents: contents,
            private: isPrivate,
            pinned: isPinned,
            highlighted: isHighlighted
        };
    }

    function state_to_object_fe(){
        // These are the same atm
        return state_to_object_be();
    }

    function delete_comment(){
        props.delete_comment(props.comment.id);
    }

    function remove_error(){
        setBackendError(null);
    }

    return [
        <div class="job-comment-cu-container panel form-like">
            <button class="close" onClick={() => props.edit_mode(false) }><span>close</span></button>
            <h4>Edit Comment</h4>
            <BackendError   message = {backendError}
                            turn_off_error = { remove_error } />
            <textarea id="id_comment_contents" name="contents" cols="30" rows="5" value={contents} onChange={handle_content_change}></textarea>
            <CommentEditorCheckboxes    c = {props.comment} 
                                        is_private = { isPrivate }
                                        handle_private_change = { update_private }
                                        is_pinned = { isPinned }
                                        handle_pinned_change =  { update_pinned }
                                        is_highlighted = { isHighlighted }
                                        handle_highlighted_change = { update_highlighted }
                                         />
            <EditorControls     submit = { submit_comment }
                                delete = { delete_comment }
                                want_delete = { true }
                                />
        </div>
    ]
}

// Comment Editor: the strip of checkboxes for private, pinned and highlighted
function CommentEditorCheckboxes(props){
    const ID_COMMENT_CHECKBOX_PRIVATE = 'id_private_checkbox';
    const ID_COMMENT_CHECKBOX_PINNED = 'id_pinned_checkbox';
    const ID_COMMENT_CHECKBOX_HIGHLIGHTED = 'id_highlighted_checkbox';
    return [
        <div class="checkbox-container">
            <label for={ID_COMMENT_CHECKBOX_PRIVATE}>Private</label>
            <input type="checkbox" id={ID_COMMENT_CHECKBOX_PRIVATE} checked={ props.is_private } onChange={props.handle_private_change}></input>
            <label for={ID_COMMENT_CHECKBOX_PINNED}>Pin</label>
            <input type="checkbox" id={ID_COMMENT_CHECKBOX_PINNED} checked={ props.is_pinned } onChange={props.handle_pinned_change}></input>
            <label for={ID_COMMENT_CHECKBOX_HIGHLIGHTED}>Highlight</label>
            <input type="checkbox" id={ID_COMMENT_CHECKBOX_HIGHLIGHTED} checked={ props.is_highlighted } onChange={(e) => props.handle_highlighted_change(e)}></input>
        </div>
    ]
}

