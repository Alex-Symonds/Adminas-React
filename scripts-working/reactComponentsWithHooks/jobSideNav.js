/*
    Summary:
    Navigation of Job page sections

    Contents:
        || Hook
        || Burger Menu (for toggling on/off on narrower screens)
        || Sidebar
*/

// || Hook
function useJobMenu(){
    // Set display names here
    const TAB_NAMES = {
        summary: "Summary", 
        detailsAndPO: "Details & PO",
        comments: "Comments",
        docs_out: "Documents",
        items: "Items",
        pricecheck: "Price Check"
    }
    
    // Set order here
    const TABS = [
        TAB_NAMES.summary, 
        TAB_NAMES.comments,
        TAB_NAMES.detailsAndPO,
        TAB_NAMES.docs_out,
        TAB_NAMES.items,
        TAB_NAMES.pricecheck
    ]
    
    const [menuIsOpen, setMenuIsOpen] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState(TABS[0]);

    function openJobMenu(){
        setMenuIsOpen(true);
    }

    function closeJobMenu(){
        setMenuIsOpen(false);
    }

    function updateActiveTab(tabName){
        if(TABS.findIndex(ele => ele === tabName) !== -1){
            setActiveTab(tabName);
        }

        // These appear in the CSS too, so always update both
        const sidebarWidthOnDesktop = 240;
        const breakpoint_permaShowJobNav = sidebarWidthOnDesktop * 5;

        var w = window.innerWidth;
        if(w < breakpoint_permaShowJobNav){
            closeJobMenu();
        }
    }

    return {
        isOpen: menuIsOpen,
        open: openJobMenu,
        close: closeJobMenu,
        activeTab,
        updateActiveTab,
        TABS,
        TAB_NAMES
    }
}


// || Burger Menu
function BurgerMenuIcon({open}){
    return [ 
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
    ]
}


// || Sidebar
function JobSideNav({ activeTab, close, isOpen, job_id, names, TABS, updateActiveTab }){
    return [
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
            { TABS.map((tabName) => 
                <li>
                    <button
                        className={`jobSideNav_button${tabName === activeTab ? " jobSideNav_button-on" : ""}`}
                        onClick={ () =>updateActiveTab(tabName) }
                        disabled={ tabName === activeTab }
                        >
                        {tabName}
                    </button>
                </li>
            )}
            </ul>
        </section>
        ]
}


function JobSidebarHeadingUI({ job_id, names }){
    return [
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
    ]
}


function JobSidebarSubHeadingUI({ customer_name }){
    return customer_name != ''
        ? 
        <div class="jobSideNav_subheading">
            for {customer_name}
        </div>
        : null;
}









