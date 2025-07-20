import { OryClientConfiguration } from "@ory/elements-react/index";

const config: OryClientConfiguration = {
    name: "pickle",
    sdk: {
        url: "https://www.pickle.com/api/v1/auth/sdk",
        options: {
            basePath: "https://www.pickle.com/api/v1/auth/sdk",
        }
    },
    project: {
        registration_enabled: true,
        verification_enabled: false,
        recovery_enabled: false,
        recovery_ui_url: "https://www.pickle.com/auth/recovery",
        registration_ui_url: "https://pickle.com/auth/registration",
        verification_ui_url: "https://pickle.com/auth/verification",
        login_ui_url: "https://pickle.com/auth/login",
    }
}

export default config;
