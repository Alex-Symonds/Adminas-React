// Job page: React components for the General Details section


// || JobDetails
function JobDetails(props){
    const { data, error, isLoaded } = useFetch(url_for_page_load(props.URL_GET_DATA, props.job_id, 'details'));

    if(error){
        return <LoadingErrorEle name='details' />
    }
    else if (!isLoaded){
        return <LoadingEle />
    }
    return [
        <section id="job_details" class="job-section">
            <h3>General Details</h3>
            <div class="extended-subheading">
                <a href={data.url} class="edit-icon"><span>edit</span></a>
            </div>
            <JobDetailsIdSection        data={data} />
            <JobDetailsPaymentSection   data={data}
                                        currency={props.currency}/>
            <JobDetailsDeliverySection  data={data} />
        </section>
    ]
}

function JobDetailsIdSection(props){
    return [
        <section class="subsection">
            <h4>Identification</h4>
            <JobDetailsReadRow heading="Name" value={props.data.name} />
            <JobDetailsReadRow heading="Agent" value={props.data.agent} />
            <JobDetailsReadRow heading="Customer" value={props.data.customer} />
            <JobDetailsReadRow heading="Quote ref" value={props.data.quote_ref} />
            <JobDetailsReadRow heading="Country" value={props.data.country_name} />
            <JobDetailsReadRow heading="Language" value={props.data.language} />
        </section>
    ]
}

function JobDetailsPaymentSection(props){
    return [
        <section id="job_payment_section" class="subsection">
            <h4>Payment</h4>
            <JobDetailsReadRow heading="Invoice address" value={props.data.invoice_to} />
            <JobDetailsReadRow heading="Currency" value={props.currency} />
            <JobDetailsReadRow heading="Payment terms" value={props.data.payment_terms} />
        </section>
    ]
}

function JobDetailsDeliverySection(props){
    return [
        <section id="job_delivery_section" class="subsection">
            <h4>Delivery</h4>
            <JobDetailsReadRow heading="Delivery address" value={props.data.delivery_to} />
            <JobDetailsReadRow heading="Incoterm" value={props.data.incoterm_code + ' ' + props.data.incoterm_location} />
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