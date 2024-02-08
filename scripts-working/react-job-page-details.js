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
        <section className={"jobDetails jobPanelSection"}>

            <h3 className={"jobPanelSection_headingWrapper"}>
                <span className={"jobDetails_headerContent jobPanelSection_headingContent"}>
                    General Details
                    <a href={ props.data.url } class="edit-icon sectionHeadingWrapper_editIcon"><span>edit</span></a>
                </span>
            </h3>

            <JobDetailsIdSectionUI
                data = { props.data } 
            />
            <JobDetailsPaymentSectionUI 
                currency = { props.currency }
                data = { props.data } 
            />
            <JobDetailsDeliverySectionUI
                data = { props.data } 
            />
        </section>
    ]
}

function JobDetailsIdSectionUI(props){
    return [
        <section class="jobDetails_subsection">
            <h4 className={"jobDetails_subsectionHeading jobPanelSection_subsectionHeading"}>Identification</h4>
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
        <section class="jobDetails_subsection">
            <h4 className={"jobDetails_subsectionHeading jobPanelSection_subsectionHeading"}>Payment</h4>
            <JobDetailsReadRowUI heading="Invoice address" value={props.data.invoice_to} cssModifier={"wrap"} />
            <JobDetailsReadRowUI heading="Currency" value={props.currency} cssModifier={"wrap"} />
            <JobDetailsReadRowUI heading="Payment terms" value={props.data.payment_terms} cssModifier={"wrap"} />
        </section>
    ]
}

function JobDetailsDeliverySectionUI(props){
    return [
        <section class="jobDetails_subsection">
            <h4 className={"jobDetails_subsectionHeading jobPanelSection_subsectionHeading"}>Delivery</h4>
            <JobDetailsReadRowUI heading="Delivery address" value={props.data.delivery_to} cssModifier={"wrap"} />
            <JobDetailsReadRowUI heading="Incoterm" value={props.data.incoterm_code + ' ' + props.data.incoterm_location} cssModifier={"wrap"} />
        </section>
    ] 
}

function JobDetailsReadRowUI(props){
    return [
        <div className={`jobDetails_row${props.cssModifier === undefined ? "" : ` jobDetails_row-${props.cssModifier}`}`}>
            <span class="jobDetails_rowLabel">{props.heading}: </span>
            <span className={`jobDetails_rowContent${props.cssModifier === undefined ? "" : ` jobDetails_rowContent-${props.cssModifier}`}`}>
                {props.value}
            </span>
        </div>
    ]
}