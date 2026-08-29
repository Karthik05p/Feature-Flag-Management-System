import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";


function WorkspaceLayout() {

    return (

        <div className="workspace">

            <Sidebar />

            <main className="workspace-main">

                <Outlet />

            </main>

        </div>
    );
}


export default WorkspaceLayout;
