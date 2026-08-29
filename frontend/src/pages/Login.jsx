import { useState } from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    ArrowLeft,
    LockKeyhole,
    Zap
} from "lucide-react";

import { login } from "../services/api";


function Login() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    async function handleLogin(event) {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            const data = await login(
                username,
                password
            );

            localStorage.setItem(
                "access_token",
                data.access_token
            );

            navigate("/dashboard");

        } catch (error) {

            setError(
                error.message ||
                "Invalid username or password"
            );

        } finally {

            setLoading(false);

        }
    }


    return (

        <div className="login-page">

            <div className="login-background"></div>


            <div className="login-container">

                <Link
                    to="/"
                    className="back-link"
                >
                    <ArrowLeft size={17} />
                    Back to FlagFlow
                </Link>


                <div className="login-brand">

                    <div className="logo-mark">
                        <Zap size={20} />
                    </div>

                    <span>FlagFlow</span>

                </div>


                <div className="login-card">

                    <div className="login-icon">
                        <LockKeyhole size={22} />
                    </div>

                    <h1>
                        Secure workspace access
                    </h1>

                    <p>
                        Welcome back.
                    </p>

                    <span className="login-description">
                        Sign in to manage releases and
                        feature flags across your environments.
                    </span>


                    <form
                        onSubmit={handleLogin}
                    >

                        <label>
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            placeholder="Enter your username"
                            required
                        />


                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            required
                        />


                        {error && (

                            <div className="login-error">
                                {error}
                            </div>

                        )}


                        <button
                            type="submit"
                            disabled={loading}
                            className="login-button"
                        >
                            {loading
                                ? "Signing in..."
                                : "Sign in"
                            }
                        </button>

                    </form>


                    <div className="login-security">
                        ?? Your session is protected with
                        a short-lived bearer token.
                    </div>

                </div>

            </div>

        </div>
    );
}


export default Login;
