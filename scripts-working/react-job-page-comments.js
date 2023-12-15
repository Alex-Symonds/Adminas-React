/*
    Summary:
    Comments section on Job page

    Contents:
        || Consts
        || JobComments (for the Job page)
        || Subsections (to separate pinned and highlighted)
        || Individual Comments
        || CommentReader
            Note: the vanilla JS has two types of comments, "collapsable" and "full". "Full" comments don't appear on the Job page,
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
    let num_comments = props.comments === null ? 0 : props.comments.length;
    return [
        <section id="job_comments" class="job-section">
            <h3>Comments</h3>
            <a href={`${ props.commentsURL }&page=1`}>See all { num_comments } comments</a>
            <JobCommentsSubsection  
                actions = { props.commentsActions }
                comments = { props.comments }
                commentsEditor = { props.commentsEditor }
                sectionName = { PINNED_STRING }
                username = { props.username } 
            />                                         
            <JobCommentsSubsection  
                actions = { props.actionsComments }
                comments = { props.comments } 
                commentsEditor = { props.commentsEditor }
                sectionName = { HIGHLIGHTED_STRING }
                username = { props.username }
            />
        </section>
    ]
}

// || Subsections
function JobCommentsSubsection(props){
    var commentsFiltered = filter_comments(props.comments, props.sectionName);
    return [
        <section class="subsection jobCommentSection">
            <h4>{ capitaliseFirstLetter(props.sectionName) } by {props.username}</h4>
            <div class={ 'comment-container ' + props.sectionName }>
                <CommentsEmpty  
                    comments = {commentsFiltered }
                    verbed = { props.sectionName } 
                />
                { commentsFiltered.map((comment) => {
                    return  <Comment key = { comment.id.toString() }
                                actions = { props.actions }
                                comment = { comment }
                                commentsEditor = { props.commentsEditor }
                                sectionName = { props.sectionName }
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
    const editor = get_editor_object(
        props.commentsEditor.convertToIDStr([props.comment.id, props.sectionName]), 
        props.commentsEditor.activeIDStr, 
        props.commentsEditor.set);

        return  <>
                    { editor.is_active ?
                        <CommentEditor   
                            actions = { props.actions }
                            comment = { props.comment }
                            editor  = { editor } 
                        />
                        : null
                    }
                    <CommentReader 
                        actions = { props.actions }
                        comment = { props.comment }
                        editor  = { editor } 
                    />
                </>
}

// || CommentReader
function CommentReader(props){
    var css_class_list = "one-comment";
    css_class_list += props.comment.private ? ' private' : ' public';  // Update CSS class list for public/private
    css_class_list += props.comment.highlighted ? ' ' + HIGHLIGHTED_STRING : ''; // Update CSS class list for highlighted

    return [
        <article class={ css_class_list }>
            <details class="wrapper">
                <summary class="comment-body">
                    <CommentReaderBodyUI  
                        comment = { props.comment } 
                    />
                </summary>
                <CommentReaderFooter  
                    actions = { props.actions }
                    comment = { props.comment }
                    editor = { props.editor }
                />
            </details>
        </article>  
    ]
}


function CommentReaderBodyUI(props){
    let privacyCss = 'public-status';
    let privacyStr = 'public';
    if(props.comment.user_is_owner && props.comment.private){
        privacyCss = 'privacy-status';
        privacyStr = 'PRIVATE';
    }

    return [
        <span class="main">
            <div class={ privacyCss }>
                [{ privacyStr }]
            </div>
            <CommentContentsWithLinebreaks 
                text = { props.comment.contents } 
            />
        </span>
    ]
}

function CommentContentsWithLinebreaks(props){
    if(!props.text.includes('\n')){
        var contents = <p>{ props.text }</p>;
    }
    else{
        var contents = props.text.split('\n').map((pcontents) => {
            return (
                <span>
                    {pcontents}
                    <br />
                </span>
            )
        });
    }
    return [
        <span class="contents">
            { contents }
        </span>
    ]
}


function CommentReaderFooter(props){
    const {
        backend_error,
        toggle_highlighted,
        toggle_pinned,
    } = useCommentReaderToggles(props.actions, props.comment);

    return [
        <section class="footer">
            <div class="ownership">
                {props.comment.created_by} on {props.comment.created_on }
            </div>
            <div class="controls">
                <BackendErrorUI 
                    message = { backend_error.message }
                    turn_off_error = { backend_error.clear } 
                />
                <CommentPinnedButtonUI  
                    handle_toggle = { toggle_pinned }
                     pinned = { props.comment.pinned } 
                />
                <CommentHighlightButtonUI   
                    handle_toggle = { toggle_highlighted } 
                />
                <CommentEditButtonUI    
                    editor = { props.editor }
                    user_is_owner = { props.comment.user_is_owner } 
                />
            </div>
        </section>
    ] 
}


function CommentPinnedButtonUI(props){
    const display_text = props.pinned ? 'unpin' : 'pin';
    const on_or_off = props.pinned ? 'on' : 'off';

    return  <button 
                class={`pinned-toggle pin-${on_or_off}`} 
                onClick={ props.handle_toggle }
            >
                {display_text}
            </button>
}


function CommentHighlightButtonUI(props){
    return  <button 
                class="highlighted-toggle" 
                onClick={ props.handle_toggle }
            >
                +/- highlight
            </button>
}


function CommentEditButtonUI(props){
    if(!props.user_is_owner){
        return null;
    }
    return  <button 
                class="edit-comment" 
                onClick={ props.editor.on }
            >
                edit
            </button>
}


function useCommentReaderToggles(actions, comment){
    const [backendErrorState, setBackendErrorState] = React.useState(null);
    const backendErrorObj = get_backend_error_object(backendErrorState, setBackendErrorState);

    /* 
    Fretting about the absense of controlled states for the toggles?
    ---------------------------------------------------------------------------
     These are the toggles in /the reader/ and not the editor. When clicked they 
     should take effect immediately, rather than waiting for a separate "sumbit" 
     action.
     Since there's no need to "pool" changes for the submit, these just directly
     display/update the main comments state.
    */

    function toggle_pinned(){
        toggle_comment_from_icon({pinned: !comment.pinned});
    }
    function toggle_highlighted(){
        toggle_comment_from_icon({highlighted: !comment.highlighted});
    }

    function toggle_comment_from_icon(attributes){
        const url = `${actions.url}?id=${comment.id}`;
        const headers = getFetchHeaders('PUT', attributes);

        update_server(url, headers, resp_data => {
            if(status_is_good(resp_data, 204)){
                actions.update_f(comment.id, attributes);
            }
            else {
                backendErrorObj.set(get_error_message(resp_data));
            }
        });
    }

    return {
        backend_error: backendErrorObj,
        toggle_highlighted,
        toggle_pinned,
    }
}


// || Comment Editor
function CommentEditor(props){
    const {
        backend_error,
        controlled,
        handle_delete,
        handle_submit,
    } = useCommentEditor(props.actions, props.editor, props.comment);

    return [
        <Modal close={props.editor.off}>
            <div class="commentEditor">
                <h3 className={"modal_heading"}>Edit Comment</h3>
                <div className={"modal_contents"}>
                    <BackendErrorUI message = { backend_error.message }
                                    turn_off_error = { backend_error.clear } />
                    <form className={"commentEditor_form"}>

                        <label for={"id_comment_contents"} className={"sr-only"}>Contents</label>
                        <textarea 
                            id="id_comment_contents" 
                            className={"commentEditor_editText"}
                            name="contents" 
                            cols="30" rows="5" 
                            value={ controlled.contents.get } 
                            onChange={ controlled.contents.set }
                        >
                        </textarea>
                        <CommentEditorCheckboxes
                            controlled = { controlled }
                        />
                        <EditorControls 
                            delete = { handle_delete }
                            submit = { (e) => { e.preventDefault(); handle_submit() } } 
                            want_delete = { true }
                        />
                    </form>
                </div>       
            </div>
        </Modal>
    ]
}


function CommentEditorCheckboxes({ controlled }){
    return  <div class="commentEditor_checkboxesContainer">
                <CheckboxWithLabel
                    idStr = { 'id_private_checkbox' }
                    labelStr = { "Private" }
                    isChecked = { controlled.private.get }
                    onChange = { controlled.private.set }
                />
                <CheckboxWithLabel
                    idStr = { 'id_pinned_checkbox' }
                    labelStr = { "Pin" }
                    isChecked = { controlled.pinned.get }
                    onChange = { controlled.pinned.set }
                />
                <CheckboxWithLabel
                    idStr = { 'id_highlighted_checkbox' }
                    labelStr = { "Highlight" }
                    isChecked = { controlled.highlighted.get }
                    onChange = { controlled.highlighted.set }
                />
            </div>
}


function CheckboxWithLabel({idStr, labelStr, isChecked, onChange }){
    return  <div className={"checkboxWithLabel"}>
                <label 
                    for={ idStr }
                    className={"checkboxWithLabel_label"}
                >
                    { labelStr }
                </label>
                <input 
                    type="checkbox" 
                    id={ idStr } 
                    checked={ isChecked } 
                    onChange={ onChange }
                >
                </input>
            </div>
}


function useCommentEditor(actions, editor, comment){
    const [contents, setContents] = React.useState(comment.contents);
    const [isPrivate, setPrivate] = React.useState(comment.private);
    const [isPinned, setPinned] = React.useState(comment.pinned);
    const [isHighlighted, setHighlighted] = React.useState(comment.highlighted);

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
        contents: getter_and_setter(contents, handle_content_change),
        private: getter_and_setter(isPrivate, update_private),
        pinned: getter_and_setter(isPinned, update_pinned),
        highlighted: getter_and_setter(isHighlighted, update_highlighted)
    }

    const [backendError, setBackendError] = React.useState(null);
    const backend_error = get_backend_error_object(backendError, setBackendError);

    function handle_submit(){
        save_comment();
    }

    const save_comment = () => {
        const url = `${ actions.url }?id=${ comment.id }`;
        const headers = getFetchHeaders('PUT', state_to_object_be());
        
        update_server(url, headers, resp_data => {
            if(status_is_good(resp_data, 204)){
                actions.update_f(comment.id, state_to_object_fe());
                editor.off();
            }
            else {
                backend_error.set(get_error_message(resp_data));
            }
        });
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

    function handle_delete(){
        delete_comment();
    }

    function delete_comment(){
        const url = `${ actions.url }&id=${ comment.id }`;
        const headers = getFetchHeaders('DELETE', null);

        update_server(url, headers, resp_data => {
            if(status_is_good(resp_data, 204)){
                actions.delete_f(comment.id);
            }
            else{
                backend_error.set(get_error_message(resp_data));
            }

        });
    }

    return {
        backend_error,
        controlled,
        handle_delete,
        handle_submit,
    }
}
