/*
    Summary:
    Wrapper to combine the Details and PO sections
*/


function JobDetailsAndPO(props){
    return <div class="jobDetailsPO jobNarrowSection">
            <JobSectionHeadingNarrowUI text="Details & Purchase Orders" />
            <div class="jobDetailsPO_wrapper">
                <JobDetails 
                    currency = { props.currency }   
                    job_id = { props.job_id }
                    URL_GET_DATA = { props.URL_GET_DATA }
                />
                <JobPo  
                    actions_po = { props.actions_po }
                    poList = { props.poList }
                    currency = { props.currency }
                    difference = { props.difference }
                    job_id = { props.job_id }
                    total_po_value = { props.total_po_value }
                    total_items_value = { props.total_items_value }
                    has_invalid_currency_po = { props.has_invalid_currency_po }
                    URL_GET_DATA = { props.URL_GET_DATA }
                />
            </div>
        </div>
}