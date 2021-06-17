"use strict";

import { Module, ModuleOptions } from '../module';

import $, { Cash } from 'cash-dom';

export interface CheckboxOptions extends ModuleOptions {
  uncheckable: string;
  fireOnInit: boolean;
  enableEnterKey: boolean;

  onChange: Function;

  beforeChecked: Function;
  beforeUnchecked: Function;
  beforeDeterminate: Function;
  beforeIndeterminate: Function;

  onChecked: Function;
  onUnchecked: Function;

  onDeterminate: Function;
  onIndeterminate: Function;

  onEnable: Function;
  onDisable: Function;

  onEnabled: Function;
  onDisabled: Function;

  className       : {
    checked       : string;
    indeterminate : string;
    disabled      : string;
    hidden        : string;
    radio         : string;
    readOnly      : string;
  }

  error: {
    method: string;
  }

  selector : {
    checkbox : string;
    label    : string;
    input    : string;
    link     : string;
  };

  events: Array<string>;
}

const default_settings: CheckboxOptions = {
  name                : 'Checkbox',
  namespace           : 'checkbox',

  silent              : false,
  debug               : false,
  verbose             : true,
  performance         : true,

  // delegated event context
  uncheckable         : 'auto',
  fireOnInit          : false,
  enableEnterKey      : true,

  onChange            : function() {},

  beforeChecked       : function() {},
  beforeUnchecked     : function() {},
  beforeDeterminate   : function() {},
  beforeIndeterminate : function() {},

  onChecked           : function() {},
  onUnchecked         : function() {},

  onDeterminate       : function() {},
  onIndeterminate     : function() {},

  onEnable            : function() {},
  onDisable           : function() {},

  // preserve misspelled callbacks (will be removed in 3.0)
  onEnabled           : function() {},
  onDisabled          : function() {},

  className       : {
    checked       : 'checked',
    indeterminate : 'indeterminate',
    disabled      : 'disabled',
    hidden        : 'hidden',
    radio         : 'radio',
    readOnly      : 'read-only'
  },

  error     : {
    method       : 'The method you called is not defined'
  },

  selector : {
    checkbox : '.ui.checkbox',
    label    : 'label, .box',
    input    : 'input[type="checkbox"], input[type="radio"]',
    link     : 'a[href]'
  },

  events: ['change', 'beforeChecked', 'beforeUnchecked', 'beforeDeterminate', 'beforeIndeterminate', 'checked', 'unchecked', 'determinate', 'indeterminate', 'enable', 'disable']
}

export class Checkbox extends Module {
  $input: Cash;
  $label: Cash;
  
  initialLoad: boolean;
  shortcutPressed: boolean = false;

  observer: MutationObserver;
  input;

  instance: Checkbox;

  constructor(selector, parameters) {
    super(selector, parameters, default_settings);

    this.$input = this.$element.children(this.settings.selector.input);
    this.$label = this.$element.children(this.settings.selector.label);

    this.input  = this.$input[0];

    this.initialize();
  }

  initialize(): void {
    this.verbose('Initializing checkbox', this.settings);
  
    this.create_label();
    this.bind_events();

    this.set_tabbable();
    this.hide_input();

    this.observeChanges();
    this.instantiate();
    this.setup();
  }

  instantiate(): void {
    this.verbose('Storing instance of module', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.verbose('Destroying module');
    this.unbind_events();
    this.show_input();
    this.$element.removeAttr(this.moduleNamespace);
  }

  create_label(): void {
    if (this.$input.prevAll(this.settings.selector.label).length > 0) {
      this.$input.prev(this.settings.selector.label).detach().insertAfter(this.$input);
      this.debug('Moving existing label', this.$label);
    }
    else if (!this.has_label()) {
      this.$label = $('<label>').insertAfter(this.$input);
      this.debug('Creating label', this.$label);
    }
  }

  setup(): void {
    this.set_initialLoad();
    if (this.is_indeterminate()) {
      this.debug('Initial value is indeterminate');
      this.indeterminate();
    }
    else if (this.is_checked()) {
      this.debug('Initial value is checked');
      this.check();
    }
    else {
      this.debug('Initial value is unchecked');
      this.uncheck();
    }
    this.remove_initialLoad();
  }

  bind_events(): void {
    this.verbose('Attaching checkbox events');
    this.$element
      .on('click'   + this.eventNamespace, this.event_click.bind(this))
      .on('change'  + this.eventNamespace, this.event_change.bind(this))
      .on('keydown' + this.eventNamespace, this.settings.selector.input, this.event_keydown.bind(this))
      .on('keyup'   + this.eventNamespace, this.settings.selector.input, this.event_keyup.bind(this))
    ;
  }

  event_change(_event): void {
    if (!this.should_ignoreCallbacks()) {
      this.settings.onChange.call(this.input);
    }
  }

  event_click(event): void {
    let $target = $(event.target);
    if ($target.is(this.settings.selector.input)) {
      this.verbose('Using default check action on initialized checkbox');
      return;
    }
    if ($target.is(this.settings.selector.link) ) {
      this.debug('Clicking link inside checkbox, skipping toggle');
      return;
    }
    this.toggle();
    this.$input.trigger('focus');
    event.preventDefault();
  }

  event_keydown(event) {
    let
      key     = event.which,
      keyCode = {
        enter  : 13,
        space  : 32,
        escape : 27,
        left   : 37,
        up     : 38,
        right  : 39,
        down   : 40
      }
    ;

    let
      r = this.get_radios(),
      rIndex = r.index(this.$element),
      rLen = r.length,
      checkIndex: any = false
    ;

    if (key == keyCode.left || key == keyCode.up) {
      checkIndex = (rIndex === 0 ? rLen : rIndex) - 1;
    } else if (key == keyCode.right || key == keyCode.down) {
      checkIndex = rIndex === rLen-1 ? 0 : rIndex+1;
    }

    if (!this.should_ignoreCallbacks() && checkIndex !== false) {
      if (this.settings.beforeUnchecked.apply(this.input) === false) {
        this.verbose('Option not allowed to be unchecked, cancelling key navigation');
        return false;
      }
      if (this.settings.beforeChecked.apply($(r[checkIndex]).children(this.settings.selector.input)[0]) === false) {
        this.verbose('Next option should not allow check, cancelling key navigation');
        return false;
      }
    }

    if (key == keyCode.escape) {
      this.verbose('Escape key pressed blurring field');
      this.$input.trigger('blur');
      this.shortcutPressed = true;
    }
    else if (!event.ctrlKey && ( key == keyCode.space || (key == keyCode.enter && this.settings.enableEnterKey))) {
      this.verbose('Enter/space key pressed, toggling checkbox');
      this.toggle();
      this.shortcutPressed = true;
    }
    else {
      this.shortcutPressed = false;
    }
  }

  event_keyup(event) {
    if (this.shortcutPressed) {
      event.preventDefault();
    }
  }

  unbind_events(): void {
    this.debug('Removing events');
    this.$element.off(this.eventNamespace);
  }

  observeChanges(): void {
    if ('MutationObserver' in window) {
      this.observer = new MutationObserver((mutations) => {
        this.debug('DOM tree modified, updating selector cache');
        this.refresh();
      });
      this.observer.observe(this.element, {
        childList : true,
        subtree   : true
      });
      this.debug('Setting up mutation observer', this.observer);
    }
  }

  show_input(): void {
    this.verbose('Modifying <input> z-index to be selectable');
    this.$input.removeClass(this.settings.className.hidden);
  }

  hide_input(): void {
    this.verbose('Modifying <input> z-index to be unselectable');
    this.$input.addClass(this.settings.className.hidden);
  }

  refresh(): void {
    this.$label = this.$element.children(this.settings.selector.label);
    this.$input = this.$element.children(this.settings.selector.input);
    this.input  = this.$input[0];
  }

  check() {
    if (!this.should_allowCheck()) {
      return;
    }
    this.debug('Checking checkbox', this.$input);
    this.set_checked();
    if (!this.should_ignoreCallbacks()) {
      this.settings.onChecked.call(this.input);
      this.trigger_change();
    }
    this.preventDefaultOnInputTarget();
  }

  uncheck() {
    if (!this.should_allowUncheck()) {
      return;
    }
    this.debug('Unchecking checkbox');
    this.set_unchecked();
    if (!this.should_ignoreCallbacks()) {
      this.settings.onUnchecked.call(this.input);
      this.trigger_change();
    }
    this.preventDefaultOnInputTarget();
  }

  indeterminate() {
    if (this.should_allowIndeterminate()) {
      this.debug('Checkbox is already indeterminate');
      return;
    }
    this.debug('Making checkbox indeterminate');
    this.set_indeterminate();
    if (!this.should_ignoreCallbacks()) {
      this.settings.onIndeterminate.call(this.input);
      this.trigger_change();
    }
  }

  determinate() {
    if (this.should_allowDeterminate()) {
      this.debug('Checkbox is already determinate');
      return;
    }
    this.debug('Making checkbox determinate');
    this.set_determinate();
    if (!this.should_ignoreCallbacks()) {
      this.settings.onDeterminate.call(this.input);
      this.trigger_change();
    }
  }

  enable() {
    if (this.is_enabled()) {
      this.debug('Checkbox is already enabled');
      return;
    }
    this.debug('Enabling checkbox');
    this.set_enabled();
    if (!this.should_ignoreCallbacks()) {
      this.settings.onEnable.call(this.input);
      // preserve legacy callbacks
      this.settings.onEnabled.call(this.input);
      this.trigger_change();
    }
  }

  disable() {
    if (this.is_disabled()) {
      this.debug('Checkbox is already disabled');
      return;
    }
    this.debug('Disabling checkbox');
    this.set_disabled();
    if (!this.should_ignoreCallbacks()) {
      this.settings.onDisable.call(this.input);
      // preserve legacy callbacks
      this.settings.onDisabled.call(this.input);
      this.trigger_change();
    }
  }

  uncheckOthers(): void {
    let $radios = this.get_otherRadios();
    this.debug('Unchecking other radios', $radios);
    $radios.removeClass(this.settings.className.checked);
  }

  toggle(): void {
    if (!this.can_change()) {
      if (!this.is_radio()) {
        this.debug('Checkbox is read-only or disabled, ignoring toggle');
      }
      return;
    }
    if (this.is_indeterminate() || this.is_unchecked()) {
      this.debug('Currently unchecked');
      this.check();
    }
    else if (this.is_checked() && this.can_uncheck()) {
      this.debug('Currently checked');
      this.uncheck();
    }
  }

  trigger_change(): void {
    let inputElement = this.$input[0];
    if (inputElement) {
      let events = document.createEvent('HTMLEvents');
      this.verbose('Triggering native change event');
      events.initEvent('change', true, false);
      inputElement.dispatchEvent(events);
    }
  }

  preventDefaultOnInputTarget(event = null): void {
    if (typeof event !== 'undefined' && event !== null && $(event.target).is(this.settings.selector.input)) {
      this.verbose('Preventing default check action after manual check action');
      event.preventDefault();
    }
  }

  has_label(): boolean {
    return (this.$label.length > 0);
  }

  can_change(): boolean {
    return !( this.$element.hasClass(this.settings.className.disabled) || this.$element.hasClass(this.settings.className.readOnly) || this.$input.prop('disabled') || this.$input.prop('readonly') );
  }

  can_uncheck() {
    return (typeof this.settings.uncheckable === 'boolean')
      ? this.settings.uncheckable
      : !this.is_radio()
    ;
  }

  is_initialLoad(): boolean {
    return this.initialLoad;
  }

  is_radio(): boolean {
    return (this.$input.hasClass(this.settings.className.radio) || this.$input.attr('type') == 'radio');
  }

  is_indeterminate(): boolean {
    return this.$input.prop('indeterminate') !== undefined && this.$input.prop('indeterminate');
  }

  is_checked(): boolean {
    return this.$input.prop('checked') !== undefined && this.$input.prop('checked');
  }

  is_disabled(): boolean {
    return this.$input.prop('disabled') !== undefined && this.$input.prop('disabled');
  }

  is_enabled(): boolean {
    return !this.is_disabled();
  }

  is_determinate(): boolean {
    return !this.is_indeterminate();
  }

  is_unchecked(): boolean {
    return !this.is_checked();
  }

  should_allowCheck() {
    if (this.is_determinate() && this.is_checked() && !this.is_initialLoad() ) {
      this.debug('Should not allow check, checkbox is already checked');
      return false;
    }
    if (!this.should_ignoreCallbacks() && this.settings.beforeChecked.apply(this.input) === false) {
      this.debug('Should not allow check, beforeChecked cancelled');
      return false;
    }
    return true;
  }

  should_allowUncheck() {
    if (this.is_determinate() && this.is_unchecked() && !this.is_initialLoad() ) {
      this.debug('Should not allow uncheck, checkbox is already unchecked');
      return false;
    }
    if (!this.should_ignoreCallbacks() && this.settings.beforeUnchecked.apply(this.input) === false) {
      this.debug('Should not allow uncheck, beforeUnchecked cancelled');
      return false;
    }
    return true;
  }

  should_allowIndeterminate() {
    if (this.is_indeterminate() && !this.is_initialLoad() ) {
      this.debug('Should not allow indeterminate, checkbox is already indeterminate');
      return false;
    }
    if (!this.should_ignoreCallbacks() && this.settings.beforeIndeterminate.apply(this.input) === false) {
      this.debug('Should not allow indeterminate, beforeIndeterminate cancelled');
      return false;
    }
    return true;
  }

  should_allowDeterminate() {
    if (this.is_determinate() && !this.is_initialLoad() ) {
      this.debug('Should not allow determinate, checkbox is already determinate');
      return false;
    }
    if (!this.should_ignoreCallbacks() && this.settings.beforeDeterminate.apply(this.input) === false) {
      this.debug('Should not allow determinate, beforeDeterminate cancelled');
      return false;
    }
    return true;
  }

  should_ignoreCallbacks() {
    return (this.initialLoad && !this.settings.fireOnInit);
  }

  get_radios(): Cash {
    let name = this.get_name();
    return $('input[name="' + name + '"]').closest(this.settings.selector.checkbox);
  }

  get_otherRadios(): Cash {
    return this.get_radios().not(this.$element);
  }

  get_name(): string {
    return this.$input.attr('name');
  }

  set_initialLoad() {
    this.initialLoad = true;
  }

  set_checked() {
    this.verbose('Setting class to checked');
    this.$element
      .removeClass(this.settings.className.indeterminate)
      .addClass(this.settings.className.checked)
    ;
    if (this.is_radio()) {
      this.uncheckOthers();
    }
    if (!this.is_indeterminate() && this.is_checked()) {
      this.debug('Input is already checked, skipping input property change');
      return;
    }
    this.verbose('Setting state to checked', this.input);
    this.$input
      .prop('indeterminate', false)
      .prop('checked', true)
    ;
  }

  set_unchecked() {
    this.verbose('Removing checked class');
    this.$element
      .removeClass(this.settings.className.indeterminate)
      .removeClass(this.settings.className.checked)
    ;
    if (!this.is_indeterminate() &&  this.is_unchecked()) {
      this.debug('Input is already unchecked');
      return;
    }
    this.debug('Setting state to unchecked');
    this.$input
      .prop('indeterminate', false)
      .prop('checked', false)
    ;
  }
  
  set_indeterminate() {
    this.verbose('Setting class to indeterminate');
    this.$element
      .addClass(this.settings.className.indeterminate)
    ;
    if (this.is_indeterminate()) {
      this.debug('Input is already indeterminate, skipping input property change');
      return;
    }
    this.debug('Setting state to indeterminate');
    this.$input
      .prop('indeterminate', true)
    ;
  }

  set_determinate() {
    this.verbose('Removing indeterminate class');
    this.$element
      .removeClass(this.settings.className.indeterminate)
    ;
    if (this.is_determinate()) {
      this.debug('Input is already determinate, skipping input property change');
      return;
    }
    this.debug('Setting state to determinate');
    this.$input
      .prop('indeterminate', false)
    ;
  }

  set_disabled() {
    this.verbose('Setting class to disabled');
    this.$element
      .addClass(this.settings.className.disabled)
    ;
    if (this.is_disabled()) {
      this.debug('Input is already disabled, skipping input property change');
      return;
    }
    this.debug('Setting state to disabled');
    this.$input
      .prop('disabled', 'disabled')
    ;
  }

  set_enabled() {
    this.verbose('Removing disabled class');
    this.$element.removeClass(this.settings.className.disabled);
    if (this.is_enabled()) {
      this.debug('Input is already enabled, skipping input property change');
      return;
    }
    this.debug('Setting state to enabled');
    this.$input
      .prop('disabled', false)
    ;
  }

  set_tabbable() {
    this.verbose('Adding tabindex to checkbox');
    if (this.$input.attr('tabindex') === undefined) {
      this.$input.attr('tabindex', '0');
    }
  }

  remove_initialLoad(): void {
    this.initialLoad = false;
  }

  attachEvents(selector, event): any {
    let $element = $(selector);
    event = $.isFunction(this[event])
      ? this[event]
      : this.toggle
    ;
    if ($element.length > 0) {
      this.debug('Attaching checkbox events to element', selector, event);
      $element
        .on('click' + this.eventNamespace, event)
      ;
    }
    else {
      this.error(this.settings.error.notFound);
    }
  }

  fix_reference() {
    if (this.$element.is(this.settings.selector.input)) {
      this.debug('Behavior called on <input> adjusting invoked element');
      this.$element = this.$element.closest(this.settings.selector.checkbox);
      this.refresh();
    }
  }
}
