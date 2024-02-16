/*
    Summary:
    Wrapper to combine the Details and PO sections
*/

function JobDetailsAndPO({ actions_po, currency, difference, has_invalid_currency_po, job_id, modalKit, poList, total_items_value, total_po_value }){
    return <div class="jobDetailsPO jobNarrowSection">
            <JobSectionHeadingNarrowUI text="Details & Purchase Orders" />
            <div class="jobDetailsPO_wrapper">
                <JobDetails 
                    currency = { currency }   
                    job_id = { job_id }
                />
                <JobPo  
                    actions_po = { actions_po }
                    poList = { poList }
                    currency = { currency }
                    difference = { difference }
                    job_id = { job_id }
                    modalKit = { modalKit }
                    total_po_value = { total_po_value }
                    total_items_value = { total_items_value }
                    has_invalid_currency_po = { has_invalid_currency_po }
                />
            </div>
        </div>
}