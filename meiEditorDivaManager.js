function Timeout(fn, interval) {
    var id = setTimeout(fn, interval);
    this.cleared = false;
    this.clear = function () {
        this.cleared = true;
        clearTimeout(id);
    };
}

function clearSelections() {
    if (window.getSelection)
    {
        window.getSelection().removeAllRanges();
    }
    else if (document.selection)
    {
        document.selection.empty();
    }
}

function backspacePrevent(e){
    if(e.keyCode == 8)
    {
        e.preventDefault();
    }
}

//credit to http://stackoverflow.com/a/21963136
var lut = []; for (var i=0; i<256; i++) { lut[i] = (i<16?'0':'')+(i).toString(16); }
function genUUID()
{
  var d0 = Math.random()*0xffffffff|0;
  var d1 = Math.random()*0xffffffff|0;
  var d2 = Math.random()*0xffffffff|0;
  var d3 = Math.random()*0xffffffff|0;
  return 'm-' + lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
    lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
    lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
    lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
}

function findKeyIn(needle, haystack)
{
    for(curItem in haystack)
    {
        if(curItem == needle)
        {
            return haystack[curItem];
        }
        else if(typeof(haystack[curItem]) === "object")
        {
            var found = findKeyIn(needle, haystack[curItem]);
            if(found)
            {
                return found;
            }
            else
            {
                continue;
            }
        }
    }
    return false;
}

function createDefaultMEIString(){

    meiString = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<mei xmlns="http://www.music-encoding.org/ns/mei" xml:id="' + genUUID() + '" meiversion="2013">\n' +
    '  <meiHead xml:id="' + genUUID() + '">\n' +
    '    <fileDesc xml:id="' + genUUID() + '">\n' +
    '      <titleStmt xml:id="' + genUUID() + '">\n' +
    '        <title xml:id="' + genUUID() + '"/>\n' +
    '      </titleStmt>\n' +
    '      <pubStmt xml:id="' + genUUID() + '">\n' +
    '        <date xml:id="' + genUUID() + '"/>\n' +
    '      </pubStmt>\n' +
    '    </fileDesc>\n' +
    '    <encodingDesc xml:id="' + genUUID() + '">\n' +
    '      <projectDesc xml:id="' + genUUID() + '">\n' +
    '        <p xml:id="' + genUUID() + '"/>\n' +
    '      </projectDesc>\n' +
    '    </encodingDesc>\n' +
    '  </meiHead>\n' +
    '  <music xml:id="' + genUUID() + '">\n' +
    '    <facsimile xml:id="' + genUUID() + '">\n' +
    '      <surface xml:id="' + genUUID() + '">\n' +
    '      </surface>\n' +
    '    </facsimile>\n' +
    '    <body xml:id="' + genUUID() + '">\n' +
    '      <mdiv xml:id="' + genUUID() + '">\n' +
    '        <pages xml:id="' + genUUID() + '">\n' +
    '          <page xml:id="' + genUUID() + '">\n' +
    '            <system xml:id="' + genUUID() + '">\n' +
    '              <staff xml:id="' + genUUID() + '">\n' +
    '                <layer xml:id="' + genUUID() + '">\n' +
    '                </layer>\n' +
    '              </staff>\n' +
    '            </system>\n' +
    '          </page>\n' +
    '        </pages>\n' +
    '      </mdiv>\n' +
    '    </body>\n' +
    '  </music>\n' +
    '</mei>';
    return meiString;
}

//stolen mercilessly (but with gratitude) from http://stackoverflow.com/questions/9234830/how-to-hide-a-option-in-a-select-menu-with-css
jQuery.fn.toggleOption = function( show ) 
{
    jQuery( this ).toggle( show );
    if( show ) {
        if( jQuery( this ).parent( 'span.toggleOption' ).length )
            jQuery( this ).unwrap( );
    } else {
        if( jQuery( this ).parent( 'span.toggleOption' ).length === 0 )
            jQuery( this ).wrap( '<span class="toggleOption" style="display: none;" />' );
    }
};

jQuery.fn.hasVisibleOptions = function() 
{
    var childLength = $(this).children('option').length;
    if(childLength === 0)
    {
        return false;
    }
    else
    {
        for(var curChildIndex = 0; curChildIndex < childLength; curChildIndex++)
        {
            if($(this).children('option').css('display') != "none")
            {
                return true;
            }
        }
        return false;
    }
}

require(['meiEditor', 'https://x2js.googlecode.com/hg/xml2json.js', 'jquery.center.min'], function(){

(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
            {
            divName: "diva-manager",
            title: 'Diva page manager',
            dropdownOptions: 
            {
                "Link files to Diva images...": "file-link-dropdown",
                "Unlink files from Diva images...": "file-unlink-dropdown",
                "Auto-link files by filename": "auto-link-dropdown",
                "Update Diva": "update-diva-dropdown",
                "Clear selection": "clear-selection-dropdown"
            },
            init: function(meiEditor, meiEditorSettings)
            {
                /*
                Required settings:
                    divaInstance: A reference to the Diva object created from initializing Diva.
                    jsonFileLocation: A link to the .json file retrieved from Diva's process/generateJson.py files
                */
                if (!("divaInstance" in meiEditorSettings) || !("jsonFileLocation" in meiEditorSettings) || !("siglum_slug" in meiEditorSettings) || !("currentSite" in meiEditorSettings))
                {
                    console.error("MEI Editor error: The 'Diva Manager' plugin requires the 'divaInstance', 'jsonFileLocation', 'currentSite', and 'siglum_slug' settings present on intialization.");
                    return false;
                }

                var globals = 
                {
                    divaPageList: [],           //list of active pages in Diva
                    divaImagesToMeiFiles: {},   //keeps track of linked files
                    neumeObjects: {},           //keeps track of neume objects
                    initDragTop: "",            //when a drag-div is being created, this stores the mouse's initial Y coordinate
                    initDragLeft: "",           //when a drag-div is being created, this stores the mouse's initial X coordinate
                    dragActive: false,          //prevents .overlay-box objects from appearing on mouseover while a drag is occuring
                    editModeActive: false,      //determines if the shift key is being held down
                    createModeActive: false,    //determines if the meta key is being held down
                    boxSingleTimeout: "",       //stores the timeout object for determining if a box was double-clicked or single-clicked
                    boxClickHandler: "",        //stores the current function to be called when a box is single-clicked; this changes depending on whether or not shift is down
                    highlightedCache: [],       //cache of highlighted items used to reload display once createHighlights is called
                    resizableCache: [],         //cache of resizable items used to reload display once createHighlights is called
                    lastClicked: "",            //determines which delete listener to use by storing which side was last clicked on
                    highlightHandle: "",        //handler for the highlight event, needs to be committed to memory
                    activeNeumeChoices: [],      //list of neumes present on the active page to choose from when creating new zones
                    foreignPageNames: [],
                    pageLoadedByScrolling: false,
                };

                $.extend(meiEditorSettings, globals);

                meiEditor.addToNavbar("Diva page manager", "diva-manager");
                $("#dropdown-diva-manager").append("<li><a id='file-link-dropdown'>Link files to Diva images...</a></li>" +
                    "<li><a id='file-unlink-dropdown'>Unlink files from Diva images...</a></li>" +
                    "<li><a id='update-diva-dropdown'>Update Diva</a></li>" +
                    "<li><a id='clear-selection-dropdown'>Clear selection</a></li>");
                $("#dropdown-file-upload").append("<li><a id='default-mei-dropdown'>Create default MEI file</a></li>" +
                    "<li><a id='server-load-dropdown'>Load file from server...</a></li>" + 
                    "<li><a id='manuscript-dropdown'>Close project</a></li>");
                $("#help-dropdown").append("<li><a id='diva-manager-help'>Diva page manager</a></li>");

                $("#file-link-dropdown").on('click', function()
                {
                    $('#fileLinkModal').modal();
                });

                $("#file-unlink-dropdown").on('click', function()
                {
                    $('#fileUnlinkModal').modal();
                });

                $("#update-diva-dropdown").on('click', function()
                {
                    meiEditor.createHighlights();
                });

                $("#clear-selection-dropdown").on('click', function()
                {
                    meiEditor.deselectAllHighlights();
                    meiEditor.deselectResizable(".resizableSelected");
                });

                $("#estimateBox").on('click', function(e){
                    e.stopPropagation();
                });

                $("#server-load-dropdown").on('click', function(e){
                    $("#serverLoadModal").modal();
                });

                $("#diva-manager-help").on('click', function()
                {
                    $("#divaHelpModal").modal();
                });

                $("#manuscript-dropdown").on('click', function()
                {
                    window.location = document.URL.split("?")[0];
                });

                $("#default-mei-dropdown").on('click', function()
                {
                    meiEditor.addDefaultPage(createDefaultMEIString());
                });

                createModal(meiEditorSettings.element, "fileLinkModal", false, 
                    "<span class='modalSubLeft'>" +
                    "Select an MEI file:<br>" +
                    createSelect("file-link", meiEditorSettings.pageData) +
                    "</span>" +
                    "<span class='modalSubRight'>" +
                    "Select a Diva image:<br>" + 
                    createSelect("diva-link", meiEditorSettings.divaPageList, true) + 
                    "</span>" + 
                    "<div class='clear'></div>" + 
                    "<div class='centeredAccept'>" + 
                    "<button id='link-files'>Link selected files</button>" + 
                    "</div>");

                createModal(meiEditorSettings.element, "fileUnlinkModal", false, 
                    "<div id='unlink-wrapper'>" + 
                    "Unlink an MEI file from a Diva file:<br>" + 
                    "<select id='selectUnlink'></select><br>" + 
                    "<button id='unlink-files'>Unlink selected files</button>" + 
                    "</div>");

                if(currentSite !== "127.0.0.1:8000")
                {
                    $.get("http://" + currentSite + "/mei/" + meiEditorSettings.siglum_slug + "/", "", function(data)
                    {
                        var dataArr = data.split("\n");
                        var dataLength = dataArr.length;
                        for(var curPage = 0; curPage < dataLength; curPage++)
                        {
                            //that is not empty
                            if (!dataArr[curPage])
                            {
                                continue;
                            }

                            //find a link
                            var foundLink = dataArr[curPage].match(/<a href=".*">/g);

                            if (foundLink)
                            {
                                //strip the outside, make sure it has ".rng"
                                linkText = foundLink[0].slice(9, -2);
                                if(linkText.match(/mei/))
                                {
                                    meiEditorSettings.foreignPageNames.push(foundLink[0].slice(9, -2));
                                }
                            }
                        }

                        createModal(meiEditorSettings.element, "serverLoadModal", false,
                            "Select a hosted file:<br>" +
                            createSelect("hosted-file", meiEditorSettings.foreignPageNames, true),
                            "Load");

                        $("#serverLoadModal-primary").on('click', function()
                        {
                            var pageName = $("#selecthosted-file").find(':selected').text();
                            $.get("http://" + currentSite + "/mei/" + meiEditorSettings.siglum_slug + "/" + pageName, "", function(data)
                            {
                                meiEditor.addFileToProject(data, pageName);
                            });
                            $("#serverLoadModal-close").trigger('click');
                        });
                    });
                }

                createModal(meiEditorSettings.element, "divaHelpModal", false,
                    "<h4>Help for 'Diva Page Manager' menu:</h4>" + 
                    "<li>To get highlights from a file to show up in the Diva pane, click 'Link files to Diva images...' from the dropdown menu and select the files you want to link.</li>" + 
                    "<br><li>'Auto-link files by filename' will automatically strip file extensions and try to match files so that '001.mei' and '001.tiff' become linked.</li>" + 
                    "<br><li>Changes you make to the MEI document will not automatically transfer over; click the 'Update Diva' dropdown option to reload the highlighted objects in the image viewer.</li>" + 
                    "<br><li>Clicking on a highlight will select it and move the MEI editor to its line.</li>" +
                    "<li>Holding shift and clicking will select additional highlights.</li>" +
                    "<li>Holding shift and click-dragging the mouse will select everything within a box.</li>" + 
                    "<li>To deselect a single highlight, hold shift and click on a selected highlight.</li>" +
                    "<li>To deselect all highlights, choose the 'Clear selection' option of this dropdown.</li>" + 
                    "<br><li>To create a new highlight, ctrl+click (Windows) or cmd+click (Mac) on empty space on the image. </li>" +
                    "<li style='margin-left:0.25in'>Only clicking will create a default box that can be resized later.</li>" +
                    "<li style='margin-left:0.25in'>Clicking and dragging will create a box with a specific size.</li>" +
                    "<li style='margin-left:0.25in'>If the 'Estimate line numbers' checkbox is checked in the Diva Page Manager dropdown menu, the program will insert a 'zone' object immediately after the 'surface' object and a 'neume' object immediately after the first 'layer' object. Use this at your own discretion.</li>" +
                    "<br><li>To resize or move a highlight, double-click on it.</li>" +
                    "<li style='margin-left:0.25in'>Click and drag on the edge of the highlight to resize it.</li>" +
                    "<li style='margin-left:0.25in'>Click and drag on the centre of the highlight or with the shift key down to move it.</li>" +
                    "<li style='margin-left:0.25in'>Pressing an arrow key will move a box slightly in the direction of the arrow.</li>" +
                    "<li style='margin-left:0.25in'>Press the 'Escape' key to leave resize/move mode.</li>" +
                    "<br><li>Press the 'delete' key on your keyboard to delete all selected highlights and the MEI lines associated with them.</li>");

                //the div that pops up when highlights are hovered over
                meiEditorSettings.element.append('<span id="hover-div"></span>'); 

                //changes the position of the on-hover box
                var changeHoverPosition = function(e)
                {
                    $("#hover-div").offset(
                    {
                        'top': e.pageY - 10,
                        'left': e.pageX + 10
                    });
                };

                //key handlers for lineQueryOverlay box
                var lineQueryKeyListeners = function(ev)
                {
                    if (ev.keyCode == 27)
                    {
                        if($("#neumeNameInput").autocomplete("instance"))
                        {   
                            $("#neumeNameInput").autocomplete("disable");
                        } 
                        else 
                        {
                            $("#lineQueryClose").trigger('click');
                            $("#neumeNameInput").autocomplete("destroy");
                        }
                    }
                    else if (ev.keyCode == 13)
                    {
                        $("#lineQuerySubmit").trigger('click');
                    }
                };

                //detects whether or not a keypress was the escape key and triggers
                var resizableKeyListeners = function(ev)
                {
                    if (ev.keyCode == 27) 
                    { 
                        meiEditor.deselectResizable(".resizableSelected");
                    } 
                    else if ((ev.keyCode) < 41 && (ev.keyCode > 36))
                    {
                        ev.stopPropagation();
                        ev.preventDefault();
                        nudgeListeners(ev.keyCode);
                    }
                };   

                //nudges the current resizable object 1px in the direction of the keycode
                var nudgeListeners = function(keyCode)
                {
                    var object = ".resizableSelected";

                    switch(keyCode){
                        case 37:
                            $(object).offset({'left': $(object).offset().left - 1});
                            break;
                        case 38:
                            $(object).offset({'top': $(object).offset().top - 1});
                            break;
                        case 39:
                            $(object).offset({'left': $(object).offset().left + 1});
                            break;
                        case 40:
                            $(object).offset({'top': $(object).offset().top + 1});
                            break;
                        default:
                            break;
                    }
                    
                    meiEditor.updateBox(object);
                };

                //updates the size of the drag-div box (spawned on shift/meta+drag)
                var changeDragSize = function(eve)
                {
                    clearSelections();

                    //original four sides
                    var dragLeft = $("#drag-div").offset().left;
                    var dragTop = $("#drag-div").offset().top;
                    var dragRight = dragLeft + $("#drag-div").width();
                    var dragBottom = dragTop + $("#drag-div").height();           

                    //if we're moving left
                    if (eve.pageX < meiEditorSettings.initDragLeft)
                    {
                        $("#drag-div").offset({'left': eve.pageX});
                        $("#drag-div").width(dragRight - eve.pageX);
                    }
                    //moving right
                    else 
                    {   
                        $("#drag-div").width(eve.pageX - dragLeft);
                    }
                    //moving up
                    if (eve.pageY < meiEditorSettings.initDragTop)
                    {
                        $("#drag-div").offset({'top': eve.pageY});
                        $("#drag-div").height(dragBottom - eve.pageY);
                    }
                    //moving down
                    else 
                    {
                        $("#drag-div").height(eve.pageY - dragTop);
                    }
                };

                //code to insert a new neume, takes the four corner positions (upper left x/y, lower right x/y) as params
                var insertNewNeume = function(ulx, uly, lrx, lry)
                {
                    //generate some UUIDs
                    var zoneID = genUUID();
                    var neumeID = genUUID();

                    //generate the element strings
                    var zoneStringToAdd = '<zone xml:id="' + zoneID + '" ulx="' + ulx + '" uly="' + uly + '" lrx="' + lrx + '" lry="' + lry + '"/>';
                    var neumeStringToAdd = '<neume xml:id="' + neumeID + '" facs="' + zoneID + '"'; //not closed so name can be added
                    
                    //if the "estimate line numbers" dropdown box is checked, it will make its best guess and automatically insert them
                    neumeStringToAdd += ' name=""/>';
                    var chosenDoc = meiEditor.getActivePanel().text();
                    var editorRef = meiEditorSettings.pageData[chosenDoc];

                    //finds the first instance of "surface"
                    var surfaceSearch = editorRef.find(/surface/g, 
                    {
                        wrap: true,
                        range: null
                    });

                    if(surfaceSearch === undefined)
                    {
                        meiEditor.localError("Could not find MEI 'surface' element to insert 'zone' element. Aborted neume creation.");
                        return false;
                    }

                    var surfaceLine = surfaceSearch.start.row + 2; //converting from 0-index to 1-index, adding 1 to get the line after

                    //finds the first instance of "layer"
                    var layerSearch = editorRef.find(/layer/g, 
                    {
                        wrap: true,
                        range: null
                    });
                    if(layerSearch === undefined)
                    {
                        meiEditor.localError("Could not find MEI 'layer' element to insert 'neume' element. Aborted neume creation.");
                        return false;
                    }
                    
                    var layerLine = layerSearch.start.row + 2; //converting from 0-index to 1-index, adding 1 to get the line after
                
                    //finds out how much white space was at these lines before
                    var zoneWhiteSpace = meiEditorSettings.pageData[chosenDoc].session.doc.getLine(surfaceLine).split("<")[0];
                    var neumeWhiteSpace = meiEditorSettings.pageData[chosenDoc].session.doc.getLine(layerLine).split("<")[0];
                    
                    //inserts the new zone and neume lines
                    meiEditorSettings.pageData[chosenDoc].session.doc.insertLines(surfaceLine, [zoneWhiteSpace + zoneStringToAdd]);
                    meiEditorSettings.pageData[chosenDoc].session.doc.insertLines(layerLine, [neumeWhiteSpace + neumeStringToAdd]);

                    meiEditor.createHighlights();

                    //moves the editor to the newly entered neume line
                    var searchNeedle = new RegExp("<neume.*" + neumeID, "g");

                    var testSearch = editorRef.find(searchNeedle, 
                    {
                        wrap: true,
                        range: null
                    });

                    return true;
                };

                //creates the cover-div object with a specific handler for document.on('mouseup')
                var initCoverDiv = function(mouseUpHandler)
                {
                    $("#editorConsole").append('<div id="cover-div"></div>');
                    $("#cover-div").height($("#diva-wrapper").height());
                    $("#cover-div").width($("#diva-wrapper").width());
                    //if there are no .overlay-box objects, we want this to be NaN so it can't be clicked on.
                    $("#cover-div").css('z-index', $(".overlay-box").css('z-index') - 1);
                    $("#cover-div").offset({'top': $("#diva-wrapper").offset().top, 'left': $("#diva-wrapper").offset().left});

                    $("#cover-div").on('mousedown', function(ev)
                    {
                        console.log("down");
                        //append the div that will resize as you drag
                        $("#topbar").append('<div id="drag-div"></div>');
                        $("#drag-div").css('z-index', $("#cover-div").css('z-index') + 1);
                        console.log($("#drag-div").css('z-index'), $("#cover-div").css('z-index'));
                        meiEditorSettings.initDragTop = ev.pageY;
                        meiEditorSettings.initDragLeft = ev.pageX;
                        meiEditorSettings.dragActive = true;
                        $("#drag-div").offset({'top': ev.pageY, 'left':ev.pageX});

                        //as you drag, resize it - separate function as we have two document.mousemoves that we need to unbind separately
                        $(document).on('mousemove', changeDragSize);

                        $(document).on('mouseup', mouseUpHandler);
                    });
                };

                //handles metaKey (ctrl on windows, cmd on mac) and click events.
                var metaClickHandler = function(eve)
                {
                    //unbind everything that could have caused this
                    $(document).unbind('mousemove', changeDragSize);
                    $(document).unbind('mouseup', metaClickHandler);

                    if(!meiEditor.divaIsLinked(meiEditor.getActivePanel().text()))
                    {
                        meiEditor.localError("Current Diva image is not linked.");
                        $("#drag-div").remove();
                        return false;
                    }

                    //if this was just a click
                    if ($("#drag-div").width() < 2 && $("#drag-div").height() < 2)
                    {
                        //get the click
                        var centerX = eve.pageX;
                        var centerY = eve.pageY;

                        var divaInnerObj = $("#1-diva-page-" + meiEditorSettings.divaInstance.getCurrentPageIndex());
                        centerY = meiEditorSettings.divaInstance.translateToMaxZoomLevel(centerY - divaInnerObj.offset().top);
                        centerX = meiEditorSettings.divaInstance.translateToMaxZoomLevel(centerX - divaInnerObj.offset().left);

                        //make a 200*200 box
                        var newBoxLeft = centerX - 100;
                        var newBoxRight = centerX + 100;
                        var newBoxTop = centerY - 100;
                        var newBoxBottom = centerY + 100;

                        //create the neume
                        insertNewNeume(newBoxLeft, newBoxTop, newBoxRight, newBoxBottom);
                    }
                    //else if we dragged to create a neume
                    else 
                    {
                        //ignore the JSLint warning
                        var divaInnerObj = $("#1-diva-page-" + meiEditorSettings.divaInstance.getCurrentPageIndex());

                        //left position
                        var draggedBoxLeft = $("#drag-div").offset().left - divaInnerObj.offset().left;
                        //translated right position (converted to max zoom level)
                        var draggedBoxRight = meiEditorSettings.divaInstance.translateToMaxZoomLevel(draggedBoxLeft + $("#drag-div").outerWidth());
                        //translated left - we needed the original left to get the right translation, so we translate it now
                        draggedBoxLeft = meiEditorSettings.divaInstance.translateToMaxZoomLevel(draggedBoxLeft);

                        //same vertical
                        var draggedBoxTop = $("#drag-div").offset().top - divaInnerObj.offset().top;
                        var draggedBoxBottom = meiEditorSettings.divaInstance.translateToMaxZoomLevel(draggedBoxTop + $("#drag-div").outerHeight());
                        draggedBoxTop = meiEditorSettings.divaInstance.translateToMaxZoomLevel(draggedBoxTop);

                        //create the neume
                        insertNewNeume(draggedBoxLeft, draggedBoxTop, draggedBoxRight, draggedBoxBottom);
                    }

                    $("#drag-div").remove();
                    meiEditorSettings.dragActive = false;
                };

                //handles shift+drag event (shift+click does nothing at the moment)
                var shiftClickHandler = function(eve)
                {
                    $(document).unbind('mousemove', changeDragSize);
                    $(document).unbind('mouseup', shiftClickHandler);

                    //there's gotta be something simpler than this, but I can't find it for the life of me.
                    //get the four sides
                    var boxLeft = $("#drag-div").offset().left;
                    var boxRight = boxLeft + $("#drag-div").outerWidth();
                    var boxTop = $("#drag-div").offset().top;
                    var boxBottom = boxTop + $("#drag-div").outerHeight();

                    //for each overlay-box
                    var curBoxIndex = $(".overlay-box").length;
                    while (curBoxIndex--)
                    {
                        var curBox = $(".overlay-box")[curBoxIndex];

                        //see if any part of the box is inside (doesn't have to be the entire box)
                        var curLeft = $(curBox).offset().left;
                        var curRight = curLeft + $(curBox).width();
                        var curTop = $(curBox).offset().top;
                        var curBottom = curTop + $(curBox).height();
                        if (curRight < boxLeft)
                            continue;
                        else if (curLeft > boxRight)
                            continue;
                        else if (curBottom < boxTop)
                            continue;
                        else if (curTop > boxBottom)
                            continue;

                        //if we're still here, select it
                        if(!($(curBox).hasClass('selectedHover')))
                        {
                            meiEditor.selectHighlight(curBox);
                        }
                    }

                    $("#drag-div").remove();
                    meiEditorSettings.dragActive = false;
                };

                //detects whether the current resizable object is too small to hold the ui-resizable icon
                var checkResizable = function()
                {
                    //if it's so small that the icon would be outside of the box
                    var resizableIsTooSmall = ($(".resizableSelected").width() < 16 || $(".resizableSelected").height() < 16);
                    //if it has the classes
                    var resizableHasClasses = $(".resizableSelected > .ui-resizable-se").hasClass("ui-icon");

                    //if these are even we need to toggle the classes
                    if(resizableIsTooSmall === resizableHasClasses)
                    {
                        $(".resizableSelected > .ui-resizable-se").toggleClass("ui-icon ui-icon-gripsmall-diagonal-se");
                    }
                };

                /*
                    Function called when sections are rehighlighted to refresh the listeners.
                */
                var reapplyBoxListeners = function()
                {
                    if($("#resizableOverlay").length !== 0)
                    {
                        return;
                    }
                    unbindBoxListeners();

                    $(".overlay-box").hover(function(e) //when the hover starts for an overlay-box
                    {
                        //if there is a box currently being drawn, don't do anything
                        if (meiEditorSettings.dragActive === true)
                        {
                            return;
                        }

                        currentTarget = e.target.id;

                        $("#hover-div").html(meiEditorSettings.neumeObjects[currentTarget] + "<br>Click to find in document.");
                        $("#hover-div").css(//create a div with the name of the hovered neume
                        {
                            'height': 'auto',
                            'top': e.pageY - 10,
                            'left': e.pageX + 10,
                            'padding-left': '10px',
                            'padding-right': '10px',
                            'border': 'thin black solid',
                            'background-color': '#FFFFFF',
                            'display': 'block',
                            'vertical-align': 'middle'
                        });

                        //if this isn't selected, change the color 
                        if (!$("#" + currentTarget).hasClass('selectedHover'))
                        {
                            $("#"+currentTarget).css('background-color', 'rgba(255, 0, 0, 0.1)');
                        }

                        //needs to be separate function as we have separate document.mousemoves that need to be unbound separately
                        $(document).on('mousemove', changeHoverPosition);
                    }, function(e)
                    {
                        currentTarget = e.target.id;
                        $(document).unbind('mousemove', changeHoverPosition); //stops moving the div
                        $("#hover-div").css('display', 'none'); //hides the div
                        $("#hover-div").html("");

                        //if this isn't selected, change the color back to normal
                        if(!$("#" + currentTarget).hasClass('selectedHover'))
                        {
                            $("#" + currentTarget).css('background-color', 'rgba(255, 0, 0, 0.2)');
                        }
                    });

                    $(".overlay-box").click(function(e)
                    {
                        //we stop propagation but trigger a click on the parent so that other boxes don't get selected but anything listening on a larger scale hears
                        e.stopPropagation();
                        $(this).parent().trigger('click');

                        /*
                        no matter what, clear the old one. 
                            -in the case of a double-click, this'll clear the first
                            -in the case of a single, this will clear the old before it's set.
                            -regardless, this will clear the old one; reclearing an old one is not harmful
                        */
                        clearTimeout(meiEditorSettings.boxSingleTimeout);

                        meiEditorSettings.boxSingleTimeout = setTimeout(function()
                        {
                            //different function depending on whether or not shift is down; needs the wrapper to get event info
                            meiEditorSettings.boxClickHandler(e);
                        }, 300);
                    });

                    //on doubleclick, move this specific div into resizable mode
                    $(".overlay-box").dblclick(function(e)
                    {
                        clearTimeout(meiEditorSettings.boxSingleTimeout);
                        e.stopPropagation();

                        //turn off scrollability and put the overlay down
                        meiEditorSettings.divaInstance.disableScrollable();
                        $("#diva-wrapper").append("<div id='resizableOverlay'></div>");
                        $("#resizableOverlay").offset({'top': $("#diva-wrapper").offset().top, 'left': $("#diva-wrapper").offset().left});
                        $("#resizableOverlay").width($("#diva-wrapper").width());
                        $("#resizableOverlay").height($("#diva-wrapper").height());

                        origObject = e.target;           
                        $("#hover-div").css('display', 'none'); //hides the div
                        $("#hover-div").html("");
                        unbindBoxListeners();

                        meiEditor.selectResizable(origObject);
                    });
                }; 

                //unbinds listeners from above function
                var unbindBoxListeners = function()
                {
                    $(".overlay-box").unbind('hover');
                    $(".overlay-box").unbind('click');
                    $(".overlay-box").unbind('dblclick');
                    $(document).unbind('keyup', resizableKeyListeners);
                    $(".overlay-box").unbind('mouseenter');
                    $(document).unbind('mousemove', changeHoverPosition); //stops moving the div
                    $(".overlay-box").unbind('mouseleave');
                };    

                //writes changes to an object into the document
                meiEditor.updateBox = function(box)
                {
                    var boxPosition = $(box).position();
                    var boxID = $(box).attr('id');
                    var ulx = meiEditorSettings.divaInstance.translateToMaxZoomLevel(boxPosition.left);
                    var uly = meiEditorSettings.divaInstance.translateToMaxZoomLevel(boxPosition.top);
                    var lrx = meiEditorSettings.divaInstance.translateToMaxZoomLevel(boxPosition.left + $(box).outerWidth());
                    var lry = meiEditorSettings.divaInstance.translateToMaxZoomLevel(boxPosition.top + $(box).outerHeight());

                    //search to get the line number where the zone object is
                    var searchNeedle = new RegExp("<zone.*" + $(box).attr('id'), "g");
                    var pageTitle = meiEditor.getActivePanel().text();
                    var searchRange = meiEditorSettings.pageData[pageTitle].find(searchNeedle, 
                    {
                        wrap: true,
                        range: null
                    });

                    //get the text of that line, removing the whitespace at the beginning
                    var line = meiEditorSettings.pageData[pageTitle].session.doc.getLine(searchRange.start.row).trim();
                   

                    //replace all four sides
                    line = line.replace(/ulx="[0-9]+"/, 'ulx="' + ulx + '"');
                    line = line.replace(/uly="[0-9]+"/, 'uly="' + uly + '"');
                    line = line.replace(/lrx="[0-9]+"/, 'lrx="' + lrx + '"');
                    line = line.replace(/lry="[0-9]+"/, 'lry="' + lry + '"');

                    //get the new line length
                    searchRange.end.column = line.length + 100;

                    //keep the whitespace intact at the beginning
                    meiEditorSettings.pageData[pageTitle].session.doc.replace(searchRange, line);
                };

                /*
                    Saves highlights/resizable IDs while highlights are being reloaded.
                */
                meiEditor.updateCaches = function()
                {
                    meiEditorSettings.highlightedCache = [];
                    meiEditorSettings.resizableCache = [];
                    var curHighlight = $(".selectedHover").length;
                    while(curHighlight--)
                    {
                        meiEditorSettings.highlightedCache.push($($(".selectedHover")[curHighlight]).attr('id'));
                    }
                    var curResizable = $(".resizableSelected").length;
                    while(curResizable--)
                    {
                        meiEditorSettings.resizableCache.push($($(".resizableSelected")[curResizable]).attr('id'));
                    }
                };

                /*
                    Reloads highlights/resizable IDs after highlights have been reloaded.
                */
                meiEditor.reloadFromCaches = function()
                {
                    var curHighlightedCached = meiEditorSettings.highlightedCache.length;
                    while(curHighlightedCached--)
                    {
                        meiEditor.selectHighlight($('#' + meiEditorSettings.highlightedCache[curHighlightedCached]));
                    }
                    var curResizableCached = meiEditorSettings.resizableCache.length;
                    while(curResizableCached--)
                    {
                        meiEditor.selectResizable('#' + meiEditorSettings.resizableCache[curResizableCached]);
                    }
                };

                /*
                    Creates highlights based on the ACE documents.
                */
                meiEditor.createHighlights = function()
                {  
                    meiEditorSettings.neumeObjects = {};
                    var x2js = new X2JS(); //from xml2json.js
                    meiEditorSettings.divaInstance.resetHighlights();

                    //for each linked page
                    for (curKey in meiEditorSettings.divaImagesToMeiFiles)
                    { 
                        var pageName = meiEditorSettings.divaImagesToMeiFiles[curKey];
                        var neumeArray = [];
                        var pageIndex = meiEditorSettings.divaPageList.indexOf(curKey);
                        var pageText = meiEditorSettings.pageData[pageName].getSession().doc.getAllLines().join("\n"); //get the information from the page expressed in one string
                        var jsonData = x2js.xml_str2json(pageText); //turn this into a JSON "dict"
                        var regions = [];

                        xmlns = jsonData['mei']['_xmlns']; //find the xml namespace file

                        neumeArray = findKeyIn('neume', jsonData);
                        zoneArray = findKeyIn('zone', jsonData);

                        for (curNeumeIndex in neumeArray)
                        {
                            var neume_ulx, neume_uly, neume_width, neume_height, neumeID; //need to be re-initialized every time
                            curNeume = neumeArray[curNeumeIndex];
                            zoneID = curNeume["_facs"];
                            for(curZoneIndex in zoneArray)
                            {
                                if(zoneArray[curZoneIndex]["_xml:id"] == zoneID)
                                {
                                    curZone = zoneArray[curZoneIndex]; //assemble the info on the neume
                                    meiEditorSettings.neumeObjects[zoneID] = curNeume['_name'];
                                    neume_ulx = curZone._ulx;
                                    neume_uly = curZone._uly;
                                    neume_width = curZone._lrx - neume_ulx;
                                    neume_height = curZone._lry - neume_uly;
                                    break;      
                                }
                            }

                            //add it to regions
                            regions.push({'width': neume_width, 'height': neume_height, 'ulx': neume_ulx, 'uly': neume_uly, 'divID': zoneID});
                        }
                        //at the end of each page, call the highlights
                        if(meiEditorSettings.highlightHandle !== "")
                        {
                            diva.Events.unsubscribe(meiEditorSettings.highlightHandle);
                            meiEditorSettings.highlightHandle = "";
                        }
                        meiEditorSettings.highlightHandle = diva.Events.subscribe("HighlightCompleted", reapplyBoxListeners);
                        meiEditorSettings.divaInstance.highlightOnPage(pageIndex, regions, undefined, "overlay-box");
                    }
                };

                //function to make a div resizable
                meiEditor.selectResizable = function(object)
                {
                    //change color to yellow, pop on top of everything
                    $(object).css({'z-index': 150,
                        'background-color': 'rgba(255, 255, 0, 0.5)'});
                    $(object).addClass('resizableSelected');

                    //make sure all previous events are unbound
                    $(document).unbind('keyup', resizableKeyListeners);

                    //jQuery UI resizable, when resize stops update the box's position in the document
                    if(!$(object).data('uiResizable') && !meiEditorSettings.editModeActive)
                    {
                        $(object).resizable({
                            handles: 'all',
                            start: function(e)
                            {
                                e.stopPropagation();
                                e.preventDefault();
                            },
                            resize: function(e)
                            {
                                e.stopPropagation();
                                e.preventDefault();
                                checkResizable(); //check the size and update the icon accordingly
                            },
                            stop: function(e, ui)
                            {
                                e.stopPropagation();
                                e.preventDefault();
                                meiEditor.updateBox(ui.helper);
                            }
                        });
 
                        checkResizable();
                    }
                    //jQuery UI draggable, when drag stops update the box's position in the document
                    if(!$(object).data('uiDraggable'))
                    {
                        $(object).draggable({
                            stop: function(e, ui)
                            {
                                meiEditor.updateBox(ui.helper);
                            }
                        });
                    }

                    //this prevents a graphical glitch with Diva
                    $("#diva-wrapper").on('resize', function(e){
                        e.stopPropagation();
                        e.preventDefault();
                    });

                    //escape gets you out of this
                    $(document).on('keyup', resizableKeyListeners);
                    meiEditor.updateCaches();
                };

                //deselects a resizable object
                meiEditor.deselectResizable = function(object)
                {
                    if($(object).length !== 0)
                    {
                        //return it to normal
                        $(object).draggable('destroy');
                        $(object).resizable('destroy');
                        $(object).css('z-index', $(".overlay-box").css('z-index'));
                        $(object).css('background-color', 'rgba(255, 0, 0, 0.2)');
                        $(object).toggleClass('resizableSelected');
                    }

                    //remove overlay and restore key bindings to Diva
                    $("#resizableOverlay").remove();
                    $(document).unbind('keyup', resizableKeyListeners);
                    meiEditorSettings.divaInstance.enableScrollable();
                    reapplyBoxListeners();
                    $("#diva-wrapper").unbind('resize');
                    meiEditor.updateCaches();
                    
                    //regenerate the highlights, reset the listeners, reselect the same box
                    meiEditor.createHighlights();
                };

                /*
                    Selects a highlight.
                    @param divToSelect The highlight to select.
                    @param findOverride Overrides jumping to the div in the editor pane.
                */
                meiEditor.selectHighlight = function(divToSelect, findOverride)
                {
                    if(!findOverride)
                    {
                        var searchNeedle = new RegExp("<neume.*" + divToSelect.id, "g");

                        var pageTitle = meiEditor.getActivePanel().text();
                        var testSearch = meiEditorSettings.pageData[pageTitle].find(searchNeedle, 
                        {
                            wrap: true,
                            range: null
                        });
                    }
                    
                    $(divToSelect).addClass('selectedHover');
                    $(divToSelect).css('background-color', 'background-color:rgba(0, 255, 0, 0.1)');
                    meiEditor.updateCaches();
                };

                //shortcut to deselect all highlights
                meiEditor.deselectAllHighlights = function()
                {
                    meiEditor.deselectHighlight(".selectedHover");
                };

                //deselects highlights.
                meiEditor.deselectHighlight = function(divToDeselect)
                {
                    $(divToDeselect).css('background-color', 'rgba(255, 0, 0, 0.2)');
                    $(divToDeselect).toggleClass("selectedHover");
                    meiEditor.updateCaches();
                };

                //listener for deleting highlights
                meiEditor.deleteListener = function(e)
                {
                    if(e.keyCode == 46 || e.keyCode == 8)
                    {
                        e.preventDefault();
                        //if double-click active, we want to remove only the resizableSelected, otherwise we want to remove the selectedHover objects
                        var selector = $("#resizableOverlay").length !== 0 ? ".resizableSelected" : ".selectedHover";

                        var saveObject = [];
                        var curItemIndex = $(selector).length;
                        while (curItemIndex--)
                        {
                            var curItem = $(selector)[curItemIndex];    
                            var itemID = $(curItem).attr('id');
                            
                            //remove item from display
                            $(curItem).remove();

                            //perform a new search to grab all occurences of the id and to delete both lines
                            var pageTitle = meiEditor.getActivePanel().text();
                            var uuidSearch = editor.findAll(itemID, 
                            {
                                wrap: true,
                                range: null
                            });

                            //this may not be the right way to do it, but "findAll" returns how many it found, and there doesn't seem to be a clear way to select everything at once. This accurately deletes all instances, however.
                            while (uuidSearch)
                            {
                                var row = editor.getSelectionRange().start.row;
                                var text = editor.session.doc.getLine(row);
                                saveObject.push({'doc': pageTitle, 'row': row, 'text': text});

                                editor.removeLines();
                                uuidSearch = editor.findAll(itemID, 
                                {
                                    wrap: true,
                                    range: null
                                });
                            }
                        }

                        //this needs to be at the end so we don't remove the object before the while loop above; object also doesn't exist so we need to base this off what the selector was determined to be
                        if(selector == ".resizableSelected"){
                            meiEditor.deselectResizable(".resizableSelected");
                        }

                        meiEditor.createHighlights();
                        meiEditor.localLog("Deleted highlights.");   
                    }
                };

                /*
                    Automatically links an MEI file to a Diva image by snipping off file extensions and finding matches.
                */

                meiEditor.autoLinkFile = function(curMei)
                {
                    if (meiEditor.meiIsLinked(curMei))
                        return false;

                    var curMeiSnipped = curMei.split(".")[0];
                    for (curDivaIndex in meiEditorSettings.divaPageList)
                    {
                        var curDivaFile = meiEditorSettings.divaPageList[curDivaIndex];
                        var divaFileSnipped = curDivaFile.split(".")[0];
                        if (curMeiSnipped == divaFileSnipped)
                        {
                            //link 'em, and we found it so break
                            meiEditor.linkMeiToDiva(curMei, curDivaFile);
                            meiEditor.createHighlights();
                            if (meiEditorSettings.pageLoadedByScrolling)
                                meiEditorSettings.pageLoadedByScrolling = false;
                            else
                                meiEditorSettings.divaInstance.gotoPageByName(curDivaFile);
                            
                            return true;
                        }
                    }

                    return false;
                };

                /*
                    Determines if a mei file is linked to an image.
                    @param meiFile the mei file to check
                */
                meiEditor.meiIsLinked = function(meiFile)
                {
                    for (curDivaFile in meiEditorSettings.divaImagesToMeiFiles)
                    {
                        if (meiFile == meiEditorSettings.divaImagesToMeiFiles[curDivaFile])
                        {
                            return curDivaFile;
                        }
                    }
                    return false;
                };

                /*
                    Determines if a diva image is linked to an image.
                    @param divaImage the diva image to check
                */
                meiEditor.divaIsLinked = function(divaImage)
                {
                    for (curDivaFile in meiEditorSettings.divaImagesToMeiFiles)
                    {
                        if (divaImage == curDivaFile)
                        {
                            return meiEditorSettings.divaImagesToMeiFiles[curDivaFile];
                        }
                    }
                    return false;
                };

                /* 
                    Function that links an mei file to a diva image.
                    @param selectedMEI The MEI page to link
                    @param selectedImage The image to link.
                */
                
                meiEditor.linkMeiToDiva = function(curMei, curDivaFile)
                {
                    //make the link
                    meiEditorSettings.divaImagesToMeiFiles[curDivaFile] = curMei;

                    //make the option object
                    var strippedMei = meiEditor.stripFilenameForJQuery(curMei);
                    var strippedDiva = meiEditor.stripFilenameForJQuery(curDivaFile);

                    var optionID = strippedMei + "_" + strippedDiva;
                    $("#selectUnlink").append("<option id='" + optionID + "'>" + curMei + " and " + curDivaFile + "</option>");

                    //delete option elements if they exist
                    $("#file-link-" + strippedMei).toggleOption(false);
                    $("#diva-link-" + strippedDiva).toggleOption(false);
                };

                /*
                    This is a separate function as it's used in two locations.
                */
                meiEditor.reapplyEditorClickListener = function()
                {
                    //commented out as per issue #36
                    $(".aceEditorPane").on('click', function()
                    {
                        var activeTab = meiEditor.getActivePanel().text();
                        if (meiEditor.meiIsLinked(activeTab))
                        {
                            //if only one is selected, don't multiselect
                            if($(".selectedHover").length == 1)
                            {
                                meiEditor.deselectAllHighlights();
                            }
                            var row = meiEditorSettings.pageData[activeTab].getSelectionRange().start.row;
                            var rowText = meiEditorSettings.pageData[activeTab].session.doc.getLine(row);
                            var matchArr = rowText.match(/m-[(0-9|a-f)]{8}(-[(0-9|a-f)]{4}){3}-[(0-9|a-f)]{12}/g);
                            var curMatch = matchArr.length;
                            while (curMatch--)
                            {
                                if ($("#"+matchArr[curMatch]).length)
                                {
                                    meiEditor.selectHighlight($("#"+matchArr[curMatch]), true);
                                }
                            }
                        }
                    });
                };

                meiEditor.cursorUpdate = function(a, selection)
                {
                    var curRow = selection.getCursor().row;
                    var facsIDs = selection.doc.getLine(curRow).match(/m-[\dabcdef]{8}-([\dabcdef]{4})-([\dabcdef]{4})-([\dabcdef]{4})-([\dabcdef]{12})/gi);

                    var curFacs = facsIDs.length;
                    meiEditor.deselectAllHighlights();
                    while(curFacs--)
                    {
                        meiEditor.selectHighlight($("#" + facsIDs[curFacs]));
                    }
                };

                $.ajax( //this grabs the json file to get an meiEditor-local list of the image filepaths
                {
                    url: meiEditorSettings.jsonFileLocation,
                    cache: true,
                    dataType: 'json',
                    success: function (data, status, jqxhr)
                    {
                        for (curPage in data.pgs)
                        {
                            fileNameOriginal = data.pgs[curPage].f; //original file name
                            fileNameStripped = meiEditor.stripFilenameForJQuery(fileNameOriginal);
                            meiEditorSettings.divaPageList.push(fileNameOriginal);
                            $("#selectdiva-link").append("<option id='diva-link-" + fileNameStripped + "' name='" + fileNameOriginal + "'>" + fileNameOriginal + "</option>");
                        }
                    }
                });

                //when the page changes, make the editor reflect that
                diva.Events.subscribe("VisiblePageDidChange", function(pageNumber, fileName)
                {
                    //only if it's linked
                    if (fileName in meiEditorSettings.divaImagesToMeiFiles)
                    {
                        //get the active editor page
                        var activeFileName = meiEditorSettings.divaImagesToMeiFiles[fileName];
                        var tabArr = $("#pagesList > li > a");
                        for (var curTabIndex = 0; curTabIndex < tabArr.length; curTabIndex++)
                        {
                            //find the active file name
                            var curTab = tabArr[curTabIndex];
                            if ($(curTab).text() == activeFileName)
                            {
                                //switch active
                                $("#openPages").tabs("option", "active", curTabIndex);
                                return;
                            }
                        }
                    }
                    else if (meiEditorSettings.foreignPageNames.indexOf((fileName.split(".")[0] + ".mei")) > -1)
                    { 
                        var meiPage = fileName.split(".")[0] + ".mei";
                        $.get("http://" + currentSite + "/mei/" + meiEditorSettings.siglum_slug + "/" + meiPage, "", function(data)
                        {
                            meiEditorSettings.pageLoadedByScrolling = true;
                            meiEditor.addFileToProject(data, meiPage);
                        });
                    }

                    //change selected diva page to make some selects easier
                    $("#selecthosted-file").val(fileName);
                    $("#selectdiva-link").val(fileName);
                });

                diva.Events.subscribe("HighlightCompleted", meiEditor.reloadFromCaches);

                meiEditor.events.subscribe("NewFile", function(a, fileName)
                {
                    //add new files to link-file select
                    var result = meiEditor.autoLinkFile(fileName);
                    if(!result)
                    {
                        meiEditor.localWarn("Could not automatically link " + fileName + ".");
                        fileNameStripped = meiEditor.stripFilenameForJQuery(fileName);
                        $("#selectfile-link").append("<option id='file-link-" + fileNameStripped + "' name='" + fileName + "'>" + fileName + "</option>");
                    }
                    else
                    {
                        meiEditor.localLog("Automatically linked " + fileName + ".");
                    }
                    meiEditorSettings.pageData[fileName].selection.on('changeCursor', meiEditor.cursorUpdate);
                });

                meiEditor.events.subscribe("ActivePageChanged", function(pageName)
                {
                    var lineArr = meiEditorSettings.pageData[pageName].getSession().doc.getAllLines();
                    for(curLine in lineArr)
                    {
                        if(lineArr[curLine].match(/<neume/g))
                        {
                            var neumeNameString = lineArr[curLine].match(/name=".*"[ >]/g);
                            var neumeNameSliced = neumeNameString[0].slice(6, -2);
                            if (meiEditorSettings.activeNeumeChoices.indexOf(neumeNameSliced) == -1)
                            {
                                meiEditorSettings.activeNeumeChoices.push(neumeNameSliced);
                            }
                        }
                    }
                    
                    //also have diva automatically scroll
                    for(curDiva in meiEditorSettings.divaImagesToMeiFiles)
                    {
                        if(meiEditorSettings.divaImagesToMeiFiles[curDiva] == pageName)
                        {
                            meiEditorSettings.divaInstance.gotoPageByName(curDiva);
                            break;
                        }
                    }
                });

                meiEditor.events.subscribe("PageWasDeleted", function(pageName)
                {
                    //if the page was deleted, see if it was linked
                    var retVal = meiEditor.meiIsLinked(pageName);
                    var meiFileStripped = meiEditor.stripFilenameForJQuery(pageName);
                    if (retVal)
                    {
                        //if it was, remove it from a lot and refresh highlights
                        var imageName = retVal;
                        var fileNameStripped = meiEditor.stripFilenameForJQuery(imageName);
                        delete meiEditorSettings.divaImagesToMeiFiles[imageName];
                        var dualOptionID = meiEditor.stripFilenameForJQuery(pageName) + "_" + meiEditor.stripFilenameForJQuery(imageName);
                        $("#" + dualOptionID).remove();
                        $("#diva-link-" + fileNameStripped).toggleOption(true);
                        meiEditor.createHighlights();
                        $("#resizableOverlay").remove();
                    }
                    $("#file-link-" + meiFileStripped).remove();

                    //it's automatically removed from all other selects in the main meiEditor.js file
                });

                meiEditor.events.subscribe("PageEdited", meiEditor.createHighlights);

                meiEditor.events.subscribe("PageWasRenamed", function(originalName, newName)
                {
                    var strippedOriginal = meiEditor.stripFilenameForJQuery(originalName);
                    var strippedNew = meiEditor.stripFilenameForJQuery(newName);
                    for (curImage in meiEditorSettings.divaImagesToMeiFiles)
                    {
                        //if it's linked
                        if(meiEditorSettings.divaImagesToMeiFiles[curImage] == originalName)
                        {
                            meiEditorSettings.divaImagesToMeiFiles[curImage] = newName;
                            var foundChild = $("#selectUnlink").children("[id*='" + strippedOriginal + "']");
                            var strippedImage = meiEditor.stripFilenameForJQuery(curImage);
                            $(foundChild).attr('id', strippedNew + "_" + strippedImage).text(newName + " and " + curImage);

                            return;
                        }
                    }

                    //or if we make it through the loop, basically treat it as a new file and see if we can auto-link it
                    var result = meiEditor.autoLinkFile(newName);
                    if(!result)
                    {
                        meiEditor.localWarn("Could not automatically link " + newName + ".");
                        var newNameStripped = meiEditor.stripFilenameForJQuery(newName);
                        $("#selectfile-link").append("<option id='file-link-" + newNameStripped + "' name='" + newName + "'>" + newName + "</option>");
                    }
                    else
                    {
                        meiEditor.localLog("Automatically linked " + newName + ".");
                    }
                });

                //to get default pages
                meiEditor.reapplyEditorClickListener();
                for(fileName in meiEditorSettings.pageData)
                {
                    meiEditorSettings.pageData[fileName].selection.on('changeCursor', meiEditor.cursorUpdate);
                }

                //when "Link selected files" is clicked
                $("#link-files").on('click', function()
                {
                    //grab the IDs/stripped IDs of the linked files
                    var selectedMEI = $("#selectfile-link").children(':not(:hidden) :selected').text();
                    var selectedImage = $("#selectdiva-link").children(':not(:hidden) :selected').text();

                    //if there's not 2 selected files, "throw" an error
                    if (selectedMEI === undefined || selectedImage === undefined)
                    {
                        meiEditor.localError("Please make sure that an MEI file and an image are selected.");
                        return;
                    }

                    meiEditor.linkMeiToDiva(selectedMEI, selectedImage);
                    meiEditor.localLog("Successfully linked " + selectedMEI + " to " + selectedImage + ".");
                    
                    //because one line of code helps prevent one pound of laziness; this is here so that autoLink doesn't call it
                    meiEditor.createHighlights();

                    if(!$('#selectfile-link').hasVisibleOptions() || !$('#selectdiva-link').hasVisibleOptions())
                    {
                        $("#fileLinkModal-close").trigger('click');
                    }
                });

                //when "Unlink selected files" is clicked
                $("#unlink-files").on('click', function()
                {
                    var selectedPair = $("#selectUnlink").children(':not(:hidden) :selected');
                    var fileArr = selectedPair.text().split(' and ');

                    //change the data/DOM
                    delete meiEditorSettings.divaImagesToMeiFiles[fileArr[1]];
                    $("#file-link-" + meiEditor.stripFilenameForJQuery(fileArr[0])).toggleOption(true);
                    $("#diva-link-" + meiEditor.stripFilenameForJQuery(fileArr[1])).toggleOption(true);
                    $(selectedPair).remove();

                    if(!$("#selectUnlink").hasVisibleOptions())
                    {
                        $("#fileUnlinkModal-close").trigger('click');
                    }

                    meiEditor.localLog("Successfully unlinked " + fileArr[0] + " from " + fileArr[1] + ".");

                    //reload highlights
                    meiEditor.createHighlights();

                });

                //event listeners are where this code gets too fun
                $(document).on('click', function(e)
                {
                    if(!e || !e.target)
                    {
                        return;
                    }
                    var pageTitle = meiEditor.getActivePanel().text();
                    if(pageTitle == "")
                    {
                        //this happens in very rare cases when a user deletes a page that was just linked. I will debug it later, but the user will not delete immediately after it, so this work around is fine for now.
                        return;
                    }
                    editor = meiEditorSettings.pageData[pageTitle];
                    //if the click is on the diva-wrapper instance and the line query overlay doesn't exist
                    if($.contains(document.getElementById("diva-wrapper"), e.target) && ($("#lineQueryOverlay").length < 1))
                    {
                        //if it's just a plain click on a tile, deselect everything that was selected
                        if($(e.target).hasClass("diva-document-tile"))
                        {
                            meiEditor.deselectAllHighlights();
                        }

                        //we want the delete key to NOT target the editor, so we assign a blank function to it
                        editor.commands.addCommand({   
                            name: "del",
                            bindKey: {win: "Delete", mac: "Delete|Ctrl-D|Shift-Delete"},
                            exec: function(editor) { },
                            multiSelectAction: "forEach",
                            scrollIntoView: "cursor"
                        });

                        //we want it to target diva, so we reassign deleteListener and backspacePrevent (to prevent the defauly keydown backspace=back in history in chrome)
                        $(document).unbind('keyup', meiEditor.deleteListener);
                        $(document).unbind('keydown', backspacePrevent);
                        $(document).on('keyup', meiEditor.deleteListener);
                        $(document).on('keydown', backspacePrevent);
                    } 
                    //otherwise (click on the editor or lineQueryOverlay)
                    else
                    { 
                        //make ace delete again - taken from ace.js line 6754, commit #966bcd
                        editor.commands.addCommand({   
                            name: "del",
                            bindKey: {win: "Delete", mac: "Delete|Ctrl-D|Shift-Delete"},
                            exec: function(editor) { editor.remove("right"); },
                            multiSelectAction: "forEach",
                            scrollIntoView: "cursor"
                        });
                        //we don't want these listeners anymore
                        $(document).unbind('keyup', meiEditor.deleteListener);
                        $(document).unbind('keydown', backspacePrevent);
                    }
                });
                
                $(document).on('keydown', function(e)
                {
                    //if win-ctrl or mac-cmd was the key that was put down
                    if(e.metaKey && !meiEditorSettings.createModeActive)
                    {
                        meiEditorSettings.createModeActive = true;
                        initCoverDiv(metaClickHandler);
                    }
                    //if shift key was the key that was put down
                    if(e.shiftKey && !meiEditorSettings.editModeActive)
                    {

                        //if we're currently resizing one and shift key was just pressed, only make it draggable
                        if($(".resizableSelected").length)
                        {
                            if($(".resizableSelected").data('uiResizable'))
                            {
                                $(".resizableSelected").resizable('destroy');
                            }

                            if(!$(".resizableSelected").data('uiDraggable'))
                            {
                                $(".resizableSelected").draggable({
                                    stop: function(e, ui)
                                    {
                                        meiEditor.updateBox(ui.helper);
                                    }
                                });
                            }
                            meiEditorSettings.editModeActive = true;
                            return;
                        }

                        /*
                            Click handler for when the shift key is down and a box is clicked
                        */
                        meiEditorSettings.boxClickHandler = function(e)
                        {
                            clearTimeout(meiEditorSettings.boxSingleTimeout);
                            //if shift key is not down, turn off all other .selectedHover items
                            if ($(e.target).hasClass('selectedHover'))
                            {
                                meiEditor.deselectHighlight(e.target);
                                return;
                            }
                            else
                            {
                                //add class and change the background color
                                meiEditor.selectHighlight(e.target);
                            }
                        };

                        meiEditorSettings.editModeActive = true;
                        initCoverDiv(shiftClickHandler);
                    }
                });

                $(document).on('keyup', function(e)
                {
                    //if it was the meta key that was released
                    if((!e.metaKey) && meiEditorSettings.createModeActive)
                    {
                        meiEditorSettings.createModeActive = false;
                        $("#cover-div").unbind('dblclick');
                        $("#cover-div").unbind('mousedown');
                        $("#cover-div").remove();
                    }
                    //if it was the shift key that was released
                    if((!e.shiftKey) && meiEditorSettings.editModeActive)
                    {
                        //if we have something resizable active, turn everything back on that was originally off.
                        if($(".resizableSelected").length)
                        {
                            if(!$(".resizableSelected").data('uiResizable'))
                            {
                                $(".resizableSelected").resizable({
                                    handles: 'all',
                                    create: checkResizable,
                                    start: function(e)
                                    {
                                        e.stopPropagation();
                                        e.preventDefault();
                                    },
                                    resize: function(e)
                                    {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        checkResizable();
                                    },
                                    stop: function(e, ui)
                                    {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        meiEditor.updateBox(ui.helper);
                                    }
                                });
   
                                checkResizable();
                            }

                            if(!$(".resizableSelected").data('uiDraggable'))
                            {
                                $(".resizableSelected").draggable({
                                    stop: function(e, ui)
                                    {
                                        meiEditor.updateBox(ui.helper);
                                    }
                                });
                            }
                            meiEditorSettings.editModeActive = false;
                            return;
                        }

                        meiEditorSettings.boxClickHandler = function(e)
                        {
                            clearTimeout(meiEditorSettings.boxSingleTimeout);
                            
                            //if shift key is not down, turn off all other .selectedHover items
                            meiEditor.deselectAllHighlights(e.target);

                            if (!$(e.target).hasClass('selectedHover'))
                            {
                                //if this is the first click, find the <neume> object
                                var searchNeedle = new RegExp("<neume.*" + e.target.id, "g");

                                var pageTitle = meiEditor.getActivePanel().text();
                                var testSearch = meiEditorSettings.pageData[pageTitle].find(searchNeedle, 
                                {
                                    wrap: true,
                                    range: null
                                });

                                //add class and change the background color
                                meiEditor.selectHighlight(e.target);
                            }
                        };

                        meiEditorSettings.editModeActive = false;
                        $("#cover-div").unbind('dblclick');
                        $("#cover-div").unbind('mousedown');
                        $("#cover-div").remove();
                    }

                });
                
                //easy mode to set a listener for clicking on icons
                meiEditorSettings.editModeActive = true;
                $(document).trigger('keyup');

                return true;
            }
        };
        return retval;
    })());
    window.pluginLoader.pluginLoaded();
})(jQuery);

});