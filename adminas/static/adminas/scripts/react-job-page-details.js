// Job page: React components for the General Details section


// || JobDetails
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