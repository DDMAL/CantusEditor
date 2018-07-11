window.onload = function() {
    "use strict";
    var productionURL = "https://ddmal.github.io/CantusEditor/";
    var isProduction = document.URL === productionURL ? true : false;
    if(!isProduction) {
        console.log("Development environment detected.");
    }
    // Obtained from the data.js file
    var manuscripts = document.manuscripts;
    var meiSources = document.meiSources;
    var iiifSources = document.iiifSources;
    var manuscriptList = Object.keys(manuscripts);
    var meiEditor;
    var divaInstance;
    var element;
    var selectedManuscript = null;

    manuscriptList.forEach(addManuscript);
    $(document).ajaxStop(allManuscriptsAdded);
    $("#manuscriptSelect").change(updateSelectedManuscript);
    $("#manuscriptSubmit").click(loadManuscript);
    $(window).on('meiEditorLoaded', meiEditorLoaded);

    function addManuscript(manuscriptId) {
        var manuscript = manuscripts[manuscriptId];
        $("#manuscriptSelect").append("<option disabled id='manuscript_" +
            manuscriptId + "' value='" + manuscriptId + "'>" + 
            manuscript.name + "</option>");
        manuscript.id = manuscriptId;
        fetchMeiFolders(manuscript);
    }

    function fetchMeiFolders(manuscript) {
        var meiSource = meiSources[manuscript.meiSource];
        var meiURL = meiSource.getMeiURL(manuscript.meiId);
        $.ajax({
            url: meiURL,
            success: function(e) {
                manuscript.meiURL = meiURL;
                manuscript.meiFiles = getLinks(e, ".mei");
                fetchIIIFManifest(manuscript);
            },
            error: function(e) {
                if(!isProduction) {
                    console.log('>>> No ".mei" files found for' +
                        ' manuscript ' + manuscript.name);
                }
            }
        });
    }

    function getLinks(htmlCode, hasSubstr) {
        var lines = htmlCode.split("\n");
        var links = [];
        lines.forEach(function(line) {
        // Ignore empty lines
        if(!line) {
            return;
        }
        var link = line.match(/<a href=".*">/g);
        if(link) {
            var linkText = link[0].slice(9, -2);
            if(!hasSubstr || (hasSubstr && linkText.match(hasSubstr))) {
                links.push(linkText);
            }
        }
        });
        return links;
    }

    function fetchIIIFManifest(manuscript) {
        var iiifSource = iiifSources[manuscript.iiifSource];
        var manifestURL = iiifSource.getManifestURL(manuscript.iiifId);
        $.ajax({
            url: manifestURL,
            type: "HEAD",                
            success: function(e) {                    
                $('#manuscript_' + manuscript.id).attr('disabled', false);
                manuscript.manifestURL = manifestURL;
            },
            error: function(e) {
                if(!isProduction) {
                    console.log(">>> No IIIF Manifest found in " +
                        iiifSource.name + " for manuscript " +
                        manuscript.name);
                }
            }
        });
    }

    function updateSelectedManuscript() {
        var manuscriptId = $("#manuscriptSelect option:selected").attr('value');
        selectedManuscript = manuscripts[manuscriptId];
        $('#manuscriptDescription').html(selectedManuscript.description);
    }

    function allManuscriptsAdded() {
        $('#loadingHeader').html("Choose a manuscript to load:");
    }        

    function loadManuscript() {
    // Ignore the call if there is no selected manuscript.
    if(!selectedManuscript) return;

    $("#loadingScreen").html("The Cantus MEI Editor is loading...");

    $('#diva-wrapper').diva({
        fixedHeightGrid: true,
        objectData: selectedManuscript.manifestURL,
        enableIIIFMetadata: true,
        enableHighlight: true
    });

    divaInstance = $('#diva-wrapper').data('diva');

    element = "#mei-editor";
    var options =
    {
        meiEditorLocation: 'meix.js/',
        validatorLink: 'meix.js/validation/',
        xmllintLocation: 'meix.js/js/lib/xmllint.js',
        divaInstance: divaInstance,
        oneToOneMEI: true,
        navbarClass: 'navbar navbar-default',
        pageTitle: 'Cantus Ultimus',
        disableMultiPage: true
    };

    var meiEditorPlugins = 
    ["meix.js/js/local/plugins/meiEditorZoneDisplay.js"];

    meiEditor = new MeiEditor(element, options, meiEditorPlugins);
    }

    function meiEditorLoaded(e) {
        var meiURL = selectedManuscript.meiURL;

        meiEditor = $("#mei-editor").data('AceMeiEditor');
        $(".diva-tools").addClass('diva-toolbar navbar navbar-default');

        renderLoadingAnimation();

        $("#dropdown-file-upload").append(
            "<li><a id='server-load-dropdown'>" +
            "Load file from server...</a></li>");

        $("#server-load-dropdown").click(function(e) {
            $("#serverLoadModal").modal();
        });

        var meiFiles = selectedManuscript.meiFiles;

        createModal(element, "serverLoadModal", false,
            "Select a hosted file:<br>" +
            createSelect("hosted-file", meiFiles, true),
            "Load");

        $("#serverLoadModal-primary").on('click', function() {
            var pageName = $("#selecthosted-file").find(':selected').text();
            $.get(meiURL + pageName, "", function(data) {
                meiEditor.addFileToProject(data, pageName);
            });
            $("#serverLoadModal-close").trigger('click');
        });

        $("#dropdown-zone-display").append(
            "<li><a><label class='checkbox'>Auto-load: </span>" +
            "<input type='checkbox' id='auto-load-checkbox' " +
            "style='float:right;' checked/></label></a></li>");

        diva.Events.subscribe("VisiblePageDidChange", switchMeiTab);

        meiEditor.events.subscribe("NewZone", newZone);
    }


    function renderLoadingAnimation() {
        $("#loadingScreen").animate({
            height: '30px',
            'line-height': '30px',
            opacity: '0'
        }, {
            duration: 300,
            complete: function(){$("#loadingScreen").remove();}
        });
    }

    function switchMeiTab(pageNumber, fileName) {
        if (!$("#auto-load-checkbox").prop('checked')) return;
        fileName = fileName.split('/');
        fileName = fileName[fileName.length -1];
        if (selectedManuscript.meiFiles.indexOf((fileName.split(".")[0] + ".mei")) > -1) {
            var meiPage = fileName.split(".")[0] + ".mei";
            if (meiEditor.getPageTitles().indexOf(meiPage) >= 0) return;
            $.get(selectedManuscript.meiURL + meiPage, "", function(data) {
                meiEditor.addFileWithoutJumping(data, meiPage);
            });
        }
    }

    function newZone(pageRef, prevID, nextID, curID) {
        var toInsert = pageRef.parsed.createElement('neume');
        toInsert.setAttribute('xml:id', genUUID());
        toInsert.setAttribute('name', "Unnamed");
        toInsert.setAttribute('facs', curID);
        var prevIdx, prevNeume, nextIdx, nextNeume;
        if(nextID) {
            nextNeume = pageRef.parsed.querySelectorAll(
                'neume[*|facs=' + nextID + ']')[0];
            nextIdx = Array.prototype.indexOf.call(
                nextNeume.parentElement.childNodes, nextNeume);
        }

        if(prevID) {
            prevNeume = pageRef.parsed.querySelectorAll(
                'neume[*|facs=' + prevID + ']')[0];
            prevIdx = Array.prototype.indexOf.call(
                prevNeume.parentElement.childNodes, prevNeume);
        }

        if (nextIdx && prevIdx && (Math.abs(nextIdx - prevIdx) > 2)) {
            meiEditor.localWarn(
                'Tried to insert a neume between' +
                'two that were not adjacent.');
        }        

        if (nextID) {
            indentNode = nextNeume.parentElement.childNodes[nextIdx - 1].cloneNode(false);
            nextNeume.parentElement.insertBefore(
                toInsert, nextNeume);
            nextNeume.parentElement.insertBefore(
                indentNode, nextNeume);
        } else {
            indentNode = prevNeume.parentElement.childNodes[prevIdx - 1].cloneNode(false);

            inserted = prevNeume.insertAdjacentElement(
                "afterEnd", toInsert);
            inserted.parentElement.insertBefore(
                indentNode, inserted);
        }
        rewriteAce(pageRef);
        var newZoneHandler = meiEditor.events.subscribe(
            'ZonesWereUpdated', function() {
                meiEditor.selectHighlight("#" + curID);
                meiEditor.events.unsubscribe(newZoneHandler);
            });
    }    
};

