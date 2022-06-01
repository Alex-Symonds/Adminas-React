// || JobComments
function JobComments(props){
    const [error, setError] = React.useState(null);
    const [isLoaded, setLoaded] = React.useState(false);
    const [urlCommentsPage, setUrl] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [comments, setComments] = React.useState([]);

    React.useEffect(() => {
        const fetchData = async () => {
            const result = await fetch(`${props.URL_GET_DATA}?job_id=${props.job_id}&type=page_load&name=comments`)
            .then(response => {
                if(response.status == 200){
                    return response.json();
                } else {
                    throw new Error('Page data failed to load');
                }
            })
            .then(data => {
                setUrl(data.url + '?page=1');
                setUsername(data.username);
                setComments(data.comments);
                setLoaded(true);
            })
            .catch(error => {
                setError(error);
                setLoaded(true);
                console.log('Error: ', error);
            });
        };

        fetchData();

    }, [isLoaded]);



    if(error){
        return <div>Error loading comments.</div>
    }
    else if (!isLoaded){
        return <div>Loading...</div>
    }
    return [
        <section id="job_comments" class="item">
            <h3>Comments</h3>
            <a href={urlCommentsPage}>See all {comments.length} comments</a>
            <JobCommentsSubsection title='Pinned'       css_class='pinned'       username={username} comments={comments} />
            <JobCommentsSubsection title='Highlighted'  css_class='highlighted'  username={username} comments={comments} />
        </section>
    ]
}

function JobCommentsSubsection(props){
    var css_classes = 'comment-container empty-paragraph ' + props.css_class;
    var filtered_comments = filter_comments(props.comments, props.css_class);

    if (filtered_comments.length == 0){
        var content = <p class="empty-section-notice">No comments have been { props.css_class }</p>;
    }
    else {
        var content = <CommentsBlock comments={filtered_comments} />
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
                    <CommentContentsMain    user_is_owner={props.c.user_is_owner}
                                            private={props.c.private}
                                            contents={props.c.contents} />
                </summary>
                <CommentContentsFooter  created_by={props.c.created_by}
                                        created_on={props.c.created_on}
                                        pinned={props.c.pinned}
                                        user_is_owner={props.c.pinned} />
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
    return [
        <section class="footer">
            <div class="ownership">
                {props.created_by} on {props.created_on }
            </div>
            <div class="controls">
                <CommentPinnedButton pinned={props.pinned}/>
                <button class="highlighted-toggle">+/- highlight</button>
                <CommentEditButton user_is_owner={props.user_is_owner}/>
            </div>
        </section>
    ]
}

function CommentPinnedButton(props){
    var display_text = props.pinned ? 'unpin' : 'pin';
    var css_class_list = "pinned-toggle pinned-status-";
    props.pinned ? css_class_list += 'on' : css_class_list += 'off';
    return <button class={css_class_list}>{display_text}</button>
}

function CommentEditButton(props){
    if(props.user_is_owner){
        return <button class="edit-comment">edit</button>
    }
    return null;
}