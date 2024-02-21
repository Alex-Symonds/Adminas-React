/*
    Pagination
    || Hook
    || Components

*/
import { useState, useEffect, Fragment } from 'react';


// || Hook
export function usePagination(arrayToPaginate, numPerPage){
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(1);
    
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

    useEffect(() => {
        const numArrayElements = 
            arrayToPaginate !== null && arrayToPaginate !== undefined && arrayToPaginate.length > 0 ?
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


// || Components
export function PaginationControls({changePageTo, css, currentPage, pageNumsForButtons}){
    return (
        <div className={`pagination pagination-${css}`}>
            <span className="sr-only">pages</span>
            {   pageNumsForButtons.map((pageNum, idx) => {
                    const wantSeparatorAfterThisButton = 
                        idx < pageNumsForButtons.length - 1
                        && pageNumsForButtons[idx + 1] - pageNum > 1;

                    return <Fragment key={`page${pageNum}`}>
                        <PaginationPageButton
                            pageNum={ pageNum }
                            onClick={ () => changePageTo(pageNum) }
                            disabled={ pageNum === currentPage  }
                        />
                        { wantSeparatorAfterThisButton ?
                            <PaginationSeparator />
                            : null
                        }
                    </Fragment>
                })
            }
        </div>
    )
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


