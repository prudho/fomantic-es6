"use strict";

import Module from '../module'

import $ from 'cash-dom';

const 
    alphabet        = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    SINGLE_STEP     = 1,
    BIG_STEP        = 2,
    NO_STEP         = 0,
    SINGLE_BACKSTEP = -1,
    BIG_BACKSTEP    = -2
;

const settings = {
    silent       : false,
    debug        : false,
    verbose      : false,
    performance  : true,

    name         : 'Slider',
    namespace    : 'slider',

    error    : {
        method    : 'The method you called is not defined.',
        notrange : 'This slider is not a range slider'
    },

    metadata: {
        thumbVal        : 'thumbVal',
        secondThumbVal  : 'secondThumbVal'
    },

    min            : 0,
    max            : 20,
    step           : 1,
    start          : 0,
    end            : 20,
    labelType      : 'number',
    showLabelTicks : false,
    smooth         : false,

    //the decimal place to round to if step is undefined
    decimalPlaces  : 2,

    // page up/down multiplier. How many more times the steps to take on page up/down press
    pageMultiplier : 2,

    selector: {

    },

    className     : {
        reversed : 'reversed',
        disabled : 'disabled',
        labeled  : 'labeled',
        ticked   : 'ticked',
        vertical : 'vertical',
        range    : 'range',
        smooth   : 'smooth'
    },

    keys : {
        pageUp     : 33,
        pageDown   : 34,
        leftArrow  : 37,
        upArrow    : 38,
        rightArrow : 39,
        downArrow  : 40
    },

    labelTypes    : {
        number  : 'number',
        letter  : 'letter'
    },

    events: ['Change', 'Move']
}

export class Slider extends Module {
    constructor(selector, parameters) {
        super(selector, parameters, settings);

        this.$icons = $(this.settings.selector.icon);

        this.isHover = false;
        
        this.initialize()
    }

    initialize() {
        this.verbose('Initializing slider module', this.settings);

        this.create_id();

        this.isTouch = this.setup_testOutTouch();
        this.setup_layout();
        this.setup_labels();

        if (!this.is_disabled()) {
            this.bind_events();
        }

        this.read_metadata();
        this.read_settings();

        this.instantiate();
    }

    instantiate() {
        this.verbose('Instantiating module', this.settings);
        this.instance = this; // FIXME
        this.$element.data(this.moduleNamespace, this);
    }

    destroy() {
        this.verbose('Destroying previous instance', this.instance);
        this.unbind_events();
        this.unbind_slidingEvents();
        this.$element.removeData(this.moduleNamespace);
    }

    create_id() {
        this.id = (Math.random().toString(16) + '000000000').substr(2, 8);
        this.elementNamespace = '.' + this.id;
        this.verbose('Creating unique id for element', this.id);
    }

    setup_testOutTouch() {
        try {
            document.createEvent('TouchEvent');
            return true;
        } catch (e) {
            return false;
        }
    }

    setup_labels() {
        if (this.is_labeled()) {
            this.$labels = this.$element.find('.labels:not(.auto)');
            if (this.$labels.length != 0) {
                this.setup_customLabel();
            } else {
                this.setup_autoLabel();
            }

            if (this.settings.showLabelTicks) {
                this.$element.addClass(this.settings.className.ticked)
            }
          }
    }

    setup_autoLabel() {
        if (this.get_step() != 0) {
            this.$labels = this.$element.find('.labels');
            if (this.$labels.length != 0) {
                this.$labels.empty();
            } else {
                this.$labels = this.$element.append('<ul class="auto labels"></ul>').find('.labels');
            }
            for (var i = 0, len = this.get_numLabels(); i <= len; i++) {
              var
                labelText = this.get_label(i),
                $label = (labelText !== "") ? $('<li class="label">' + labelText + '</li>') : null,
                ratio  = i / len
              ;
              if ($label) {
                this.update_labelPosition(ratio, $label);
                this.$labels.append($label);
              }
            }
          }
    }

    setup_customLabel() {
        var
            $children   = this.$labels.find('.label'),
            numChildren = $children.length,
            min         = this.get_min(),
            max         = this.get_max(),
            module = this,
            ratio
        ;
        $children.each(function(index) {
            var
                $child = $(this),
                attrValue = $child.attr('data-value')
            ;
            if (attrValue) {
                attrValue = attrValue > max ? max : attrValue < min ? min : attrValue;
                ratio = (attrValue - min) / (max - min);
            } else {
                ratio = (index + 1) / (numChildren + 1);
            }
            module.update_labelPosition(ratio, $(this));
        });
    }

    setup_layout() {
        if (this.$element.attr('tabindex') === undefined) {
            this.$element.attr('tabindex', 0);
        }
        if (this.$element.find('.inner').length == 0) {
            this.$element.append(
                "<div class='inner'>"
                + "<div class='track'></div>"
                + "<div class='track-fill'></div>"
                + "<div class='thumb'></div>"
                + "</div>"
            );
        }
        this.precision = this.get_precision();
        this.$thumb = this.$element.find('.thumb:not(.second)');
        this.$currThumb = this.$thumb;
        if (this.is_range()) {
            if (this.$element.find('.thumb.second').length == 0) {
                this.$element.find('.inner').append("<div class='thumb second'></div>");
            }
            this.$secondThumb = this.$element.find('.thumb.second');
        }
        this.$track = this.$element.find('.track');
        this.$trackFill = this.$element.find('.track-fill');
        this.offset = this.$thumb.width() / 2;
    }

    bind_events() {
        this.bind_globalKeyboardEvents();
        this.bind_keyboardEvents();
        this.bind_mouseEvents();
        if (this.isTouch) {
            this.bind_touchEvents();
        }
    }

    bind_globalKeyboardEvents() {
        $(document).on('keydown' + this.eventNamespace, this.event_activateFocus.bind(this));
    }

    bind_keyboardEvents() {
        this.verbose('Binding keyboard events');
        this.$element.on('keydown' + this.eventNamespace, this.event_keydown.bind(this));
    }

    bind_mouseEvents() {
        this.verbose('Binding mouse events');
        this.$element.find('.track, .thumb, .inner').on('mousedown' + this.eventNamespace, function(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
            this.event_down(event);
        }.bind(this));
        this.$element.on('mousedown' + this.eventNamespace, this.event_down.bind(this));
        this.$element.on('mouseenter' + this.eventNamespace, function(event) {
            this.isHover = true;
        }.bind(this));
        this.$element.on('mouseleave' + this.eventNamespace, function(event) {
            this.isHover = false;
        }.bind(this));
    }

    bind_slidingEvents() {
        // these don't need the identifier because we only ever want one of them to be registered with document
        this.verbose('Binding page wide events while handle is being draged');
        if (this.isTouch) {
            $(document).on('touchmove' + this.eventNamespace, this.event_move.bind(this));
            $(document).on('touchend' + this.eventNamespace, this.event_up.bind(this));
        } else {
            $(document).on('mousemove' + this.eventNamespace, this.event_move.bind(this));
            $(document).on('mouseup' + this.eventNamespace, this.event_up.bind(this));
        }
    }

    bind_touchEvents() {
        module.verbose('Binding touch events');
        this.$element.find('.track, .thumb, .inner').on('touchstart' + this.eventNamespace, function(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
            this.event_down(event);
        }.bind(this));
        this.$element.on('touchstart' + this.eventNamespace, this.event_down.bind(this));
    }

    unbind_events() {
        this.$element.find('.track, .thumb, .inner').off('mousedown' + this.eventNamespace);
        this.$element.find('.track, .thumb, .inner').off('touchstart' + this.eventNamespace);
        this.$element.off('mousedown' + this.eventNamespace);
        this.$element.off('mouseenter' + this.eventNamespace);
        this.$element.off('mouseleave' + this.eventNamespace);
        this.$element.off('touchstart' + this.eventNamespace);
        this.$element.off('keydown' + this.eventNamespace);
        this.$element.off('focusout' + this.eventNamespace);
        $(document).off('keydown' + this.eventNamespace);
    }

    unbind_slidingEvents() {
        if (this.isTouch) {
            $(document).off('touchmove' + this.eventNamespace);
            $(document).off('touchend' + this.eventNamespace);
          } else {
            $(document).off('mousemove' + this.eventNamespace);
            $(document).off('mouseup' + this.eventNamespace);
          }
    }

    event_activateFocus(event) {
        if (!this.is_focused() && this.isHover && this.determine_keyMovement(event) != NO_STEP) {
            event.preventDefault();
            this.event_keydown(event, true);
            //this.$element.focus(); DAMN
          }
    }

    event_keydown(event, first) {
        if (this.is_focused()) {
            $(document).trigger(event);
        }
        if (first || this.is_focused()) {
            var step = this.determine_keyMovement(event);
            if (step != NO_STEP) {
                event.preventDefault();
                switch(step) {
                    case SINGLE_STEP:
                        this.takeStep();
                        break;
                    case BIG_STEP:
                        this.takeStep(this.get_multiplier());
                        break;
                    case SINGLE_BACKSTEP:
                        this.backStep();
                        break;
                    case BIG_BACKSTEP:
                        this.backStep(this.get_multiplier());
                        break;
                }
            }
        }
    }

    event_move(event, originalEvent) {
        event.preventDefault();
        var value = this.determine_valueFromEvent(event, originalEvent);
        if (this.get_step() == 0 || this.is_smooth()) {
            var
                thumbVal = this.thumbVal,
                secondThumbVal = this.secondThumbVal,
                thumbSmoothVal = this.determine_smoothValueFromEvent(event, originalEvent)
            ;
            if (!this.$currThumb.hasClass('second')) {
                thumbVal = value;
            } else {
                secondThumbVal = value;
            }
            value = Math.abs(thumbVal - (secondThumbVal || 0));
            this.update_position(thumbSmoothVal);
            this.invokeCallback("Move").call(this.element, value, thumbVal, secondThumbVal);
        } else {
            this.update_value(value, function(value, thumbVal, secondThumbVal) {
                this.invokeCallback("Move").call(this.element, value, thumbVal, secondThumbVal);
            }.bind(this));
        }
    }

    event_up(event, originalEvent) {
        event.preventDefault();
        var value = this.determine_valueFromEvent(event, originalEvent);
        this.set_value(value);
        this.unbind_slidingEvents();
    }

    event_down(event, originalEvent) {
        event.preventDefault();
        if (this.is_range()) {
            var
                eventPos = this.determine_eventPos(event, originalEvent),
                newPos = this.determine_pos(eventPos)
            ;
            this.$currThumb = this.determine_closestThumb(newPos);
        }
        if (!this.is_disabled()) {
            this.bind_slidingEvents();
        }
    }

    read_metadata() {
        var data = {
            thumbVal        : this.$element.data(this.settings.metadata.thumbVal),
            secondThumbVal  : this.$element.data(this.settings.metadata.secondThumbVal)
        };
        if (data.thumbVal) {
            if (this.is_range() && data.secondThumbVal) {
                this.debug('Current value set from metadata', data.thumbVal, data.secondThumbVal);
                this.set_rangeValue(data.thumbVal, data.secondThumbVal);
            } else {
                this.debug('Current value set from metadata', data.thumbVal);
                this.set_value(data.thumbVal);
            }
        }
    }

    read_settings() {
        if (this.settings.start !== false) {
            if (this.is_range()) {
                this.debug('Start position set from settings', this.settings.start, this.settings.end);
                this.set_rangeValue(this.settings.start, this.settings.end);
            } else {
                this.debug('Start position set from settings', this.settings.start);
                this.set_value(this.settings.start);
            }
        }
    }

    backStep(multiplier) {
        var
            multiplier = multiplier != undefined ? multiplier : 1,
            step = this.get_step(),
            currValue = this.get_currentThumbValue()
        ;
        this.verbose('Going back a step');
        if(step > 0) {
            this.set_value(currValue - step * multiplier);
        } else if (step == 0) {
            var
                precision = this.get_precision(),
                newValue = currValue - (multiplier/precision)
            ;
            this.set_value(Math.round(newValue * precision) / precision);
        }
    }

    takeStep(multiplier) {
        var
            multiplier = multiplier != undefined ? multiplier : 1,
            step = this.get_step(),
            currValue = this.get_currentThumbValue()
        ;
        this.verbose('Taking a step');
        if (step > 0) {
            this.set_value(currValue + step * multiplier);
        } else if (step == 0){
            var
                precision = this.get_precision(),
                newValue = currValue + (multiplier/precision)
            ;
            this.set_value(Math.round(newValue * precision) / precision);
        }
    }

    get_currentThumbValue() {
        return this.$currThumb.hasClass('second') ? this.secondThumbVal : this.thumbVal;
    }

    get_label(value) {
        if (this.interpretLabel) {
            return interpretLabel(value);
        }

        switch (this.settings.labelType) {
            case this.settings.labelTypes.number:
                return (value * this.get_step()) + this.get_min();
            case this.settings.labelTypes.letter:
                return alphabet[(value) % 26];
            default:
                return value;
        }
    }

    get_max() {
        return this.settings.max;
    }

    get_min() {
        return this.settings.min;
    }

    get_multiplier() {
        return this.settings.pageMultiplier;
    }

    get_numLabels() {
        var value = Math.round((this.get_max() - this.get_min()) / this.get_step());
        this.debug('Determined that their should be ' + value + ' labels');
        return value;
    }

    get_precision() {
        var
            decimalPlaces,
            step = this.get_step()
        ;
        if (step != 0) {
            var split = String(step).split('.');
            if (split.length == 2) {
                decimalPlaces = split[1].length;
            } else {
                decimalPlaces = 0;
            }
        } else {
            decimalPlaces = this.settings.decimalPlaces;
        }
        var precision = Math.pow(10, decimalPlaces);
        this.debug('Precision determined', precision);
        return precision;
    }

    get_step() {
        return this.settings.step;
    }

    get_trackEndMargin() {
        var margin;
        if (this.is_vertical()) {
            margin = this.is_reversed() ? this.$element.css('padding-top') : this.$element.css('padding-bottom');
        } else {
            margin = this.is_reversed() ? this.$element.css('padding-left') : this.$element.css('padding-right');
        }
        return margin || '0px';
    }

    get_trackLeft() {
        if (this.is_vertical()) {
            return this.$track.position().top;
        } else {
            return this.$track.position().left;
        }
    }

    get_trackLength() {
        if (this.is_vertical()) {
            return this.$track.height();
        } else {
            return this.$track.width();
        }
    }

    get_trackOffset() {
        if (this.is_vertical()) {
            return this.$track.offset().top;
        } else {
            return this.$track.offset().left;
        }
    }

    get_trackStartMargin() {
        var margin;
        if (this.is_vertical()) {
            margin = this.is_reversed() ? this.$element.css('padding-bottom') : this.$element.css('padding-top');
        } else {
            margin = this.is_reversed() ? this.$element.css('padding-right') : this.$element.css('padding-left');
        }
        return margin || '0px';
    }

    get_trackStartPos() {
        return this.is_reversed() ? this.get_trackLeft() + this.get_trackLength() : this.get_trackLeft();
    }

    get_trackEndPos() {
        return this.is_reversed() ? this.get_trackLeft() : this.get_trackLeft() + this.get_trackLength();
    }

    set_rangeValue(first, second) {
        if (this.is_range()) {
            var
                min = this.get_min(),
                max = this.get_max()
            ;
            if (first <= min) {
                first = min;
            } else if(first >= max) {
                first = max;
            }
            if (second <= min) {
                second = min;
            } else if(second >= max) {
                second = max;
            }
            this.thumbVal = first;
            this.secondThumbVal = second;
            this.value = Math.abs(this.thumbVal - this.secondThumbVal);
            this.update_position(this.thumbVal, this.$thumb);
            this.update_position(this.secondThumbVal, this.$secondThumb);
            this.invokeCallback('Change').call(this.element, this.value, this.thumbVal, this.secondThumbVal);
            this.invokeCallback('Move').call(this.element, this.value, this.thumbVal, this.secondThumbVal);
        } else {
            this.error(error.notrange);
        }
    }

    set_value(newValue) {
        this.update_value(newValue, function(value, thumbVal, secondThumbVal) {
            this.invokeCallback('Change').call(this.element, value, thumbVal, secondThumbVal);
            this.invokeCallback('Move').call(this.element, value, thumbVal, secondThumbVal);
        }.bind(this));
    }

    update_labelPosition(ratio, $label) {
        var
            startMargin = this.get_trackStartMargin(),
            endMargin   = this.get_trackEndMargin(),
            posDir =
                this.is_vertical()
                ?
                this.is_reversed() ? 'bottom' : 'top'
                :
                    this.is_reversed() ? 'right' : 'left',
            startMarginMod = this.is_reversed() && !this.is_vertical() ? ' - ' : ' + '
        ;
        var position = '(100% - ' + startMargin + ' - ' + endMargin + ') * ' + ratio;
        $label.css(posDir, 'calc(' + position + startMarginMod + startMargin + ')');
    }

    update_position(newValue, $element) {
        var
            newPos = this.handleNewValuePosition(newValue),
            $targetThumb = $element != undefined ? $element : this.$currThumb,
            thumbVal = this.thumbVal || this.get_min(),
            secondThumbVal = this.secondThumbVal || this.get_min()
        ;
        if (this.is_range()) {
            if(!$targetThumb.hasClass('second')) {
                this.position = newPos;
                thumbVal = newValue;
            } else {
                this.secondPos = newPos;
                secondThumbVal = newValue;
            }
        } else {
            this.position = newPos;
            thumbVal = newValue;
        }
        var
            trackPosValue,
            thumbPosValue,
            min = this.get_min(),
            max = this.get_max(),
            thumbPosPercent = 100 * (newValue - min) / (max - min),
            trackStartPosPercent = 100 * (Math.min(thumbVal, secondThumbVal) - min) / (max - min),
            trackEndPosPercent = 100 * (1 - (Math.max(thumbVal, secondThumbVal) - min) / (max - min))
        ;
        if (this.is_vertical()) {
            if (this.is_reversed()) {
                thumbPosValue = {bottom: 'calc(' + thumbPosPercent + '% - ' + this.offset + 'px)', top: 'auto'};
                trackPosValue = {bottom: trackStartPosPercent + '%', top: trackEndPosPercent + '%'};
            } else {
                thumbPosValue = {top: 'calc(' + thumbPosPercent + '% - ' + this.offset + 'px)', bottom: 'auto'};
                trackPosValue = {top: trackStartPosPercent + '%', bottom: trackEndPosPercent + '%'};
            }
        } else {
            if (this.is_reversed()) {
                thumbPosValue = {right: 'calc(' + thumbPosPercent + '% - ' + this.offset + 'px)', left: 'auto'};
                trackPosValue = {right: trackStartPosPercent + '%', left: trackEndPosPercent + '%'};
            } else {
                thumbPosValue = {left: 'calc(' + thumbPosPercent + '% - ' + this.offset + 'px)', right: 'auto'};
                trackPosValue = {left: trackStartPosPercent + '%', right: trackEndPosPercent + '%'};
            }
        }
        $targetThumb.css(thumbPosValue);
        this.$trackFill.css(trackPosValue);
        this.debug('Setting slider position to ' + newPos);
    }

    update_value(newValue, callback) {
        var
            min = this.get_min(),
            max = this.get_max()
        ;
        if (newValue <= min) {
            newValue = min;
        } else if (newValue >= max) {
            newValue = max;
        }
        if (!this.is_range()) {
            this.value = newValue;
            this.thumbVal = this.value;
        } else {
            if (!this.$currThumb.hasClass('second')) {
                this.thumbVal = newValue;
            } else {
                this.secondThumbVal = newValue;
            }
            this.value = Math.abs(this.thumbVal - this.secondThumbVal);
        }
        this.update_position(newValue);
        this.debug('Setting slider value to ' + this.value);
        if (typeof callback === 'function') {
            callback(this.value, this.thumbVal, this.secondThumbVal);
        }
    }

    handleNewValuePosition(val) {
        var
            min = this.get_min(),
            max = this.get_max(),
            newPos
        ;
        if (val <= min) {
            val = min;
        } else if (val >= max) {
            val = max;
        }
        newPos = this.determine_positionFromValue(val);
        return newPos;
    }

    is_disabled() {
        return this.$element.hasClass(this.settings.className.disabled);
    }

    is_focused() {
        return this.$element.is(':focus');
    }

    is_labeled() {
        return this.$element.hasClass(this.settings.className.labeled);
    }

    is_range() {
        return this.$element.hasClass(this.settings.className.range);
    }

    is_reversed() {
        return this.$element.hasClass(this.settings.className.reversed);
    }

    is_smooth() {
        return this.settings.smooth || this.$element.hasClass(this.settings.className.smooth);
    }

    is_vertical() {
        return this.$element.hasClass(this.settings.className.vertical);
    }

    determine_closestThumb(eventPos) {
        var
            thumbPos = parseFloat(this.determine_thumbPos(this.$thumb)),
            thumbDelta = Math.abs(eventPos - thumbPos),
            secondThumbPos = parseFloat(this.determine_thumbPos(this.$secondThumb)),
            secondThumbDelta = Math.abs(eventPos - secondThumbPos)
        ;
        return thumbDelta <= secondThumbDelta ? this.$thumb : this.$secondThumb;
    }

    determine_eventPos(event, originalEvent) {
        if (this.isTouch) {
            var
                touchY = event.changedTouches[0].pageY || event.touches[0].pageY,
                touchX = event.changedTouches[0].pageX || event.touches[0].pageX
            ;
            return this.is_vertical() ? touchY : touchX;
        }
        var
            clickY = event.pageY || originalEvent.pageY,
            clickX = event.pageX || originalEvent.pageX
        ;
        return this.is_vertical() ? clickY : clickX;
    }

    determine_keyMovement(event) {
        var
            key = event.which,
            downArrow =
                this.is_vertical()
                ?
                this.is_reversed() ? this.settings.keys.downArrow : this.settings.keys.upArrow
                :
                this.settings.keys.downArrow
            ,
            upArrow =
                this.is_vertical()
                ?
                this.is_reversed() ? this.settings.keys.upArrow : this.settings.keys.downArrow
                :
                this.settings.keys.upArrow
            ,
            leftArrow =
                !this.is_vertical()
                ?
                this.is_reversed() ? this.settings.keys.rightArrow : this.settings.keys.leftArrow
                :
                this.settings.keys.leftArrow
            ,
            rightArrow =
                !this.is_vertical()
                ?
                this.is_reversed() ? this.settings.keys.leftArrow : this.settings.keys.rightArrow
                :
                this.settings.keys.rightArrow
        ;
        if (key == downArrow || key == leftArrow) {
            return SINGLE_BACKSTEP;
        } else if (key == upArrow || key == rightArrow) {
            return SINGLE_STEP;
        } else if (key == this.settings.keys.pageDown) {
            return BIG_BACKSTEP;
        } else if (key == this.settings.keys.pageUp) {
            return BIG_STEP;
        } else {
            return NO_STEP;
        }
    }

    determine_pos(pagePos) {
        return this.is_reversed()
            ? this.get_trackStartPos() - pagePos + this.get_trackOffset()
            : pagePos - this.get_trackOffset() - this.get_trackStartPos()
        ;
    }

    determine_positionFromValue(value) {
        var
            min = this.get_min(),
            max = this.get_max(),
            value = value > max ? max : value < min ? min : value,
            trackLength = this.get_trackLength(),
            ratio = (value - min) / (max - min),
            position = Math.round(ratio * trackLength)
        ;
        this.verbose('Determined position: ' + position + ' from value: ' + value);
        return position;
    }

    determine_smoothValueFromEvent(event, originalEvent) {
        var
            min = this.get_min(),
            max = this.get_max(),
            trackLength = this.get_trackLength(),
            eventPos = this.determine_eventPos(event, originalEvent),
            newPos = eventPos - this.get_trackOffset(),
            ratio,
            value
        ;
        newPos = newPos < 0 ? 0 : newPos > trackLength ? trackLength : newPos;
        ratio = newPos / trackLength;
        if (this.is_reversed()) {
            ratio = 1 - ratio;
        }
        value = ratio * (max - min) + min;
        return value;
    }

    determine_thumbPos($element) {
        var pos =
            this.is_vertical()
            ?
            this.is_reversed() ? $element.css('bottom') : $element.css('top')
            :
            this.is_reversed() ? $element.css('right') : $element.css('left')
        ;
        return pos;
    }
    
    determine_value(position) {
        var
            startPos = this.is_reversed() ? this.get_trackEndPos() : this.get_trackStartPos(),
            endPos = this.is_reversed() ? this.get_trackStartPos() : this.get_trackEndPos(),
            ratio = (position - startPos) / (endPos - startPos),
            range = this.get_max() - this.get_min(),
            step = this.get_step(),
            value = (ratio * range),
            difference = (step == 0) ? value : Math.round(value / step) * step
        ;
        this.verbose('Determined value based upon position: ' + position + ' as: ' + value);
        if (value != difference) {
            this.verbose('Rounding value to closest step: ' + difference);
        }
        // Use precision to avoid ugly Javascript floating point rounding issues
        // (like 35 * .01 = 0.35000000000000003)
        difference = Math.round(difference * this.precision) / this.precision;
        this.verbose('Cutting off additional decimal places');
        return difference + this.get_min();
    }

    determine_valueFromEvent(event, originalEvent) {
        var
            eventPos = this.determine_eventPos(event, originalEvent),
            newPos = this.determine_pos(eventPos),
            value
        ;
        if (eventPos < this.get_trackOffset()) {
            value = this.is_reversed() ? this.get_max() : this.get_min();
        } else if (eventPos > this.get_trackOffset() + this.get_trackLength()) {
            value = this.is_reversed() ? this.get_min() : this.get_max();
        } else {
            value = this.determine_value(newPos);
        }
        return value;
    }

    goto_max() {
        this.set_value(this.get_max());
    }

    goto_min() {
        this.set_value(this.get_min());
    }

    /*****************************************************************
     * SEEMS UNUSED BELOW
     *****************************************************************/
    resync() {
        this.verbose('Resyncing thumb position based on value');
        if (this.is_range()) {
            this.update_position(this.secondThumbVal, this.$secondThumb);
        }
        this.update_position(this.thumbVal, this.$thumb);
        this.setup_labels();
    }

    determine_closestThumbPos(eventPos) {
        var
            thumbPos = parseFloat(this.determine_thumbPos(this.$thumb)),
            thumbDelta = Math.abs(eventPos - thumbPos),
            secondThumbPos = parseFloat(this.determine_thumbPos(this.$secondThumb)),
            secondThumbDelta = Math.abs(eventPos - secondThumbPos)
        ;
        return thumbDelta <= secondThumbDelta ? thumbPos : secondThumbPos;
    }

    determine_positionFromRatio(ratio) {
        var
            trackLength = this.get_trackLength(),
            step = this.get_step(),
            position = Math.round(ratio * trackLength),
            adjustedPos = (step == 0) ? position : Math.round(position / step) * step
        ;
        return adjustedPos;
    }

    set_position(position, which) {
        var thumbVal = this.determine_value(position);
        switch (which) {
            case 'second':
                this.secondThumbVal = thumbVal;
                this.update_position(thumbVal, this.$secondThumb);
                break;
            default:
                this.thumbVal = thumbVal;
                this.update_position(thumbVal, this.$thumb);
        }
        value = Math.abs(this.thumbVal - (this.secondThumbVal || 0));
        this.set_value(value);
    }

    get_thumbPosition(which) {
        switch(which) {
            case 'second':
                if (this.is_range()) {
                    return this.secondPos;
                } else {
                    this.error(this.settings.error.notrange);
                    break;
                }
            case 'first':
            default:
                return this.position;
        }
    }

    get_thumbValue(which) {
        switch(which) {
            case 'second':
                if (this.is_range()) {
                    return this.secondThumbVal;
                } else {
                    this.error(this.settings.error.notrange);
                    break;
                }
            case 'first':
            default:
                return this.thumbVal;
        }
    }

    get_value() {
        return this.value;
    }
}
