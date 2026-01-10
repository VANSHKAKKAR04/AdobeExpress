const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");

const isEnvProduction = process.env.NODE_ENV === "production";

const uiPath = path.resolve(__dirname, "./src/ui");
const sandboxPath = path.resolve(__dirname, "./src/sandbox");
const servicesPath = path.resolve(__dirname, "./src/services");
const modelsPath = path.resolve(__dirname, "./src/models");

module.exports = {
    mode: isEnvProduction ? "production" : "development",
    devtool: "source-map",
    entry: {
        index: "./src/ui/index.tsx",
        code: "./src/sandbox/code.ts"
    },
    experiments: {
        outputModule: true
    },
    output: {
        pathinfo: !isEnvProduction,
        path: path.resolve(__dirname, "dist"),
        module: true,
        filename: "[name].js"
    },
    externalsType: "module",
    externalsPresets: { web: true },
    externals: {
        "add-on-sdk-document-sandbox": "add-on-sdk-document-sandbox",
        "express-document-sdk": "express-document-sdk"
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/index.html",
            scriptLoading: "module",
            excludeChunks: ["code"]
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: "src/*.json", to: "[name][ext]" }]
        }),
        new Dotenv({
            path: path.resolve(__dirname, ".env"),
            systemvars: false, // Don't override with system environment variables
            safe: false, // Don't require .env.example
            silent: false, // Show warnings if .env file is missing
            defaults: false // Don't use .env.defaults
        })
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: path.resolve(uiPath, "tsconfig.json")
                        }
                    }
                ],
                include: uiPath,
                exclude: /node_modules/
            },
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: path.resolve(sandboxPath, "tsconfig.json")
                        }
                    }
                ],
                include: sandboxPath,
                exclude: /node_modules/
            },
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: path.resolve(uiPath, "tsconfig.json")
                        }
                    }
                ],
                include: [servicesPath, modelsPath],
                exclude: /node_modules/
            },
            {
                test: /(\.css)$/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".css"]
    }
};
