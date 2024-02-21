/*
    Summary:
    Navigation of Job page sections

    Contents:
        || Hook
        || Burger Menu (for toggling on/off on narrower screens)
        || Sidebar
*/

import { useState } from 'react';
import { NavLink } from "react-router-dom";

import { JobToDoToggle } from './todoToggle';


/* 
    NOTE: If you want to change the URL-y bit, you need to replicate that change in utils.py
    in Django.
    (The URL for the Job page includes a slug for the job_id. I couldn't work out how to add
    a wildcard to the end without "losing" the slug-iness)
*/

// Link each display name to a URL
export const TAB_NAMES = {
    summary: ["Summary", "summary"],
    detailsAndPO: ["Details & PO", "details-and-po"],
    comments: ["Comments", "comments"],
    docs_out: ["Documents", "documents"],
    items: ["Items", "items"],
    pricecheck: ["Price Check", "price-check"]
}


// || Hook
export function useJobMenu(){

    // Set the display order here
    const TABS = [
        TAB_NAMES.summary, 
        TAB_NAMES.comments,
        TAB_NAMES.detailsAndPO,
        TAB_NAMES.docs_out,
        TAB_NAMES.items,
        TAB_NAMES.pricecheck
    ]
    
    const [menuIsOpen, setMenuIsOpen] = useState(true);

    function openJobMenu(){
        setMenuIsOpen(true);
    }

    function closeJobMenu(){
        setMenuIsOpen(false);
    }

    return {
        isOpen: menuIsOpen,
        open: openJobMenu,
        close: closeJobMenu,
        TABS,
        TAB_NAMES
    }
}


// || Burger Menu
export function BurgerMenuIcon({open}){
    return (
        <div className={"burgerMenu"}>
            <button
                className = { "burgerMenu_button" }
                onClick = { open }
                > 
                <span className={ "buttonSpan" }>
                    open menu
                </span>
            </button>
        </div>
    )
}


// || Sidebar
export function JobSideNav({ close, isOpen, job_id, names, TABS }){
    return (
        <section className={`jobSideNav jobSideNav-${ isOpen ? "open" : "closed" }`}>
            <button 
                className={"jobSideNav_closeButton close"}
                onClick={ () => close() }
                >
                <span>close</span>
            </button>
            <JobSidebarHeadingUI   
                job_id = { job_id }
                names = { names }
            />

            <ul className={"jobSideNav_list"}>
            { TABS.map((tabNames) => {
                const displayAs = tabNames[0];
                const urlFriendly = tabNames[1];

                return <li key={`jobSideNavTab-${urlFriendly}`}>
                    <NavLink to={`${urlFriendly}`}
                        className=  {({ isActive, isPending }) =>
                                        isActive
                                        ? "jobSideNav_button jobSideNav_button-on"
                                            : isPending
                                            ? "jobSideNav_button"
                                            : "jobSideNav_button"
                                    }
                        >
                        {displayAs}
                    </NavLink>
                </li>
            })}
            </ul>
        </section>
    )
}
//className={`jobSideNav_button${displayAs === activeTab ? " jobSideNav_button-on" : ""}`}

function JobSidebarHeadingUI({ job_id, names }){
    return (
        <div className={"jobSideNav_topWrapper"}>
            <div>
                <h3 className={"jobSideNav_heading"}>
                    { names.job_name }
                </h3>
                <JobSidebarSubHeadingUI  
                    customer_name = { names.customer_name } 
                />
            </div>
            <JobToDoToggle   
                job_id = { job_id }
            />
        </div>
    )
}


function JobSidebarSubHeadingUI({ customer_name }){
    return customer_name !== ''
        ? 
        <div className="jobSideNav_subheading">
            for {customer_name}
        </div>
        : null;
}









