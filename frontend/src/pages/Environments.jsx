import { useEffect, useState } from "react";

import {
    Search,
    Globe2,
    Pencil,
    Trash2
} from "lucide-react";

import { getEnvironments } from "../services/api";


function Environments() {

    const [environments, setEnvironments] =
        useState([]);

    const [search, setSearch] =
        useState("");


    useEffect(() => {

        async function load() {

            try {

                const data =
                    await getEnvironments();

                setEnvironments(
                    Array.isArray(data)
                        ? data
                        : data.items || []
                );

            } catch {

                setEnvironments([]);

            }

        }

        load();

    }, []);


    const filtered =
        environments.filter(environment =>
            (
                environment.name ||
                ""
            )
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                )
        );


    return (

        <div className="page">

            <div className="page-header">

                <div>

                    <span className="breadcrumb">
                        Workspace / Environments
                    </span>

                    <h1>
                        Environments
                    </h1>

                    <p>
                        Workspace configuration
                    </p>

                    <span className="page-description">
                        Organize feature releases into clear,
                        independently managed contexts.
                    </span>

                </div>


                <button className="primary-button small">
                    + New Environment
                </button>

            </div>


            <section className="panel">

                <div className="filter-bar">

                    <div className="search-box">

                        <Search size={17} />

                        <input
                            placeholder="Search environments"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>

                </div>


                <div className="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>NAME</th>
                                <th>DESCRIPTION</th>
                                <th>STATUS</th>
                                <th>CREATED</th>
                                <th>UPDATED</th>
                                <th>ACTIONS</th>

                            </tr>

                        </thead>


                        <tbody>

                            {filtered.map(
                                (environment, index) => (

                                    <tr
                                        key={
                                            environment.id ||
                                            index
                                        }
                                    >

                                        <td>

                                            <div className="flag-name">

                                                <div className="table-icon">
                                                    <Globe2 size={16} />
                                                </div>

                                                <strong>
                                                    {environment.name}
                                                </strong>

                                            </div>

                                        </td>


                                        <td>
                                            {
                                                environment.description ||
                                                "Release environment"
                                            }
                                        </td>


                                        <td>

                                            <span className="badge success">
                                                Active
                                            </span>

                                        </td>


                                        <td>
                                            {environment.created_at ||
                                                "—"}
                                        </td>


                                        <td>
                                            {environment.updated_at ||
                                                "—"}
                                        </td>


                                        <td>

                                            <button className="icon-button">
                                                <Pencil size={16} />
                                            </button>

                                            <button className="icon-button danger-icon">
                                                <Trash2 size={16} />
                                            </button>

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>


                    {filtered.length === 0 && (

                        <div className="empty-state large">
                            No environments found.
                        </div>

                    )}

                </div>

            </section>

        </div>
    );
}


export default Environments;
