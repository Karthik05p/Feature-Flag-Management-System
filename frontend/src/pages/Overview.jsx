import { useEffect, useState } from "react";

import {
    Flag,
    CheckCircle2,
    Globe2,
    Activity,
    Rocket,
    ArrowRight
} from "lucide-react";

import {
    getFlags,
    getEnvironments
} from "../services/api";

import {
    Link
} from "react-router-dom";


function Overview() {

    const [flags, setFlags] = useState([]);
    const [environments, setEnvironments] = useState([]);

    useEffect(() => {

        async function load() {

            try {

                const flagData = await getFlags();

                setFlags(
                    Array.isArray(flagData)
                        ? flagData
                        : flagData.items || []
                );

            } catch {

                setFlags([]);

            }


            try {

                const environmentData =
                    await getEnvironments();

                setEnvironments(
                    Array.isArray(environmentData)
                        ? environmentData
                        : environmentData.items || []
                );

            } catch {

                setEnvironments([]);

            }

        }

        load();

    }, []);


    const enabled = flags.filter(
        flag =>
            flag.enabled === true ||
            flag.status === "enabled" ||
            flag.status === "active"
    ).length;


    const disabled =
        flags.length - enabled;


    return (

        <div className="page">

            <div className="page-header">

                <div>

                    <span className="breadcrumb">
                        Workspace / Overview
                    </span>

                    <h1>
                        Release Control Center
                    </h1>

                    <p>
                        Ship features with confidence.
                    </p>

                    <span className="page-description">
                        Monitor your feature configuration,
                        rollouts, environments and recent
                        workspace activity — all in one place.
                    </span>

                </div>

            </div>


            <div className="stats-grid">

                <div className="stat-card">

                    <div className="stat-icon">
                        <Flag size={20} />
                    </div>

                    <span>Total Flags</span>

                    <strong>
                        {flags.length || 0}
                    </strong>

                    <small>
                        Configured across your workspace
                    </small>

                </div>


                <div className="stat-card">

                    <div className="stat-icon">
                        <CheckCircle2 size={20} />
                    </div>

                    <span>Enabled Flags</span>

                    <strong>
                        {enabled}
                    </strong>

                    <small>
                        Currently active configurations
                    </small>

                </div>


                <div className="stat-card">

                    <div className="stat-icon">
                        <Activity size={20} />
                    </div>

                    <span>Disabled Flags</span>

                    <strong>
                        {disabled}
                    </strong>

                    <small>
                        Available for future releases
                    </small>

                </div>


                <div className="stat-card">

                    <div className="stat-icon">
                        <Globe2 size={20} />
                    </div>

                    <span>Environments</span>

                    <strong>
                        {environments.length || 0}
                    </strong>

                    <small>
                        Configured release contexts
                    </small>

                </div>

            </div>


            <div className="dashboard-grid">

                <section className="panel">

                    <div className="panel-header">

                        <div>
                            <span>WORKSPACE CONFIGURATION</span>

                            <h2>
                                Environment Status
                            </h2>
                        </div>

                        <Link to="/dashboard/environments">
                            View environments
                            <ArrowRight size={15} />
                        </Link>

                    </div>


                    <div className="environment-list">

                        {environments.length === 0 ? (

                            <div className="empty-state">
                                No environments available.
                            </div>

                        ) : (

                            environments.map(
                                (environment, index) => (

                                    <div
                                        className="environment-row"
                                        key={
                                            environment.id ||
                                            index
                                        }
                                    >

                                        <div>

                                            <strong>
                                                {environment.name ||
                                                    "Environment"}
                                            </strong>

                                            <span>
                                                {environment.description ||
                                                    "Release context"}
                                            </span>

                                        </div>

                                        <span className="badge success">
                                            Active
                                        </span>

                                    </div>

                                )
                            )

                        )}

                    </div>

                </section>


                <section className="panel">

                    <div className="panel-header">

                        <div>
                            <span>RELEASE CONTROL</span>

                            <h2>
                                Rollout Summary
                            </h2>
                        </div>

                        <Link to="/dashboard/rollouts">
                            View all rollouts
                            <ArrowRight size={15} />
                        </Link>

                    </div>


                    <div className="rollout-summary">

                        <div className="rollout-item">

                            <Rocket size={19} />

                            <div>

                                <strong>
                                    Percentage Rollouts
                                </strong>

                                <span>
                                    Controlled feature releases
                                </span>

                            </div>

                            <b>
                                ?
                            </b>

                        </div>


                        <div className="rollout-item">

                            <Activity size={19} />

                            <div>

                                <strong>
                                    Release Activity
                                </strong>

                                <span>
                                    Monitor configuration changes
                                </span>

                            </div>

                            <b>
                                ?
                            </b>

                        </div>

                    </div>

                </section>

            </div>


            <section className="panel">

                <div className="panel-header">

                    <div>
                        <span>WORKSPACE ACTIVITY</span>

                        <h2>
                            Recent Flag Changes
                        </h2>
                    </div>

                    <Link to="/dashboard/audit-logs">
                        View all audit logs
                        <ArrowRight size={15} />
                    </Link>

                </div>


                <div className="activity-placeholder">

                    <Activity size={28} />

                    <strong>
                        Configuration activity
                    </strong>

                    <span>
                        Recent changes to feature flags
                        will appear here.
                    </span>

                </div>

            </section>

        </div>
    );
}


export default Overview;
