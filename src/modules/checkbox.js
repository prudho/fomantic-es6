"use strict";

import Module from '../module'


import $ from 'cash-dom';

const settings = {
    name                : 'Checkbox',
    namespace           : 'checkbox',

    silent              : false,
    debug               : false,
    verbose             : true,
    performance         : true,

    // delegated event context
    uncheckable         : 'auto',
    fireOnInit          : false,

    className: {
        checked       : 'checked',
        indeterminate : 'indeterminate',
        disabled      : 'disabled',
        hidden        : 'hidden',
        radio         : 'radio',
        readOnly      : 'read-only'
    },

    error: {
        method       : 'The method you called is not defined'
    },

    selector: {
        checkbox : '.ui.checkbox',
        label    : 'label, .box',
        input    : 'input[type="checkbox"], input[type="radio"]',
        link     : 'a[href]'
    },

    events: ['Change', 'beforeChecked', 'beforeUnchecked', 'beforeDeterminate', 'beforeIndeterminate', 'Checked', 'Unchecked', 'Determinate', 'Indeterminate', 'Enable', 'Disable']
}

export class Checkbox extends Module {
    constructor(selector, parameters) {
        super(selector, parameters, settings);

        this.$label          = this.$element.children(this.settings.selector.label);
        this.$input          = this.$element.children(this.settings.selector.input);
        this.input           = this.$input[0];

        this.initialLoad     = false;
        this.shortcutPressed = false;
        
        this.initialize()
    }

    initialize() {
        this.verbose('Initializing rating module', this.settings);

        this.create_label();
        this.bind_events();

        this.set_tabbable();
        this.hide_input();

        this.observeChanges();
        this.instantiate();
        this.setup();
    }

    instantiate() {
        this.verbose('Instantiating module', this);
        this.$element.data(this.moduleNamespace, this);
    }

    destroy() {
        this.verbose('Destroying previous instance', this.instance);
        this.unbind_events();
        this.show_input();
        this.$element.removeData(this.moduleNamespace);
    }

    create_label() {
        if (this.$input.prevAll(this.settings.selector.label).length > 0) {
            this.$input.prev(this.settings.selector.label).detach().insertAfter(this.$input);
            this.debug('Moving existing label', this.$label);
        } else if (!this.has_label()) {
            this.$label = $('<label>').insertAfter(this.$input);
            this.debug('Creating label', this.$label);
        }
    }

    setup() {
        this.initialLoad = true;
        if (this.is_indeterminate()) {
            this.debug('Initial value is indeterminate');
            this.indeterminate();
        } else if (this.is_checked()) {
            this.debug('Initial value is checked');
            this.check();
        } else {
            this.debug('Initial value is unchecked');
            this.uncheck();
        }
        this.initialLoad = false;
    }

    show_input() {
        this.verbose('Modifying <input> z-index to be selectable');
        this.$input.removeClass(this.settings.className.hidden);    
    }

    bind_events() {
        this.verbose('Attaching checkbox events');
        this.$element.on('click'   + this.eventNamespace, this.event_click.bind(this));

        this.$element.find(this.settings.selector.input)
            .on('keydown' + this.eventNamespace, this.event_keydown.bind(this))
            .on('keyup'   + this.eventNamespace, this.event_keyup.bind(this))
        ;
    }

    unbind_events() {
        this.debug('Removing events');
        this.$element.off(this.eventNamespace);
    }

    event_click(event) {
        var $target = $(event.target);
        if ($target.is(this.settings.selector.input)) {
            this.verbose('Using default check action on initialized checkbox');
            return;
        }
        if ($target.is(this.settings.selector.link)) {
            this.debug('Clicking link inside checkbox, skipping toggle');
            return;
        }
        this.toggle();
        //this.$input.focus(); TODO
        event.preventDefault();
    }

    event_keydown(event) {
        var
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

        var
            r = this.get_radios(),
            rIndex = r.index(this.$element),
            rLen = r.length,
            checkIndex = false
        ;

        if (key == keyCode.left || key == keyCode.up) {
            checkIndex = (rIndex === 0 ? rLen : rIndex) - 1;
        } else if (key == keyCode.right || key == keyCode.down) {
            checkIndex = rIndex === rLen-1 ? 0 : rIndex+1;
        }

        if (!this.should_ignoreCallbacks() && checkIndex !== false) {
            if (this.invokeCallback('beforeUnchecked').apply(this.input) === false) {
                this.verbose('Option not allowed to be unchecked, cancelling key navigation');
                return false;
            }
            if (!this.invokeCallback('beforeChecked').apply($(r[checkIndex]).children(this.settings.selector.input)[0]) === false) {
                this.verbose('Next option should not allow check, cancelling key navigation');
                return false;
            }
        }

        if (key == keyCode.escape) {
            this.verbose('Escape key pressed blurring field');
            // $input.blur(); TODO
            this.shortcutPressed = true;
        } else if (!event.ctrlKey && (key == keyCode.space || key == keyCode.enter)) {
            this.verbose('Enter/space key pressed, toggling checkbox');
            this.toggle();
            this.shortcutPressed = true;
        } else {
            this.shortcutPressed = false;
        }
    }

    event_keyup(event) {
        if (this.shortcutPressed) {
            event.preventDefault();
        }
    }

    check() {
        if (!this.should_allowCheck()) {
            return;
        }
        this.debug('Checking checkbox', this.$input);
        this.set_checked();
        if (!this.should_ignoreCallbacks()) {
            this.invokeCallback('Checked').call(this.input);
            this.invokeCallback('Change').call(this.input);
        }
    }

    uncheck() {
        if (!this.should_allowUncheck()) {
            return;
        }
        this.debug('Unchecking checkbox', this.$input);
        this.set_unchecked();
        if (!this.should_ignoreCallbacks()) {
            this.invokeCallback('Unchecked').call(this.input);
            this.invokeCallback('Change').call(this.input);
        }
    }

    toggle() {
        if (!this.can_change()) {
            if (!this.is_radio()) {
                this.debug('Checkbox is read-only or disabled, ignoring toggle');
            }
            return;
        }
        if (this.is_indeterminate() || this.is_unchecked()) {
            this.debug('Currently unchecked');
            this.check();
        } else if (this.is_checked() && this.can_uncheck()) {
            this.debug('Currently checked');
            this.uncheck();
        }
    }

    trigger_change() {
        var
            events       = document.createEvent('HTMLEvents'),
            inputElement = this.$input[0]
        ;
        if (inputElement) {
            this.verbose('Triggering native change event');
            events.initEvent('change', true, false);
            inputElement.dispatchEvent(events);
        }
    }

    disable() {
        if (this.is_disabled()) {
            this.debug('Checkbox is already disabled');
            return;
        }
        this.debug('Disabling checkbox');
        this.set_disabled();
        this.invokeCallback('Disable').call(this.input);
    }

    enable() {
        if (this.is_enabled()) {
            this.debug('Checkbox is already enabled');
            return;
        }
        this.debug('Enabling checkbox');
        this.set_enabled();
        this.invokeCallback('Enable').call(this.input);
    }

    determinate() {
        if (!this.should_allowDeterminate() ) {
            this.debug('Checkbox is already determinate');
            return;
        }
        this.debug('Making checkbox determinate');
        this.set_determinate();
        if (!this.should_ignoreCallbacks()) {
            this.invokeCallback('Determinate').call(this.input);
            this.invokeCallback('Change').call(this.input);
        }
    }

    indeterminate() {
        if (!this.should_allowIndeterminate()) {
            this.debug('Checkbox is already indeterminate');
            return;
        }
        this.debug('Making checkbox indeterminate');
        this.set_indeterminate();
        if (!this.should_ignoreCallbacks()) {
            this.invokeCallback('Indeterminate').call(this.input);
            this.invokeCallback('Change').call(this.input);
        }
    }

    refresh() {
        this.$label = this.$element.children(this.settings.selector.label);
        this.$input = this.$element.children(this.settings.selector.input);
        this.input  = this.$input[0];
    }

    has_label() {
        return (this.$label.length > 0);
    }

    is_checked() {
        return this.$input.prop('checked') !== undefined && this.$input.prop('checked');
    }

    is_determinate() {
        return !this.is_indeterminate();
    }

    is_disabled() {
        return this.$input.prop('disabled') !== undefined && this.$input.prop('disabled');
    }

    is_enabled() {
        return !this.is_disabled();
    }

    is_indeterminate() {
        return this.$input.prop('indeterminate') !== undefined && this.$input.prop('indeterminate');
    }

    is_radio() {
        return (this.$input.hasClass(this.settings.className.radio) || this.$input.attr('type') == 'radio');
    }

    is_unchecked() {
        return !this.is_checked();
    }

    can_change() {
        return !(this.$element.hasClass(this.settings.className.disabled) || this.$element.hasClass(this.settings.className.readOnly) || this.$input.prop('disabled') || this.$input.prop('readonly'));
    }

    can_uncheck() {
        return (typeof this.settings.uncheckable === 'boolean') ? this.settings.uncheckable : !this.is_radio();
    }

    should_allowCheck() {
        if (this.is_determinate() && this.is_checked() && !this.initialLoad ) {
            this.debug('Should not allow check, checkbox is already checked');
            return false;
        }
        if(!this.should_ignoreCallbacks() && this.invokeCallback('beforeChecked').apply(this.input) === false) {
            this.debug('Should not allow check, beforeChecked cancelled');
            return false;
        }
        return true;
    }

    should_allowDeterminate() {
        if (this.is_determinate() && !this.initialLoad) {
            this.debug('Should not allow determinate, checkbox is already determinate');
            return false;
        }
        if (!this.should_ignoreCallbacks() && this.invokeCallback('beforeDeterminate').apply(this.input) === false) {
            this.debug('Should not allow determinate, beforeDeterminate cancelled');
            return false;
        }
        return true;
    }

    should_allowIndeterminate() {
        if (this.is_indeterminate() && !this.initialLoad ) {
            this.debug('Should not allow indeterminate, checkbox is already indeterminate');
            return false;
        }
        if (!this.should_ignoreCallbacks() && this.invokeCallback('beforeIndeterminate').apply(this.input) === false) {
            this.debug('Should not allow indeterminate, beforeIndeterminate cancelled');
            return false;
        }
        return true;
    }

    should_allowUncheck() {
        if (this.is_determinate() && this.is_unchecked() && !this.initialLoad ) {
            this.debug('Should not allow uncheck, checkbox is already unchecked');
            return false;
        }
        if (!this.should_ignoreCallbacks() && this.invokeCallback('beforeUnchecked').apply(this.input) === false) {
            this.debug('Should not allow uncheck, beforeUnchecked cancelled');
            return false;
        }
        return true;
    }

    should_ignoreCallbacks() {
        return (this.initialLoad && !this.settings.fireOnInit);
    }

    get_name() {
        return this.$input.attr('name');
    }

    get_otherRadios() {
        return this.get_radios().not(this.$element);
    }

    get_radios() {
        var name = this.get_name();
        return $('input[name="' + name + '"]').closest(this.settings.selector.checkbox);
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
        if(!this.is_indeterminate() && this.is_checked()) {
            this.debug('Input is already checked, skipping input property change');
            return;
        }
        this.verbose('Setting state to checked', this.input);
        this.$input
            .prop('indeterminate', false)
            .prop('checked', true)
        ;
        this.trigger_change();
    }

    set_determinate() {
        this.verbose('Removing indeterminate class');
        this.$element.removeClass(this.settings.className.indeterminate);
        if (this.is_determinate()) {
            this.debug('Input is already determinate, skipping input property change');
            return;
        }
        this.debug('Setting state to determinate');
        this.$input.prop('indeterminate', false);
    }

    set_disabled() {
        this.verbose('Setting class to disabled');
        this.$element.addClass(this.settings.className.disabled);
        if (this.is_disabled()) {
            this.debug('Input is already disabled, skipping input property change');
            return;
        }
        this.debug('Setting state to disabled');
        this.$input.prop('disabled', 'disabled');
        this.trigger_change();
    }

    set_enabled() {
        this.verbose('Removing disabled class');
        this.$element.removeClass(this.settings.className.disabled);
        if (this.is_enabled()) {
            this.debug('Input is already enabled, skipping input property change');
            return;
        }
        this.debug('Setting state to enabled');
        this.$input.prop('disabled', false);
        this.trigger_change();
    }

    set_indeterminate() {
        this.verbose('Setting class to indeterminate');
        this.$element.addClass(this.settings.className.indeterminate);
        if (this.is_indeterminate()) {
            this.debug('Input is already indeterminate, skipping input property change');
            return;
        }
        this.debug('Setting state to indeterminate');
        this.$input.prop('indeterminate', true);
        this.trigger_change();
    }

    set_tabbable() {
        this.verbose('Adding tabindex to checkbox');
        if (this.$input.attr('tabindex') === undefined) {
            this.$input.attr('tabindex', 0);
        }
    }

    set_unchecked() {
        this.verbose('Removing checked class');
        this.$element
            .removeClass(this.settings.className.indeterminate)
            .removeClass(this.settings.className.checked)
        ;
        if (!this.is_indeterminate() && this.is_unchecked() ) {
            this.debug('Input is already unchecked');
            return;
        }
        this.debug('Setting state to unchecked');
        this.$input
            .prop('indeterminate', false)
            .prop('checked', false)
        ;
        this.trigger_change();
    }

    hide_input() {
        this.verbose('Modifying <input> z-index to be unselectable');
        this.$input.addClass(this.settings.className.hidden);
    }

    observeChanges() {
        if ('MutationObserver' in window) {
            this.observer = new MutationObserver(function(mutations) {
                this.debug('DOM tree modified, updating selector cache');
                this.refresh();
            });
            this.observer.observe(document.querySelector(this.element), {
                childList : true,
                subtree   : true
            });
            this.debug('Setting up mutation observer', this.observer);
          }
    }

    uncheckOthers() {
        var $radios = this.get_otherRadios();
        this.debug('Unchecking other radios', $radios);
        $radios.removeClass(this.settings.className.checked);
    }

    attachEvents(selector, event) {
        var $element = $(selector);
        event = $.isFunction(this[event]) ? this[event].bind(this) : this.toggle.bind(this);
        if ($element.length > 0) {
            this.debug('Attaching checkbox events to element', selector, event);
            $element.on('click' + this.eventNamespace, event);
        } else {
            this.error(this.settings.error.notFound);
        }
    }

    /* INVESTIGATE IF USELESS */
    event_change(event) {
        if (!this.should_ignoreCallbacks()) {
            this.invokeCallback('Change').apply(this.input)
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
