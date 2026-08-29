import { useNavigate } from "react-router-dom";

function Dashboard() {
    const navigate = useNavigate();

    function logout() {
        localStorage.removeItem("access_token");
        navigate("/login");
    }

    return (
        <div className="dashboard">

            <aside className="sidebar">
                <div className="brand">
                    ?? Feature Control
                </div>

                <nav>
                    <button>?? Dashboard</button>
                    <button>?? Feature Flags</button>
                    <button>?? Environments</button>
                    <button>?? Targeting</button>
                    <button>?? Audit Logs</button>
                </nav>

                <button className="logout" onClick={logout}>
                    ?? Logout
                </button>
            </aside>

            <main className="dashboard-content">

                <header className="dashboard-header">
                    <div>
                        <h1>Dashboard</h1>
                        <p>Feature flag management overview</p>
                    </div>

                    <div className="user">
                        ?? Admin
                    </div>
                </header>

                <section className="stats">

                    <div className="stat-card">
                        <span>??</span>
                        <h2>24</h2>
                        <p>Total Flags</p>
                    </div>

                    <div className="stat-card">
                        <span>??</span>
                        <h2>18</h2>
                        <p>Active Flags</p>
                    </div>

                    <div className="stat-card">
                        <span>??</span>
                        <h2>4</h2>
                        <p>Environments</p>
                    </div>

                    <div className="stat-card">
                        <span>??</span>
                        <h2>127</h2>
                        <p>Audit Events</p>
                    </div>

                </section>

                <section className="dashboard-grid">

                    <div className="panel">
                        <h2>Feature Flags</h2>

                        <div className="flag-row">
                            <span>new-dashboard</span>
                            <span className="status active">
                                ACTIVE
                            </span>
                        </div>

                        <div className="flag-row">
                            <span>payment-v2</span>
                            <span className="status active">
                                ACTIVE
                            </span>
                        </div>

                        <div className="flag-row">
                            <span>experimental-search</span>
                            <span className="status inactive">
                                INACTIVE
                            </span>
                        </div>
                    </div>

                    <div className="panel">
                        <h2>Recent Activity</h2>

                        <div className="activity">
                            Flag <b>payment-v2</b> updated
                        </div>

                        <div className="activity">
                            Production environment modified
                        </div>

                        <div className="activity">
                            Rollout percentage changed to 50%
                        </div>
                    </div>

                </section>

            </main>
        </div>
    );
}

export default Dashboard;
