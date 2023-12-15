/*
    Summary:
    Status strip on the Job page

    Contents:
        || Main section
*/


// || Main section
function JobSummary(props){
    return  <section id="job_summary" class="job-section jobSummary">
                <h3>Summary</h3>
                <div className={"jobSummary_contentsLayout"}>
                    <SubsectionWrapper extraClasses={"jobSummaryStatus"}>
                        <h4>Status</h4>
                        <JobStatusStrip
                            status_data = { props.status_data }
                        />
                    </SubsectionWrapper>
                    <div className = {"timeValueContainer"}>
                        <JobSummary_TimeStamp 
                            timestamp = { format_timestamp(props.timestamp) } 
                        />
                        <JobSummary_OrderValue 
                            currency = { props.currency }
                            value = { props.value }
                        />
                    </div>
                    <JobCommentsSubsection
                        actions = { props.actions_comments }
                        comments = { props.comments }
                        commentsEditor = { props.commentsEditor }
                        sectionName = { PINNED_STRING }
                        username = { props.username } 
                    /> 
                    <JobSummary_Items 
                        currency = { props.currency }
                        items_list = { props.items_list }
                    />
                    <JobSummary_CustomerReference 
                        po_list = { props.po_list }
                    />
                </div>
            </section>
}


function SubsectionWrapper(props){
    return  <section className = {`subsection ${ props.extraClasses ?? "" }`} >
                { props.children }
            </section>
}


function JobSummary_TimeStamp(props){
    return  <SubsectionWrapper extraClasses="jobSummaryTimestamp">
                <h4>Job Opened</h4>
                <p className = { "jobSummaryTimestamp_text" }>
                    { props.timestamp }
                </p>
            </SubsectionWrapper>
}


function JobSummary_OrderValue(props){
    return  <SubsectionWrapper extraClasses="jobSummaryOrderValue">
                <h4>Order Value</h4>
                <p className = { "jobSummaryOrderValue_text" }>
                    { props.currency }&nbsp;{ format_money(props.value) }
                </p>
            </SubsectionWrapper>
}


function JobSummary_CustomerReference(props){
    return  <SubsectionWrapper extraClasses="jobSummaryCustomerRef">
                <h4>Customer Reference{props.po_list.length > 1 ? "s" : ""}</h4>
                <ul className={"jobSummaryCustomerRef_list"}>
                    { props.po_list.length === 0 ?
                        <li>TBC</li>
                        :
                        props.po_list.map((po, idx) => {
                            return  <li key={`${po}_${idx}`}>
                                        <span className={ "jobSummaryCustomerRef_poRef" }>
                                            { po.reference }
                                        </span>
                                        <span className = { "jobSummaryCustomerRef_poDated" }>
                                         { ` dated ${ po.date_on_po }` }
                                        </span>
                                    </li>
                        })
                    }
                </ul>
            </SubsectionWrapper>
}


function JobSummary_Items(props){
    const N = 5;
    const hasOverflow = props.items_list.length > N;

    let topN = [];
    if(props.items_list.length > 0){
        const sorted = props.items_list.toSorted((a, b) => { return b.selling_price - a.selling_price });
        topN = sorted.length <= N ?
            topN = sorted
            : topN = sorted.slice(0, N);
    }

    return  <SubsectionWrapper extraClasses="jobSummaryItems">
                <h4>{hasOverflow ? "Top " : ""}Items</h4>
                <ul className={"jobSummaryItems_list"}>
                    { topN.length === 0 ?
                        <li>No items have been entered</li>
                        :
                        topN.map((item) => {
                            return  <li key={`${ item.ji_id }`} className={"jobSummaryItems_item"}>
                                        {`${ item.quantity } x [${ item.part_number }] ${ item.product_name }`}
                                        <span className={"jobSummaryItems_price"}>
                                            {` @ ${ props.currency } ${ format_money( parseFloat(item.selling_price) ) }`}
                                        </span>
                                    </li>
                        })
                    }
                </ul>
                { hasOverflow ?
                    <p className={"jobSummaryItems_moreItems"}>
                        And more...
                    </p>
                    : null
                }
            </SubsectionWrapper>
}




