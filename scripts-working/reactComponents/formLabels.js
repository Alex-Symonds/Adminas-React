function FormLabel(props){
    return  <label for={props.inputID} className={"formy_label"}>
                { props.children }
            </label>
}

function LabelFieldContainer({children}){
    return  <div className={"formy_labelFieldContainer"}>
                { children }
            </div>
}
