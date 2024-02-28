import React, { createContext, useContext } from 'react';

import { useEditor } from './useEditor.js';
import { useJobState } from './useJobState.js';
import { useJobStateUpdater } from './useJobStateUpdater.js';

import { useJobMenu } from '../reactComponentsWithHooks/jobSideNav.js';

const Context = createContext({});

export function JobDataProvider({ children }){
    // Job data initial fetching and storing in state
    const {
        job,
        updateKey : updateJobKey,
        fetchProps,
    } = useJobState();

    // The Job page should only show one modal at a time, so setup management of that here
    const modalKit = useEditor();

    // Setup some Job state updaters, with any errors to be displayed in the shared modal
    const actions = useJobStateUpdater(job, updateJobKey, modalKit);

    // Derive some numbers from the Job state data
    const calc = jobCalc(job.poList, job.itemsList, job.currency);

    // Management for the Job page's "tabs" / routes
    const jobMenu = useJobMenu();

    // Separate out "currency" for convenience (it's used in SO MANY places)
    return (
        <Context.Provider value={{ 
            actions,
            calc, 
            "currency": job.currency, 
            fetchProps, 
            job,
            jobMenu, 
            modalKit 
        }}>
            { children }
        </Context.Provider>
    )
}

export const useJobContext = () => useContext(Context);


// || Helpers
function jobCalc(poList, itemsList, currency){

    const total_po_value = poList.reduce((prev_total_val, po) => { 
        return po.currency === currency ? 
            parseFloat(po.value) + prev_total_val 
            : prev_total_val 
        }, 0);

    const total_items_value = itemsList.reduce((prev_total_val, item) => { 
            return parseFloat(item.selling_price) + prev_total_val 
        }, 0);

    const value_difference_po_vs_items = total_po_value - total_items_value;

    const has_invalid_currency_po = !poList.every(po => po.currency === currency);
    
    const total_qty_all_items = itemsList.reduce((prev_total_qty, item) => { 
        return parseInt(item.quantity) + prev_total_qty; 
    }, 0);
    
    return {
        difference: value_difference_po_vs_items,
        total_items_value,
        total_po_value,
        has_invalid_currency_po,
        total_qty_all_items,
    };
}