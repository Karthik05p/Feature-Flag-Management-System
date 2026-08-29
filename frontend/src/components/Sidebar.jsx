import {
    LayoutDashboard,
    Flag,
    Globe2,
    Rocket,
    BarChart3,
    ClipboardList,
    Settings,
    LogOut,
    Zap
} from "lucide-react";

import {
    NavLink,
    useNavigate
} from "react-router-dom";


function Sidebar() {

    const navigate = useNavigate();

    function logout() {

        localStorage.removeItem(
            "access_token"
        );

        navigate("/login");
    }


    const links = [
        {
            name: "Overview",
            path: "/dashboard",
            icon: LayoutDashboard
        },
        {
            name: "Feature Flags",
            path: "/dashboard/flags",
            icon: Flag
        },
        {
            name: "Environments",
            path: "/dashboard/environments",
            icon: Globe2
        },
        {
            name: "Rollouts",
            path: "/dashboard/rollouts",
            icon: Rocket
        },
        {
            name: "Analytics",
            path: "/dashboard/analytics",
            icon: BarChart3
        },
        {
            name: "Audit Logs",
            path: "/dashboard/audit-logs",
            icon: ClipboardList
        }
    ];


    return (

        <aside className="sidebar">

            <div className="sidebar-brand">

                <div className="brand-icon">
                    <Zap size={20} />
                </div>

                <div>
                    <h2>FlagFlow</h2>
                    <span>Release Control</span>
                </div>

            </div>


            <div className="sidebar-section">

                <p>WORKSPACE</p>

                <nav>

                    {links.map((link) => {

                        const Icon = link.icon;

                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                end={
                                    link.path ===
                                    "/dashboard"
                                }
                                className={({ isActive }) =>
                                    `sidebar-link ${
                                        isActive
                                            ? "active"
                                            : ""
                                    }`
                                }
                            >

                                <Icon size={18} />

                                <span>
                                    {link.name}
                                </span>

                            </NavLink>
                        );

                    })}

                </nav>

            </div>


            <div className="sidebar-section account">

                <p>ACCOUNT</p>

                <NavLink
                    to="/dashboard/settings"
                    className={({ isActive }) =>
                        `sidebar-link ${
                            isActive ? "active" : ""
                        }`
                    }
                >

                    <Settings size={18} />

                    <span>Settings</span>

                </NavLink>


                <button
                    className="sidebar-link logout-button"
                    onClick={logout}
                >

                    <LogOut size={18} />

                    <span>Sign out</span>

                </button>

            </div>


            <div className="user-card">

                <div className="avatar">
                    B
                </div>

                <div>

                    <strong>Bhavesh</strong>

                    <span>
                        Administrator
                    </span>

                </div>

            </div>

        </aside>
    );
}


export default Sidebar;
