function JobPage(){
    // Stuff to be fetched from the backend or something
    const job_id = 2;
    const job_name = '2108-001';
    const customer_name = 'Aardvark';
    const currency = 'GBP';

    // State plan:
    //  item_list[]
    //  po_list[]
    //  price_accepted (boolean)

    // This to be derived from states
    var root_statuses = [
        [STATUS_CODE_ATTN, 'Special item'],
        [STATUS_CODE_ACTION, 'PO missing'],
        [STATUS_CODE_ACTION, 'Price not accepted'],
        [STATUS_CODE_OK, 'testing OK status']
    ];

    return [
        <div>
            <JobHeadingSubsection   job_id={job_id}
                                    job_name={job_name}
                                    customer_name={customer_name}
                                    root_statuses={root_statuses} />
            <JobContents    job_id={job_id}
                            currency={currency}
                            customer_name={customer_name}
                            job_name={job_name} />
        </div>
    ]
}

function JobContents(props){

    return [
        <div class="job-page-sections-wrapper">
            <JobDetails     job_id = {props.job_id}
                            currency={props.currency}
                            customer_name={props.customer_name}
                            job_name={props.job_name} />
            <section class="job-section pair-related">
                <JobComments />
            </section>
            
        </div>
    ];

    // return [
    //     <JobDetails />,
    //     <JobComments />,
    //     <JobDocuments />,
    //     <JobItems />,
    //     <JobPurchaseOrders />,
    //     <JobPriceChecker />
    // ]
}


// || JobDetails
function JobDetails(props){
    //  ----------------------------------------
    // Things to fetch from the server
    const URL_EDIT_JOB = '/edit_job';
    var info = {
        name: '2108-001',
        agent: 'Baracudax',
        customer: 'Aardvark',
        quote_ref: 'Q210712KP-1',
        country_name: 'United Kingdom',
        language: 'EN',
        invoice_to: ['Address multiple lines, or multiple commas at least, blah de blah', 'Region', 'P05 TC0DE', 'United Kingdom'],
        payment_terms: '30 days from blah blah',
        delivery_to: ['Address multiple lines, but this time different, because delivery', 'Regionyjjd', 'P05 TC0DE', 'United Kingdom'],
        incoterm_code: 'EXW',
        incoterm_location: 'UK'
    };
    //  ----------------------------------------

    const URL_EDIT_THIS_JOB = URL_EDIT_JOB + "?job=" + props.job_id;

    return [
        <section id="job_details" class="job-section">
            <h3>General Details</h3>
            <div class="extended-subheading">
                <a href={URL_EDIT_THIS_JOB} class="edit-icon"><span>edit</span></a>
            </div>
            <JobDetailsIdSection info={info} />
            <JobDetailsPaymentSection   info={info}
                                        currency={props.currency}/>
            <JobDetailsDeliverySection info={info} />
        </section>
    ]
}

function JobDetailsIdSection(props){
    return [
        <section class="subsection">
            <h4>Identification</h4>
            <JobDetailsReadRow heading="Name" value={props.info.name} />
            <JobDetailsReadRow heading="Agent" value={props.info.agent} />
            <JobDetailsReadRow heading="Customer" value={props.info.customer} />
            <JobDetailsReadRow heading="Quote ref" value={props.info.quote_ref} />
            <JobDetailsReadRow heading="Country" value={props.info.country_name} />
            <JobDetailsReadRow heading="Language" value={props.info.language} />
        </section>
    ]
}

function JobDetailsPaymentSection(props){
    return [
        <section id="job_payment_section" class="subsection">
            <h4>Payment</h4>
            <JobDetailsReadRow heading="Invoice address" value={props.info.invoice_to.join(', ')} />
            <JobDetailsReadRow heading="Currency" value={props.currency} />
            <JobDetailsReadRow heading="Payment terms" value={props.info.payment_terms} />
        </section>
    ]
}

function JobDetailsDeliverySection(props){
    return [
        <section id="job_delivery_section" class="subsection">
            <h4>Delivery</h4>
            <JobDetailsReadRow heading="Delivery address" value={props.info.delivery_to.join(', ')} />
            <JobDetailsReadRow heading="Incoterm" value={props.info.incoterm_code + ' ' + props.info.incoterm_location} />
        </section>
    ] 
}

function JobDetailsReadRow(props){
    return [
        <div class="read_row">
            <span class="row-label">{props.heading}: </span>{props.value}
        </div>
    ]
}



// || JobComments
function JobComments(props){
    // dummy data: fetch from server in real life
    const URL_JOB_COMMENTS = '/job/2/comments';
    const username = 'AliceBob';

    var comments = [];      // state
    comments[0] = {
        comment_id: 1,
        private: true,
        highlighted: false,
        pinned: false,
        user_is_owner: true,
        contents: 'Contents of pretend post #1',
        created_by: 'You',
        created_on: '2022-05-24 15:26'
    };
    comments[1] = {
        comment_id: 2,
        private: false,
        highlighted: false,
        pinned: true,
        user_is_owner: true,
        contents: 'Contents of pretend post #2 ajhgd asjdfg HAH',
        created_by: 'You',
        created_on: '2022-05-24 15:27'
    };
    comments[2] = {
        comment_id: 3,
        private: false,
        highlighted: true,
        pinned: true,
        user_is_owner: false,
        contents: "Contents of someone else's pretend post #3, which is someone else's",
        created_by: 'ChloeDave',
        created_on: '2022-05-24 15:27'
    };
    // ------------------------------

    const URL_JOB_COMMENTS_P1 = URL_JOB_COMMENTS + '?page=1';

    return [
        <section id="job_comments" class="item">
            <h3>Comments</h3>
            <a href={URL_JOB_COMMENTS_P1}>See all {comments.length} comments</a>
            <JobCommentsSubsection title='Pinned' css_class='pinned' username={username} comments={comments} />
            <JobCommentsSubsection title='Highlighted' css_class='highlighted' username={username} comments={comments} />
        </section>
    ]
}

function JobCommentsSubsection(props){
    var css_classes = 'comment-container empty-paragraph' + props.css_class;
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
    var comment_ele_list = [];
    for(const idx in props.comments){
        comment_ele_list.push(
            <Comment    comment_id={props.comments[idx].comment_id}
                        private={props.comments[idx].private}
                        highlighted={props.comments[idx].highlighted}
                        pinned={props.comments[idx].pinned}
                        user_is_owner={props.comments[idx].user_is_owner}
                        contents={props.comments[idx].contents}
                        created_by={props.comments[idx].created_by}
                        created_on={props.comments[idx].created_on}    
                    />
        )
    }
    return [
        <div>
            {comment_ele_list}
        </div>
    ]
}

function Comment(props){
    // Note: At the moment, comments on the Job page are only and always collapsed,
    // so I haven't bothered replicating the full-style comment in React.

    var css_class_list = "one-comment id-" + props.comment_id;
    props.private ? css_class_list += ' private' : css_class_list += ' public';
    if(props.highlighted){
        css_class_list += ' highlighted';
    }

    return [
        <article
            class={css_class_list}
            data-comment_id={props.comment_id}
            data-is_private={props.private}
            data-is_pinned={props.pinned}
            data-is_highlighted={props.highlighted}
        >
            <CommentCollapsed   user_is_owner={props.user_is_owner}
                                private={props.private}
                                contents={props.contents}
                                created_by={props.created_by}
                                created_on={props.created_on}
                                pinned={props.pinned}
                            />
        </article>  
    ]
}

function CommentCollapsed(props){    
    return [
        <details>
            <summary>
                <CommentContentsMain    user_is_owner={props.user_is_owner}
                                        private={props.private}
                                        contents={props.contents} />
            </summary>
            <CommentContentsFooter  created_by={props.created_by}
                                    created_on={props.created_on}
                                    pinned={props.pinned}
                                    user_is_owner={props.pinned} />
        </details>
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
    var css_class_list = "pinned-toggle pinned-status-";
    props.pinned ? css_class_list += 'on' : css_class_list += 'off';
    var display_text = props.pinned ? 'unpin' : 'pin';
    return <button class={css_class_list}>{display_text}</button>
}

function CommentEditButton(props){
    if(props.user_is_owner){
        return <button class="edit-comment">edit</button>
    }
    return null;
}






function JobDocuments(props){

}
function JobItems(props){

}
function JobPurchaseOrders(props){

}
function JobPriceChecker(props){

}






// Render it to the page
ReactDOM.render(<JobPage />, document.querySelector(".job-page"));