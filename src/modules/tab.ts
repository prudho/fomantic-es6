'use strict';

import { Module, ModuleOptions } from '../module'

import $, { Cash } from 'cash-dom';

export interface TabOptions extends ModuleOptions {
  auto            : boolean;
  history         : boolean;
  historyType     : 'hash' | 'state';
  path            : string;

  context         : string;
  childrenOnly    : boolean;
  maxDepth        : number;

  deactivate      : string;

  alwaysRefresh   : boolean;
  cache           : boolean;
  loadOnce        : boolean;
  cacheType       : string;
  ignoreFirstLoad : boolean;

  apiSettings     : {};
  evaluateScripts : string;
  autoTabActivation: boolean;

  templates : {
    determineTitle: Function;
  }

  error: {
    api        : string;
    method     : string;
    missingTab : string;
    noContent  : string;
    path       : string;
    recursion  : string;
    state      : string;
  }

  regExp : {
    escape   : RegExp;
  }

  metadata : {
    tab    : string;
    loaded : string;
    promise: string;
  }

  className   : {
    loading : string;
    active  : string;
  }

  selector    : {
    tabs : string;
    ui   : string;
  }

  onFirstLoad : Function;
  onLoad      : Function;
  onVisible   : Function;
  onRequest   : Function;
}

const default_settings: TabOptions = {
  name            : 'Tab',
  namespace       : 'tab',

  silent          : false,
  debug           : false,
  verbose         : false,
  performance     : true,

  auto            : false,      // uses pjax style endpoints fetching content from same url with remote-content headers
  history         : false,      // use browser history
  historyType     : 'hash',     // #/ or html5 state
  path            : null,      // base path of url

  context         : null,      // specify a context that tabs must appear inside
  childrenOnly    : false,      // use only tabs that are children of context
  maxDepth        : 25,         // max depth a tab can be nested

  deactivate      : 'siblings', // whether tabs should deactivate sibling menu elements or all elements initialized together

  alwaysRefresh   : false,      // load tab content new every tab click
  cache           : true,       // cache the content requests to pull locally
  loadOnce        : false,      // Whether tab data should only be loaded once when using remote content
  cacheType       : 'response', // Whether to cache exact response, or to html cache contents after scripts execute
  ignoreFirstLoad : false,      // don't load remote content on first load

  apiSettings     : false,      // settings for api call
  evaluateScripts : 'once',     // whether inline scripts should be parsed (true/false/once). Once will not re-evaluate on cached content
  autoTabActivation: true,      // whether a non existing active tab will auto activate the first available tab

  templates : {
    determineTitle: function(tabArray) {} // returns page title for path
  },

  error: {
    api        : 'You attempted to load content without API module',
    method     : 'The method you called is not defined',
    missingTab : 'Activated tab cannot be found. Tabs are case-sensitive.',
    noContent  : 'The tab you specified is missing a content url.',
    path       : 'History enabled, but no path was specified',
    recursion  : 'Max recursive depth reached',
    state      : 'History requires Asual\'s Address library <https://github.com/asual/jquery-address>'
  },

  regExp : {
    escape   : /[-[\]{}()*+?.,\\^$|#\s:=@]/g
  },

  metadata : {
    tab    : 'tab',
    loaded : 'loaded',
    promise: 'promise'
  },

  className   : {
    loading : 'loading',
    active  : 'active'
  },

  selector    : {
    tabs : '.ui.tab',
    ui   : '.ui'
  },

  onFirstLoad : function(tabPath, parameterArray, historyEvent) {}, // called first time loaded
  onLoad      : function(tabPath, parameterArray, historyEvent) {}, // called on every load
  onVisible   : function(tabPath, parameterArray, historyEvent) {}, // called every time tab visible
  onRequest   : function(tabPath, parameterArray, historyEvent) {}, // called ever time a tab beings loading remote content
}

export class Tab extends Module {
  settings: TabOptions;

  $allModules: Cash;
  $context: Cash;
  $tabs: Cash;

  firstLoad: boolean;
  initializedHistory: boolean = false;

  activeTabPath;
  cache;
  parameterArray;
  historyEvent;

  instance: Tab;

  constructor(selector: string, parameters) {
    super(selector, parameters, default_settings);

    this.$allModules = $(this.$element);
    
    this.firstLoad = true;

    this.cache = {};

    this.initialize();
  }

  initialize(): void {
    this.debug('Initializing tab menu item', this.$element);
    this.fix_callbacks();
    this.determineTabs();

    this.debug('Determining tabs', this.settings.context, this.$tabs);
    // set up automatic routing
    if (this.settings.auto) {
      this.set_auto();
    }
    this.bind_events();

    if (this.settings.history && !this.initializedHistory) {
      this.initializeHistory();
      this.initializedHistory = true;
    }

    if (this.settings.autoTabActivation && this.instance === undefined && this.determine_activeTab() == null) {
      this.debug('No active tab detected, setting first tab active', this.get_initialPath());
      this.changeTab(this.settings.autoTabActivation === true ? this.get_initialPath() : this.settings.autoTabActivation);
    };

    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Storing instance of module', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.debug('Destroying tabs', this.$element);
    this.$element
      .removeAttr(this.moduleNamespace)
      .off(this.eventNamespace)
    ;
  }

  bind_events(): void {
    // if using $.tab don't add events
    if (!$.isWindow( this.element)) {
      this.debug('Attaching tab activation events to element', this.$element);
      this.$element.on('click' + this.eventNamespace, this.event_click.bind(this));
    }
  }

  event_click(event): void {
    let tabPath = $(event.target).data(this.settings.metadata.tab);
    if (tabPath !== undefined) {
      if (this.settings.history) {
        this.verbose('Updating page state', event);
        $.address.value(tabPath);
      }
      else {
        this.verbose('Changing tab', event);
        this.changeTab(tabPath);
      }
      event.preventDefault();
    }
    else {
      this.debug('No tab specified');
    }
  }

  event_history_change(event): void {
    let
      tabPath   = event.pathNames.join('/') || this.get_initialPath(),
      pageTitle = this.settings.templates.determineTitle(tabPath) || false
    ;
    // WTF
    // module.performance.display();
    this.debug('History change event', tabPath, event);
    this.historyEvent = event;
    if (tabPath !== undefined) {
      this.changeTab(tabPath);
    }
    if (pageTitle) {
      $.address.title(pageTitle);
    }
  }

  determineTabs() {
    let $reference;

    // determine tab context
    if (this.settings.context === 'parent') {
      if (this.$element.closest(this.settings.selector.ui).length > 0) {
        $reference = this.$element.closest(this.settings.selector.ui);
        this.verbose('Using closest UI element as parent', $reference);
      }
      else {
        $reference = this.$element;
      }
      this.$context = $reference.parent();
      this.verbose('Determined parent element for creating context', this.$context);
    }
    else if (this.settings.context) {
      this.$context = $(this.settings.context);
      this.verbose('Using selector for tab context', this.settings.context, this.$context);
    }
    else {
      this.$context = $('body');
    }
    // find tabs
    if (this.settings.childrenOnly) {
      this.$tabs =this.$context.children(this.settings.selector.tabs);
      this.debug('Searching tab context children for tabs', this.$context, this.$tabs);
    }
    else {
      this.$tabs = this.$context.find(this.settings.selector.tabs);
      this.debug('Searching tab context for tabs', this.$context, this.$tabs);
    }
  }

  fix_callbacks(): void {
    // INVESTIGATE
    // if ($.isPlainObject(parameters) && (parameters.onTabLoad || parameters.onTabInit) ) {
    //   if (parameters.onTabLoad) {
    //     parameters.onLoad = parameters.onTabLoad;
    //     delete parameters.onTabLoad;
    //     module.error(error.legacyLoad, parameters.onLoad);
    //   }
    //   if (parameters.onTabInit) {
    //     parameters.onFirstLoad = parameters.onTabInit;
    //     delete parameters.onTabInit;
    //     module.error(error.legacyInit, parameters.onFirstLoad);
    //   }
    //   this.settings = $.extend(true, {}, $.fn.tab.settings, parameters);
    // }
  }

  changeTab(tabPath): void {
    let
      pushStateAvailable = (window.history && window.history.pushState),
      shouldIgnoreLoad   = (pushStateAvailable && this.settings.ignoreFirstLoad && this.firstLoad),
      remoteContent      = (this.settings.auto || $.isPlainObject(this.settings.apiSettings)),
      // only add default path if not remote content
      pathArray = (remoteContent && !shouldIgnoreLoad)
        ? this.utilities_pathToArray(tabPath)
        : this.get_defaultPathArray(tabPath)
    ;
    tabPath = this.utilities_arrayToPath(pathArray);

    $.each(pathArray, (index, tab) => {
      let
        currentPathArray   = pathArray.slice(0, index + 1),
        currentPath        = this.utilities_arrayToPath(currentPathArray),

        isTab              = this.is_tab(currentPath),
        isLastIndex        = (index + 1 == pathArray.length),

        $tab               = this.get_tabElement(currentPath),
        $anchor,
        nextPathArray,
        nextPath,
        isLastTab
      ;
      this.verbose('Looking for tab', tab);
      if (isTab) {
        this.verbose('Tab was found', tab);
        // scope up
        this.activeTabPath  = currentPath;
        this.parameterArray = this.utilities_filterArray(pathArray, currentPathArray);

        if (isLastIndex) {
          isLastTab = true;
        }
        else {
          nextPathArray = pathArray.slice(0, index + 2);
          nextPath      = this.utilities_arrayToPath(nextPathArray);
          isLastTab     = (!this.is_tab(nextPath));
          if (isLastTab) {
            this.verbose('Tab parameters found', nextPathArray);
          }
        }
        if (isLastTab && remoteContent) {
          if (!shouldIgnoreLoad) {
            this.activate_navigation(currentPath);
            this.fetch_content(currentPath, tabPath);
          }
          else {
            this.debug('Ignoring remote content on first tab load', currentPath);
            this.firstLoad = false;
            this.cache_add(tabPath, $tab.html());
            this.activate_all(currentPath);
            this.settings.onFirstLoad.call($tab[0], currentPath, this.parameterArray, this.historyEvent);
            this.settings.onLoad.call($tab[0], currentPath, this.parameterArray, this.historyEvent);
          }
          return false;
        }
        else {
          this.debug('Opened local tab', currentPath);
          this.activate_all(currentPath);
          if (!this.cache_read(currentPath)) {
            this.cache_add(currentPath, true);
            this.debug('First time tab loaded calling tab init');
            this.settings.onFirstLoad.call($tab[0], currentPath, this.parameterArray, this.historyEvent);
          }
          this.settings.onLoad.call($tab[0], currentPath, this.parameterArray, this.historyEvent);
        }

      }
      else if (tabPath.search('/') == -1 && tabPath !== '') {
        // look for in page anchor
        tabPath = this.escape_string(tabPath);
        $anchor     = $('#' + tabPath + ', a[name="' + tabPath + '"]');
        currentPath = $anchor.closest('[data-tab]').data(this.settings.metadata.tab);
        $tab        = this.get_tabElement(currentPath);
        // if anchor exists use parent tab
        if ($anchor && $anchor.length > 0 && currentPath) {
          this.debug('Anchor link used, opening parent tab', $tab, $anchor);
          if (!$tab.hasClass(this.settings.className.active)) {
            setTimeout(() => {
              this.scrollTo($anchor);
            }, 0);
          }
          this.activate_all(currentPath);
          if (!this.cache_read(currentPath)) {
            this.cache_add(currentPath, true);
            this.debug('First time tab loaded calling tab init');
            this.settings.onFirstLoad.call($tab[0], currentPath, this.parameterArray, this.historyEvent);
          }
          this.settings.onLoad.call($tab[0], currentPath, this.parameterArray, this.historyEvent);
          return false;
        }
      }
      else {
        this.error(this.settings.error.missingTab, this.$element, this.$context, currentPath);
        return false;
      }
    });
  }

  activate_all(tabPath) {
    this.activate_tab(tabPath);
    this.activate_navigation(tabPath);
  }

  activate_tab(tabPath) {
    let
      $tab          = this.get_tabElement(tabPath),
      $deactiveTabs = (this.settings.deactivate == 'siblings')
        ? $tab.siblings(this.$tabs)
        : this.$tabs.not($tab),
      isActive      = $tab.hasClass(this.settings.className.active)
    ;
    this.verbose('Showing tab content for', $tab);
    if (!isActive) {
      $tab.addClass(this.settings.className.active);
      $deactiveTabs.removeClass(this.settings.className.active + ' ' + this.settings.className.loading);
      if ($tab.length > 0) {
        this.settings.onVisible.call($tab[0], tabPath);
      }
    }
  }

  activate_navigation(tabPath) {
    let
      $navigation         = this.get_navElement(tabPath),
      $deactiveNavigation = (this.settings.deactivate == 'siblings')
        ? $navigation.siblings()
        : this.$allModules.not($navigation),
      isActive    = $navigation.hasClass(this.settings.className.active)
    ;
    this.verbose('Activating tab navigation for', $navigation, tabPath);
    if (!isActive) {
      $navigation.addClass(this.settings.className.active);
      $deactiveNavigation.removeClass(this.settings.className.active + ' ' + this.settings.className.loading);
    }
  }

  deactivate_all() {
    this.deactivate_navigation();
    this.deactivate_tabs();
  }

  deactivate_navigation() {
    this.$allModules.removeClass(this.settings.className.active);
  }

  deactivate_tabs() {
    this.$tabs.removeClass(this.settings.className.active + ' ' + this.settings.className.loading);
  }

  initializeHistory() {
    this.debug('Initializing page state');
    if ($.address === undefined) {
      this.error(this.settings.error.state);
      return false;
    }
    else {
      if (this.settings.historyType == 'state') {
        this.debug('Using HTML5 to manage state');
        if (this.settings.path !== null) {
          $.address
            .history(true)
            .state(this.settings.path)
          ;
        }
        else {
          this.error(this.settings.error.path);
          return false;
        }
      }
      $.address.bind('change', this.event_history_change.bind(this));
    }
  }

  determine_activeTab() {
    let
      activeTab = null,
      module = this
    ;

    this.$tabs.each(function(_index, tab) {
      let $tab = $(tab);

      if ($tab.hasClass(module.settings.className.active)) {
        let
          tabPath = $(this).data(module.settings.metadata.tab),
          $anchor = module.$allModules.filter('[data-' + module.settings.metadata.tab + '="' + module.escape_string(tabPath) + '"]')
        ;

        if ($anchor.hasClass(module.settings.className.active)) {
          activeTab = tabPath;
        }
      }
    });

    return activeTab;
  }

  refresh() {
    if (this.activeTabPath) {
      this.debug('Refreshing tab', this.activeTabPath);
      this.changeTab(this.activeTabPath);
    }
  }

  scrollTo($element) {
    let
      scrollOffset = ($element && $element.length > 0)
        ? $element.offset().top
        : false
    ;
    if (scrollOffset !== false) {
      this.debug('Forcing scroll to an in-page link in a hidden tab', scrollOffset, $element);
      $(document).scrollTop(scrollOffset);
    }
  }

  fetch_content(tabPath, fullTabPath) {
    let
      $tab        = this.get_tabElement(tabPath),
      apiSettings = {
        dataType         : 'html',
        encodeParameters : false,
        on               : 'now',
        cache            : this.settings.alwaysRefresh,
        headers          : {
          'X-Remote': true
        },
        onSuccess : (response) => {
          if (this.settings.cacheType == 'response') {
            this.cache_add(fullTabPath, response);
          }
          this.update_content(tabPath, response);
          if (tabPath == this.activeTabPath) {
            this.debug('Content loaded', tabPath);
            this.activate_tab(tabPath);
          }
          else {
            this.debug('Content loaded in background', tabPath);
          }
          this.settings.onFirstLoad.call($tab[0], tabPath, this.parameterArray, this.historyEvent);
          this.settings.onLoad.call($tab[0], tabPath, this.parameterArray, this.historyEvent);

          if (this.settings.loadOnce) {
            this.cache_add(fullTabPath, true);
          }
          else if (typeof this.settings.cacheType == 'string' && this.settings.cacheType.toLowerCase() == 'dom' && $tab.children().length > 0) {
            setTimeout(() => {
              let $clone = $tab.children().clone(true);
              $clone = $clone.not('script');
              this.cache_add(fullTabPath, $clone);
            }, 0);
          }
          else {
            this.cache_add(fullTabPath, $tab.html());
          }
        },
        urlData: {
          tab: fullTabPath
        }
      },
      request         = $tab.api('get request') || false,
      existingRequest = (request && request.state() === 'pending'),
      requestSettings,
      cachedContent
    ;

    fullTabPath   = fullTabPath || tabPath;
    cachedContent = this.cache_read(fullTabPath);


    if (this.settings.cache && cachedContent) {
      this.activate_tab(tabPath);
      this.debug('Adding cached content', fullTabPath);
      if (!this.settings.loadOnce) {
        if (this.settings.evaluateScripts == 'once') {
          this.update_content(tabPath, cachedContent, false);
        }
        else {
          this.update_content(tabPath, cachedContent);
        }
      }
      this.settings.onLoad.call($tab[0], tabPath, this.parameterArray, this.historyEvent);
    }
    else if (existingRequest) {
      this.set_loading(tabPath);
      this.debug('Content is already loading', fullTabPath);
    }
    else if ($.api !== undefined) {
      requestSettings = $.extend(true, {}, this.settings.apiSettings, apiSettings);
      this.debug('Retrieving remote content', fullTabPath, requestSettings);
      this.set_loading(tabPath);
      $tab.api(requestSettings);
    }
    else {
      this.error(this.settings.error.api);
    }
  }

  update_content(tabPath, html, evaluateScripts = this.settings.evaluateScripts) {
    let
      $tab = this.get_tabElement(tabPath),
      tab  = $tab[0]
    ;
    if (typeof this.settings.cacheType == 'string' && this.settings.cacheType.toLowerCase() == 'dom' && typeof html !== 'string') {
      $tab
        .empty()
        .append($(html).clone(true))
      ;
    }
    else {
      if (evaluateScripts) {
        this.debug('Updating HTML and evaluating inline scripts', tabPath, html);
        $tab.html(html);
      }
      else {
        this.debug('Updating HTML', tabPath, html);
        tab.innerHTML = html;
      }
    }
  }

  is_tab(tabName): boolean {
    return (tabName !== undefined)
      ? (this.get_tabElement(tabName).length > 0)
      : false
    ;
  }

  get_initialPath() {
    return this.$allModules.eq(0).data(this.settings.metadata.tab) || this.$tabs.eq(0).data(this.settings.metadata.tab);
  }

  get_path() {
    return $.address.value();
  }

  // adds default tabs to tab path
  get_defaultPathArray(tabPath) {
    return this.utilities_pathToArray(this.get_defaultPath(tabPath));
  }

  get_defaultPath(tabPath) {
    let
      $defaultNav = this.$allModules.filter('[data-' + this.settings.metadata.tab + '^="' + this.escape_string(tabPath) + '/"]').eq(0),
      defaultTab  = $defaultNav.data(this.settings.metadata.tab) || false,
      recursionDepth: number = 0
    ;
    if (defaultTab) {
      this.debug('Found default tab', defaultTab);
      if (recursionDepth < this.settings.maxDepth) {
        recursionDepth++;
        return this.get_defaultPath(defaultTab);
      }
      this.error(this.settings.error.recursion);
    }
    else {
      this.debug('No default tabs found for', tabPath, this.$tabs);
    }
    recursionDepth = 0;
    return tabPath;
  }

  get_navElement(tabPath = this.activeTabPath) {
    return this.$allModules.find('[data-' + this.settings.metadata.tab + '="' + this.escape_string(tabPath) + '"]');
  }

  get_tabElement(tabPath) {
    let
      $fullPathTab,
      $simplePathTab,
      tabPathArray,
      lastTab
    ;
    tabPath        = tabPath || this.activeTabPath;
    tabPathArray   = this.utilities_pathToArray(tabPath);
    lastTab        = this.utilities_last(tabPathArray);
    $fullPathTab   = this.$tabs.filter('[data-' + this.settings.metadata.tab + '="' + this.escape_string(tabPath) + '"]');
    $simplePathTab = this.$tabs.filter('[data-' + this.settings.metadata.tab + '="' + this.escape_string(lastTab) + '"]');
    return ($fullPathTab.length > 0)
      ? $fullPathTab
      : $simplePathTab
    ;
  }

  get_tab() {
    return this.activeTabPath;
  }

  set_auto(): void {
    let url = (this.settings.path !== null)
      ? this.settings.path.replace(/\/$/, '') + '/{$tab}'
      : '/{$tab}'
    ;
    this.verbose('Setting up automatic tab retrieval from server', url);
    if ($.isPlainObject(this.settings.apiSettings)) {
      this.settings.apiSettings.url = url;
    }
    else {
      this.settings.apiSettings = {
        url: url
      };
    }
  }

  set_loading(tabPath): void {
    let
      $tab      = this.get_tabElement(tabPath),
      isLoading = $tab.hasClass(this.settings.className.loading)
    ;
    if (!isLoading) {
      this.verbose('Setting loading state for', $tab);
      $tab
        .addClass(this.settings.className.loading)
        .siblings(this.$tabs)
        .removeClass(this.settings.className.active + ' ' + this.settings.className.loading)
      ;
      if ($tab.length > 0) {
        this.settings.onRequest.call($tab[0], tabPath);
      }
    }
  }

  set_state(state): void {
    $.address.value(state);
  }

  utilities_filterArray(keepArray, removeArray) {
    // return $.grep(keepArray, function(keepValue) {
    //   return ( $.inArray(keepValue, removeArray) == -1);
    // });
    keepArray.filter((keepValue) => {
      return (removeArray.indexOf(keepValue) == -1)
    });
  }

  utilities_last(array) {
    return Array.isArray(array)
      ? array[ array.length - 1]
      : false
    ;
  }

  utilities_pathToArray(pathName) {
    if (pathName === undefined) {
      pathName = this.activeTabPath;
    }
    return typeof pathName == 'string'
      ? pathName.split('/')
      : [pathName]
    ;
  }

  utilities_arrayToPath(pathArray) {
    return Array.isArray(pathArray)
      ? pathArray.join('/')
      : false
    ;
  }

  escape_string(text) {
    text =  String(text);
    return text.replace(this.settings.regExp.escape, '\\$&');
  }

  cache_read(cacheKey) {
    return (cacheKey !== undefined)
      ? this.cache[cacheKey]
      : false
    ;
  }

  cache_add(cacheKey, content) {
    cacheKey = cacheKey || this.activeTabPath;
    this.debug('Adding cached content for', cacheKey);
    this.cache[cacheKey] = content;
  }

  cache_remove(cacheKey) {
    cacheKey = cacheKey || this.activeTabPath;
    this.debug('Removing cached content for', cacheKey);
    delete this.cache[cacheKey];
  }
}
