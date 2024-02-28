/*
    Summary:
    General Details section on the Job page
*/

import { useJobContext } from "../hooks/useJobContext";
import { url_for_page_load } from "../util";
import {
    useFetchWithLoading
} from '../hooks/useFetchWithLoading';

import { LoadingUI, LoadingErrorUI } from "../reactComponents/loadingAndEmptiness";

export function JobDetails(){
    const { currency, job }  = useJobContext();
    const { data, error, isLoaded } = useFetchWithLoading(url_for_page_load(job.id, 'details'));
    return error 
        ? <LoadingErrorUI name='details' />
        : !isLoaded
            ? <LoadingUI />
            : <JobDetailsUI
                currency = { currency }
                data = { data } 
            />
}

function JobDetailsUI({ currency, data }){
    return (
        <section className={"jobDetails jobPanelSection"}>

            <h3 className={"jobPanelSection_headingWrapper"}>
                <span className={"jobDetails_headerContent jobPanelSection_headingContent"}>
                    General Details
                    <a href={ data.url } className="edit-icon sectionHeadingWrapper_editIcon"><span>edit</span></a>
                </span>
            </h3>

            <JobDetailsIdSectionUI
                data = { data } 
            />
            <JobDetailsPaymentSectionUI 
                currency = { currency }
                data = { data } 
            />
            <JobDetailsDeliverySectionUI
                data = { data } 
            />
        </section>
    )
}

function JobDetailsIdSectionUI({ data }){
    return (
        <section className="jobDetails_subsection">
            <h4 className={"jobDetails_subsectionHeading jobPanelSection_subsectionHeading"}>Identification</h4>
            <JobDetailsReadRowUI heading="Name" value={ data.name } />
            <JobDetailsReadRowUI heading="Agent" value={ data.agent } />
            <JobDetailsReadRowUI heading="Customer" value={ data.customer } />
            <JobDetailsReadRowUI heading="Quote ref" value={ data.quote_ref } />
            <JobDetailsReadRowUI heading="Country" value={ data.country_name } />
            <JobDetailsReadRowUI heading="Language" value={ data.language } />
        </section>
    )
}

function JobDetailsPaymentSectionUI({ currency, data }){
    return (
        <section className="jobDetails_subsection">
            <h4 className={"jobDetails_subsectionHeading jobPanelSection_subsectionHeading"}>Payment</h4>
            <JobDetailsReadRowUI heading="Invoice address" value={ data.invoice_to } cssModifier={"wrap"} />
            <JobDetailsReadRowUI heading="Currency" value={ currency } cssModifier={"wrap"} />
            <JobDetailsReadRowUI heading="Payment terms" value={ data.payment_terms } cssModifier={"wrap"} />
        </section>
    )
}

function JobDetailsDeliverySectionUI({ data }){
    return (
        <section className="jobDetails_subsection">
            <h4 className={"jobDetails_subsectionHeading jobPanelSection_subsectionHeading"}>Delivery</h4>
            <JobDetailsReadRowUI heading="Delivery address" value={ data.delivery_to } cssModifier={"wrap"} />
            <JobDetailsReadRowUI heading="Incoterm" value={ data.incoterm_code + ' ' +  data.incoterm_location } cssModifier={"wrap"} />
        </section>
    )
}

function JobDetailsReadRowUI({ cssModifier, heading, value }){
    return (
        <div className={`jobDetails_row${cssModifier === undefined ? "" : ` jobDetails_row-${cssModifier}`}`}>
            <span className="jobDetails_rowLabel">{heading}: </span>
            <span className={`jobDetails_rowContent${cssModifier === undefined ? "" : ` jobDetails_rowContent-${cssModifier}`}`}>
                { value }
            </span>
        </div>
    )
}