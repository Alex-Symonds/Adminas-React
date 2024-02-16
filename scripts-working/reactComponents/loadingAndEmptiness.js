function LoadingUI(){
    return  <div class="loading">
                Loading...
            </div>
}

function LoadingErrorUI({ name }){
    return  <div class="loading error">
                Error loading { name ?? "content" }
            </div>
}

function EmptySectionUI({ css, message }){
    return  <p 
                className={`empty-section-notice${ css !== undefined ? ` ${ css }` : ''}`}
            >
                { message ?? "There's nothing to display here" }
            </p>
}