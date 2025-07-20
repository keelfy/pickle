"use client";

import AuthForm from "@/components/auth-form";
import ory from "@/lib/ory";
import { isResponseError, RegistrationFlow, ResponseError } from "@ory/client-fetch";
import { redirect } from "next/navigation";
import { useQueryState } from "nuqs";
import { parseAsBoolean, parseAsString } from "nuqs/server";
import React from "react";

export default function SignUpPage() {

    const [goto] = useQueryState("goto", parseAsString.withDefault("/"));
    const [refresh] = useQueryState("refresh", parseAsBoolean.withDefault(false));
    const [flowId, setFlowId] = useQueryState("flow", parseAsString.withDefault(""));

    const [flow, setFlow] = React.useState<RegistrationFlow>();
    const [isFlowLoading, startFlowTransition] = React.useTransition();

    React.useEffect(() => {
        if (flow) return;

        startFlowTransition(async () => {
            let flow: RegistrationFlow | undefined = undefined;

            if (flowId.length > 0) {
                try {
                    flow = await ory.getRegistrationFlow({
                        id: flowId,
                    })
                } catch (error: any) {
                    if (isResponseError(error)) {
                        error.response.json().then(res => console.log("Failed to load existing registration flow", JSON.stringify(res.error.message)));
                    }
                    flow = undefined;
                }
            }

            if (!flow) {
                const returnTo = process.env.NEXT_PUBLIC_DOMAIN + decodeURIComponent(goto);
                try {
                    flow = await ory.createBrowserRegistrationFlow({
                        returnTo,
                    })
                } catch (error: any) {
                    if (error instanceof ResponseError) {
                        const res = await error.response.json();

                        switch (res.error.id) {
                            case 'session_already_available':
                                return redirect(returnTo);
                            default:
                                console.log("Failed to create registration flow", JSON.stringify(res.error.message));
                                break;
                        }
                    }
                }
            }

            setFlow(flow);
        });
    }, []);

    React.useEffect(() => {
        if (flowId !== flow?.id) {
            setFlowId(flow?.id ?? "");
        }
    }, [flow]);

    return <AuthForm flowType="registration" flow={flow} isFlowLoading={isFlowLoading} className="mx-auto flex-1" />;
}
