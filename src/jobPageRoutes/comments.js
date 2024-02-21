/*
    Summary:
    Comments section on Job page

    Contents:
        || Main Section
        || Modals
        || Controls
*/
import { JobSectionHeadingNarrowUI } from "../reactComponents/jobPageHeadings.js";

import { useSortByDate } from "../hooks/useSortByDate.js";

import { AddButton } from "../reactComponents/buttons.js";

import { CommentsWrapper } from "../reactComponentsWithHooks/comment.js";
import { CommentEditor } from "../reactComponentsWithHooks/commentEditor.js";
import { JobCommentsFilterModal } from "../reactComponentsWithHooks/commentsFilter.js";
import { useCommentsFilter } from "../reactComponentsWithHooks/commentsFilter.js";
import { PaginationControls, usePagination } from "../reactComponentsWithHooks/pagination.js";

import { useJobContext } from '../hooks/useJobContext.js';

// || Main section
export function JobComments(){
    const { job } = useJobContext();

    const orderByKit = useSortByDate();
    const filterKit = useCommentsFilter();

    const filteredAndSortedComments = 
        filterKit
        .applyTo(job.comments)
        .sort((a, b) => {
            const aAsDate = new Date(a.created_on);
            const bAsDate = new Date(b.created_on);
            return orderByKit.activeSortByDate(aAsDate, bAsDate);
    });

    const numCommentsPerPage = 5;
    const paginated = usePagination(filteredAndSortedComments, numCommentsPerPage);

    return  <JobCommentsUI
                filterKit = { filterKit }
                orderByKit = { orderByKit }
                paginated = { paginated }
            />
}


function JobCommentsUI({ filterKit, orderByKit, paginated }){
    const { actions, modalKit } = useJobContext();

    const ID_FOR_MODAL_FILTER = 'job_comments_filter';
    const ID_FOR_MODAL_CREATE = 'job_comments_create';
    return (
        <section className="jobComments jobNarrowSection">
            { modalKit.isOpen()
                ? <JobCommentModals
                    closeFn = { modalKit.close }
                    commentsActions = { actions }
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
                    actions = { actions.comments }
                    comments = { paginated.page }
                    css = { "jobComments_container" }
                    emptyMessage = { "No comments on this job match the current filter settings" }
                    heading = { `${filterKit.heading} (${orderByKit.heading.toLowerCase()})` }
                    modalKit = { modalKit }
                    wantCollapsable = { false }
                />
            </JobCommentsContentWrapperWithControls>                                
        </section>

    )
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
    return (
        <div className="jobComments_viewExistingWrapper jobNarrowSection_content">
            <div className="jobComments_viewExisting">
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
    )                            
}


function JobCommentsSortAndFilterControls({ openFilterEditor, orderByKit }){
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
    return <div className="jobComments_controls">
            <button
                className="jobComments_filterButton"
                onClick={ handleClick }
            >
                <span className="jobComments_filterButtonText">filter</span>
            </button>

            <form className={"orderByForm jobComments_orderByForm"}>
                <label htmlFor={ID_ORDER_BY_SELECT} className={"sr-only"}>Order by</label>
                <select 
                    className={"jobComments_orderBySelect"}
                    id={ID_ORDER_BY_SELECT} 
                    onChange={ (e) => handleChange(e) }
                    value={ orderByKit.activeID }
                >
                { orderByKit.options.map(data => 
                    <option key = {data.id}
                        value = {data.id}
                    >
                        { data.displayStr }
                    </option>
                )}
                </select>
            </form>
        </div>
}

