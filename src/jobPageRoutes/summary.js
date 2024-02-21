/*
    Summary:
    Default route for the Job page.
    Shows a brief overview of all sections
*/

import { format_money, format_timestamp } from "../util";

import { useJobContext } from "../hooks/useJobContext";

import { JobSectionHeadingUI } from "../reactComponents/jobPageHeadings";
import { JobStatusStrip } from "../reactComponents/jobStatusStrip";

import { CommentsWrapper } from "../reactComponentsWithHooks/comment";


// || Main section
export function JobSummary(){
    const { actions, calc, currency, job, modalKit } = useJobContext();
    return (
        <section 
            id="job_summary" 
            className="job-section jobSummary"
        >
            <JobSectionHeadingUI text={"Summary"} />
            <div className={"jobSummary_contentsLayout"}>
                <SubsectionWrapper css={"jobSummaryStatus"}>
                    <h4>Status</h4>
                    <JobStatusStrip />
                </SubsectionWrapper>
                <div className = {"timeValueContainer"}>
                    <JobSummaryTimeStamp 
                        timestamp = { format_timestamp(job.timestamp) } 
                    />
                    <JobSummaryOrderValue 
                        currency = { currency }
                        value = { calc.total_items_value }
                    />
                </div>
                <CommentsWrapper
                    actions = { actions.comments }
                    comments = { job.comments === null ? [] : job.comments.filter(c => c.pinned) }
                    css = { "jobCommentSection-summary" }
                    emptyMessage = { "No comments have been pinned" }
                    heading = { "Pinned" }
                    modalKit = { modalKit }
                    wantCollapsable = { true }
                /> 
                <JobSummaryItems />
                <JobSummaryCustomerReference />
            </div>
        </section>
    )
}


function SubsectionWrapper({ css, children }){
    return  <section className = {`subsection ${ css ?? "" }`} >
                { children }
            </section>
}


function JobSummaryTimeStamp({ timestamp }){
    return  <SubsectionWrapper css = "jobSummaryTimestamp">
                <h4>Job Opened</h4>
                <p className = { "jobSummaryTimestamp_text" }>
                    { timestamp }
                </p>
            </SubsectionWrapper>
}


function JobSummaryOrderValue({ currency, value }){
    return  <SubsectionWrapper css="jobSummaryOrderValue">
                <h4>Order Value</h4>
                <p className = { "jobSummaryOrderValue_text" }>
                    { currency }&nbsp;{ format_money(value) }
                </p>
            </SubsectionWrapper>
}


function JobSummaryCustomerReference(){
    const { job } = useJobContext();

    return ( 
        <SubsectionWrapper css="jobSummaryCustomerRef">
            <h4>Customer Reference{ job.poList.length > 1 ? "s" : ""}</h4>
            <ul className={"jobSummaryCustomerRef_list"}>
                { job.poList.length === 0 ?
                    <li className={"empty-section-notice"}>TBC</li>
                    :
                    job.poList.map((po) => {
                        return  <li key={`${po.po_id}`} 
                                    className={"jobSummaryCustomerRef_listItem"}
                                >
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
    )
}


function JobSummaryItems(){
    const { currency, job } = useJobContext();

    const N = 5;
    const hasOverflow = job.itemsList !== null && job.itemsList !== undefined && job.itemsList.length > N;

    let topN = [];
    if(job.itemsList !== null && job.itemsList !== undefined && job.itemsList.length > 0){
        const sorted = job.itemsList.toSorted((a, b) => { 
            return b.selling_price - a.selling_price 
        });
        topN = hasOverflow 
            ? topN = sorted.slice(0, N)
            : topN = sorted
        ;
    }

    return (
        <SubsectionWrapper css="jobSummaryItems">
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
    )
}






