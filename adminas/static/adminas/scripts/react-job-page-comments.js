// || JobComments
function JobComments(props){
    const [urlCommentsPage, setUrl] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [comments, setComments] = React.useState([]);

    // Load inital comments data from server
    const { data, error, isLoaded } = useFetch(url_for_page_load(props.URL_GET_DATA, props.job_id, 'comments'));
    React.useEffect(() => {
        if(typeof data.url !== 'undefined'){
            setUrl(data.url + '?page=1');
        }

        if(typeof data.username !== 'undefined'){
            setUsername(data.username);
        }

        if(typeof data.comments !== 'undefined'){
            setComments(data.comments);
        }
    }, [data]);


    // Handle edits (whether to content or toggling pinned/highlighted)
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


    // Rendering
    if(error){
        return <LoadingErrorEle name='comments' />
    }
    else if (!isLoaded){
        return <LoadingEle />
    }
    return [
        <section id="job_comments" class="item">
            <h3>Comments</h3>
            <a href={urlCommentsPage}>See all {comments.length} comments</a>
            <JobCommentsSubsection title='Pinned'       css_class='pinned'      username = { username } 
                                                                                comments = { comments } 
                                                                                update_comment = { update_comment }
                                                                                 />
            <JobCommentsSubsection title='Highlighted'  css_class='highlighted' username = { username }
                                                                                comments = { comments }
                                                                                update_comment = { update_comment } />
        </section>
    ]
}

function JobCommentsSubsection(props){
    var css_classes = 'comment-container empty-paragraph ' + props.css_class;
    var filtered_comments = filter_comments(props.comments, props.css_class);

    if (filtered_comments.length == 0){
        var content = <p class="empty-section-notice">No comments have been { props.css_class }.</p>;
    }
    else {
        var content = <CommentsBlock    comments = { filtered_comments }
                                        update_comment = { props.update_comment }
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


function CommentsBlock(props){
    return [
        <div>
            {props.comments.map((comment) => {
                return <Comment key={comment.id.toString()}
                                c={comment}
                                update_comment = { props.update_comment }
                                
                />
            })}
        </div>
    ]
}

// Individual comment components below here
function Comment(props){
    // Comments on the Job page are only and always collapsed.
    // The current plan is to only use React on the Job page, so this only accommodates the
    // "collapse" style of comment.

    var css_class_list = "one-comment id-" + props.c.id;
    props.c.private ? css_class_list += ' private' : css_class_list += ' public';
    if(props.c.highlighted){
        css_class_list += ' highlighted';
    }

    return [
        <article
            class={css_class_list}
            data-comment_id={props.c.comment_id}
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
                                        pinned = { props.c.pinned }
                                        highlighted = { props.c.highlighted }
                                        user_is_owner ={ props.c.user_is_owner }
                                        update_comment = { props.update_comment }
                                        comment_id = { props.c.id } />
            </details>
        </article>  
    ]
}

function CommentContentsMain(props){
    return [
        <span class="main">
            {props.user_is_owner && props.private ? <div class="privacy-status">[PRIVATE]</div>: ''}
            <span class="contents">{props.contents}</span>
        </span>
    ]
}

function CommentContentsFooter(props){

    function toggle_highlight(){
        var want_highlight = !props.highlighted;
        props.update_comment(props.comment_id, {highlighted: want_highlight});
    }

    return [
        <section class="footer">
            <div class="ownership">
                {props.created_by} on {props.created_on } dfjkgh
            </div>
            <div class="controls">
                <CommentPinnedButton    pinned = { props.pinned }
                                        update_comment = { props.update_comment } 
                                        comment_id = { props.comment_id }/>
                <button class="highlighted-toggle" onClick={toggle_highlight}>+/- highlight</button>
                <CommentEditButton user_is_owner={props.user_is_owner} />
            </div>
        </section>
    ]
}

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

function CommentEditButton(props){
    if(props.user_is_owner){
        return <button class="edit-comment">edit</button>
    }
    return null;
}