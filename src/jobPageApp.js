/*
  Replaces the Job page with a React app
  Features routing for subpages, with react-router-dom
*/
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { ErrorWithRoute } from "./reactComponentsWithHooks/errors";

import { JobPage } from './jobPageRoutes/job-page';
import { JobComments } from './jobPageRoutes/comments';
import { JobDetailsAndPO } from './jobPageRoutes/detailsAndPO'; 
import { JobDocumentsUI } from './jobPageRoutes/documents';
import { JobItemsUI } from './jobPageRoutes/items';
import { JobPriceCheck } from './jobPageRoutes/price-check';
import { JobSummary } from './jobPageRoutes/summary';

import { JobDataProvider } from "./hooks/useJobContext";

import { TAB_NAMES } from "./reactComponentsWithHooks/jobSideNav";
const INDEX_FOR_TAB_URL = 1;


const router = createBrowserRouter([
  {
    path: `/job/${window.JOB_ID}/`,
    element: <JobPage />,
    errorElement: <ErrorWithRoute />,
    children: [
      {
        path: "",
        element: <JobSummary />,
      },
      {
        path: TAB_NAMES.summary[INDEX_FOR_TAB_URL],
        element: <JobSummary />,
      },
      {
        path: TAB_NAMES.detailsAndPO[INDEX_FOR_TAB_URL],
        element: <JobDetailsAndPO />,
      },
      {
        path: TAB_NAMES.comments[INDEX_FOR_TAB_URL],
        element: <JobComments />,
      },
      {
        path: TAB_NAMES.docs_out[INDEX_FOR_TAB_URL],
        element: <JobDocumentsUI />,
      },
      {
        path: TAB_NAMES.items[INDEX_FOR_TAB_URL],
        element: <JobItemsUI />,
      },
      {
        path: TAB_NAMES.pricecheck[INDEX_FOR_TAB_URL],
        element: <JobPriceCheck />,
      },
    ],
  },
]);

const rootEle = document.querySelector(".job-page");

ReactDOM.createRoot(rootEle).render(
  <React.StrictMode>
    <JobDataProvider>
      <RouterProvider router={router} />
    </JobDataProvider>
  </React.StrictMode>
);