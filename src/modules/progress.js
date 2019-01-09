"use strict";

import Module from '../module'

import $ from 'cash-dom';

const settings = {
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
  
    updateInterval : 'auto',
  
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
        method     : 'The method you called is not defined.',
        nonNumeric : 'Progress value is non numeric',
        tooHigh    : 'Value specified is above 100%',
        tooLow     : 'Value specified is below 0%'
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
        active  : false,
        error   : false,
        success : false,
        warning : false,
        percent : '{percent}%',
        ratio   : '{value} of {total}'
    },
  
    className : {
        active  : 'active',
        error   : 'error',
        success : 'success',
        warning : 'warning'
    },

    events: ['labelupdate', 'change', 'active', 'warning', 'error', 'success']
}

export class Progress extends Module {
    constructor(selector, parameters) {
        super(selector, parameters, settings);

        this.$bar = this.$element.find(this.settings.selector.bar);
        this.$progress = this.$element.find(this.settings.selector.progress);
        this.$label = this.$element.find(this.settings.selector.label);

        this.animating = false;
        this.transitionEnd = false,
        
        this.initialize()
    }

    initialize() {
        this.verbose('Initializing progress module', this.settings);

        this.set_duration();
        this.set_transitionEvent();

        this.read_metadata();
        this.read_settings();

        this.instantiate();
    }

    instantiate() {
        this.verbose('Instantiating module', this.settings);
        this.$element.data(this.moduleNamespace, this);
    }

    destroy() {
        this.verbose('Destroying previous instance', this);
        clearInterval(this.interval);
        this.remove_state();
        this.$element.removeData(this.moduleNamespace);
    }

    complete() {
        if(this.percent === undefined || this.percent < 100) {
            this.remove_progressPoll();
            this.set_percent(100);
        }
    }

    increment(incrementValue) {
        var
            startValue,
            newValue
        ;
        if (this.has_total()) {
            startValue     = this.get_value();
            incrementValue = incrementValue || 1;
            newValue       = startValue + incrementValue;
        } else {
            startValue     = this.get_percent();
            incrementValue = incrementValue || this.get_randomValue();

            newValue       = startValue + incrementValue;
            this.debug('Incrementing percentage by', startValue, newValue);
        }
        newValue = this.get_normalizedValue(newValue);
        this.set_progress(newValue);
    }

    decrement(decrementValue) {
        var
            startValue,
            newValue
        ;
        if (this.has_total()) {
            startValue     =  this.get_value();
            decrementValue =  decrementValue || 1;
            newValue       =  startValue - decrementValue;
            this.debug('Decrementing value by', decrementValue, startValue);
        } else {
            startValue     =  this.get_percent();
            decrementValue =  decrementValue || this.get_randomValue();
            newValue       =  startValue - decrementValue;
            this.debug('Decrementing percentage by', decrementValue, startValue);
        }
        newValue = this.get_normalizedValue(newValue);
        this.set_progress(newValue);
    }

    reset() {
        this.remove_nextValue();
        this.update_progress(0);
    }
    
    bind_transitionEnd(callback) {
        var
            transitionEnd = this.get_transitionEnd(),
            module = this
        ;
        this.$bar.one(transitionEnd + this.eventNamespace, function(event) {
            clearTimeout(module.failSafeTimer);
            callback.call(module, event);
        });
        this.failSafeTimer = setTimeout(function() {
            module.$bar.trigger(transitionEnd);
        }, this.settings.duration + this.settings.failSafeDelay);
        this.verbose('Adding fail safe timer', this.timer);
    }

    get_displayPercent() {
        // gets current displayed percentage (if animating values this is the intermediary value)
        var
            barWidth       = this.$bar.width(),
            totalWidth     = this.$element.width(),
            minDisplay     = parseInt(this.$bar.css('min-width'), 10),
            displayPercent = (barWidth > minDisplay)
                ? (barWidth / totalWidth * 100)
                : this.percent
        ;
        return (this.settings.precision > 0)
            ? Math.round(displayPercent * (10 * this.settings.precision)) / (10 * this.settings.precision)
            : Math.round(displayPercent)
        ;
    }

    get_normalizedValue(value) {
        if (value < 0) {
            this.debug('Value cannot decrement below 0');
            return 0;
        }
        if (this.has_total()) {
            if (value > this.total) {
                this.debug('Value cannot increment above total', this.total);
                return this.total;
            }
        } else if (value > 100) {
            this.debug('Value cannot increment above 100 percent');
            return 100;
        }
        return value;
    }

    get_numericValue(value) {
        return (typeof value === 'string')
            ? (value.replace(/[^\d.]/g, '') !== '')
                ? +(value.replace(/[^\d.]/g, ''))
                : false
            : value
        ;
    }

    get_percent() {
        return this.percent || 0;
    }

    get_randomValue() {
        this.debug('Generating random increment percentage');
        return Math.floor((Math.random() * this.settings.random.max) + this.settings.random.min);
    }

    get_text(templateText) {
        var
            value   = this.value || 0,
            total   = this.total || 0,
            percent = (this.animating)
                ? this.get_displayPercent()
                : this.percent || 0,
            left = (this.total > 0)
                ? (total - value)
                : (100 - percent)
        ;
        templateText = templateText || '';
        templateText = templateText
            .replace('{value}', value)
            .replace('{total}', total)
            .replace('{left}', left)
            .replace('{percent}', percent)
        ;
        this.verbose('Adding variables to progress bar text', templateText);
        return templateText;
    }

    get_total() {
        return this.total || false;
    }

    get_transitionEnd() {
        var
            element     = document.createElement('element'),
            transitions = {
            'transition'       :'transitionend',
            'OTransition'      :'oTransitionEnd',
            'MozTransition'    :'transitionend',
            'WebkitTransition' :'webkitTransitionEnd'
            },
            transition
        ;
        for (transition in transitions){
            if (element.style[transition] !== undefined) {
                return transitions[transition];
            }
        }
    }

    get_updateInterval() {
        if (this.settings.updateInterval == 'auto') {
            return this.settings.duration;
          }
          return this.settings.updateInterval;
    }

    get_value() {
        return this.nextValue || this.value || 0;
    }

    set_active(text) {
        text = text || this.settings.text.active;
        this.debug('Setting active state');
        if(this.settings.showActivity && !this.is_active() ) {
            this.$element.addClass(this.settings.className.active);
        }
        this.remove_warning();
        this.remove_error();
        this.remove_success();
        text = this.invokeCallback('labelupdate', 'active', text, this.value, this.total);
        if (text) {
            this.set_label(text);
        }
        this.bind_transitionEnd(function() {
            this.invokeCallback('active', this.element, this.value, this.total);
        });
    }

    set_barLabel(text) {
        if(text !== undefined) {
            this.$progress.text( this.get_text(text) );
        } else if(this.settings.label == 'ratio' && this.total) {
            this.verbose('Adding ratio to bar label');
            this.$progress.text( this.get_text(this.settings.text.ratio) );
        } else if(this.settings.label == 'percent') {
            this.verbose('Adding percentage to bar label');
            this.$progress.text( this.get_text(this.settings.text.percent) );
        }
    }

    set_barWidth(value) {
        if(value > 100) {
            this.error(this.settings.error.tooHigh, value);
        } else if (value < 0) {
            this.error(this.settings.error.tooLow, value);
        } else {
            this.$bar.css('width', value + '%');
            this.$element.attr('data-percent', parseInt(value, 10));
        }
    }

    set_duration(duration) {
        duration = duration || this.settings.duration;
        duration = (typeof duration == 'number')
            ? duration + 'ms'
            : duration
        ;
        this.verbose('Setting progress bar transition duration', duration);
        this.$bar.css({ 'transition-duration': duration });
    }

    set_error(text) {
        text = text || this.settings.text.error;
        this.debug('Setting error state');
        this.$element.addClass(this.settings.className.error);
        this.remove_active();
        this.remove_success();
        this.remove_warning();
        this.complete();
        text = this.invokeCallback('labelupdate', 'error', text, this.value, this.total)
        if (text) {
            this.set_label(text);
        }
        this.bind_transitionEnd(function() {
            this.invokeCallback('error', this.element, this.value, this.total)
        });
    }

    set_label(text) {
        text = text || '';
        if (text) {
            text = this.get_text(text);
            this.verbose('Setting label to text', text);
            this.$label.text(text);
        }
    }

    set_labelInterval() {
        var
            animationCallback = function() {
                this.verbose('Bar finished animating, removing continuous label updates');
                clearInterval(this.interval);
                this.animating = false;
                this.set_labels();
            },
            module = this
        ;
        clearInterval(this.interval);
        this.bind_transitionEnd(animationCallback);
        this.animating = true;
        this.interval = setInterval(function() {
            var
                isInDOM = document.documentElement !== module.element && document.documentElement.contains(module.element)
            ;
            if(!isInDOM) {
                clearInterval(module.interval);
                module.animating = false;
            }
            module.set_labels();
        }, this.settings.framerate);
    }

    set_labels() {
        this.verbose('Setting both bar progress and outer label text');
        this.set_barLabel();
        this.set_state();
    }

    set_nextValue(value) {
        this.nextValue = value;
    }

    set_percent(percent) {
        percent = (typeof percent == 'string')
            ? +(percent.replace('%', ''))
            : percent
        ;
        // round display percentage
        percent = (this.settings.precision > 0)
            ? Math.round(percent * (10 * this.settings.precision)) / (10 * this.settings.precision)
            : Math.round(percent)
        ;
        this.percent = percent;
        if(!this.has_total()) {
            this.value = (this.settings.precision > 0)
            ? Math.round( (percent / 100) * this.total * (10 * this.settings.precision)) / (10 * this.settings.precision)
            : Math.round( (percent / 100) * this.total * 10) / 10
            ;
            if (this.settings.limitValues) {
                this.value = (this.value > 100)
                    ? 100
                    : (this.value < 0)
                        ? 0
                        : this.value
                ;
            }
        }
        this.set_barWidth(percent);
        this.set_labelInterval();
        this.set_labels();
        this.invokeCallback('change', this.element, percent, this.value, this.total);
    }

    set_progress(value) {
        if (!this.has_progressPoll()) {
            this.debug('First update in progress update interval, immediately updating', value);
            this.update_progress(value);
            this.create_progressPoll();
        } else {
            this.debug('Updated within interval, setting next update to use new value', value);
            this.set_nextValue(value);
        }
    }

    set_state(percent) {
        percent = (percent !== undefined)
            ? percent
            : this.percent
        ;
        if (percent === 100) {
            if(this.settings.autoSuccess && !(this.is_warning() || this.is_error() || this.is_success())) {
                this.set_success();
                this.debug('Automatically triggering success at 100%');
            }
            else {
                this.verbose('Reached 100% removing active state');
                this.remove_active();
                this.remove_progressPoll();
            }
        }
        else if(percent > 0) {
            this.verbose('Adjusting active progress bar label', percent);
            this.set_active();
        }
        else {
            this.remove_active();
            this.set_label(this.settings.text.active);
        }
    }

    set_transitionEvent () {
        this.transitionEnd = this.get_transitionEnd();
    }

    set_total(totalValue) {
        this.total = totalValue;
    }

    set_success(text) {
        text = text || this.settings.text.success || this.settings.text.active;
        this.debug('Setting success state');
        this.$element.addClass(this.settings.className.success);
        this.remove_active();
        this.remove_warning();
        this.remove_error();
        this.complete();
        if(this.settings.text.success) {
            text = this.invokeCallback('labelupdate', 'success', text, this.value, this.total)
            this.set_label(text);
        } else {
            text = this.invokeCallback('active', 'success', text, this.value, this.total)
            this.set_label(text);
        }
        this.bind_transitionEnd(function() {
            this.invokeCallback('success', this.element, this.value, this.total)
        });
    }

    set_value(value) {
        this.value = value;
    }

    set_warning (text) {
        text = text || this.settings.text.warning;
        this.debug('Setting warning state');
        this.$element.addClass(this.settings.className.warning);
        this.remove_active();
        this.remove_success();
        this.remove_error();
        this.complete();
        text = this.invokeCallback('labelupdate', 'warning', text, this.value, this.total)
        if (text) {
            this.set_label(text);
        }
        this.bind_transitionEnd(function() {
            this.invokeCallback('warning', this.element, this.value, this.total)
        });
    }

    has_progressPoll() {
        return this.progressPoll;
    }

    has_total() {
        return (this.get_total() !== false);
    }

    is_active() {
        return this.$element.hasClass(this.settings.className.active);
    }

    is_complete() {
        return this.is_success() || this.is_warning() || this.is_error();
    }

    is_error() {
        return this.$element.hasClass(this.settings.className.error);
    }

    is_success() {
        return this.$element.hasClass(this.settings.className.success);
    }

    is_warning() {
        return this.$element.hasClass(this.settings.className.warning);
    }

    read_metadata() {
        var data = {
            percent : this.$element.data(this.settings.metadata.percent),
            total   : this.$element.data(this.settings.metadata.total),
            value   : this.$element.data(this.settings.metadata.value)
        };
        if(data.percent) {
            this.debug('Current percent value set from metadata', data.percent);
            this.set_percent(data.percent);
        }
        if(data.total) {
            this.debug('Total value set from metadata', data.total);
            this.set_total(data.total);
        }
        if(data.value) {
            this.debug('Current value set from metadata', data.value);
            this.set_value(data.value);
            this.set_progress(data.value);
        }
    }

    read_settings() {
        if(this.settings.total !== false) {
            this.debug('Current total set in settings', this.settings.total);
            this.set.total(this.settings.total);
        }
        if(this.settings.value !== false) {
            this.debug('Current value set in settings', this.settings.value);
            this.set.value(this.settings.value);
            this.set.progress(this.value);
        }
        if(this.settings.percent !== false) {
            this.debug('Current percent set in settings', this.settings.percent);
            this.set.percent(this.settings.percent);
        }
    }

    create_progressPoll() {
        var module = this;
        this.progressPoll = setTimeout(function() {
            module.update_toNextValue();
            module.remove_progressPoll();
        }, this.get_updateInterval());
    }

    remove_active() {
        this.verbose('Removing active state');
        this.$element.removeClass(this.settings.className.active);
    }

    remove_error() {
        this.verbose('Removing error state');
        this.$element.removeClass(this.settings.className.error);
    }

    remove_success() {
        this.verbose('Removing success state');
        this.$element.removeClass(this.settings.className.success);
    }

    remove_warning() {
        this.verbose('Removing warning state');
        this.$element.removeClass(this.settings.className.warning);
    }

    remove_nextValue() {
        this.verbose('Removing progress value stored for next update');
        delete this.nextValue;
    }

    remove_progressPoll() {
        this.verbose('Removing progress poll timer');
        if(this.progressPoll) {
            clearTimeout(this.progressPoll);
            delete this.progressPoll;
        }
    }

    remove_state() {
        this.verbose('Removing stored state');
        delete this.total;
        delete this.percent;
        delete this.value;
    }

    update_progress(value) {
        var
            percentComplete
        ;
        value = this.get_numericValue(value);
        if (value === false) {
            this.error(this.settings.error.nonNumeric, value);
        }
        value = this.get_normalizedValue(value);
        if (this.has_total()) {
            this.set_value(value);
            percentComplete = (value / this.total) * 100;
            this.debug('Calculating percent complete from total', percentComplete);
            this.set_percent(percentComplete);
        }
        else {
            percentComplete = value;
            this.debug('Setting value to exact percentage value', percentComplete);
            this.set_percent( percentComplete );
        }
    }

    update_toNextValue() {
        if (this.nextValue) {
            this.debug('Update interval complete using last updated value', this.nextValue);
            this.update_progress(this.nextValue);
            this.remove_nextValue();
        }
    }
}
