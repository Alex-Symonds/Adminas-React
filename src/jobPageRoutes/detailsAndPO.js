/*
    Summary:
    Wrapper to combine the Details and PO sections
*/

import { JobSectionHeadingNarrowUI } from "../reactComponents/jobPageHeadings.js";
import { JobDetails } from "./job-details";
import { JobPo } from "./po";

export function JobDetailsAndPO(){
    return <div className="jobDetailsPO jobNarrowSection">
            <JobSectionHeadingNarrowUI text="Details & Purchase Orders" />
            <div className="jobDetailsPO_wrapper">
                <JobDetails />
                <JobPo />
            </div>
        </div>
}