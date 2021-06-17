"use strict";

import { Module, ModuleOptions } from '../module'

import { Transition } from './transition';

import $, { Cash } from 'cash-dom';

export interface DropdownOptions extends ModuleOptions {
  on: string;
  action: 'nothing' | 'activate' | 'select' | 'combo' | 'hide' | Function;

  values: boolean;

  clearable: boolean;

  apiSettings: boolean;
  selectOnKeydown: boolean;
  minCharacters: number;

  filterRemoteData: boolean;
  saveRemoteData: boolean;

  throttle: number;

  context: Window;
  direction: string;
  keepOnScreen: boolean;

  match: 'both' | 'text' | 'label';
  fullTextSearch: boolean;
  ignoreDiacritics: boolean;
  hideDividers: boolean;

  placeholder: string;
  preserveHTML: boolean;
  sortSelect: boolean;

  forceSelection: boolean;

  allowAdditions: boolean;
  ignoreCase: boolean;
  ignoreSearchCase: boolean;
  hideAdditions: boolean;

  maxSelections: boolean;
  useLabels: boolean;
  delimiter: string;

  showOnFocus: boolean;
  allowReselection: boolean;
  allowTab: boolean;
  allowCategorySelection: boolean;

  fireOnInit: boolean;

  transition: string;
  duration: number;
  displayType: boolean;

  glyphWidth: number;

  headerDivider: boolean;

  label: {
    transition : string;
    duration   : number;
    variation  : boolean;
  }

  delay : {
    hide   : number;
    show   : number;
    search : number;
    touch  : number;
  }

  onChange      : Function;
  onAdd         : Function;
  onRemove      : Function;
  onSearch      : Function;

  onLabelSelect : Function;
  onLabelCreate : Function;
  onLabelRemove : Function;
  onNoResults   : Function;
  onShow        : Function;
  onHide        : Function;

  message: {
    addResult     : string;
    count         : string;
    maxSelections : string;
    noResults     : string;
    serverError   : string;
  }

  error : {
    action          : string;
    alreadySetup    : string;
    labels          : string;
    missingMultiple : string;
    method          : string;
    noAPI           : string;
    noStorage       : string;
    noTransition    : string;
    noNormalize     : string;
  }

  regExp : {
    escape   : RegExp;
    quote    : RegExp;
  }

  metadata : {
    defaultText     : string;
    defaultValue    : string;
    placeholderText : string;
    text            : string;
    value           : string;
  }

  // property names for remote query
  fields: {
    remoteValues         : string;
    values               : string;
    disabled             : string;
    name                 : string;
    description          : string;
    descriptionVertical  : string;
    value                : string;
    text                 : string;
    type                 : string;
    image                : string;
    imageClass           : string;
    icon                 : string;
    iconClass            : string;
    class                : string;
    divider              : string;
  }

  keys : {
    backspace  : number;
    delimiter  : number;
    deleteKey  : number;
    enter      : number;
    escape     : number;
    pageUp     : number;
    pageDown   : number;
    leftArrow  : number;
    upArrow    : number;
    rightArrow : number;
    downArrow  : number;
  }

  selector : {
    addition     : string;
    divider      : string;
    dropdown     : string;
    hidden       : string;
    icon         : string;
    input        : string;
    item         : string;
    label        : string;
    remove       : string;
    siblingLabel : string;
    menu         : string;
    message      : string;
    menuIcon     : string;
    search       : string;
    sizer        : string;
    text         : string;
    unselectable : string;
    clearIcon    : string;
  }

  className : {
    active              : string;
    addition            : string;
    animating           : string;
    description         : string;
    descriptionVertical : string;
    disabled            : string;
    empty               : string;
    dropdown            : string;
    filtered            : string;
    hidden              : string;
    icon                : string;
    image               : string;
    item                : string;
    label               : string;
    loading             : string;
    menu                : string;
    message             : string;
    multiple            : string;
    placeholder         : string;
    sizer               : string;
    search              : string;
    selected            : string;
    selection           : string;
    text                : string;
    upward              : string;
    leftward            : string;
    visible             : string;
    clearable           : string;
    noselection         : string;
    delete              : string;
    header              : string;
    divider             : string;
    groupIcon           : string;
    unfilterable        : string;
  }

  templates: {
    deQuote: Function;
    escape: Function;
    dropdown: Function;
    menu: Function;
    label: Function;
    message: Function;
    addition: Function;
  }

  events: Array<string>;
}

const settings: DropdownOptions = {
  /* Component */
  name           : 'Dropdown',
  namespace      : 'dropdown',
  
  silent      : false,
  debug       : false,
  verbose     : false,
  performance : true,

  on                     : 'click',    // what event should show menu action on item selection
  action                 : 'activate', // action on item selection (nothing, activate, select, combo, hide, function() {})

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
  ignoreDiacritics       : false,      // match results also if they contain diacritics of the same base character (for example searching for "a" will also match "á" or "â" or "à", etc...)
  hideDividers           : false,      // Whether to hide any divider elements (specified in selector.divider) that are sibling to any items when searched (set to true will hide all dividers, set to 'empty' will hide them when they are not followed by a visible item)

  placeholder            : 'auto',     // whether to convert blank <select> values to placeholder text
  preserveHTML           : true,       // preserve html when selecting value
  sortSelect             : false,      // sort selection on init

  forceSelection         : true,       // force a choice on blur with search selection

  allowAdditions         : false,      // whether multiple select should allow user added values
  ignoreCase             : false,      // whether to consider case sensitivity when creating labels
  ignoreSearchCase       : true,       // whether to consider case sensitivity when filtering items
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
  displayType            : false,      // displayType of transition

  glyphWidth             : 1.037,      // widest glyph width in em (W is 1.037 em) used to calculate multiselect input width

  headerDivider          : true,       // whether option headers should have an additional divider line underneath when converted from <select> <optgroup>

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
  onChange      : function(value, text, $selected) {},
  onAdd         : function(value, text, $selected) {},
  onRemove      : function(value, text, $selected) {},
  onSearch      : function(searchTerm) {},

  onLabelSelect : function($selectedLabels) {},
  onLabelCreate : function(value, text) { return $(this); },
  onLabelRemove : function(value) { return true; },
  onNoResults   : function(searchTerm) { return true; },
  onShow        : function() {},
  onHide        : function() {},

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
    noTransition    : 'This module requires ui transitions <https://github.com/Semantic-Org/UI-Transition>',
    noNormalize     : '"ignoreDiacritics" setting will be ignored. Browser does not support String().normalize(). You may consider including <https://cdn.jsdelivr.net/npm/unorm@1.4.1/lib/unorm.min.js> as a polyfill.'
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
    remoteValues         : 'results',  // grouping for api results
    values               : 'values',   // grouping for all dropdown values
    disabled             : 'disabled', // whether value should be disabled
    name                 : 'name',     // displayed dropdown text
    description          : 'description', // displayed dropdown description
    descriptionVertical  : 'descriptionVertical', // whether description should be vertical
    value                : 'value',    // actual dropdown value
    text                 : 'text',     // displayed text when selected
    type                 : 'type',     // type of dropdown element
    image                : 'image',    // optional image path
    imageClass           : 'imageClass', // optional individual class for image
    icon                 : 'icon',     // optional icon name
    iconClass            : 'iconClass', // optional individual class for icon (for example to use flag instead)
    class                : 'class',    // optional individual class for item/header
    divider              : 'divider'   // optional divider append for group headers
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
    sizer        : ':scope > span.sizer',
    text         : ':scope > .text:not(.icon)',
    unselectable : '.disabled, .filtered',
    clearIcon    : ':scope > .remove.icon'
  },

  className : {
    active              : 'active',
    addition            : 'addition',
    animating           : 'animating',
    description         : 'description',
    descriptionVertical : 'vertical',
    disabled            : 'disabled',
    empty               : 'empty',
    dropdown            : 'ui dropdown',
    filtered            : 'filtered',
    hidden              : 'hidden transition',
    icon                : 'icon',
    image               : 'image',
    item                : 'item',
    label               : 'ui label',
    loading             : 'loading',
    menu                : 'menu',
    message             : 'message',
    multiple            : 'multiple',
    placeholder         : 'default',
    sizer               : 'sizer',
    search              : 'search',
    selected            : 'selected',
    selection           : 'selection',
    text                : 'text',
    upward              : 'upward',
    leftward            : 'left',
    visible             : 'visible',
    clearable           : 'clearable',
    noselection         : 'noselection',
    delete              : 'delete',
    header              : 'header',
    divider             : 'divider',
    groupIcon           : '',
    unfilterable        : 'unfilterable'
  },

  /* Templates */
  templates: {
    deQuote: function(string: string, encode: boolean = false) {
      return String(string).replace(/"/g,encode ? "&quot;" : "");
    },
    escape: function(string, preserveHTML) {
      if (preserveHTML) {
        return string;
      }
      let
          badChars     = /[<>"'`]/g,
          shouldEscape = /[&<>"'`]/,
          escape       = {
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
      if (shouldEscape.test(string)) {
        string = string.replace(/&(?![a-z0-9#]{1,6};)/, "&amp;");
        return string.replace(badChars, escapedChar);
      }
      return string;
    },
    // generates dropdown from select values
    dropdown: function(select, fields, preserveHTML, className) {
      let
        placeholder = select.placeholder || false,
        html        = '',
        escape = settings.templates.escape
      ;
      html +=  '<i class="dropdown icon"></i>';
      if (placeholder) {
        html += '<div class="default text">' + escape(placeholder,preserveHTML) + '</div>';
      }
      else {
        html += '<div class="text"></div>';
      }
      html += '<div class="'+className.menu+'">';
      html += settings.templates.menu(select, fields, preserveHTML,className);
      html += '</div>';
      return html;
    },
  
    // generates just menu from select
    menu: function(response, fields, preserveHTML, className) {
      let
        values = response[fields.values] || [],
        html   = '',
        escape = settings.templates.escape,
        deQuote = settings.templates.deQuote
      ;
      $.each(values, function(_index, option) {
        let
          itemType = (option[fields.type])
            ? option[fields.type]
            : 'item',
          isMenu = itemType.indexOf('menu') !== -1
        ;
  
        if (itemType === 'item' || isMenu) {
          let
            maybeText = (option[fields.text])
              ? ' data-text="' + deQuote(option[fields.text],true) + '"'
              : '',
            maybeDisabled = (option[fields.disabled])
              ? className.disabled+' '
              : '',
            maybeDescriptionVertical = (option[fields.descriptionVertical])
              ? className.descriptionVertical+' '
              : '',
            hasDescription = (escape(option[fields.description] || '', preserveHTML) != '')
          ;
          html += '<div class="'+ maybeDisabled + maybeDescriptionVertical + (option[fields.class] ? deQuote(option[fields.class]) : className.item)+'" data-value="' + deQuote(option[fields.value], true) + '"' + maybeText + '>';
          if (isMenu) {
            html += '<i class="'+ (itemType.indexOf('left') !== -1 ? 'left' : '') + ' dropdown icon"></i>';
          }
          if (option[fields.image]) {
            html += '<img class="'+(option[fields.imageClass] ? deQuote(option[fields.imageClass]) : className.image)+'" src="' + deQuote(option[fields.image]) + '">';
          }
          if (option[fields.icon]) {
            html += '<i class="'+deQuote(option[fields.icon])+' '+(option[fields.iconClass] ? deQuote(option[fields.iconClass]) : className.icon)+'"></i>';
          }
          if (hasDescription) {
            html += '<span class="'+ className.description +'">'+ escape(option[fields.description] || '', preserveHTML) + '</span>';
            html += (!isMenu) ? '<span class="'+ className.text + '">' : '';
          }
          if (isMenu) {
            html += '<span class="' + className.text + '">';
          }
          html +=   escape(option[fields.name] || '', preserveHTML);
          if (isMenu) {
            html += '</span>';
            html += '<div class="' + itemType + '">';
            html += settings.templates.menu(option, fields, preserveHTML, className);
            html += '</div>';
          } else if (hasDescription) {
            html += '</span>';
          }
          html += '</div>';
        } else if (itemType === 'header') {
          let
            groupName = escape(option[fields.name] || '', preserveHTML),
            groupIcon = option[fields.icon] ? deQuote(option[fields.icon]) : className.groupIcon
          ;
          if (groupName !== '' || groupIcon !== '') {
            html += '<div class="' + (option[fields.class] ? deQuote(option[fields.class]) : className.header) + '">';
            if (groupIcon !== '') {
              html += '<i class="' + groupIcon + ' ' + (option[fields.iconClass] ? deQuote(option[fields.iconClass]) : className.icon) + '"></i>';
            }
            html += groupName;
            html += '</div>';
          }
          if (option[fields.divider]) {
            html += '<div class="'+className.divider+'"></div>';
          }
        }
      });
      return html;
    },
  
    // generates label for multiselect
    label: function(value, text, preserveHTML, className) {
      let escape = settings.templates.escape;
      return escape(text,preserveHTML) + '<i class="'+className.delete+' icon"></i>';
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

  events: []
}

export class Dropdown extends Module {
  settings: DropdownOptions;

  initialLoad: boolean;
  internalChange: boolean = false;
  activated: boolean = false;
  itemActivated: boolean = false;
  focused: boolean = false;
  iconClicked: boolean = false;
  willRefocus: boolean;
  hasTouch: boolean;
  selectActionActive: boolean;
  pageLostFocus: boolean;
  
  id: string;
  elementNamespace: string;
  clickEvent: string;

  $document: Cash;
  $context: Cash;
  $combo: Cash;
  $text: Cash;
  $item: Cash;
  $search: Cash;
  $sizer: Cash;
  $input: Cash;
  $icon: Cash;
  $menu: Cash;
  $divider: Cash;
  $clear: Cash;

  instance: Dropdown;
  menuTransition: Transition;
  selectObserver: MutationObserver;
  menuObserver: MutationObserver;
  classObserver: MutationObserver;

  timer;
  itemTimer;

  constructor(selector: string, parameters) {
    super(selector, parameters, settings);

    this.$document       = $(document)
    this.$context        = $(this.settings.context);
  
    this.$combo          = (this.$element.prev().find(this.settings.selector.text).length > 0)
      ? this.$element.prev().find(this.settings.selector.text)
      : this.$element.prev()
    ;

    this.$text           = this.$element.find(this.settings.selector.text);
    this.$search         = this.$element.find(this.settings.selector.search);
    this.$sizer          = this.$element.find(this.settings.selector.sizer);
    this.$input          = this.$element.find(this.settings.selector.input);
    this.$icon           = this.$element.find(this.settings.selector.icon);
    this.$clear          = this.$element.find(this.settings.selector.clearIcon);

    this.$menu           = this.$element.children(this.settings.selector.menu);
    this.$item           = this.$menu.find(this.settings.selector.item);
    this.$divider        = this.settings.hideDividers ? this.$item.parent().children(this.settings.selector.divider) : $();

    this.hasTouch = ('ontouchstart' in document.documentElement);

    this.clickEvent = this.hasTouch
      ? 'touchstart'
      : 'click'
    ;
    
    this.initialize();
  }

  initialize(): void {
    this.debug('Initializing dropdown', this.settings);
  
    if (this.is_alreadySetup()) {
      this.setup_reference();
    }
    else {
      if (this.settings.ignoreDiacritics && !String.prototype.normalize) {
        this.settings.ignoreDiacritics = false;
        this.error(this.settings.error.noNormalize, this.element);
      }

      this.setup_layout();

      if (this.settings.values) {
        this.set_initialLoad();
        this.change_values(this.settings.values);
        this.remove_initialLoad();
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
    this.verbose('Storing instance of dropdown', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy() {
    this.verbose('Destroying previous dropdown', this.$element);
    this.remove_tabbable();
    this.remove_active();
    // this.$menu.transition('stop all');
    this.menuTransition.stopAll();
    this.$menu.removeClass(this.settings.className.visible).addClass(this.settings.className.hidden);
    this.$element
      .off(this.eventNamespace)
      .removeAttr(this.moduleNamespace)
    ;
    this.$menu.off(this.eventNamespace);
    this.$document.off(this.elementNamespace);
    this.disconnect_menuObserver();
    this.disconnect_selectObserver();
    this.disconnect_classObserver();
  }

  setup_api() {
    let
      apiSettings = {
        debug   : this.settings.debug,
        urlData : {
          value : this.get_value(),
          query : this.get_query()
        },
        on    : false
      }
    ;
    this.verbose('First request, initializing API');
    // this.$element.api(apiSettings);
  }

  setup_layout() {
    if (this.$element.is('select')) {
      this.setup_select();
      this.setup_returnedObject();
    }
    if (!this.has_menu()) {
      this.create_menu();
    }
    if (this.is_clearable() && !this.has_clearItem()) {
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
        .prop('autocomplete', this.is_chrome() ? 'fomantic-search' : 'off')
        .insertBefore(this.$text)
      ;
    }
    if (this.is_multiple() && this.is_searchSelection() && !this.has_sizer()) {
      this.create_sizer();
    }
    if (this.settings.allowTab) {
      this.set_tabbable();
    }
  }

  setup_reference() {
    this.debug('Dropdown behavior was called on select, replacing with closest dropdown');
    // replace module reference
    this.$element  = this.$element.parent(this.settings.selector.dropdown);
    this.instance = this.$element.data(this.moduleNamespace);
    this.element  = this.$element.get(0);
    this.refresh();
    this.setup_returnedObject();
  }

  setup_returnedObject() {
    // let
    //   $firstModules = $allModules.slice(0, elementIndex),
    //   $lastModules  = $allModules.slice(elementIndex + 1)
    // ;
    // // adjust all modules to use correct reference
    // $allModules = $firstModules.add(this.$element).add($lastModules);
  }

  setup_select() {
    let selectValues  = this.get_selectValues();

    this.debug('Dropdown initialized on a select', selectValues);

    if (this.$element.is('select')) {
      this.$input = this.$element;
    }
    // see if select is placed correctly already
    if (this.$input.parent(this.settings.selector.dropdown).length > 0) {
      this.debug('UI dropdown already exists. Creating dropdown menu only');
      this.$element = this.$input.closest(this.settings.selector.dropdown);
      if (!this.has_menu()) {
        this.create_menu();
      }
      this.$menu = this.$element.children(this.settings.selector.menu);
      this.setup_menu(selectValues);
    }
    else {
      this.debug('Creating entire dropdown from select');
      this.$element = $('<div />')
        .attr('class', this.$input.attr('class') )
        .addClass(this.settings.className.selection)
        .addClass(this.settings.className.dropdown)
        .html( this.settings.templates.dropdown(selectValues, this.settings.fields, this.settings.preserveHTML, this.settings.className) )
        .insertBefore(this.$input)
      ;
      if (this.$input.hasClass(this.settings.className.multiple) && this.$input.prop('multiple') === false) {
        this.error(this.settings.error.missingMultiple);
        this.$input.prop('multiple', true);
      }
      if (this.$input.is('[multiple]')) {
        this.set_multiple();
      }
      if (this.$input.prop('disabled')) {
        this.debug('Disabling dropdown');
        this.$element.addClass(this.settings.className.disabled);
      }
      this.$input
        .removeAttr('required')
        .removeAttr('class')
        .detach()
        .prependTo(this.$element)
      ;
    }
    this.refresh();
  }

  create_id() {
    this.id = (Math.random().toString(16) + '000000000').substr(2, 8);
    this.elementNamespace = '.' + this.id;
    this.verbose('Creating unique id for element', this.id);
  }

  create_menu() {
    this.$menu = $('<div />')
      .addClass(this.settings.className.menu)
      .appendTo(this.$element)
    ;
  }

  create_sizer() {
    this.$sizer = $('<span />')
      .addClass(this.settings.className.sizer)
      .insertAfter(this.$search)
    ;
  }

  create_userChoice(values) {
    let
      $userChoices,
      $userChoice,
      isUserValue,
      html
    ;
    values = values || this.get_userValues();
    if (!values) {
      return false;
    }
    values = Array.isArray(values)
      ? values
      : [values]
    ;
    $.each(values, (_index, value: any) => {
      if (this.get_item(value) === false) {
        html         = this.settings.templates.addition(this.add_variables(this.settings.message.addResult, value) );
        $userChoice  = $('<div />')
          .html(html)
          .attr('data-' + this.settings.metadata.value, value)
          .attr('data-' + this.settings.metadata.text, value)
          .addClass(this.settings.className.addition)
          .addClass(this.settings.className.item)
        ;
        if (settings.hideAdditions) {
          $userChoice.addClass(this.settings.className.hidden);
        }
        $userChoices = ($userChoices === undefined)
          ? $userChoice
          : $userChoices.add($userChoice)
        ;
        this.verbose('Creating user choices for value', value, $userChoice);
      }
    });
    return $userChoices;
  }

  create_userLabels() {
    let userValues = this.get_userValues();
    if (userValues) {
      this.debug('Adding user labels', userValues);
      $.each(userValues, (_index, value) => {
        this.verbose('Adding custom user value');
        this.add_label(value, value);
      });
    }
  }

  setup_menu(values) {
    this.$menu.html(this.settings.templates.menu(values, this.settings.fields, this.settings.preserveHTML, this.settings.className));
    this.$item = this.$menu.find(this.settings.selector.item);
    this.$divider = this.settings.hideDividers ? this.$item.parent().children(this.settings.selector.divider) : $();
  }

  bind_intent() {
    this.verbose('Binding hide intent event to document');
    if (this.hasTouch) {
      this.$document
        .on('touchstart' + this.elementNamespace, this.event_test_touch.bind(this))
        .on('touchmove'  + this.elementNamespace, this.event_test_touch.bind(this))
      ;
    }
    this.$document.on(this.clickEvent + this.elementNamespace, this.event_test_hide.bind(this));
  }

  unbind_intent() {
    this.verbose('Removing hide intent event from document');
    if (this.hasTouch) {
      this.$document
        .off('touchstart' + this.elementNamespace)
        .off('touchmove' + this.elementNamespace)
      ;
    }
    this.$document.off(this.clickEvent + this.elementNamespace);
  }

  bind_events() {
    this.bind_keyboardEvents();
    this.bind_inputEvents();
    this.bind_mouseEvents();
  }

  bind_keyboardEvents() {
    this.verbose('Binding keyboard events');
    this.$element.on('keydown' + this.eventNamespace, this.event_keydown.bind(this));
    if (this.has_search()) {
      this.$element.on(this.get_inputEvent() + this.eventNamespace, this.settings.selector.search, this.event_input.bind(this));
    }
    if (this.is_multiple() ) {
      this.$document.on('keydown' + this.elementNamespace, this.event_document_keydown.bind(this));
    }
  }

  bind_inputEvents() {
    this.verbose('Binding input change events');
    this.$element.on('change' + this.eventNamespace, this.settings.selector.input, this.event_change.bind(this));
  }

  bind_mouseEvents() {
    this.verbose('Binding mouse events');
    if (this.is_multiple()) {
      this.$element
        .on(this.clickEvent   + this.eventNamespace, this.settings.selector.label,  this.event_label_click.bind(this))
        .on(this.clickEvent   + this.eventNamespace, this.settings.selector.remove, this.event_remove_click.bind(this))
      ;
    }
    if (this.is_searchSelection()) {
      this.$element
        .on('mousedown'     + this.eventNamespace, this.event_mousedown.bind(this))
        .on('mouseup'       + this.eventNamespace, this.event_mouseup.bind(this))
        .on('mousedown'     + this.eventNamespace, this.settings.selector.menu,      this.event_menu_mousedown.bind(this))
        .on('mouseup'       + this.eventNamespace, this.settings.selector.menu,      this.event_menu_mouseup.bind(this))
        .on(this.clickEvent + this.eventNamespace, this.settings.selector.icon,      this.event_icon_click.bind(this))
        .on(this.clickEvent + this.eventNamespace, this.settings.selector.clearIcon, this.event_clearIcon_click.bind(this))
        .on('focus'         + this.eventNamespace, this.settings.selector.search,    this.event_search_focus.bind(this))
        .on(this.clickEvent + this.eventNamespace, this.settings.selector.search,    this.event_search_focus.bind(this))
        .on('blur'          + this.eventNamespace, this.settings.selector.search,    this.event_search_blur.bind(this))
        .on(this.clickEvent + this.eventNamespace, this.settings.selector.text,      this.event_text_focus.bind(this))
      ;
      if (this.is_multiple()) {
        this.$element
          .on(this.clickEvent + this.eventNamespace, this.event_click.bind(this))
          .on(this.clickEvent + this.eventNamespace, this.event_search_focus.bind(this))
        ;
      }
    }
    else {
      if (this.settings.on == 'click') {
        this.$element
          // .on(this.clickEvent + this.eventNamespace, this.settings.selector.icon, this.event_icon_click.bind(this))
          .on(this.clickEvent + this.eventNamespace, this.event_test_toggle.bind(this))
        ;
        this.$icon.on(this.clickEvent + this.eventNamespace, this.event_icon_click.bind(this));
      }
      else if (settings.on == 'hover') {
        this.$element
          .on('mouseenter' + this.eventNamespace, this.delay_show.bind(this))
          .on('mouseleave' + this.eventNamespace, this.delay_hide.bind(this))
        ;
      }
      else {
        this.$element.on(settings.on + this.eventNamespace, this.toggle.bind(this));
      }
      this.$element
        .on('mousedown' + this.eventNamespace, this.event_mousedown.bind(this))
        .on('mouseup'   + this.eventNamespace, this.event_mouseup.bind(this))
        .on('focus'     + this.eventNamespace, this.event_focus.bind(this))
        .on(this.clickEvent  + this.eventNamespace, this.settings.selector.clearIcon, this.event_clearIcon_click.bind(this))
      ;
      if (this.has_menuSearch()) {
        this.$element.on('blur' + this.eventNamespace, this.settings.selector.search, this.event_search_blur.bind(this));
      }
      else {
        this.$element.on('blur' + this.eventNamespace, this.event_blur.bind(this));
      }
    }
    this.$menu
      .on((this.hasTouch ? 'touchstart' : 'mouseenter') + this.eventNamespace, this.settings.selector.item, this.event_item_mouseenter.bind(this))
      .on('mouseleave' + this.eventNamespace, this.settings.selector.item, this.event_item_mouseleave.bind(this))
      .on('click'      + this.eventNamespace, this.settings.selector.item, this.event_item_click.bind(this))
    ;
  }

  event_blur(event) {
    this.pageLostFocus = (document.activeElement === this.element);
    if (!this.activated && !this.pageLostFocus) {
      this.remove_activeLabel();
      this.hide();
    }
  }

  event_change(event) {
    if (!this.internalChange) {
      this.debug('Input changed, updating selection');
      this.set_selected();
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

  event_click(event) {
    let $target = $(event.target);

    // focus search
    if ($target.is(this.$element)) {
      if (!this.is_focusedOnSearch()) {
        this.focusSearch();
      }
      else {
        this.show();
      }
    }
  }

  // label selection should occur even when element has no focus
  event_document_keydown(event) {
    let
      pressedKey    = event.which,
      isShortcutKey = this.is_inObject(pressedKey, this.settings.keys)
    ;
    if (isShortcutKey) {
      let
        $label            = this.$element.find(this.settings.selector.label),
        $activeLabel      = $label.filter('.' + this.settings.className.active),
        activeValue       = $activeLabel.data(this.settings.metadata.value),
        labelIndex        = $label.index($activeLabel),
        labelCount        = $label.length,
        hasActiveLabel    = ($activeLabel.length > 0),
        hasMultipleActive = ($activeLabel.length > 1),
        isFirstLabel      = (labelIndex === 0),
        isLastLabel       = (labelIndex + 1 == labelCount),
        isSearch          = this.is_searchSelection(),
        isFocusedOnSearch = this.is_focusedOnSearch(),
        isFocused         = this.is_focused(),
        caretAtStart      = (isFocusedOnSearch && this.get_caretPosition(false) === 0),
        isSelectedSearch  = (caretAtStart && this.get_caretPosition(true) !== 0),
        $nextLabel
      ;
      if (isSearch && !hasActiveLabel && !isFocusedOnSearch) {
        return;
      }

      if (pressedKey == this.settings.keys.leftArrow) {
        // activate previous label
        if ((isFocused || caretAtStart) && !hasActiveLabel) {
          this.verbose('Selecting previous label');
          $label.last().addClass(this.settings.className.active);
        }
        else if (hasActiveLabel) {
          if (!event.shiftKey) {
            this.verbose('Selecting previous label');
            $label.removeClass(this.settings.className.active);
          }
          else {
            this.verbose('Adding previous label to selection');
          }
          if (isFirstLabel && !hasMultipleActive) {
            $activeLabel.addClass(this.settings.className.active);
          }
          else {
            $activeLabel.prev(this.settings.selector.siblingLabel)
              .addClass(this.settings.className.active)
              .end()
            ;
          }
          event.preventDefault();
        }
      }
      else if (pressedKey == this.settings.keys.rightArrow) {
        // activate first label
        if (isFocused && !hasActiveLabel) {
          $label.first().addClass(this.settings.className.active);
        }
        // activate next label
        if (hasActiveLabel) {
          if (!event.shiftKey) {
            this.verbose('Selecting next label');
            $label.removeClass(this.settings.className.active);
          }
          else {
            this.verbose('Adding next label to selection');
          }
          if (isLastLabel) {
            if (isSearch) {
              if (!isFocusedOnSearch) {
                this.focusSearch();
              }
              else {
                $label.removeClass(this.settings.className.active);
              }
            }
            else if (hasMultipleActive) {
              $activeLabel.next(this.settings.selector.siblingLabel).addClass(this.settings.className.active);
            }
            else {
              $activeLabel.addClass(this.settings.className.active);
            }
          }
          else {
            $activeLabel.next(this.settings.selector.siblingLabel).addClass(this.settings.className.active);
          }
          event.preventDefault();
        }
      }
      else if (pressedKey == this.settings.keys.deleteKey || pressedKey == this.settings.keys.backspace) {
        if (hasActiveLabel) {
          this.verbose('Removing active labels');
          if (isLastLabel) {
            if (isSearch && !isFocusedOnSearch) {
              this.focusSearch();
            }
          }
          $activeLabel.last().next(this.settings.selector.siblingLabel).addClass(this.settings.className.active);
          this.remove_activeLabels($activeLabel);
          event.preventDefault();
        }
        else if (caretAtStart && !isSelectedSearch && !hasActiveLabel && pressedKey == this.settings.keys.backspace) {
          this.verbose('Removing last label on input backspace');
          $activeLabel = $label.last().addClass(this.settings.className.active);
          this.remove_activeLabels($activeLabel);
        }
      }
      else {
        $activeLabel.removeClass(this.settings.className.active);
      }
    }
  }

  event_focus() {
    if (this.settings.showOnFocus && !this.activated && this.is_hidden() && !this.pageLostFocus) {
      this.focused = true;
      this.show();
    }
  }

  event_icon_click(event) {
    this.iconClicked = true;
    if (this.has_search()) {
      if (!this.is_active()) {
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
    event.stopPropagation();
  }

  event_input(event) {
    if (this.is_multiple() || this.is_searchSelection()) {
      this.set_filtered();
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(this.search.bind(this), this.settings.delay.search);
  }

  event_item_click(event, skipRefocus) {
    let
      $choice        = $(event.currentTarget),
      $target        = (event)
        ? $(event.target)
        : $(''),
      $subMenu       = $choice.find(this.settings.selector.menu),
      text           = this.get_choiceText($choice),
      value          = this.get_choiceValue($choice, text),
      hasSubMenu     = ($subMenu.length > 0),
      // isBubbledEvent = ($subMenu.find($target).length > 0)
      isBubbledEvent = ($subMenu.find(event.target).length > 0)
    ;
    // prevents IE11 bug where menu receives focus even though `tabindex=-1`
    if (document.activeElement.tagName.toLowerCase() !== 'input') {
      $(document.activeElement).trigger('blur');
    }
    if (!isBubbledEvent && (!hasSubMenu || this.settings.allowCategorySelection)) {
      if (this.is_searchSelection()) {
        if (this.settings.allowAdditions) {
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
      this.determine_selectAction.call(this, $target, text, value);
    }
  }

  event_item_mouseenter(event) {
    let
      $target        = $(event.target),
      $item          = $(event.currentTarget),
      $subMenu       = $item.children(this.settings.selector.menu),
      $otherMenus    = $item.siblings(this.settings.selector.item).children(this.settings.selector.menu),
      hasSubMenu     = ($subMenu.length > 0),
      isBubbledEvent = ($subMenu.find($target).length > 0)
    ;
    if (!isBubbledEvent && hasSubMenu) {
      clearTimeout(this.itemTimer);
      this.itemTimer = setTimeout(function() {
        this.verbose('Showing sub-menu', $subMenu);
        $.each($otherMenus, function() {
          module.animate.hide(false, $(this));
        });
        module.animate.show(false, $subMenu);
      }, this.settings.delay.show);
      event.preventDefault();
    }
  }

  event_item_mouseleave(event) {
    let $subMenu = $(event.currentTarget).children(this.settings.selector.menu);
    if ($subMenu.length > 0) {
      clearTimeout(this.itemTimer);
      this.itemTimer = setTimeout(() => {
        this.verbose('Hiding sub-menu', $subMenu);
        this.animate_hide(() => {}, $subMenu);
      }, this.settings.delay.hide);
    }
  }

  event_keydown(event) {
    let
      pressedKey    = event.which,
      isShortcutKey = this.is_inObject(pressedKey, this.settings.keys)
    ;
    if (isShortcutKey) {
      let
        $currentlySelected = this.$item.not(this.settings.selector.unselectable).filter('.' + this.settings.className.selected).eq(0),
        $activeItem        = this.$menu.children('.' + this.settings.className.active).eq(0),
        $selectedItem      = ($currentlySelected.length > 0)
          ? $currentlySelected
          : $activeItem,
        $visibleItems = ($selectedItem.length > 0)
          ? $selectedItem.siblings(`:not(.${this.settings.className.filtered})`).addBack()
          : this.$menu.children(`:not(.${this.settings.className.filtered})`),
        $subMenu              = $selectedItem.children(this.settings.selector.menu),
        $parentMenu           = $selectedItem.closest(this.settings.selector.menu),
        inVisibleMenu         = ($parentMenu.hasClass(this.settings.className.visible) || $parentMenu.hasClass(this.settings.className.animating) || $parentMenu.parent(this.settings.selector.menu).length > 0),
        hasSubMenu            = ($subMenu.length> 0),
        hasSelectedItem       = ($selectedItem.length > 0),
        selectedIsSelectable  = ($selectedItem.not(this.settings.selector.unselectable).length > 0),
        delimiterPressed      = (pressedKey == this.settings.keys.delimiter && this.settings.allowAdditions && this.is_multiple()),
        isAdditionWithoutMenu = (this.settings.allowAdditions && this.settings.hideAdditions && (pressedKey == this.settings.keys.enter || delimiterPressed) && selectedIsSelectable),
        $nextItem,
        isSubMenuItem,
        newIndex
      ;
      // allow selection with menu closed
      if (isAdditionWithoutMenu) {
        this.verbose('Selecting item from keyboard shortcut', $selectedItem);
        this.event_item_click.call($selectedItem, event);
        if (this.is_searchSelection()) {
          this.remove_searchTerm();
        }
        if (this.is_multiple()) {
          event.preventDefault();
        }
      }

      // visible menu keyboard shortcuts
      if (this.is_visible()) {

        // enter (select or open sub-menu)
        if (pressedKey == this.settings.keys.enter || delimiterPressed) {
          if (pressedKey == this.settings.keys.enter && hasSelectedItem && hasSubMenu && !this.settings.allowCategorySelection) {
            this.verbose('Pressed enter on unselectable category, opening sub menu');
            pressedKey = this.settings.keys.rightArrow;
          }
          else if (selectedIsSelectable) {
            this.verbose('Selecting item from keyboard shortcut', $selectedItem);
            this.event_item_click.call($selectedItem, event);
            if (this.is_searchSelection()) {
              this.remove_searchTerm();
              if (this.is_multiple()) {
                  this.$search.trigger('focus');
              }
            }
          }
          event.preventDefault();
        }

        // sub-menu actions
        if (hasSelectedItem) {

          if (pressedKey == this.settings.keys.leftArrow) {

            isSubMenuItem = ($parentMenu[0] !== this.$menu[0]);

            if (isSubMenuItem) {
              this.verbose('Left key pressed, closing sub-menu');
              this.animate_hide(null, $parentMenu);
              $selectedItem
                .removeClass(this.settings.className.selected)
              ;
              $parentMenu
                .closest(this.settings.selector.item)
                .addClass(this.settings.className.selected)
              ;
              event.preventDefault();
            }
          }

          // right arrow (show sub-menu)
          if (pressedKey == this.settings.keys.rightArrow) {
            if (hasSubMenu) {
              this.verbose('Right key pressed, opening sub-menu');
              this.animate_show(null, $subMenu);
              $selectedItem.removeClass(this.settings.className.selected);
              $subMenu
                .find(this.settings.selector.item).eq(0)
                .addClass(this.settings.className.selected)
              ;
              event.preventDefault();
            }
          }
        }

        // up arrow (traverse menu up)
        if (pressedKey == this.settings.keys.upArrow) {
          $nextItem = (hasSelectedItem && inVisibleMenu)
            ? $selectedItem.prevAll(this.settings.selector.item + ':not(' + this.settings.selector.unselectable + ')').eq(0)
            : this.$item.eq(0)
          ;
          if ($visibleItems.index( $nextItem ) < 0) {
            this.verbose('Up key pressed but reached top of current menu');
            event.preventDefault();
            return;
          }
          else {
            this.verbose('Up key pressed, changing active item');
            $selectedItem.removeClass(this.settings.className.selected);
            $nextItem.addClass(this.settings.className.selected);
            this.set_scrollPosition($nextItem);
            if (this.settings.selectOnKeydown && this.is_single()) {
              this.set_selectedItem($nextItem);
            }
          }
          event.preventDefault();
        }

        // down arrow (traverse menu down)
        if (pressedKey == this.settings.keys.downArrow) {
          $nextItem = (hasSelectedItem && inVisibleMenu)
            ? $nextItem = $selectedItem.nextAll(this.settings.selector.item + ':not(' + this.settings.selector.unselectable + ')').eq(0)
            : this.$item.eq(0)
          ;
          if ($nextItem.length === 0) {
            this.verbose('Down key pressed but reached bottom of current menu');
            event.preventDefault();
            return;
          }
          else {
            this.verbose('Down key pressed, changing active item');
            this.$item.removeClass(this.settings.className.selected);
            $nextItem.addClass(this.settings.className.selected);
            this.set_scrollPosition($nextItem);
            if (this.settings.selectOnKeydown && this.is_single()) {
              this.set_selectedItem($nextItem);
            }
          }
          event.preventDefault();
        }

        // page down (show next page)
        if (pressedKey == this.settings.keys.pageUp) {
          this.scrollPage('up');
          event.preventDefault();
        }
        if (pressedKey == this.settings.keys.pageDown) {
          this.scrollPage('down');
          event.preventDefault();
        }

        // escape (close menu)
        if (pressedKey == this.settings.keys.escape) {
          this.verbose('Escape key pressed, closing dropdown');
          this.hide();
        }

      }
      else {
        // delimiter key
        if (delimiterPressed) {
          event.preventDefault();
        }
        // down arrow (open menu)
        if (pressedKey == this.settings.keys.downArrow && !this.is_visible()) {
          this.verbose('Down key pressed, showing dropdown');
          this.show();
          event.preventDefault();
        }
      }
    }
    else {
      if (!this.has_search()) {
        this.set_selectedLetter( String.fromCharCode(pressedKey) );
      }
    }
  }

  event_label_click(event) {
    let
      $label        = $(event.currentTarget),
      $labels       = this.$element.find(this.settings.selector.label),
      $activeLabels = $labels.filter('.' + this.settings.className.active),
      $nextActive   = $label.nextAll('.' + this.settings.className.active),
      $prevActive   = $label.prevAll('.' + this.settings.className.active),
      $range = ($nextActive.length > 0)
        ? $label.nextUntil($nextActive).add($activeLabels).add($label)
        : $label.prevUntil($prevActive).add($activeLabels).add($label)
    ;
    if (event.shiftKey) {
      $activeLabels.removeClass(this.settings.className.active);
      $range.addClass(this.settings.className.active);
    }
    else if (event.ctrlKey) {
      $label.toggleClass(this.settings.className.active);
    }
    else {
      $activeLabels.removeClass(this.settings.className.active);
      $label.addClass(this.settings.className.active);
    }
    settings.onLabelSelect.apply(this, $labels.filter('.' + this.settings.className.active));
    event.stopPropagation();
  }

  event_menu_mousedown() {
    this.itemActivated = true;
  }

  event_menu_mouseup() {
    this.itemActivated = false;
  }

  event_mousedown() {
    if (this.is_searchSelection()) {
      // prevent menu hiding on immediate re-focus
      this.willRefocus = true;
    }
    else {
      // prevents focus callback from occurring on mousedown
      this.activated = true;
    }
  }

  event_mouseup() {
    if (this.is_searchSelection()) {
      // prevent menu hiding on immediate re-focus
      this.willRefocus = false;
    }
    else {
      this.activated = false;
    }
  }

  event_remove_click(event) {
    let $label = $(event.currentTarget).parent();
    if ($label.hasClass(this.settings.className.active)) {
      // remove all selected labels
      this.remove_activeLabels();
    }
    else {
      // remove this label only
      this.remove_activeLabels($label);
    }
    event.stopPropagation();
  }

  event_search_blur() {
    this.pageLostFocus = (document.activeElement === this.element);
    if (this.is_searchSelection() && !this.willRefocus) {
      if (!this.itemActivated && !this.pageLostFocus) {
        if (this.settings.forceSelection) {
          this.forceSelection();
        } else if (!this.settings.allowAdditions) {
          this.remove_searchTerm();
        }
        this.hide();
      }
    }
   this.willRefocus = false;
  }

  event_search_focus(event) {
    this.activated = true;
    if (this.is_multiple()) {
      this.remove_activeLabel();
    }
    if (!this.focused && !this.is_active() && (this.settings.showOnFocus || (event.type !== 'focus' && event.type !== 'focusin'))) {
      this.focused = true;
      this.search();
    }
  }

  event_test_hide(event) {
    if (this.determine_eventInModule(event, this.hide)) {
      if (this.element.id && $(event.target).attr('for') === this.element.id) {
        event.preventDefault();
      }
    }
  }

  event_test_touch(event) {
    this.determine_eventOnElement(event, () => {
      if (event.type == 'touchstart') {
        this.timer = setTimeout(() => {
          this.hide();
        }, this.settings.delay.touch);
      }
      else if (event.type == 'touchmove') {
        clearTimeout(this.timer);
      }
    });
    event.stopPropagation();
  }

  event_text_focus() {
    this.activated = true;
    this.focusSearch();
  }

  event_test_toggle(event) {
    let toggleBehavior = (this.is_multiple())
      ? this.show
      : this.toggle
    ;
    if (this.is_bubbledLabelClick(event) || this.is_bubbledIconClick(event)) {
      return;
    }
    if (!this.is_multiple() || (this.is_multiple() && !this.is_active())) {
      this.focused = true;
    }
    if (this.determine_eventOnElement(event, toggleBehavior) ) {
      event.preventDefault();
    }
  }

  focusSearch(skipHandler: boolean = false) {
    if (this.has_search() && !this.is_focusedOnSearch() ) {
      if (skipHandler) {
        this.$element.off('focus' + this.eventNamespace, this.settings.selector.search);
        this.$search.trigger('focus');
        this.$element.on('focus'  + this.eventNamespace, this.settings.selector.search, this.event_search_focus.bind(this));
      }
      else {
        this.$search.trigger('focus');
      }
    }
  }

  blurSearch() {
    if (this.has_search()) {
      this.$search.trigger('blur');
    }
  }

  exactSearch(query: string, term: string) {
    query = (settings.ignoreSearchCase ? query.toLowerCase() : query);
    term  = (settings.ignoreSearchCase ? term.toLowerCase() : term);
    return term.indexOf(query) > -1;
  }

  fuzzySearch(query, term) {
    let
      termLength  = term.length,
      queryLength = query.length
    ;
    query = (settings.ignoreSearchCase ? query.toLowerCase() : query);
    term  = (settings.ignoreSearchCase ? term.toLowerCase() : term);
    if (queryLength > termLength) {
      return false;
    }
    if (queryLength === termLength) {
      return (query === term);
    }
    search: for (let characterIndex = 0, nextCharacterIndex = 0; characterIndex < queryLength; characterIndex++) {
      let queryCharacter = query.charCodeAt(characterIndex);
      while(nextCharacterIndex < termLength) {
        if (term.charCodeAt(nextCharacterIndex++) === queryCharacter) {
          continue search;
        }
      }
      return false;
    }
    return true;
  }

  toggle() {
    this.verbose('Toggling menu visibility');
    if (!this.is_active() ) {
      this.show();
    }
    else {
      this.hide();
    }
  }

  show(callback = () => {}, preventFocus: boolean = false) {
    if ((this.focused || this.iconClicked) && this.is_remote() && this.is_noApiCache()) {
      this.clearItems();
    }
    if (!this.can_show() && this.is_remote()) {
      this.debug('No API results retrieved, searching before show');
      this.queryRemote(this.get_query(), this.show, [callback, preventFocus]);
    }
    if (this.can_show() && !this.is_active() ) {
      this.debug('Showing dropdown');
      if (this.has_message() && !(this.has_maxSelections() || this.has_allResultsFiltered()) ) {
        this.remove_message();
      }
      if (this.is_allFiltered()) {
        return true;
      }
      if (settings.onShow.call(this.element) !== false) {
        this.animate_show(() => {
          if (this.can_click()) {
            this.bind_intent();
          }
          if (this.has_search() && !preventFocus) {
            this.focusSearch();
          }
          this.set_visible();
          callback.call(this.element);
        });
      }
    }
  }

  animate_show(callback = () => {}, $subMenu = undefined) {
    let
      $currentMenu = $subMenu || this.$menu,
      start = ($subMenu)
        ? () => {}
        : () => {
          this.hideSubMenus();
          this.hideOthers();
          this.set_active();
        },
      transition
    ;
    this.verbose('Doing menu show animation', $currentMenu);
    this.set_direction($subMenu);
    transition = this.settings.transition.showMethod || this.get_transition($subMenu);
    if (this.is_selection()) {
      this.set_scrollPosition(this.get_selectedItem(), true);
    }
    if (this.is_hidden($currentMenu) || this.is_animating($currentMenu)) {
      if (transition === 'none') {
        start();
        $currentMenu.transition({
          displayType: this.get_displayType()
        }).transition('show');
        callback.call(this.element);
      }
      // else if ($.fn.transition !== undefined && this.$element.transition('is supported')) {
      else if (true) {
        this.menuTransition = new Transition($currentMenu, {
          animation  : transition + ' in',
          debug      : this.settings.debug,
          verbose    : this.settings.verbose,
          duration   : this.settings.transition.showDuration || this.settings.duration,
          queue      : true,
          displayType: this.get_displayType(),
          autostart: false
        });

        this.menuTransition.on('start', start);

        this.menuTransition.on('complete', () => {
          callback.call(this.element);
        });

        this.menuTransition.animate();
      }
      else {
        this.error(this.settings.error.noTransition, transition);
      }
    }
  }

  hide(callback = () => {}, preventBlur: boolean = false) {
    if (this.is_active() && !this.is_animatingOutward()) {
      this.debug('Hiding dropdown');
      if (this.settings.onHide.call(this.element) !== false) {
        this.animate_hide(() => {
          this.remove_visible();
          // hidding search focus
          if (this.is_focusedOnSearch() && preventBlur !== true ) {
            this.$search.trigger('blur');
          }
          callback.call(this.element);
        });
      }
    } else if (this.can_click()) {
      this.unbind_intent();
    }
    this.iconClicked = false;
    this.focused = false;
  }

  hideAndClear() {
    this.remove_searchTerm();
    if (this.has_maxSelections()) {
      return;
    }
    if (this.has_search()) {
      this.hide(() => {
        this.remove_filteredItem();
      });
    }
    else {
      this.hide();
    }
  }

  animate_hide(callback = () => {}, $subMenu = undefined) {
    let
      $currentMenu = $subMenu || this.$menu,
      start = ($subMenu)
        ? () => {}
        : () => {
          if (this.can_click()) {
            this.unbind_intent();
          }
          this.remove_active();
        },
      transition = this.settings.transition.hideMethod || this.get_transition($subMenu)
    ;
    if (this.is_visible($currentMenu) || this.is_animating($currentMenu)) {
      this.verbose('Doing menu hide animation', $currentMenu);

      if (transition === 'none') {
        start();
        $currentMenu.transition({
          displayType: this.get_displayType()
        }).transition('hide');
        callback.call(this.element);
      }
      // else if ($.fn.transition !== undefined && this.$element.transition('is supported')) {
      else if (true) {
        this.menuTransition = new Transition($currentMenu, {
          animation  : transition + ' out',
          duration   : this.settings.transition.hideDuration || this.settings.duration,
          debug      : this.settings.debug,
          verbose    : this.settings.verbose,
          queue      : false,
          displayType: this.get_displayType(),
          autostart: false
        });

        this.menuTransition.on('start', start);

        this.menuTransition.on('complete', () => {
          callback.call(this.element);
        });

        this.menuTransition.animate();
      }
      else {
        this.error(this.settings.error.transition);
      }
    }
  }

  hideMenu() {
    this.verbose('Hiding menu instantaneously');
    this.remove_active();
    this.remove_visible();
    // this.$menu.transition('hide');
    this.menuTransition.hide();
  }

  hideOthers() {
    this.verbose('Finding other dropdowns to hide');
    // INVESTIGATE
    // $allModules
    //   .not(this.$element)
    //   .has(this.settings.selector.menu + '.' + this.settings.className.visible)
    //   .dropdown('hide')
    // ;
  }

  hideSubMenus() {
    let $subMenus = this.$menu.children(this.settings.selector.item).find(this.settings.selector.menu);
    this.verbose('Hiding sub menus', $subMenus);
    // INVESTIGATE
    // $subMenus.transition('hide');
  }

  delay_show() {
    this.verbose('Delaying show event to ensure user intent');
    clearTimeout(this.timer);
    this.timer = setTimeout(this.show, this.settings.delay.show);
  }

  delay_hide() {
    this.verbose('Delaying hide event to ensure user intent');
    clearTimeout(this.timer);
    this.timer = setTimeout(this.hide, this.settings.delay.hide);
  }

  scrollPage(direction: string, $selectedItem: Cash = this.get_selectedItem()) {
    let
      $currentItem  = $selectedItem || this.get_selectedItem(),
      $menu         = $currentItem.closest(this.settings.selector.menu),
      menuHeight    = $menu.outerHeight(),
      currentScroll = $menu.scrollTop(),
      itemHeight    = this.$item.eq(0).outerHeight(),
      itemsPerPage  = Math.floor(menuHeight / itemHeight),
      maxScroll     = $menu.prop('scrollHeight'),
      newScroll     = (direction == 'up')
        ? currentScroll - (itemHeight * itemsPerPage)
        : currentScroll + (itemHeight * itemsPerPage),
      $selectableItem = this.$item.not(this.settings.selector.unselectable),
      isWithinRange,
      $nextSelectedItem,
      elementIndex
    ;
    elementIndex      = (direction == 'up')
      ? $selectableItem.index($currentItem) - itemsPerPage
      : $selectableItem.index($currentItem) + itemsPerPage
    ;
    isWithinRange = (direction == 'up')
      ? (elementIndex >= 0)
      : (elementIndex < $selectableItem.length)
    ;
    $nextSelectedItem = (isWithinRange)
      ? $selectableItem.eq(elementIndex)
      : (direction == 'up')
        ? $selectableItem.first()
        : $selectableItem.last()
    ;
    if ($nextSelectedItem.length > 0) {
      this.debug('Scrolling page', direction, $nextSelectedItem);
      $currentItem.removeClass(this.settings.className.selected);
      $nextSelectedItem.addClass(this.settings.className.selected);
      if (this.settings.selectOnKeydown && this.is_single()) {
        this.set_selectedItem($nextSelectedItem);
      }
      $menu.scrollTop(newScroll);
    }
  }

  forceSelection() {
    let
      $currentlySelected = this.$item.not(this.settings.className.filtered).filter('.' + this.settings.className.selected).eq(0),
      $activeItem        = this.$item.not(this.settings.className.filtered).filter('.' + this.settings.className.active).eq(0),
      $selectedItem      = ($currentlySelected.length > 0)
        ? $currentlySelected
        : $activeItem,
      hasSelected = ($selectedItem.length > 0)
    ;
    if (this.settings.allowAdditions || (hasSelected && !this.is_multiple())) {
      this.debug('Forcing partial selection to selected item', $selectedItem);
      this.event_item_click.call(this, {currentTarget: $selectedItem}, true);
    }
    else {
      this.remove_searchTerm();
    }
  }

  search(query = this.get_query()) {
    this.verbose('Searching for query', query);
    if (this.settings.fireOnInit === false && this.is_initialLoad()) {
      this.verbose('Skipping callback on initial load', this.settings.onSearch);
    } else if (this.has_minCharacters(query) && this.settings.onSearch.call(this.element, query) !== false) {
      this.filter(query);
    }
    else {
      this.hide(null, true);
    }
  }

  filter(query) {
    let
      searchTerm = (query !== undefined)
        ? query
        : this.get_query(),
      afterFiltered = () => {
        if (this.is_multiple()) {
          this.filterActive();
        }
        if (query || (!query && this.get_activeItem().length == 0)) {
          this.select_firstUnfiltered();
        }
        if (this.has_allResultsFiltered()) {
          if (this.settings.onNoResults.call(this.element, searchTerm) ) {
            if (this.settings.allowAdditions) {
              if (this.settings.hideAdditions) {
                this.verbose('User addition with no menu, setting empty style');
                this.set_empty();
                this.hideMenu();
              }
            }
            else {
              this.verbose('All items filtered, showing message', searchTerm);
              this.add_message(this.settings.message.noResults);
            }
          }
          else {
            this.verbose('All items filtered, hiding dropdown', searchTerm);
            this.hideMenu();
          }
        }
        else {
          this.remove_empty();
          this.remove_message();
        }
        if (this.settings.allowAdditions) {
          this.add_userSuggestion(this.escape_htmlEntities(query));
        }
        if (this.is_searchSelection() && this.can_show() && this.is_focusedOnSearch() ) {
          this.show();
        }
      }
    ;
    if (this.settings.useLabels && this.has_maxSelections()) {
      return;
    }
    if (this.settings.apiSettings) {
      if (this.can_useAPI() ) {
        this.queryRemote(searchTerm, () => {
          if (this.settings.filterRemoteData) {
            this.filterItems(searchTerm);
          }
          let preSelected = this.$input.val();
          if (!Array.isArray(preSelected)) {
            preSelected = preSelected && preSelected!=="" ? preSelected.split(settings.delimiter) : [];
          }
          if (this.is_multiple()) {
            $.each(preSelected, (index, value) => {
              this.$item.filter('[data-value="'+value+'"]').addClass(this.settings.className.filtered);
            });
          }
          this.focusSearch(true);
          afterFiltered();
        });
      }
      else {
        this.error(this.settings.error.noAPI);
      }
    }
    else {
      this.filterItems(searchTerm);
      afterFiltered();
    }
  }

  filterActive() {
    if (this.settings.useLabels) {
      this.$item.filter('.' + this.settings.className.active).addClass(this.settings.className.filtered);
    }
  }

  filterItems(query = this.get_query()) {
    let
      searchTerm       = this.remove_diacritics(query),
      results          = null,
      escapedTerm      = this.escape_string(searchTerm),
      regExpFlags      = (this.settings.ignoreSearchCase ? 'i' : '') + 'gm',
      beginsWithRegExp = new RegExp('^' + escapedTerm, regExpFlags),
      module: Dropdown = this
    ;
    // avoid loop if we're matching nothing
    if (this.has_query()) {
      results = [];

      this.verbose('Searching for matching values', searchTerm);
      this.$item.each(function() {
        let
          $choice = $(this),
          text,
          value
        ;
        if ($choice.hasClass(module.settings.className.unfilterable)) {
          results.push(this);
          return true;
        }
        if (module.settings.match === 'both' || module.settings.match === 'text') {
          text = module.remove_diacritics(String(module.get_choiceText($choice, false)));
          if (text.search(beginsWithRegExp) !== -1) {
            results.push(this);
            return true;
          }
          else if (module.settings.fullTextSearch === 'exact' && module.exactSearch(searchTerm, text)) {
            results.push(this);
            return true;
          }
          else if (module.settings.fullTextSearch === true && module.fuzzySearch(searchTerm, text)) {
            results.push(this);
            return true;
          }
        }
        if (module.settings.match === 'both' || module.settings.match === 'value') {
          value = module.remove_diacritics(String(module.get_choiceValue($choice, text)));
          if (value.search(beginsWithRegExp) !== -1) {
            results.push(this);
            return true;
          }
          else if (module.settings.fullTextSearch === 'exact' && module.exactSearch(searchTerm, value)) {
            results.push(this);
            return true;
          }
          else if (module.settings.fullTextSearch === true && module.fuzzySearch(searchTerm, value)) {
            results.push(this);
            return true;
          }
        }
      });
    }
    this.debug('Showing only matched items', searchTerm);
    this.remove_filteredItem();
    if (results) {
      // TRICKY BUT WORKING MOVE...
      // this.$item
      //   .not(results)
      //   .addClass(this.settings.className.filtered)
      // ;
      results.forEach(element => {
        this.$item.each((_index, item) => {
          if (element !== item) {
            $(item).addClass(this.settings.className.filtered);
          }
        });
      });
    }

    if (!this.has_query()) {
      this.$divider.removeClass(this.settings.className.hidden);
    } else if (this.settings.hideDividers === true) {
      this.$divider.addClass(this.settings.className.hidden);
    } else if (this.settings.hideDividers === 'empty') {
      this.$divider
        .removeClass(this.settings.className.hidden)
        .filter(function() {
          // First find the last divider in this divider group
          // Dividers which are direct siblings are considered a group
          let lastDivider = $(this).nextUntil(module.settings.selector.item);

          return (lastDivider.length ? lastDivider : $(this))
          // Count all non-filtered items until the next divider (or end of the dropdown)
            .nextUntil(module.settings.selector.divider)
            .filter(module.settings.selector.item + ":not(." + module.settings.className.filtered + ")")
            // Hide divider if no items are found
            .length === 0;
        })
        .addClass(this.settings.className.hidden);
    }
  }

  queryRemote(query, callback, callbackParameters: any = {}) {
    if (!Array.isArray(callbackParameters)) {
      callbackParameters = [callbackParameters];
    }
    let
      apiSettings = {
        errorDuration : false,
        cache         : 'local',
        throttle      : this.settings.throttle,
        urlData       : {
          query: query
        },
        onError: () => {
          this.add_message(this.settings.message.serverError);
          this.iconClicked = false;
          this.focused = false;
          callback.apply(null, callbackParameters);
        },
        onFailure: () => {
          this.add_message(this.settings.message.serverError);
          this.iconClicked = false;
          this.focused = false;
          callback.apply(null, callbackParameters);
        },
        onSuccess: (response) => {
          let values = response[this.settings.fields.remoteValues];
          if (!Array.isArray(values)) {
            values = [];
          }
          this.remove_message();
          let menuConfig = {};
          menuConfig[this.settings.fields.values] = values;
          this.setup_menu(menuConfig);

          if (values.length===0 && !this.settings.allowAdditions) {
            this.add_message(this.settings.message.noResults);
          }
          else {
            let value = this.is_multiple() ? this.get_values() : this.get_value();
            if (value !== '') {
              this.verbose('Value(s) present after click icon, select value(s) in items');
              this.set_selected(value, null, null, true);
            }
          }
          this.settings.iconClicked = false;
          this.settings.focused = false;
          callback.apply(null, callbackParameters);
        }
      }
    ;
    // INVESTIGATE
    // if (!this.$element.api('get request')) {
    //   this.setup_api();
    // }
    // apiSettings = $.extend(true, {}, apiSettings, this.settings.apiSettings);
    // this.$element
    //   .api('setting', apiSettings)
    //   .api('query')
    // ;
  }

  clearItems() {
    this.$menu.empty();
    this.refreshItems();
  }

  refreshItems() {
    this.$item    = this.$menu.find(this.settings.selector.item);
    this.$divider = this.settings.hideDividers ? this.$item.parent().children(this.settings.selector.divider) : $();
  }

  determine_eventInModule(event, callback) {
    let
      $target    = $(event.target),
      inDocument = ($target.closest(document.documentElement).length > 0),
      inModule   = ($target.closest(this.$element).length > 0)
    ;
    callback = $.isFunction(callback)
      ? callback
      : () => {}
    ;
    if (inDocument && !inModule) {
      this.verbose('Triggering event', callback);
      callback();
      return true;
    }
    else {
      this.verbose('Event occurred in dropdown, canceling callback');
      return false;
    }
  }

  determine_eventOnElement(event, callback) {
    let
      $target      = $(event.target),
      $label       = $target.closest(this.settings.selector.siblingLabel),
      inVisibleDOM = document.body.contains(event.target),
      // notOnLabel   = (this.$element.find($label).length === 0 || !(this.is_multiple() && this.settings.useLabels)),
      notOnLabel   = (this.$element.find(this.settings.selector.siblingLabel).length === 0 || !(this.is_multiple() && this.settings.useLabels)),
      notInMenu    = ($target.closest(this.$menu).length === 0)
    ;
    callback = $.isFunction(callback)
      ? callback
      : () => {}
    ;
    if (inVisibleDOM && notOnLabel && notInMenu) {
      this.verbose('Triggering event', callback);
      callback.call(this);
      return true;
    }
    else {
      this.verbose('Event occurred in dropdown menu, canceling callback');
      return false;
    }
  }

  determine_selectAction($target, text, value) {
    this.selectActionActive = true;
    this.verbose('Determining action', this.settings.action);
    if ($.isFunction( this.action[this.settings.action] ) ) {
      this.verbose('Triggering preset action', this.settings.action, text, value);
      this.action[ this.settings.action ].call(this.element, text, value, $target);
    }
    else if ($.isFunction(this.settings.action)) {
      this.verbose('Triggering user action', this.settings.action, text, value);
      this.settings.action.call(this.element, text, value, $target);
    }
    else {
      this.error(this.settings.error.action, this.settings.action);
    }
    this.selectActionActive = false;
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
    let
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

  trigger_change() {
    let inputElement = this.$input[0];

    if (inputElement) {
      let events = document.createEvent('HTMLEvents');
      this.verbose('Triggering native change event');
      events.initEvent('change', true, false);
      inputElement.dispatchEvent(events);
    }
  }

  can_activate($item): boolean {
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

  can_click(): boolean {
    return (this.hasTouch || this.settings.on == 'click');
  }

  can_extendSelect(): boolean {
    return this.settings.allowAdditions || this.settings.apiSettings;
  }

  can_openDownward($subMenu): boolean {
    let
      $currentMenu    = $subMenu || this.$menu,
      canOpenDownward = true,
      onScreen: any   = {},
      calculations
    ;
    $currentMenu.addClass(this.settings.className.loading);
    calculations = {
      context: {
        offset    : (this.$context.get(0) === window)
          ? { top: 0, left: 0}
          : this.$context.offset(),
        scrollTop : (this.$context.get(0) === window) ? window.scrollY : this.$context.scrollTop(),
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
    if (this.has_subMenu($currentMenu)) {
      calculations.menu.height += $currentMenu.find(this.settings.selector.menu).first().outerHeight();
    }
    onScreen = {
      above : (calculations.context.scrollTop) <= calculations.menu.offset.top - calculations.context.offset.top - calculations.menu.height,
      below : (calculations.context.scrollTop + calculations.context.height) >= calculations.menu.offset.top - calculations.context.offset.top + calculations.menu.height
    };
    if (onScreen.below) {
      this.verbose('Dropdown can fit in context downward', onScreen);
      canOpenDownward = true;
    }
    else if (!onScreen.below && !onScreen.above) {
      this.verbose('Dropdown cannot fit in either direction, favoring downward', onScreen);
      canOpenDownward = true;
    }
    else {
      this.verbose('Dropdown cannot fit below, opening upward', onScreen);
      canOpenDownward = false;
    }
    $currentMenu.removeClass(this.settings.className.loading);
    return canOpenDownward;
  }

  can_openRightward($subMenu): boolean {
    let
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
        scrollLeft : (this.$context.get(0) === window) ? window.scrollX : this.$context.scrollLeft(),
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
      this.verbose('Dropdown cannot fit in context rightward', isOffscreenRight);
      canOpenRightward = false;
    }
    $currentMenu.removeClass(this.settings.className.loading);
    return canOpenRightward;
  }

  can_show(): boolean {
    return !this.is_disabled() && (this.has_items() || this.has_message());
  }

  can_useAPI(): boolean {
    // return $.fn.api !== undefined;
    return true;
  }

  is_active(): boolean {
    return this.$element.hasClass(this.settings.className.active);
  }

  is_allFiltered(): boolean {
    return ((this.is_multiple() || this.has_search()) && !(this.settings.hideAdditions == false && this.has_userSuggestion()) && !this.has_message() && this.has_allResultsFiltered());
  }

  is_alreadySetup(): boolean {
    return (this.$element.is('select') && this.$element.parent(this.settings.selector.dropdown).data(this.moduleNamespace) !== undefined && this.$element.prev().length === 0);
  }

  is_animating($subMenu): boolean {
    return ($subMenu)
      ? $subMenu.transition && $subMenu.transition('is animating')
      : this.$menu.transition    && this.$menu.transition('is animating')
    ;
  }

  is_animatingInward(): boolean {
    // return this.$menu.transition('is inward');
    return this.menuTransition.is_inward();
  }

  is_animatingOutward(): boolean {
    // return this.$menu.transition('is outward');
    return this.menuTransition.is_outward();
  }

  is_bubbledIconClick(event) : boolean {
    return $(event.target).closest(this.$icon).length > 0;
  }

  is_bubbledLabelClick(event): boolean {
    return $(event.target).is('select, input') && this.$element.closest('label').length > 0;
  }

  is_chrome(): boolean {
    // INVESTIGATE
    // return !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
    return false;
  }

  is_clearable(): boolean {
    return (this.$element.hasClass(this.settings.className.clearable) || this.settings.clearable);
  }

  is_disabled(): boolean {
    return this.$element.hasClass(this.settings.className.disabled);
  }

  is_focused(): boolean {
    return (document.activeElement === this.$element[0]);
  }

  is_focusedOnSearch(): boolean {
    return (document.activeElement === this.$search[0]);
  }

  is_hidden($subMenu = null): boolean {
    return !this.is_visible($subMenu);
  }

  is_horizontallyScrollableContext(): boolean {
    let overflowX = (this.$context.get(0) !== window)
      ? this.$context.css('overflow-X')
      : false
    ;
    return (overflowX == 'auto' || overflowX == 'scroll');
  }

  is_initialLoad(): boolean {
    return this.initialLoad;
  }

  is_inObject(needle, object): boolean {
    let found = false;
    $.each(object, (_index, property) => {
      if (property == needle) {
        found = true;
        return true;
      }
    });
    return found;
  }

  is_leftward($subMenu): boolean {
    let $selectedMenu = $subMenu || this.$menu;
    return $selectedMenu.hasClass(this.settings.className.leftward);
  }

  is_multiple(): boolean {
    return this.$element.hasClass(this.settings.className.multiple);
  }

  is_selectMutation(mutations): boolean {
    let selectChanged = false;
    $.each(mutations, (_index, mutation: any) => {
      if ($(mutation.target).is('select') || $(mutation.addedNodes).is('select')) {
        selectChanged = true;
        return false;
      }
    });
    return selectChanged;
  }

  is_noApiCache(): boolean {
    return this.settings.apiSettings && !this.settings.apiSettings.cache
  }

  is_remote(): boolean {
    return this.settings.apiSettings && this.can_useAPI();
  }

  is_search(): boolean {
    return this.$element.hasClass(this.settings.className.search);
  }

  is_searchSelection(): boolean {
    return (this.has_search() && this.$search.parent(this.settings.selector.dropdown).length === 1 );
  }

  is_selection(): boolean {
    return this.$element.hasClass(this.settings.className.selection);
  }

  is_single(): boolean {
    return !this.is_multiple();
  }

  is_upward($menu): boolean {
    let $element = $menu || this.$element;
    return $element.hasClass(this.settings.className.upward);
  }

  is_userValue(value): boolean {
    // return ($.inArray(value, this.get_userValues()) !== -1);
    return (this.get_userValues().indexOf(value) !== -1);
  }

  is_verticallyScrollableContext(): boolean {
    let overflowY = (this.$context.get(0) !== window)
      ? this.$context.css('overflow-y')
      : false
    ;
    return (overflowY == 'auto' || overflowY == 'scroll');
  }

  is_visible($subMenu: Cash = null): boolean {
    return ($subMenu)
      ? $subMenu.hasClass(this.settings.className.visible)
      : this.$menu.hasClass(this.settings.className.visible)
    ;
  }

  has_allResultsFiltered(): boolean {
    let $normalResults = this.$item.not(this.settings.selector.addition);
    return ($normalResults.filter(this.settings.selector.unselectable).length === $normalResults.length);
  }

  has_clearItem(): boolean {
    return (this.$clear.length > 0);
  }

  has_firstLetter($item, letter): boolean {
    let
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

  has_input(): boolean {
    return (this.$input.length > 0);
  }

  has_items(): boolean {
    return (this.$item.length > 0);
  }

  has_label(value): boolean {
    let
      escapedValue = this.escape_value(value),
      $labels      = this.$element.find(this.settings.selector.label)
    ;
    if (this.settings.ignoreCase) {
      escapedValue = escapedValue.toLowerCase();
    }
    return ($labels.filter('[data-' + this.settings.metadata.value + '="' + this.escape_string(escapedValue) +'"]').length > 0);
  }

  has_maxSelections(): boolean {
    return (this.settings.maxSelections && this.get_selectionCount() >= this.settings.maxSelections);
  }

  has_menu(): boolean {
    return (this.$menu.length > 0);
  }

  has_menuSearch(): boolean {
    return (this.has_search() && this.$search.closest(this.$menu).length > 0);
  }

  has_message(): boolean {
    return (this.$menu.children(this.settings.selector.message).length !== 0);
  }

  has_minCharacters(searchTerm): boolean {
    if (this.settings.minCharacters && !this.iconClicked) {
      searchTerm = (searchTerm !== undefined)
        ? String(searchTerm)
        : String(this.get_query())
      ;
      return (searchTerm.length >= this.settings.minCharacters);
    }
    this.iconClicked = false;
    return true;
  }
  has_query(): boolean {
    return (this.get_query() !== '');
  }

  has_search(): boolean {
    return (this.$search.length > 0);
  }

  has_selectInput(): boolean {
    return (this.$input.is('select'));
  }

  has_sizer(): boolean {
    return (this.$sizer.length > 0);
  }

  has_subMenu($currentMenu): boolean {
    return ($currentMenu || this.$menu).find(this.settings.selector.menu).length > 0;
  }

  has_userSuggestion(): boolean {
    return (this.$menu.children(this.settings.selector.addition).length > 0);
  }

  has_value(value): boolean {
    return (this.settings.ignoreCase)
      ? this.has_valueIgnoringCase(value)
      : this.has_valueMatchingCase(value)
    ;
  }

  has_valueIgnoringCase(value): boolean {
    let
      values   = this.get_values(true),
      hasValue = false
    ;
    if (!Array.isArray(values)) {
      values = [values];
    }
    $.each(values, function(index, existingValue) {
      if (String(value).toLowerCase() == String(existingValue).toLowerCase()) {
        hasValue = true;
        return false;
      }
    });
    return hasValue;
  }

  has_valueMatchingCase(value): boolean {
    let
      values   = this.get_values(true),
      hasValue = Array.isArray(values)
        // ? values && ($.inArray(value, values) !== -1)
        ? values && (values.indexOf(value) !== -1)
        : (values == value)
    ;
    return (hasValue)
      ? true
      : false
    ;
  }

  get_activeItem() {
    return this.$item.filter('.'  + this.settings.className.active);
  }

  get_caretPosition(returnEndPos) {
    let
      input: any = this.$search.get(0),
      range,
      rangeLength
    ;
    if (returnEndPos && 'selectionEnd' in input) {
      return input.selectionEnd;
    }
    else if (!returnEndPos && 'selectionStart' in input) {
      return input.selectionStart;
    }
    if (document.selection) {
      input.focus();
      range       = document.selection.createRange();
      rangeLength = range.text.length;
      if (returnEndPos) {
        return rangeLength;
      }
      range.moveStart('character', -input.value.length);
      return range.text.length - rangeLength;
    }
  }

  get_choiceText($choice, preserveHTML: boolean = this.settings.preserveHTML) {
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
          ? $choice.html() && $choice.html().trim()
          : $choice.text() && $choice.text().trim()
      ;
    }
  }

  get_choiceValue($choice, choiceText: string = this.get_choiceText($choice)) {
    if (!$choice) {
      return false;
    }
    return ($choice.data(this.settings.metadata.value) !== undefined)
      ? String( $choice.data(this.settings.metadata.value) )
      : (typeof choiceText === 'string')
        ? String(
          this.settings.ignoreSearchCase
          ? choiceText.toLowerCase()
          : choiceText
        ).trim()
        : String(choiceText)
    ;
  }

  get_defaultText() {
    return this.$element.data(this.settings.metadata.defaultText);
  }

  get_defaultValue() {
    return this.$element.data(this.settings.metadata.defaultValue);
  }

  get_displayType(): string {
    return this.$element.hasClass('column') ? 'flex' : this.settings.displayType;
  }

  get_id() {
    return this.id;
  }

  get_inputEvent() {
    let input: any = this.$search[0];
    if (input) {
      return (input.oninput !== undefined)
        ? 'input'
        : (input.onpropertychange !== undefined)
          ? 'propertychange'
          : 'keyup'
      ;
    }
    return false;
  }

  get_item(value, strict: boolean = false) {
    let
      $selectedItem: any = false,
      shouldSearch,
      isMultiple
    ;
    value = (value !== undefined)
      ? value
      : ( this.get_values() !== undefined)
        ? this.get_values()
        : this.get_text()
    ;
    isMultiple = (this.is_multiple() && Array.isArray(value));
    shouldSearch = (isMultiple)
      ? (value.length > 0)
      : (value !== undefined && value !== null)
    ;
    strict     = (value === '' || value === false  || value === true)
      ? true
      : strict || false
    ;
    if (shouldSearch) {
      let module = this;

      this.$item.each(function() {
        let
          $choice            = $(this),
          optionText         = module.get_choiceText($choice),
          optionValue: any   = module.get_choiceValue($choice, optionText)
        ;
        // safe early exit
        if (optionValue === null || optionValue === undefined) {
          return;
        }
        if (isMultiple) {
          // if ($.inArray(module.escape_htmlEntities(String(optionValue)), value.map(function(v) {return String(v);})) !== -1) {
          if (value.map((v) => {return String(v);}).indexOf(module.escape_htmlEntities(String(optionValue))) !== -1) {
            $selectedItem = ($selectedItem)
              ? $selectedItem.add($choice)
              : $choice
            ;
          }
        }
        else if (strict) {
          module.verbose('Ambiguous dropdown value using strict type check', $choice, value);
          if (optionValue === value) {
            $selectedItem = $choice;
            return true;
          }
        }
        else {
          if (module.settings.ignoreCase) {
            optionValue = optionValue.toLowerCase();
            value = value.toLowerCase();
          }
          if (module.escape_htmlEntities(String(optionValue)) === module.escape_htmlEntities(String(value))) {
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
    let
      $items       = this.get_item(value),
      $userItems   = this.create_userChoice(value),
      hasUserItems = ($userItems && $userItems.length > 0)
    ;
    if (hasUserItems) {
      $items = ($items.length > 0)
        ? $items.add($userItems)
        : $userItems
      ;
    }
    return $items;
  }

  get_placeholderText(): string {
    if (this.settings.placeholder != 'auto' && typeof this.settings.placeholder == 'string') {
      return this.settings.placeholder;
    }
    return this.$element.data(this.settings.metadata.placeholderText) || '';
  }

  get_query(): string {
    return String(this.$search.val()).trim();
  }

  get_remoteValues() {
    let
      values = this.get_values(),
      remoteValues: any = false
    ;
    if (values) {
      if (typeof values == 'string') {
        values = [values];
      }
      $.each(values, (_index, value) =>{
        let name = this.read_remoteData(value);
        this.verbose('Restoring value from session data', name, value);
        if (name) {
          if (!remoteValues) {
            remoteValues = {};
          }
          remoteValues[value] = name;
        }
      });
    }
    return remoteValues;
  }

  get_searchWidth(value = undefined) {
    value = (value !== undefined)
      ? value
      : this.$search.val()
    ;
    this.$sizer.text(value);
    // prevent rounding issues
    return Math.ceil( this.$sizer.width() + 1);
  }

  get_selectedItem() {
    let
      $selectedItem = this.$item.not(this.settings.selector.unselectable).filter('.'  + this.settings.className.selected)
    ;
    return ($selectedItem.length > 0)
      ? $selectedItem
      : this.$item.eq(0)
    ;
  }

  get_selectionCount(): number {
    let
      values = this.get_values(),
      count: number
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

  get_selectValues() {
    let
      select = { placeholder: ''},
      oldGroup: any = [],
      values = [],
      module = this;
    ;
    this.$element.find('option').each(function() {
      let
        $option  = $(this),
        name     = $option.html(),
        disabled = $option.attr('disabled'),
        value    = ( $option.attr('value') !== undefined )
          ? $option.attr('value')
          : name,
        text     = ( $option.data(module.settings.metadata.text) !== undefined )
          ? $option.data(module.settings.metadata.text)
          : name,
        group = $option.parent('optgroup')
      ;
      if (module.settings.placeholder === 'auto' && value === '') {
        select.placeholder = name;
      }
      else {
        if (group.length !== oldGroup.length || group[0] !== oldGroup[0]) {
          values.push({
            type: 'header',
            divider: settings.headerDivider,
            name: group.attr('label') || ''
          });
          oldGroup = group;
        }
        values.push({
          name     : name,
          value    : value,
          text     : text,
          disabled : disabled
        });
      }
    });
    if (this.settings.placeholder && this.settings.placeholder !== 'auto') {
      this.debug('Setting placeholder value to', this.settings.placeholder);
      select.placeholder = this.settings.placeholder;
    }
    if (this.settings.sortSelect) {
      if (this.settings.sortSelect === true) {
        values.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });
      } else if (this.settings.sortSelect === 'natural') {
        values.sort((a, b) => {
          return (a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        });
      } else if ($.isFunction(this.settings.sortSelect)) {
        values.sort(this.settings.sortSelect);
      }
      select[this.settings.fields.values] = values;
      this.debug('Retrieved and sorted values from select', select);
    }
    else {
      select[this.settings.fields.values] = values;
      this.debug('Retrieved values from select', select);
    }
    return select;
  }

  get_text(): string {
    return this.settings.preserveHTML ? this.$text.html() : this.$text.text();
  }

  get_transition($subMenu) {
    return (this.settings.transition === 'auto')
      ? this.is_upward($subMenu)
        ? 'slide up'
        : 'slide down'
      : this.settings.transition
    ;
  }

  get_uniqueArray(array) {
    // return $.grep(array, function (value, index) {
    return array.filter((value, index) => {
      // return $.inArray(value, array) === index;
      return array.indexOf(value) === index;
  });
  }

  get_userValues() {
    let values = this.get_values();

    if (!values) {
      // return false;
      return [];
    }
    values = Array.isArray(values)
      ? values
      : [values]
    ;
    return values.filter((value) => {
      return (this.get_item(value) === false);
    });
  }

  get_value(): string {
    let
      value = (this.$input.length > 0)
        ? this.$input.val()
        : this.$element.data(this.settings.metadata.value),
      isEmptyMultiselect = (Array.isArray(value) && value.length === 1 && value[0] === '')
    ;
    // prevents placeholder element from being selected when multiple
    return (value === undefined || isEmptyMultiselect)
      ? ''
      : value
    ;
  }

  get_values(raw: boolean = false) {
    let value = this.get_value();

    if (value === '') {
      return '';
    }
    return ( !this.has_selectInput() && this.is_multiple() )
      ? (typeof value == 'string') // delimited string
        ? (raw ? value : this.escape_htmlEntities(value)).split(this.settings.delimiter)
        : ''
      : value
    ;
  }

  read_remoteData(value) {
    let name;

    if (window.Storage === undefined) {
      this.error(this.settings.error.noStorage);
      return;
    }
    name = sessionStorage.getItem(value);
    return (name !== undefined)
      ? name
      : false
    ;
  }

  set_active() {
    this.$element.addClass(this.settings.className.active);
  }

  set_activeItem($item) {
    if (this.settings.allowAdditions && $item.filter(this.settings.selector.addition).length > 0 ) {
      $item.addClass(this.settings.className.filtered);
    }
    else {
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
      }
      else {
        this.set_upward($menu);
      }
      if (!this.is_leftward($menu) && !this.can_openRightward($menu)) {
        this.set_leftward($menu);
      }
    }
    else if (this.settings.direction == 'upward') {
      this.set_upward($menu);
    }
  }

  set_empty() {
    this.$element.addClass(this.settings.className.empty);
  }

  set_exactly(value, $selectedItem) {
    this.debug('Setting selected to exact values');
    this.clear();
    this.set_selected(value, $selectedItem);
  }

  set_filtered() {
    let
      isMultiple       = this.is_multiple(),
      isSearch         = this.is_searchSelection(),
      isSearchMultiple = (isMultiple && isSearch),
      searchValue      = (isSearch)
        ? this.get_query()
        : '',
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
    }
    else if (!isMultiple || (isSearchMultiple && !valueIsSet)) {
      this.verbose('Showing placeholder text');
      this.$text.removeClass(this.settings.className.filtered);
    }
  }

  set_initialLoad() {
    this.verbose('Setting initial load');
    this.initialLoad = true;
  }

  set_leftward($currentMenu) {
    let $element = $currentMenu || this.$menu;
    $element.addClass(this.settings.className.leftward);
  }

  set_loading() {
    this.$element.addClass(this.settings.className.loading);
  }

  set_multiple() {
    this.$element.addClass(this.settings.className.multiple);
  }

  set_partialSearch(text) {
    let length = this.get_query().length;
    this.$search.val(text.substr(0, length));
  }

  set_placeholderText(text: string = '') {
    text = text || this.get_placeholderText();
    this.debug('Setting placeholder text', text);
    this.set_text(text);
    this.$text.addClass(this.settings.className.placeholder);
  }

  set_scrollPosition($item, forceScroll: boolean = false) {
    let
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
    if (this.get_activeItem().length === 0) {
      forceScroll = false;
    }
    if ($item && $menu.length > 0 && hasActive) {
      itemOffset = $item.position().top;

      $menu.addClass(this.settings.className.loading);
      menuScroll = $menu[0].scrollTop;
      menuOffset = $menu.offset().top;
      itemOffset = $item.offset().top;
      offset     = menuScroll - menuOffset + itemOffset;
      if (!forceScroll) {
        menuHeight = $menu.height();
        belowPage  = menuScroll + menuHeight < (offset + edgeTolerance);
        abovePage  = ((offset - edgeTolerance) < menuScroll);
      }
      this.debug('Scrolling to active item', offset);
      if (forceScroll || abovePage || belowPage) {
        $menu[0].scrollTop = offset;
      }
      $menu.removeClass(this.settings.className.loading);
    }
  }

  set_selected(value = null, $selectedItem = null , preventChangeTrigger: boolean = false, keepSearchTerm: boolean = false) {
    let isMultiple = this.is_multiple();
    $selectedItem = (this.settings.allowAdditions)
      ? $selectedItem || this.get_itemWithAdditions(value)
      : $selectedItem || this.get_item(value)
    ;
    if (!$selectedItem) {
      return;
    }
    this.debug('Setting selected menu item to', $selectedItem);
    if (this.is_multiple()) {
      this.remove_searchWidth();
    }
    if (this.is_single()) {
      this.remove_activeItem();
      this.remove_selectedItem();
    }
    else if (this.settings.useLabels) {
      this.remove_selectedItem();
    }

    let module = this;

    // select each item
    $selectedItem.each(function() {
      let
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
          if (module.settings.apiSettings && module.settings.saveRemoteData) {
            module.save_remoteData(selectedText, selectedValue);
          }
          if (module.settings.useLabels) {
            module.add_label(selectedValue, selectedText, shouldAnimate);
            module.add_value(selectedValue, selectedText, $selected);
            module.set_activeItem($selected);
            module.filterActive();
            module.select_nextAvailable($selectedItem);
          }
          else {
            module.add_value(selectedValue, selectedText, $selected);
            module.set_text(module.add_variables(module.settings.message.count));
            module.set_activeItem($selected);
          }
        }
        else if (!isFiltered && (settings.useLabels || this.selectActionActive)) {
          module.debug('Selected active value, removing label');
          module.remove_selected(selectedValue);
        }
      }
      else {
        if (module.settings.apiSettings && module.settings.saveRemoteData) {
          module.save_remoteData(selectedText, selectedValue);
        }
        if (!keepSearchTerm) {
          module.set_text(selectedText);
        }
        module.set_value(selectedValue, selectedText, $selected, preventChangeTrigger);
        $selected
          .addClass(module.settings.className.active)
          .addClass(module.settings.className.selected)
        ;
      }
    });
    if (!keepSearchTerm) {
      this.remove_searchTerm();
    }
  }

  set_selectedItem($item) {
    let
      value      = this.get_choiceValue($item),
      searchText = this.get_choiceText($item, false),
      text       = this.get_choiceText($item, true)
    ;
    this.debug('Setting user selection to item', $item);
    this.remove_activeItem();
    this.set_partialSearch(searchText);
    this.set_activeItem($item);
    this.set_selected(value, $item);
    this.set_text(text);
  }

  set_selectedLetter(letter) {
    let
      $selectedItem         = this.$item.filter('.' + this.settings.className.selected),
      alreadySelectedLetter = $selectedItem.length > 0 && this.has_firstLetter($selectedItem, letter),
      $nextValue: any       = false,
      $nextItem
    ;
    // check next of same letter
    if (alreadySelectedLetter) {
      $nextItem = $selectedItem.nextAll(this.$item).eq(0);
      if (this.has_firstLetter($nextItem, letter) ) {
        $nextValue  = $nextItem;
      }
    }
    // check all values
    if (!$nextValue) {
      let module = this;
      this.$item.each(function() {
        if (module.has_firstLetter($(this), letter)) {
          $nextValue = $(this);
          return false;
        }
      });
    }
    // set next value
    if ($nextValue) {
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
    if (this.is_searchSelection() ) {
      this.debug('Added tabindex to searchable dropdown');
      this.$search.val('');
      this.check_disabled();
      this.$menu.attr('tabindex', '-1');
    }
    else {
      this.debug('Added tabindex to dropdown');
      if (this.$element.attr('tabindex') === undefined) {
        this.$element.attr('tabindex', '0');
        this.$menu.attr('tabindex', '-1');
      }
    }
  }

  set_text(text: string) {
    if (this.settings.action === 'combo') {
      this.debug('Changing combo button text', text, this.$combo);
      if (this.settings.preserveHTML) {
        this.$combo.html(text);
      }
      else {
        this.$combo.text(text);
      }
    }
    else if (this.settings.action === 'activate') {
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

  set_upward($currentMenu) {
    let $element = $currentMenu || this.$element;
    $element.addClass(this.settings.className.upward);
  }

  set_value(value, text = value, $selected, preventChangeTrigger: boolean = false) {
    if (value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) {
      this.$input.removeClass(this.settings.className.noselection);
    } else {
      this.$input.addClass(this.settings.className.noselection);
    }
    let
      escapedValue = this.escape_value(value),
      hasInput     = (this.$input.length > 0),
      currentValue = this.get_values(),
      stringValue  = (value !== undefined)
        ? String(value)
        : value,
      newValue
    ;
    if (hasInput) {
      if (!settings.allowReselection && stringValue == currentValue) {
        this.verbose('Skipping value update already same value', value, currentValue);
        if (!this.is_initialLoad()) {
          return;
        }
      }

      if (this.is_single() && this.has_selectInput() && this.can_extendSelect()) {
        this.debug('Adding user option', value);
        this.add_optionValue(value);
      }
      this.debug('Updating input value', escapedValue, currentValue);
      this.internalChange = true;
      this.$input.val(escapedValue);
      if (this.settings.fireOnInit === false && this.is_initialLoad()) {
        this.debug('Input native change event ignored on initial load');
      }
      else if (preventChangeTrigger !== true) {
        this.trigger_change();
      }
      this.internalChange = false;
    }
    else {
      this.verbose('Storing value in metadata', escapedValue, this.$input);
      if (escapedValue !== currentValue) {
        this.$element.data(this.settings.metadata.value, stringValue);
      }
    }
    if (this.settings.fireOnInit === false && this.is_initialLoad()) {
      this.verbose('No callback on initial load', this.settings.onChange);
    }
    else if (preventChangeTrigger !== true) {
      settings.onChange.call(this.element, value, text, $selected);
    }
  }

  set_visible() {
    this.$element.addClass(this.settings.className.visible);
  }

  add_label(value, text, shouldAnimate: boolean = false) {
    let
      $next  = this.is_searchSelection()
        ? this.$search
        : this.$text,
      escapedValue = this.escape_value(value),
      $label
    ;
    if (this.settings.ignoreCase) {
      escapedValue = escapedValue.toLowerCase();
    }
    $label = $('<a />')
      .html(this.settings.templates.label(escapedValue, text, this.settings.preserveHTML, this.settings.className))
      .addClass(this.settings.className.label)
      .attr('data-' + this.settings.metadata.value, escapedValue)
    ;
    $label = this.settings.onLabelCreate.call($label, escapedValue, text);

    if (this.has_label(value)) {
      this.debug('User selection already exists, skipping', escapedValue);
      return;
    }
    if (this.settings.label.variation) {
      $label.addClass(this.settings.label.variation);
    }
    if (shouldAnimate === true) {
      this.debug('Animating in label', $label);
      // $label
      //   .addClass(this.settings.className.hidden)
      //   .insertBefore($next)
      //   .transition({
      //     animation  : settings.label.transition,
      //     debug      : settings.debug,
      //     verbose    : settings.verbose,
      //     duration   : settings.label.duration
      //   })
      // ;

      let $lbl = $label
        .addClass(this.settings.className.hidden)
        .insertBefore($next)
      ;

      new Transition($lbl, {
        animation  : this.settings.label.transition,
        debug      : this.settings.debug,
        verbose    : this.settings.verbose,
        duration   : this.settings.label.duration
      });
    }
    else {
      this.debug('Adding selection label', $label);
      $label.insertBefore($next);
    }
  }

  add_message(message: string) {
    let
      $message = this.$menu.children(this.settings.selector.message),
      html     = this.settings.templates.message(this.add_variables(message))
    ;
    if ($message.length > 0) {
      $message.html(html);
    }
    else {
      $message = $('<div/>')
        .html(html)
        .addClass(this.settings.className.message)
        .appendTo(this.$menu)
      ;
    }
  }

  add_optionValue(value) {
    let
      escapedValue = this.escape_value(value),
      $option      = this.$input.find('option[value="' + this.escape_string(escapedValue) + '"]'),
      hasOption    = ($option.length > 0)
    ;
    if (hasOption) {
      return;
    }
    // temporarily disconnect observer
    this.disconnect_selectObserver();
    if (this.is_single()) {
      this.verbose('Removing previous user addition');
      this.$input.find('option.' + this.settings.className.addition).remove();
    }
    $('<option/>')
      .prop('value', escapedValue)
      .addClass(this.settings.className.addition)
      .html(value)
      .appendTo(this.$input)
    ;
    this.verbose('Adding user addition as an <option>', value);
    this.observe_select();
  }

  add_userSuggestion(value) {
    let
      $addition         = this.$menu.children(this.settings.selector.addition),
      $existingItem     = this.get_item(value),
      alreadyHasValue   = $existingItem && $existingItem.not(this.settings.selector.addition).length,
      hasUserSuggestion = $addition.length > 0,
      html
    ;
    if (this.settings.useLabels && this.has_maxSelections()) {
      return;
    }
    if (value === '' || alreadyHasValue) {
      $addition.remove();
      return;
    }
    if (hasUserSuggestion) {
      $addition
        .data(this.settings.metadata.value, value)
        .data(this.settings.metadata.text, value)
        .attr('data-' + this.settings.metadata.value, value)
        .attr('data-' + this.settings.metadata.text, value)
        .removeClass(this.settings.className.filtered)
      ;
      if (!this.settings.hideAdditions) {
        html = this.settings.templates.addition(this.add_variables(this.settings.message.addResult, value));
        $addition.html(html);
      }
      this.verbose('Replacing user suggestion with new value', $addition);
    }
    else {
      $addition = this.create_userChoice(value);
      $addition.prependTo(this.$menu);
      this.verbose('Adding item choice to menu corresponding with user choice addition', $addition);
    }
    if (!this.settings.hideAdditions || this.is_allFiltered()) {
      $addition
        .addClass(this.settings.className.selected)
        .siblings()
        .removeClass(this.settings.className.selected)
      ;
    }
    this.refreshItems();
  }

  add_value(addedValue, addedText, $selectedItem) {
    let
      currentValue = this.get_values(true),
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
    if (Array.isArray(currentValue)) {
      newValue = currentValue.concat([addedValue]);
      newValue = this.get_uniqueArray(newValue);
    }
    else {
      newValue = [addedValue];
    }
    // add values
    if (this.has_selectInput()) {
      if (this.can_extendSelect()) {
        this.debug('Adding value to select', addedValue, newValue, this.$input);
        this.add_optionValue(addedValue);
      }
    }
    else {
      newValue = newValue.join(settings.delimiter);
      this.debug('Setting hidden input to delimited value', newValue, this.$input);
    }

    if (this.settings.fireOnInit === false && this.is_initialLoad()) {
      this.verbose('Skipping onadd callback on initial load', settings.onAdd);
    }
    else {
      this.settings.onAdd.call(this.element, addedValue, addedText, $selectedItem);
    }
    this.set_value(newValue, addedText, $selectedItem);
    this.check_maxSelections();
  }

  add_variables(message: string, term = '') {
    let
      hasCount    = (message.search('{count}') !== -1),
      hasMaxCount = (message.search('{maxCount}') !== -1),
      hasTerm     = (message.search('{term}') !== -1),
      count,
      query
    ;
    this.verbose('Adding templated variables to message', message);
    if (hasCount) {
      count  = this.get_selectionCount();
      message = message.replace('{count}', count);
    }
    if (hasMaxCount) {
      count  = this.get_selectionCount();
      message = message.replace('{maxCount}', this.settings.maxSelections);
    }
    if (hasTerm) {
      query   = term || this.get_query();
      message = message.replace('{term}', query);
    }
    return message;
  }

  refresh() {
    this.refreshSelectors();
    this.refreshData();
  }

  refreshData() {
    this.verbose('Refreshing cached metadata');
    this.$item
      .removeAttr(this.settings.metadata.text)
      .removeAttr(this.settings.metadata.value)
    ;
  }

  refreshSelectors() {
    this.verbose('Refreshing selector cache');
    this.$text   = this.$element.find(this.settings.selector.text);
    this.$search = this.$element.find(this.settings.selector.search);
    this.$input  = this.$element.find(this.settings.selector.input);
    this.$icon   = this.$element.find(this.settings.selector.icon);
    this.$combo  = (this.$element.prev().find(this.settings.selector.text).length > 0)
      ? this.$element.prev().find(this.settings.selector.text)
      : this.$element.prev()
    ;
    this.$menu    = this.$element.children(this.settings.selector.menu);
    this.$item    = this.$menu.find(this.settings.selector.item);
    this.$divider = this.settings.hideDividers ? this.$item.parent().children(this.settings.selector.divider) : $();
  }

  change_values(values): void {
    if (!this.settings.allowAdditions) {
      this.clear();
    }
    this.debug('Creating dropdown with specified values', values);
    let menuConfig = {};
    menuConfig[this.settings.fields.values] = values;
    this.setup_menu(menuConfig);
    $.each(values, (_index, item: any) => {
      if (item.selected == true) {
        this.debug('Setting initial selection to', item[this.settings.fields.value]);
        this.set_selected(item[this.settings.fields.value]);
        if (!this.is_multiple()) {
          return false;
        }
      }
    });

    if (this.has_selectInput()) {
      this.disconnect_selectObserver();
      this.$input.html('');
      this.$input.append('<option disabled selected value></option>');
      $.each(values, (_index, item) => {
        let
          value = this.settings.templates.deQuote(item[this.settings.fields.value]),
          name = this.settings.templates.escape(
            item[this.settings.fields.name] || '',
            settings.preserveHTML
          )
        ;
        this.$input.append('<option value="' + value + '">' + name + '</option>');
      });
      this.observe_select();
    }
  }

  clear(preventChangeTrigger: boolean = false) {
    if (this.is_multiple() && this.settings.useLabels) {
      this.remove_labels(this.$element.find(this.settings.selector.label), preventChangeTrigger);
    }
    else {
      this.remove_activeItem();
      this.remove_selectedItem();
      this.remove_filteredItem();
    }
    this.set_placeholderText();
    this.clearValue(preventChangeTrigger);
  }

  clearData() {
    this.verbose('Clearing metadata');
    this.$item
      .removeAttr(this.settings.metadata.text)
      .removeAttr(this.settings.metadata.value)
    ;
    this.$element
      .removeAttr(this.settings.metadata.defaultText)
      .removeAttr(this.settings.metadata.defaultValue)
      .removeAttr(this.settings.metadata.placeholderText)
    ;
  }

  clearValue(preventChangeTrigger) {
    this.set_value('', null, null, preventChangeTrigger);
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

  remove_activeLabels($activeLabels = this.$element.find(this.settings.selector.label).filter('.' + this.settings.className.active)) {
    this.verbose('Removing active label selections', $activeLabels);
    this.remove_labels($activeLabels);
  }

  remove_arrayValue(removedValue, values) {
    if (!Array.isArray(values)) {
      values = [values];
    }
    // values = $.grep(values, function(value) {
    //   return (removedValue != value);
    // });
    values = values.filter((value) => {
      return (removedValue != value);
    });
    this.verbose('Removed value from delimited string', removedValue, values);
    return values;
  }

  remove_diacritics(text: string) {
    return this.settings.ignoreDiacritics ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text;
  }

  remove_empty() {
    this.$element.removeClass(this.settings.className.empty);
  }

  remove_filteredItem() {
    if (this.settings.useLabels && this.has_maxSelections() ) {
      return;
    }
    if (settings.useLabels && this.is_multiple()) {
      this.$item.not('.' + this.settings.className.active).removeClass(this.settings.className.filtered);
    }
    else {
      this.$item.removeClass(this.settings.className.filtered);
    }
    if (settings.hideDividers) {
      this.$divider.removeClass(this.settings.className.hidden);
    }
    this.remove_empty();
  }

  remove_initialLoad() {
    this.initialLoad = false;
  }

  remove_label(value) {
    let
      escapedValue  = this.escape_value(value),
      $labels       = this.$element.find(this.settings.selector.label),
      $removedLabel = $labels.filter('[data-' + this.settings.metadata.value + '="' + this.escape_string(this.settings.ignoreCase ? escapedValue.toLowerCase() : escapedValue) +'"]')
    ;
    this.verbose('Removing label', $removedLabel);
    $removedLabel.remove();
  }

  remove_labels($labels, preventChangeTrigger: boolean = false) {
    $labels = $labels || this.$element.find(this.settings.selector.label);
    this.verbose('Removing labels', $labels);

    let module = this;

    $labels.each(function() {
      let
        $label      = $(this),
        value       = $label.data(module.settings.metadata.value),
        stringValue = (value !== undefined)
          ? String(value)
          : value,
        isUserValue = module.is_userValue(stringValue)
      ;
      if (module.settings.onLabelRemove.call($label, value) === false) {
        module.debug('Label remove callback cancelled removal');
        return;
      }
      module.remove_message();
      if (isUserValue) {
        module.remove_value(stringValue, stringValue, this.get_item(stringValue), preventChangeTrigger);
        module.remove_label(stringValue);
      }
      else {
        // selected will also remove label
        module.remove_selected(stringValue, false, preventChangeTrigger);
      }
    });
  }

  remove_lefward($currentMenu) {
    let $element = $currentMenu || this.$menu;
    $element.removeClass(this.settings.className.leftward);
  }

  remove_loading() {
    this.$element.removeClass(this.settings.className.loading);
  }

  remove_message() {
    this.$menu.children(this.settings.selector.message).remove();
  }

  remove_optionValue(value) {
    let
      escapedValue = this.escape_value(value),
      $option      = this.$input.find('option[value="' + this.escape_string(escapedValue) + '"]'),
      hasOption    = ($option.length > 0)
    ;
    if (!hasOption || !$option.hasClass(this.settings.className.addition)) {
      return;
    }
    // temporarily disconnect observer
    if (this.selectObserver) {
      this.selectObserver.disconnect();
      this.verbose('Temporarily disconnecting mutation observer');
    }
    $option.remove();
    this.verbose('Removing user addition as an <option>', escapedValue);
    if (this.selectObserver) {
      this.selectObserver.observe(this.$input[0], {
        childList : true,
        subtree   : true
      });
    }
  }

  remove_searchTerm() {
    this.verbose('Cleared search term');
    this.$search.val('');
    this.set_filtered();
  }

  remove_searchWidth() {
    this.$search.css('width', '');
  }

  remove_selected(value, $selectedItem = null, preventChangeTrigger: boolean = false) {
    $selectedItem = (this.settings.allowAdditions)
      ? $selectedItem || this.get_itemWithAdditions(value)
      : $selectedItem || this.get_item(value)
    ;

    if (!$selectedItem) {
      return false;
    }

    let module = this;

    $selectedItem.each(function() {
      let
        $selected     = $(this),
        selectedText  = module.get_choiceText($selected),
        selectedValue = module.get_choiceValue($selected, selectedText)
      ;
      if (module.is_multiple()) {
        if (module.settings.useLabels) {
          module.remove_value(selectedValue, selectedText, $selected, preventChangeTrigger);
          module.remove_label(selectedValue);
        }
        else {
          module.remove_value(selectedValue, selectedText, $selected, preventChangeTrigger);
          if (module.get_selectionCount() === 0) {
            module.set_placeholderText();
          }
          else {
            module.set_text(module.add_variables(module.settings.message.count));
          }
        }
      }
      else {
        module.remove_value(selectedValue, selectedText, $selected, preventChangeTrigger);
      }
      $selected
        .removeClass(module.settings.className.filtered)
        .removeClass(module.settings.className.active)
      ;
      if (settings.useLabels) {
        $selected.removeClass(module.settings.className.selected);
      }
    });
  }

  remove_selectedItem() {
    this.$item.removeClass(this.settings.className.selected);
  }

  remove_tabbable() {
    if (this.is_searchSelection() ) {
      this.debug('Searchable dropdown initialized');
      this.$search.removeAttr('tabindex');
      this.$menu.removeAttr('tabindex');
    }
    else {
      this.debug('Simple selection dropdown initialized');
      this.$element.removeAttr('tabindex');
      this.$menu.removeAttr('tabindex');
    }
  }

  remove_upward($currentMenu: Cash = this.$element) {
    $currentMenu.removeClass(this.settings.className.upward);
  }

  remove_userAddition() {
    this.$item.filter(this.settings.selector.addition).remove();
  }

  remove_value(removedValue, removedText, $removedItem, preventChangeTrigger) {
    let
      values = this.get_values(),
      newValue
    ;
    removedValue = this.escape_htmlEntities(removedValue);
    if (this.has_selectInput()) {
      this.verbose('Input is <select> removing selected option', removedValue);
      newValue = this.remove_arrayValue(removedValue, values);
      this.remove_optionValue(removedValue);
    }
    else {
      this.verbose('Removing from delimited values', removedValue);
      newValue = this.remove_arrayValue(removedValue, values);
      newValue = newValue.join(this.settings.delimiter);
    }
    if (this.settings.fireOnInit === false && this.is_initialLoad()) {
      this.verbose('No callback on initial load', this.settings.onRemove);
    }
    else {
      this.settings.onRemove.call(this.element, removedValue, removedText, $removedItem);
    }
    this.set_value(newValue, removedText, $removedItem, preventChangeTrigger);
    this.check_maxSelections();
  }

  remove_visible() {
    this.$element.removeClass(this.settings.className.visible);
  }

  save_defaults() {
    this.save_defaultText();
    this.save_placeholderText();
    this.save_defaultValue();
  }

  save_defaultText() {
    let text = this.get_text();
    this.verbose('Saving default text as', text);
    this.$element.data(this.settings.metadata.defaultText, text);
  }

  save_defaultValue() {
    let value = this.get_value();
    this.verbose('Saving default value as', value);
    this.$element.data(this.settings.metadata.defaultValue, value);
  }

  save_placeholderText() {
    let text: string;
    if (this.settings.placeholder !== false && this.$text.hasClass(this.settings.className.placeholder)) {
      text = this.get_text();
      this.verbose('Saving placeholder text as', text);
      this.$element.data(this.settings.metadata.placeholderText, text);
    }
  }

  save_remoteData(name, value) {
    if (window.Storage === undefined) {
      this.error(this.settings.error.noStorage);
      return;
    }
    this.verbose('Saving remote data to session storage', value, name);
    sessionStorage.setItem(value, name);
  }

  restore_defaults(preventChangeTrigger: boolean) {
    this.clear(preventChangeTrigger);
    this.restore_defaultText();
    this.restore_defaultValue();
  }

  restore_defaultText() {
    let
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
    let defaultValue = this.get_defaultValue();

    if (defaultValue !== undefined) {
      this.debug('Restoring default value', defaultValue);
      if (defaultValue !== '') {
        this.set_value(defaultValue);
        this.set_selected();
      }
      else {
        this.remove_activeItem();
        this.remove_selectedItem();
      }
    }
  }

  restore_labels() {
    if (this.settings.allowAdditions) {
      if (!this.settings.useLabels) {
        this.error(this.settings.error.labels);
        this.settings.useLabels = true;
      }
      this.debug('Restoring selected values');
      this.create_userLabels();
    }
    this.check_maxSelections();
  }

  restore_placeholderText() {
    this.set_placeholderText();
  }

  restore_remoteValues() {
    let values = this.get_remoteValues();
    this.debug('Recreating selected from session data', values);
    if (values) {
      if (this.is_single()) {
        $.each(values, (value, name: string) => {
          this.set_text(name);
        });
      }
      else {
        $.each(values, (value, name) => {
          this.add_label(value, name);
        });
      }
    }
  }

  restore_selected() {
    this.restore_values();
    if (this.is_multiple()) {
      this.debug('Restoring previously selected values and labels');
      this.restore_labels();
    }
    else {
      this.debug('Restoring previously selected values');
    }
  }

  restore_values() {
    // prevents callbacks from occurring on initial load
    this.set_initialLoad();
    if (this.settings.apiSettings && this.settings.saveRemoteData && this.get_remoteValues()) {
      this.restore_remoteValues();
    }
    else {
      this.set_selected();
    }
    let value = this.get_value();
    if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
      this.$input.removeClass(this.settings.className.noselection);
    } else {
      this.$input.addClass(this.settings.className.noselection);
    }
    this.remove_initialLoad();
  }

  check_disabled() {
    this.$search.attr('tabindex', this.is_disabled() ? '-1' : '0');
  }

  check_maxSelections(selectionCount: number = this.get_selectionCount()) {
    if (this.settings.maxSelections) {
      if (selectionCount >= this.settings.maxSelections) {
        this.debug('Maximum selection count reached');
        if (this.settings.useLabels) {
          this.$item.addClass(this.settings.className.filtered);
          this.add_message(this.settings.message.maxSelections);
        }
        return true;
      }
      else {
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

  observeChanges() {
    if ('MutationObserver' in window) {
      this.selectObserver = new MutationObserver(this.event_select_mutation.bind(this));
      this.menuObserver   = new MutationObserver(this.event_menu_mutation.bind(this));
      this.classObserver  = new MutationObserver(this.event_class_mutation.bind(this));
      this.debug('Setting up mutation observer', this.selectObserver, this.menuObserver, this.classObserver);
      this.observe_select();
      this.observe_menu();
      this.observe_class();
    }
  }

  event_class_mutation(mutations) {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "class") {
        this.check_disabled();
      }
    });
  }

  event_menu_mutation(mutations) {
    let
      mutation   = mutations[0],
      $addedNode = mutation.addedNodes
        ? $(mutation.addedNodes[0])
        : $(false),
      $removedNode = mutation.removedNodes
        ? $(mutation.removedNodes[0])
        : $(false),
      $changedNodes  = $addedNode.add($removedNode),
      isUserAddition = $changedNodes.is(this.settings.selector.addition) || $changedNodes.closest(this.settings.selector.addition).length > 0,
      isMessage      = $changedNodes.is(this.settings.selector.message)  || $changedNodes.closest(this.settings.selector.message).length > 0
    ;
    if (isUserAddition || isMessage) {
      this.debug('Updating item selector cache');
      this.refreshItems();
    }
    else {
      this.debug('Menu modified, updating selector cache');
      this.refresh();
    }
  }

  event_select_mutation(mutations) {
    this.debug('<select> modified, recreating menu');
    if (this.is_selectMutation(mutations)) {
      this.disconnect_selectObserver();
      this.refresh();
      this.setup_select();
      this.set_selected();
      this.observe_select();
    }
  }

  observe_class() {
    if (this.has_search() && this.classObserver) {
      this.classObserver.observe(this.$element[0], {
        attributes : true
      });
    }
  }

  observe_menu() {
    if (this.has_menu() && this.menuObserver) {
      this.menuObserver.observe(this.$menu[0], {
        childList : true,
        subtree   : true
      });
    }
  }

  observe_select() {
    if (this.has_input() && this.selectObserver) {
      this.selectObserver.observe(this.$element[0], {
        childList : true,
        subtree   : true
      });
    }
  }

  disconnect_menuObserver() {
    if (this.menuObserver) {
      this.menuObserver.disconnect();
    }
  }

  disconnect_selectObserver() {
    if (this.selectObserver) {
      this.selectObserver.disconnect();
    }
  }

  disconnect_classObserver() {
    if (this.classObserver) {
      this.classObserver.disconnect();
    }
  }

  escape_string(text: string): string {
    text =  String(text);
    return text.replace(this.settings.regExp.escape, '\\$&');
  }

  escape_htmlEntities(string: string): string {
    let
      badChars     = /[<>"'`]/g,
      shouldEscape = /[&<>"'`]/,
      escape       = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
      },
      escapedChar  = (chr: string) => {
        return escape[chr];
      }
    ;
    if (shouldEscape.test(string)) {
      string = string.replace(/&(?![a-z0-9#]{1,6};)/, "&amp;");
      return string.replace(badChars, escapedChar);
    }
    return string;
  }

  escape_value(value: string) {
    let
      multipleValues = Array.isArray(value),
      stringValue    = (typeof value === 'string'),
      isUnparsable   = (!stringValue && !multipleValues),
      hasQuotes      = (stringValue && value.search(this.settings.regExp.quote) !== -1),
      values         = []
    ;
    if (isUnparsable || !hasQuotes) {
      return value;
    }
    this.debug('Encoding quote values for use in select', value);

    if (multipleValues) {
      $.each(value, (_index, value) => {
        values.push(value.replace(this.settings.regExp.quote, '&quot;'));
      });
      return values;
    }
    return value.replace(this.settings.regExp.quote, '&quot;');
  }

  action = {
    nothing: () => {},
  
    activate: (text, value, element) => {
      value = (value !== undefined)
        ? value
        : text
      ;
      if (this.can_activate($(element))) {
        this.set_selected(value, $(element));
        if (!this.is_multiple()) {
          this.hideAndClear();
        }
      }
    },

    select: (text, value, element) => {
      value = (value !== undefined)
        ? value
        : text
      ;
      if (this.can_activate($(element))) {
        this.set_value(value, text, $(element));
        if (!this.is_multiple()) {
          this.hideAndClear();
        }
      }
    },

    combo: (text, value, element) => {
      value = (value !== undefined)
        ? value
        : text
      ;
      this.set_selected(value, $(element));
      this.hideAndClear();
    },

    hide: (text, value, element) => {
      this.set_value(value, text, $(element));
      this.hideAndClear();
    }
  }
}
