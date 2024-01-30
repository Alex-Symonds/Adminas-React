/*
    Summary:
    Comments section on Job page

    Contents:
        || Consts
        || Main Section
        || Controls
        || Filter modal
        || Subsections
        || Individual Comments
        || CommentReader
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
    const jobCommentsModal = useJobCommentsModal();
    const orderByKit = useSortByDate();
    const filterKit = useCommentsFilter();

    const filteredAndSortedComments = 
        filterKit
        .applyTo(props.comments)
        .sort((a, b) => {
            const aAsDate = new Date(a.created_on);
            const bAsDate = new Date(b.created_on);
            return orderByKit.activeSortByDate(aAsDate, bAsDate);
    });

    const numCommentsPerPage = 5;
    const paginated = usePagination(filteredAndSortedComments, numCommentsPerPage);

    return [
        <section class="jobComments">
            { jobCommentsModal.activeModal === jobCommentsModal.options.filter ?
                <JobCommentsFilterModal
                    editor = { jobCommentsModal.filterEditor }
                    filterKit = { filterKit }
                    title = { "Filter Comments" }
                />
                : jobCommentsModal.activeModal === jobCommentsModal.options.newComment ?
                    <CommentEditor
                        actions = { props.commentsActions }
                        comment = { {
                            contents: "",
                            private: true,
                            pinned: false,
                            highlighted: false,
                        } }
                        editor  = { jobCommentsModal.newCommentEditor } 
                        title = { "Add Comment" }
                    />
                    : null
            }

            <JobSectionHeadingUI text={"Comments"} />

            <AddButton 
                label={"comment"}
                css={"jobComments_addButton"}
                onClick={ jobCommentsModal.newCommentEditor.on }
            />

            <div class="jobComments_viewExisting">
                <JobCommentsControls 
                    orderByKit = { orderByKit }
                    filterEditor = { jobCommentsModal.filterEditor }
                />
                <JobCommentsSubsection  
                    actions = { props.commentsActions }
                    heading = { filterKit.heading }
                    comments = { paginated.page }
                    commentsEditor = { props.commentsEditor }
                    css = { "jobComments_container" }
                    emptyMessage = { "No comments on this job match the current filter settings" }
                    username = { props.username } 
                    wantCollapsable = { false }
                />
                <PaginationControls
                    currentPage = { paginated.currentPage }
                    numPages = { paginated.numPages }
                    changePageTo = { paginated.changePageTo }
                    pageNumsForButtons = { paginated.getDisplayPageNumbersForNav(1, 1, 1, 1) }
                />
            </div>                                  
        </section>
    ]
}


function AddButton({css, disabled, label, onClick}){
    return  <button
                class={`add-button${ " " + css ?? "" }`}
                onClick={onClick}
                disabled={disabled ?? false}
            >
                { label }
            </button>
}


function useJobCommentsModal(){
    const MODAL_OPTIONS = {
        filter: 1,
        newComment: 2,
    }
    const [showModal, setShowModal] = React.useState(null);
    const newCommentEditor = {
        on: () => { setShowModal(MODAL_OPTIONS.newComment) },
        off: () => { setShowModal(null) }
    }
    const filterEditor = {
        on: () => { setShowModal(MODAL_OPTIONS.filter) },
        off: () => { setShowModal(null) }
    }

    return {
        activeModal: showModal,
        newCommentEditor,
        filterEditor,
        options: MODAL_OPTIONS
    }
}


function useSortByDate(){
    const ORDER_BY_OPTIONS = {
        newestFirst: {
            id: 'newestFirst',
            displayStr: 'Newest first'
        },
        oldestFirst: {
            id: 'oldestFirst',
            displayStr: 'Oldest first'
        }
    }
    const ORDER_BY_FUNCTIONS = {
        [ORDER_BY_OPTIONS.newestFirst.id]: (a, b) => b - a,
        [ORDER_BY_OPTIONS.oldestFirst.id]: (a, b) => a - b,
    }

    const [orderByCode, setOrderByCode] = React.useState(ORDER_BY_OPTIONS.newestFirst.id);

    function updateOrderBy(newOrderByCode){
        function validate(newOrderByCode){
            return Object.entries(ORDER_BY_OPTIONS).some((element) => element[1].id === newOrderByCode);
        }
        if(validate(newOrderByCode)){
            setOrderByCode(newOrderByCode);
            return;
        }
    }

    return {
        activeID: orderByCode,
        activeSortByDate: ORDER_BY_FUNCTIONS[orderByCode],
        options: ORDER_BY_OPTIONS,
        update: updateOrderBy,
    }
}


// || Controls
function JobCommentsControls(props){

    function handleClick(){
        props.filterEditor.on();
    }

    function handleChange(e){
        if(e.target.value === undefined){
            return;
        }
        props.orderByKit.update(e.target.value);
    }

    const ID_ORDER_BY_SELECT = "id_commentOrderSelect";
    return <div class="jobComments_controls">
            <button
                class="buttonSecondary jobComments_filterButton"
                onClick={ handleClick }
            >
                filter
            </button>

            <form class={"orderByForm jobComments_orderByForm"}>
                <label htmlFor={ID_ORDER_BY_SELECT}>Order by</label>
                <select id={ID_ORDER_BY_SELECT} onChange={ (e) => handleChange(e) }>
                    { Object.entries(props.orderByKit.options).map(value => {
                            return  <option key={value[1].id}
                                        value={value[1].id}
                                    >
                                        { value[1].displayStr }
                                    </option>
                        })
                    }
                </select>
            </form>
        </div>
}


// || Filter modal
function JobCommentsFilterModal(props){
    return <Modal close={props.editor.off}>
            <div class="commentFilterEditor">
                <h3 className={"modal_heading"}>{ props.title }</h3>
                <div className={"modal_contents"}>
                    <form className={"commentFilterEditor_form"}>
                        <CommentsRadioFilter 
                            legendStr = { "Pinned" }
                            groupName = { "filterByPinned" }
                            filterStatus = { props.filterKit.pinned.current }
                            FILTER_STATES = { props.filterKit.STATE_LIST }
                            trueStr = { "Pinned Only" }
                            falseStr = { "Unpinned Only" }
                            bothStr = { "Both" }
                            filterActions = { props.filterKit.pinned.actions }
                        />
                        <CommentsRadioFilter 
                            legendStr = { "Highlighted" }
                            groupName = { "filterByHiglighted" }
                            filterStatus = { props.filterKit.highlighted.current }
                            FILTER_STATES = { props.filterKit.STATE_LIST }
                            trueStr = { "Highlighted Only" }
                            falseStr = { "Unhighlighted Only" }
                            bothStr = { "Both" }
                            filterActions = { props.filterKit.highlighted.actions }
                        />
                        <CommentsRadioFilter 
                            legendStr = { "Private" }
                            groupName = { "filterByPrivacy" }
                            filterStatus = { props.filterKit.private.current }
                            FILTER_STATES = { props.filterKit.STATE_LIST }
                            trueStr = { "Private Only" }
                            falseStr = { "Public Only" }
                            bothStr = { "Both" }
                            filterActions = { props.filterKit.private.actions }
                        />
                    </form>
                </div>       
            </div>
        </Modal>
}


function CommentsRadioFilter(props){
    return  <fieldset class="radioFilter">
                <legend>{ props.legendStr }</legend>
                <RadioFilterOption 
                    isChecked = { props.filterStatus === props.FILTER_STATES.true }
                    display_text = { props.trueStr }
                    name = { props.groupName }
                    handleChange = { props.filterActions.setTrue }
                />
                <RadioFilterOption 
                    isChecked = { props.filterStatus === props.FILTER_STATES.false }
                    display_text = { props.falseStr }
                    name = { props.groupName }
                    handleChange = { props.filterActions.setFalse }
                />
                <RadioFilterOption 
                    isChecked = { props.filterStatus === props.FILTER_STATES.both }
                    display_text = { props.bothStr }
                    name = { props.groupName }
                    handleChange = { props.filterActions.setBoth }
                />
            </fieldset>
}


function RadioFilterOption(props){
    return  <label className={`radioFilter_optionLabel radioFilter_optionLabel-${props.isChecked ? "" : "un"}checked`}>
                <input  hidden
                        checked={props.isChecked} type="radio"
                        disabled={false} name={ props.name } value={ props.display_text }
                        onChange={() => props.handleChange() }
                />
                <span class="radioFilter_optionStr">
                    { props.display_text }
                </span>
            </label>
}


function useCommentsFilter(){
    const STATE_LIST = {
        false: 0,
        true: 1,
        both: 2,
    }

    const [filterPinned, setFilterPinned] = React.useState(STATE_LIST.both);
    const [filterHighlighted, setFilterHighlighted] = React.useState(STATE_LIST.both);
    const [filterPrivate, setFilterPrivate] = React.useState(STATE_LIST.both);

    function reset(){
        setFilterPinned(STATE_LIST.both);
        setFilterHighlighted(STATE_LIST.both);
        setFilterPrivate(STATE_LIST.both);
    }

    function filterActions(setter){
        return {
            setTrue: () => setter(STATE_LIST.true),
            setFalse: () => setter(STATE_LIST.false),
            setBoth: () => setter(STATE_LIST.both)
        }
    }

    function calcHeading(){
        /*
            Goal: Heading should describe the currently active filters.
            A status of "Both" means that comment property is ignored by the 
            filter, so it should also be ignored by the heading.
            If this results in a blank heading, return a default.
        */
        function getHeadingForState(filterState, trueStr, falseStr){
            return filterState === STATE_LIST.true ?
                    trueStr
                    : filterState === STATE_LIST.false ?
                        falseStr
                        : "";
        }

        const headingPieces = [
            getHeadingForState(filterPinned, "Pinned", "Unpinned"),
            getHeadingForState(filterHighlighted, "Highlighted", "Unhighlighted"),
            getHeadingForState(filterPrivate, "Private", "Public"),
        ]
        const heading = headingPieces.reduce((result, element) => {
            return element === "" ?
                result
                : result === "" ?
                    element
                    : result + ", " + element;
        }, "");

        return heading !== "" ?
            heading
            : "All Comments";
    }

    function applyTo(comments){
        if(comments === null){
            return [];
        }

        if(filterPinned === STATE_LIST.true){
            comments = comments.filter(c => c.pinned);
        } else if(filterPinned === STATE_LIST.false){
            comments = comments.filter(c => !c.pinned);
        }

        if(filterHighlighted === STATE_LIST.true){
            comments = comments.filter(c => c.highlighted);
        } else if(filterHighlighted === STATE_LIST.false){
            comments = comments.filter(c => !(c.highlighted));
        }

        if(filterPrivate === STATE_LIST.true){
            comments = comments.filter(c => c.private);
        } else if(filterPrivate === STATE_LIST.false){
            comments = comments.filter(c => !c.private);
        }

        return comments;
    }

    return {
        pinned: { current: filterPinned, actions: filterActions(setFilterPinned) },
        highlighted: { current: filterHighlighted, actions: filterActions(setFilterHighlighted)},
        private: { current: filterPrivate, actions: filterActions(setFilterPrivate)},
        STATE_LIST,
        heading: calcHeading(),
        reset,
        applyTo
    }
}


// || Subsections
function JobCommentsSubsection(props){
    return [
        <section className={`subsection jobCommentSection${props.css !== undefined ? " " + props.css : ""}`}>
            <h4>{ props.heading }</h4>
            <div className={'commentContainer'}>
                <CommentsEmpty  
                    comments = { props.comments }
                    emptyMessage = { props.emptyMessage } 
                />
                { props.comments.map((comment) => {
                    return  <Comment key = { comment.id.toString() }
                                actions = { props.actions }
                                comment = { comment }
                                commentsEditor = { props.commentsEditor }
                                wantCollapsable = { props.wantCollapsable }
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
    return <EmptySectionUI message = {props.emptyMessage ?? "No comments on this job"} css={"commentSection_empty"} />
}

// || Individual Comments
function Comment(props){
    const editor = get_editor_object(
        props.comment.id, 
        props.commentsEditor.activeIDStr, 
        props.commentsEditor.set);

        return  <>
                    { editor.is_active ?
                        <CommentEditor   
                            actions = { props.actions }
                            comment = { props.comment }
                            editor  = { editor } 
                            title = { "Edit Comment" }
                        />
                        : null
                    }
                    <CommentReader 
                        actions = { props.actions }
                        comment = { props.comment }
                        editor  = { editor } 
                        wantCollapsable = { props.wantCollapsable }
                    />
                </>
}





// || CommentReader
function CommentReader(props){
    var css_class_list = "one-comment";
    css_class_list += props.comment.private ? ' private' : ' public';  // Update CSS class list for public/private
    css_class_list += props.comment.highlighted ? ' ' + HIGHLIGHTED_STRING : ''; // Update CSS class list for highlighted

    const WrapperTag = props.wantCollapsable ? "details" : "div";
    const ContentTag = props.wantCollapsable ? "summary" : "section";

    return  <article class={ css_class_list }>
                <WrapperTag class="wrapper">
                    <ContentTag class="comment-body">
                        <CommentReaderBodyUI  
                            comment = { props.comment } 
                        />
                    </ContentTag>
                    <CommentReaderFooter  
                        actions = { props.actions }
                        comment = { props.comment }
                        editor = { props.editor }
                    />
                </WrapperTag>
            </article>

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
                {props.comment.created_by} on {props.comment.created_on_str }
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
                <h3 className={"modal_heading"}>{ props.title }</h3>
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
                            want_delete = { props.comment.id !== undefined }
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
        if(comment.id === undefined || comment.id === 0 || comment.id === '0'){
            create_comment();
        } else {
            update_comment();
        }
    }

    const update_comment = () => {
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

    const create_comment = () => {
        const url = `${ actions.url }?job_id=${ window.JOB_ID }`;
        const headers = getFetchHeaders('POST', state_to_object_be());
        
        update_server(url, headers, resp_data => {
            if(status_is_good(resp_data, 201)){
                actions.create_f(state_to_object_fe_created(resp_data));
                editor.off();
            }
            else {
                backend_error.set(get_error_message(resp_data));
            }
        });
    };


    function state_to_object_fe_created(resp_data){
        return {
            ...state_to_object_fe(),
            id: resp_data.id,
            user_is_owner: true,
            created_by: "You",
            created_on: resp_data.created_on,
            created_on_str: resp_data.created_on_str,
        }
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

    function handle_delete(){
        delete_comment();
    }

    function delete_comment(){
        const url = `${ actions.url }?id=${ comment.id }`;
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


// || Pagination
function PaginationControls(props){
    return [ 
        <div class="pagination">
            {   props.pageNumsForButtons.map((pageNum, idx) => {
                    const wantSeparatorAfterThisButton = 
                        idx < props.pageNumsForButtons.length - 1
                        && props.pageNumsForButtons[idx + 1] - pageNum > 1;

                    return <>
                        <PaginationPageButton
                            pageNum={ pageNum }
                            onClick={ () => props.changePageTo(pageNum) }
                            disabled={ pageNum === props.currentPage  }
                        />
                        { wantSeparatorAfterThisButton ?
                            <PaginationSeparator />
                            : null
                        }

                    </>
                })
            }
        </div>
    ]
}


function PaginationPageButton(props){
    return  <button 
                className={"pagination_button"}
                onClick={ props.onClick }
                disabled={ props.disabled }
            >
                { props.pageNum }
            </button>
}


function PaginationSeparator(){
    return <span className={"pagination_separator"}>...</span>
}


function usePagination(arrayToPaginate, numPerPage){
    const [currentPage, setCurrentPage] = React.useState(1);
    const [numPages, setNumPages] = React.useState(1);
    
    function changePageTo(pageNum){
        const parsed = parseInt(pageNum, 10);
        if(pageNumberIsValid(parsed) && parsed !== currentPage){
            setCurrentPage(parsed);
        }
    }

    function pageNumberIsValid(pageNum){
        return Number.isInteger(pageNum) && pageNum > 0 && pageNum <= numPages;
    }

    function paginate(array){
        const start = (currentPage - 1) * numPerPage;
        const end = start + numPerPage;
        return array.slice(start, end);
    }

    React.useEffect(() => {
        const numArrayElements = 
            arrayToPaginate != null && arrayToPaginate != undefined && arrayToPaginate.length > 0 ?
                arrayToPaginate.length
                : -1;

        if(numArrayElements !== -1){
            setNumPages(Math.ceil(numArrayElements / numPerPage));
        }
    }, [arrayToPaginate])


    function getDisplayPageNumbersForNav(qtyStart, qtyPrev, qtyNext, qtyEnd){
        /*  
        Example outputs, to show standard and edge cases:
        (All examples assume the same args: 2, 1, 1, 2. Gaps between "sections" of page numbers added for readability)
    
        A:  [1, 2,       6,  7,  8,     19, 20]      <- numPages = 20, currentPage = 7
        B:  [1, 2, 3]                                <- numPages =  3, currentPage = 1 - 3
        C:  [1, 2, 3, 4, 5,             19, 20]      <- numPages = 20, currentPage = 4 (& to fix 1 - 3)
        D:  [1, 2,          16, 17, 18, 19, 20]      <- numPages = 20, currentPage = 17 (& to fix 18 - 20)
        
        A: Standard: start, end and a "pcn" (previous, current, next) block in the middle, like an island
        B: Only 3 pages exist, which is fewer than the display pages requested (7), so return everything we have
        C: The pcn group and the start range are joined. Sometimes the page numbers just work out that way, but this 
           arrangement is also used to fix cases where the pcn group would otherwise overlap the start or go out-of-bounds
        D: Same idea as C, except this time with the end range instead of the start
    
        The user can pass in 0s if they want to forgo start, end, previous or next for some reason. If all four args are
        0, you get a single-element array with the current page number.
        */
    
        const qtyCurrent = 1;
        qtyStart = forcePositiveIntOrZero(qtyStart);
        qtyEnd = forcePositiveIntOrZero(qtyEnd);
        qtyPrev = forcePositiveIntOrZero(qtyPrev);
        qtyNext = forcePositiveIntOrZero(qtyNext);

        const TOTAL_REQUESTED = qtyStart + qtyPrev + qtyCurrent + qtyNext + qtyEnd;
        if(numPages <= TOTAL_REQUESTED){
            return createNumberArray(1, numPages);
        }

        const offset = 1; // For avoiding off-by-1 errors
        const qtyPCN = qtyPrev + qtyCurrent + qtyNext;
        
        const firstPageOfStart = 1;
        const firstPageOfEnd = numPages + offset - qtyEnd;

        const wantMergeStartAndPCN = currentPage <= qtyStart + qtyPrev + qtyCurrent;
        const wantMergeEndAndPCN = currentPage >= firstPageOfEnd - qtyNext - qtyCurrent;
        
        const startPages = wantMergeStartAndPCN ?
            createNumberArray(firstPageOfStart, qtyStart + qtyPCN)
            : qtyStart === 0 ?
                []
                : createNumberArray(firstPageOfStart, qtyStart);
        
        const endPages = wantMergeEndAndPCN ?
            createNumberArray(firstPageOfEnd - qtyPCN, qtyEnd + qtyPCN)
            : qtyEnd === 0 ?
                []
                : createNumberArray(firstPageOfEnd, qtyEnd);

        if(wantMergeStartAndPCN || wantMergeEndAndPCN){
            return startPages.concat(endPages);
        }

        const pcnIslandPages = createNumberArray(currentPage - qtyPrev, qtyPCN);
        return startPages.concat(pcnIslandPages).concat(endPages);

        function createNumberArray(start, numElements){
            return Array.from(Array(numElements).keys()).map(num => start + num);
        }

        function forcePositiveIntOrZero(qty){
            if(!Number.isNaN(qty)){
                return Math.max(qty, 0);
            }

            const parsed = parseInt(qty);
            if(!Number.isNaN(parsed)){
                return Math.max(parsed, 0);
            }

            return 0;
        }
    }

    return {
        currentPage,
        numPages,
        page: paginate(arrayToPaginate),
        changePageTo,
        getDisplayPageNumbersForNav
    }
}
