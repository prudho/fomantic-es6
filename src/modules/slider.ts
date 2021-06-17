"use strict";

import { Module, ModuleOptions } from '../module'

import $, { Cash } from 'cash-dom';

const 
  alphabet        = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  SINGLE_STEP     = 1,
  BIG_STEP        = 2,
  NO_STEP         = 0,
  SINGLE_BACKSTEP = -1,
  BIG_BACKSTEP    = -2
;

export interface SliderOptions extends ModuleOptions {
  error    : {
    method    : string;
    notrange : string;
  }

  metadata: {
    thumbVal        : string;
    secondThumbVal  : string;
  }

  min              : number;
  max              : number;
  step             : number;
  start            : number;
  end              : number;
  labelType        : string;
  showLabelTicks   : boolean;
  smooth           : boolean;
  autoAdjustLabels : boolean;
  labelDistance    : number;
  preventCrossover : boolean;
  fireOnInit       : boolean;
  interpretLabel   : Function;

  //the decimal place to round to if step is undefined
  decimalPlaces  : number;

  // page up/down multiplier. How many more times the steps to take on page up/down press
  pageMultiplier : number;

  selector: {}

  className     : {
    reversed :string;
    disabled : string;
    labeled  : string;
    ticked   : string;
    vertical : string;
    range    : string;
    smooth   : string;
  }

  keys : {
    pageUp     : number;
    pageDown   : number;
    leftArrow  : number;
    upArrow    : number;
    rightArrow : number;
    downArrow  : number;
  }

  labelTypes    : {
    number  : string;
    letter  : string;
  }

  onChange : Function;
  onMove   : Function;

  events: Array<string>;
}

const default_settings: SliderOptions = {
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

  min              : 0,
  max              : 20,
  step             : 1,
  start            : 0,
  end              : 20,
  labelType        : 'number',
  showLabelTicks   : false,
  smooth           : false,
  autoAdjustLabels : true,
  labelDistance    : 100,
  preventCrossover : true,
  fireOnInit       : false,
  interpretLabel   : null,

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

  onChange : function(value, thumbVal, secondThumbVal) {},
  onMove   : function(value, thumbVal, secondThumbVal) {},

  events: ['change', 'move']
}

export class Slider extends Module {
  settings: SliderOptions;

  $window: Cash = $(window);
  $currThumb: Cash;
  $thumb: Cash;
  $secondThumb: Cash;
  $track: Cash;
  $trackFill: Cash;
  $labels: Cash;

  isHover: boolean = false;

  initialPosition;
  position;
  secondPos;
  initialLoad: boolean;
  isTouch: boolean;
  currentRange;
  documentEventID;
  precision;
  offset;
  thumbVal;
  secondThumbVal;
  gapRatio: number = 1;

  value;
  previousValue;

  instance: Slider;

  constructor(selector: string, parameters) {
    super(selector, parameters, default_settings);
    
    this.initialize();
  }

  initialize(): void {
    this.debug('Initializing slider', this.settings);
    this.initialLoad = true;

    this.currentRange += 1;
    this.documentEventID = this.currentRange;

    this.isTouch = this.setup_testOutTouch();
    this.setup_layout();
    this.setup_labels();

    if (!this.is_disabled()) {
      this.bind_events();
    }

    this.read_metadata();
    this.read_settings();

    this.initialLoad = false;
    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Storing instance of slider', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.verbose('Destroying previous slider for', this.$element);
    // clearInterval(instance.interval);
    this.unbind_events();
    this.unbind_slidingEvents();
    this.$element.removeAttr(this.moduleNamespace);
    this.instance = undefined;
  }

  setup_autoLabel(): void {
    this.$labels = this.$element.find('.labels');
    if (this.$labels.length != 0) {
      this.$labels.empty();
    }
    else {
      this.$labels = this.$element.append('<ul class="auto labels"></ul>').find('.labels');
    }
    for (let i = 0, len = this.get_numLabels(); i <= len; i++) {
      let
        labelText = this.get_label(i),
        $label = (labelText !== "")
          ? !(i % this.get_gapRatio())
            ? $('<li class="label">' + labelText + '</li>')
            : $('<li class="halftick label"></li>')
          : null,
        ratio  = i / len
      ;
      if ($label) {
        this.update_labelPosition(ratio, $label);
        this.$labels.append($label);
      }
    }
  }

  setup_customLabel(): void {
    let
      $children: Cash     = this.$labels.find('.label'),
      numChildren: number = $children.length,
      min: number         = this.get_min(),
      max: number         = this.get_max(),
      module: Slider      = this,
      ratio: number
    ;
    $children.each(function(index) {
      let
        $child = $(this),
        attrValue: any = $child.attr('data-value')
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

  setup_labels(): void {
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

  setup_layout(): void {
    if (this.$element.attr('tabindex') === undefined) {
      this.$element.attr('tabindex', '0');
    }
    if (this.$element.find('.inner').length == 0) {
      this.$element.append("<div class='inner'>"
                     + "<div class='track'></div>"
                     + "<div class='track-fill'></div>"
                     + "<div class='thumb'></div>"
                     + "</div>");
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

  setup_testOutTouch(): boolean {
    try {
      document.createEvent('TouchEvent');
      return true;
    } catch (e) {
    return false;
    }
  }

  bind_events(): void {
    this.bind_globalKeyboardEvents();
    this.bind_keyboardEvents();
    this.bind_mouseEvents();
    if (this.is_touch()) {
      this.bind_touchEvents();
    }
    if (this.settings.autoAdjustLabels) {
      this.bind_windowEvents();
    }
  }

  bind_globalKeyboardEvents(): void {
    $(document).on('keydown' + this.eventNamespace + this.documentEventID, this.event_activateFocus.bind(this));
  }

  bind_keyboardEvents(): void {
    this.verbose('Binding keyboard events');
    this.$element.on('keydown' + this.eventNamespace, this.event_keydown.bind(this));
  }

  bind_mouseEvents(): void {
    this.verbose('Binding mouse events');
    this.$element.find('.track, .thumb, .inner').on('mousedown' + this.eventNamespace, (event) => {
      event.stopImmediatePropagation();
      event.preventDefault();
      this.event_down(event);
    });
    this.$element.on('mousedown' + this.eventNamespace, this.event_down.bind(this));
    this.$element.on('mouseenter' + this.eventNamespace, (event) => {
      this.isHover = true;
    });
    this.$element.on('mouseleave' + this.eventNamespace, (event) => {
      this.isHover = false;
    });
  }

  bind_slidingEvents(): void {
    // these don't need the identifier because we only ever want one of them to be registered with document
    this.verbose('Binding page wide events while handle is being draged');
    if (this.is_touch()) {
      $(document).on('touchmove' + this.eventNamespace, this.event_move.bind(this));
      $(document).on('touchend' + this.eventNamespace, this.event_up.bind(this));
    }
    else {
      $(document).on('mousemove' + this.eventNamespace, this.event_move.bind(this));
      $(document).on('mouseup' + this.eventNamespace, this.event_up.bind(this));
    }
  }

  bind_touchEvents(): void {
    this.verbose('Binding touch events');
    this.$element.find('.track, .thumb, .inner').on('touchstart' + this.eventNamespace, (event) => {
      event.stopImmediatePropagation();
      event.preventDefault();
      this.event_down(event);
    });
    this.$element.on('touchstart' + this.eventNamespace, this.event_down.bind(this));
  }

  bind_windowEvents(): void {
    this.$window.on('resize' + this.eventNamespace, this.event_resize.bind(this));
  }

  event_activateFocus(event) {
    if (!this.is_focused() && this.is_hover() && this.determine_keyMovement(event) != NO_STEP) {
      event.preventDefault();
      this.event_keydown(event, true);
      // INVESTIGATE
      // this.$element.trigger('focus');
    }
  }

  event_down(event): void {
    event.preventDefault();
    if (this.is_range()) {
      let
        eventPos: number = this.determine_eventPos(event),
        newPos: number = this.determine_pos(eventPos)
      ;
      // Special handling if range mode and both thumbs have the same value
      if (this.settings.preventCrossover && this.is_range() && this.thumbVal === this.secondThumbVal) {
        this.initialPosition = newPos;
        this.$currThumb = undefined;
      } else {
        this.$currThumb = this.determine_closestThumb(newPos);
      }
      if (this.previousValue === undefined) {
        this.previousValue = this.get_currentThumbValue();
      }
    } else if (this.previousValue === undefined) {
      this.previousValue = this.get_value();
    }

    if (!this.is_disabled()) {
      this.bind_slidingEvents();
    }
  }

  event_keydown(event, first): void {
    if (this.settings.preventCrossover && this.is_range() && this.thumbVal === this.secondThumbVal) {
      this.$currThumb = undefined;
    }
    if (this.is_focused()) {
      $(document).trigger(event);
    }
    if (first || this.is_focused()) {
      let step = this.determine_keyMovement(event);
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

  event_move(event): void {
    event.preventDefault();
    let value = this.determine_valueFromEvent(event);
    if (this.$currThumb === undefined) {
      let
        eventPos: number = this.determine_eventPos(event),
        newPos: number = this.determine_pos(eventPos)
      ;
      this.$currThumb = this.initialPosition > newPos ? this.$thumb : this.$secondThumb;
    }
    if (this.get_step() == 0 || this.is_smooth()) {
      let
        thumbVal = this.thumbVal,
        secondThumbVal = this.secondThumbVal,
        thumbSmoothVal = this.determine_smoothValueFromEvent(event)
      ;
      if (!this.$currThumb.hasClass('second')) {
        if (this.settings.preventCrossover && this.is_range()) {
          value = Math.min(secondThumbVal, value);
          thumbSmoothVal = Math.min(secondThumbVal, thumbSmoothVal);
        }
        thumbVal = value;
      } else {
        if (this.settings.preventCrossover && this.is_range()) {
          value = Math.max(thumbVal, value);
          thumbSmoothVal = Math.max(thumbVal, thumbSmoothVal);
        }
        secondThumbVal = value;
      }
      value = Math.abs(thumbVal - (secondThumbVal || 0));
      this.update_position(thumbSmoothVal);
      this.invokeCallback('move')(this.element, this.value, this.thumbVal, this.secondThumbVal);
    } else {
      this.update_value(value, () => {
        this.invokeCallback('move')(this.element, this.value, this.thumbVal, this.secondThumbVal);
      });
    }
  }

  event_resize(_event): void {
    // To avoid a useless performance cost, we only call the label refresh when its necessary
    if (this.gapRatio != this.get_gapRatio()) {
      this.setup_labels();
      this.gapRatio = this.get_gapRatio();
    }
  }

  event_up(event): void {
    event.preventDefault();
    let value: number = this.determine_valueFromEvent(event);
    this.set_value(value);
    this.unbind_slidingEvents();
    if (this.previousValue !== undefined) {
      this.previousValue = undefined;
    }
  }

  unbind_events(): void {
    this.$element.find('.track, .thumb, .inner').off('mousedown' + this.eventNamespace);
    this.$element.find('.track, .thumb, .inner').off('touchstart' + this.eventNamespace);
    this.$element.off('mousedown' + this.eventNamespace);
    this.$element.off('mouseenter' + this.eventNamespace);
    this.$element.off('mouseleave' + this.eventNamespace);
    this.$element.off('touchstart' + this.eventNamespace);
    this.$element.off('keydown' + this.eventNamespace);
    this.$element.off('focusout' + this.eventNamespace);
    $(document).off('keydown' + this.eventNamespace + this.documentEventID, this.event_activateFocus.bind(this));
    this.$window.off('resize' + this.eventNamespace);
  }

  unbind_slidingEvents(): void {
    if (this.is_touch()) {
      $(document).off('touchmove' + this.eventNamespace);
      $(document).off('touchend' + this.eventNamespace);
    } else {
      $(document).off('mousemove' + this.eventNamespace);
      $(document).off('mouseup' + this.eventNamespace);
    }
  }

  backStep(multiplier = 1): void {
    let
      step: number = this.get_step(),
      currValue: number = this.get_currentThumbValue()
    ;
    this.verbose('Going back a step');
    if (step > 0) {
      this.set_value(currValue - step * multiplier);
    } else if (step == 0) {
      let
        precision = this.get_precision(),
        newValue = currValue - (multiplier/precision)
      ;
      this.set_value(Math.round(newValue * precision) / precision);
    }
  }

  takeStep(multiplier = 1) {
    let
      step = this.get_step(),
      currValue = this.get_currentThumbValue()
    ;
    this.verbose('Taking a step');
    if (step > 0) {
      this.set_value(currValue + step * multiplier);
    } else if (step == 0) {
      let
        precision = this.get_precision(),
        newValue = currValue + (multiplier/precision)
      ;
      this.set_value(Math.round(newValue * precision) / precision);
    }
  }

  handleNewValuePosition(val) {
    let
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

  resync(): void {
    this.verbose('Resyncing thumb position based on value');
    if (this.is_range()) {
      this.update_position(this.secondThumbVal, this.$secondThumb);
    }
    this.update_position(this.thumbVal, this.$thumb);
    this.setup_labels();
  }

  determine_closestThumb(eventPos): Cash {
    let
      thumbPos = parseFloat(this.determine_thumbPos(this.$thumb)),
      thumbDelta = Math.abs(eventPos - thumbPos),
      secondThumbPos = parseFloat(this.determine_thumbPos(this.$secondThumb)),
      secondThumbDelta = Math.abs(eventPos - secondThumbPos)
    ;
    if (thumbDelta === secondThumbDelta && this.get_thumbValue() === this.get_min()) {
      return this.$secondThumb;
    }
    return thumbDelta <= secondThumbDelta ? this.$thumb : this.$secondThumb;
  }

  determine_closestThumbPos(eventPos): number {
    let
      thumbPos        : number = parseFloat(this.determine_thumbPos(this.$thumb)),
      thumbDelta      : number = Math.abs(eventPos - thumbPos),
      secondThumbPos  : number = parseFloat(this.determine_thumbPos(this.$secondThumb)),
      secondThumbDelta: number = Math.abs(eventPos - secondThumbPos)
    ;
    return thumbDelta <= secondThumbDelta ? thumbPos : secondThumbPos;
  }

  determine_eventPos(event): number {
    if (this.is_touch()) {
      let
        touchEvent = event.changedTouches ? event : event.originalEvent,
        touches = touchEvent.changedTouches[0] ? touchEvent.changedTouches : touchEvent.touches,
        touchY = touches[0].pageY,
        touchX = touches[0].pageX
      ;
      return this.is_vertical() ? touchY : touchX;
    }
    let
      clickY = event.pageY || event.originalEvent.pageY,
      clickX = event.pageX || event.originalEvent.pageX
    ;
    return this.is_vertical() ? clickY : clickX;
  }

  determine_keyMovement(event) {
    let
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
      ?
      this.get_trackStartPos() - pagePos + this.get_trackOffset()
      :
      pagePos - this.get_trackOffset() - this.get_trackStartPos()
    ;
  }

  determine_positionFromRatio(ratio) {
    let
      trackLength = this.get_trackLength(),
      step = this.get_step(),
      position = Math.round(ratio * trackLength),
      adjustedPos = (step == 0) ? position : Math.round(position / step) * step
    ;
    return adjustedPos;
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

  determine_smoothValueFromEvent(event) {
    let
      min = this.get_min(),
      max = this.get_max(),
      trackLength = this.get_trackLength(),
      eventPos = this.determine_eventPos(event),
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
    let pos =
      this.is_vertical()
      ?
      this.is_reversed() ? $element.css('bottom') : $element.css('top')
      :
      this.is_reversed() ? $element.css('right') : $element.css('left')
    ;
    return pos;
  }

  determine_value(position: number): number {
    let
      startPos: number = this.is_reversed() ? this.get_trackEndPos() : this.get_trackStartPos(),
      endPos: number = this.is_reversed() ? this.get_trackStartPos() : this.get_trackEndPos(),
      ratio: number = (position - startPos) / (endPos - startPos),
      range: number = this.get_max() - this.get_min(),
      step: number = this.get_step(),
      value: number = (ratio * range),
      difference: number = (step == 0) ? value : Math.round(value / step) * step
    ;
    this.verbose('Determined value based upon position: ' + position + ' as: ' + value);
    if (value != difference) {
      this.verbose('Rounding value to closest step: ' + difference);
    }
    // Use precision to avoid ugly Javascript floating point rounding issues
    // (like 35 * .01 = 0.35000000000000003)
    this.verbose('Cutting off additional decimal places');
    return Math.round((difference + this.get_min()) * this.precision) / this.precision;
  }

  determine_valueFromEvent(event): number {
    let
      eventPos: number = this.determine_eventPos(event),
      newPos: number = this.determine_pos(eventPos),
      value: number
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

  read_metadata(): void {
    let
      data = {
        thumbVal        : this.$element.data(this.settings.metadata.thumbVal),
        secondThumbVal  : this.$element.data(this.settings.metadata.secondThumbVal)
      }
    ;
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

  read_settings(): void {
    if (this.settings.start !== null) {
      if (this.is_range()) {
        this.debug('Start position set from settings', this.settings.start, this.settings.end);
        this.set_rangeValue(this.settings.start, this.settings.end);
      } else {
        this.debug('Start position set from settings', this.settings.start);
        this.set_value(this.settings.start);
      }
    }
  }

  get_currentThumbValue(): number {
    return this.$currThumb !== undefined && this.$currThumb.hasClass('second') ? this.secondThumbVal : this.thumbVal;
  }

  get_gapRatio(): number {
    let gapRatio: number = 1;
              
    if (this.settings.autoAdjustLabels) {
      let 
        numLabels: number = this.get_numLabels(),
        trackLength: number = this.get_trackLength(),
        gapCounter: number = 1
      ;

      // While the distance between two labels is too short,
      // we divide the number of labels at each iteration
      // and apply only if the modulo of the operation is an odd number.
      if (trackLength > 0) {
        while ((trackLength / numLabels) * gapCounter < this.settings.labelDistance) {
          if (!(numLabels % gapCounter)) {
            gapRatio = gapCounter;
          }
          gapCounter += 1;
        }
      }
    }
    return gapRatio;
  }

  get_label(value) {
    if (this.settings.interpretLabel) {
      return this.settings.interpretLabel(value);
    }

    switch (this.settings.labelType) {
      case this.settings.labelTypes.number:
        return Math.round(((value * (this.get_step() === 0 ? 1 : this.get_step())) + this.get_min()) * this.precision ) / this.precision;
      case this.settings.labelTypes.letter:
        return alphabet[(value) % 26];
      default:
        return value;
    }
  }

  labelType(): string {
    return this.settings.labelType;
  }

  get_max(): number {
    let
      step     : number = this.get_step(),
      min      : number = this.get_min(),
      quotient : number = step === 0 ? 0 : Math.floor((this.settings.max - min) / step),
      remainder: number = step === 0 ? 0 : (this.settings.max - min) % step;
    return remainder === 0 ? this.settings.max : min + quotient * step;
  }

  get_min(): number {
    return this.settings.min;
  }

  get_multiplier(): number {
    return this.settings.pageMultiplier;
  }

  get_numLabels(): number {
    let value = Math.round((this.get_max() - this.get_min()) / (this.get_step() === 0 ? 1 : this.get_step()));
    this.debug('Determined that there should be ' + value + ' labels');
    return value;
  }

  get_precision(): number {
    let
      decimalPlaces: number,
      step: number = this.get_step()
    ;
    if (step != 0) {
      let split: string[] = String(step).split('.');
      if (split.length == 2) {
        decimalPlaces = split[1].length;
      } else {
        decimalPlaces = 0;
      }
    } else {
      decimalPlaces = this.settings.decimalPlaces;
    }
    let precision: number = Math.pow(10, decimalPlaces);
    this.debug('Precision determined', precision);
    return precision;
  }

  get_step(): number {
    return this.settings.step;
  }

  get_thumbPosition(which) {
    switch(which) {
      case 'second':
        if (this.is_range()) {
          return this.secondPos;
        }
        else {
          this.error(this.settings.error.notrange);
          break;
        }
      case 'first':
      default:
        return this.position;
    }
  }
  
  get_thumbValue(which: string = 'first') {
    switch(which) {
      case 'second':
        if (this.is_range()) {
          return this.secondThumbVal;
        }
        else {
          this.error(this.settings.error.notrange);
          break;
        }
      case 'first':
      default:
        return this.thumbVal;
    }
  }

  get_trackEndMargin() {
    let margin;
    if (this.is_vertical()) {
      margin = this.is_reversed() ? this.$element.css('padding-top') : this.$element.css('padding-bottom');
    } else {
      margin = this.is_reversed() ? this.$element.css('padding-left') : this.$element.css('padding-right');
    }
    return margin || '0px';
  }

  get_trackEndPos() {
    return this.is_reversed() ? this.get_trackLeft() : this.get_trackLeft() + this.get_trackLength();
  }

  get_trackLeft() {
    if (this.is_vertical()) {
      return this.$track.position().top;
    } else {
      return this.$track.position().left;
    }
  }

  get_trackLength(): number {
    if (this.is_vertical()) {
      return this.$track.height();
    } else {
      return this.$track.width();
    }
  }

  get_trackOffset(): number {
    if (this.is_vertical()) {
      return this.$track.offset().top;
    } else {
      return this.$track.offset().left;
    }
  }

  get_trackStartPos(): number {
    return this.is_reversed() ? this.get_trackLeft() + this.get_trackLength() : this.get_trackLeft();
  }

  get_trackStartMargin() {
    let margin;
    if (this.is_vertical()) {
      margin = this.is_reversed() ? this.$element.css('padding-bottom') : this.$element.css('padding-top');
    } else {
      margin = this.is_reversed() ? this.$element.css('padding-right') : this.$element.css('padding-left');
    }
    return margin || '0px';
  }

  get_value() {
    return this.value;
  }

  set_position(position, which): void {
    let thumbVal: number = this.determine_value(position);
    switch (which) {
      case 'second':
        this.secondThumbVal = thumbVal;
        this.update_position(thumbVal, this.$secondThumb);
        break;
      default:
        this.thumbVal = thumbVal;
        this.update_position(thumbVal, this.$thumb);
    }
    this.value = Math.abs(this.thumbVal - (this.secondThumbVal || 0));
    this.set_value(this.value);
  }

  set_rangeValue(first, second, fireChange: boolean = false): void {
    if (this.is_range()) {
      let
        min: number = this.get_min(),
        max: number = this.get_max(),
        toReset: boolean = this.previousValue === undefined
      ;
      this.previousValue = this.previousValue === undefined ? this.get_value() : this.previousValue;
      if (first <= min) {
        first = min;
      } else if (first >= max) {
        first = max;
      }
      if (second <= min) {
        second = min;
      } else if (second >= max) {
        second = max;
      }
      this.thumbVal = first;
      this.secondThumbVal = second;
      this.value = Math.abs(this.thumbVal - this.secondThumbVal);
      this.update_position(this.thumbVal, this.$thumb);
      this.update_position(this.secondThumbVal, this.$secondThumb);
      if ((!this.initialLoad || this.settings.fireOnInit) && fireChange) {
        if (this.value !== this.previousValue) {
          this.invokeCallback('change')(this.element, this.value, this.thumbVal, this.secondThumbVal);
        }
        this.invokeCallback('move')(this.element, this.value, this.thumbVal, this.secondThumbVal);
      }
      if (toReset) {
        this.previousValue = undefined;
      }
    } else {
      this.error(this.settings.error.notrange);
    }
  }

  set_value(newValue, fireChange: boolean = false): void {
    let toReset: boolean = this.previousValue === undefined;
    this.previousValue = this.previousValue === undefined ? this.get_value() : this.previousValue;
    this.update_value(newValue, (value, thumbVal, secondThumbVal) => {
      if ((!this.initialLoad || this.settings.fireOnInit) && fireChange) {
        if (newValue !== this.previousValue) {
          this.invokeCallback('change')(this.element, this.value, this.thumbVal, this.secondThumbVal);
        }
        this.invokeCallback('move')(this.element, this.value, this.thumbVal, this.secondThumbVal);
      }
      if (toReset) {
        this.previousValue = undefined;
      }
    });
  }

  update_labelPosition(ratio, $label): void {
    let
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
    let position = '(100% - ' + startMargin + ' - ' + endMargin + ') * ' + ratio;
    $label.css(posDir, 'calc(' + position + startMarginMod + startMargin + ')');
  }

  update_position(newValue, $targetThumb = this.$currThumb): void {
    let
      newPos = this.handleNewValuePosition(newValue),
      thumbVal = this.thumbVal || this.get_min(),
      secondThumbVal = this.secondThumbVal || this.get_min()
    ;
    if (this.is_range()) {
      if (!$targetThumb.hasClass('second')) {
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
    let
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
      }
      else {
        thumbPosValue = {top: 'calc(' + thumbPosPercent + '% - ' + this.offset + 'px)', bottom: 'auto'};
        trackPosValue = {top: trackStartPosPercent + '%', bottom: trackEndPosPercent + '%'};
      }
    } else {
      if (this.is_reversed()) {
        thumbPosValue = {right: 'calc(' + thumbPosPercent + '% - ' + this.offset + 'px)', left: 'auto'};
        trackPosValue = {right: trackStartPosPercent + '%', left: trackEndPosPercent + '%'};
      }
      else {
        thumbPosValue = {left: 'calc(' + thumbPosPercent + '% - ' + this.offset + 'px)', right: 'auto'};
        trackPosValue = {left: trackStartPosPercent + '%', right: trackEndPosPercent + '%'};
      }
    }
    $targetThumb.css(thumbPosValue);
    this.$trackFill.css(trackPosValue);
    this.debug('Setting slider position to ' + newPos);
  }

  update_value(newValue, callback): void {
    let
      min: number = this.get_min(),
      max: number = this.get_max()
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
      if (this.$currThumb === undefined) {
        this.$currThumb = newValue <= this.get_currentThumbValue() ? this.$thumb : this.$secondThumb;
      }
      if (!this.$currThumb.hasClass('second')) {
        if (this.settings.preventCrossover && this.is_range()) {
          newValue = Math.min(this.secondThumbVal, newValue);
        }
        this.thumbVal = newValue;
      } else {
        if (this.settings.preventCrossover && this.is_range()) {
          newValue = Math.max(this.thumbVal, newValue);
        }
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

  is_disabled(): boolean {
    return this.$element.hasClass(this.settings.className.disabled);
  }

  is_focused(): boolean {
    return this.$element.is(':focus');
  }

  is_hover(): boolean {
    return this.isHover;
  }

  is_labeled(): boolean {
    return this.$element.hasClass(this.settings.className.labeled);
  }

  is_range(): boolean {
    return this.$element.hasClass(this.settings.className.range);
  }

  is_reversed(): boolean {
    return this.$element.hasClass(this.settings.className.reversed);
  }

  is_smooth(): boolean {
    return this.settings.smooth || this.$element.hasClass(this.settings.className.smooth);
  }

  is_touch(): boolean {
    return this.isTouch;
  }

  is_vertical(): boolean {
    return this.$element.hasClass(this.settings.className.vertical);
  }

  goto_max(): void {
    this.set_value(this.get_max());
  }

  goto_min(): void {
    this.set_value(this.get_min());
  }
}
  