function AddButton({css, disabled, label, onClick}){
    return  <button
                class={`add-button${ " " + css ?? "" }`}
                onClick={onClick}
                disabled={disabled ?? false}
            >
                { label }
            </button>
}


function CancelButton({ css, cancel }){
    return <button 
            className={`close${css === undefined ? "" : " " + css}`} 
            onClick = { cancel }>
                <span>close</span>
            </button>
}


function EditorControls({ bemClass, handleDelete, handleSubmit, wantDelete }){
    return [
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
    ]
}


function DeleteButton({ handleDelete, user_has_permission }){
    if(!user_has_permission){
        return null;
    }
    return  <button 
                type={"button"} 
                class="button-warning delete-btn formControls_button" 
                onClick={ handleDelete }
            >
                delete
            </button>
}


function SubmitButton({submit, cssClasses}){
    const css = cssClasses ?? "";
    return  <button 
                className={`button-primary ${ css }`}
                onClick={ submit }
            >
                submit
            </button>
}



