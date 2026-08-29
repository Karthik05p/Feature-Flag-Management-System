import {
    Search,
    Rocket
} from "lucide-react";


const rolloutData = [
    {
        flag: "Light Mode",
        key: "light_mode",
        environment: "development",
        rollout: "30%",
        status: "INACTIVE",
        treatment: "ENABLED",
        priority: 1,
        created: "Aug 27, 2026"
    },
    {
        flag: "New Checkout",
        key: "new_checkout",
        environment: "production",
        rollout: "75%",
        status: "ACTIVE",
        treatment: "DISABLED",
        priority: 1,
        created: "Aug 28, 2026"
    },
    {
        flag: "Fraud Review",
        key: "fraud_review",
        environment: "production",
        rollout: "15%",
        status: "ACTIVE",
        treatment: "ENABLED",
        priority: 1,
        created: "Aug 28, 2026"
    },
    {
        flag: "New Checkout",
        key: "new_checkout",
        environment: "staging",
        rollout: "50%",
        status: "ACTIVE",
        treatment: "ENABLED",
        priority: 1,
        created: "Aug 9, 2026"
    },
    {
        flag: "New Dashboard",
        key: "new_dashboard",
        environment: "staging",
        rollout: "25%",
        status: "ACTIVE",
        treatment: "ENABLED",
        priority: 1,
        created: "Aug 9, 2026"
    }
];


function Rollouts() {

    return (

        <div className="page">

            <div className="page-header">

                <div>

                    <span className="breadcrumb">
                        Workspace / Rollouts
                    </span>

                    <h1>
                        Rollouts
                    </h1>

                    <p>
                        Release Control
                    </p>

                    <span className="page-description">
                        Monitor percentage rollouts across
                        your feature flags.
                    </span>

                </div>

            </div>


            <div className="stats-grid">

                <div className="stat-card">

                    <div className="stat-icon">
                        <Rocket size={20} />
                    </div>

                    <span>Total Rollouts</span>

                    <strong>5</strong>

                    <small>
                        Percentage rules configured
                    </small>

                </div>


                <div className="stat-card">

                    <span>Active Rollouts</span>

                    <strong>3</strong>

                    <small>
                        Rules participating in evaluation
                    </small>

                </div>


                <div className="stat-card">

                    <span>Average Rollout</span>

                    <strong>39%</strong>

                    <small>
                        Across percentage rules
                    </small>

                </div>

            </div>


            <section className="panel">

                <div className="filter-bar">

                    <div className="search-box">

                        <Search size={17} />

                        <input
                            placeholder="Search by flag name or key"
                        />

                    </div>


                    <select>
                        <option>
                            All environments
                        </option>
                    </select>


                    <select>
                        <option>
                            All statuses
                        </option>
                    </select>


                    <select>
                        <option>
                            All treatments
                        </option>
                    </select>

                </div>


                <div className="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>FLAG</th>
                                <th>ENVIRONMENT</th>
                                <th>ROLLOUT</th>
                                <th>STATUS</th>
                                <th>TREATMENT</th>
                                <th>PRIORITY</th>
                                <th>CREATED</th>
                                <th>ACTION</th>

                            </tr>

                        </thead>


                        <tbody>

                            {rolloutData.map(
                                (item, index) => (

                                    <tr key={index}>

                                        <td>

                                            <div className="flag-name">

                                                <div className="table-icon">
                                                    <Rocket size={16} />
                                                </div>

                                                <div>

                                                    <strong>
                                                        {item.flag}
                                                    </strong>

                                                    <span>
                                                        {item.key}
                                                    </span>

                                                </div>

                                            </div>

                                        </td>

                                        <td>
                                            {item.environment}
                                        </td>

                                        <td>
                                            <strong>
                                                {item.rollout}
                                            </strong>
                                        </td>

                                        <td>

                                            <span
                                                className={
                                                    `badge ${
                                                        item.status === "ACTIVE"
                                                            ? "success"
                                                            : "muted"
                                                    }`
                                                }
                                            >
                                                {item.status}
                                            </span>

                                        </td>

                                        <td>
                                            {item.treatment}
                                        </td>

                                        <td>
                                            {item.priority}
                                        </td>

                                        <td>
                                            {item.created}
                                        </td>

                                        <td>
                                            <button className="table-action">
                                                Manage
                                            </button>
                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}


export default Rollouts;
