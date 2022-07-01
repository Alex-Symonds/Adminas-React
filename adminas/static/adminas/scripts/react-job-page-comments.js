/*
    Summary:
    Comments section on Job page

    Contents:
        || Main section
        || Subsections
        || Individual Comments
        || Comment Reader
            Note: the vanilla JS had two types of comments, "collapsable" and "full". "Full" comments don't appear on the Job page,
                  so only "collapsable" has been React-ified
        || Comment Editor
*/

// Note: these const strings are currently used for three different things:
//  >> CSS class
//  >> An identifier for which section we're in (i.e. "if(section_name === PINNED_STRING)...")
//  >> A verb to display on-screen as part of a string (i.e. "No comments have been { PINNED_STRING } by you")
const PINNED_STRING = 'pinned';
const HIGHLIGHTED_STRING = 'highlighted';


// || Main section
function JobComments(props){

    // Comment-related states
    const [urlComments, setUrl] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [comments, setComments] = React.useState([]);

    // For comments, the active_edit state stores an ID AND a section name instead of just the ID. This is because
    // a comment which is both pinned and highlighted will appear in both sections, so using the ID alone would result in 
    // an unnecessary second editor window (for the comment with the same ID, but in the other section).
    const [activeEdit, setActiveEdit] = React.useState([null, null]);
    const editor_state = get_and_set(activeEdit, setActiveEdit);

    // Load inital comments data from server
    const { data, error, isLoaded } = useFetch(url_for_page_load(props.URL_GET_DATA, props.job_id, 'comments'));
    React.useEffect(() => {
        set_if_ok(data, 'url', setUrl);
        set_if_ok(data, 'username', setUsername);
        set_if_ok(data, 'comments', setComments);
    }, [data]);

    // State updates and packaging it up for passing downwards
    function update_comment(comment_id, comment_attributes){
        list_state_update(comments, setComments, 'id', comment_id, comment_attributes);
    }

    function remove_comment(comment_id){
        list_state_delete(comments, setComment, 'id', comment_id); 
    }

    const actions_comments = get_actions_object(urlComments, null, update_comment, remove_comment);

    // Rendering
    if(error){
        return <LoadingErrorUI name='comments' />
    }
    else if (!isLoaded){
        return <LoadingUI />
    }
    return <JobCommentsUI   actions_comments = { actions_comments }
                            comments = { comments }
                            editor_state = { editor_state }
                            username = { username }
                            />
}

function JobCommentsUI(props){
    let num_comments = props.comments === null ? 0 : props.comments.length;
    return [
        <section id="job_comments" class="item">
            <h3>Comments</h3>
            <a href={`${props.actions_comments.url}?page=1`}>See all { num_comments } comments</a>
            <JobCommentsSubsection  actions_comments = { props.actions_comments }
                                    comments = { props.comments }
                                    editor_state = { props.editor_state }
                                    section_name = { PINNED_STRING }
                                    username = { props.username } 
                                    />                                         
            <JobCommentsSubsection  actions_comments = { props.actions_comments }
                                    comments = { props.comments } 
                                    editor_state = { props.editor_state }
                                    section_name = { HIGHLIGHTED_STRING }
                                    username = { props.username }
                                    />
        </section>
    ]
}

// || Subsections
function JobCommentsSubsection(props){
    // props.comments contains ALL the comments: filter out ones that don't belong in this section
    var filtered_comments = filter_comments(props.comments, props.section_name);

    return <JobCommentsSubsectionUI actions_comments = { props.actions_comments }
                                    editor_state = { props.editor_state }
                                    filtered_comments = { filtered_comments }
                                    section_name = { props.section_name }
                                    username = { props.username }
                                    />
}

function JobCommentsSubsectionUI(props){
    return [
        <section class="subsection">
            <h4>{ capitaliseFirstLetter(props.section_name) } by {props.username}</h4>
            <div class={ 'comment-container empty-paragraph ' + props.section_name }>
                <CommentsEmpty  comments = { props.filtered_comments }
                                verbed = { props.section_name } />
                { props.filtered_comments.map((comment) => {
                    return <Comment key = { comment.id.toString() }
                                    actions_comments = { props.actions_comments }
                                    comment = { comment }
                                    editor_state = { props.editor_state }
                                    section_name = { props.section_name }
                                    />
                })}
            </div>
        </section>
    ] 
}

function filter_comments(comments, section_identifier){
    if(comments === null){
        return [];
    }

    if(section_identifier == PINNED_STRING){
        return comments.filter(c => c.pinned);
    }
    else if (section_identifier == HIGHLIGHTED_STRING){
        return comments.filter(c => c.highlighted);
    }
    return comments;
}

function CommentsEmpty(props){
    if (props.comments !== null && props.comments.length > 0){
        return null;
    }
    return <EmptySectionUI message = {`No comments have been ${ props.verbed }.`} />
}

// || Individual Comments
function Comment(props){

    // Setup edit so children don't need to worry about the details
    const editor = get_editor_object(`${props.comment.id}_${props.section_name}`, props.editor_state.get, props.editor_state.set);

    // Determine if this comment is the active_edit comment. If so, render the editor.
    if(editor.is_active){
        return <CommentEditor   actions_comments = { props.actions_comments }
                                comment = { props.comment }
                                editor  = { editor } />
    }

    // Otherwise render the "normal" comment
    return <CommentReaderUI actions_comments = { props.actions_comments }
                            comment = {props.comment}
                            editor  = { editor } />
}

// || "Normal" Comment (aka READ comment)
function CommentReaderUI(props){
    var css_class_list = "one-comment";
    css_class_list += props.comment.private ? ' private' : ' public';  // Update CSS class list for public/private
    css_class_list += props.comment.highlighted ? ' ' + HIGHLIGHTED_STRING : ''; // Update CSS class list for highlighted

    return [
        <article class={ css_class_list }>
            <details>
                <summary>
                    <CommentContentsMainUI  comment = { props.comment } />
                </summary>
                <CommentContentsFooter  actions_comments = { props.actions_comments }
                                        comment = { props.comment }
                                        editor = { props.editor }
                                        />
            </details>
        </article>  
    ]
}

// Read Comment: the section with the "private" icon and the user's waffle
function CommentContentsMainUI(props){
    return [
        <span class="main">
            {props.comment.user_is_owner && props.comment.private ? <div class="privacy-status">[PRIVATE]</div>: ''}
            <span class="contents">{props.comment.contents}</span>
        </span>
    ]
}

// Read Comment: the bit at the bottom, with the author, timestamp and buttons (pin, highlight and edit)
function CommentContentsFooter(props){
    const [backendError, setBackendError] = React.useState(null);
    const backend_error = get_backend_error_object(backendError, setBackendError);

    function toggle_pinned(){
        toggle_comment_from_icon({pinned: !props.comment.pinned});
    }
    function toggle_highlighted(){
        toggle_comment_from_icon({highlighted: !props.comment.highlighted});
    }

    function toggle_comment_from_icon(attributes){
        const url = `${props.actions_comments.url}?id=${props.comment.id}`;
        const headers = getFetchHeaders('PUT', attributes);
        update_server(url, headers, resp_data => {
                if('message' in resp_data){
                    backend_error.set(resp_data.message);
                }
                else if('ok' in resp_data){
                    props.actions_comments.update_f(props.comment.id, attributes);
                }
        });
    }




    function OLDtoggle_comment_from_icon(attributes){
        const url = `${props.actions_comments.url}?id=${props.comment.id}`;
        const headers = getFetchHeaders('PUT', attributes);

        fetch(url, headers)
        .then(response => response.json())
        .then(resp_data => {
            if('message' in resp_data){
                backend_error.set(resp_data.message);
            }
            else if('ok' in resp_data){
                props.actions_comments.update_f(props.comment.id, attributes);
            }
        })
        .catch(error => console.log('Error: ', error))
    }

    return <CommentContentsFooterUI backend_error = { backend_error }
                                    comment = { props.comment }
                                    editor = { props.editor }
                                    toggle_highlighted = { toggle_highlighted }
                                    toggle_pinned = { toggle_pinned }
                                    />
}

function CommentContentsFooterUI(props){
    return [
        <section class="footer">
            <div class="ownership">
                {props.comment.created_by} on {props.comment.created_on }
            </div>
            <div class="controls">
                <BackendErrorUI message = { props.backend_error.message }
                                turn_off_error = { props.backend_error.clear } />
                <CommentPinnedButtonUI  handle_toggle = { props.toggle_pinned }
                                        pinned = { props.comment.pinned } />
                <CommentHighlightButtonUI   handle_toggle = { props.toggle_highlighted } />
                <CommentEditButtonUI    editor = { props.editor }
                                        user_is_owner = { props.comment.user_is_owner } />
            </div>
        </section>
    ] 
}


// Read Comment: the pinned button at the bottom
function CommentPinnedButtonUI(props){
    const display_text = props.pinned ? 'unpin' : 'pin';

    const on_or_off = props.pinned ? 'on' : 'off';
    const css_class_list = `pinned-toggle pinned-status-${on_or_off}`;

    return <button class={css_class_list} onClick={ props.handle_toggle }>{display_text}</button>
}

// Read Comment: the highlight button at the bottom
function CommentHighlightButtonUI(props){
    return <button class="highlighted-toggle" onClick={ props.handle_toggle }>+/- highlight</button>
}

// Read Comment: edit button at the bottom
function CommentEditButtonUI(props){
    if(!props.user_is_owner){
        return null;
    }
    return <button class="edit-comment" onClick={ props.editor.on }>edit</button>
}



// || Comment Editor
function CommentEditor(props){
    
    // Set local states for the editor and package up for passing to UI
    const [contents, setContents] = React.useState(props.comment.contents);
    const [isPrivate, setPrivate] = React.useState(props.comment.private);
    const [isPinned, setPinned] = React.useState(props.comment.pinned);
    const [isHighlighted, setHighlighted] = React.useState(props.comment.highlighted);

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

    const controlled = {
        contents: get_and_set(contents, handle_content_change),
        private: get_and_set(isPrivate, update_private),
        pinned: get_and_set(isPinned, update_pinned),
        highlighted: get_and_set(isHighlighted, update_highlighted)
    }

    // Update/Delete support
    const [backendError, setBackendError] = React.useState(null);
    const backend_error = get_backend_error_object(backendError, setBackendError);

    // Update
    function handle_submit(){
        save_comment();
    }

    const save_comment = () => {
        const url = `${props.actions_comments.url}?id=${props.comment.id}`;
        const headers = getFetchHeaders('PUT', state_to_object_be());
        
        fetch(url, headers)
        .then(response => response.json())
        .then(resp_data => {
            if('message' in resp_data){
                setBackendError(resp_data.message);
            }
            else if('ok' in resp_data){
                props.actions_comments.update_f(props.comment.id, state_to_object_fe());
                props.editor.off();
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
        return state_to_object_be();
    }

    // Delete
    function handle_delete(){
        delete_comment();
    }

    function delete_comment(){
        const url = `${props.actions_comments.url}?id=${props.comment.id}`;
        const headers = getFetchHeaders('DELETE', null);
        
        fetch(url, headers)
        .then(response => jsonOr204(response))
        .then(resp_data => {
            if(resp_data === 204){
                props.actions_comments.delete_f(props.comment.id);
            }
            else if('message' in resp_data){
                backend_error.set(resp_data.message);
            }
            else {
                backend_error.set('Delete failed');
            }
        })
        .catch(error => console.log('Error: ', error))
    }

    return <CommentEditorUI backend_error = { backend_error }
                            controlled = { controlled }
                            editor = { props.editor }
                            handle_delete = { handle_delete }
                            handle_submit = { handle_submit }     
                            />
}

function CommentEditorUI(props){
    return [
        <div class="job-comment-cu-container panel form-like">
            <button class="close" onClick={ props.editor.off }><span>close</span></button>
            <h4>Edit Comment</h4>
            <BackendErrorUI message = { props.backend_error.message }
                            turn_off_error = { props.backend_error.clear } />
            <textarea id="id_comment_contents" name="contents" cols="30" rows="5" value={ props.controlled.contents.get } onChange={ props.controlled.contents.set }></textarea>
            <CommentEditorCheckboxes controlled = { props.controlled } />
            <EditorControls delete = { props.handle_delete }
                            submit = { props.handle_submit } 
                            want_delete = { true }
                            />
        </div>
    ]
}

// Comment Editor: the strip of checkboxes for private, pinned and highlighted
function CommentEditorCheckboxes(props){
    // Set IDs here so that "for" on the label and "id" on the input/select/whatever will always match
    const ID_COMMENT_CHECKBOX_PRIVATE = 'id_private_checkbox';
    const ID_COMMENT_CHECKBOX_PINNED = 'id_pinned_checkbox';
    const ID_COMMENT_CHECKBOX_HIGHLIGHTED = 'id_highlighted_checkbox';

    return [
        <div class="checkbox-container">
            <label for={ID_COMMENT_CHECKBOX_PRIVATE}>Private</label>
            <input type="checkbox" id={ID_COMMENT_CHECKBOX_PRIVATE} checked={ props.controlled.private.get } onChange={ props.controlled.private.set }></input>
            <label for={ID_COMMENT_CHECKBOX_PINNED}>Pin</label>
            <input type="checkbox" id={ID_COMMENT_CHECKBOX_PINNED} checked={ props.controlled.pinned.get } onChange={ props.controlled.pinned.set }></input>
            <label for={ID_COMMENT_CHECKBOX_HIGHLIGHTED}>Highlight</label>
            <input type="checkbox" id={ID_COMMENT_CHECKBOX_HIGHLIGHTED} checked={ props.controlled.highlighted.get } onChange={ props.controlled.highlighted.set }></input>
        </div>
    ]
}
