export function AddButton({css, disabled, label, onClick}){
    return  <button
                className={`add-button${ " " + css ?? "" }`}
                onClick={onClick}
                disabled={disabled ?? false}
            >
                { label }
            </button>
}


export function CancelButton({ css, cancel }){
    return <button 
            className={`close${css === undefined ? "" : " " + css}`} 
            onClick = { cancel }>
                <span>close</span>
            </button>
}


export function DeleteButton({ handleDelete, user_has_permission }){
    if(!user_has_permission){
        return null;
    }
    return  <button 
                type={"button"} 
                className="button-warning delete-btn formControls_button" 
                onClick={ handleDelete }
            >
                delete
            </button>
}


export function EditorControls({ bemClass, handleDelete, handleSubmit, wantDelete }){
    return (
        <div className={`controls formControls${ bemClass === undefined ? "" : " " + bemClass }`}>
            <SubmitButton   
                submit = { handleSubmit }
                cssClasses={"formControls_submit"}
            />
            <DeleteButton  
                handleDelete = { handleDelete } 
                user_has_permission = { wantDelete }  
            />
        </div>
    )
}


export function SubmitButton({submit, cssClasses}){
    const css = cssClasses ?? "";
    return  <button 
                className={`button-primary ${ css }`}
                onClick={ submit }
            >
                submit
            </button>
}



