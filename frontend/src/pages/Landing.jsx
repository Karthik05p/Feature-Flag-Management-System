import {
    ArrowRight,
    ShieldCheck,
    Target,
    Rocket,
    Activity,
    Zap
} from "lucide-react";

import {
    Link,
    useNavigate
} from "react-router-dom";


function Landing() {

    const navigate = useNavigate();


    return (

        <div className="landing-page">

            <header className="landing-nav">

                <div
                    className="landing-logo"
                    onClick={() =>
                        navigate("/")
                    }
                >

                    <div className="logo-mark">
                        <Zap size={20} />
                    </div>

                    <span>FlagFlow</span>

                </div>


                <nav>

                    <a href="#features">
                        Features
                    </a>

                    <a href="#how">
                        How It Works
                    </a>

                    <a href="#about">
                        About
                    </a>

                </nav>


                <Link
                    to="/login"
                    className="nav-login"
                >
                    Login
                </Link>

            </header>


            <section className="hero">

                <div className="hero-content">

                    <div className="eyebrow">
                        FEATURE MANAGEMENT & RELEASE CONTROL
                    </div>

                    <h1>
                        Smart Feature Management.
                        <br />

                        <span>
                            Ship With Confidence.
                        </span>
                    </h1>

                    <p>
                        Manage feature flags, control rollouts,
                        target users and release application
                        features safely across multiple
                        environments.
                    </p>


                    <div className="hero-actions">

                        <Link
                            to="/login"
                            className="primary-button"
                        >
                            Get Started

                            <ArrowRight size={18} />

                        </Link>

                        <a
                            href="#features"
                            className="secondary-button"
                        >
                            Explore Features
                        </a>

                    </div>


                    <div className="hero-stats">

                        <div>
                            <strong>99.9%</strong>
                            <span>Reliable Releases</span>
                        </div>

                        <div>
                            <strong>24/7</strong>
                            <span>Feature Control</span>
                        </div>

                        <div>
                            <strong>100%</strong>
                            <span>Release Visibility</span>
                        </div>

                    </div>

                </div>


                <div className="hero-preview">

                    <div className="preview-window">

                        <div className="preview-header">

                            <span>Feature Dashboard</span>

                            <span className="live">
                                ? Live
                            </span>

                        </div>


                        <div className="preview-environment">
                            Environment
                            <strong>Production</strong>
                        </div>


                        <div className="preview-flags">

                            <div>
                                <span>New Checkout</span>
                                <small>checkout_v2</small>
                            </div>

                            <span className="status-on">
                                ON
                            </span>

                            <div>
                                <span>Dark Mode</span>
                                <small>dark_mode</small>
                            </div>

                            <span className="status-on">
                                ON
                            </span>

                            <div>
                                <span>Beta Search</span>
                                <small>beta_search</small>
                            </div>

                            <span className="status-off">
                                OFF
                            </span>

                        </div>


                        <div className="preview-footer">

                            <span>
                                All systems operational
                            </span>

                            <strong>
                                3 active flags
                            </strong>

                        </div>

                    </div>

                </div>

            </section>


            <section
                id="features"
                className="landing-section"
            >

                <div className="section-heading">

                    <span>FEATURES</span>

                    <h2>
                        Everything you need
                        for safer releases.
                    </h2>

                </div>


                <div className="feature-grid">

                    <div className="feature-card">
                        <ShieldCheck />
                        <h3>Feature Flags</h3>
                        <p>
                            Control application features
                            without redeploying code.
                        </p>
                    </div>

                    <div className="feature-card">
                        <Target />
                        <h3>Targeting</h3>
                        <p>
                            Deliver features to specific
                            users and groups.
                        </p>
                    </div>

                    <div className="feature-card">
                        <Rocket />
                        <h3>Controlled Rollouts</h3>
                        <p>
                            Gradually release features
                            with percentage-based rollouts.
                        </p>
                    </div>

                    <div className="feature-card">
                        <Activity />
                        <h3>Release Visibility</h3>
                        <p>
                            Track configuration changes
                            and release activity.
                        </p>
                    </div>

                </div>

            </section>


            <section
                id="how"
                className="workflow-section"
            >

                <span>HOW IT WORKS</span>

                <h2>
                    Create. Configure. Roll Out. Monitor.
                </h2>

                <div className="workflow">

                    <div>
                        <b>01</b>
                        <h3>Create</h3>
                        <p>
                            Create a feature flag.
                        </p>
                    </div>

                    <div>
                        <b>02</b>
                        <h3>Configure</h3>
                        <p>
                            Configure environments and rules.
                        </p>
                    </div>

                    <div>
                        <b>03</b>
                        <h3>Roll Out</h3>
                        <p>
                            Gradually release your feature.
                        </p>
                    </div>

                    <div>
                        <b>04</b>
                        <h3>Monitor</h3>
                        <p>
                            Track configuration activity.
                        </p>
                    </div>

                </div>

            </section>


            <footer
                id="about"
                className="landing-footer"
            >

                <strong>FlagFlow</strong>

                <span>
                    Feature Management & Release Control System
                </span>

                <span>
                    © 2026 FlagFlow. Built for safer releases.
                </span>

            </footer>

        </div>
    );
}


export default Landing;
