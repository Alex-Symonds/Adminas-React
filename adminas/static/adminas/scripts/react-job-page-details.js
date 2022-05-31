// Job page: React components for the General Details section


// || JobDetails
function JobDetails(props){
    //  ----------------------------------------
    // Things to fetch from the server
    // const URL_EDIT_JOB = '/edit_job';
    // var info = {
    //     name: '2108-001',
    //     agent: 'Baracudax',
    //     customer: 'Aardvark',
    //     quote_ref: 'Q210712KP-1',
    //     country_name: 'United Kingdom',
    //     language: 'EN',
    //     invoice_to: 'Address multiple lines, or multiple commas at least, blah de blah, Region, P05 TC0DE, United Kingdom',
    //     payment_terms: '30 days from blah blah',
    //     delivery_to: 'Address multiple lines, but this time different, because delivery, Regionyjjd, P05 TC0DE, United Kingdom',
    //     incoterm_code: 'EXW',
    //     incoterm_location: 'UK'
    // };
    //  ----------------------------------------

    const [isLoaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [pageData, setData] = React.useState({});

    React.useEffect(() => {
        const fetchData = async () => {
            const result = await fetch(`${props.URL_GET_DATA}?job_id=${props.job_id}&type=page_load&name=details`)
            .then(response => {
                if(response.status == 200){
                    return response.json();
                } else {
                    throw new Error('Page data failed to load');
                }
            })
            .then(data => {
                setData({
                    url: data.url + '?job=' + props.job_id,
                    name: data.name,
                    agent: data.agent,
                    customer: data.customer,
                    quote_ref: data.quote_ref,
                    country_name: data.country_name,
                    language: data.language,
                    invoice_to: data.invoice_to,
                    payment_terms: data.payment_terms,
                    delivery_to: data.delivery_to,
                    incoterm_code: data.incoterm_code,
                    incoterm_location: data.incoterm_location  
                });
                setLoaded(true);
            })
            .catch(error => {
                setError(error);
                setLoaded(true);
                console.log('Error: ', error);
            });
        };

        fetchData();

    }, [isLoaded]);


    // const URL_EDIT_THIS_JOB = URL_EDIT_JOB + "?job=" + props.job_id;

    if(error){
        return <div>Error loading details.</div>
    }
    else if (!isLoaded){
        return <div>Loading...</div>
    }
    return [
        <section id="job_details" class="job-section">
            <h3>General Details</h3>
            <div class="extended-subheading">
                <a href={pageData.url} class="edit-icon"><span>edit</span></a>
            </div>
            <JobDetailsIdSection        data={pageData} />
            <JobDetailsPaymentSection   data={pageData}
                                        currency={props.currency}/>
            <JobDetailsDeliverySection  data={pageData} />
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