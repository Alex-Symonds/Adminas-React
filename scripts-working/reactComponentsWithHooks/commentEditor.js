/*
    Comment Editor
    || Hook
    || Components
*/

// || Hook
function useCommentEditor(actions, closeFn, comment){
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

    const asyncHelper = useAsyncWithError(closeFn);

    function handle_submit(){
        if(comment.id === undefined || comment.id === 0 || comment.id === '0'){
            asyncHelper.handleAsync(() => actions.create(state_to_object_fe(), state_to_object_be()));
        } else {
            asyncHelper.handleAsync(() => actions.update(comment.id, state_to_object_fe(), state_to_object_be()));
        }
    }

    function handle_delete(){
        asyncHelper.handleAsync(() => actions.remove(comment.id));
    }

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

    return {
        backend_error: asyncHelper.asyncError,
        controlled,
        handle_delete,
        handle_submit,
    }
}


// || Components
function CommentEditor({actions, comment, closeFn, title}){
    const {
        backend_error,
        controlled,
        handle_delete,
        handle_submit,
    } = useCommentEditor(actions, closeFn, comment);

    return [
        <Modal close={ closeFn }>
            <div class="commentEditor">
                <h3 className={"modal_heading"}>{ title }</h3>
                <div className={"modal_contents"}>
                { backend_error.message ?
                    <ErrorWithClearUI 
                        message = { backend_error.message }
                        clear = { backend_error.clear } 
                    />
                    : null
                }
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
                            handleDelete = { handle_delete }
                            handleSubmit = { (e) => { e.preventDefault(); handle_submit() } } 
                            wantDelete = { comment.id !== undefined }
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


