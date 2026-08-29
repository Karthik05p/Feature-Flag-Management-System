import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";


import Landing from "./pages/Landing";
import Login from "./pages/Login";

import Overview from "./pages/Overview";
import FeatureFlags from "./pages/FeatureFlags";
import Environments from "./pages/Environments";
import Rollouts from "./pages/Rollouts";
import Analytics from "./pages/Analytics";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";

import ProtectedRoute from "./components/ProtectedRoute";
import WorkspaceLayout from "./components/WorkspaceLayout";


import "./App.css";


function App() {

    return (

        <BrowserRouter>

            <Routes>


                {/* LANDING */}

                <Route
                    path="/"
                    element={<Landing />}
                />


                {/* LOGIN */}

                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* PROTECTED WORKSPACE */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <WorkspaceLayout />
                        </ProtectedRoute>
                    }
                >

                    <Route
                        index
                        element={<Overview />}
                    />

                    <Route
                        path="flags"
                        element={<FeatureFlags />}
                    />

                    <Route
                        path="environments"
                        element={<Environments />}
                    />

                    <Route
                        path="rollouts"
                        element={<Rollouts />}
                    />

                    <Route
                        path="analytics"
                        element={<Analytics />}
                    />

                    <Route
                        path="audit-logs"
                        element={<AuditLogs />}
                    />

                    <Route
                        path="settings"
                        element={<Settings />}
                    />

                </Route>


                {/* UNKNOWN ROUTES */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}


export default App;
