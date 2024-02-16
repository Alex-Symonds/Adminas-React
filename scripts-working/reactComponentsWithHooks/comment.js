/*
    Comment-related Components
    || Hook
        > Enables the toggles for pinned and highlighted
    || Wrapper
    || Comment with Edit-in-Place
    || Individual Comment
*/

function useCommentReaderToggles(actions, comment){
    /* 
     When clicked, these should take effect immediately, rather than waiting for 
     a separate "sumbit" action.
     Since there's no need to "pool" changes for the submit, there's no need for
     a separate controlled state, they can just directly update the main state and BE
    */

    function toggle_pinned(){
        toggle_comment_from_icon({ pinned: !comment.pinned });
    }
    function toggle_highlighted(){
        toggle_comment_from_icon({ highlighted: !comment.highlighted });
    }

    const asyncHelper = useAsyncWithError();
    function toggle_comment_from_icon(attributes){
        asyncHelper.handleAsync(() => actions.update(comment.id, attributes, attributes));
    }

    return {
        backend_error: asyncHelper.asyncError,
        toggle_highlighted,
        toggle_pinned,
    }
}


// || Wrapper
function CommentsWrapper({ actions, comments, css, emptyMessage, heading, modalKit, wantCollapsable }){
    return [
        <section className={`subsection jobCommentSection${css !== undefined ? " " + css : ""}`}>
            <h4>{ heading }</h4>
            <div className={'subsection_contentWrapper commentContainer'}>
            { comments === undefined || comments === null || comments.length === 0
                ?
                <EmptySectionUI 
                    css = {"commentSection_empty"} 
                    message = { emptyMessage ?? "No comments on this job" } 
                />
                :
                comments.map((comment) => {
                    return  <Comment key = { comment.id.toString() }
                                actions = { actions }
                                comment = { comment }
                                modalKit = { modalKit }
                                wantCollapsable = { wantCollapsable }
                            />
                })
            }
            </div>
        </section>
    ] 
}

// || Comment with Edit-in-Place
function Comment({ actions, comment, modalKit, wantCollapsable }){
    const ID_FOR_MODAL = `job_comment_edit_${comment.id}`;
    return  <>
                { modalKit.isOpenedBy(ID_FOR_MODAL) ?
                    <CommentEditor   
                        actions = { actions }
                        closeFn  = { modalKit.close } 
                        comment = { comment }
                        title = { "Edit Comment" }
                    />
                    : null
                }
                <CommentReader 
                    actions = { actions }
                    comment = { comment }
                    commentEditorIsUnavailable = { modalKit.isOpen() }
                    openCommentEditor = { () => modalKit.open(ID_FOR_MODAL) }
                    wantCollapsable = { wantCollapsable }
                />
            </>
}


// || Individual Comment
function CommentReader({ actions, comment, commentEditorIsUnavailable, openCommentEditor, wantCollapsable }){
    let css_class_list = "one-comment";
    css_class_list += comment.private ? ' private' : ' public';  // Update CSS class list for public/private
    css_class_list += comment.highlighted ? ' highlighted' : ''; // Update CSS class list for highlighted

    const WrapperTag = wantCollapsable ? "details" : "div";
    const ContentTag = wantCollapsable ? "summary" : "section";

    return  <article class={ css_class_list }>
                <WrapperTag class="wrapper">
                    <ContentTag class="comment-body">
                        <CommentReaderBodyUI  
                            comment = { comment } 
                        />
                    </ContentTag>
                    <CommentReaderFooter  
                        actions = { actions }
                        comment = { comment }
                        commentEditorIsUnavailable = { commentEditorIsUnavailable }
                        openCommentEditor = { openCommentEditor }
                    />
                </WrapperTag>
            </article>

}


function CommentReaderBodyUI({ comment }){
    const privacy = comment.user_is_owner && comment.private
        ? { css: 'privacy-status', srStr: 'PRIVATE'}
        : { css: 'public-status', srStr: 'public' };

    return [
        <span class="main">
            <div class={ privacy.css }>
                [{ privacy.srStr }]
            </div>
            <CommentContentsWithLinebreaks 
                text = { comment.contents } 
            />
        </span>
    ]
}


function CommentContentsWithLinebreaks({ text }){
    if(!text.includes('\n')){
        var contents = <p>{ text }</p>;
    }
    else{
        var contents = text.split('\n').map((pcontents) => {
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


function CommentReaderFooter({ actions, comment, commentEditorIsUnavailable, openCommentEditor }){
    const {
        backend_error,
        toggle_highlighted,
        toggle_pinned,
    } = useCommentReaderToggles(actions, comment);

    return  <CommentReaderFooterUI
                backendError = {backend_error}
                comment = { comment }
                commentEditorIsUnavailable = { commentEditorIsUnavailable }
                openCommentEditor = { openCommentEditor }
                togglePinned = { toggle_pinned }
                toggleHighlighted = { toggle_highlighted }
            />
}

function CommentReaderFooterUI({ backendError, comment, commentEditorIsUnavailable, openCommentEditor, togglePinned, toggleHighlighted }){
    return [
        <section class="footer">
            <div class="ownership">
                { comment.created_by } on { comment.created_on_str }
            </div>
            <div class="controls">
            { backendError.message ?
                <ErrorWithClearUI 
                    message = { backendError.message }
                    close = { backendError.clear } 
                />
                : null
            }
                <CommentPinnedButtonUI  
                    handle_toggle = { togglePinned }
                    pinned = { comment.pinned } 
                />
                <CommentHighlightButtonUI   
                    handle_toggle = { toggleHighlighted } 
                />
            { comment.user_is_owner ?
                <CommentEditButtonUI    
                    commentEditorIsUnavailable = { commentEditorIsUnavailable }
                    openCommentEditor = { openCommentEditor }
                />
                : null
            }
            </div>
        </section>
    ] 
}


function CommentPinnedButtonUI({ pinned, handle_toggle }){
    const display_text = pinned ? 'unpin' : 'pin';
    const on_or_off = pinned ? 'on' : 'off';

    return  <button 
                class={`pinned-toggle pin-${on_or_off}`} 
                onClick={ handle_toggle }
            >
                {display_text}
            </button>
}


function CommentHighlightButtonUI({ handle_toggle }){
    return  <button 
                class="highlighted-toggle" 
                onClick={ handle_toggle }
            >
                +/- highlight
            </button>
}


function CommentEditButtonUI({ commentEditorIsUnavailable, openCommentEditor }){
    return  <button 
                class="edit-comment" 
                disabled = { commentEditorIsUnavailable }
                onClick={ openCommentEditor }
            >
                edit
            </button>
}
