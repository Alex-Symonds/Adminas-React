/*
    Job Comments Filter Modal
    || Hook
    || Components
*/

// || Hook
import { useState } from 'react';

import { Modal } from '../reactComponents/modal';

export function useCommentsFilter(){
    const STATE_LIST = {
        false: 0,
        true: 1,
        both: 2,
    }

    const [filterPinned, setFilterPinned] = useState(STATE_LIST.both);
    const [filterHighlighted, setFilterHighlighted] = useState(STATE_LIST.both);
    const [filterPrivate, setFilterPrivate] = useState(STATE_LIST.both);

    function reset(){
        setFilterPinned(STATE_LIST.both);
        setFilterHighlighted(STATE_LIST.both);
        setFilterPrivate(STATE_LIST.both);
    }

    function filterActions(setter){
        return {
            setTrue: () => setter(STATE_LIST.true),
            setFalse: () => setter(STATE_LIST.false),
            setBoth: () => setter(STATE_LIST.both)
        }
    }

    function calcHeading(){
        /*
            Goal: Heading should describe the currently active filters.
            A status of "Both" means that comment property is ignored by the 
            filter, so it should also be ignored by the heading.
            If this results in a blank heading, return a default.
        */
        const headingPieces = [
            getHeadingForState(filterPinned, "Pinned", "Unpinned"),
            getHeadingForState(filterHighlighted, "Highlighted", "Unhighlighted"),
            getHeadingForState(filterPrivate, "Private", "Public"),
        ]
        const heading = headingPieces.reduce((result, element) => {
            return element === "" ?
                result
                : result === "" ?
                    element
                    : result + ", " + element;
        }, "");

        return heading !== "" ?
            heading
            : "All Comments";

        function getHeadingForState(filterState, trueStr, falseStr){
            return filterState === STATE_LIST.true ?
                    trueStr
                    : filterState === STATE_LIST.false ?
                        falseStr
                        : "";
        }
    }

    function applyTo(comments){
        if(comments === null){
            return [];
        }

        if(filterPinned === STATE_LIST.true){
            comments = comments.filter(c => c.pinned);
        } else if(filterPinned === STATE_LIST.false){
            comments = comments.filter(c => !c.pinned);
        }

        if(filterHighlighted === STATE_LIST.true){
            comments = comments.filter(c => c.highlighted);
        } else if(filterHighlighted === STATE_LIST.false){
            comments = comments.filter(c => !(c.highlighted));
        }

        if(filterPrivate === STATE_LIST.true){
            comments = comments.filter(c => c.private);
        } else if(filterPrivate === STATE_LIST.false){
            comments = comments.filter(c => !c.private);
        }

        return comments;
    }

    return {
        pinned: { current: filterPinned, actions: filterActions(setFilterPinned) },
        highlighted: { current: filterHighlighted, actions: filterActions(setFilterHighlighted)},
        private: { current: filterPrivate, actions: filterActions(setFilterPrivate)},
        STATE_LIST,
        heading: calcHeading(),
        reset,
        applyTo
    }
}



// || Components
export function JobCommentsFilterModal({ closeFn, filterKit, title }){
    return <Modal close={ closeFn }>
            <div className="commentFilterEditor">
                <h3 className={"modal_heading"}>{ title }</h3>
                <div className={"modal_contents"}>
                    <form className={"commentFilterEditor_form"}>
                        <CommentsRadioFilter 
                            legendStr = { "Pinned" }
                            groupName = { "filterByPinned" }
                            filterStatus = { filterKit.pinned.current }
                            FILTER_STATES = { filterKit.STATE_LIST }
                            trueStr = { "Pinned Only" }
                            falseStr = { "Unpinned Only" }
                            bothStr = { "Both" }
                            filterActions = { filterKit.pinned.actions }
                        />
                        <CommentsRadioFilter 
                            legendStr = { "Highlighted" }
                            groupName = { "filterByHiglighted" }
                            filterStatus = { filterKit.highlighted.current }
                            FILTER_STATES = { filterKit.STATE_LIST }
                            trueStr = { "Highlighted Only" }
                            falseStr = { "Unhighlighted Only" }
                            bothStr = { "Both" }
                            filterActions = { filterKit.highlighted.actions }
                        />
                        <CommentsRadioFilter 
                            legendStr = { "Private" }
                            groupName = { "filterByPrivacy" }
                            filterStatus = { filterKit.private.current }
                            FILTER_STATES = { filterKit.STATE_LIST }
                            trueStr = { "Private Only" }
                            falseStr = { "Public Only" }
                            bothStr = { "Both" }
                            filterActions = { filterKit.private.actions }
                        />
                    </form>
                </div>       
            </div>
        </Modal>
}


function CommentsRadioFilter({ bothStr, filterStatus, falseStr, filterActions, FILTER_STATES, groupName, legendStr, trueStr }){
    return  <fieldset className="radioFilter">
                <legend>{ legendStr }</legend>
                <RadioFilterOption 
                    isChecked = { filterStatus === FILTER_STATES.true }
                    display_text = { trueStr }
                    name = { groupName }
                    handleChange = { filterActions.setTrue }
                />
                <RadioFilterOption 
                    isChecked = { filterStatus === FILTER_STATES.false }
                    display_text = { falseStr }
                    name = { groupName }
                    handleChange = { filterActions.setFalse }
                />
                <RadioFilterOption 
                    isChecked = { filterStatus === FILTER_STATES.both }
                    display_text = { bothStr }
                    name = {groupName }
                    handleChange = { filterActions.setBoth }
                />
            </fieldset>
}


function RadioFilterOption({ display_text, handleChange, isChecked, name }){
    return  <label className={`radioFilter_optionLabel radioFilter_optionLabel-${isChecked ? "" : "un"}checked`}>
                <input  hidden
                        checked={ isChecked } type="radio"
                        disabled={false} name={ name } value={ display_text }
                        onChange={() => handleChange() }
                />
                <span className="radioFilter_optionStr">
                    { display_text }
                </span>
            </label>
}


