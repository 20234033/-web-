module.exports = [
"[project]/frontend/node_modules/leaflet/dist/leaflet-src.js [app-ssr] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/9e883_leaflet_dist_leaflet-src_941b27c0.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/frontend/node_modules/leaflet/dist/leaflet-src.js [app-ssr] (ecmascript)");
    });
});
}),
];