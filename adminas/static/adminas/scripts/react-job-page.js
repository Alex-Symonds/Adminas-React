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


// Probably move these to separate files
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