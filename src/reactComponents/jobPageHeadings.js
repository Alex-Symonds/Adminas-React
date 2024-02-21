/*
    Components for use on Job page routes
*/
export function JobSectionHeadingUI({ text }){
    return <h3 className={"sectionHeading"}>{ text }</h3>
}


export function JobSectionHeadingNarrowUI({ text }){
    return  <h3 className={"sectionHeading jobNarrowSection_header"}>
                <span className={"jobNarrowSection_headerText"}>
                    { text }
                </span>
            </h3>
}