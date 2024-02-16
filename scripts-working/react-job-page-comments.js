/*
    Summary:
    Comments section on Job page

    Contents:
        || Main Section
        || Modals
        || Controls
*/


// || Main section
function JobComments({comments, commentsActions, modalKit}){
    const orderByKit = useSortByDate();
    const filterKit = useCommentsFilter();

    const filteredAndSortedComments = 
        filterKit
        .applyTo(comments)
        .sort((a, b) => {
            const aAsDate = new Date(a.created_on);
            const bAsDate = new Date(b.created_on);
            return orderByKit.activeSortByDate(aAsDate, bAsDate);
    });

    const numCommentsPerPage = 5;
    const paginated = usePagination(filteredAndSortedComments, numCommentsPerPage);

    return  <JobCommentsUI
                commentsActions = { commentsActions }
                filterKit = { filterKit }
                modalKit = { modalKit }
                orderByKit = { orderByKit }
                paginated = { paginated }
            />
}


function JobCommentsUI({ commentsActions, filterKit, modalKit, orderByKit, paginated }){
    const ID_FOR_MODAL_FILTER = 'job_comments_filter';
    const ID_FOR_MODAL_CREATE = 'job_comments_create';
    return [
        <section class="jobComments jobNarrowSection">
            { modalKit.isOpen()
                ? <JobCommentModals
                    closeFn = { modalKit.close }
                    commentsActions = { commentsActions }
                    createCommentIsOpen = { modalKit.isOpenedBy(ID_FOR_MODAL_CREATE) }
                    filterIsOpen = { modalKit.isOpenedBy(ID_FOR_MODAL_FILTER) }
                    filterKit = { filterKit }
                />
                : null
            }
            <JobSectionHeadingNarrowUI 
                text={"Comments"} 
            />
            <AddButton 
                label={"comment"}
                css={"jobComments_addButton jobNarrowSection_content"}
                onClick={ () => modalKit.open(ID_FOR_MODAL_CREATE) }
            />
            <JobCommentsContentWrapperWithControls 
                openFilterEditor = { () => modalKit.open(ID_FOR_MODAL_FILTER) }
                orderByKit = { orderByKit } 
                paginated = { paginated }         
            >
                <CommentsWrapper  
                    actions = { commentsActions }
                    comments = { paginated.page }
                    css = { "jobComments_container" }
                    emptyMessage = { "No comments on this job match the current filter settings" }
                    heading = { `${filterKit.heading} (${orderByKit.heading.toLowerCase()})` }
                    modalKit = { modalKit }
                    wantCollapsable = { false }
                />
            </JobCommentsContentWrapperWithControls>                                
        </section>

    ]
}


// || Modals
function JobCommentModals({ closeFn, commentsActions, createCommentIsOpen, filterIsOpen, filterKit }){
    return filterIsOpen
        ? <JobCommentsFilterModal
            closeFn = { closeFn }
            filterKit = { filterKit }
            title = { "Filter Comments" }
        />
        : createCommentIsOpen ?
            <CommentEditor
                actions = { commentsActions }
                comment = { {
                    contents: "",
                    private: true,
                    pinned: false,
                    highlighted: false,
                } }
                closeFn  = { closeFn } 
                title = { "Add Comment" }
            />
            : null
}


// || Controls
function JobCommentsContentWrapperWithControls({ openFilterEditor, orderByKit, paginated, children }){
    return [
        <div class="jobComments_viewExistingWrapper jobNarrowSection_content">
            <div class="jobComments_viewExisting">
                <JobCommentsSortAndFilterControls 
                    openFilterEditor = { openFilterEditor }
                    orderByKit = { orderByKit }
                />
                <PaginationControls
                    css = {'above'}
                    currentPage = { paginated.currentPage }
                    numPages = { paginated.numPages }
                    changePageTo = { paginated.changePageTo }
                    pageNumsForButtons = { paginated.getDisplayPageNumbersForNav(1, 1, 1, 1) }
                />

                { children }

                <PaginationControls
                    css = {'below'}
                    currentPage = { paginated.currentPage }
                    numPages = { paginated.numPages }
                    changePageTo = { paginated.changePageTo }
                    pageNumsForButtons = { paginated.getDisplayPageNumbersForNav(1, 1, 1, 1) }
                />
            </div>  
        </div>  
    ]                            

}


function JobCommentsSortAndFilterControls({ openFilterEditor, orderByKit}){
    function handleClick(){
        openFilterEditor();
    }

    function handleChange(e){
        if(e.target.value === undefined){
            return;
        }
        orderByKit.update(e.target.value);
    }

    const ID_ORDER_BY_SELECT = "id_commentOrderSelect";
    return <div class="jobComments_controls">
            <button
                class="jobComments_filterButton"
                onClick={ handleClick }
            >
                <span class="jobComments_filterButtonText">filter</span>
            </button>

            <form class={"orderByForm jobComments_orderByForm"}>
                <label htmlFor={ID_ORDER_BY_SELECT} className={"sr-only"}>Order by</label>
                <select 
                    className={"jobComments_orderBySelect"}
                    id={ID_ORDER_BY_SELECT} 
                    onChange={ (e) => handleChange(e) }
                >
                { orderByKit.options.map(data => 
                    <option key = {data.id}
                        value = {data.id}
                        selected = { data.id === orderByKit.activeID }
                    >
                        { data.displayStr }
                    </option>
                )}
                </select>
            </form>
        </div>
}

