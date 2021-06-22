'use strict';

import { Module, ModuleOptions } from '../module';

import Utils from '../utils';

import { Api, ApiOptions } from './api';
import { Transition } from './transition';

import $, { Cash } from 'cash-dom';

export interface SearchOptions extends ModuleOptions {
  // template to use (specified in settings.templates)
  type              : string;

  // minimum characters required to search
  minCharacters     : number;

  // whether to select first result after searching automatically
  selectFirstResult : boolean;

  // API config
  apiSettings?      : ApiOptions;

  // object to search
  source            : {};

  // Whether search should query current term on focus
  searchOnFocus     : boolean;

  // fields to search
  searchFields   : [
    'id',
    'title',
    'description'
  ],

  // field to display in standard results template
  displayField   : string;

  // search anywhere in value (set to 'exact' to require exact matches
  fullTextSearch : `exact` | boolean;

  // match results also if they contain diacritics of the same base character (for example searching for "a" will also match "á" or "â" or "à", etc...)
  ignoreDiacritics : boolean;

  // whether to add events to prompt automatically
  automatic      : boolean;

  // delay before hiding menu after blur
  hideDelay      : number;

  // delay before searching
  searchDelay    : number;

  // maximum results returned from search
  maxResults     : number;

  // whether to store lookups in local cache
  cache          : boolean;

  // whether no results errors should be shown
  showNoResults  : boolean;

  // preserve possible html of resultset values
  preserveHTML   : boolean;

  // transition settings
  transition     : string;
  duration       : number;
  easing         : string;

  className: {
    animating : string;
    active    : string;
    empty     : string;
    focus     : string;
    hidden    : string;
    loading   : string;
    results   : string;
    pressed   : string;
  }

  error : {
    source          : string;
    noResultsHeader : string;
    noResults       : string;
    logging         : string;
    noEndpoint      : string;
    noTemplate      : string;
    oldSearchSyntax : string;
    serverError     : string;
    maxResults      : string;
    method          : string;
    noNormalize     : string;
  }

  metadata: {
    cache   : string;
    results : string;
    result  : string;
  }

  regExp: {
    escape     : RegExp;
    beginsWith : string;
  }

  // maps api response attributes to internal representation
  fields: {
    categories      : string;
    categoryName    : string;
    categoryResults : string;
    description     : string;
    image           : string;
    price           : string;
    results         : string;
    title           : string;
    url             : string;
    action          : string;
    actionText      : string;
    actionURL       : string;
  }

  selector : {
    prompt       : string;
    searchButton : string;
    results      : string;
    message      : string;
    category     : string;
    result       : string;
    title        : string;
  }

  templates: {
    escape: Function;
    message: Function;
    category: Function;
    standard: Function;
  }

  // callbacks
  onSelect       : Function;
  onResultsAdd   : Function;

  onSearchQuery  : Function;
  onResults      : Function;

  onResultsOpen  : Function;
  onResultsClose : Function;
}

const default_settings: SearchOptions = {
  name              : 'Search',
  namespace         : 'search',

  silent            : false,
  debug             : false,
  verbose           : false,
  performance       : true,

  // template to use (specified in settings.templates)
  type              : 'standard',

  // minimum characters required to search
  minCharacters     : 1,

  // whether to select first result after searching automatically
  selectFirstResult : false,

  // API config
  apiSettings       : null,

  // object to search
  source            : false,

  // Whether search should query current term on focus
  searchOnFocus     : true,

  // fields to search
  searchFields   : [
    'id',
    'title',
    'description'
  ],

  // field to display in standard results template
  displayField   : '',

  // search anywhere in value (set to 'exact' to require exact matches
  fullTextSearch : 'exact',

  // match results also if they contain diacritics of the same base character (for example searching for "a" will also match "á" or "â" or "à", etc...)
  ignoreDiacritics : false,

  // whether to add events to prompt automatically
  automatic      : true,

  // delay before hiding menu after blur
  hideDelay      : 0,

  // delay before searching
  searchDelay    : 200,

  // maximum results returned from search
  maxResults     : 7,

  // whether to store lookups in local cache
  cache          : true,

  // whether no results errors should be shown
  showNoResults  : true,

  // preserve possible html of resultset values
  preserveHTML   : true,

  // transition settings
  transition     : 'scale',
  duration       : 200,
  easing         : 'easeOutExpo',

  className: {
    animating : 'animating',
    active    : 'active',
    empty     : 'empty',
    focus     : 'focus',
    hidden    : 'hidden',
    loading   : 'loading',
    results   : 'results',
    pressed   : 'down'
  },

  error : {
    source          : 'Cannot search. No source used, and Semantic API module was not included',
    noResultsHeader : 'No Results',
    noResults       : 'Your search returned no results',
    logging         : 'Error in debug logging, exiting.',
    noEndpoint      : 'No search endpoint was specified',
    noTemplate      : 'A valid template name was not specified.',
    oldSearchSyntax : 'searchFullText setting has been renamed fullTextSearch for consistency, please adjust your settings.',
    serverError     : 'There was an issue querying the server.',
    maxResults      : 'Results must be an array to use maxResults setting',
    method          : 'The method you called is not defined.',
    noNormalize     : '"ignoreDiacritics" setting will be ignored. Browser does not support String().normalize(). You may consider including <https://cdn.jsdelivr.net/npm/unorm@1.4.1/lib/unorm.min.js> as a polyfill.'
  },

  metadata: {
    cache   : 'cache',
    results : 'results',
    result  : 'result'
  },

  regExp: {
    escape     : /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
    beginsWith : '(?:\s|^)'
  },

  // maps api response attributes to internal representation
  fields: {
    categories      : 'results',     // array of categories (category view)
    categoryName    : 'name',        // name of category (category view)
    categoryResults : 'results',     // array of results (category view)
    description     : 'description', // result description
    image           : 'image',       // result image
    price           : 'price',       // result price
    results         : 'results',     // array of results (standard)
    title           : 'title',       // result title
    url             : 'url',         // result url
    action          : 'action',      // "view more" object name
    actionText      : 'text',        // "view more" text
    actionURL       : 'url'          // "view more" url
  },

  selector : {
    prompt       : '.prompt',
    searchButton : '.search.button',
    results      : '.results',
    message      : '.results > .message',
    category     : '.category',
    result       : '.result',
    title        : '.title, .name'
  },

  templates: {
    escape: function(string, preserveHTML) {
      if (preserveHTML) {
        return string;
      }
      var
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
    message: function(message, type, header) {
      var
        html = ''
      ;
      if (message !== undefined && type !== undefined) {
        html +=  ''
          + '<div class="message ' + type + '">'
        ;
        if (header) {
          html += ''
          + '<div class="header">' + header + '</div>'
          ;
        }
        html += ' <div class="description">' + message + '</div>';
        html += '</div>';
      }
      return html;
    },
    category: function(response, fields, preserveHTML) {
      let
        html = '',
        escape = default_settings.templates.escape
      ;
      if (response[fields.categoryResults] !== undefined) {

        // each category
        $.each(response[fields.categoryResults], function(index, category: any) {
          if (category[fields.results] !== undefined && category.results.length > 0) {

            html  += '<div class="category">';

            if (category[fields.categoryName] !== undefined) {
              html += '<div class="name">' + escape(category[fields.categoryName], preserveHTML) + '</div>';
            }

            // each item inside category
            html += '<div class="results">';
            $.each(category.results, function(index, result) {
              if (result[fields.url]) {
                html  += '<a class="result" href="' + result[fields.url].replace(/"/g,"") + '">';
              }
              else {
                html  += '<a class="result">';
              }
              if (result[fields.image] !== undefined) {
                html += ''
                  + '<div class="image">'
                  + ' <img src="' + result[fields.image].replace(/"/g,"") + '">'
                  + '</div>'
                ;
              }
              html += '<div class="content">';
              if (result[fields.price] !== undefined) {
                html += '<div class="price">' + escape(result[fields.price], preserveHTML) + '</div>';
              }
              if (result[fields.title] !== undefined) {
                html += '<div class="title">' + escape(result[fields.title], preserveHTML) + '</div>';
              }
              if (result[fields.description] !== undefined) {
                html += '<div class="description">' + escape(result[fields.description], preserveHTML) + '</div>';
              }
              html  += ''
                + '</div>'
              ;
              html += '</a>';
            });
            html += '</div>';
            html  += ''
              + '</div>'
            ;
          }
        });
        if (response[fields.action]) {
          if (fields.actionURL === false) {
            html += ''
            + '<div class="action">'
            +   escape(response[fields.action][fields.actionText], preserveHTML)
            + '</div>';
          } else {
            html += ''
            + '<a href="' + response[fields.action][fields.actionURL].replace(/"/g,"") + '" class="action">'
            +   escape(response[fields.action][fields.actionText], preserveHTML)
            + '</a>';
          }
        }
        return html;
      }
      return false;
    },
    standard: function(response, fields, preserveHTML) {
      var
        html = '',
        escape = default_settings.templates.escape
      ;
      if (response[fields.results] !== undefined) {

        // each result
        $.each(response[fields.results], function(index, result) {
          if (result[fields.url]) {
            html  += '<a class="result" href="' + result[fields.url].replace(/"/g,"") + '">';
          }
          else {
            html  += '<a class="result">';
          }
          if (result[fields.image] !== undefined) {
            html += ''
              + '<div class="image">'
              + ' <img src="' + result[fields.image].replace(/"/g,"") + '">'
              + '</div>'
            ;
          }
          html += '<div class="content">';
          if (result[fields.price] !== undefined) {
            html += '<div class="price">' + escape(result[fields.price], preserveHTML) + '</div>';
          }
          if (result[fields.title] !== undefined) {
            html += '<div class="title">' + escape(result[fields.title], preserveHTML) + '</div>';
          }
          if (result[fields.description] !== undefined) {
            html += '<div class="description">' + escape(result[fields.description], preserveHTML) + '</div>';
          }
          html  += ''
            + '</div>'
          ;
          html += '</a>';
        });
        if (response[fields.action]) {
          if (fields.actionURL === false) {
            html += ''
            + '<div class="action">'
            +   escape(response[fields.action][fields.actionText], preserveHTML)
            + '</div>';
          } else {
            html += ''
            + '<a href="' + response[fields.action][fields.actionURL].replace(/"/g,"") + '" class="action">'
            +   escape(response[fields.action][fields.actionText], preserveHTML)
            + '</a>';
          }
        }
        return html;
      }
      return false;
    }
  },

  // callbacks
  onSelect       : null,
  onResultsAdd   : null,

  onSearchQuery  : function(query){},
  onResults      : function(response){},

  onResultsOpen  : function(){},
  onResultsClose : function(){},
}

export class Search extends Module {
  settings: SearchOptions;

  $prompt: Cash;
  $searchButton: Cash;
  $results: Cash;
  $result: Cash;
  $category: Cash;

  results: HTMLElement;
  API: Api;

  disabledBubbled: boolean  = false;
  resultsDismissed: boolean = false;
  resultsClicked: boolean;

  timer;

  instance: Search;

  constructor(selector: string, parameters) {
    super(selector, parameters, default_settings);

    this.$prompt          = this.$element.find(this.settings.selector.prompt);
    this.$searchButton    = this.$element.find(this.settings.selector.searchButton);
    this.$results         = this.$element.find(this.settings.selector.results);
    this.$result          = this.$element.find(this.settings.selector.result);
    this.$category        = this.$element.find(this.settings.selector.category);

    this.results          = this.element.querySelector(this.settings.selector.results);

    this.initialize();
  }

  initialize(): void {
    this.verbose('Initializing module');
    this.get_settings();
    this.determine_searchFields();
    this.bind_events();
    this.set_type();
    this.create_results();
    this.instantiate();
  }
  
  instantiate(): void {
    this.verbose('Storing instance of module', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.verbose('Destroying instance');
    this.$element
      .off(this.eventNamespace)
      .removeAttr(this.moduleNamespace)
    ;
  }

  setup_api(searchTerm, callback) {
    let
      apiSettings: ApiOptions = {
        debug             : this.settings.debug,
        on                : null,
        cache             : this.settings.cache,
        action            : 'search',
        urlData           : {
          query : searchTerm
        },
        onSuccess         : (response) => {
          this.parse_response.call(this, response, searchTerm);
          callback();
        },
        onFailure         : () => {
          this.displayMessage(this.settings.error.serverError);
          callback();
        },
        onAbort : function(response) {
        },
        onError           : this.error
      }
    ;
    $.extend(true, apiSettings, this.settings.apiSettings);
    this.verbose('Setting up API request', apiSettings);

    // this.$element.api(apiSettings);
    this.API = new Api(apiSettings);
  }

  refresh(): void {
    this.debug('Refreshing selector cache');
    this.$prompt         = this.$element.find(this.settings.selector.prompt);
    this.$searchButton   = this.$element.find(this.settings.selector.searchButton);
    this.$category       = this.$element.find(this.settings.selector.category);
    this.$results        = this.$element.find(this.settings.selector.results);
    this.$result         = this.$element.find(this.settings.selector.result);
  }

  refreshResults(): void {
    this.$results = this.$element.find(this.settings.selector.results);
    this.$result  = this.$element.find(this.settings.selector.result);
  }

  determine_searchFields(): void {
    // INVESTIGATE
    // this makes sure $.extend does not add specified search fields to default fields
    // this is the only setting which should not extend defaults
    // if (parameters && parameters.searchFields !== undefined) {
    //   this.settings.searchFields = parameters.searchFields;
    // }
  }

  bind_events(): void {
    this.verbose('Binding events to search');
    if (this.settings.automatic) {
      this.$element.on(this.get_inputEvent() + this.eventNamespace, this.settings.selector.prompt, this.event_input.bind(this));
      this.$prompt.attr('autocomplete', this.is_chrome() ? 'fomantic-search' : 'off');
    }
    this.$element
      // prompt
      .on('focus'     + this.eventNamespace, this.settings.selector.prompt, this.event_focus.bind(this))
      .on('blur'      + this.eventNamespace, this.settings.selector.prompt, this.event_blur.bind(this))
      .on('keydown'   + this.eventNamespace, this.settings.selector.prompt, this.handleKeyboard.bind(this))
      // search button
      .on('click'     + this.eventNamespace, this.settings.selector.searchButton, this.query)
      // results
      .on('mousedown' + this.eventNamespace, this.settings.selector.results, this.event_result_mousedown.bind(this))
      .on('mouseup'   + this.eventNamespace, this.settings.selector.results, this.event_result_mouseup.bind(this))
      .on('click'     + this.eventNamespace, this.settings.selector.result,  this.event_result_click.bind(this))
    ;
  }

  event_input(): void {
    if (this.settings.searchDelay) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (this.is_focused()) {
          this.query();
        }
      }, this.settings.searchDelay);
    }
    else {
      this.query();
    }
  }

  event_focus(): void {
    this.set_focus();
    if (this.settings.searchOnFocus && this.has_minimumCharacters() ) {
      this.query(() => {
        if (this.can_show() ) {
          this.showResults();
        }
      });
    }
  }

  event_blur(event): void {
    let
      pageLostFocus = (document.activeElement === event.currentTarget),
      callback      = () => {
        this.cancel_query();
        this.remove_focus();
        this.timer = setTimeout(this.hideResults, this.settings.hideDelay);
      }
    ;
    if (pageLostFocus) {
      return;
    }
    this.resultsDismissed = false;
    if (this.resultsClicked) {
      this.debug('Determining if user action caused search to close');
      this.$element.one('click.close' + this.eventNamespace, this.settings.selector.results, (event) => {
        if (this.is_inMessage(event) || this.disabledBubbled) {
          this.$prompt.trigger('focus');
          return;
        }
        this.disabledBubbled = false;
        if (!this.is_animating() && !this.is_hidden()) {
          callback();
        }
      });
    }
    else {
      this.debug('Input blurred without user action, closing results');
      callback();
    }
  }

  handleKeyboard(event) {
    let
      // force selector refresh
      $result         = this.$element.find(this.settings.selector.result),
      $category       = this.$element.find(this.settings.selector.category),
      $activeResult   = $result.filter('.' + this.settings.className.active),
      currentIndex    = $result.index( $activeResult ),
      resultSize      = $result.length,
      hasActiveResult = $activeResult.length > 0,

      keyCode         = event.which,
      keys            = {
        backspace : 8,
        enter     : 13,
        escape    : 27,
        upArrow   : 38,
        downArrow : 40
      },
      newIndex
    ;
    // search shortcuts
    if (keyCode == keys.escape) {
      this.verbose('Escape key pressed, blurring search field');
      this.hideResults();
      this.resultsDismissed = true;
    }
    if (this.is_visible()) {
      if (keyCode == keys.enter) {
        this.verbose('Enter key pressed, selecting active result');
        if ($result.filter('.' + this.settings.className.active).length > 0) {
          this.event_result_click.call($result.filter('.' + this.settings.className.active), event);
          event.preventDefault();
          return false;
        }
      }
      else if (keyCode == keys.upArrow && hasActiveResult) {
        this.verbose('Up key pressed, changing active result');
        newIndex = (currentIndex - 1 < 0)
          ? currentIndex
          : currentIndex - 1
        ;
        $category.removeClass(this.settings.className.active);
        $result
          .removeClass(this.settings.className.active)
          .eq(newIndex)
            .addClass(this.settings.className.active)
            .closest($category)
            .addClass(this.settings.className.active)
        ;
        this.ensureVisible($result.eq(newIndex));
        event.preventDefault();
      }
      else if (keyCode == keys.downArrow) {
        this.verbose('Down key pressed, changing active result');
        newIndex = (currentIndex + 1 >= resultSize)
          ? currentIndex
          : currentIndex + 1
        ;
        $category.removeClass(this.settings.className.active);
        $result
          .removeClass(this.settings.className.active)
          .eq(newIndex)
            .addClass(this.settings.className.active)
            .closest($category)
            .addClass(this.settings.className.active)
        ;
        this.ensureVisible($result.eq(newIndex));
        event.preventDefault();
      }
    }
    else {
      // query shortcuts
      if (keyCode == keys.enter) {
        this.verbose('Enter key pressed, executing query');
        this.query();
        this.set_buttonPressed();
        this.$prompt.one('keyup', this.remove_buttonFocus.bind(this));
      }
    }
  }

  event_result_mousedown() {
    this.resultsClicked = true;
  }

  event_result_mouseup() {
    this.resultsClicked = false;
  }

  event_result_click(event) {
    this.debug('Search result selected');
    let
      $result = $(event.currentTarget),
      $title  = $result.find(this.settings.selector.title).eq(0),
      $link   = $result.is('a[href]')
        ? $result
        : $result.find('a[href]').eq(0),
      href    = $link.attr('href')   || false,
      target  = $link.attr('target') || false,
      // title is used for result lookup
      value   = ($title.length > 0)
        ? $title.text()
        : false,
      results = this.get_results(),
      result  = $result.data(this.settings.metadata.result) || this.get_result(value, results)
    ;
    let oldValue = this.get_value();
    if ($.isFunction(this.settings.onSelect)) {
      if (this.settings.onSelect.call(this.element, result, results) === false) {
        this.debug('Custom onSelect callback cancelled default select action');
        this.disabledBubbled = true;
        return;
      }
    }
    this.hideResults();
    if (value && this.get_value() === oldValue) {
      this.set_value(value);
    }
    if (href) {
      event.preventDefault();
      this.verbose('Opening search link found in result', $link);
      if (target == '_blank' || event.ctrlKey) {
        window.open(href);
      }
      else {
        window.location.href = (href);
      }
    }
  }

  create_categoryResults(results) {
    let categoryResults = {};
    $.each(results, function(_index, result: any) {
      if (!result.category) {
        return;
      }
      if (categoryResults[result.category] === undefined) {
        this.verbose('Creating new category of results', result.category);
        categoryResults[result.category] = {
          name    : result.category,
          results : [result]
        };
      }
      else {
        categoryResults[result.category].results.push(result);
      }
    });
    return categoryResults;
  }

  create_id(resultIndex, categoryIndex = undefined): string {
    let
      resultID      = (resultIndex + 1), // not zero indexed
      letterID,
      id
    ;
    if (categoryIndex !== undefined) {
      // start char code for "A"
      letterID = String.fromCharCode(97 + categoryIndex);
      id          = letterID + resultID;
      this.verbose('Creating category result id', id);
    }
    else {
      id = resultID;
      this.verbose('Creating result id', id);
    }
    return id;
  }

  create_results(): void {
    if (this.$results.length === 0) {
      this.$results = $('<div />')
        .addClass(this.settings.className.results)
        .appendTo(this.$element)
      ;
    }
  }

  query(callback: Function = () => {}): void {
    let
      searchTerm = this.get_value(),
      cache = this.read_cache(searchTerm)
    ;
    if (this.has_minimumCharacters())  {
      if (cache) {
        this.debug('Reading result from cache', searchTerm);
        this.save_results(cache.results);
        this.addResults(cache.html);
        this.inject_id(cache.results);
        callback();
      }
      else {
        this.debug('Querying for', searchTerm);
        if ($.isPlainObject(this.settings.source) || Array.isArray(this.settings.source)) {
          this.search_local(searchTerm);
          callback();
        }
        else if (this.can_useAPI()) {
          this.search_remote(searchTerm, callback);
        }
        else {
          this.error(this.settings.error.source);
          callback();
        }
      }
      this.settings.onSearchQuery.call(this.element, searchTerm);
    }
    else {
      this.hideResults();
    }
  }

  cancel_query(): void {
    if (this.can_useAPI()) {
      // this.$element.api('abort');
      this.API.abort();
    }
  }

  search_object(searchTerm, source = this.settings.source, searchFields = this.settings.searchFields) {
    searchTerm = this.remove_diacritics(String(searchTerm));
    let
      results      = [],
      exactResults = [],
      fuzzyResults = [],
      searchExp    = searchTerm.replace(this.settings.regExp.escape, '\\$&'),
      matchRegExp  = new RegExp(this.settings.regExp.beginsWith + searchExp, 'i'),

      // avoid duplicates when pushing results
      addResult = (array, result) => {
        var
          notResult      = (results.indexOf(result) == -1),
          notFuzzyResult = (results.indexOf(fuzzyResults) == -1),
          notExactResults = (results.indexOf(exactResults) == -1)
        ;
        if (notResult && notFuzzyResult && notExactResults) {
          array.push(result);
        }
      }
    ;

    // search fields should be array to loop correctly
    if (!Array.isArray(searchFields)) {
      searchFields = [searchFields];
    }

    // exit conditions if no source
    if (source === undefined || source === false) {
      this.error(this.settings.error.source);
      return [];
    }
    // iterate through search fields looking for matches
    $.each(searchFields, (_index, field: any) => {
      $.each(source, (label, content: any) => {
        let fieldExists = (typeof content[field] == 'string') || (typeof content[field] == 'number');
        if (fieldExists) {
          let text;
          if (typeof content[field] === 'string') {  
            text = this.remove_diacritics(content[field]);
          } else {
          text = content[field].toString(); 
          }
          if (text.search(matchRegExp) !== -1) {
            // content starts with value (first in results)
            addResult(results, content);
          }
          else if (this.settings.fullTextSearch === 'exact' && this.exactSearch(searchTerm, text)) {
            // content fuzzy matches (last in results)
            addResult(exactResults, content);
          }
          else if (this.settings.fullTextSearch == true && this.fuzzySearch(searchTerm, text)) {
            // content fuzzy matches (last in results)
            addResult(fuzzyResults, content);
          }
        }
      });
    });
    // INVESTIGATE
    // $.merge(exactResults, fuzzyResults);
    // $.merge(results, exactResults);
    exactResults = exactResults.concat(fuzzyResults);
    results = results.concat(exactResults);
    return results;
  }

  exactSearch(query, term): boolean {
    query = query.toLowerCase();
    term  = term.toLowerCase();
    return term.indexOf(query) > -1;
  }

  fuzzySearch(query, term): boolean {
    let
      termLength  = term.length,
      queryLength = query.length
    ;
    if (typeof query !== 'string') {
      return false;
    }
    query = query.toLowerCase();
    term  = term.toLowerCase();
    if (queryLength > termLength) {
      return false;
    }
    if (queryLength === termLength) {
      return (query === term);
    }
    search: for (let characterIndex = 0, nextCharacterIndex = 0; characterIndex < queryLength; characterIndex++) {
      let queryCharacter = query.charCodeAt(characterIndex);
      while (nextCharacterIndex < termLength) {
        if (term.charCodeAt(nextCharacterIndex++) === queryCharacter) {
          continue search;
        }
      }
      return false;
    }
    return true;
  }

  is_animating(): boolean {
    return this.$results.hasClass(this.settings.className.animating);
  }

  is_chrome(): boolean {
    return !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
  }

  is_hidden(): boolean {
    return this.$results.hasClass(this.settings.className.hidden);
  }

  is_inMessage(event): boolean {
    if (!event.target) {
      return;
    }
    let
      $target = $(event.target),
      isInDOM = document.documentElement.contains(event.target)
    ;
    return (isInDOM && $target.closest(this.settings.selector.message).length > 0);
  }

  is_empty(): boolean {
    return (this.$results.html() === '');
  }

  is_visible(): boolean {
    return (this.$results.filter('visible').length > 0);
  }

  is_focused(): boolean {
    return (this.$prompt.filter('focus').length > 0);
  }

  can_useAPI() {
    // INVESTIGATE
    // return $.fn.api !== undefined;
    return true;
  }

  can_show() {
    return this.is_focused() && !this.is_visible() && !this.is_empty();
  }

  can_transition() {
    // INVESTIGATE
    // return settings.transition && $.fn.transition !== undefined && $module.transition('is supported');
    return true;
  }

  has_minimumCharacters(): boolean {
    let
      searchTerm    = this.get_value(),
      numCharacters = searchTerm.length
    ;
    return (numCharacters >= this.settings.minCharacters);
  }

  has_results(): boolean {
    if (this.$results.length === 0) {
      return false;
    }
    let html = this.$results.html();
    return html != '';
  }

  get_settings() {
    // INVESTIGATE
    // if ($.isPlainObject(parameters) && parameters.searchFullText) {
    //   settings.fullTextSearch = parameters.searchFullText;
    //   module.error(settings.error.oldSearchSyntax, element);
    // }
    // if (settings.ignoreDiacritics && !String.prototype.normalize) {
    //   settings.ignoreDiacritics = false;
    //   module.error(error.noNormalize, element);
    // }
  }

  get_inputEvent(): string {
    let
      prompt = this.$prompt[0],
      inputEvent   = (prompt !== undefined && prompt.oninput !== undefined)
        ? 'input'
        : (prompt !== undefined && prompt.onpropertychange !== undefined)
          ? 'propertychange'
          : 'keyup'
    ;
    return inputEvent;
  }

  get_value() {
    return this.$prompt.val();
  }

  get_results(): string {
    let results = this.$element.data(this.settings.metadata.results);
    return results;
  }

  get_result(value, results) {
    let result       = false;
    value = (value !== undefined)
      ? value
      : this.get_value()
    ;
    results = (results !== undefined)
      ? results
      : this.get_results()
    ;
    if (this.settings.type === 'category') {
      this.debug('Finding result that matches', value);
      $.each(results, (_index, category: any) => {
        if (Array.isArray(category.results)) {
          result = this.search_object(value, category.results)[0];
          // don't continue searching if a result is found
          if (result) {
            return false;
          }
        }
      });
    }
    else {
      this.debug('Finding result in results object', value);
      result = this.search_object(value, results)[0];
    }
    return result || false;
  }

  set_focus() {
    this.$element.addClass(this.settings.className.focus);
  }

  set_loading() {
    this.$element.addClass(this.settings.className.loading);
  }

  set_value(value) {
    this.verbose('Setting search input value', value);
    this.$prompt.val(value);
  }

  set_type(type = this.settings.type) {
    if (this.settings.type == 'category') {
      this.$element.addClass(this.settings.type);
    }
  }

  set_buttonPressed() {
    this.$searchButton.addClass(this.settings.className.pressed);
  }

  remove_loading() {
    this.$element.removeClass(this.settings.className.loading);
  }

  remove_focus() {
    this.$element.removeClass(this.settings.className.focus);
  }

  remove_buttonFocus() {
    // IS THIS NECESSARY ?
    this.$searchButton.removeClass(this.settings.className.focus);
  }

  remove_buttonPressed() {
    this.$searchButton.removeClass(this.settings.className.pressed);
  }

  remove_diacritics(text) {
    return this.settings.ignoreDiacritics ?  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text;
  }

  ensureVisible($el) {
    let elTop, elBottom, resultsScrollTop, resultsHeight;
    if ($el.length === 0) {
      return;
    }
    elTop = $el.position().top;
    elBottom = elTop + $el.outerHeight(true);

    // resultsScrollTop = this.$results.scrollTop();
    resultsScrollTop = this.results.scrollTop;
    resultsHeight = this.$results.height();
      
    if (elTop < 0) {
      // this.$results.scrollTop(resultsScrollTop + elTop);
      this.results.scrollTop = resultsScrollTop + elTop;
    }

    else if (resultsHeight < elBottom) {
      // this.$results.scrollTop(resultsScrollTop + (elBottom - resultsHeight));
      this.results.scrollTop = resultsScrollTop + (elBottom - resultsHeight);
    }
  }

  read_cache(name) {
    let cache = this.$element.data(this.settings.metadata.cache);
    if (this.settings.cache) {
      this.verbose('Checking cache for generated html for query', name);
      return (typeof cache == 'object') && (cache[name] !== undefined)
        ? cache[name]
        : false
      ;
    }
    return false;
  }

  write_cache(name, value) {
    let
      cache = (this.$element.data(this.settings.metadata.cache) !== undefined)
        ? this.$element.data(this.settings.metadata.cache)
        : {}
    ;
    if (this.settings.cache) {
      this.verbose('Writing generated html to cache', name, value);
      cache[name] = value;
      this.$element.data(this.settings.metadata.cache, cache);
    }
  }

  clear_cache(value) {
    let cache = this.$element.data(this.settings.metadata.cache);
    if (!value) {
      this.debug('Clearing cache', value);
      this.$element.removeAttr(this.settings.metadata.cache);
    }
    else if (value && cache && cache[value]) {
      this.debug('Removing value from cache', value);
      delete cache[value];
      this.$element.data(this.settings.metadata.cache, cache);
    }
  }

  search_local(searchTerm) {
    let
      results: any = this.search_object(searchTerm, this.settings.source),
      searchHTML
    ;
    this.set_loading();
    this.save_results(results);
    this.debug('Returned full local search results', results);
    if (this.settings.maxResults > 0) {
      this.debug('Using specified max results', results);
      results = results.slice(0, this.settings.maxResults);
    }
    if (this.settings.type == 'category') {
      results = this.create_categoryResults(results);
    }
    searchHTML = this.generateResults({
      results: results
    });
    this.remove_loading();
    this.addResults(searchHTML);
    this.inject_id(results);
    this.write_cache(searchTerm, {
      html    : searchHTML,
      results : results
    });
  }

  search_remote(searchTerm, callback: Function = () => {}) {
    // if (this.$element.api('is loading')) {
    //   this.$element.api('abort');
    // }
    if (this.API !== undefined) {
      if (this.API.is_loading()) {
        this.API.abort();
      }
    }
    
    this.setup_api(searchTerm, callback);
    // this.$element.api('query');
    this.API.query();
  }

  addResults(html) {
    if ($.isFunction(this.settings.onResultsAdd)) {
      if (this.settings.onResultsAdd.call(this.$results, html) === false ) {
        this.debug('onResultsAdd callback cancelled default action');
        return false;
      }
    }
    if (html) {
      this.$results.html(html);
      this.refreshResults();
      if (this.settings.selectFirstResult) {
        this.select_firstResult();
      }
      this.showResults();
    }
    else {
      this.hideResults(() => {
        this.$results.empty();
      });
    }
  }

  select_firstResult() {
    this.verbose('Selecting first result');
    this.$result.first().addClass(this.settings.className.active);
  }

  save_results(results): void {
    this.verbose('Saving current search results to metadata', results);
    this.$element.data(this.settings.metadata.results, results);
  }

  showResults(callback: Function = () => {}) {
    if (this.resultsDismissed) {
      return;
    }
    if (!this.is_visible() && this.has_results()) {
      if (this.can_transition()) {
        this.debug('Showing results with css animations');

        // this.$results
        //   .transition({
        //     animation  : settings.transition + ' in',
        //     debug      : settings.debug,
        //     verbose    : settings.verbose,
        //     duration   : settings.duration,
        //     queue      : true,
        //     onShow     : () => {
        //       let $firstResult = this.$element.find(this.settings.selector.result).eq(0);
        //       this.ensureVisible($firstResult);
        //     },
        //     onComplete : () => {
        //       callback();
        //     }
        //   })
        // ;

        let transition = new Transition(this.$results, {
          animation  : this.settings.transition + ' in',
          debug      : this.settings.debug,
          verbose    : this.settings.verbose,
          duration   : this.settings.duration,
          queue      : true,
          onShow     : () => {
            let $firstResult = this.$element.find(this.settings.selector.result).eq(0);
            this.ensureVisible($firstResult);
          },
          onComplete : () => {
            callback();
          }
        });
      }
      else {
        this.debug('Showing results with javascript');
        // this.$results
        //   .stop()
        //   .fadeIn(this.settings.duration, this.settings.easing)
        // ;
        Utils.fadeIn(this.$results, this.settings.duration, this.settings.easing);
      }
      this.settings.onResultsOpen.call(this.$results);
    }
  }

  hideResults(callback: Function = () => {}) {
    if (this.is_visible()) {
      if (this.can_transition()) {
        this.debug('Hiding results with css animations');

        // this.$results
        //   .transition({
        //     animation  : settings.transition + ' out',
        //     debug      : settings.debug,
        //     verbose    : settings.verbose,
        //     duration   : settings.duration,
        //     onComplete : () => {
        //       callback();
        //     },
        //     queue      : true
        //   })
        // ;

        new Transition(this.$results, {
          animation  : this.settings.transition + ' in',
          debug      : this.settings.debug,
          verbose    : this.settings.verbose,
          duration   : this.settings.duration,
          queue      : true,
          onComplete : () => {
            callback();
          }
        });
      }
      else {
        this.debug('Hiding results with javascript');
        // this.$results
        //   .stop()
        //   .fadeOut(this.settings.duration, this.settings.easing)
        // ;
        Utils.fadeOut(this.$results, this.settings.duration, this.settings.easing);
      }
      this.settings.onResultsClose.call(this.$results);
    }
  }

  parse_response(response, searchTerm) {
    if (Array.isArray(response)) {
        let o = {};
        o[this.settings.fields.results]=response;
        response = o;
    }
    let searchHTML = this.generateResults(response);
    this.verbose('Parsing server response', response);
    if (response !== undefined) {
      if (searchTerm !== undefined && response[this.settings.fields.results] !== undefined) {
        this.addResults(searchHTML);
        this.inject_id(response[this.settings.fields.results]);
        this.write_cache(searchTerm, {
          html    : searchHTML,
          results : response[this.settings.fields.results]
        });
        this.save_results(response[this.settings.fields.results]);
      }
    }
  }

  generateResults(response) {
    this.debug('Generating html from response', response);
    let
      template       = this.settings.templates[this.settings.type],
      // isProperObject = ($.isPlainObject(response[this.settings.fields.results]) && !$.isEmptyObject(response[this.settings.fields.results])),
      isProperObject = ($.isPlainObject(response[this.settings.fields.results]) && !(response[this.settings.fields.results]  && Object.keys(response[this.settings.fields.results]).length === 0 && response[this.settings.fields.results].constructor === Object)),
      isProperArray  = (Array.isArray(response[this.settings.fields.results]) && response[this.settings.fields.results].length > 0),
      html           = ''
    ;
    if (isProperObject || isProperArray ) {
      if (this.settings.maxResults > 0) {
        if (isProperObject) {
          if (this.settings.type == 'standard') {
            this.error(this.settings.error.maxResults);
          }
        }
        else {
          response[this.settings.fields.results] = response[this.settings.fields.results].slice(0, this.settings.maxResults);
        }
      }
      if ($.isFunction(template)) {
        html = template(response, this.settings.fields, this.settings.preserveHTML);
      }
      else {
        this.error(this.settings.error.noTemplate, false);
      }
    }
    else if (this.settings.showNoResults) {
      html = this.displayMessage(this.settings.error.noResults, 'empty', this.settings.error.noResultsHeader);
    }
    this.settings.onResultsClose.call(this.element, response);
    return html;
  }

  inject_id(results) {
    this.debug('Injecting unique ids into results');
    let
      // since results may be object, we must use counters
      categoryIndex = 0,
      resultIndex   = 0
    ;
    if (this.settings.type === 'category') {
      // iterate through each category result
      $.each(results, (_index, category: any) => {
        if (category.results.length > 0) {
          resultIndex = 0;
          $.each(category.results, (_index, result: any) => {
            if (result.id === undefined) {
              result.id = this.create_id(resultIndex, categoryIndex);
            }
            this.inject_result(result, resultIndex, categoryIndex);
            resultIndex++;
          });
          categoryIndex++;
        }
      });
    }
    else {
      // top level
      $.each(results, (_index, result: any) => {
        if (result.id === undefined) {
          result.id = this.create_id(resultIndex);
        }
        this.inject_result(result, resultIndex);
        resultIndex++;
      });
    }
    return results;
  }

  inject_result(result, resultIndex, categoryIndex = undefined) {
    this.verbose('Injecting result into results');
    let $selectedResult = (categoryIndex !== undefined)
      ? this.$results
        .children().eq(categoryIndex)
          .children(this.settings.selector.results)
            .first()
            .children(this.settings.selector.result)
              .eq(resultIndex)
      : this.$results.children(this.settings.selector.result).eq(resultIndex)
    ;
    this.verbose('Injecting results metadata', $selectedResult);
    $selectedResult.data(this.settings.metadata.result, result);
  }

  displayMessage(text, type:string = 'standard', header: string = '') {
    this.debug('Displaying message', text, type, header);
    this.addResults(this.settings.templates.message(text, type, header));
    return this.settings.templates.message(text, type, header);
  }
}  
