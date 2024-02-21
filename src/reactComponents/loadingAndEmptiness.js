export function LoadingUI(){
    return  <div className="loading">
                Loading...
            </div>
}

export function LoadingErrorUI({ name }){
    return  <div className="loading error">
                Error loading { name ?? "content" }
            </div>
}

export function EmptySectionUI({ css, message }){
    return  <p 
                className={`empty-section-notice${ css !== undefined ? ` ${ css }` : ''}`}
            >
                { message ?? "There's nothing to display here" }
            </p>
}