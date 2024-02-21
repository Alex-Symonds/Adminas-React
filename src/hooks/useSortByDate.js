import { useState } from 'react';

export function useSortByDate(){
    const INIT_IDX = 0;
    const ORDER_BY_OPTIONS = [
        {   id: 'newestFirst',
            displayStr: 'Newest first',
            f: (a, b) => b - a,
        },
        {   id: 'oldestFirst',
            displayStr: 'Oldest first',
            f: (a, b) => a - b,
        }
    ]

    const [orderByIdx, setOrderByIdx] = useState(INIT_IDX);

    function updateOrderBy(newOrderByID){
        const activeOptionIdx = ORDER_BY_OPTIONS.findIndex(optionObj => optionObj.id === newOrderByID);
        if(activeOptionIdx !== -1){
            setOrderByIdx(activeOptionIdx);
        }
    }

    return {
        activeID: ORDER_BY_OPTIONS[orderByIdx].id,
        activeSortByDate: ORDER_BY_OPTIONS[orderByIdx].f,
        options: ORDER_BY_OPTIONS,
        update: updateOrderBy,
        heading: ORDER_BY_OPTIONS[orderByIdx].displayStr,
    }
}
