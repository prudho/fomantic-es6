"use strict";

import { Module, ModuleOptions } from '../module';

import $, { Cash } from 'cash-dom';

export interface ProgressOptions extends ModuleOptions {
  random: {
    min: number;
    max: number;
  }

  duration: number;

  updateInterval: number;

  autoSuccess: boolean;
  showActivity: boolean;
  limitValues: boolean;

  label: string
  precision: number;
  framerate: number;

  percent: boolean;
  total: boolean;
  value: boolean;

  failSafeDelay: number;

  error: {
    method          : string
    nonNumeric      : string
    tooHigh         : string
    tooLow          : string
    sumExceedsTotal : string
  }

  regExp: {
    variable: RegExp;
  }

  metadata: {
    percent : string,
    total   : string,
    value   : string
  }

  selector: {
    bar      : string,
    label    : string,
    progress : string
  }

  text: {
    active  : string,
    error   : string,
    success : string,
    warning : string,
    percent : string,
    ratio   : string,
    bars    : Array<string>
  }

  className: {
    active  : string,
    error   : string,
    success : string,
    warning : string
  }

  onLabelUpdate : Function;
  onChange      : Function;
  onSuccess     : Function;
  onActive      : Function;
  onError       : Function;
  onWarning     : Function;
}

const default_settings: ProgressOptions = {
  name         : 'Progress',
  namespace    : 'progress',

  silent       : false,
  debug        : false,
  verbose      : false,
  performance  : true,

  random       : {
    min : 2,
    max : 5
  },

  duration       : 300,

  updateInterval : null,

  autoSuccess    : true,
  showActivity   : true,
  limitValues    : true,

  label          : 'percent',
  precision      : 0,
  framerate      : (1000 / 30), /// 30 fps

  percent        : false,
  total          : false,
  value          : false,

  // delay in ms for fail safe animation callback
  failSafeDelay : 100,

  error    : {
    method          : 'The method you called is not defined.',
    nonNumeric      : 'Progress value is non numeric',
    tooHigh         : 'Value specified is above 100%',
    tooLow          : 'Value specified is below 0%',
    sumExceedsTotal : 'Sum of multple values exceed total',
  },

  regExp: {
    variable: /\{\$*[A-z0-9]+\}/g
  },

  metadata: {
    percent : 'percent',
    total   : 'total',
    value   : 'value'
  },

  selector : {
    bar      : ':scope > .bar',
    label    : ':scope > .label',
    progress : '.bar > .progress'
  },

  text : {
    active  : null,
    error   : null,
    success : null,
    warning : null,
    percent : '{percent}%',
    ratio   : '{value} of {total}',
    bars    : ['']
  },

  className : {
    active  : 'active',
    error   : 'error',
    success : 'success',
    warning : 'warning'
  },

  onLabelUpdate : function(state, text, value, total){
    return text;
  },
  onChange      : function(percent, value, total){},
  onSuccess     : function(total){},
  onActive      : function(value, total){},
  onError       : function(value, total){},
  onWarning     : function(value, total){}
}

export class Progress extends Module {
  settings: ProgressOptions;

  $bars: Cash;
  $progresses: Cash;
  $label: Cash

  animating: boolean = false;

  total;
  value;
  nextValue;
  percent;

  transitionEnd;
  interval;
  progressPoll;
  timer;
  failSafeTimer;

  instance: Progress;

  constructor(selector: string, parameters: ProgressOptions) {
    super(selector, parameters, default_settings);

    this.$bars = $(this.element).find(this.settings.selector.bar);
    // this.$progresses     = $(this).find(this.settings.selector.progress),
    this.$progresses     = $(this.element).find(this.settings.selector.progress);

    // this.$label          = $(this).find(this.settings.selector.label);
    this.$label          = $(this.element).find(this.settings.selector.label);
    
    this.initialize();
  }

  initialize(): void {
    this.set_duration();
    this.set_transitionEvent();
    this.debug(this.element);

    this.read_metadata();
    this.read_settings();

    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Storing instance of progress', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.verbose('Destroying previous progress for', this.$element);
    clearInterval(this.instance.interval);
    this.remove_state();
    this.$element.removeAttr(this.moduleNamespace);
    this.instance = undefined;
  }

  create_progressPoll(): void {
    this.progressPoll = setTimeout(() => {
      this.update_toNextValue();
      this.remove_progressPoll();
    }, this.get_updateInterval());
  }

  reset(): void {
    this.remove_nextValue();
    this.update_progress(0);
  }

  increment(incrementValue): void {
    let
      startValue,
      newValue
    ;
    if (this.has_total()) {
      startValue     = this.get_value();
      incrementValue = incrementValue || 1;
    }
    else {
      startValue     = this.get_percent();
      incrementValue = incrementValue || this.get_randomValue();
    }
    newValue = startValue + incrementValue;
    this.debug('Incrementing percentage by', startValue, newValue, incrementValue);
    newValue = this.get_normalizedValue(newValue);
    this.set_progress(newValue);
  }

  decrement(decrementValue): void {
    let
      total     = this.get_total(),
      startValue,
      newValue
    ;
    if (total) {
      startValue     =  this.get_value();
      decrementValue =  decrementValue || 1;
      newValue       =  startValue - decrementValue;
      this.debug('Decrementing value by', decrementValue, startValue);
    }
    else {
      startValue     =  this.get_percent();
      decrementValue =  decrementValue || this.get_randomValue();
      newValue       =  startValue - decrementValue;
      this.debug('Decrementing percentage by', decrementValue, startValue);
    }
    newValue = this.get_normalizedValue(newValue);
    this.set_progress(newValue);
  }

  bind_transitionEnd(callback): void {
    let transitionEnd = this.get_transitionEnd();
    this.$bars.one(transitionEnd + this.eventNamespace, (event) => {
      clearTimeout(this.failSafeTimer);
      callback.call(this, event);
    });
    this.failSafeTimer = setTimeout(() => {
      // this.$bars.triggerHandler(transitionEnd);
      this.$bars.trigger(transitionEnd);
    }, this.settings.duration + this.settings.failSafeDelay);
    this.verbose('Adding fail safe timer', this.timer);
  }

  read_metadata(): void {
    let data = {
      percent : this.helper_forceArray(this.$element.data(this.settings.metadata.percent)),
      total   : this.$element.data(this.settings.metadata.total),
      value   : this.helper_forceArray(this.$element.data(this.settings.metadata.value))
    };
    if (data.total !== undefined) {
      this.debug('Total value set from metadata', data.total);
      this.set_total(data.total);
    }
    if (data.value.length > 0) {
      this.debug('Current value set from metadata', data.value);
      this.set_value(data.value);
      this.set_progress(data.value);
    }
    if (data.percent.length > 0) {
      this.debug('Current percent value set from metadata', data.percent);
      this.set_percent(data.percent);
    }
  }

  read_settings(): void {
    if (this.settings.total !== false) {
      this.debug('Current total set in settings', this.settings.total);
      this.set_total(this.settings.total);
    }
    if (this.settings.value !== false) {
      this.debug('Current value set in settings', this.settings.value);
      this.set_value(this.settings.value);
      this.set_progress(this.value);
    }
    if (this.settings.percent !== false) {
      this.debug('Current percent set in settings', this.settings.percent);
      this.set_percent(this.settings.percent);
    }
  }

  complete(keepState: boolean): void {
    if (this.percent === undefined || this.percent < 100) {
      this.remove_progressPoll();
      if (keepState !== true) {
          this.set_percent(100);
      }
    }
  }

  has_progressPoll(): boolean {
    return this.progressPoll;
  }

  has_total(): boolean {
    return (this.get_total() !== null);
  }

  is_complete(): boolean {
    return this.is_success() || this.is_warning() || this.is_error();
  }

  is_success(): boolean {
    return this.$element.hasClass(this.settings.className.success);
  }

  is_warning(): boolean {
    return this.$element.hasClass(this.settings.className.warning);
  }

  is_error(): boolean {
    return this.$element.hasClass(this.settings.className.error);
  }

  is_active(): boolean {
    return this.$element.hasClass(this.settings.className.active);
  }

  is_visible(): boolean {
    return this.$element.is('.visible');
  }

  // gets current displayed percentage (if animating values this is the intermediary value)
  get_displayPercent(index): number {
    let
      $bar           = $(this.$bars[index]),
      barWidth       = $bar.width(),
      totalWidth     = this.$element.width(),
      minDisplay     = parseInt($bar.css('min-width'), 10),
      displayPercent = (barWidth > minDisplay)
        ? (barWidth / totalWidth * 100)
        : this.percent
    ;
    return (this.settings.precision > 0)
      ? Math.round(displayPercent * (10 * this.settings.precision)) / (10 * this.settings.precision)
      : Math.round(displayPercent)
    ;
  }

  get_normalizedValue(value): number {
    if (value < 0) {
      this.debug('Value cannot decrement below 0');
      return 0;
    }
    if (this.has_total()) {
      if (value > this.total) {
        this.debug('Value cannot increment above total', this.total);
        return this.total;
      }
    }
    else if (value > 100 ) {
      this.debug('Value cannot increment above 100 percent');
      return 100;
    }
    return value;
  }

  get_numericValue(value): number {
    return (typeof value === 'string')
      ? (value.replace(/[^\d.]/g, '') !== '')
        ? +(value.replace(/[^\d.]/g, ''))
        : false
      : value
    ;
  }

  get_percent(index = 0): number {
    return this.percent && this.percent[index || 0] || 0;
  }

  get_randomValue(): number {
    this.debug('Generating random increment percentage');
    return Math.floor((Math.random() * this.settings.random.max) + this.settings.random.min);
  }

  get_text(templateText, index = 0): string {
    let
      value   = this.get_value(index),
      total   = this.get_total(),
      percent = (this.animating)
        ? this.get_displayPercent(index)
        : this.get_percent(index),
      left = (total !== null)
        ? Math.max(0, total - value)
        : (100 - percent)
    ;
    templateText = templateText || '';
    templateText = templateText
      .replace('{value}', value)
      .replace('{total}', total || 0)
      .replace('{left}', left)
      .replace('{percent}', percent)
      .replace('{bar}', this.settings.text.bars[index] || '')
    ;
    this.verbose('Adding variables to progress bar text', templateText);
    return templateText;
  }

  get_total(): number {
    return this.total !== undefined ? this.total : null;
  }

  get_transitionEnd(): string {
    let
      element     = document.createElement('element'),
      transitions = {
        'transition'       :'transitionend',
        'OTransition'      :'oTransitionEnd',
        'MozTransition'    :'transitionend',
        'WebkitTransition' :'webkitTransitionEnd'
      },
      transition
    ;
    for (transition in transitions) {
      if (element.style[transition] !== undefined ) {
        return transitions[transition];
      }
    }
  }

  get_updateInterval() {
    if (this.settings.updateInterval == null) {
      return this.settings.duration;
    }
    return this.settings.updateInterval;
  }

  get_value(index = 0): number {
    return this.nextValue || this.value && this.value[index || 0] || 0;
  }

  set_active(text: string = this.settings.text.active): void {
    this.debug('Setting active state');
    if (this.settings.showActivity && !this.is_active() ) {
      this.$element.addClass(this.settings.className.active);
    }
    this.remove_warning();
    this.remove_error();
    this.remove_success();
    text = this.settings.onLabelUpdate.call('active', text, this.value, this.total);
    if (text) {
      this.set_label(text);
    }
    this.bind_transitionEnd(() => {
      this.settings.onActive.call('active').call(this.element, this.value, this.total);
    });
  }

  set_barLabel(text: string = ''): void {
    this.$progresses.map((index, element) => {
      let $progress = $(element);
      if (text !== undefined) {
        $progress.text( this.get_text(text, index) );
      }
      else if (this.settings.label == 'ratio' && this.has_total()) {
        this.verbose('Adding ratio to bar label');
        $progress.text( this.get_text(this.settings.text.ratio, index) );
      }
      else if (this.settings.label == 'percent') {
        this.verbose('Adding percentage to bar label');
        $progress.text( this.get_text(this.settings.text.percent, index) );
      }
    });
  }

  set_barWidth(values): void {
    this.debug("set bar width with ", values);
    values = this.helper_forceArray(values);
    let
      firstNonZeroIndex = -1,
      lastNonZeroIndex = -1,
      valuesSum = this.helper_sum(values),
      barCounts = this.$bars.length,
      isMultiple = barCounts > 1,
      percents = values.map((value, index) => {
        let
          allZero = (index === barCounts - 1 && valuesSum === 0),
          $bar = $(this.$bars[index])
        ;
        if (value === 0 && isMultiple && !allZero) {
          $bar.css('display', 'none');
        } else {
          if (isMultiple && allZero) {
            $bar.css('background', 'transparent');
          }
          if (firstNonZeroIndex == -1) {
            firstNonZeroIndex = index;
          }
          lastNonZeroIndex = index;
          $bar.css({
            display: 'block',
            width: value + '%'
          });
        }
        return parseFloat(value);
      })
    ;
    values.forEach((_, index) => {
      let $bar = $(this.$bars[index]);
      $bar.css({
        borderTopLeftRadius: index == firstNonZeroIndex ? '' : 0,
        borderBottomLeftRadius: index == firstNonZeroIndex ? '' : 0,
        borderTopRightRadius: index == lastNonZeroIndex ? '' : 0,
        borderBottomRightRadius: index == lastNonZeroIndex ? '' : 0
      });
    });
    this.$element.attr('data-percent', percents);
  }

  set_duration(duration: number = this.settings.duration): void {
    this.verbose('Setting progress bar transition duration', duration+ 'ms');
    this.$bars.css({ 'transition-duration':  duration+ 'ms' });
  }

  set_error(text: string = this.settings.text.error, keepState: boolean): void {
    this.debug('Setting error state');
    this.$element.addClass(this.settings.className.error);
    this.remove_active();
    this.remove_success();
    this.remove_warning();
    this.complete(keepState);
    text = this.settings.onLabelUpdate('error', text, this.value, this.total);
    if (text) {
      this.set_label(text);
    }
    this.bind_transitionEnd(() => {
      this.settings.onError.call(this.element, this.value, this.total);
    });
  }

  set_label(text: string = ''): void {
    if (text) {
      text = this.get_text(text);
      this.verbose('Setting label to text', text);
      this.$label.text(text);
    }
  }

  set_labelInterval(): void {
    let animationCallback = () => {
      this.verbose('Bar finished animating, removing continuous label updates');
      clearInterval(this.interval);
      this.animating = false;
      this.set_labels();
    };
    clearInterval(this.interval);
    this.bind_transitionEnd(animationCallback);
    this.animating = true;
    this.interval = setInterval(() => {

      let isInDOM;
      // let isInDOM = $.contains(document.documentElement, this.element);
      if (this.element instanceof Element) {
        isInDOM = document.documentElement !== this.element && document.documentElement.contains(this.element);
      } else {
        isInDOM = document.documentElement.contains(document.documentElement.querySelector(this.element));
      }
      if (!isInDOM) {
        clearInterval(this.interval);
        this.animating = false;
      }
      this.set_labels();
    }, this.settings.framerate);
  }

  set_labels(): void {
    this.verbose('Setting both bar progress and outer label text');
    this.set_barLabel();
    this.set_state();
  }

  set_nextValue(value): void {
    this.nextValue = value;
  }

  set_percent(percents): void {
    percents = this.helper_forceArray(percents).map((percent) => {
      percent = (typeof percent == 'string')
        ? +(percent.replace('%', ''))
        : percent
      ;
      return (this.settings.limitValues)
        ? Math.max(0, Math.min(100, percent))
        : percent
      ;
    });
    let
      hasTotal = this.has_total(),
      totalPercent = this.helper_sum(percents),
      isMultipleValues = percents.length > 1 && hasTotal,
      sumTotal = this.helper_sum(this.helper_forceArray(this.value))
    ;

    if (isMultipleValues && sumTotal > this.total) {
      // Sum values instead of pecents to avoid precision issues when summing floats
      this.error(this.settings.error.sumExceedsTotal, sumTotal, this.total);
    } else if (!isMultipleValues && totalPercent > 100) {
      // Sum before rounding since sum of rounded may have error though sum of actual is fine
      this.error(this.settings.error.tooHigh, totalPercent);
    } else if (totalPercent < 0) {
      this.error(this.settings.error.tooLow, totalPercent);
    } else {
      let autoPrecision = this.settings.precision > 0
        ? this.settings.precision
        : isMultipleValues
          ? this.helper_derivePrecision(Math.min.apply(null, this.value), this.total)
          : 0
      ;

      // round display percentage
      let roundedPercents = percents.map((percent) => {
        return (autoPrecision > 0)
          ? Math.round(percent * (10 * autoPrecision)) / (10 * autoPrecision)
          : Math.round(percent)
          ;
      });
      this.percent = roundedPercents;
      if (hasTotal) {
        this.value = percents.map((percent) => {
          return (autoPrecision > 0)
            ? Math.round((percent / 100) * this.total * (10 * autoPrecision)) / (10 * autoPrecision)
            : Math.round((percent / 100) * this.total * 10) / 10
            ;
        });
      }
      this.set_barWidth(percents);
      this.set_labelInterval();
    }
    this.settings.onChange.call(this.element, percents, this.value, this.total);
  }

  set_progress(value): void {
    if (!this.has_progressPoll()) {
      this.debug('First update in progress update interval, immediately updating', value);
      this.update_progress(value);
      this.create_progressPoll();
    }
    else {
      this.debug('Updated within interval, setting next update to use new value', value);
      this.set_nextValue(value);
    }
  }
  

  set_state(percent = this.helper_sum(this.percent)): void {
    if (percent === 100) {
      if (this.settings.autoSuccess && this.$bars.length === 1 && !(this.is_warning() || this.is_error() || this.is_success())) {
        this.set_success();
        this.debug('Automatically triggering success at 100%');
      }
      else {
        this.verbose('Reached 100% removing active state');
        this.remove_active();
        this.remove_progressPoll();
      }
    }
    else if (percent > 0) {
      this.verbose('Adjusting active progress bar label', percent);
      this.set_active();
    }
    else {
      this.remove_active();
      this.set_label(this.settings.text.active);
    }
  }

  set_success(text: string = this.settings.text.success || this.settings.text.active, keepState: boolean = false): void {
    this.debug('Setting success state');
    this.$element.addClass(this.settings.className.success);
    this.remove_active();
    this.remove_warning();
    this.remove_error();
    this.complete(keepState);
    if (this.settings.text.success) {
      text = this.settings.onLabelUpdate('success', text, this.value, this.total);
      this.set_label(text);
    }
    else {
      text = this.settings.onLabelUpdate('active', text, this.value, this.total);
      this.set_label(text);
    }
    this.bind_transitionEnd(() => {
      this.settings.onSuccess.call(this.element, this.total);
    });
  }

  set_total(totalValue): void {
    this.total = totalValue;
  }

  set_transitionEvent(): void {
    this.transitionEnd = this.get_transitionEnd();
  }

  set_value(value): void {
    this.value = this.helper_forceArray(value);
  }

  set_warning(text: string = this.settings.text.warning, keepState: boolean) {
    this.debug('Setting warning state');
    this.$element.addClass(this.settings.className.warning);
    this.remove_active();
    this.remove_success();
    this.remove_error();
    this.complete(keepState);
    text = this.settings.onLabelUpdate('warning', text, this.value, this.total);
    if (text) {
      this.set_label(text);
    }
    this.bind_transitionEnd(() => {
      this.settings.onWarning.call(this.element, this.value, this.total);
    });
  }

  update_progress(values): void {
    let hasTotal = this.has_total();
    if (hasTotal) {
      this.set_value(values);
    }
    let percentCompletes = this.helper_forceArray(values).map((value) => {
      let percentComplete;
      value = this.get_numericValue(value);
      if (value === false) {
        this.error(this.settings.error.nonNumeric, value);
      }
      value = this.get_normalizedValue(value);
      if (hasTotal) {
        percentComplete = this.total > 0 ? (value / this.total) * 100 : 100;
        this.debug('Calculating percent complete from total', percentComplete);
      }
      else {
        percentComplete = value;
        this.debug('Setting value to exact percentage value', percentComplete);
      }
      return percentComplete;
    });
    this.set_percent(percentCompletes);
  }

  update_toNextValue(): void {
    let nextValue = this.nextValue;
    if (nextValue) {
      this.debug('Update interval complete using last updated value', nextValue);
      this.update_progress(nextValue);
      this.remove_nextValue();
    }
  }

  remove_active(): void {
    this.verbose('Removing active state');
    this.$element.removeClass(this.settings.className.active);
  }

  remove_error(): void {
    this.verbose('Removing error state');
    this.$element.removeClass(this.settings.className.error);
  }

  remove_nextValue(): void {
    this.verbose('Removing progress value stored for next update');
    delete this.nextValue;
  }

  remove_progressPoll(): void {
    this.verbose('Removing progress poll timer');
    if (this.progressPoll) {
      clearTimeout(this.progressPoll);
      delete this.progressPoll;
    }
  }

  remove_state(): void {
    this.verbose('Removing stored state');
    delete this.total;
    delete this.percent;
    delete this.value;
  }

  remove_success(): void {
    this.verbose('Removing success state');
    this.$element.removeClass(this.settings.className.success);
  }

  remove_warning(): void {
    this.verbose('Removing warning state');
    this.$element.removeClass(this.settings.className.warning);
  }

  /**
   * Derive precision for multiple progress with total and values.
   *
   * This helper dervices a precision that is sufficiently large to show minimum value of multiple progress.
   *
   * Example1
   * - total: 1122
   * - values: [325, 111, 74, 612]
   * - min ratio: 74/1122 = 0.0659...
   * - required precision:  100
   *
   * Example2
   * - total: 10541
   * - values: [3235, 1111, 74, 6121]
   * - min ratio: 74/10541 = 0.0070...
   * - required precision:   1000
   *
   * @param min A minimum value within multiple values
   * @param total A total amount of multiple values
   * @returns {number} A precison. Could be 1, 10, 100, ... 1e+10.
   */
  helper_derivePrecision(min, total): number {
    let
      precisionPower = 0,
      precision = 1,
      ratio = min / total
    ;
    while (precisionPower < 10) {
      ratio = ratio * precision;
      if (ratio > 1) {
        break;
      }
      precision = Math.pow(10, precisionPower++);
    }
    return precision;
  }

  helper_forceArray(element) {
    return Array.isArray(element)
      ? element
      : !isNaN(element)
        ? [element]
        : typeof element == 'string'
          ? element.split(',')
          : []
    ;
  }

  helper_sum(nums): number {
    return Array.isArray(nums) ? nums.reduce((left, right) => {
      return left + Number(right);
    }, 0) : 0;
  }
}
  