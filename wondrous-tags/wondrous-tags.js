(function($){ 
    $.fn.taggingInput = function(userACSettings, userTagSettings) {
        // dependencies
        if(!$.ui) {
            throw "Missing dependency: jQuery UI";
        } else if(!$.ui.autocomplete) {
            throw "Missing dependency: jQuery UI Autocomplete";
        }

        // default settings for autocomplete
        var acSettings = {
            minLength:0
        }

        // default settings for wondrous tags
        var tagSettings = {
            notify: function(tagWidget) {
                tagWidget.addClass("ui-state-highlight");
                tagWidget.switchClass("ui-state-highlight", "", 400);
            },
            encode: function(tags) {
                return tags.join(',');
            },
            decode: function(tagstr) {
                return tagstr.split(',');
            },
            delimiters: [',']
        }

        // merge defaults and user options
        if(userACSettings) {
            $.extend(acSettings, userACSettings);
        }
        if(userTagSettings) {
            $.extend(tagSettings, userTagSettings);
        }

        initialize(this, tagSettings, acSettings);

        return this;
    };
    function initialize(originalField, settings, autocompleteSettings) {
        var isDeleteMode = false, // if true, pressing 'backspace' will immediately delete the latest tag
            tags = [], // hold string text of each tag
            tagWidgets = [], //hold the actual tag widgets
            tagDisplay = $("<ul class='ui-widget wondrous-tagger' />"), // where the tags are displayed
            tagInput = $("<input type='text' class='wondrous-tagger-input' />"); // where the user types to enter tags

        constructUI();

        function constructUI(){
            // attempt to copy the original textfield's look 
            tagDisplay
                .addClass(originalField.attr('class'))
                .width(originalField.width())
                .attr('style', originalField.attr('style'));

            // replace the original textfield with our own psuedo-textfield
            originalField
                .after(tagDisplay.append($("<li />").append(tagInput)))
                .hide();

            // the autocomplete dropdown should appear beneath the tagDisplay, not the tagInput
            if(!autocompleteSettings['position']) {
                autocompleteSettings['position'] =  {
                    of:tagDisplay,
                };
            }

            // set up event handlers
            tagDisplay
                .click(tagDisplayClicked);
            tagInput
                .bind( "keydown", handleKeyboardInput)
                .autocomplete(autocompleteSettings)
                .bind("autocompleteselect",function(e, ui) {
                    // add the selected item as a tag
                    if(addTag(ui.item.value)) {
                        this.value = "";
                    } 
                    return false;
                })
                .bind("autocompletefocus", function(e, ui) {
                    // prevent value inserted on focus
                    return false;
                })
                .bind("autocompleteopen", function(e, ui) {
                    // set the autocomplete menu to the width of the tagDisplay
                    $(this).autocomplete('widget').width(tagDisplay.width());
                });
        }

        function tagDisplayClicked(e) {
            var target = $(e.target);

            tagInput.focus();

            // if the user clicked anything other than a tag, we don't care.
            if(!target.parent().hasClass('wondrous-tag')) {
                return true;
            }

            // the user clicked a tag
            if(target.hasClass('ui-icon-close')) {
                deleteTag(target.parent().index());
            } else {
                originalField.trigger('tagclick', target.text());
            }
            e.preventDefault();
        }

        function handleKeyboardInput(e) {
            if($(this).data("autocomplete").menu.active) {
                if (event.keyCode === $.ui.keyCode.TAB) {
                    event.preventDefault();
                } 
            } else {
                // if the user pressed enter and there's text in the input,
                // make it a tag. The form will be submitted if there is no
                // text in the input.
                if ( event.keyCode === $.ui.keyCode.ENTER && this.value) {
                    addTag(this.value);
                    this.value = "";
                    $(this).autocomplete("close");
                    event.preventDefault();
                }
            }
            // the user has to press backspace once to enter 'delete mode'
            //  and a second time to delete a tag.
            if(event.keyCode === $.ui.keyCode.BACKSPACE && !this.value){
                $(this).autocomplete("close");
                if(isDeleteMode) {
                    deleteTag(tags.length-1);
                }
                setDeleteMode(true);
            } else {
                // exit delete mode when any other key is pressed
                setDeleteMode(false);
            }

            //tag wrapping fix, adjust tagInput's width to its value's width
            //otherwise, the tag will 'jump' if it's shorter than the input's width
            //add content to DOM, grab the width, then remove it from the DOM.
            var temp = $("<span />").text(tagInput.val()).appendTo(tagInput.parent());
            var width = temp.width();
            temp.remove();
            tagInput.width(width + 20);
        }

        function addTag(tagtext) {
            // if the tag already exists, notify user and don't add it
            var tagIndex = jQuery.inArray(tagtext, tags);
            if(tagIndex !== -1) {
                settings.notify(tagWidgets[tagIndex]);
                return false;
            }
            //update ui
            var tagWidget = createTagWidget(tagtext);
            tagWidget.insertBefore(tagInput.parent());
            //update state
            tags.push(tagtext);
            tagWidgets.push(tagWidget);
            updateOriginalField();
            originalField.trigger('tagadd', tagtext);
            return true;
        }

        function deleteTag(index) {
            if(tagWidgets.length) {
                originalField.trigger('tagdelete', tags[index]);
                tagWidgets[index].remove();
                tags.splice(index, 1); 
                tagWidgets.splice(index, 1);
                updateOriginalField();
            }
        }

        function createTagWidget(text) {
            return $("<li class='wondrous-tag' />").text(text).button({
                icons: { secondary: "ui-icon-close" }
            });
        }

        function setDeleteMode(bool) {
            isDeleteMode = bool;

            if(!tagWidgets.length)
                return;

            //update ui
            var lastTag = tagWidgets[tagWidgets.length-1];
            if(isDeleteMode) {
                lastTag.addClass("ui-state-highlight");
            } else {
                lastTag.removeClass("ui-state-highlight");
            }
        }

        // tranform the tags into a submittable value
        function updateOriginalField() {
            originalField.val(settings.encode(tags));
        }
    }
})(jQuery);
