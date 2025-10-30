import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import addOnUISdk, { RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
    const { runtime } = addOnUISdk.instance;
    const sandboxProxy: any = await runtime.apiProxy(RuntimeType.documentSandbox);
    
    function App() {
        // State for button disabled status
        const [isReady, setIsReady] = useState(true);
        
        // Handler for creating blue rectangle
        const handleBlueRectangle = () => {
            const blueColor = { red: 0.2, green: 0.4, blue: 0.9, alpha: 1 };
            sandboxProxy.createRectangle(blueColor);
        };
        
        // Handler for creating red rectangle
        const handleRedRectangle = () => {
            const redColor = { red: 0.9, green: 0.2, blue: 0.2, alpha: 1 };
            sandboxProxy.createRectangle(redColor);
        };
        
        // Handler for creating green ellipse
        const handleGreenEllipse = () => {
            const greenColor = { red: 0.2, green: 0.8, blue: 0.3, alpha: 1 };
            sandboxProxy.createEllipse(greenColor);
        };
        
        // Handler for creating purple ellipse
        const handlePurpleEllipse = () => {
            const purpleColor = { red: 0.6, green: 0.2, blue: 0.8, alpha: 1 };
            sandboxProxy.createEllipse(purpleColor);
        };
        
        // Handler for rainbow
        const handleRainbow = () => {
            sandboxProxy.createRainbowRect();
        };
        
        return (
            <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
                <h2 style={{ marginBottom: "20px" }}>My First Add-on</h2>
                
                <div style={{ marginBottom: "30px" }}>
                    <h3 style={{ marginBottom: "10px" }}>Rectangles</h3>
                    <button 
                        onClick={handleBlueRectangle}
                        disabled={!isReady}
                        style={buttonStyle("#2E86DE")}
                    >
                        Create Blue Rectangle
                    </button>
                    <button 
                        onClick={handleRedRectangle}
                        disabled={!isReady}
                        style={buttonStyle("#E74C3C")}
                    >
                        Create Red Rectangle
                    </button>
                </div>
                
                <div style={{ marginBottom: "30px" }}>
                    <h3 style={{ marginBottom: "10px" }}>Ellipses</h3>
                    <button 
                        onClick={handleGreenEllipse}
                        disabled={!isReady}
                        style={buttonStyle("#27AE60")}
                    >
                        Create Green Ellipse
                    </button>
                    <button 
                        onClick={handlePurpleEllipse}
                        disabled={!isReady}
                        style={buttonStyle("#8E44AD")}
                    >
                        Create Purple Ellipse
                    </button>
                </div>
                
                <div>
                    <h3 style={{ marginBottom: "10px" }}>Special Effects</h3>
                    <button 
                        onClick={handleRainbow}
                        disabled={!isReady}
                        style={buttonStyle("#34495E")}
                    >
                        🌈 Create Rainbow
                    </button>
                </div>
            </div>
        );
    }
    
    // Helper function for button styling
    const buttonStyle = (bgColor: string) => ({
        width: "100%",
        padding: "12px",
        marginBottom: "10px",
        backgroundColor: bgColor,
        color: "white",
        border: "none",
        borderRadius: "5px",
        fontSize: "14px",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "opacity 0.2s",
    });
    
    const root = createRoot(document.getElementById("root")!);
    root.render(<App />);
});
