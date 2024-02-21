import { useState } from 'react';

export function useExpandableWrapper(){
    const [isExpanded, setIsExpanded] = useState(false);

    function toggle(){
        setIsExpanded(prev => !prev);
    }

    return {
        isExpanded,
        toggle
    }
}


export function ExpandableWrapper({ css, children }){
    const {
        isExpanded,
        toggle
    } = useExpandableWrapper();

    return <div className={`expandableWrapper expandableWrapper-${isExpanded ? "expanded" : "retracted"}${css === null ? "" : " " + css}`}>
                { children }
                <ExpandCollapseToggle 
                    isExpanded = { isExpanded }
                    handle_click = { toggle }
                />
            </div>
}


function ExpandCollapseToggle({ isExpanded, handle_click }){
    const css_modifier = isExpanded ? "collapse" : "expand";
    const display_text = css_modifier;

    return <div className={"expandableWrapper_toolbar"}>
                <button 
                    className={"expandableWrapper_button expandableWrapper_button-" + css_modifier } 
                    onClick={ handle_click }
                >
                    <span className={"sr-only"}>{ display_text }</span>
                </button>
            </div>
}
