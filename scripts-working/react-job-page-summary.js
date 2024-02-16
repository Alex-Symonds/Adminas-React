/*
    Summary:
    Status strip on the Job page

    Contents:
        || Main section
*/


// || Main section
function JobSummary({ actions_comments, comments, currency, items_list, modalKit, po_list, status_data, timestamp, value }){
    return  [
        <section id="job_summary" class="job-section jobSummary">
            <JobSectionHeadingUI text={"Summary"} />
            <div className={"jobSummary_contentsLayout"}>
                <SubsectionWrapper css={"jobSummaryStatus"}>
                    <h4>Status</h4>
                    <JobStatusStrip
                        statusData = { status_data }
                    />
                </SubsectionWrapper>
                <div className = {"timeValueContainer"}>
                    <JobSummary_TimeStamp 
                        timestamp = { format_timestamp(timestamp) } 
                    />
                    <JobSummary_OrderValue 
                        currency = { currency }
                        value = { value }
                    />
                </div>
                <CommentsWrapper
                    actions = { actions_comments }
                    comments = { comments === null ? [] : comments.filter(c => c.pinned) }
                    css = { "jobCommentSection-summary" }
                    emptyMessage = { "No comments have been pinned" }
                    heading = { "Pinned" }
                    modalKit = { modalKit }
                    wantCollapsable = { true }
                /> 
                <JobSummary_Items 
                    currency = { currency }
                    items_list = { items_list }
                />
                <JobSummary_CustomerReference 
                    po_list = { po_list }
                />
            </div>
        </section>
    ]
}


function SubsectionWrapper({ css, children }){
    return  <section className = {`subsection ${ css ?? "" }`} >
                { children }
            </section>
}


function JobSummary_TimeStamp({ timestamp }){
    return  <SubsectionWrapper css = "jobSummaryTimestamp">
                <h4>Job Opened</h4>
                <p className = { "jobSummaryTimestamp_text" }>
                    { timestamp }
                </p>
            </SubsectionWrapper>
}


function JobSummary_OrderValue({ currency, value }){
    return  <SubsectionWrapper css="jobSummaryOrderValue">
                <h4>Order Value</h4>
                <p className = { "jobSummaryOrderValue_text" }>
                    { currency }&nbsp;{ format_money(value) }
                </p>
            </SubsectionWrapper>
}


function JobSummary_CustomerReference({ po_list }){
    return  <SubsectionWrapper css="jobSummaryCustomerRef">
                <h4>Customer Reference{po_list.length > 1 ? "s" : ""}</h4>
                <ul className={"jobSummaryCustomerRef_list"}>
                    { po_list.length === 0 ?
                        <li className={"empty-section-notice"}>TBC</li>
                        :
                        po_list.map((po, idx) => {
                            return  <li key={`${po}_${idx}`} className={"jobSummaryCustomerRef_listItem"}>
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


function JobSummary_Items({ currency, items_list }){
    const N = 5;
    const hasOverflow = items_list !== null && items_list !== undefined && items_list.length > N;

    let topN = [];
    if(items_list !== null && items_list !== undefined && items_list.length > 0){
        const sorted = items_list.toSorted((a, b) => { 
            return b.selling_price - a.selling_price 
        });
        topN = hasOverflow 
            ? topN = sorted.slice(0, N)
            : topN = sorted
        ;
    }

    return  <SubsectionWrapper css="jobSummaryItems">
                <h4>{hasOverflow ? "Top " : ""}Items</h4>
                <ul className={"jobSummaryItems_list"}>
                    { topN.length === 0 ?
                        <li className={"empty-section-notice"}>No items have been entered</li>
                        :
                        topN.map((item) => {
                            return  <li key={`${ item.ji_id }`} className={"jobSummaryItems_item"}>
                                        {`${ item.quantity } x [${ item.part_number }] ${ item.product_name }`}
                                        <span className={"jobSummaryItems_price"}>
                                            {` @ ${ currency } ${ format_money( parseFloat(item.selling_price) ) }`}
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




