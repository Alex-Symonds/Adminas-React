/*
    Summary:
    General Details section on the Job page

    Contents:
        || Main section
*/


// || Main section
function JobDetails(props){
    const { data, error, isLoaded } = useFetch(url_for_page_load(props.URL_GET_DATA, props.job_id, 'details'));

    if(error){
        return <LoadingErrorUI name='details' />
    }
    else if (!isLoaded){
        return <LoadingUI />
    }
    return <JobDetailsUI    currency = { props.currency }
                            data = { data } />
}

function JobDetailsUI(props){
    return [
        <section className={"job-section jobDetails"}>
            <h3>General Details</h3>
            <div class="extended-subheading">
                <a href={ props.data.url } class="edit-icon"><span>edit</span></a>
            </div>
            <JobDetailsIdSectionUI      data = { props.data } />
            <JobDetailsPaymentSectionUI currency = { props.currency }
                                        data = { props.data } />
            <JobDetailsDeliverySectionUI    data = { props.data } />
        </section>
    ]
}

function JobDetailsIdSectionUI(props){
    return [
        <section class="subsection">
            <h4>Identification</h4>
            <JobDetailsReadRowUI heading="Name" value={props.data.name} />
            <JobDetailsReadRowUI heading="Agent" value={props.data.agent} />
            <JobDetailsReadRowUI heading="Customer" value={props.data.customer} />
            <JobDetailsReadRowUI heading="Quote ref" value={props.data.quote_ref} />
            <JobDetailsReadRowUI heading="Country" value={props.data.country_name} />
            <JobDetailsReadRowUI heading="Language" value={props.data.language} />
        </section>
    ]
}

function JobDetailsPaymentSectionUI(props){
    return [
        <section id="job_payment_section" class="subsection">
            <h4>Payment</h4>
            <JobDetailsReadRowUI heading="Invoice address" value={props.data.invoice_to} />
            <JobDetailsReadRowUI heading="Currency" value={props.currency} />
            <JobDetailsReadRowUI heading="Payment terms" value={props.data.payment_terms} />
        </section>
    ]
}

function JobDetailsDeliverySectionUI(props){
    return [
        <section id="job_delivery_section" class="subsection">
            <h4>Delivery</h4>
            <JobDetailsReadRowUI heading="Delivery address" value={props.data.delivery_to} />
            <JobDetailsReadRowUI heading="Incoterm" value={props.data.incoterm_code + ' ' + props.data.incoterm_location} />
        </section>
    ] 
}

function JobDetailsReadRowUI(props){
    return [
        <div className={"read_row jobDetails_row"}>
            <span class="row-label">{props.heading}: </span>
            <span>{props.value}</span>
        </div>
    ]
}