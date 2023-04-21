module.exports = env => {
    const path = require("path");
    const TerserPlugin = require("terser-webpack-plugin");
    const webpack = require("webpack");
    const fs = require('fs');
    const METADATA = fs.readFileSync('./GM.txt', 'utf8');
    const development = env["development"] === true;
    const mode = development ? "development" : "production";
    const retObj = {
        entry: "./src/Main.ts",
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                },
            ]
        },
        optimization: {
            minimize: false,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        format: {
                            comments: true,
                        },
                    },
                    extractComments: false,
                }),
            ],
        },
        mode,
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            modules: ["./node_modules", "./src"]
        },
        plugins: [
            new webpack.BannerPlugin({
                banner: METADATA,
                raw: true,
                entryOnly: true
            })
        ],
        output: {
            path: path.join(__dirname, "dist"),
            filename: `discordBlockedMessageRemover.user${development === false ? ".min" : ""}.js`,
            libraryTarget: "umd",
            library: "Fetish",
            globalObject: 'this'
        }
    };
    if (development) {
        retObj["devtool"] = "eval-source-map";
    }
    return retObj;
};
