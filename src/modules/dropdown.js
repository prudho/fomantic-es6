"use strict";

import Module from '../module'

import $ from 'cash-dom';
import { Transition } from './transition';

const $document = $(document);

const hasTouch = ('ontouchstart' in document.documentElement);

const settings = {

    /* Component */
    name           : 'Dropdown',
    namespace      : 'dropdown',

    silent                 : false,
    debug                  : false,
    verbose                : false,
    performance            : true,

    on                     : 'click',    // what event should show menu action on item selection
    action                 : 'activate', // action on item selection (nothing, activate, select, combo, hide, function(){})

    values                 : false,      // specify values to use for dropdown

    clearable              : false,      // whether the value of the dropdown can be cleared

    apiSettings            : false,
    selectOnKeydown        : true,       // Whether selection should occur automatically when keyboard shortcuts used
    minCharacters          : 0,          // Minimum characters required to trigger API call

    filterRemoteData       : false,      // Whether API results should be filtered after being returned for query term
    saveRemoteData         : true,       // Whether remote name/value pairs should be stored in sessionStorage to allow remote data to be restored on page refresh

    throttle               : 200,        // How long to wait after last user input to search remotely

    context                : window,     // Context to use when determining if on screen
    direction              : 'auto',     // Whether dropdown should always open in one direction
    keepOnScreen           : true,       // Whether dropdown should check whether it is on screen before showing

    match                  : 'both',     // what to match against with search selection (both, text, or label)
    fullTextSearch         : false,      // search anywhere in value (set to 'exact' to require exact matches)
    hideDividers           : false,      // Whether to hide any divider elements (specified in selector.divider) that are sibling to any items when searched (set to true will hide all dividers, set to 'empty' will hide them when they are not followed by a visible item)

    placeholder            : 'auto',     // whether to convert blank <select> values to placeholder text
    preserveHTML           : true,       // preserve html when selecting value
    sortSelect             : false,      // sort selection on init

    forceSelection         : true,       // force a choice on blur with search selection

    allowAdditions         : false,      // whether multiple select should allow user added values
    ignoreCase             : false,       // whether to consider values not matching in case to be the same
    hideAdditions          : true,       // whether or not to hide special message prompting a user they can enter a value

    maxSelections          : false,      // When set to a number limits the number of selections to this count
    useLabels              : true,       // whether multiple select should filter currently active selections from choices
    delimiter              : ',',        // when multiselect uses normal <input> the values will be delimited with this character

    showOnFocus            : true,       // show menu on focus
    allowReselection       : false,      // whether current value should trigger callbacks when reselected
    allowTab               : true,       // add tabindex to element
    allowCategorySelection : false,      // allow elements with sub-menus to be selected

    fireOnInit             : false,      // Whether callbacks should fire when initializing dropdown values

    transition             : 'auto',     // auto transition will slide down or up based on direction
    duration               : 200,        // duration of transition

    glyphWidth             : 1.037,      // widest glyph width in em (W is 1.037 em) used to calculate multiselect input width

    // label settings on multi-select
    label: {
        transition : 'scale',
        duration   : 200,
        variation  : false
    },

    // delay before event
    delay : {
        hide   : 300,
        show   : 200,
        search : 20,
        touch  : 50
    },

    /* Callbacks */
    onChange      : function(value, text, $selected){},
    onAdd         : function(value, text, $selected){},
    onRemove      : function(value, text, $selected){},

    onLabelSelect : function($selectedLabels){},
    onLabelCreate : function(value, text) { return $(this); },
    onLabelRemove : function(value) { return true; },
    onNoResults   : function(searchTerm) { return true; },
    onShow        : function(){},
    onHide        : function(){},

    message: {
        addResult     : 'Add <b>{term}</b>',
        count         : '{count} selected',
        maxSelections : 'Max {maxCount} selections',
        noResults     : 'No results found.',
        serverError   : 'There was an error contacting the server'
    },

    error : {
        action          : 'You called a dropdown action that was not defined',
        alreadySetup    : 'Once a select has been initialized behaviors must be called on the created ui dropdown',
        labels          : 'Allowing user additions currently requires the use of labels.',
        missingMultiple : '<select> requires multiple property to be set to correctly preserve multiple values',
        method          : 'The method you called is not defined.',
        noAPI           : 'The API module is required to load resources remotely',
        noStorage       : 'Saving remote data requires session storage',
        noTransition    : 'This module requires ui transitions <https://github.com/Semantic-Org/UI-Transition>'
    },

    regExp : {
        escape   : /[-[\]{}()*+?.,\\^$|#\s:=@]/g,
        quote    : /"/g
    },

    metadata : {
        defaultText     : 'defaultText',
        defaultValue    : 'defaultValue',
        placeholderText : 'placeholder',
        text            : 'text',
        value           : 'value'
    },

    // property names for remote query
    fields: {
        remoteValues : 'results',  // grouping for api results
        values       : 'values',   // grouping for all dropdown values
        disabled     : 'disabled', // whether value should be disabled
        name         : 'name',     // displayed dropdown text
        value        : 'value',    // actual dropdown value
        text         : 'text',     // displayed text when selected
        type         : 'type'      // type of dropdown element
    },

    keys : {
        backspace  : 8,
        delimiter  : 188, // comma
        deleteKey  : 46,
        enter      : 13,
        escape     : 27,
        pageUp     : 33,
        pageDown   : 34,
        leftArrow  : 37,
        upArrow    : 38,
        rightArrow : 39,
        downArrow  : 40
    },

    selector : {
        addition     : '.addition',
        divider      : '.divider, .header',
        dropdown     : '.ui.dropdown',
        hidden       : '.hidden',
        icon         : ':scope > .dropdown.icon',
        input        : ':scope > input[type="hidden"], :scope > select',
        item         : '.item',
        label        : ':scope > .label',
        remove       : ':scope > .label > .delete.icon',
        siblingLabel : '.label',
        menu         : '.menu',
        message      : '.message',
        menuIcon     : '.dropdown.icon',
        search       : 'input.search, .menu > .search > input, .menu input.search',
        sizer        : ':scope > input.sizer',
        text         : ':scope > .text:not(.icon)',
        unselectable : '.disabled, .filtered',
        clearIcon    : ':scope > .remove.icon'
    },

    className : {
        active      : 'active',
        addition    : 'addition',
        animating   : 'animating',
        disabled    : 'disabled',
        empty       : 'empty',
        dropdown    : 'ui dropdown',
        filtered    : 'filtered',
        hidden      : 'hidden transition',
        item        : 'item',
        label       : 'ui label',
        loading     : 'loading',
        menu        : 'menu',
        message     : 'message',
        multiple    : 'multiple',
        placeholder : 'default',
        sizer       : 'sizer',
        search      : 'search',
        selected    : 'selected',
        selection   : 'selection',
        upward      : 'upward',
        leftward    : 'left',
        visible     : 'visible',
        clearable   : 'clearable',
        noselection : 'noselection'
    },

    templates : {
        escape: function(string, preserveHTML) {
            if (preserveHTML){
                return string;
            }
            var
                badChars     = /[&<>"'`]/g,
                shouldEscape = /[&<>"'`]/,
                escape       = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#x27;",
                    "`": "&#x60;"
                },
                escapedChar  = function(chr) {
                    return escape[chr];
                }
            ;
            if(shouldEscape.test(string)) {
                return string.replace(badChars, escapedChar);
            }
            return string;
        },
        // generates dropdown from select values
        dropdown: function(select, preserveHTML) {
            var
                placeholder = select.placeholder || false,
                values      = select.values || [],
                html        = '',
                escape = $.fn.dropdown.this.settings.templates.escape
            ;
            html +=  '<i class="dropdown icon"></i>';
            if(placeholder) {
                html += '<div class="default text">' + escape(placeholder,preserveHTML) + '</div>';
            }
            else {
                html += '<div class="text"></div>';
            }
            html += '<div class="menu">';
            $.each(values, function(index, option) {
                html += (option.disabled)
                ? '<div class="disabled item" data-value="' + option.value.replace(/"/g,"") + '">' + escape(option.name,preserveHTML) + '</div>'
                : '<div class="item" data-value="' + option.value.replace(/"/g,"") + '">' + escape(option.name,preserveHTML) + '</div>'
                ;
            });
            html += '</div>';
            return html;
        },
      
        // generates just menu from select
        menu: function(response, fields, preserveHTML) {
            var
                values = response[fields.values] || [],
                html   = '',
                escape = $.fn.dropdown.this.settings.templates.escape
            ;
            $.each(values, function(index, option) {
                var
                itemType = (option[fields.type])
                    ? option[fields.type]
                    : 'item'
                ;
        
                if( itemType === 'item' ) {
                var
                    maybeText = (option[fields.text])
                    ? 'data-text="' + option[fields.text] + '"'
                    : '',
                    maybeDisabled = (option[fields.disabled])
                    ? 'disabled '
                    : ''
                ;
                html += '<div class="'+ maybeDisabled +'item" data-value="' + option[fields.value].replace(/"/g,"") + '"' + maybeText + '>';
                html +=   escape(option[fields.name],preserveHTML);
                html += '</div>';
                } else if (itemType === 'header') {
                html += '<div class="header">';
                html +=   escape(option[fields.name],preserveHTML);
                html += '</div>';
                }
            });
            return html;
        },
      
        // generates label for multiselect
        label: function(value, text, preserveHTML) {
            return this.escape(text,preserveHTML) + '<i class="delete icon"></i>';
        },
      
      
        // generates messages like "No results"
        message: function(message) {
            return message;
        },
      
        // generates user addition to selection menu
        addition: function(choice) {
            return choice;
        }
      
    },

    events: ['rate']
}

export class Dropdown extends Module {
    constructor(selector, parameters) {
        super(selector, parameters, settings);
       
        this.$text = this.$element.find(this.settings.selector.text);
        this.$search = this.$element.find(this.settings.selector.search);
        this.$clear = this.$element.find(this.settings.selector.clearIcon);
        this.$sizer = this.$element.find(this.settings.selector.sizer);
        this.$input = this.$element.find(this.settings.selector.input);

        this.$combo = (this.$element.prev().find(this.settings.selector.text).length > 0)
            ? this.$element.prev().find(this.settings.selector.text)
            : this.$element.prev()
        ;

        this.$menu = this.$element.children(this.settings.selector.menu);
        this.$item = this.$menu.find(this.settings.selector.item);
        this.$divider = this.settings.hideDividers ? this.$item.parent().children(this.settings.selector.divider) : $();

        this.$context = $(this.settings.context);

        this.activated = false;
        this.itemActivated = false;
        this.internalChange = false;

        this.initialLoad;

        this.actions = {
            nothing: this.action_nothing,
            activate: this.action_activate
        };
        
        this.initialize()
    }

    initialize() {
        this.verbose('Initializing dropdown module', this.settings);

        if (this.is_alreadySetup()) {
            module.setup.reference();
        } else {
            this.setup_layout();

            if (this.settings.values) {
                module.change.values(this.settings.values);
            }

            this.refreshData();

            this.save_defaults();
            this.restore_selected();

            this.create_id();
            this.bind_events();

            this.observeChanges();
            this.instantiate();
        }
    }

    instantiate() {
        this.verbose('Instantiating module', this);
        this.$element.data(this.moduleNamespace, this);
    }

    destroy() {
        this.verbose('Destroying previous instance', this.instance);
        this.remove_events();
        this.$element.removeData(this.moduleNamespace);
    }

    setup_layout() {
        if (this.$element.is('select')) {
            module.setup.select();
            module.setup.returnedObject();
        }
        if (!this.has_menu()) {
            this.create_menu();
        }
        if (this.is_selection() && this.is_clearable() && !this.has_clearItem()) {
            this.verbose('Adding clear icon');
            this.$clear = $('<i />')
                .addClass('remove icon')
                .insertBefore(this.$text)
            ;
        }
        if (this.is_search() && !this.has_search()) {
            this.verbose('Adding search input');
            this.$search = $('<input />')
                .addClass(this.settings.className.search)
                .prop('autocomplete', 'off')
                .insertBefore(this.$text)
            ;
        }
        if (this.is_multiple() && this.is_searchSelection() && !this.has_sizer()) {
            module.create.sizer();
        }
        if (this.settings.allowTab) {
            this.set_tabbable();
        }
    }

    create_id() {
        this.id = (Math.random().toString(16) + '000000000').substr(2, 8);
        this.elementNamespace = '.' + this.id;
        this.verbose('Creating unique id for element', this.id);
    }

    bind_events() {
        if (hasTouch) {
            this.bind_touchEvents();
        }
        this.bind_keyboardEvents();
        this.bind_inputEvents();
        this.bind_mouseEvents();
    }

    bind_keyboardEvents() {
        this.verbose('Binding keyboard events');
        this.$element.on('keydown' + this.eventNamespace, this.event_keydown.bind(this));
        if (this.has_search()) {
            // TODO
            //this.$element.on(module.get.inputEvent() + eventNamespace, selector.search, this.event_input.bind(this));
        }
        if (this.is_multiple()) {
            $document.on('keydown' + this.elementNamespace, this.event_document_keydown.bind(this));
        }
    }

    bind_inputEvents() {
        this.verbose('Binding input change events');
        // TODO
        //this.$element.on('change' + this.eventNamespace, selector.input, this.event_change.bind(this));
    }

    bind_intent() {
        this.verbose('Binding hide intent event to document');
        if (this.hasTouch) {
            $document
                .on('touchstart' + this.elementNamespace, module.event.test.touch)
                .on('touchmove'  + this.elementNamespace, module.event.test.touch)
            ;
        }
        $document.on('click' + this.elementNamespace, this.event_test_hide.bind(this));
    }

    bind_mouseEvents() {
        this.verbose('Binding mouse events');
        if (this.is_multiple()) {
            this.$element
                .on('click'   + this.eventNamespace, this.settings.selector.label,  this.event_label_click.bind(this))
                .on('click'   + this.eventNamespace, this.settings.selector.remove, this.event_remove_click.bind(this))
            ;
        }
        if (this.is_searchSelection()) {
            this.$element
                .on('mousedown' + this.eventNamespace, this.event_mousedown.bind(this))
                .on('mouseup'   + this.eventNamespace, this.event_mouseup.bind(this))
                //*.on('mousedown' + this.eventNamespace, selector.menu,   module.event.menu.mousedown)
                //*.on('mouseup'   + this.eventNamespace, selector.menu,   module.event.menu.mouseup)
                //*.on('click'     + this.eventNamespace, this.settings.selector.icon,   this.event_icon_click.bind(this))
                //.on('click'     + this.eventNamespace, selector.clearIcon, module.event.clearIcon.click)
                //*.on('focus'     + this.eventNamespace, selector.search, module.event.search.focus)
                //*.on('click'     + this.eventNamespace, selector.search, module.event.search.focus)
                //*.on('blur'      + this.eventNamespace, selector.search, module.event.search.blur)
                //*.on('click'     + this.eventNamespace, selector.text,   module.event.text.focus)
            ;

            this.$element.find(this.settings.selector.menu).on('mousedown' + this.eventNamespace, this.event_menu_mousedown.bind(this));
            this.$element.find(this.settings.selector.menu).on('mouseup' + this.eventNamespace, this.event_menu_mouseup.bind(this));
            this.$element.find(this.settings.selector.icon).on('click' + this.eventNamespace, this.event_icon_click.bind(this));
            this.$element.find(this.settings.selector.clearIcon).on('click' + this.eventNamespace, this.event_clearIcon_click.bind(this));
            this.$element.find(this.settings.selector.search).on('focus' + this.eventNamespace, this.event_search_focus.bind(this));
            this.$element.find(this.settings.selector.search).on('click' + this.eventNamespace, this.event_search_focus.bind(this));
            this.$element.find(this.settings.selector.search).on('blur' + this.eventNamespace, this.event_search_blur.bind(this));
            this.$element.find(this.settings.selector.text).on('blur' + this.eventNamespace, this.event_text_focus.bind(this))

            if (this.is_multiple()) {
                this.$element.on('click' + eventNamespace, module.event.click);
            }
        } else {
            if (this.settings.on == 'click') {
                this.$element
                    .on('click' + this.eventNamespace, this.settings.selector.icon, this.event_icon_click.bind(this))
                    .on('click' + this.eventNamespace, this.event_test_toggle.bind(this))
                ;
            } else if(this.settings.on == 'hover') {
                this.$element
                    .on('mouseenter' + this.eventNamespace, this.delay_show.bind(this))
                    .on('mouseleave' + this.eventNamespace, this.delay_hide.bind(this))
                ;
            } else {
                this.$element
                    .on(this.settings.on + eventNamespace, module.toggle)
                ;
            }
            this.$element
                .on('mousedown' + this.eventNamespace, this.event_mousedown.bind(this))
                .on('mouseup'   + this.eventNamespace, this.event_mouseup.bind(this))
                .on('focus'     + this.eventNamespace, this.event_focus.bind(this))
                .on('click'     + this.eventNamespace, this.settings.selector.clearIcon, this.event_clearIcon_click.bind(this))
            ;
            if (this.has_menuSearch()) {
                this.$element.on('blur' + eventNamespace, selector.search, module.event.search.blur);
            } else {
                this.$element.on('blur' + this.eventNamespace, this.event_blur.bind(this));
            }
        }
        this.$menu
            .on('mouseenter' + this.eventNamespace, this.settings.selector.item, this.event_item_mouseenter.bind(this))
            .on('mouseleave' + this.eventNamespace, this.settings.selector.item, this.event_item_mouseleave.bind(this))
            .on('click'      + this.eventNamespace, this.settings.selector.item, this.event_item_click.bind(this))
        ;
    }

    observeChanges() {
        /* TODO
        if('MutationObserver' in window) {
            selectObserver = new MutationObserver(module.event.select.mutation);
            menuObserver   = new MutationObserver(module.event.menu.mutation);
            module.debug('Setting up mutation observer', selectObserver, menuObserver);
            module.observe.select();
            module.observe.menu();
        }*/
    }

    event_keydown(event) {
        var
            pressedKey    = event.which,
            isShortcutKey = this.is_inObject(pressedKey, this.settings.keys)
        ;
        if (isShortcutKey) {
            var
            $currentlySelected = $item.not(selector.unselectable).filter('.' + className.selected).eq(0),
            $activeItem        = $menu.children('.' + className.active).eq(0),
            $selectedItem      = ($currentlySelected.length > 0)
                ? $currentlySelected
                : $activeItem,
            $visibleItems = ($selectedItem.length > 0)
                ? $selectedItem.siblings(':not(.' + className.filtered +')').addBack()
                : $menu.children(':not(.' + className.filtered +')'),
            $subMenu              = $selectedItem.children(selector.menu),
            $parentMenu           = $selectedItem.closest(selector.menu),
            inVisibleMenu         = ($parentMenu.hasClass(className.visible) || $parentMenu.hasClass(className.animating) || $parentMenu.parent(selector.menu).length > 0),
            hasSubMenu            = ($subMenu.length> 0),
            hasSelectedItem       = ($selectedItem.length > 0),
            selectedIsSelectable  = ($selectedItem.not(selector.unselectable).length > 0),
            delimiterPressed      = (pressedKey == keys.delimiter && this.settings.allowAdditions && module.is.multiple()),
            isAdditionWithoutMenu = (this.settings.allowAdditions && this.settings.hideAdditions && (pressedKey == keys.enter || delimiterPressed) && selectedIsSelectable),
            $nextItem,
            isSubMenuItem,
            newIndex
            ;
            // allow selection with menu closed
            if(isAdditionWithoutMenu) {
            module.verbose('Selecting item from keyboard shortcut', $selectedItem);
            module.event.item.click.call($selectedItem, event);
            if(module.is.searchSelection()) {
                module.remove.searchTerm();
            }
            if(module.is.multiple()){
                event.preventDefault();
            }
            }

            // visible menu keyboard shortcuts
            if( module.is.visible() ) {

            // enter (select or open sub-menu)
            if(pressedKey == keys.enter || delimiterPressed) {
                if(pressedKey == keys.enter && hasSelectedItem && hasSubMenu && !this.settings.allowCategorySelection) {
                module.verbose('Pressed enter on unselectable category, opening sub menu');
                pressedKey = keys.rightArrow;
                }
                else if(selectedIsSelectable) {
                module.verbose('Selecting item from keyboard shortcut', $selectedItem);
                module.event.item.click.call($selectedItem, event);
                if(module.is.searchSelection()) {
                    module.remove.searchTerm();
                    if(module.is.multiple()) {
                        $search.focus();
                    }
                }
                }
                event.preventDefault();
            }

            // sub-menu actions
            if(hasSelectedItem) {

                if(pressedKey == keys.leftArrow) {

                isSubMenuItem = ($parentMenu[0] !== $menu[0]);

                if(isSubMenuItem) {
                    module.verbose('Left key pressed, closing sub-menu');
                    module.animate.hide(false, $parentMenu);
                    $selectedItem
                    .removeClass(className.selected)
                    ;
                    $parentMenu
                    .closest(selector.item)
                        .addClass(className.selected)
                    ;
                    event.preventDefault();
                }
                }

                // right arrow (show sub-menu)
                if(pressedKey == keys.rightArrow) {
                if(hasSubMenu) {
                    module.verbose('Right key pressed, opening sub-menu');
                    module.animate.show(false, $subMenu);
                    $selectedItem
                    .removeClass(className.selected)
                    ;
                    $subMenu
                    .find(selector.item).eq(0)
                        .addClass(className.selected)
                    ;
                    event.preventDefault();
                }
                }
            }

            // up arrow (traverse menu up)
            if(pressedKey == keys.upArrow) {
                $nextItem = (hasSelectedItem && inVisibleMenu)
                ? $selectedItem.prevAll(selector.item + ':not(' + selector.unselectable + ')').eq(0)
                : $item.eq(0)
                ;
                if($visibleItems.index( $nextItem ) < 0) {
                module.verbose('Up key pressed but reached top of current menu');
                event.preventDefault();
                return;
                }
                else {
                module.verbose('Up key pressed, changing active item');
                $selectedItem
                    .removeClass(className.selected)
                ;
                $nextItem
                    .addClass(className.selected)
                ;
                module.set.scrollPosition($nextItem);
                if(this.settings.selectOnKeydown && module.is.single()) {
                    module.set.selectedItem($nextItem);
                }
                }
                event.preventDefault();
            }

            // down arrow (traverse menu down)
            if(pressedKey == keys.downArrow) {
                $nextItem = (hasSelectedItem && inVisibleMenu)
                ? $nextItem = $selectedItem.nextAll(selector.item + ':not(' + selector.unselectable + ')').eq(0)
                : $item.eq(0)
                ;
                if($nextItem.length === 0) {
                module.verbose('Down key pressed but reached bottom of current menu');
                event.preventDefault();
                return;
                }
                else {
                module.verbose('Down key pressed, changing active item');
                $item
                    .removeClass(className.selected)
                ;
                $nextItem
                    .addClass(className.selected)
                ;
                module.set.scrollPosition($nextItem);
                if(this.settings.selectOnKeydown && module.is.single()) {
                    module.set.selectedItem($nextItem);
                }
                }
                event.preventDefault();
            }

            // page down (show next page)
            if(pressedKey == keys.pageUp) {
                module.scrollPage('up');
                event.preventDefault();
            }
            if(pressedKey == keys.pageDown) {
                module.scrollPage('down');
                event.preventDefault();
            }

            // escape (close menu)
            if(pressedKey == keys.escape) {
                module.verbose('Escape key pressed, closing dropdown');
                module.hide();
            }

            }
            else {
            // delimiter key
            if(delimiterPressed) {
                event.preventDefault();
            }
            // down arrow (open menu)
            if(pressedKey == keys.downArrow && !module.is.visible()) {
                module.verbose('Down key pressed, showing dropdown');
                module.show();
                event.preventDefault();
            }
            }
        } else {
            if (!this.has_search()) {
                this.set_selectedLetter(String.fromCharCode(pressedKey) );
            }
        }
    }

    // label selection should occur even when element has no focus
    event_document_keydown(event) {
        /* TODO
        var
            pressedKey    = event.which,
            isShortcutKey = module.is.inObject(pressedKey, keys)
            ;
            if(isShortcutKey) {
            var
                $label            = this.$element.find(selector.label),
                $activeLabel      = $label.filter('.' + className.active),
                activeValue       = $activeLabel.data(metadata.value),
                labelIndex        = $label.index($activeLabel),
                labelCount        = $label.length,
                hasActiveLabel    = ($activeLabel.length > 0),
                hasMultipleActive = ($activeLabel.length > 1),
                isFirstLabel      = (labelIndex === 0),
                isLastLabel       = (labelIndex + 1 == labelCount),
                isSearch          = module.is.searchSelection(),
                isFocusedOnSearch = module.is.focusedOnSearch(),
                isFocused         = module.is.focused(),
                caretAtStart      = (isFocusedOnSearch && module.get.caretPosition() === 0),
                $nextLabel
            ;
            if(isSearch && !hasActiveLabel && !isFocusedOnSearch) {
                return;
            }

            if(pressedKey == keys.leftArrow) {
                // activate previous label
                if((isFocused || caretAtStart) && !hasActiveLabel) {
                module.verbose('Selecting previous label');
                $label.last().addClass(className.active);
                }
                else if(hasActiveLabel) {
                if(!event.shiftKey) {
                    module.verbose('Selecting previous label');
                    $label.removeClass(className.active);
                }
                else {
                    module.verbose('Adding previous label to selection');
                }
                if(isFirstLabel && !hasMultipleActive) {
                    $activeLabel.addClass(className.active);
                }
                else {
                    $activeLabel.prev(selector.siblingLabel)
                    .addClass(className.active)
                    .end()
                    ;
                }
                event.preventDefault();
                }
            }
            else if(pressedKey == keys.rightArrow) {
                // activate first label
                if(isFocused && !hasActiveLabel) {
                $label.first().addClass(className.active);
                }
                // activate next label
                if(hasActiveLabel) {
                if(!event.shiftKey) {
                    module.verbose('Selecting next label');
                    $label.removeClass(className.active);
                }
                else {
                    module.verbose('Adding next label to selection');
                }
                if(isLastLabel) {
                    if(isSearch) {
                    if(!isFocusedOnSearch) {
                        module.focusSearch();
                    }
                    else {
                        $label.removeClass(className.active);
                    }
                    }
                    else if(hasMultipleActive) {
                    $activeLabel.next(selector.siblingLabel).addClass(className.active);
                    }
                    else {
                    $activeLabel.addClass(className.active);
                    }
                }
                else {
                    $activeLabel.next(selector.siblingLabel).addClass(className.active);
                }
                event.preventDefault();
                }
            }
            else if(pressedKey == keys.deleteKey || pressedKey == keys.backspace) {
                if(hasActiveLabel) {
                module.verbose('Removing active labels');
                if(isLastLabel) {
                    if(isSearch && !isFocusedOnSearch) {
                    module.focusSearch();
                    }
                }
                $activeLabel.last().next(selector.siblingLabel).addClass(className.active);
                module.remove.activeLabels($activeLabel);
                event.preventDefault();
                }
                else if(caretAtStart && !hasActiveLabel && pressedKey == keys.backspace) {
                module.verbose('Removing last label on input backspace');
                $activeLabel = $label.last().addClass(className.active);
                module.remove.activeLabels($activeLabel);
                }
            }
            else {
                $activeLabel.removeClass(className.active);
            }
        }*/
        console.log('todo')
    }

    event_input(event) {
        if (this.is_multiple() || this.is_searchSelection()) {
            this.set_filtered();
        }
        clearTimeout(this.timer);
        this.timer = setTimeout(this.search.bind(this), this.settings.delay.search);
    }

    event_change() {
        if (!this.internalChange) {
            this.debug('Input changed, updating selection');
            this.set_selected();
        }
    }

    event_icon_click(event) {
        if (this.has_search()) {
            if(!this.is_active()) {
                if (this.settings.showOnFocus) {
                    this.focusSearch();
                } else {
                    this.toggle();
                }
            } else {
                this.blurSearch();
            }
        } else {
            this.toggle();
        }
    }

    event_search_focus(event) {
        this.activated = true;
        if (this.is_multiple()) {
            this.remove_activeLabel();
        }
        if(this.settings.showOnFocus || event.type !== 'focus') {
            this.search();
        }
    }

    event_search_blur() {
        /* TODO
        pageLostFocus = (document.activeElement === this);
        if(module.is.searchSelection() && !willRefocus) {
            if(!itemActivated && !pageLostFocus) {
                if(this.settings.forceSelection) {
                    module.forceSelection();
                }
                module.hide();
            }
        }
        willRefocus = false;
        */
    }

    event_text_focus() {
        this.activated = true;
        this.focusSearch();
    }

    event_mousedown() {
        if (this.is_searchSelection()) {
            // prevent menu hiding on immediate re-focus
            this.willRefocus = true;
        } else {
            // prevents focus callback from occurring on mousedown
            this.activated = true;
        }
    }

    event_mouseup() {
        if (this.is_searchSelection()) {
            // prevent menu hiding on immediate re-focus
            this.willRefocus = false;
        } else {
            this.activated = false;
        }
    }

    event_focus() {
        if (this.settings.showOnFocus && !this.activated && this.is_hidden() && !this.pageLostFocus) {
            this.show();
        }
    }

    event_clearIcon_click(event) {
        this.clear();
        if (this.is_searchSelection()) {
            this.remove_searchTerm();
        }
        this.hide();
        event.stopPropagation();
    }

    event_test_hide(event) {
        if (this._eventInModule(event, this.hide.bind(this))) {
            event.preventDefault();
        }
    }

    event_test_toggle(event) {
        var toggleBehavior = (this.is_multiple()) ? this.show.bind(this) : this.toggle.bind(this);
        if (this.is_bubbledLabelClick(event) || this.is_bubbledIconClick(event)) {
            return;
        }
        if (this.eventOnElement(event, toggleBehavior)) {
            event.preventDefault();
        }
    }

    event_blur(event) {
        this.pageLostFocus = (document.activeElement === this); // INVESTIGATE
        if (!this.activated && !this.pageLostFocus) {
            this.remove_activeLabel();
            this.hide();
        }
    }

    event_menu_mousedown() {
        this.itemActivated = true;
    }

    event_menu_mouseup() {
        this.itemActivated = false;
    }

    event_item_mouseenter(event) {
        console.log('done')
        // TODO
        /*var
            $target        = $(event.target),
            $item          = $(this),
            $subMenu       = $item.children(selector.menu),
            $otherMenus    = $item.siblings(selector.item).children(selector.menu),
            hasSubMenu     = ($subMenu.length > 0),
            isBubbledEvent = ($subMenu.find($target).length > 0)
        ;
        if( !isBubbledEvent && hasSubMenu ) {
            clearTimeout(module.itemTimer);
            module.itemTimer = setTimeout(function() {
                module.verbose('Showing sub-menu', $subMenu);
                $.each($otherMenus, function() {
                module.animate.hide(false, $(this));
                });
                module.animate.show(false, $subMenu);
            }, this.settings.delay.show);
            event.preventDefault();
        }*/
    }

    event_item_mouseleave(event) {
        /* TODO
        var
            $subMenu = $(this).children(selector.menu)
        ;
        if($subMenu.length > 0) {
            clearTimeout(module.itemTimer);
            module.itemTimer = setTimeout(function() {
            module.verbose('Hiding sub-menu', $subMenu);
            module.animate.hide(false, $subMenu);
            }, this.settings.delay.hide);
        }
        */
    }

    event_item_click(event, skipRefocus) {
        var
            //$choice        = $(this), INVESTIGATE
            $choice        = $(event.target),
            $target        = (event)
                ? $(event.target)
                : $(''),
            $subMenu       = $choice.find(this.settings.selector.menu),
            text           = this.get_choiceText($choice),
            value          = this.get_choiceValue($choice, text),
            hasSubMenu     = ($subMenu.length > 0),
            isBubbledEvent = ($subMenu.find($target).length > 0)
        ;

        // prevents IE11 bug where menu receives focus even though `tabindex=-1`
        if (!this.has_search() || !document.activeElement.isEqualNode(this.$search[0])) {
            //$(document.activeElement).blur(); // INVESTIGATE
        }
        if(!isBubbledEvent && (!hasSubMenu || this.settings.allowCategorySelection)) {
            if (this.is_searchSelection()) {
                if(this.settings.allowAdditions) {
                    this.remove_userAddition();
                }
                this.remove_searchTerm();
                if (!this.is_focusedOnSearch() && !(skipRefocus == true)) {
                    this.focusSearch(true);
                }
            }
            if (!this.settings.useLabels) {
                this.remove_filteredItem();
                this.set_scrollPosition($choice);
            }
            this.selectAction.call(this, text, value, event.target);
        }
    }

    event_label_click() {
        console.log('event_label_click')
    }

    event_remove_click() {
        console.log('event_remove_click')
    }

    delay_hide() {
        this.verbose('Delaying hide event to ensure user intent');
        clearTimeout(this.timer);
        this.timer = setTimeout(this.hide.bind(this), this.settings.delay.hide);
    }

    delay_show() {
        this.verbose('Delaying show event to ensure user intent');
        clearTimeout(this.timer);
        this.timer = setTimeout(this.show.bind(this), this.settings.delay.show);
    }

    toggle() {
        this.verbose('Toggling menu visibility');
        if (!this.is_active()) {
            this.show();
        } else {
            this.hide();
        }
    }

    show(callback) {
        callback = $.isFunction(callback)
            ? callback
            : function(){}
        ;
        if (!this.can_show() && this.is_remote()) {
            this.debug('No API results retrieved, searching before show');
            module.queryRemote(module.get.query(), module.show);
        }
        if (this.can_show() && !this.is_active()) {
            this.debug('Showing dropdown');
            if (this.has_message() && !(this.has_maxSelections() || this.has_allResultsFiltered())) {
                this.remove_message();
            }
            if (this.is_allFiltered()) {
                return true;
            }
            //if (this.settings.onShow.call(element) !== false) {
            if (this.invokeCallback('show')(this.element) !== false) {
                this.animate_show(function() {
                    if (this.can_click()) {
                        this.bind_intent();
                    }
                    if (this.has_search()) {
                        this.focusSearch();
                    }
                    this.set_visible();
                    callback.call(this.element);
                }.bind(this));
            }
        }
    }

    animate_show(callback, $subMenu) {
        console.log(this)

        var
            module = this,
            $currentMenu = $subMenu || this.$menu,
            start = ($subMenu)
                ? function() {}
                : function() {
                    module.hideSubMenus();
                    module.hideOthers();
                    module.set_active();
            },
            transition
        ;
        callback = $.isFunction(callback)
            ? callback
            : function(){}
        ;
        this.verbose('Doing menu show animation', $currentMenu);
        this.set_direction($subMenu);
        transition = this.get_transition($subMenu);
        if( this.is_selection()) {
            this.set_scrollPosition(this.get_selectedItem(), true);
        }
        if (this.is_hidden($currentMenu) || this.is_animating($currentMenu)) {
            if (transition == 'none') {
                start();
                $currentMenu.transition('show');
                callback.call(this.element);
            // TODO: add a check if Transition class is loaded... old code includes `} else if($.fn.transition !== undefined && this.$element.transition('is supported')) {`
            } else if (true) {
                var currentMenuTransition = new Transition($currentMenu, {
                    animation  : transition + ' in',
                    debug      : this.settings.debug,
                    verbose    : this.settings.verbose,
                    duration   : this.settings.duration,
                    queue      : true,
                });

                currentMenuTransition.on('start', start);

                currentMenuTransition.on('complete', function() {
                    callback.call(this.element);
                }.bind(this));
            } else {
                this.error(this.settings.error.noTransition, transition);
            }
        }
    }

    hide(callback) {
        callback = $.isFunction(callback) ? callback : function() {};
        if (this.is_active() && !this.is_animatingOutward()) {
            this.debug('Hiding dropdown');
            //if (this.settings.onHide.call(this.element) !== false) {
            if (this.invokeCallback('hide')(this.element) !== false) {
                this.animate_hide(function() {
                    this.remove_visible();
                    // hidding search focus
                    if (this.is_focusedOnSearch() ) {
                        //this.$search.blur(); INVESTIGATE
                    }
                    callback.call(this.element);
                }.bind(this));
            }
        }
    }

    animate_hide(callback, $subMenu) {
        var
            $currentMenu = $subMenu || this.$menu,
            duration = ($subMenu)
                ? (this.settings.duration * 0.9)
                : this.settings.duration,
            start = ($subMenu)
                ? function() {}
                : function() {
                    if (this.can_click()) {
                        this.unbind_intent();
                    }
                    this.remove_active();
            },
            transition = this.get_transition($subMenu)
        ;
        callback = $.isFunction(callback)
            ? callback
            : function(){}
        ;
        if (this.is_visible($currentMenu) || this.is_animating($currentMenu)) {
            this.verbose('Doing menu hide animation', $currentMenu);

            if (transition == 'none') {
                start();
                $currentMenu.transition('hide');
                callback.call(this.element);
            // TODO: add a check if Transition class is loaded... old code includes `} else if($.fn.transition !== undefined && this.$element.transition('is supported')) {`
            } else if (true) {
                var currentMenuTransition = new Transition($currentMenu, {
                    animation  : transition + ' out',
                    debug      : this.settings.debug,
                    verbose    : this.settings.verbose,
                    duration   : this.settings.duration,
                    queue      : false,
                });

                currentMenuTransition.on('start', start);

                currentMenuTransition.on('complete', function() {
                    callback.call(this.element);
                }.bind(this));
            } else {
                this.error(this.settings.error.transition);
            }
        }
    }

    hideAndClear() {
        var module = this;
        this.remove_searchTerm();
        if (this.has_maxSelections()) {
            return;
        }
        if (this.has_search()) {
            this.hide(function() {
                module.remove_filteredItem();
            });
        } else {
            this.hide();
        }
    }

    hideOthers() {
        /* INVESTIGATE
        module.verbose('Finding other dropdowns to hide');
        $allModules
            .not(this.$element)
            .has(selector.menu + '.' + className.visible)
            .dropdown('hide')
        ;*/
    }

    hideMenu() {
        this.verbose('Hiding menu instantaneously');
        this.remove_active();
        this.remove_visible();
        //this.$menu.transition('hide'); TODO
    }

    hideSubMenus() {
        var
            $subMenus = this.$menu.children(this.settings.selector.item).find(this.settings.selector.menu)
        ;
        this.verbose('Hiding sub menus', $subMenus);
        //$subMenus.transition('hide'); TODO
    }

    refreshData() {
        this.verbose('Refreshing cached metadata');
        this.$item
            .removeData(this.settings.metadata.text)
            .removeData(this.settings.metadata.value)
        ;
    }

    focusSearch(skipHandler) {
        if (this.has_search() && !this.is_focusedOnSearch()) {
            if (skipHandler) {
                this.$element.find(this.settings.selector.search).off('focus' + this.eventNamespace);
                //this.$search.focus(); INVESTIGATE
                this.$element.find(this.settings.selector.search).on('focus'  + this.eventNamespace,  this.event_search_focus.bind(this));
            } else {
                //this.$search.focus(); INVESTIGATE
            }
        }
    }

    blurSearch() {
        if (this.has_search()) {
            //this.$search.blur(); INVESTIGATE
        }
    }

    search(query) {
        query = (query !== undefined) ? query : this.get_query();
        this.verbose('Searching for query', query);
        if (this.has_minCharacters(query)) {
            this.filter(query);
        } else {
            this.hide();
        }
    }

    filter(query) {
        var
            module = this,
            searchTerm = (query !== undefined) ? query : this.get_query(),
            afterFiltered = function() {
                if (module.is_multiple()) {
                    module.filterActive();
                }
                if (query || (!query && module.get_activeItem().length == 0)) {
                    module.select_firstUnfiltered();
                }
                if (module.has_allResultsFiltered()) {
                    //if (module.settings.onNoResults.call(element, searchTerm) ) {
                    if (module.invokeCallback('noresults')(module.element, searchTerm)) {
                        if (this.settings.allowAdditions) {
                            if(this.settings.hideAdditions) {
                                module.verbose('User addition with no menu, setting empty style');
                                module.set_empty();
                                module.hideMenu();
                            }
                        } else {
                            module.verbose('All items filtered, showing message', searchTerm);
                            module.add_message(module.settings.message.noResults);
                        }
                    } else {
                        module.verbose('All items filtered, hiding dropdown', searchTerm);
                        module.hideMenu();
                    }
                } else {
                    module.remove_empty();
                    module.remove_message();
                }
                if (module.settings.allowAdditions) {
                    module.add_userSuggestion(module.escape_htmlEntities(query));
                }
                if (module.is_searchSelection() && module.can_show() && module.is_focusedOnSearch() ) {
                    module.show();
                }
            }
        ;
        if (this.settings.useLabels && this.has_maxSelections()) {
            return;
        }
        if (this.settings.apiSettings) {
            if (this.can_useAPI()) {
                this.queryRemote(searchTerm, function() {
                    if (module.settings.filterRemoteData) {
                        module.filterItems(searchTerm);
                    }
                    var preSelected = module.$input.val();
                    if (!Array.isArray(preSelected)) {
                        preSelected = preSelected !== "" ? preSelected.split(module.settings.delimiter) : [];
                    }
                    $.each(preSelected, function(index,value) {
                        module.$item.filter('[data-value="'+ value +'"]').addClass(module.settings.className.filtered);
                    });
                    afterFiltered();
                });
            } else {
                this.error(this.settings.error.noAPI);
            }
        } else {
            this.filterItems(searchTerm);
            afterFiltered();
        }
    }

    filterItems(query) {
        var
            searchTerm       = (query !== undefined) ? query : this.get_query(),
            results          =  null,
            escapedTerm      = this.escape_string(searchTerm),
            beginsWithRegExp = new RegExp('^' + escapedTerm, 'igm'),
            module           = this
        ;
        // avoid loop if we're matching nothing
        if (this.has_query()) {
            results = [];

            this.verbose('Searching for matching values', searchTerm);
            this.$item.each(function() {
                var
                    $choice = $(this),
                    text,
                    value
                ;
                if (module.settings.match == 'both' || module.settings.match == 'text') {
                    text = String(module.get_choiceText($choice, false));
                    if (text.search(beginsWithRegExp) !== -1) {
                        results.push(this);
                        return true;
                    } else if (module.settings.fullTextSearch === 'exact' && module.exactSearch(searchTerm, text)) {
                        results.push(this);
                        return true;
                    } else if (module.settings.fullTextSearch === true && module.fuzzySearch(searchTerm, text)) {
                        results.push(this);
                        return true;
                    }
                }
                if (module.settings.match == 'both' || module.settings.match == 'value') {
                    value = String(module.get_choiceValue($choice, text));
                    if (value.search(beginsWithRegExp) !== -1) {
                        results.push(this);
                        return true;
                    } else if (module.settings.fullTextSearch === 'exact' && module.exactSearch(searchTerm, value)) {
                        results.push(this);
                        return true;
                    } else if (module.settings.fullTextSearch === true && module.fuzzySearch(searchTerm, value)) {
                        results.push(this);
                        return true;
                    }
                }
            });
        }
        this.debug('Showing only matched items', searchTerm);
        this.remove_filteredItem();
        if(results) {
            this.$item
                .not(results)
                .addClass(this.settings.className.filtered)
            ;
        }

        if (!this.has_query()) {
            this.$divider.removeClass(this.settings.className.hidden);
        } else if(this.settings.hideDividers === true) {
            this.$divider.addClass(this.settings.className.hidden);
        } else if (this.settings.hideDividers === 'empty') {
            this.$divider
                .removeClass(this.settings.className.hidden)
                .filter(function() {
                    // First find the last divider in this divider group
                    // Dividers which are direct siblings are considered a group
                    var lastDivider = $(this).nextUntil(module.settings.selector.item);

                    return (lastDivider.length ? lastDivider : $(this))
                    // Count all non-filtered items until the next divider (or end of the dropdown)
                        .nextUntil(module.settings.selector.divider)
                        .filter(module.settings.selector.item + ":not(." + module.settings.className.filtered + ")")
                        // Hide divider if no items are found
                        .length === 0;
                })
                .addClass(module.settings.className.hidden)
            ;
        }
    }

    save_defaults() {
        this.save_defaultText();
        this.save_placeholderText();
        this.save_defaultValue();
    }

    save_defaultText() {
        var text = this.get_text();
        this.verbose('Saving default text as', text);
        this.$element.data(this.settings.metadata.defaultText, text);
    }

    save_defaultValue() {
        var value = this.get_value();
        this.verbose('Saving default value as', value);
        this.$element.data(this.settings.metadata.defaultValue, value);
    }

    save_placeholderText() {
        if (this.settings.placeholder !== false && this.$text.hasClass(this.settings.className.placeholder)) {
            var text = this.get_text();
            this.verbose('Saving placeholder text as', text);
            this.$element.data(this.settings.metadata.placeholderText, text);
        }
    }

    restore_selected() {
        this.clear();
        this.restore_defaultText();
        this.restore_defaultValue();
    }

    restore_defaultText() {
        var
            defaultText     = this.get_defaultText(),
            placeholderText = this.get_placeholderText()
        ;
        if (defaultText === placeholderText) {
            this.debug('Restoring default placeholder text', defaultText);
            this.set_placeholderText(defaultText);
        }
        else {
            this.debug('Restoring default text', defaultText);
            this.set_text(defaultText);
        }
    }

    restore_defaultValue() {
        var
            defaultValue = this.get_defaultValue()
        ;
        if (defaultValue !== undefined) {
            this.debug('Restoring default value', defaultValue);
            if (defaultValue !== '') {
                this.set_value(defaultValue);
                this.set_selected();
            } else {
                this.remove_activeItem();
                this.remove_selectedItem();
            }
        }
    }

    clear() {
        if (this.is_multiple() && this.settings.useLabels) {
            this.remove_labels();
        } else {
            this.remove_activeItem();
            this.remove_selectedItem();
            this.remove_filteredItem();
        }
        this.set_placeholderText();
        this.clearValue();
    }

    clearValue() {
        this.set_value('');
    }

    filterActive() {
        if (this.settings.useLabels) {
            this.$item.filter('.' + this.settings.className.active).addClass(this.settings.className.filtered);
        }
    }

    select_firstUnfiltered() {
        this.verbose('Selecting first non-filtered element');
        this.remove_selectedItem();
        this.$item
            .not(this.settings.selector.unselectable)
            .not(this.settings.selector.addition + this.settings.selector.hidden)
                .eq(0)
                .addClass(this.settings.className.selected)
        ;
    }

    select_nextAvailable($selected) {
        $selected = $selected.eq(0);
        var
            $nextAvailable = $selected.nextAll(this.settings.selector.item).not(this.settings.selector.unselectable).eq(0),
            $prevAvailable = $selected.prevAll(this.settings.selector.item).not(this.settings.selector.unselectable).eq(0),
            hasNext        = ($nextAvailable.length > 0)
        ;
        if (hasNext) {
            this.verbose('Moving selection to', $nextAvailable);
            $nextAvailable.addClass(this.settings.className.selected);
        }
        else {
            this.verbose('Moving selection to', $prevAvailable);
            $prevAvailable.addClass(this.settings.className.selected);
        }
    }

    remove_active() {
        this.$element.removeClass(this.settings.className.active);
    }

    remove_activeItem() {
        this.$item.removeClass(this.settings.className.active);
    }

    remove_activeLabel() {
        this.$element.find(this.settings.selector.label).removeClass(this.settings.className.active);
    }

    remove_empty() {
        this.$element.removeClass(this.settings.className.empty);
    }

    remove_filteredItem() {
        if (this.settings.useLabels && this.has_maxSelections()) {
            return;
        }
        if (this.settings.useLabels && this.is_multiple()) {
            this.$item.not('.' + this.settings.className.active).removeClass(this.settings.className.filtered);
        } else {
            this.$item.removeClass(this.settings.className.filtered);
        }
        if (this.settings.hideDividers) {
            this.$divider.removeClass(this.settings.className.hidden);
        }
        this.remove_empty();
    }

    remove_labels($labels) {
        $labels = $labels || this.$element.find(this.settings.selector.label);
        this.verbose('Removing labels', $labels);
        var module = this;
        $labels.each(function() {
            var
                $label      = $(this),
                value       = $label.data(module.settings.metadata.value),
                stringValue = (value !== undefined) ? String(value) : value,
                isUserValue = module.is_userValue(stringValue)
            ;
            //if (this.settings.onLabelRemove.call($label, value) === false) {
            if (module.invokeCallback('labelremove')($label, value) === false) {
                module.debug('Label remove callback cancelled removal');
                return;
            }
            module.remove_message();
            if (isUserValue) {
                module.remove_value(stringValue);
                module.remove_label(stringValue);
            } else {
                // selected will also remove label
                module.remove_selected(stringValue);
            }
        });
    }

    remove_message() {
        this.$menu.children(this.settings.selector.message).remove();
    }

    remove_searchTerm() {
        this.verbose('Cleared search term');
        this.$search.val('');
        this.set_filtered();
    }

    remove_searchWidth() {
        this.$search.css('width', '');
    }

    remove_selected(value, $selectedItem) {
        $selectedItem = (this.settings.allowAdditions)
            ? $selectedItem || this.get_itemWithAdditions(value)
            : $selectedItem || this.get_item(value)
        ;

        if (!$selectedItem) {
            return false;
        }

        var module = this;

        $selectedItem.each(function() {
            var
                $selected     = $(this),
                selectedText  = module.get_choiceText($selected),
                selectedValue = module.get_choiceValue($selected, selectedText)
            ;
            if (module.is_multiple()) {
                if (module.settings.useLabels) {
                    module.remove_value(selectedValue, selectedText, $selected);
                    module.remove_label(selectedValue);
                } else {
                    module.remove_value(selectedValue, selectedText, $selected);
                    if (module.get_selectionCount() === 0) {
                        module.set_placeholderText();
                    } else {
                        module.set_text(module.add_variables(module.settings.message.count));
                    }
                }
            } else {
                module.remove_value(selectedValue, selectedText, $selected);
            }
            $selected
                .removeClass(module.settings.className.filtered)
                .removeClass(module.settings.className.active)
            ;
            if (module.settings.useLabels) {
                $selected.removeClass(module.settings.className.selected);
            }
        });
    }

    remove_selectedItem() {
        this.$item.removeClass(this.settings.className.selected);
    }

    remove_upward($currentMenu) {
        var $element = $currentMenu || this.$element;
        $element.removeClass(this.settings.className.upward);
    }

    remove_visible() {
        this.$element.removeClass(this.settings.className.visible);
    }

    get_activeItem() {
        return this.$item.filter('.'  +this.settings.className.active);
    }

    get_choiceText($choice, preserveHTML) {
        preserveHTML = (preserveHTML !== undefined)
            ? preserveHTML
            : this.settings.preserveHTML
        ;
        if ($choice) {
            if ($choice.find(this.settings.selector.menu).length > 0) {
                this.verbose('Retrieving text of element with sub-menu');
                $choice = $choice.clone();
                $choice.find(this.settings.selector.menu).remove();
                $choice.find(this.settings.selector.menuIcon).remove();
            }
            return ($choice.data(this.settings.metadata.text) !== undefined)
                ? $choice.data(this.settings.metadata.text)
                : (preserveHTML)
                    /*? $.trim($choice.html())
                    : $.trim($choice.text())*/
                    ? $choice.html().trim()
                    : $choice.text().trim()
            ;
        }
    }

    get_choiceValue($choice, choiceText) {
        choiceText = choiceText || this.get_choiceText($choice);
        if (!$choice) {
            return false;
        }
        return ($choice.data(this.settings.metadata.value) !== undefined)
            ? String($choice.data(this.settings.metadata.value))
            : (typeof choiceText === 'string')
                ? choiceText.toLowerCase().trim
                : String(choiceText)
        ;
    }

    get_defaultText() {
        return this.$element.data(this.settings.metadata.defaultText);
    }

    get_defaultValue() {
        return this.$element.data(this.settings.metadata.defaultValue);
    }

    get_item(value, strict) {
        var
            $selectedItem = false,
            shouldSearch,
            isMultiple,
            module = this
        ;
        value = (value !== undefined)
            ? value
            : (this.get_values() !== undefined)
                ? this.get_values()
                : this.get_text()
        ;
        shouldSearch = (isMultiple)
            ? (value.length > 0)
            : (value !== undefined && value !== null)
        ;
        isMultiple = (this.is_multiple() && Array.isArray(value)); // INVESTIGATE: THIS SHOULD BE ABOVE
        strict = (value === '' || value === 0)
            ? true
            : strict || false
        ;
        if (shouldSearch) {
            this.$item.each(function() {
                var
                    $choice       = $(this),
                    optionText    = module.get_choiceText($choice),
                    optionValue   = module.get_choiceValue($choice, optionText)
                ;
                // safe early exit
                if(optionValue === null || optionValue === undefined) {
                    return;
                }
                if (isMultiple) {
                    if($.inArray( String(optionValue), value) !== -1) {
                        $selectedItem = ($selectedItem) ? $selectedItem.add($choice) : $choice;
                    }
                } else if(strict) {
                    module.verbose('Ambiguous dropdown value using strict type check', $choice, value);
                    if (optionValue === value) {
                        $selectedItem = $choice;
                        return true;
                    }
                } else {
                    if( String(optionValue) == String(value)) {
                        module.verbose('Found select item by value', optionValue, value);
                        $selectedItem = $choice;
                        return true;
                    }
                }
            });
        }
        return $selectedItem;
    }

    get_itemWithAdditions(value) {
        var
            $items       = this.get_item(value),
            $userItems   = module.create.userChoice(value),
            hasUserItems = ($userItems && $userItems.length > 0)
        ;
        if(hasUserItems) {
            $items = ($items.length > 0)
            ? $items.add($userItems)
            : $userItems
            ;
        }
        return $items;
    }

    get_placeholderText() {
        if (this.settings.placeholder != 'auto' && typeof this.settings.placeholder == 'string') {
            return this.settings.placeholder;
        }
        return this.$element.data(this.settings.metadata.placeholderText) || '';
    }

    get_query() {
        return this.$search.val().trim();
    }

    get_searchWidth(value) {
        value = (value !== undefined) ? value : this.$search.val();
        this.$sizer.text(value);
        // prevent rounding issues
        return Math.ceil(this.$sizer.width() + 1);
    }

    get_selectionCount() {
        var
            values = this.get_values(),
            count
        ;
        count = (this.is_multiple())
            ? Array.isArray(values)
            ? values.length
            : 0
            : (this.get_value() !== '')
            ? 1
            : 0
        ;
        return count;
    }

    get_selectedItem() {
        var $selectedItem = this.$item.not(this.settings.selector.unselectable).filter('.'  + this.settings.className.selected);
        return ($selectedItem.length > 0) ? $selectedItem : this.$item.eq(0);
    }

    get_text() {
        return this.$text.text();
    }

    get_transition($subMenu) {
        return (this.settings.transition == 'auto')
            ? this.is_upward($subMenu)
                ? 'slide up'
                : 'slide down'
            : this.settings.transition
        ;
    }

    get_uniqueArray(array) {
        return array.filter(function (value, index) {
            return array.indexOf(value) === index;
        });
    }

    get_value() {
        var
            value = (this.$input.length > 0)
                ? this.$input.val()
                : this.$element.data(this.settings.metadata.value),
            isEmptyMultiselect = (Array.isArray(value) && value.length === 1 && value[0] === '')
        ;
        // prevents placeholder element from being selected when multiple
        return (value === undefined || isEmptyMultiselect) ? '' : value;
    }

    get_values() {
        var value = this.get_value();
        if (value === '') {
            return '';
        }
        return (!this.has_selectInput() && this.is_multiple() )
            ? (typeof value == 'string') // delimited string
            ? value.split(this.settings.delimiter)
            : ''
            : value
        ;
    }

    set_active() {
        this.$element.addClass(this.settings.className.active);
    }

    set_activeItem($item) {
        if (this.settings.allowAdditions && $item.filter(this.settings.selector.addition).length > 0) {
            $item.addClass(this.settings.className.filtered);
          } else {
            $item.addClass(this.settings.className.active);
          }
    }

    set_direction($menu) {
        if (this.settings.direction == 'auto') {
            // reset position, remove upward if it's base menu
            if (!$menu) {
                this.remove_upward();
            } else if (this.is_upward($menu)) {
                //we need make sure when make assertion openDownward for $menu, $menu does not have upward class
                this.remove_upward($menu);
            }

            if (this.can_openDownward($menu)) {
                this.remove_upward($menu);
            } else {
                this.set_upward($menu);
            }
            if (!this.is_leftward($menu) && !this.can_openRightward($menu)) {
                 module.set.leftward($menu);
            }
        } else if(this.settings.direction == 'upward') {
            this.set_upward($menu);
        }
    }

    set_filtered() {
        var
            isMultiple       = this.is_multiple(),
            isSearch         = this.is_searchSelection(),
            isSearchMultiple = (isMultiple && isSearch),
            searchValue      = (isSearch) ? this.get_query() : '',
            hasSearchValue   = (typeof searchValue === 'string' && searchValue.length > 0),
            searchWidth      = this.get_searchWidth(),
            valueIsSet       = searchValue !== ''
        ;
        if (isMultiple && hasSearchValue) {
            this.verbose('Adjusting input width', searchWidth, this.settings.glyphWidth);
            this.$search.css('width', searchWidth);
        }
        if (hasSearchValue || (isSearchMultiple && valueIsSet)) {
            this.verbose('Hiding placeholder text');
            this.$text.addClass(this.settings.className.filtered);
        } else if(!isMultiple || (isSearchMultiple && !valueIsSet)) {
            this.verbose('Showing placeholder text');
            this.$text.removeClass(this.settings.className.filtered);
        }
    }

    set_placeholderText(text) {
        text = text || this.get_placeholderText();
        this.debug('Setting placeholder text', text);
        this.set_text(text);
        this.$text.addClass(this.settings.className.placeholder);
    }

    set_scrollPosition($item, forceScroll) {
        var
            edgeTolerance = 5,
            $menu,
            hasActive,
            offset,
            itemHeight,
            itemOffset,
            menuOffset,
            menuScroll,
            menuHeight,
            abovePage,
            belowPage
        ;

        $item       = $item || this.get_selectedItem();
        $menu       = $item.closest(this.settings.selector.menu);
        hasActive   = ($item && $item.length > 0);
        forceScroll = (forceScroll !== undefined) ? forceScroll : false;
        if ($item && $menu.length > 0 && hasActive) {
            itemOffset = $item.position().top;

            $menu.addClass(this.settings.className.loading);
            // menuScroll = $menu.scrollTop(); INVESTIGATE
            menuScroll = $menu.scrollY;
            menuOffset = $menu.offset().top;
            itemOffset = $item.offset().top;
            offset     = menuScroll - menuOffset + itemOffset;
            if(!forceScroll) {
                menuHeight = $menu.height();
                belowPage  = menuScroll + menuHeight < (offset + edgeTolerance);
                abovePage  = ((offset - edgeTolerance) < menuScroll);
            }
            this.debug('Scrolling to active item', offset);
            if(forceScroll || abovePage || belowPage) {
                //$menu.scrollTop(offset); INVESTIGATE
                $menu.scrollY = offset;
            }
            $menu.removeClass(this.settings.className.loading);
        }
    }

    set_selected(value, $selectedItem) {
        var
            isMultiple = this.is_multiple(),
            module = this
        ;
        $selectedItem = (this.settings.allowAdditions)
            ? $selectedItem || this.get_itemWithAdditions(value)
            : $selectedItem || this.get_item(value)
        ;
        if(!$selectedItem) {
            return;
        }
        this.debug('Setting selected menu item to', $selectedItem);
        if (this.is_multiple()) {
            this.remove_searchWidth();
        }
        if (this.is_single()) {
            this.remove_activeItem();
            this.remove_selectedItem();
        } else if(this.settings.useLabels) {
            this.remove_selectedItem();
        }
        // select each item
        $selectedItem.each(function() {
            var
                $selected      = $(this),
                selectedText   = module.get_choiceText($selected),
                selectedValue  = module.get_choiceValue($selected, selectedText),

                isFiltered     = $selected.hasClass(module.settings.className.filtered),
                isActive       = $selected.hasClass(module.settings.className.active),
                isUserValue    = $selected.hasClass(module.settings.className.addition),
                shouldAnimate  = (isMultiple && $selectedItem.length == 1)
            ;
            if (isMultiple) {
                if (!isActive || isUserValue) {
                    if (module.settings.apiSettings && this.settings.saveRemoteData) {
                        module.save_remoteData(selectedText, selectedValue);
                    }
                    if (module.settings.useLabels) {
                        module.add_label(selectedValue, selectedText, shouldAnimate);
                        module.add_value(selectedValue, selectedText, $selected);
                        module.set_activeItem($selected);
                        module.filterActive();
                        module.select_nextAvailable($selectedItem);
                    } else {
                        module.add_value(selectedValue, selectedText, $selected);
                        module.set_text(module.add_variables(message.count));
                        module.set_activeItem($selected);
                    }
                } else if (!isFiltered) {
                    module.debug('Selected active value, removing label');
                    module.remove_selected(selectedValue);
                }
            } else {
                if (module.settings.apiSettings && module.settings.saveRemoteData) {
                    module.save_remoteData(selectedText, selectedValue);
                }
                module.set_text(selectedText);
                module.set_value(selectedValue, selectedText, $selected);
                $selected
                    .addClass(module.settings.className.active)
                    .addClass(module.settings.className.selected)
                ;
            }
        });
    }

    set_selectedLetter(letter) {
        var
            $selectedItem         = this.$item.filter('.' + this.settings.className.selected),
            alreadySelectedLetter = $selectedItem.length > 0 && this.has_firstLetter($selectedItem, letter),
            $nextValue            = false,
            $nextItem,
            module = this
        ;
        // check next of same letter
        if (alreadySelectedLetter) {
            $nextItem = $selectedItem.nextAll(this.$item).eq(0);
            if (this.has_firstLetter($nextItem, letter)) {
                $nextValue  = $nextItem;
            }
        }
        // check all values
        if (!$nextValue) {
            this.$item.each(function(){
                if (module.has_firstLetter($(this), letter)) {
                    $nextValue = $(this);
                    return false;
                }
            });
        }
        // set next value
        if($nextValue) {
            this.verbose('Scrolling to next value with letter', letter);
            this.set_scrollPosition($nextValue);
            $selectedItem.removeClass(this.settings.className.selected);
            $nextValue.addClass(this.settings.className.selected);
            if (this.settings.selectOnKeydown && this.is_single()) {
                this.set_selectedItem($nextValue);
            }
        }
    }

    set_tabbable() {
        if (this.is_searchSelection()) {
            this.debug('Added tabindex to searchable dropdown');
            this.$search.val('').attr('tabindex', 0);
            this.$menu.attr('tabindex', -1);
        } else {
            this.debug('Added tabindex to dropdown');
            if (this.$element.attr('tabindex') === undefined) {
                this.$element.attr('tabindex', 0);
                this.$menu.attr('tabindex', -1);
            }
        }
    }

    set_text(text) {
        if (this.settings.action === 'combo') {
            this.debug('Changing combo button text', text, this.$combo);
            if (this.settings.preserveHTML) {
                this.$combo.html(text);
            } else {
                this.$combo.text(text);
            }
        } else if (this.settings.action === 'activate') {
            if (text !== this.get_placeholderText()) {
              this.$text.removeClass(this.settings.className.placeholder);
            }
            this.debug('Changing text', text, this.$text);
            this.$text.removeClass(this.settings.className.filtered);
            if (this.settings.preserveHTML) {
                this.$text.html(text);
            }
            else {
                this.$text.text(text);
            }
        }
    }

    set_value(value, text, $selected) {
        if (value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            this.$input.removeClass(this.settings.className.noselection);
        } else {
            this.$input.addClass(this.settings.className.noselection);
        }
        var
            escapedValue = this.escape_value(value),
            hasInput     = (this.$input.length > 0),
            currentValue = this.get_values(),
            stringValue  = (value !== undefined)
                ? String(value)
                : value,
            newValue
        ;
        if (hasInput) {
            if (!this.settings.allowReselection && stringValue == currentValue) {
                this.verbose('Skipping value update already same value', value, currentValue);
                if (!this.initialLoad) {
                    return;
                }
            }

            if (this.is_single() && this.has_selectInput() && this.can_extendSelect() ) {
                this.debug('Adding user option', value);
                this.add_optionValue(value);
            }
            this.debug('Updating input value', escapedValue, currentValue);
            this.internalChange = true;
            this.$input.val(escapedValue);
            if (this.settings.fireOnInit === false && this.initialLoad) {
                this.debug('Input native change event ignored on initial load');
            } else {
                this.trigger_change();
            }
            this.internalChange = false;
        } else {
            this.verbose('Storing value in metadata', escapedValue, this.$input);
            if(escapedValue !== currentValue) {
                this.$element.data(this.settings.metadata.value, stringValue);
            }
        }
        if (this.settings.fireOnInit === false && this.initialLoad) {
            this.verbose('No callback on initial load', this.settings.onChange);
        } else {
            this.invokeCallback('change')(this.element, value, text, $selected);
        }
    }

    set_visible() {
        this.$element.addClass(this.settings.className.visible);
    }

    action_nothing(element, text, value, thus) {
        
    }

    action_activate(text, value, element) {
        value = (value !== undefined) ? value : text;
        if (this.can_activate($(element))) {
            this.set_selected(value, $(element));
            if(!this.is_multiple()) {
                this.hideAndClear();
            }
        }
    }

    trigger_change() {
        // TODO
    }

    is_active() {
        return this.$element.hasClass(this.settings.className.active);
    }

    is_allFiltered() {
        return ((this.is_multiple() || this.has_search()) && !(this.settings.hideAdditions == false && this.has_userSuggestion()) && !this.has_message() && this.has_allResultsFiltered() );
    }

    is_alreadySetup() {
        return (this.$element.is('select') && this.$element.parent(this.settings.selector.dropdown).data(this.moduleNamespace) !== undefined && this.$element.prev().length === 0);
    }

    is_animating($subMenu) {
        // TODO
        /*return ($subMenu)
            ? $subMenu.transition && $subMenu.transition('is animating')
            : $menu.transition    && $menu.transition('is animating')
        ;*/
        return false;
    }

    is_animatingOutward() {
        // TODO
        // TODOreturn $menu.transition('is outward');
        return false
    }

    is_bubbledIconClick(event) {
        return $(event.target).closest(this.$icon).length > 0;
    }

    is_bubbledLabelClick(event) {
        return $(event.target).is('select, input') && this.$element.closest('label').length > 0;
    }

    is_clearable() {
        return (this.$element.hasClass(this.settings.className.clearable) || this.settings.clearable);
    }

    is_disabled() {
        return this.$element.hasClass(this.settings.className.disabled);
    }

    is_focusedOnSearch() {
        return (document.activeElement === this.$search[0]);
    }

    is_hidden($subMenu) {
        return !this.is_visible($subMenu);
    }

    is_horizontallyScrollableContext() {
        var overflowX = (this.$context.get(0) !== window) ? this.$context.css('overflow-X') : false;
        return (overflowX == 'auto' || overflowX == 'scroll');
    }

    is_inObject(needle, object) {
        var found = false;
        $.each(object, function(index, property) {
            if (property == needle) {
                found = true;
                return true;
            }
        });
        return found;
    }

    is_leftward($subMenu) {
        var $selectedMenu = $subMenu || this.$menu;
        return $selectedMenu.hasClass(this.settings.className.leftward);
    }

    is_multiple() {
        return this.$element.hasClass(this.settings.className.multiple);
    }

    is_remote() {
        return this.settings.apiSettings && this.can_useAPI();
    }

    is_search() {
        return this.$element.hasClass(this.settings.className.search);
    }

    is_searchSelection() {
        return (this.has_search() && this.$search.parent(this.settings.selector.dropdown).length === 1);
    }

    is_selection() {
        return this.$element.hasClass(this.settings.className.selection);
    }

    is_single() {
        return !this.is_multiple();
    }

    is_upward($menu) {
        var $element = $menu || this.$element;
        return $element.hasClass(this.settings.className.upward);
    }

    is_verticallyScrollableContext() {
        var overflowY = (this.$context.get(0) !== window) ? this.$context.css('overflow-y') : false;
        return (overflowY == 'auto' || overflowY == 'scroll');
    }

    is_visible($subMenu) {
        return ($subMenu)
              ? $subMenu.hasClass(this.settings.className.visible)
              : this.$menu.hasClass(this.settings.className.visible)
        ;
    }

    has_allResultsFiltered() {
        var $normalResults = this.$item.not(this.settings.selector.addition);
        return ($normalResults.filter(this.settings.selector.unselectable).length === $normalResults.length);
    }

    has_clearItem() {
        return (this.$clear.length > 0);
    }

    has_firstLetter($item, letter) {
        var
            text,
            firstLetter
        ;
        if (!$item || $item.length === 0 || typeof letter !== 'string') {
            return false;
        }
        text        = this.get_choiceText($item, false);
        letter      = letter.toLowerCase();
        firstLetter = String(text).charAt(0).toLowerCase();
        return (letter == firstLetter);
    }

    has_items() {
        return (this.$item.length > 0);
    }

    has_label(value) {
        var
            escapedValue = this.escape_value(value),
            $labels      = this.$element.find(this.settings.selector.label)
        ;
        if (this.settings.ignoreCase) {
            escapedValue = escapedValue.toLowerCase();
        }
        return ($labels.filter('[data-' + this.settings.metadata.value + '="' + this.escape_string(escapedValue) +'"]').length > 0);
    }

    has_maxSelections() {
        return (this.settings.maxSelections && this.get_selectionCount() >= this.settings.maxSelections);
    }

    has_menu() {
        return (this.$menu.length > 0);
    }

    has_menuSearch() {
        return (this.has_search() && this.$search.closest(this.$menu).length > 0);
    }

    has_message() {
        return (this.$menu.children(this.settings.selector.message).length !== 0);
    }

    has_minCharacters(searchTerm) {
        if (this.settings.minCharacters) {
            searchTerm = (searchTerm !== undefined) ? String(searchTerm) : String(this.get_query());
            return (searchTerm.length >= this.settings.minCharacters);
        }
        return true;
    }

    has_query() {
        return (this.get_query() !== '');
    }

    has_search() {
        return (this.$search.length > 0);
    }

    has_selectInput() {
        return (this.$input.is('select'));
    }

    has_sizer() {
        return (this.$sizer.length > 0);
    }

    has_userSuggestion() {
        return (this.$menu.children(this.settings.selector.addition).length > 0);
    }

    has_value(value) {
        return (this.settings.ignoreCase) ? this.has_valueIgnoringCase(value) : this.has_valueMatchingCase(value);
    }

    has_valueIgnoringCase(value) {
        var
            values   = this.get_values(),
            hasValue = false
        ;
        if (!Array.isArray(values)) {
            values = [values];
        }
        $.each(values, function(index, existingValue) {
            if(String(value).toLowerCase() == String(existingValue).toLowerCase()) {
                hasValue = true;
                return false;
            }
        });
        return hasValue;
    }

    has_valueMatchingCase(value) {
        var
            values   = this.get_values(),
            hasValue = Array.isArray(values) ? values && (values.indexOf(value) !== -1) : (values == value)
        ;
        return (hasValue) ? true : false;
    }

    can_activate($item) {
        if (this.settings.useLabels) {
            return true;
        }
        if (!this.has_maxSelections()) {
            return true;
        }
        if (this.has_maxSelections() && $item.hasClass(this.settings.className.active)) {
            return true;
        }
        return false;
    }

    can_click() {
        return (this.hasTouch || this.settings.on == 'click');
    }

    can_extendSelect() {
        return this.settings.allowAdditions || this.settings.apiSettings;
    }
    
    can_openDownward($subMenu) {
        var
            $currentMenu    = $subMenu || this.$menu,
            canOpenDownward = true,
            onScreen        = {},
            calculations
        ;
        $currentMenu.addClass(this.settings.className.loading);
        calculations = {
            context: {
                offset    : (this.$context.get(0) === window)
                    ? { top: 0, left: 0}
                    : this.$context.offset(),
                //scrollTop : this.$context.scrollTop(), INVESTIGATE
                scrollTop : this.$context.scrollY,
                height    : this.$context.outerHeight()
            },
            menu : {
                offset: $currentMenu.offset(),
                height: $currentMenu.outerHeight()
            }
        };
        if (this.is_verticallyScrollableContext()) {
            calculations.menu.offset.top += calculations.context.scrollTop;
        }
        onScreen = {
            above : (calculations.context.scrollTop) <= calculations.menu.offset.top - calculations.context.offset.top - calculations.menu.height,
            below : (calculations.context.scrollTop + calculations.context.height) >= calculations.menu.offset.top - calculations.context.offset.top + calculations.menu.height
        };
        if (onScreen.below) {
            this.verbose('Dropdown can fit in context downward', onScreen);
            canOpenDownward = true;
        } else if (!onScreen.below && !onScreen.above) {
            this.verbose('Dropdown cannot fit in either direction, favoring downward', onScreen);
            canOpenDownward = true;
        } else {
            this.verbose('Dropdown cannot fit below, opening upward', onScreen);
            canOpenDownward = false;
        }
        $currentMenu.removeClass(this.settings.className.loading);
        return canOpenDownward;
    }

    can_openRightward($subMenu) {
        var
            $currentMenu     = $subMenu || this.$menu,
            canOpenRightward = true,
            isOffscreenRight = false,
            calculations
        ;
        $currentMenu.addClass(this.settings.className.loading);
        calculations = {
            context: {
                offset     : (this.$context.get(0) === window)
                    ? { top: 0, left: 0}
                    : this.$context.offset(),
                // scrollLeft : this.$context.scrollLeft(), INVESTIGATE
                scrollLeft : this.$context.scrollX,
                width      : this.$context.outerWidth()
            },
            menu: {
                offset : $currentMenu.offset(),
                width  : $currentMenu.outerWidth()
            }
        };
        if (this.is_horizontallyScrollableContext()) {
            calculations.menu.offset.left += calculations.context.scrollLeft;
        }
        isOffscreenRight = (calculations.menu.offset.left - calculations.context.offset.left + calculations.menu.width >= calculations.context.scrollLeft + calculations.context.width);
        if (isOffscreenRight) {
            modthisule.verbose('Dropdown cannot fit in context rightward', isOffscreenRight);
            canOpenRightward = false;
        }
        $currentMenu.removeClass(this.settings.className.loading);
        return canOpenRightward;
    }

    can_show() {
        return !this.is_disabled() && (this.has_items() || this.has_message());
    }

    can_useAPI() {
        // TODO
        //return $.fn.api !== undefined;
        return true;
    }

    add_label(value, text, shouldAnimate) {
        var
            $next  = this.is_searchSelection() ? this.$search : this.$text,
            escapedValue = this.escape_value(value),
            $label
        ;
        if (this.settings.ignoreCase) {
            escapedValue = escapedValue.toLowerCase();
        }
        $label =  $('<a />')
            .addClass(this.settings.className.label)
            .attr('data-' + this.settings.metadata.value, escapedValue)
            .html(this.settings.templates.label(escapedValue, text, this.settings.preserveHTML))
        ;
        //$label = this.settings.onLabelCreate.call($label, escapedValue, text); // TODO

        if (this.has_label(value)) {
            this.debug('User selection already exists, skipping', escapedValue);
            return;
        }
        if (this.settings.label.variation) {
            $label.addClass(this.settings.label.variation);
        }
        if (shouldAnimate === true) {
            this.debug('Animating in label', $label);

            $label
            .addClass(this.settings.className.hidden)
            .insertBefore($next)

            var labelTransition = new Transition($label, {
                animation: this.settings.label.transition,
                duration: this.settings.label.duration
            })
        } else {
            this.debug('Adding selection label', $label);
            $label.insertBefore($next);
        }
    }

    add_optionValue() {
        /* TODO */
        var
              escapedValue = module.escape.value(value),
              $option      = $input.find('option[value="' + module.escape.string(escapedValue) + '"]'),
              hasOption    = ($option.length > 0)
            ;
            if(hasOption) {
              return;
            }
            // temporarily disconnect observer
            module.disconnect.selectObserver();
            if( module.is.single() ) {
              module.verbose('Removing previous user addition');
              $input.find('option.' + className.addition).remove();
            }
            $('<option/>')
              .prop('value', escapedValue)
              .addClass(className.addition)
              .html(value)
              .appendTo($input)
            ;
            module.verbose('Adding user addition as an <option>', value);
            module.observe.select();
    }

    add_value(addedValue, addedText, $selectedItem) {
        var
            currentValue = this.get_values(),
            newValue
        ;
        if (this.has_value(addedValue)) {
            this.debug('Value already selected');
            return;
        }
        if (addedValue === '') {
            this.debug('Cannot select blank values from multiselect');
            return;
        }
        // extend current array
        if(Array.isArray(currentValue)) {
            newValue = currentValue.concat([addedValue]);
            newValue = this.get_uniqueArray(newValue);
        } else {
            newValue = [addedValue];
        }
        // add values
        if ( this.has_selectInput()) {
            if (this.can_extendSelect()) {
                this.debug('Adding value to select', addedValue, newValue, this.$input);
                this.add_optionValue(addedValue);
            }
        } else {
            newValue = newValue.join(this.settings.delimiter);
            this.debug('Setting hidden input to delimited value', newValue, this.$input);
        }

        if (this.settings.fireOnInit === false && this.initialLoad) {
            this.verbose('Skipping onadd callback on initial load', this.settings.onAdd);
        } else {
            this.invokeCallback('add')(this.element, addedValue, addedText, $selectedItem);
        }
        this.set_value(newValue, addedValue, addedText, $selectedItem);
        this.check_maxSelections();
    }

    check_maxSelections(selectionCount) {
        if (this.settings.maxSelections) {
            selectionCount = (selectionCount !== undefined) ? selectionCount : this.get_selectionCount();
            if (selectionCount >= this.settings.maxSelections) {
                this.debug('Maximum selection count reached');
                if (this.settings.useLabels) {
                    this.$item.addClass(this.settings.className.filtered);
                    this.add_message(this.settings.message.maxSelections);
                }
                return true;
            } else {
                this.verbose('No longer at maximum selection count');
                this.remove_message();
                this.remove_filteredItem();
                if (this.is_searchSelection()) {
                    this.filterItems();
                }
                return false;
            }
        }
        return true;
    }

    escape_string(text) {
        text =  String(text);
        return text.replace(this.settings.regExp.escape, '\\$&');
    }

    escape_value(value) {
        var
            multipleValues = Array.isArray(value),
            stringValue    = (typeof value === 'string'),
            isUnparsable   = (!stringValue && !multipleValues),
            hasQuotes      = (stringValue && value.search(this.settings.regExp.quote) !== -1),
            values         = [],
            module         = this
        ;
        if (isUnparsable || !hasQuotes) {
            return value;
        }
        this.debug('Encoding quote values for use in select', value);
        if (multipleValues) {
            $.each(value, function(index, value){
                values.push(value.replace(module.settings.regExp.quote, '&quot;'));
            });
            return values;
        }
        return value.replace(this.settings.regExp.quote, '&quot;');
    }

    eventOnElement(event, callback) {
        var
            $target      = $(event.target),
            $label       = $target.closest(this.settings.selector.siblingLabel),
            inVisibleDOM = document.body.contains(event.target),
            //notOnLabel   = (this.$element.find($label).length === 0), INVESTIGATE
            notOnLabel   = ($label.length === 0),
            notInMenu    = ($target.closest(this.$menu).length === 0)
        ;
        callback = $.isFunction(callback)
            ? callback
            : function(){}
        ;
        if (inVisibleDOM && notOnLabel && notInMenu) {
            this.verbose('Triggering event', callback);
            callback();
            return true;
        } else {
            this.verbose('Event occurred in dropdown menu, canceling callback');
            return false;
        }
    }

    _eventInModule(event, callback) {
        var
            $target    = $(event.target),
            inDocument = ($target.closest(document.documentElement).length > 0),
            inModule   = ($target.closest(this.$element).length > 0)
        ;
        callback = $.isFunction(callback)
            ? callback
            : function(){}
        ;
        if (inDocument && !inModule) {
            this.verbose('Triggering event', callback);
            callback();
            return true;
        } else {
            this.verbose('Event occurred in dropdown, canceling callback');
            return false;
        }
    }

    selectAction(text, value, target) {
        this.verbose('Determining action', this.settings.action);
        if ($.isFunction(this.actions[this.settings.action])) {
            this.verbose('Triggering preset action', this.settings.action, text, value);
            this.actions[this.settings.action].call(this, text, value, target);
        } else if( $.isFunction(this.settings.action) ) {
            this.verbose('Triggering user action', this.settings.action, text, value);
            this.settings.action.call(element, text, value, this);
        } else {
            this.error(this.settings.error.action, this.settings.action);
        }
    }
}
