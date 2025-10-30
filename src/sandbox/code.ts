import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";

const { runtime } = addOnSandboxSdk.instance;

function start() {
    runtime.exposeApi({
        // Create a rectangle with custom color
        createRectangle: (color: { red: number; green: number; blue: number; alpha: number }) => {
            const rectangle = editor.createRectangle();
            rectangle.width = 240;
            rectangle.height = 180;
            rectangle.translation = { x: 50, y: 50 };
            
            const rectangleFill = editor.makeColorFill(color);
            rectangle.fill = rectangleFill;
            
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(rectangle);
        },
        
        // Create an ellipse with custom color
        createEllipse: (color: { red: number; green: number; blue: number; alpha: number }) => {
            const ellipse = editor.createEllipse();
            ellipse.rx = 120;  // Horizontal radius
            ellipse.ry = 90;   // Vertical radius
            ellipse.translation = { x: 150, y: 150 };
            
            const ellipseFill = editor.makeColorFill(color);
            ellipse.fill = ellipseFill;
            
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(ellipse);
        },
        
        // Create a colorful rainbow rectangle
        createRainbowRect: () => {
            // Create multiple rectangles with different colors
            const colors = [
                { red: 1, green: 0, blue: 0, alpha: 0.8 },      // Red
                { red: 1, green: 0.5, blue: 0, alpha: 0.8 },    // Orange
                { red: 1, green: 1, blue: 0, alpha: 0.8 },      // Yellow
                { red: 0, green: 1, blue: 0, alpha: 0.8 },      // Green
                { red: 0, green: 0, blue: 1, alpha: 0.8 },      // Blue
                { red: 0.5, green: 0, blue: 0.5, alpha: 0.8 },  // Purple
            ];
            
            colors.forEach((color, index) => {
                const rect = editor.createRectangle();
                rect.width = 40;
                rect.height = 200;
                rect.translation = { x: 50 + (index * 50), y: 100 };
                
                const fill = editor.makeColorFill(color);
                rect.fill = fill;
                
                const insertionParent = editor.context.insertionParent;
                insertionParent.children.append(rect);
            });
        }
    });
}

start();
