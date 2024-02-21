/*
    Job page
    * Handles loading issues
    * Applies wrapper with sidebar/burger menu
    * Has the <Outlet /> for the routes to go inside
*/

import { Outlet } from 'react-router-dom';

import { ErrorModal } from '../reactComponentsWithHooks/errors.js';
import { BurgerMenuIcon, JobSideNav } from '../reactComponentsWithHooks/jobSideNav.js';

import { LoadingUI, LoadingErrorUI } from '../reactComponents/loadingAndEmptiness.js';

import { useJobContext } from '../hooks/useJobContext.js';

export function JobPage(){
    const {
        fetchProps
    } = useJobContext();

    return fetchProps.error
        ? <LoadingErrorUI name='page' />
        : (!fetchProps.isLoaded || fetchProps.data === null)
            ? <LoadingUI />
            : <JobPageUI />
}


function JobPageUI(){
    const {
        actions,
        job,
        jobMenu,
    } = useJobContext();

    return (
        <JobPageWrapperUI
            job = { job }
            jobMenu = { jobMenu }
        >
            { actions.errors.showError ?
                <ErrorModal 
                    message = { actions.errors.message }
                    clear = { actions.errors.clear }
                />
                : null
            }
            <Outlet />
        </JobPageWrapperUI>
    )
}


function JobPageWrapperUI({ job, jobMenu, children}){
    return (
        <div className={"jobPage"}>
            <JobSideNav 
                close = { jobMenu.close }
                isOpen = { jobMenu.isOpen }
                job_id = { job.id }
                names = { job.names }
                TABS = { jobMenu.TABS }
            />

            { !jobMenu.isOpen ?
                <BurgerMenuIcon 
                    open = { jobMenu.open }
                />
                : null
            }

            <div className={"jobPageContentsWrapper"}>
                <JobHeadingUI
                    customer_via_agent = { job.names.customer_via_agent }
                    job_name = { job.names.job_name }
                />
                { children }
            </div>
        </div>
    )
}


function JobHeadingUI({ customer_via_agent, job_name }){
    return (
        <div className="jobPageHeading">
            <h2 className={"pageHeading jobPageHeading_heading"}>
                Job { job_name }
            </h2>
            <JobSubHeadingUI  
                customer_via_agent = { customer_via_agent }
            />
        </div>
    )
}


function JobSubHeadingUI({ customer_via_agent }){
    return customer_via_agent === '' 
        ? null
        :
        <div className="jobPageHeading_subheading subheading">
            { customer_via_agent }
        </div>
}