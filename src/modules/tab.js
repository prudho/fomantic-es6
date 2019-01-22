"use strict";

import Module from '../module'

import $ from 'cash-dom';

const isWindow = $.isWindow || function(obj) {
    return obj != null && obj === obj.window;
};

const isPlainObject = $.isPlainObject || function(obj) {
    return obj!=null && typeof(obj)=="object" && Object.getPrototypeOf(obj)==Object.prototype 
}

const settings = {
    name            : 'Tab',
    namespace       : 'tab',

    silent          : false,
    debug           : false,
    verbose         : false,
    performance     : true,

    auto            : false,      // uses pjax style endpoints fetching content from same url with remote-content headers
    history         : false,      // use browser history
    historyType     : 'hash',     // #/ or html5 state
    path            : false,      // base path of url

    context         : false,      // specify a context that tabs must appear inside
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
        legacyInit : 'onTabInit has been renamed to onFirstLoad in 2.0, please adjust your code.',
        legacyLoad : 'onTabLoad has been renamed to onLoad in 2.0. Please adjust your code',
        state      : 'History requires Asual\'s Address library <https://github.com/asual/jquery-address>'
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

    events: [
        'FirstLoad', // called first time loaded
        'Load', // called on every load
        'Visible', // called every time tab visible
        'Request' // called ever time a tab beings loading remote content
    ]
}

export class Tab extends Module {
    constructor(selector, parameters) {
        super(selector, parameters, settings);

        this.initializedHistory = false;

        this.cache = {};
        this.firstLoad = true;
        this.recursionDepth = 0;
        
        this.initialize()
    }

    initialize() {
        this.verbose('Initializing tab module', this.settings);

        this.fix_callbacks();
        this.determineTabs();

        this.debug('Determining tabs', this.settings.context, this.$tabs);
        // set up automatic routing
        if (this.settings.auto) {
            module.set.auto();
        }
        this.bind_events();

        if (this.settings.history && !this.initializedHistory) {
            module.initializeHistory();
            this.initializedHistory = true;
        }

        this.instantiate();
    }

    instantiate() {
        this.verbose('Instantiating module', this.settings);
        this.instance = this; // FIXME
        this.$element.data(this.moduleNamespace, this);
    }

    destroy() {
        this.verbose('Destroying previous instance', this.instance);
        this.remove_events();
        this.$element.removeData(this.moduleNamespace);
    }

    fix_callbacks() {
        /* INVESTIGATE
        if( $.isPlainObject(parameters) && (parameters.onTabLoad || parameters.onTabInit) ) {
            if(parameters.onTabLoad) {
                parameters.onLoad = parameters.onTabLoad;
                delete parameters.onTabLoad;
                module.error(error.legacyLoad, parameters.onLoad);
            }
            if(parameters.onTabInit) {
                parameters.onFirstLoad = parameters.onTabInit;
                delete parameters.onTabInit;
                module.error(error.legacyInit, parameters.onFirstLoad);
            }
            settings = $.extend(true, {}, $.fn.tab.settings, parameters);
        }
        */
    }

    determineTabs() {
        var $reference;

        // determine tab context
        if (this.settings.context === 'parent') {
            if (this.$element.closest(this.settings.selector.ui).length > 0) {
                $reference = this.$element.closest(this.settings.selector.ui);
                this.verbose('Using closest UI element as parent', $reference);
            } else {
                $reference = this.$element;
            }
            this.$context = $reference.parent();
            this.verbose('Determined parent element for creating context', this.$context);
        } else if (this.settings.context) {
            this.$context = $(this.settings.context);
            this.verbose('Using selector for tab context', this.settings.context, this.$context);
        } else {
            this.$context = $('body');
        }
        // find tabs
        if (this.settings.childrenOnly) {
            this.$tabs = this.$context.children(this.settings.selector.tabs);
            this.debug('Searching tab context children for tabs', this.$context, this.$tabs);
        } else {
            this.$tabs = this.$context.find(this.settings.selector.tabs);
            this.debug('Searching tab context for tabs', this.$context, this.$tabs);
        }
    }

    bind_events() {
        // if using $.tab don't add events
        if (!isWindow(this.element)) {
            this.debug('Attaching tab activation events to element', this.$element);
            this.$element.on('click' + this.eventNamespace, this.event_click.bind(this));
        }
    }

    event_click(event) {
        var tabPath = $(event.target).data(this.settings.metadata.tab);

        if (tabPath !== undefined) {
            if (this.settings.history) {
                this.verbose('Updating page state', event);
                $.address.value(tabPath);
            } else {
                this.verbose('Changing tab', event);
                this.changeTab(tabPath);
            }
            event.preventDefault();
        } else {
            this.debug('No tab specified');
        }
    }

    changeTab(tabPath) {
        var
            pushStateAvailable = (window.history && window.history.pushState),
            shouldIgnoreLoad   = (pushStateAvailable && this.settings.ignoreFirstLoad && this.firstLoad),
            remoteContent      = (this.settings.auto || isPlainObject(this.settings.apiSettings)),
            // only add default path if not remote content
            pathArray = (remoteContent && !shouldIgnoreLoad)
                ? this.utilities_pathToArray(tabPath)
                : this.get_defaultPathArray(tabPath)
        ;
        tabPath = this.utilities_arrayToPath(pathArray);
        $.each(pathArray, function(index, tab) {
            var
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
                } else {
                    nextPathArray = pathArray.slice(0, index + 2);
                    nextPath      = module.utilities.arrayToPath(nextPathArray);
                    isLastTab     = ( !module.is.tab(nextPath) );
                    if(isLastTab) {
                    module.verbose('Tab parameters found', nextPathArray);
                    }
                }
                if(isLastTab && remoteContent) {
                    if(!shouldIgnoreLoad) {
                    module.activate.navigation(currentPath);
                    module.fetch.content(currentPath, tabPath);
                    }
                    else {
                    module.debug('Ignoring remote content on first tab load', currentPath);
                    firstLoad = false;
                    module.cache.add(tabPath, $tab.html());
                    module.activate.all(currentPath);
                    settings.onFirstLoad.call($tab[0], currentPath, parameterArray, historyEvent);
                    settings.onLoad.call($tab[0], currentPath, parameterArray, historyEvent);
                    }
                    return false;
                } else {
                    this.debug('Opened local tab', currentPath);
                    this.activate_all(currentPath);
                    if (!this.cache_read(currentPath)) {
                        this.cache_add(currentPath, true);
                        this.debug('First time tab loaded calling tab init');
                        this.invokeCallback('FirstLoad').call($tab[0], currentPath, this.parameterArray, this.historyEvent);
                    }
                    this.invokeCallback('Load').call($tab[0], currentPath, this.parameterArray, this.historyEvent);
                }

            } else if(tabPath.search('/') == -1 && tabPath !== '') {
                // look for in page anchor
                $anchor     = $('#' + tabPath + ', a[name="' + tabPath + '"]');
                currentPath = $anchor.closest('[data-tab]').data(metadata.tab);
                $tab        = module.get.tabElement(currentPath);
                // if anchor exists use parent tab
                if($anchor && $anchor.length > 0 && currentPath) {
                    module.debug('Anchor link used, opening parent tab', $tab, $anchor);
                    if( !$tab.hasClass(className.active) ) {
                    setTimeout(function() {
                        module.scrollTo($anchor);
                    }, 0);
                    }
                    module.activate.all(currentPath);
                    if( !module.cache.read(currentPath) ) {
                    module.cache.add(currentPath, true);
                    module.debug('First time tab loaded calling tab init');
                    settings.onFirstLoad.call($tab[0], currentPath, parameterArray, historyEvent);
                    }
                    settings.onLoad.call($tab[0], currentPath, parameterArray, historyEvent);
                    return false;
                }
            } else {
                this.error(this.settings.error.missingTab, this.$element, this.$context, currentPath);
                return false;
            }
        }.bind(this));
    }

    activate_all(tabPath) {
        this.activate_tab(tabPath);
        this.activate_navigation(tabPath);
    }

    activate_navigation(tabPath) {
        var
            $navigation         = this.get_navElement(tabPath),
            $deactiveNavigation = (this.settings.deactivate == 'siblings')
                ? $navigation.siblings(this.$element.children())
                : this.$element.children().not($navigation),
            isActive    = $navigation.hasClass(this.settings.className.active)
        ;
        this.verbose('Activating tab navigation for', $navigation, tabPath);
        if (!isActive) {
            $navigation.addClass(this.settings.className.active);
            $deactiveNavigation.removeClass(this.settings.className.active + ' ' + this.settings.className.loading);
        }
    }

    activate_tab(tabPath) {
        var
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
                this.invokeCallback('Visible').call($tab[0], tabPath);
            }
        }
    }

    cache_add(cacheKey, content) {
        cacheKey = cacheKey || activeTabPath;
        this.debug('Adding cached content for', cacheKey);
        this.cache[cacheKey] = content;
    }

    cache_read(cacheKey) {
        return (cacheKey !== undefined) ? this.cache[cacheKey] : false;
    }

    get_defaultPath(tabPath) {
        
        var
            //$defaultNav = $allModules.filter('[data-' + this.settings.metadata.tab + '^="' + tabPath + '/"]').eq(0),
            //defaultTab  = $defaultNav.data(this.settings.metadata.tab) || false
            defaultTab = false
        ;
        if( defaultTab ) {
            module.debug('Found default tab', defaultTab);
            if(recursionDepth < settings.maxDepth) {
            recursionDepth++;
            return module.get.defaultPath(defaultTab);
            }
            module.error(error.recursion);
        }
        else {
            this.debug('No default tabs found for', tabPath, this.$tabs);
        }
        this.recursionDepth = 0;
        return tabPath;
    }

    get_defaultPathArray(tabPath) { // adds default tabs to tab path
        return this.utilities_pathToArray(this.get_defaultPath(tabPath));
    }

    get_navElement(tabPath) {
        tabPath = tabPath || this.activeTabPath;
        //return $allModules.filter('[data-' + metadata.tab + '="' + tabPath + '"]');
        return this.$element.children().filter('[data-' + this.settings.metadata.tab + '="' + tabPath + '"]');
    }

    get_tabElement(tabPath) {
        var
              $fullPathTab,
              $simplePathTab,
              tabPathArray,
              lastTab
        ;
        tabPath        = tabPath || this.activeTabPath;
        tabPathArray   = this.utilities_pathToArray(tabPath);
        lastTab        = this.utilities_last(tabPathArray);
        $fullPathTab   = this.$tabs.filter('[data-' + this.settings.metadata.tab + '="' + tabPath + '"]');
        $simplePathTab = this.$tabs.filter('[data-' + this.settings.metadata.tab + '="' + lastTab + '"]');
        return ($fullPathTab.length > 0)
            ? $fullPathTab
            : $simplePathTab
        ;
    }

    is_tab(tabName) {
        return (tabName !== undefined)
            ? (this.get_tabElement(tabName).length > 0)
            : false
        ;
    }

    utilities_arrayToPath(pathArray) {
        return Array.isArray(pathArray) ? pathArray.join('/') : false;
    }

    utilities_filterArray (keepArray, removeArray) {
        return keepArray.filter(function(keepValue) {
            return (removeArray.indexOf(keepValue) == -1);
        });

        /*return $.grep(keepArray, function(keepValue) {
            return ($.inArray(keepValue, removeArray) == -1);
        });*/
    }

    utilities_last(array) {
        return Array.isArray(array) ? array[array.length - 1] : false;
    }

    utilities_pathToArray (pathName) {
        if(pathName === undefined) {
            pathName = this.activeTabPath;
        }
        return typeof pathName == 'string' ? pathName.split('/') : [pathName];
    }
}
