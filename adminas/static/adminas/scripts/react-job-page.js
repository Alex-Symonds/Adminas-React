function JobPage(){
    // Stuff to be fetched from the backend or something
    const job_id = 2;
    const job_name = '2108-001';
    const customer_name = 'Aardvark y asjdhfgjahsdfg';
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
            <JobHeadingSubsection id={job_id} job_name={job_name} customer_name={customer_name} root_statuses={root_statuses} />
            <JobContents id={job_id.id} currency={currency} />
        </div>
    ]
}

function JobContents(props){
    return null;
    // return [
    //     <JobDetails />,
    //     <JobComments />,
    //     <JobDocuments />,
    //     <JobItems />,
    //     <JobPurchaseOrders />,
    //     <JobPriceChecker />
    // ]
}


// Probably move these to separate files
function JobDetails(props){

}

function JobComments(props){

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