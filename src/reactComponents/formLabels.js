export function FormLabel(props){
    return  <label htmlFor={props.inputID} className={"formy_label"}>
                { props.children }
            </label>
}

export function LabelFieldContainer({children}){
    return  <div className={"formy_labelFieldContainer"}>
                { children }
            </div>
}
