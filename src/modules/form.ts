"use strict";

import { Module, ModuleOptions } from '../module'

import Utils from '../utils';

import { Calendar } from './calendar';
import { Checkbox } from './checkbox';
import { Dropdown } from './dropdown';
import { Transition } from './transition';

import $, { Cash } from 'cash-dom';

export interface FormOptions extends ModuleOptions {
  fields            : {};
  defaults          : {};

  keyboardShortcuts : boolean;
  on                : string;
  inline            : boolean;

  delay             : number;
  revalidate        : boolean;
  shouldTrim        : boolean;

  transition        : string;
  duration          : number;

  autoCheckRequired : boolean;
  preventLeaving    : boolean;
  errorFocus        : boolean;
  dateHandling      : 'date' | 'input' | 'formatter';

  metadata : {
    defaultValue : string;
    validate     : string;
    isDirty      : string;
  }

  regExp: {
    htmlID  : RegExp;
    bracket : RegExp;
    decimal : RegExp;
    email   : RegExp;
    escape  : RegExp;
    flags   : RegExp;
    integer : RegExp;
    number  : RegExp;
    url     : RegExp;
  }

  text: {
    and              : string;
    unspecifiedRule  : string;
    unspecifiedField : string;
    leavingMessage   : string;
  }

  prompt: {
    range                : string;
    maxValue             : string;
    minValue             : string;
    empty                : string;
    checked              : string;
    email                : string;
    url                  : string;
    regExp               : string;
    integer              : string;
    decimal              : string;
    number               : string;
    is                   : string;
    isExactly            : string;
    not                  : string;
    notExactly           : string;
    contain              : string;
    containExactly       : string;
    doesntContain        : string;
    doesntContainExactly : string;
    minLength            : string;
    length               : string;
    exactLength          : string;
    maxLength            : string;
    match                : string;
    different            : string;
    creditCard           : string;
    minCount             : string;
    exactCount           : string;
    maxCount             : string;
  }

  selector : {
    checkbox   : string;
    clear      : string;
    field      : string;
    group      : string;
    input      : string;
    message    : string;
    prompt     : string;
    radio      : string;
    reset      : string;
    submit     : string;
    uiCheckbox : string;
    uiDropdown : string;
    uiCalendar : string;
  }

  className : {
    error    : string;
    label    : string;
    pressed  : string;
    success  : string;
    required : string;
    disabled : string;
  }

  error: {
    identifier : string;
    method     : string;
    noRule     : string;
    oldSyntax  : string;
    noElement  : string;
  }

  templates: {

    // template that produces error message
    error: Function;

    // template that produces label
    prompt: Function;
  }

  formatter: {
    date: Function;
    datetime: Function;
    time: Function;
    month: Function;
    year: Function;
  }

  rules: {

    // is not empty or blank string
    empty: Function;

    // checkbox checked
    checked: Function;

    // is most likely an email
    email: Function;

    // value is most likely url
    url: Function;

    // matches specified regExp
    regExp: Function;
    minValue: Function;
    maxValue: Function;
    // is valid integer or matches range
    integer: Function;
    range: Function;

    // is valid number (with decimal)
    decimal: Function;

    // is valid number
    number: Function;

    // is value (case insensitive)
    is: Function;

    // is value
    isExactly: Function;

    // value is not another value (case insensitive)
    not: Function;

    // value is not another value (case sensitive)
    notExactly: Function;

    // value contains text (insensitive)
    contains: Function;

    // value contains text (case sensitive)
    containsExactly: Function;

    // value contains text (insensitive)
    doesntContain: Function;

    // value contains text (case sensitive)
    doesntContainExactly: Function;

    // is at least string length
    minLength: Function;

    // see rls notes for 2.0.6 (this is a duplicate of minLength)
    length: Function;

    // is exactly length
    exactLength: Function;

    // is less than length
    maxLength: Function;

    // matches another field
    match: Function;

    // different than another field
    different: Function;

    creditCard: Function;

    minCount: Function;

    exactCount: Function;

    maxCount: Function;
  }

  events: Array<string>;
}

const settings: FormOptions = {
  name              : 'Form',
  namespace         : 'form',

  silent            : false,
  debug             : false,
  verbose           : false,
  performance       : true,

  defaults          : null,
  fields            : null,

  keyboardShortcuts : true,
  on                : 'submit',
  inline            : false,

  delay             : 200,
  revalidate        : true,
  shouldTrim        : true,

  transition        : 'scale',
  duration          : 200,

  autoCheckRequired : false,
  preventLeaving    : false,
  errorFocus        : false,
  dateHandling      : 'date', // 'date', 'input', 'formatter'

  metadata : {
    defaultValue : 'default',
    validate     : 'validate',
    isDirty      : 'isDirty'
  },

  regExp: {
    htmlID  : /^[a-zA-Z][\w:.-]*$/g,
    bracket : /\[(.*)\]/i,
    decimal : /^\d+\.?\d*$/,
    email   : /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i,
    escape  : /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|:,=@]/g,
    flags   : /^\/(.*)\/(.*)?/,
    integer : /^\-?\d+$/,
    number  : /^\-?\d*(\.\d+)?$/,
    url     : /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/i
  },

  text: {
    and              : 'and',
    unspecifiedRule  : 'Please enter a valid value',
    unspecifiedField : 'This field',
    leavingMessage   : 'There are unsaved changes on this page which will be discarded if you continue.'
  },

  prompt: {
    range                : '{name} must be in a range from {min} to {max}',
    maxValue             : '{name} must have a maximum value of {ruleValue}',
    minValue             : '{name} must have a minimum value of {ruleValue}',
    empty                : '{name} must have a value',
    checked              : '{name} must be checked',
    email                : '{name} must be a valid e-mail',
    url                  : '{name} must be a valid url',
    regExp               : '{name} is not formatted correctly',
    integer              : '{name} must be an integer',
    decimal              : '{name} must be a decimal number',
    number               : '{name} must be set to a number',
    is                   : '{name} must be "{ruleValue}"',
    isExactly            : '{name} must be exactly "{ruleValue}"',
    not                  : '{name} cannot be set to "{ruleValue}"',
    notExactly           : '{name} cannot be set to exactly "{ruleValue}"',
    contain              : '{name} must contain "{ruleValue}"',
    containExactly       : '{name} must contain exactly "{ruleValue}"',
    doesntContain        : '{name} cannot contain  "{ruleValue}"',
    doesntContainExactly : '{name} cannot contain exactly "{ruleValue}"',
    minLength            : '{name} must be at least {ruleValue} characters',
    length               : '{name} must be at least {ruleValue} characters',
    exactLength          : '{name} must be exactly {ruleValue} characters',
    maxLength            : '{name} cannot be longer than {ruleValue} characters',
    match                : '{name} must match {ruleValue} field',
    different            : '{name} must have a different value than {ruleValue} field',
    creditCard           : '{name} must be a valid credit card number',
    minCount             : '{name} must have at least {ruleValue} choices',
    exactCount           : '{name} must have exactly {ruleValue} choices',
    maxCount             : '{name} must have {ruleValue} or less choices'
  },

  selector : {
    checkbox   : 'input[type="checkbox"], input[type="radio"]',
    clear      : '.clear',
    field      : 'input:not(.search):not([type="file"]), textarea, select',
    group      : '.field',
    input      : 'input:not([type="file"])',
    message    : '.error.message',
    prompt     : '.prompt.label',
    radio      : 'input[type="radio"]',
    reset      : '.reset:not([type="reset"])',
    submit     : '.submit:not([type="submit"])',
    uiCheckbox : '.ui.checkbox',
    uiDropdown : '.ui.dropdown',
    uiCalendar : '.ui.calendar'
  },

  className : {
    error    : 'error',
    label    : 'ui basic red pointing prompt label',
    pressed  : 'down',
    success  : 'success',
    required : 'required',
    disabled : 'disabled'
  },

  error: {
    identifier : 'You must specify a string identifier for each field',
    method     : 'The method you called is not defined.',
    noRule     : 'There is no rule matching the one you specified',
    oldSyntax  : 'Starting in 2.0 forms now only take a single settings object. Validation settings converted to new syntax automatically.',
    noElement  : 'This module requires ui {element}'
  },

  templates: {

    // template that produces error message
    error: function(errors): string {
      let html = '<ul class="list">';
      $.each(errors, function(_index, value) {
        html += `<li>${value}</li>`;
      });
      html += '</ul>';
      return html;
    },

    // template that produces label
    prompt: function(errors, labelClasses) {
      return $('<div/>')
        .addClass(labelClasses)
        .html(errors[0])
      ;
    }
  },

  formatter: {
    date: function(date) {
      return Intl.DateTimeFormat('en-GB').format(date);
    },
    datetime: function(date) {
      return Intl.DateTimeFormat('en-GB', {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    },
    time: function(date) {
      return Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    },
    month: function(date) {
      return Intl.DateTimeFormat('en-GB', {
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    },
    year: function(date) {
      return Intl.DateTimeFormat('en-GB', {
        year: 'numeric'
      }).format(date);
    }
  },

  rules: {

    // is not empty or blank string
    empty: function(value) {
      return !(value === undefined || '' === value || Array.isArray(value) && value.length === 0);
    },

    // checkbox checked
    checked: function() {
      return ($(this).filter(':checked').length > 0);
    },

    // is most likely an email
    email: function(value: string) {
      // return $.fn.form.settings.regExp.email.test(value);
      return settings.regExp.email.test(value);
    },

    // value is most likely url
    url: function(value: string) {
      // return $.fn.form.settings.regExp.url.test(value);
      return settings.regExp.url.test(value);
    },

    // matches specified regExp
    regExp: function(value: string, regExp) {
      if (regExp instanceof RegExp) {
        return value.match(regExp);
      }
      let
        // regExpParts = regExp.match($.fn.form.settings.regExp.flags),
        regExpParts = regExp.match(settings.regExp.flags),
        flags
      ;
      // regular expression specified as /baz/gi (flags)
      if (regExpParts) {
        regExp = (regExpParts.length >= 2)
          ? regExpParts[1]
          : regExp
        ;
        flags = (regExpParts.length >= 3)
          ? regExpParts[2]
          : ''
        ;
      }
      return value.match( new RegExp(regExp, flags) );
    },
    minValue: function(value, range) {
      // return $.fn.form.settings.rules.range(value, range+'..', 'number');
      return settings.rules.range(value, range+'..', 'number');
    },
    maxValue: function(value, range) {
      // return $.fn.form.settings.rules.range(value, '..'+range, 'number');
      return settings.rules.range(value, '..'+range, 'number');
    },
    // is valid integer or matches range
    integer: function(value, range) {
      // return $.fn.form.settings.rules.range(value, range, 'integer');
      return settings.rules.range(value, range, 'integer');
    },
    range: function(value, range, regExp) {
      if (typeof regExp == "string") {
        // regExp = $.fn.form.settings.regExp[regExp];
        regExp = settings.regExp[regExp];
      }
      if (!(regExp instanceof RegExp)) {
        // regExp = $.fn.form.settings.regExp.integer;
        regExp = settings.regExp.integer;
      }
      let
        min,
        max,
        parts
      ;
      if (!range || ['', '..'].indexOf(range) !== -1) {
        // do nothing
      }
      else if (range.indexOf('..') == -1) {
        if (regExp.test(range)) {
          min = max = range - 0;
        }
      }
      else {
        parts = range.split('..', 2);
        if (regExp.test(parts[0])) {
          min = parts[0] - 0;
        }
        if (regExp.test(parts[1])) {
          max = parts[1] - 0;
        }
      }
      return (
        regExp.test(value) &&
        (min === undefined || value >= min) &&
        (max === undefined || value <= max)
      );
    },

    // is valid number (with decimal)
    decimal: function(value, range) {
      // return $.fn.form.settings.rules.range(value, range, 'decimal');
      return settings.rules.range(value, range, 'decimal');
    },

    // is valid number
    number: function(value, range) {
      // return $.fn.form.settings.rules.range(value, range, 'number');
      return settings.rules.range(value, range, 'number');
    },

    // is value (case insensitive)
    is: function(value, text) {
      text = (typeof text == 'string')
        ? text.toLowerCase()
        : text
      ;
      value = (typeof value == 'string')
        ? value.toLowerCase()
        : value
      ;
      return (value == text);
    },

    // is value
    isExactly: function(value, text) {
      return (value == text);
    },

    // value is not another value (case insensitive)
    not: function(value, notValue) {
      value = (typeof value == 'string')
        ? value.toLowerCase()
        : value
      ;
      notValue = (typeof notValue == 'string')
        ? notValue.toLowerCase()
        : notValue
      ;
      return (value != notValue);
    },

    // value is not another value (case sensitive)
    notExactly: function(value, notValue) {
      return (value != notValue);
    },

    // value contains text (insensitive)
    contains: function(value, text) {
      // escape regex characters
      // text = text.replace($.fn.form.settings.regExp.escape, "\\$&");
      text = text.replace(settings.regExp.escape, "\\$&");
      return (value.search( new RegExp(text, 'i') ) !== -1);
    },

    // value contains text (case sensitive)
    containsExactly: function(value, text) {
      // escape regex characters
      // text = text.replace($.fn.form.settings.regExp.escape, "\\$&");
      text = text.replace(settings.regExp.escape, "\\$&");
      return (value.search( new RegExp(text) ) !== -1);
    },

    // value contains text (insensitive)
    doesntContain: function(value, text) {
      // escape regex characters
      // text = text.replace($.fn.form.settings.regExp.escape, "\\$&");
      text = text.replace(settings.regExp.escape, "\\$&");
      return (value.search( new RegExp(text, 'i') ) === -1);
    },

    // value contains text (case sensitive)
    doesntContainExactly: function(value, text) {
      // escape regex characters
      // text = text.replace($.fn.form.settings.regExp.escape, "\\$&");
      text = text.replace(settings.regExp.escape, "\\$&");
      return (value.search( new RegExp(text) ) === -1);
    },

    // is at least string length
    minLength: function(value, requiredLength) {
      return (value !== undefined)
        ? (value.length >= requiredLength)
        : false
      ;
    },

    // see rls notes for 2.0.6 (this is a duplicate of minLength)
    length: function(value, requiredLength) {
      return (value !== undefined)
        ? (value.length >= requiredLength)
        : false
      ;
    },

    // is exactly length
    exactLength: function(value, requiredLength) {
      return (value !== undefined)
        ? (value.length == requiredLength)
        : false
      ;
    },

    // is less than length
    maxLength: function(value, maxLength) {
      return (value !== undefined)
        ? (value.length <= maxLength)
        : false
      ;
    },

    // matches another field
    match: function(value, identifier, $module) {
      let
        matchingValue,
        matchingElement
      ;
      if ((matchingElement = this.$element.find('[data-validate="'+ identifier +'"]')).length > 0 ) {
        matchingValue = matchingElement.val();
      }
      else if ((matchingElement = this.$element.find('#' + identifier)).length > 0) {
        matchingValue = matchingElement.val();
      }
      else if ((matchingElement = this.$element.find('[name="' + identifier +'"]')).length > 0) {
        matchingValue = matchingElement.val();
      }
      else if ((matchingElement = this.$element.find('[name="' + identifier +'[]"]')).length > 0 ) {
        matchingValue = matchingElement;
      }
      return (matchingValue !== undefined)
        ? ( value.toString() == matchingValue.toString() )
        : false
      ;
    },

    // different than another field
    different: function(value, identifier, $module) {
      // use either id or name of field
      let
        matchingValue,
        matchingElement
      ;
      if ((matchingElement = this.$element.find('[data-validate="'+ identifier +'"]')).length > 0 ) {
        matchingValue = matchingElement.val();
      }
      else if ((matchingElement = this.$element.find('#' + identifier)).length > 0) {
        matchingValue = matchingElement.val();
      }
      else if ((matchingElement = this.$element.find('[name="' + identifier +'"]')).length > 0) {
        matchingValue = matchingElement.val();
      }
      else if ((matchingElement = this.$element.find('[name="' + identifier +'[]"]')).length > 0 ) {
        matchingValue = matchingElement;
      }
      return (matchingValue !== undefined)
        ? ( value.toString() !== matchingValue.toString() )
        : false
      ;
    },

    creditCard: function(cardNumber, cardTypes) {
      let
        cards = {
          visa: {
            pattern : /^4/,
            length  : [16]
          },
          amex: {
            pattern : /^3[47]/,
            length  : [15]
          },
          mastercard: {
            pattern : /^5[1-5]/,
            length  : [16]
          },
          discover: {
            pattern : /^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)/,
            length  : [16]
          },
          unionPay: {
            pattern : /^(62|88)/,
            length  : [16, 17, 18, 19]
          },
          jcb: {
            pattern : /^35(2[89]|[3-8][0-9])/,
            length  : [16]
          },
          maestro: {
            pattern : /^(5018|5020|5038|6304|6759|676[1-3])/,
            length  : [12, 13, 14, 15, 16, 17, 18, 19]
          },
          dinersClub: {
            pattern : /^(30[0-5]|^36)/,
            length  : [14]
          },
          laser: {
            pattern : /^(6304|670[69]|6771)/,
            length  : [16, 17, 18, 19]
          },
          visaElectron: {
            pattern : /^(4026|417500|4508|4844|491(3|7))/,
            length  : [16]
          }
        },
        valid: any         = {},
        validCard     = false,
        requiredTypes = (typeof cardTypes == 'string')
          ? cardTypes.split(',')
          : false,
        unionPay,
        validation
      ;

      if (typeof cardNumber !== 'string' || cardNumber.length === 0) {
        return;
      }

      // allow dashes and spaces in card
      cardNumber = cardNumber.replace(/[\s\-]/g, '');

      // verify card types
      if (requiredTypes) {
        $.each(requiredTypes, function(index, type) {
          // verify each card type
          validation = cards[type];
          if (validation) {
            valid = {
              // INVESTIGATE
              // length  : ($.inArray(cardNumber.length, validation.length) !== -1),
              length  : (cardNumber.length.indexOf(validation.length) !== -1),
              pattern : (cardNumber.search(validation.pattern) !== -1)
            };
            if (valid.length && valid.pattern) {
              validCard = true;
            }
          }
        });

        if (!validCard) {
          return false;
        }
      }

      // skip luhn for UnionPay
      unionPay = {
        // INVESTIGATE
        // number  : ($.inArray(cardNumber.length, cards.unionPay.length) !== -1),
        number  : (cardNumber.length.indexOf(cards.unionPay.length) !== -1),
        pattern : (cardNumber.search(cards.unionPay.pattern) !== -1)
      };
      if (unionPay.number && unionPay.pattern) {
        return true;
      }

      // verify luhn, adapted from  <https://gist.github.com/2134376>
      let
        length        = cardNumber.length,
        multiple      = 0,
        producedValue = [
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          [0, 2, 4, 6, 8, 1, 3, 5, 7, 9]
        ],
        sum           = 0
      ;
      while (length--) {
        sum += producedValue[multiple][parseInt(cardNumber.charAt(length), 10)];
        multiple ^= 1;
      }
      return (sum % 10 === 0 && sum > 0);
    },

    minCount: function(value, minCount) {
      if (minCount == 0) {
        return true;
      }
      if (minCount == 1) {
        return (value !== '');
      }
      return (value.split(',').length >= minCount);
    },

    exactCount: function(value, exactCount) {
      if (exactCount == 0) {
        return (value === '');
      }
      if (exactCount == 1) {
        return (value !== '' && value.search(',') === -1);
      }
      return (value.split(',').length == exactCount);
    },

    maxCount: function(value, maxCount) {
      if (maxCount == 0) {
        return false;
      }
      if (maxCount == 1) {
        return (value.search(',') === -1);
      }
      return (value.split(',').length <= maxCount);
    }
  },

  events: ['valid', 'invalid', 'clean', 'dirty', 'success', 'failure']
}

export class Form extends Module {
  settings: FormOptions;

  $field: Cash;
  $group: Cash;
  $message: Cash;
  $prompt: Cash;

  $submit: Cash;
  $clear: Cash;
  $reset: Cash;

  keyHeldDown: boolean = false;
  submitting: boolean = false;
  dirty: boolean = false;

  validation;
  history: Array<string> = ['clean', 'clean'];
  formErrors: Array<string> = [];
  timer: NodeJS.Timer;

  instance: Form;

  constructor(selector: string, parameters) {
    super(selector, parameters, settings);
    
    this.initialize();
  }

  initialize(): void {
    this.verbose('Initializing form validation', this.$element, this.settings);

    if ($.isPlainObject(this.settings)) {
      if (this.settings.fields && this.is_shorthandFields(this.settings.fields)) {
        this.settings.fields = this.get_fieldsFromShorthand(this.settings.fields);
      }


      this.validation = $.extend({}, this.settings.defaults, this.settings.fields);
      this.verbose('Extending settings', this.validation, this.settings);
    } else {
      this.validation = this.settings.defaults;
      this.verbose('Using default form validation', this.validation, this.settings);
    }

    this.refresh();

    this.bindEvents();
    this.set_defaults();

    if (this.settings.autoCheckRequired) {
      this.set_autoCheck();
    }

    this.instantiate();
  }

  instantiate() {
    this.verbose('Storing instance of module', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy() {
    this.verbose('Destroying previous module', this.instance);
    this.removeEvents();
    this.$element.removeAttr(this.moduleNamespace);
  }

  refresh() {
    this.verbose('Refreshing selector cache');
    this.$field      = this.$element.find(this.settings.selector.field);
    this.$group      = this.$element.find(this.settings.selector.group);
    this.$message    = this.$element.find(this.settings.selector.message);
    this.$prompt     = this.$element.find(this.settings.selector.prompt);

    this.$submit     = this.$element.find(this.settings.selector.submit);
    this.$clear      = this.$element.find(this.settings.selector.clear);
    this.$reset      = this.$element.find(this.settings.selector.reset);
  }

  submit() {
    this.verbose('Submitting form', this.$element);
    this.submitting = true;
    // TODO
    this.$element.trigger('submit');
  }

  reset() {
    this.$field.each((_index, el) => {
      let
        $field       = $(el),
        $element     = $field.parent(),
        $fieldGroup  = $field.closest(this.$group),
        $calendar    = $field.closest(this.settings.selector.uiCalendar),
        $prompt      = $fieldGroup.find(this.settings.selector.prompt),
        defaultValue = $field.data(this.settings.metadata.defaultValue),
        isCheckbox   = $element.is(this.settings.selector.uiCheckbox),
        isDropdown   = $element.is(this.settings.selector.uiDropdown)  && this.can_useElement('dropdown'),
        isCalendar   = ($calendar.length > 0  && this.can_useElement('calendar')),
        isErrored    = $fieldGroup.hasClass(this.settings.className.error)
      ;
      if (defaultValue === undefined) {
        return;
      }
      if (isErrored) {
        this.verbose('Resetting error on field', $fieldGroup);
        $fieldGroup.removeClass(this.settings.className.error);
        $prompt.remove();
      }
      if (isDropdown) {
        this.verbose('Resetting dropdown value', $element, defaultValue);
        // TODO
        // $element.dropdown('restore defaults', true);
      }
      else if (isCheckbox) {
        this.verbose('Resetting checkbox value', $element, defaultValue);
        $field.prop('checked', defaultValue);
      }
      else if (isCalendar) {
        // TODO
        // $calendar.calendar('set date', defaultValue);
      }
      else {
        this.verbose('Resetting field value', $field, defaultValue);
        $field.val(defaultValue);
      }
    });
    this.remove_states();
  }

  clear() {
    this.$field.each((_index, el) => {
      let
        $field       = $(el),
        $element     = $field.parent(),
        $fieldGroup  = $field.closest(this.$group),
        $prompt      = $fieldGroup.find(this.settings.selector.prompt),
        $calendar    = $field.closest(this.settings.selector.uiCalendar),
        defaultValue = $field.data(this.settings.metadata.defaultValue) || '',
        isCheckbox   = $element.is(this.settings.selector.uiCheckbox),
        isDropdown   = $element.is(this.settings.selector.uiDropdown)  && this.can_useElement('dropdown'),
        isCalendar   = ($calendar.length > 0  && this.can_useElement('calendar')),
        isErrored    = $fieldGroup.hasClass(this.settings.className.error)
      ;
      if (isErrored) {
        this.verbose('Resetting error on field', $fieldGroup);
        $fieldGroup.removeClass(this.settings.className.error);
        $prompt.remove();
      }
      if (isDropdown) {
        this.verbose('Resetting dropdown value', $element, defaultValue);
        // TODO
        // $element.dropdown('clear', true);
      }
      else if (isCheckbox) {
        $field.prop('checked', false);
      }
      else if (isCalendar) {
        // TODO
        // $calendar.calendar('clear');
      }
      else {
        this.verbose('Resetting field value', $field, defaultValue);
        $field.val('');
      }
    });
    this.remove_states();
  }

  // attachEvents(selector, action) {
  //   action = action || 'submit';
  //   $(selector).on('click' + eventNamespace, function(event) {
  //     module[action]();
  //     event.preventDefault();
  //   });
  // }

  bindEvents() {
    this.verbose('Attaching form events');
    this.$element
      .on('submit' + this.eventNamespace, this.validate_form.bind(this))
      .on('blur'   + this.eventNamespace, this.settings.selector.field, this.event_field_blur.bind(this))
      .on('click'  + this.eventNamespace, this.settings.selector.submit, this.submit.bind(this))
      .on('click'  + this.eventNamespace, this.settings.selector.reset, this.reset)
      .on('click'  + this.eventNamespace, this.settings.selector.clear, this.clear)
    ;
    if (this.settings.keyboardShortcuts) {
      this.$element.on('keydown' + this.eventNamespace, this.settings.selector.field, this.event_field_keydown.bind(this));
    }
    this.$field.each((_index, el) => {
      let
        $input     = $(el),
        type       = $input.prop('type'),
        inputEvent = this.get_changeEvent(type, $input)
      ;
      $input.on(inputEvent + this.eventNamespace, this.event_field_change.bind(this));
    });

    // Dirty events
    if (this.settings.preventLeaving) {
      $(window).on('beforeunload' + this.eventNamespace, this.event_beforeUnload);
    }

    this.$field.on('change click keyup keydown blur', (e) => {
      this.determine_isDirty();
    });

    this.$element.on('dirty' + this.eventNamespace, (e) => {
      this.invokeCallback('dirty')();
    });

    this.$element.on('clean' + this.eventNamespace, (e) => {
      this.invokeCallback('clean')();
    })
  }

  event_beforeUnload(event = window.event) {
    if (this.is_dirty() && !this.submitting) {
      // For modern browsers
      if (event) {
        event.returnValue = this.settings.text.leavingMessage;
      }

      // For olders...
      return this.settings.text.leavingMessage;
    }
  }

  event_field_blur(event) {
    let
      $field          = $(event.target),
      $fieldGroup     = $field.closest(this.$group),
      validationRules = this.get_validation($field)
    ;
    if (validationRules && (this.settings.on == 'blur' || ( $fieldGroup.hasClass(this.settings.className.error) && this.settings.revalidate) )) {
      this.debug('Revalidating field', $field, validationRules);
      this.validate_field(validationRules, null);
      if (!this.settings.inline) {
        this.validate_form(false,true);
      }
    }
  }

  event_field_change(event) {
    let
      $field      = $(event.target),
      $fieldGroup = $field.closest(this.$group),
      validationRules = this.get_validation($field)
    ;
    if (validationRules && (this.settings.on == 'change' || ( $fieldGroup.hasClass(this.settings.className.error) && this.settings.revalidate) )) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.debug('Revalidating field', $field, validationRules);
        this.validate_field(validationRules, null);
        if (!this.settings.inline) {
          this.validate_form(false,true);
        }
      }, this.settings.delay);
    }
  }

  event_field_keydown(event) {
    let
      $field       = $(event.target),
      key          = event.which,
      isInput      = $field.is(this.settings.selector.input),
      isCheckbox   = $field.is(this.settings.selector.checkbox),
      isInDropdown = ($field.closest(this.settings.selector.uiDropdown).length > 0),
      keyCode      = {
        enter  : 13,
        escape : 27
      }
    ;
    if (key == keyCode.escape) {
      this.verbose('Escape key pressed blurring field');
      $field[0].blur();
    }
    if (!event.ctrlKey && key == keyCode.enter && isInput && !isInDropdown && !isCheckbox) {
      if (!this.keyHeldDown) {
        $field.one('keyup' + this.eventNamespace, this.event_field_keyup);
        this.submit();
        this.debug('Enter pressed on input submitting form');
      }
      this.keyHeldDown = true;
    }
  }

  event_field_keyup(event) {
    this.keyHeldDown = false;
  }

  removeEvents() {
    this.$element.off(this.eventNamespace);
    this.$field.off(this.eventNamespace);
    this.$submit.off(this.eventNamespace);
    this.$field.off(this.eventNamespace);
  }

  remove_errors() {
    this.debug('Removing form error messages');
    this.$message.empty();
  }

  remove_field(field) {
    let
      fields = Array.isArray(field)
        ? field
        : [field]
    ;
    $.each(fields, function(_index, field) {
      this.remove_rule(field);
    });
  }

  remove_fields(fields) {
    this.remove_field(fields);
  }

  remove_prompt(identifier) {
    let
      $field      = this.get_field(identifier),
      $fieldGroup = $field.closest(this.$group),
      $prompt     = $fieldGroup.children(this.settings.selector.prompt)
    ;

    $fieldGroup.removeClass(this.settings.className.error);

    // if (this.settings.inline && $prompt.is(':visible')) {
    if (this.settings.inline && $prompt.is('.visible')) {
      this.verbose('Removing prompt for field', identifier);
      // if (this.settings.transition  && this.can_useElement('transition') && this.$element.transition('is supported')) {
      if (this.settings.transition  && this.can_useElement('transition')) {
        // $prompt.transition(this.settings.transition + ' out', this.settings.duration, function() {
        //   $prompt.remove();
        // });

        new Transition($prompt, {
          animation: this.settings.transition + ' out',
          duration: this.settings.duration
        }).on('complete', () => {
          $prompt.remove();
        });
      }
      else {
        // $prompt.fadeOut(this.settings.duration, function() {
        //   $prompt.remove();
        // });
        Utils.fadeOut($prompt, this.settings.duration, 'linear', () => {
          $prompt.remove();
        });
      }
    }
  }

  remove_rule(field, rule) {
    let rules = Array.isArray(rule) ? rule : [rule];

    if (this.validation[field] === undefined || !Array.isArray(this.validation[field].rules)) {
      return;
    }

    if (rule === undefined) {
      this.debug('Removed all rules');
      this.validation[field].rules = [];
      return;
    }
    $.each(this.validation[field].rules, (index, rule: any) => {
      if (rule && rules.indexOf(rule.type) !== -1) {
        this.debug('Removed rule', rule.type);
        this.validation[field].rules.splice(index, 1);
      }
    });
  }

  // alias
  remove_rules(field, rules) {
    if (Array.isArray(field)) {
      $.each(field, (_index, field) => {
        this.remove_rule(field, rules);
      });
    }
    else {
      this.remove_rule(field, rules);
    }
  }

  remove_states() {
    this.$element.removeClass(this.settings.className.error).removeClass(this.settings.className.success);
    if (!this.settings.inline) {
      this.remove_errors();
    }
    this.determine_isDirty();
  }

  get_changeEvent(type, $input) {
    if (type == 'checkbox' || type == 'radio' || type == 'hidden' || $input.is('select')) {
      return 'change';
    }
    else {
      return this.get_inputEvent();
    }
  }

  get_dirtyFields() {
    return this.$field.filter((_index, e) => {
      return $(e).data(this.settings.metadata.isDirty);
    });
  }

  get_inputEvent() {
    return (document.createElement('input').oninput !== undefined)
      ? 'input'
      // INVESTIGATE
      // : (document.createElement('input').onpropertychange !== undefined)
      //   ? 'propertychange'
      //   : 'keyup'
      : 'keyup'
    ;
  }

  // takes a validation object and returns whether field passes validation
  validate_field(field: any, fieldName, showErrors: boolean = true) {
    if (typeof field == 'string') {
      this.verbose('Validating field', field);
      fieldName = field;
      field     = this.validation[field];
    }
    let
      identifier    = field.identifier || fieldName,
      $field        = this.get_field(identifier),
      $dependsField = (field.depends)
        ? this.get_field(field.depends)
        : false,
      fieldValid  = true,
      fieldErrors = []
    ;
    if (!field.identifier) {
      this.debug('Using field name as identifier', identifier);
      field.identifier = identifier;
    }
    let isDisabled = !$field.filter(':not(:disabled)').length;
    if (isDisabled) {
      this.debug('Field is disabled. Skipping', identifier);
    }
    else if (field.optional && this.is_blank($field)) {
      this.debug('Field is optional and blank. Skipping', identifier);
    }
    else if (field.depends && this.is_empty($dependsField)) {
      this.debug('Field depends on another value that is not present or empty. Skipping', $dependsField);
    }
    else if (field.rules !== undefined) {
      if (showErrors) {
        $field.closest(this.$group).removeClass(this.settings.className.error);
      }
      $.each(field.rules, (_index, rule: any) => {
        if (this.has_field(identifier)) {
          let invalidFields: any = this.validate_rule(field, rule, true) || [];
          if (invalidFields.length>0) {
            this.debug('Field is invalid', identifier, rule.type);
            fieldErrors.push(this.get_prompt(rule, field));
            fieldValid = false;
            if (showErrors) {
              $(invalidFields).closest(this.$group).addClass(this.settings.className.error);
            }
          }
        }
      });
    }
    if (fieldValid) {
      if (showErrors) {
        // this.remove_prompt(identifier, fieldErrors);
        this.remove_prompt(identifier);
        this.invokeCallback('valid')($field);
      }
    }
    else {
      if (showErrors) {
        this.formErrors = this.formErrors.concat(fieldErrors);
        this.add_prompt(identifier, fieldErrors, true);
        this.invokeCallback('invalid')($field);
      }
      return false;
    }
    return true;
  }

  validate_form(event, ignoreCallbacks: boolean) {
    let values = this.get_values();
  
    // input keydown event will fire submit repeatedly by browser default
    if (this.keyHeldDown) {
      return false;
    }

    // reset errors
    this.formErrors = [];
    if (this.determine_isValid()) {
      this.debug('Form has no validation errors, submitting');
      this.set_success();
      if (!this.settings.inline) {
        this.remove_errors();
      }
      if (ignoreCallbacks !== true) {
        return this.invokeCallback('success')(this.element, event, values);
      }
    }
    else {
      this.debug('Form has errors');
      this.submitting = false;
      this.set_error();
      if (!this.settings.inline) {
        this.add_errors(this.formErrors);
      }
      // prevent ajax submit
      if (event && this.$element.data('moduleApi') !== undefined) {
        event.stopImmediatePropagation();
      }
      if (this.settings.errorFocus) {
        let focusElement, hasTabIndex = true;
        if (typeof this.settings.errorFocus === 'string') {
          focusElement = $(this.settings.errorFocus);
          hasTabIndex = focusElement.is('[tabindex]');
          // to be able to focus/scroll into non input elements we need a tabindex
          if (!hasTabIndex) {
            focusElement.attr('tabindex',-1);
          }
        } else {
          focusElement = this.$group.filter('.' + this.settings.className.error).first().find(this.settings.selector.field);
        }
        focusElement.focus();
        // only remove tabindex if it was dynamically created above
        if (!hasTabIndex) {
          focusElement.removeAttr('tabindex');
        }
      }
      if (ignoreCallbacks !== true) {
        this.invokeCallback('failure')(this.element, this.formErrors, values);
      }
    }
  }

  // takes validation rule and returns whether field passes rule
  validate_rule(field, rule, internal: boolean): boolean | any[] {
    let
      $field       = this.get_field(field.identifier),
      ancillary    = this.get_ancillaryValue(rule),
      ruleName     = this.get_ruleName(rule),
      ruleFunction = this.settings.rules[ruleName],
      invalidFields: any = [],
      isCheckbox = $field.is(this.settings.selector.checkbox),
      isValid = (field) => {
        let value = (isCheckbox ? $(field).filter(':checked').val() : $(field).val());
        // cast to string avoiding encoding special values
        value = (value === undefined || value === '' || value === null)
            ? ''
            : (this.settings.shouldTrim && rule.shouldTrim !== false) || rule.shouldTrim ? String(value + '').trim() : String(value + '')
        ;
        return ruleFunction.call(field, value, ancillary, this.$element);
      }
    ;
    if (!$.isFunction(ruleFunction) ) {
      this.error(this.settings.error.noRule, ruleName);
      return;
    }
    if (isCheckbox) {
      if (!isValid($field)) {
        invalidFields = $field;
      }
    } else {
      $.each($field, (_index, field) => {
        if (!isValid(field)) {
          invalidFields.push(field);
        }
      });
    }
    return internal ? invalidFields : !(invalidFields.length > 0);
  }

  determine_isDirty() {
    let formIsDirty = false;
  
    this.$field.each((_index, el) => {
      let
        $el = $(el),
        isCheckbox = ($el.filter(this.settings.selector.checkbox).length > 0),
        isDirty: boolean
      ;

      if (isCheckbox) {
        isDirty = this.is_checkboxDirty($el);
      } else {
        isDirty = this.is_fieldDirty($el);
      }

      $el.data(this.settings.metadata.isDirty, isDirty);

      formIsDirty ||= isDirty;
    });

    if (formIsDirty) {
      this.set_dirty();
    } else {
      this.set_clean();
    }
  }

  determine_isValid() {
    let allValid = true;

    $.each(this.validation, (fieldName, field) => {
      if (!(this.validate_field(field, fieldName, true))) {
        allValid = false;
      }
    });

    return allValid;
  }

  has_field(identifier) {
    this.verbose('Checking for existence of a field with identifier', identifier);
    identifier = this.escape_string(identifier);
    if (typeof identifier !== 'string') {
      this.error(this.settings.error.identifier, identifier);
    }
    if (this.$field.filter('#' + identifier).length > 0 ) {
      return true;
    }
    else if (this.$field.filter('[name="' + identifier +'"]').length > 0 ) {
      return true;
    }
    else if (this.$field.filter('[data-' + this.settings.metadata.validate + '="'+ identifier +'"]').length > 0 ) {
      return true;
    }
    return false;
  }

  get_ancillaryValue(rule) {
    if (!rule.type || (!rule.value && !this.is_bracketedRule(rule))) {
      return false;
    }
    return (rule.value !== undefined)
      ? rule.value
      : rule.type.match(this.settings.regExp.bracket)[1] + ''
    ;
  }

  get_selector(identifier) {
    identifier = this.escape_string(identifier);

    let t: Cash;
    if ((t=this.$field.filter('#' + identifier)).length > 0 ) {
      return '#' + identifier;
    }
    if ((t=this.$field.filter('[name="' + identifier +'"]')).length > 0 ) {
      return '[name="' + identifier +'"]';
    }
    if ((t=this.$field.filter('[name="' + identifier +'[]"]')).length > 0 ) {
      return '[name="' + identifier +'[]"]';
    }
    if ((t=this.$field.filter('[data-' + this.settings.metadata.validate + '="'+ identifier +'"]')).length > 0 ) {
      return '[data-' + this.settings.metadata.validate + '="'+ identifier +'"]';
    }
    return "input";
  }

  get_field(identifier) {
    this.verbose('Finding field with identifier', identifier);
    identifier = this.escape_string(identifier);
    let t: Cash;
    if ((t=this.$field.filter('#' + identifier)).length > 0 ) {
      return t;
    }
    if ((t=this.$field.filter('[name="' + identifier +'"]')).length > 0 ) {
      return t;
    }
    if ((t=this.$field.filter('[name="' + identifier +'[]"]')).length > 0 ) {
      return t;
    }
    if ((t=this.$field.filter('[data-' + this.settings.metadata.validate + '="'+ identifier +'"]')).length > 0 ) {
      return t;
    }
    return $('<input/>');
  }

  get_fields(fields) {
    let
      $fields = $()
    ;
    $.each(fields, (_index, name) => {
      $fields = $fields.add( this.get_field(name) );
    });
    return $fields;
  }

  get_fieldsFromShorthand(fields) {
    let
      fullFields = {}
    ;
    $.each(fields, (name, rules: any) => {
      if (!Array.isArray(rules) && typeof rules === 'object') {
        fullFields[name] = rules;
      } else {
        if (typeof rules == 'string') {
          rules = [rules];
        }
        fullFields[name] = {
          rules: []
        };
        $.each(rules, (_index, rule) => {
          fullFields[name].rules.push({type: rule});
        });
      }
    });
    return fullFields;
  }

  get_prompt(rule, field) {
    let
      ruleName      = this.get_ruleName(rule),
      ancillary     = this.get_ancillaryValue(rule),
      $field        = this.get_field(field.identifier),
      value         = $field.val(),
      prompt        = $.isFunction(rule.prompt)
        ? rule.prompt(value)
        : rule.prompt || this.settings.prompt[ruleName] || this.settings.text.unspecifiedRule,
      requiresValue = (prompt.search('{value}') !== -1),
      requiresName  = (prompt.search('{name}') !== -1),
      $label,
      name,
      parts,
      suffixPrompt
    ;
    if (ancillary && ancillary.indexOf('..') >= 0) {
      parts = ancillary.split('..', 2);
      if (!rule.prompt) {
        suffixPrompt = (
            parts[0] === '' ? this.settings.prompt.maxValue.replace(/\{ruleValue\}/g,'{max}') :
            parts[1] === '' ? this.settings.prompt.minValue.replace(/\{ruleValue\}/g,'{min}') :
            this.settings.prompt.range
        );
        prompt += suffixPrompt.replace(/\{name\}/g, ' ' + this.settings.text.and);
      }
      prompt = prompt.replace(/\{min\}/g, parts[0]);
      prompt = prompt.replace(/\{max\}/g, parts[1]);
    }
    if (requiresValue) {
      prompt = prompt.replace(/\{value\}/g, $field.val());
    }
    if (requiresName) {
      $label = $field.closest(this.settings.selector.group).find('label').eq(0);
      name = ($label.length == 1)
        ? $label.text()
        : $field.prop('placeholder') || this.settings.text.unspecifiedField
      ;
      prompt = prompt.replace(/\{name\}/g, name);
    }
    prompt = prompt.replace(/\{identifier\}/g, field.identifier);
    prompt = prompt.replace(/\{ruleValue\}/g, ancillary);
    if (!rule.prompt) {
      this.verbose('Using default validation prompt for type', prompt, ruleName);
    }
    return prompt;
  }

  get_ruleName(rule) {
    if (this.is_bracketedRule(rule) ) {
      return rule.type.replace(rule.type.match(this.settings.regExp.bracket)[0], '');
    }
    return rule.type;
  }

  get_validation($field) {
    let
      fieldValidation,
      identifier
    ;
    if (!this.validation) {
      return false;
    }
    $.each(this.validation, (fieldName, field: any) => {
      identifier = field.identifier || fieldName;
      $.each(this.get_field(identifier), (_index, groupField) => {
        if (groupField == $field[0]) {
          field.identifier = identifier;
          fieldValidation = field;
          return false;
        }
      });
    });
    return fieldValidation || false;
  }

  get_value(field) {
    let
      fields = [],
      results
    ;
    fields.push(field);
    results = this.get_values.call(this.element, fields);
    return results[field];
  }

  get_values(fields = []) {
    let
      $fields = Array.isArray(fields)
        ? this.get_fields(fields)
        : this.$field,
      values = {}
    ;
    $fields.each((_index, field) => {
      let
        $field       = $(field),
        $calendar    = $field.closest(this.settings.selector.uiCalendar),
        name         = $field.prop('name'),
        value        = $field.val(),
        isCheckbox   = $field.is(this.settings.selector.checkbox),
        isRadio      = $field.is(this.settings.selector.radio),
        isMultiple   = (name.indexOf('[]') !== -1),
        isCalendar   = ($calendar.length > 0  && this.can_useElement('calendar')),
        isChecked    = (isCheckbox)
          ? $field.is(':checked')
          : false
      ;
      if (name) {
        if (isMultiple) {
          name = name.replace('[]', '');
          if (!values[name]) {
            values[name] = [];
          }
          if (isCheckbox) {
            if (isChecked) {
              values[name].push(value || true);
            }
            else {
              values[name].push(false);
            }
          }
          else {
            values[name].push(value);
          }
        }
        else {
          if (isRadio) {
            if (values[name] === undefined || values[name] === false) {
              values[name] = (isChecked)
                ? value || true
                : false
              ;
            }
          }
          else if (isCheckbox) {
            if (isChecked) {
              values[name] = value || true;
            }
            else {
              values[name] = false;
            }
          }
          else if (isCalendar) {
            // TODO
            // let date = $calendar.calendar('get date');

            let date = new Date();

            if (date !== null) {
              if (this.settings.dateHandling == 'date') {
                values[name] = date;
              } else if (this.settings.dateHandling == 'input') {
                // TODO
                // values[name] = $calendar.calendar('get input date')
              } else if (this.settings.dateHandling == 'formatter') {
                // TODO
                // let type = $calendar.calendar('setting', 'type');
                let type = 'date';

                switch(type) {
                  case 'date':
                  values[name] = this.settings.formatter.date(date);
                  break;

                  case 'datetime':
                  values[name] = this.settings.formatter.datetime(date);
                  break;

                  case 'time':
                  values[name] = this.settings.formatter.time(date);
                  break;

                  case 'month':
                  values[name] = this.settings.formatter.month(date);
                  break;

                  case 'year':
                  values[name] = this.settings.formatter.year(date);
                  break;

                  default:
                  this.debug('Wrong calendar mode', $calendar, type);
                  values[name] = '';
                }
              }
            } else {
              values[name] = '';
            }
          } else {
            values[name] = value;
          }
        }
      }
    });
    return values;
  }

  set_asClean() {
    this.set_defaults();
    this.set_clean();
  }

  set_asDirty() {
    this.set_defaults();
    this.set_clean();
  }

  set_autoCheck() {
    this.debug('Enabling auto check on required fields');
    this.$field.each((_index, el) => {
      let
        $el        = $(el),
        $elGroup   = $(el).closest(this.$group),
        isCheckbox = ($el.filter(this.settings.selector.checkbox).length > 0),
        isRequired = $el.prop('required') || $elGroup.hasClass(this.settings.className.required) || $elGroup.parent().hasClass(this.settings.className.required),
        isDisabled = $el.is(':disabled') || $elGroup.hasClass(this.settings.className.disabled) || $elGroup.parent().hasClass(this.settings.className.disabled),
        validation = this.get_validation($el),
        hasEmptyRule = validation
          // ? $.grep(validation.rules, function(rule) { return rule.type == "empty" }) !== 0
          ? (validation.rules.filter(rule => rule.type == "empty")) !== 0
          : false,
        identifier = validation.identifier || $el.attr('id') || $el.attr('name') || $el.data(this.settings.metadata.validate)
      ;
      if (isRequired && !isDisabled && !hasEmptyRule && identifier !== undefined) {
        if (isCheckbox) {
          this.verbose("Adding 'checked' rule on field", identifier);
          this.add_rule(identifier, "checked");
        } else {
          this.verbose("Adding 'empty' rule on field", identifier);
          this.add_rule(identifier, "empty");
        }
      }
    });
  }

  set_clean() {
    this.verbose('Setting state clean');
    this.dirty = false;
    this.history[0] = this.history[1];
    this.history[1] = 'clean';

    if (this.is_justDirty()) {
      this.$element.trigger('clean');
    }
  }

  set_defaults() {
    this.$field.each((_index, el) => {
      let
        $el        = $(el),
        $parent    = $el.parent(),
        isCheckbox = ($el.filter(this.settings.selector.checkbox).length > 0),
        isDropdown = $parent.is(this.settings.selector.uiDropdown) && this.can_useElement('dropdown'),
        $calendar   = $el.closest(this.settings.selector.uiCalendar),
        isCalendar  = ($calendar.length > 0  && this.can_useElement('calendar')),
        value      = (isCheckbox)
          ? $el.is(':checked')
          : $el.val()
      ;
      if (isDropdown) {
        // TODO
        // $parent.dropdown('save defaults');
      }
      else if (isCalendar) {
        // TODO
        // $calendar.calendar('refresh');
      }
      $el.data(this.settings.metadata.defaultValue, value);
      $el.data(this.settings.metadata.isDirty, false);
    });
  }

  set_dirty() {
    this.verbose('Setting state dirty');
    this.dirty = true;
    this.history[0] = this.history[1];
    this.history[1] = 'dirty';

    if (this.is_justClean()) {
      this.$element.trigger('dirty');
    }
  }

  set_error() {
    this.$element
      .removeClass(this.settings.className.success)
      .addClass(this.settings.className.error)
    ;
  }

  set_optional(identifier, bool: boolean = false) {
    $.each(this.validation, (fieldName, field: any) => {
      if (identifier == fieldName || identifier == field.identifier) {
        field.optional = bool;
      }
    });
  }

  set_success() {
    this.$element
      .removeClass(this.settings.className.error)
      .addClass(this.settings.className.success)
    ;
  }

  set_value(field, value) {
    let
      fields = {}
    ;
    fields[field] = value;
    return this.set_values.call(this.element, fields);
  }

  set_values(fields) {
    if (Object.keys(fields).length === 0) {
      return;
    }
    $.each(fields, (key, value: any) => {
      let
        $field      = this.get_field(key),
        $element    = $field.parent(),
        $calendar   = $field.closest(this.settings.selector.uiCalendar),
        isMultiple  = Array.isArray(value),
        isCheckbox  = $element.is(this.settings.selector.uiCheckbox) && this.can_useElement('checkbox'),
        isDropdown  = $element.is(this.settings.selector.uiDropdown) && this.can_useElement('dropdown'),
        isRadio     = ($field.is(this.settings.selector.radio) && isCheckbox),
        isCalendar  = ($calendar.length > 0  && this.can_useElement('calendar')),
        fieldExists = ($field.length > 0),
        $multipleField
      ;
      if (fieldExists) {
        if (isMultiple && isCheckbox) {
          this.verbose('Selecting multiple', value, $field);
          // $element.checkbox('uncheck');
          new Checkbox($element, {}).uncheck();
          $.each(value, (_index, value) => {
            $multipleField = $field.filter('[value="' + value + '"]');
            $element       = $multipleField.parent();
            if ($multipleField.length > 0) {
              // $element.checkbox('check');
              new Checkbox($element, {}).check();
            }
          });
        }
        else if (isRadio) {
          this.verbose('Selecting radio value', value, $field);
          // $field.filter('[value="' + value + '"]')
          //   .parent(this.settings.selector.uiCheckbox)
          //     .checkbox('check')
          // ;
          new Checkbox($field.filter('[value="' + value + '"]').parent(this.settings.selector.uiCheckbox), {}).check();
        }
        else if (isCheckbox) {
          this.verbose('Setting checkbox value', value, $element);
          if (value === true || value === 1) {
            // $element.checkbox('check');
            new Checkbox($element, {}).check();
          }
          else {
            // $element.checkbox('uncheck');
            new Checkbox($element, {}).uncheck();
          }
        }
        else if (isDropdown) {
          this.verbose('Setting dropdown value', value, $element);
          // $element.dropdown('set selected', value);
          new Dropdown($element, {}).set_selected(value);
        }
        else if (isCalendar) {
          // $calendar.calendar('set date',value);
          new Calendar($element, {}).set_date(value);
        }
        else {
          this.verbose('Setting field value', value, $field);
          $field.val(value);
        }
      }
    });
  }

  is_blank($field): boolean {
    return String($field.val()).trim() === '';
  }

  is_bracketedRule(rule): boolean {
    return (rule.type && rule.type.match(this.settings.regExp.bracket));
  }

  is_checkboxDirty($el): boolean {
    let initialValue = $el.data(this.settings.metadata.defaultValue);
    let currentValue = $el.is(":checked");

    return initialValue !== currentValue;
  }

  is_clean(): boolean {
    return !this.dirty;
  }

  is_dirty(): boolean {
    return this.dirty;
  }

  is_empty($field): boolean {
    if (!$field || $field.length === 0) {
      return true;
    }
    else if ($field.is(this.settings.selector.checkbox)) {
      return !$field.is(':checked');
    }
    else {
      return this.is_blank($field);
    }
  }

  is_fieldDirty($el): boolean {
    let initialValue = $el.data(this.settings.metadata.defaultValue);
    // Explicitly check for null/undefined here as value may be `false`, so ($el.data(dataInitialValue) || '') would not work
    if (initialValue == null) { initialValue = ''; }
    else if (Array.isArray(initialValue)) {
      initialValue = initialValue.toString();
    }
    let currentValue = $el.val();
    if (currentValue == null) { currentValue = ''; }
    // multiple select values are returned as arrays which are never equal, so do string conversion first
    else if (Array.isArray(currentValue)) {
      currentValue = currentValue.toString();
    }
    // Boolean values can be encoded as "true/false" or "True/False" depending on underlying frameworks so we need a case insensitive comparison
    let boolRegex = /^(true|false)$/i;
    let isBoolValue = boolRegex.test(initialValue) && boolRegex.test(currentValue);
    if (isBoolValue) {
      let regex = new RegExp("^" + initialValue + "$", "i");
      return !regex.test(currentValue);
    }

    return currentValue !== initialValue;
  }

  is_justClean(): boolean {
    return (this.history[0] === 'clean');
  }

  is_justDirty(): boolean {
    return (this.history[0] === 'dirty');
  }

  is_shorthandFields(fields): boolean {
    let
      fieldKeys = Object.keys(fields),
      firstRule = fields[fieldKeys[0]]
    ;
    return this.is_shorthandRules(firstRule);
  }

  // duck type rule test
  is_shorthandRules(rules): boolean {
    return (typeof rules == 'string' || Array.isArray(rules));
  }

  is_valid(field, showErrors: boolean): boolean {
    let
      allValid = true
    ;
    if (field) {
      this.verbose('Checking if field is valid', field);
      return this.validate_field(this.validation[field], field, !!showErrors);
    }
    else {
      this.verbose('Checking if form is valid');
      $.each(this.validation, (fieldName, field) => {
        if (!this.is_valid(fieldName, showErrors)) {
          allValid = false;
        }
      });
      return allValid;
    }
  }

  can_useElement(element): boolean {
    return true;
    // IS THIS REALLY NECESSARY ?
    // if ($.fn[element] !== undefined) {
    //   return true;
    // }
    // this.error(this.settings.error.noElement.replace('{element}', element));
    // return false;
  }

  add_errors(errors) {
    this.debug('Adding form error messages', errors);
    this.set_error();
    this.$message.html(this.settings.templates.error(errors));
  }

  add_field(name, rules) {
    // Validation should have at least a standard format
    if (this.validation[name] === undefined || this.validation[name].rules === undefined) {
      this.validation[name] = {
        rules: []
      };
    }
    let
      newValidation = {
        rules: []
      }
    ;
    if (this.is_shorthandRules(rules)) {
      rules = Array.isArray(rules)
        ? rules
        : [rules]
      ;
      $.each(rules, function(_index, rule) {
        newValidation.rules.push({ type: rule });
      });
    }
    else {
      newValidation.rules = rules.rules;
    }
    // For each new rule, check if there's not already one with the same type
    $.each(newValidation.rules, (_index, rule) => {
      // if ($.grep(this.validation[name].rules, function(item) { return item.type == rule.type; }).length == 0) {
      //   this.validation[name].rules.push(rule);
      // }
      if (this.validation[name].rules.filter(item => item.type == rule.type).length == 0) {
        this.validation[name].rules.push(rule);
      }
    });
    this.debug('Adding rules', newValidation.rules, this.validation);
  }

  add_fields(fields) {
    this.validation = $.extend({}, this.validation, this.get_fieldsFromShorthand(fields));
  }

  add_prompt(identifier, errors, internal) {
    let
      $field       = this.get_field(identifier),
      $fieldGroup  = $field.closest(this.$group),
      $prompt      = $fieldGroup.children(this.settings.selector.prompt),
      promptExists = ($prompt.length !== 0)
    ;
    errors = (typeof errors == 'string')
      ? [errors]
      : errors
    ;
    this.verbose('Adding field error state', identifier);
    if (!internal) {
      $fieldGroup.addClass(this.settings.className.error);
    }
    if (this.settings.inline) {
      if (!promptExists) {
        $prompt = this.settings.templates.prompt(errors, this.settings.className.label);
        $prompt.appendTo($fieldGroup);
      }
      $prompt.html(errors[0]);
      if (!promptExists) {
        // if (this.settings.transition && this.can_useElement('transition') && this.$element.transition('is supported')) {
        if (this.settings.transition && this.can_useElement('transition')) {
          this.verbose('Displaying error with css transition', this.settings.transition);
          // $prompt.transition(this.settings.transition + ' in', this.settings.duration);
          new Transition($prompt, {
            animation: this.settings.transition + ' in',
            duration: this.settings.duration
          });
        }
        else {
          this.verbose('Displaying error with fallback javascript animation');
          // $prompt.fadeIn(this.settings.duration);
          Utils.fadeIn(this.settings.duration);
        }
      }
      else {
        this.verbose('Inline errors are disabled, no inline error added', identifier);
      }
    }
  }
  
  // Alias for add_field()
  add_rule(name, rules) {
    this.add_field(name, rules);
  }

  escape_string(text) {
    text =  String(text);
    return text.replace(this.settings.regExp.escape, '\\$&');
  }
}