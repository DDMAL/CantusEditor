(function () {
    "use strict";
    document.manuscripts = {
        "CSG-0390-ID": {
            name: "St. Gallen, CSG-390",
            description: "",
            meiId: "csg-0390",
            meiSource: "local",
            iiifId: "csg-0390",
            iiifSource: "e_codices"
        }
    };
    document.meiSources = {
        local: {
            name: "Local folder",
            description: "Files stored within the CantusEditor",
            baseURL: document.URL,
            getMeiURL: function (meiId) {
                return this.baseURL + "resources/mei/" + meiId + "/";
            }
        }
    };
    document.iiifSources = {
        e_codices: {
            name: "Virtual Manuscript Library of Switzerland",
            description: "A free-access virtual library to all medieval" +
                    " and a selection of modern manuscripts of Switzerland",
            baseURL: "https://www.e-codices.unifr.ch/",
            getManifestURL: function (iiifId) {
                return this.baseURL + "metadata/iiif/" + iiifId + "/manifest.json";
            }
        }
    };
}());