import { useEffect, useState } from "react";

import {
    Search,
    Filter,
    Flag,
    MoreHorizontal
} from "lucide-react";

import { getFlags } from "../services/api";


function FeatureFlags() {

    const [flags, setFlags] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");


    useEffect(() => {

        async function load() {

            try {

                const data = await getFlags();

                setFlags(
                    Array.isArray(data)
                        ? data
                        : data.items || []
                );

            } catch {

                setFlags([]);

            }

        }

        load();

    }, []);


    const filtered = flags.filter(flag => {

        const name =
            flag.name ||
            flag.key ||
            "";

        const matchesSearch =
            name
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                );


        const flagStatus =
            String(
                flag.status ||
                (
                    flag.enabled
                        ? "enabled"
                        : "disabled"
                )
            ).toLowerCase();


        const matchesStatus =
            status === "all" ||
            flagStatus === status;


        return matchesSearch && matchesStatus;

    });


    return (

        <div className="page">

            <div className="page-header">

                <div>

                    <span className="breadcrumb">
                        Workspace / Feature Flags
                    </span>

                    <h1>
                        Feature Flags
                    </h1>

                    <p>
                        Release configuration
                    </p>

                </div>

                <button className="primary-button small">
                    + New Feature Flag
                </button>

            </div>


            <section className="panel">

                <div className="filter-bar">

                    <div className="search-box">

                        <Search size={17} />

                        <input
                            placeholder="Search flag name or key"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>


                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value)
                        }
                    >

                        <option value="all">
                            All statuses
                        </option>

                        <option value="enabled">
                            Enabled
                        </option>

                        <option value="disabled">
                            Disabled
                        </option>

                        <option value="active">
                            Active
                        </option>

                    </select>


                    <button className="filter-button">
                        <Filter size={16} />
                        Filters
                    </button>

                </div>


                <div className="table-info">
                    Showing {filtered.length} flags
                </div>


                <div className="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>FLAG</th>
                                <th>ENVIRONMENT</th>
                                <th>STATUS</th>
                                <th>TYPE</th>
                                <th>OWNER TEAM</th>
                                <th>DEFAULT VALUE</th>
                                <th>ACTIONS</th>

                            </tr>

                        </thead>


                        <tbody>

                            {filtered.map(
                                (flag, index) => (

                                    <tr
                                        key={
                                            flag.id ||
                                            index
                                        }
                                    >

                                        <td>

                                            <div className="flag-name">

                                                <div className="table-icon">
                                                    <Flag size={16} />
                                                </div>

                                                <div>

                                                    <strong>
                                                        {flag.name ||
                                                            flag.key ||
                                                            "Feature Flag"}
                                                    </strong>

                                                    <span>
                                                        {flag.key ||
                                                            "feature_flag"}
                                                    </span>

                                                </div>

                                            </div>

                                        </td>


                                        <td>
                                            {flag.environment ||
                                                "production"}
                                        </td>


                                        <td>

                                            <span
                                                className={
                                                    `badge ${
                                                        flag.enabled === false ||
                                                        flag.status === "disabled"
                                                            ? "danger"
                                                            : "success"
                                                    }`
                                                }
                                            >

                                                {flag.enabled === false ||
                                                flag.status === "disabled"
                                                    ? "Disabled"
                                                    : "Enabled"}

                                            </span>

                                        </td>


                                        <td>
                                            {flag.type ||
                                                "boolean"}
                                        </td>


                                        <td>
                                            {flag.owner_team ||
                                                flag.owner ||
                                                "—"}
                                        </td>


                                        <td>
                                            {String(
                                                flag.default_value ??
                                                flag.default ??
                                                false
                                            )}
                                        </td>


                                        <td>

                                            <button className="icon-button">
                                                <MoreHorizontal
                                                    size={18}
                                                />
                                            </button>

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>


                    {filtered.length === 0 && (

                        <div className="empty-state large">
                            No feature flags found.
                        </div>

                    )}

                </div>

            </section>

        </div>
    );
}


export default FeatureFlags;
