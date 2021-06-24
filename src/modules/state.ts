'use strict';

import { Module, ModuleOptions } from '../module'
import Utils from '../utils';

import $, { Cash } from 'cash-dom';

export interface StateOptions extends ModuleOptions {
  automatic      : boolean;
  sync           : boolean;
  flashDuration  : number;

  // selector filter
  filter     : {
    text   : string;
    active : string;
  }

  context    : string;

  // error
  error: {
    beforeSend : string;
    method     : string;
  },

  // metadata
  metadata: {
    promise    : string;
    storedText : string;
  }

  // change class on state
  className: {
    active   : string;
    disabled : string;
    error    : string;
    loading  : string;
    success  : string;
    warning  : string;
  }

  selector: {
    // selector for text node
    text: string;
  }

  defaults : {
    input: {
      disabled : boolean;
      loading  : boolean;
      active   : boolean;
    },
    button: {
      disabled : boolean;
      loading  : boolean;
      active   : boolean;
    },
    progress: {
      active   : boolean;
      success  : boolean;
      warning  : boolean;
      error    : boolean;
    }
  }

  states     : {
    active   : boolean;
    disabled : boolean;
    error    : boolean;
    loading  : boolean;
    success  : boolean;
    warning  : boolean;
  }

  text     : {
    loading    : string;
    disabled   : boolean;
    flash      : boolean;
    hover      : string;
    active     : boolean;
    inactive   : boolean;
    activate   : boolean;
    deactivate : boolean;
  }

  // callback occurs on state change
  onActivate     : Function;
  onDeactivate   : Function;
  onChange       : Function;

  // state test functions
  activateTest   : Function;
  deactivateTest : Function;
}

const default_settings: StateOptions = {
  // module info
  name           : 'State',

  silent         : false,
  
  // debug output
  debug          : false,

  // verbose debug output
  verbose        : false,

  // namespace for events
  namespace      : 'state',

  // debug data includes performance
  performance    : true,

  // whether to automatically map default states
  automatic      : true,

  // activate / deactivate changes all elements instantiated at same time
  sync           : false,

  // default flash text duration, used for temporarily changing text of an element
  flashDuration  : 1000,

  // selector filter
  filter     : {
    text   : '.loading, .disabled',
    active : '.disabled'
  },

  context    : null,

  // error
  error: {
    beforeSend : 'The before send function has cancelled state change',
    method     : 'The method you called is not defined.'
  },

  // metadata
  metadata: {
    promise    : 'promise',
    storedText : 'stored-text'
  },

  // change class on state
  className: {
    active   : 'active',
    disabled : 'disabled',
    error    : 'error',
    loading  : 'loading',
    success  : 'success',
    warning  : 'warning'
  },

  selector: {
    // selector for text node
    text: null
  },

  defaults : {
    input: {
      disabled : true,
      loading  : true,
      active   : true
    },
    button: {
      disabled : true,
      loading  : true,
      active   : true,
    },
    progress: {
      active   : true,
      success  : true,
      warning  : true,
      error    : true
    }
  },

  states     : {
    active   : true,
    disabled : true,
    error    : true,
    loading  : true,
    success  : true,
    warning  : true
  },

  text     : {
    loading    : null,
    disabled   : false,
    flash      : false,
    hover      : null,
    active     : false,
    inactive   : false,
    activate   : false,
    deactivate : false
  },

  // callback occurs on state change
  onActivate     : function() {},
  onDeactivate   : function() {},
  onChange       : function() {},

  // state test functions
  activateTest   : function() { return true; },
  deactivateTest : function() { return true; },
}

export class State extends Module {
  settings: StateOptions;

  instance: State;

  constructor(selector: string, parameters: any) {
    super(selector, parameters, default_settings);
    
    this.initialize();
  }

  initialize(): void {
    this.verbose('Initializing module');
  
    // allow module to guess desired state based on element
    if (this.settings.automatic) {
      this.add_defaults();
    }

    // bind events with delegated events
    if (this.settings.context && this.selector !== '') {
      $(this.settings.context)
        .on(this.selector, 'mouseenter' + this.eventNamespace, this.change_text)
        .on(this.selector, 'mouseleave' + this.eventNamespace, this.reset_text)
        .on(this.selector, 'click'      + this.eventNamespace, this.toggle_state)
      ;
    }
    else {
      this.$element
        .on('mouseenter' + this.eventNamespace, this.change_text)
        .on('mouseleave' + this.eventNamespace, this.reset_text)
        .on('click'      + this.eventNamespace, this.toggle_state)
      ;
    }
    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Storing instance of module', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.verbose('Destroying previous module', this.instance);
    this.$element
      .off(this.eventNamespace)
      .removeAttr(this.moduleNamespace)
    ;
  }

  refresh(): void {
    this.verbose('Refreshing selector cache');
    this.$element = $(this.element);
  }

  add_defaults() {
    let userStates = this.settings && $.isPlainObject(this.settings.states)
      ? this.settings.states
      : {}
    ;
    $.each(this.settings.defaults, (type, typeStates) => {
      if (module.is[type] !== undefined && module.is[type]() ) {
        this.verbose('Adding default states', type, this.element);
        $.extend(this.settings.states, typeStates, userStates);
      }
    });
  }

  toggle_state() {
    let
      apiRequest,
      requestCancelled
    ;
    if (this.allows('active') && this.is_enabled()) {
      this.refresh();
      // if($.fn.api !== undefined) {
        apiRequest       = this.$element.api('get request');
        requestCancelled = this.$element('was cancelled');
        if (requestCancelled) {
          this.debug('API Request cancelled by beforesend');
          this.settings.activateTest   = function(){ return false; };
          this.settings.deactivateTest = function(){ return false; };
        }
        else if(apiRequest) {
          this.listenTo(apiRequest);
          return;
        }
      // }
      this.change_state();
    }
  }

  listenTo(apiRequest) {
    this.debug('API request detected, waiting for state signal', apiRequest);
    if (apiRequest) {
      if (this.settings.text.loading) {
        this.update_text(this.settings.text.loading);
      }
      $.when(apiRequest)
        .then(() => {
          if(apiRequest.state() == 'resolved') {
            this.debug('API request succeeded');
            this.settings.activateTest   = function(){ return true; };
            this.settings.deactivateTest = function(){ return true; };
          }
          else {
            this.debug('API request failed');
            this.settings.activateTest   = function(){ return false; };
            this.settings.deactivateTest = function(){ return false; };
          }
          this.change_state();
        })
      ;
    }
  }

  allow(state) {
    this.debug('Now allowing state', state);
    this.settings.states[state] = true;
  }

  disallow(state) {
    this.debug('No longer allowing', state);
    this.settings.states[state] = false;
  }

  allows(state) {
    return this.settings.states[state] || false;
  }

  enable() {
    this.$element.removeClass(this.settings.className.disabled);
  }

  disable() {
    this.$element.addClass(this.settings.className.disabled);
  }

  change_state() {
    this.debug('Determining state change direction');
    // inactive to active change
    if (this.is_inactive()) {
      this.activate();
    }
    else {
      this.deactivate();
    }
    if (this.settings.sync) {
      this.sync();
    }
    this.settings.onChange.call(this.element);
  }

  change_text() {
    if (this.is_textEnabled()) {
      if (this.is_disabled()) {
        this.verbose('Changing text to disabled text', this.settings.text.hover);
        this.update_text(this.settings.text.disabled);
      }
      else if (this.is_active()) {
        if (this.settings.text.hover) {
          this.verbose('Changing text to hover text', this.settings.text.hover);
          this.update_text(this.settings.text.hover);
        }
        else if (this.settings.text.deactivate) {
          this.verbose('Changing text to deactivating text', this.settings.text.deactivate);
          this.update_text(this.settings.text.deactivate);
        }
      }
      else {
        if (this.settings.text.hover) {
          this.verbose('Changing text to hover text',this.settings. text.hover);
          this.update_text(this.settings.text.hover);
        }
        else if (this.settings.text.activate){
          this.verbose('Changing text to activating text', this.settings.text.activate);
          this.update_text(this.settings.text.activate);
        }
      }
    }
  }

  setState(state) {
    if (this.allows(state)) {
      this.$element.addClass(this.settings.className[state]);
    }
  }

  removeState(state) {
    if (this.allows(state)) {
      this.$element.removeClass(this.settings.className[state]);
    }
  }

  activate() {
    if (this.settings.activateTest.call(this.element)) {
      this.debug('Setting state to active');
      this.$element.addClass(this.settings.className.active);
      this.update_text(this.settings.text.active);
      this.settings.onActivate.call(this.element);
    }
  }

  deactivate() {
    if (this.settings.deactivateTest.call(this.element)) {
      this.debug('Setting state to inactive');
      this.$element.removeClass(this.settings.className.active);
      this.update_text(this.settings.text.inactive);
      this.settings.onDeactivate.call(this.element);
    }
  }

  sync() {
    this.verbose('Syncing other buttons to current state');
    if (this.is_active()) {
      $allModules
        .not(this.$element)
          .state('activate');
    }
    else {
      $allModules
        .not(this.$element)
          .state('deactivate')
      ;
    }
  }

  get_text() {
    return (this.settings.selector.text)
      ? this.$element.find(this.settings.selector.text).text()
      : this.$element.html()
    ;
  }

  get_textFor(state) {
    return this.settings.text[state] || false;
  }

  is_active() {
    return this.$element.hasClass(this.settings.className.active);
  }

  is_loading() {
    return this.$element.hasClass(this.settings.className.loading);
  }

  is_inactive() {
    return !(this.$element.hasClass(this.settings.className.active));
  }

  is_state(state) {
    if (this.settings.className[state] === undefined) {
      return false;
    }
    return this.$element.hasClass(this.settings.className[state]);
  }

  is_enabled() {
    return !(this.$element.is(this.settings.filter.active));
  }

  is_disabled() {
    return (this.$element.is(this.settings.filter.active));
  }

  is_textEnabled() {
    return !(this.$element.is(this.settings.filter.text));
  }

  // definitions for automatic type detection
  is_button() {
    return this.$element.is('.button:not(a, .submit)');
  }

  is_input() {
    return this.$element.is('input');
  }

  is_progress() {
    return this.$element.is('.ui.progress');
  }

  flash_text(text, duration, callback: Function = () => {}) {
    let previousText = this.get_text();
    this.debug('Flashing text message', text, duration);
    text     = text     || this.settings.text.flash;
    duration = duration || this.settings.flashDuration;
    this.update_text(text);
    setTimeout(() => {
      this.update_text(previousText);
      callback.call(this.element);
    }, duration);
  }

  // on mouseout sets text to previous value
  reset_text() {
    let
      activeText   = this.settings.text.active   || this.$element.data(this.settings.metadata.storedText),
      inactiveText = this.settings.text.inactive || this.$element.data(this.settings.metadata.storedText)
    ;
    if (this.is_textEnabled()) {
      if (this.is_active() && activeText) {
        this.verbose('Resetting active text', activeText);
        this.update_text(activeText);
      }
      else if (inactiveText) {
        this.verbose('Resetting inactive text', activeText);
        this.update_text(inactiveText);
      }
    }
  }

  update_text(text) {
    let currentText = this.get_text();
    if (text && text !== currentText) {
      this.debug('Updating text', text);
      if (this.settings.selector.text) {
        this.$element
          .data(this.settings.metadata.storedText, text)
          .find(this.settings.selector.text)
            .text(text)
        ;
      }
      else {
        this.$element
          .data(this.settings.metadata.storedText, text)
          .html(text)
        ;
      }
    }
    else {
      this.debug('Text is already set, ignoring update', text);
    }
  }
}
  