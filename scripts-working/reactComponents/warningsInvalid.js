function InvalidIconUI({ message }){
    return <div class="invalid-icon"><span>{message}</span></div>
}

function WarningSubsection({ css, message, show_warning, title }){
    // Displays a warning message inside a "subsection": red background on the heading, red left side border.
    // If this boggles the eyes, consider using WarningSubSubsectionUI instead.
    if(!show_warning){
        return null;
    }
    return [
        <div className={`warning subsection${css !== undefined ? " " + css : ""}`}>
            <h4>{ title ?? "Warning" }</h4>
            <p>{ message }</p>
        </div>
    ]
}

function WarningSubSubsectionUI({ css, message, title, children }){
    // Sometimes there's already a subsection and the warning text/content must go inside it.
    // If the subsection-within-a-subsection formatting boggles the eyes, use this instead.
    return [
        <div className={`warningSubSubsection${css !== undefined ? " " + css : ""}`}>
            <h4 className={"warningSubSubsection_heading"}>
                <img src={`${window.PATH_IMAGES}i-warning.svg`}  height="18px" aria-hidden="true" />
                { title ? title : "Warning" }
            </h4>
            <p className={"warningSubSubsection_text"}>{ message }</p>
            { children === undefined ?
                null
                : children
            }
        </div>
    ]
}

