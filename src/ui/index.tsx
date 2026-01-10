import React from "react";
import { createRoot } from "react-dom/client";
import addOnUISdk, { RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import App from "./components/App";
import { DocumentSandboxApi } from "../models/DocumentSandboxApi";

addOnUISdk.ready.then(async () => {
    const { runtime } = addOnUISdk.instance;
    const sandboxProxy: DocumentSandboxApi = await runtime.apiProxy(RuntimeType.documentSandbox);
    
    const root = createRoot(document.getElementById("root")!);
    root.render(<App addOnUISdk={addOnUISdk} sandboxProxy={sandboxProxy} />);
});
