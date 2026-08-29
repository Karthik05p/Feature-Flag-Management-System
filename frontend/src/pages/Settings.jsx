import {
    User,
    ShieldCheck,
    Flag,
    Globe2,
    Rocket,
    BarChart3,
    ClipboardList,
    LogOut
} from "lucide-react";

import {
    useNavigate,
    Link
} from "react-router-dom";


function Settings() {

    const navigate = useNavigate();


    function logout() {

        localStorage.removeItem(
            "access_token"
        );

        navigate("/login");

    }


    return (

        <div className="page">

            <div className="page-header">

                <div>

                    <span className="breadcrumb">
                        Workspace / Settings
                    </span>

                    <h1>
                        Settings
                    </h1>

                    <p>
                        Workspace administration
                    </p>

                    <span className="page-description">
                        Manage your account access and
                        workspace experience.
                    </span>

                </div>

            </div>


            <div className="dashboard-grid">

                <section className="panel">

                    <div className="panel-header">

                        <div>
                            <span>ACCOUNT</span>

                            <h2>
                                Account & Session
                            </h2>
                        </div>

                        <User />

                    </div>


                    <div className="settings-list">

                        <div>
                            <span>Username</span>
                            <strong>admin</strong>
                        </div>

                        <div>
                            <span>Authentication</span>

                            <strong className="text-success">
                                Authenticated
                            </strong>
                        </div>

                        <div>
                            <span>Workspace Access</span>

                            <strong className="text-success">
                                Authenticated
                            </strong>
                        </div>

                        <div>
                            <span>Authentication Method</span>

                            <strong>
                                JWT Bearer Authentication
                            </strong>
                        </div>

                    </div>


                    <button
                        className="danger-button"
                        onClick={logout}
                    >

                        <LogOut size={17} />

                        Sign out

                    </button>

                </section>


                <section className="panel">

                    <div className="panel-header">

                        <div>
                            <span>WORKSPACE</span>

                            <h2>
                                Workspace Access
                            </h2>
                        </div>

                        <ShieldCheck />

                    </div>


                    <div className="shortcut-grid">

                        <Link to="/dashboard/flags">
                            <Flag />
                            <strong>Feature Flags</strong>
                            <span>
                                Manage application release controls
                            </span>
                        </Link>

                        <Link to="/dashboard/environments">
                            <Globe2 />
                            <strong>Environments</strong>
                            <span>
                                Review configured release contexts
                            </span>
                        </Link>

                        <Link to="/dashboard/rollouts">
                            <Rocket />
                            <strong>Rollouts</strong>
                            <span>
                                Monitor percentage rollout rules
                            </span>
                        </Link>

                        <Link to="/dashboard/analytics">
                            <BarChart3 />
                            <strong>Analytics</strong>
                            <span>
                                Explore configuration intelligence
                            </span>
                        </Link>

                        <Link to="/dashboard/audit-logs">
                            <ClipboardList />
                            <strong>Audit Logs</strong>
                            <span>
                                Review recorded workspace changes
                            </span>
                        </Link>

                    </div>

                </section>

            </div>

        </div>
    );
}


export default Settings;
