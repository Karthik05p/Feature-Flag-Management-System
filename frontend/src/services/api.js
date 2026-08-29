const API_URL = "http://127.0.0.1:8000";


async function request(path, options = {}) {

    const token = localStorage.getItem("access_token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_URL}${path}`,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        throw new Error("Session expired");
    }

    const text = await response.text();

    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.detail || "Request failed"
        );
    }

    return data;
}


export async function login(username, password) {

    return request(
        "/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                username,
                password
            })
        }
    );
}


export async function getFlags() {
    return request("/flags");
}


export async function getEnvironments() {
    return request("/environments");
}


export async function getAuditLogs() {
    return request("/audit-logs");
}


export async function getFlagVersions() {
    return request("/flag-versions");
}


export async function getEvaluations() {
    return request("/evaluation");
}


export default request;
