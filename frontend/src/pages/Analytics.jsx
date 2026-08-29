import {
    BarChart3,
    Activity,
    Globe2,
    Flag
} from "lucide-react";


function Analytics() {

    return (

        <div className="page">

            <div className="page-header">

                <div>

                    <span className="breadcrumb">
                        Workspace / Analytics
                    </span>

                    <h1>
                        Analytics
                    </h1>

                    <p>
                        Configuration intelligence
                    </p>

                    <span className="page-description">
                        Evaluation activity across flags
                        and environments.
                    </span>

                </div>

            </div>


            <div className="stats-grid">

                <div className="stat-card">

                    <div className="stat-icon">
                        <Activity size={20} />
                    </div>

                    <span>Total Evaluation Activity</span>

                    <strong>—</strong>

                    <small>
                        Backend telemetry availability
                    </small>

                </div>


                <div className="stat-card">

                    <div className="stat-icon">
                        <Globe2 size={20} />
                    </div>

                    <span>Environments</span>

                    <strong>—</strong>

                    <small>
                        Evaluation activity by environment
                    </small>

                </div>


                <div className="stat-card">

                    <div className="stat-icon">
                        <Flag size={20} />
                    </div>

                    <span>Flag Activity</span>

                    <strong>—</strong>

                    <small>
                        Evaluation activity by flag
                    </small>

                </div>

            </div>


            <div className="dashboard-grid">

                <section className="panel chart-panel">

                    <div className="panel-header">

                        <div>
                            <span>HOURLY ACTIVITY</span>

                            <h2>
                                Evaluation Volume
                            </h2>
                        </div>

                        <BarChart3 />

                    </div>


                    <div className="chart-placeholder">

                        <div className="chart-bars">

                            {[35, 50, 42, 70, 55, 82, 64, 90, 73, 48, 68, 80].map(
                                (height, index) => (

                                    <div
                                        key={index}
                                        style={{
                                            height: `${height}%`
                                        }}
                                    />

                                )
                            )}

                        </div>

                        <span>
                            Evaluations per hour
                        </span>

                    </div>

                </section>


                <section className="panel">

                    <div className="panel-header">

                        <div>
                            <span>ENVIRONMENT ACTIVITY</span>

                            <h2>
                                Evaluations by Environment
                            </h2>
                        </div>

                    </div>


                    <div className="analytics-list">

                        <div>
                            <span>production</span>
                            <strong>—</strong>
                        </div>

                        <div>
                            <span>staging</span>
                            <strong>—</strong>
                        </div>

                        <div>
                            <span>development</span>
                            <strong>—</strong>
                        </div>

                    </div>

                </section>

            </div>


            <div className="info-banner">
                Recorded configuration mutations are
                available through Audit Logs. Evaluation
                telemetry depends on the current backend.
            </div>

        </div>
    );
}


export default Analytics;
