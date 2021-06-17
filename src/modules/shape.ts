'use strict';

import { Module, ModuleOptions } from '../module'

import { Cash } from 'cash-dom';

export interface ShapeOptions extends ModuleOptions {
  // fudge factor in pixels when swapping from 2d to 3d (can be useful to correct rounding errors)
  jitter     : number;

  // width during animation, can be set to 'auto', initial', 'next' or pixel amount
  width: 'auto' | 'initial' | 'next' | number;

  // height during animation, can be set to 'auto', 'initial', 'next' or pixel amount
  height: 'auto' | 'initial' | 'next' | number;

  // allow animation to same side
  allowRepeats: boolean;

  // animation duration
  duration   : number;

  // possible errors
  error: {
    side   : string;
    method : string;
  }

  // classnames used
  className   : {
    animating : string;
    hidden    : string;
    loading   : string;
    active    : string;
  }

  // selectors used
  selector    : {
    sides : string;
    side  : string;
  }

  events: Array<string>;
}

const default_settings: ShapeOptions = {
  // module info
  name : 'Shape',
  
  // hide all debug content
  silent     : false,

  // debug content outputted to console
  debug      : false,

  // verbose debug output
  verbose    : false,

  // fudge factor in pixels when swapping from 2d to 3d (can be useful to correct rounding errors)
  jitter     : 0,

  // performance data output
  performance: true,

  // event namespace
  namespace  : 'shape',

  // width during animation, can be set to 'auto', initial', 'next' or pixel amount
  width: 'initial',

  // height during animation, can be set to 'auto', 'initial', 'next' or pixel amount
  height: 'initial',

  // allow animation to same side
  allowRepeats: false,

  // animation duration
  duration   : null,

  // possible errors
  error: {
    side   : 'You tried to switch to a side that does not exist.',
    method : 'The method you called is not defined'
  },

  // classnames used
  className   : {
    animating : 'animating',
    hidden    : 'hidden',
    loading   : 'loading',
    active    : 'active'
  },

  // selectors used
  selector    : {
    sides : '.sides',
    side  : '.side'
  },

  events: [
    'change',
    'results',
    'resultsOpen',
    'resultsClose'
  ]
}

export class Shape extends Module {
  settings: ShapeOptions;

  $side: Cash;
  $sides: Cash;
  $activeSide: Cash;
  $nextSide: Cash;

  nextIndex: any = false;

  instance: Shape;

  constructor(selector: string, parameters) {
    super(selector, parameters, default_settings);

    this.$sides = this.$element.find(':scope> ' + this.settings.selector.sides);
    this.$side  = this.$sides.find(':scope> ' + this.settings.selector.side);

    this.initialize();
  }

  initialize(): void {
    this.verbose('Initializing module');
    this.set_defaultSide();
    this.instantiate();
  }
  
  instantiate(): void {
    this.verbose('Storing instance of module', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.verbose('Destroying instance');
    this.$element
      .off(this.eventNamespace)
      .removeAttr(this.moduleNamespace)
    ;
  }

  refresh(): void {
    this.verbose('Refreshing selector cache for', this.element);
    // INVESTIGATE
    // $module = $(element);
    this.$sides  = this.$element.find(this.settings.selector.sides);
    this.$side   = this.$sides.find(this.settings.selector.side);
  }

  repaint(): void {
    this.verbose('Forcing repaint event');
    let
      shape          = this.$sides[0] || document.createElement('div'),
      fakeAssignment = shape.offsetWidth
    ;
  }

  animate(propertyObject, callback: any = false): void {
    this.verbose('Animating box with properties', propertyObject);
    callback = callback || ((event) => {
      this.verbose('Executing animation callback');
      if (event !== undefined) {
        event.stopPropagation();
      }
      this.reset();
      this.set_active();
    });

    // settings.beforeChange.call($nextSide[0]);
    this.invokeCallback('beforeChange').call(this.$nextSide[0]);
    
    if (this.get_transitionEvent()) {
      this.verbose('Starting CSS animation');
      this.$element.addClass(this.settings.className.animating);
      this.$sides
        .css(propertyObject)
        .one(this.get_transitionEvent(), callback)
      ;
      this.set_duration(this.settings.duration);
      requestAnimationFrame(() => {
        this.$element.addClass(this.settings.className.animating);
        this.$activeSide.addClass(this.settings.className.hidden);
      });
    }
    else {
      callback();
    }
  }

  queue(method): void {
    this.debug('Queueing animation of', method);
    this.$sides.one(this.get_transitionEvent(), () => {
      this.debug('Executing queued animation');
      setTimeout(() => {
        // this.$element.shape(method);
        this[method]();
      }, 0);
    });
  }

  reset(): void {
    this.verbose('Animating states reset');
    this.$element
      .removeClass(this.settings.className.animating)
      .attr('style', '')
      .removeAttr('style')
    ;
    // removeAttr style does not consistently work in safari
    this.$sides
      .attr('style', '')
      .removeAttr('style')
    ;
    this.$side
      .attr('style', '')
      .removeAttr('style')
      .removeClass(this.settings.className.hidden)
    ;
    this. $nextSide
      .removeClass(this.settings.className.animating)
      .attr('style', '')
      .removeAttr('style')
    ;
  }

  flip_to(type: string, stage: string): void {
    if (this.is_hidden()) {
      this.debug('Module not visible', this.$nextSide);
      return;
    }
    if (this.is_complete() && !this.is_animating() && !this.settings.allowRepeats) {
      this.debug('Side already visible', this.$nextSide);
      return;
    }
    // let transform = module.get.transform[type]();
    let transform = this['get_transform_' + type]();
    if (!this.is_animating()) {
      this.debug('Flipping ' + type, this.$nextSide);
      this.set_stageSize();
      // module.stage[stage]();
      this['stage' + stage]();
      this.animate(transform);
    }
    else {
      this.queue('flip ' + type);
    }
  }

  flip_up(): void {
    this.flip_to('up', 'above');
  }

  flip_down(): void {
    this.flip_to('down', 'below');
  }

  flip_left(): void {
    this.flip_to('left', 'left');
  }

  flip_right(): void {
    this.flip_to('right', 'right');
  }

  flip_over(): void {
    this.flip_to('over', 'behind');
  }

  flip_back(): void {
    this.flip_to('back', 'behind');
  }

  stage_above(): void {
    let
      box = {
        origin : ((this.$activeSide.outerHeight(true) - this.$nextSide.outerHeight(true)) / 2),
        depth  : {
          active : (this.$nextSide.outerHeight(true) / 2),
          next   : (this.$activeSide.outerHeight(true) / 2)
        }
      }
    ;
    this.verbose('Setting the initial animation position as above', this.$nextSide, box);
    this.$activeSide.css({'transform' : 'rotateX(0deg)'});
    this.$nextSide
      .addClass(this.settings.className.animating)
      .css({
        'top'       : box.origin + 'px',
        'transform' : 'rotateX(90deg) translateZ(' + box.depth.next + 'px) translateY(-' + box.depth.active + 'px)'
      })
    ;
  }

  stage_below(): void {
    let
      box = {
        origin : ((this.$activeSide.outerHeight(true) - this.$nextSide.outerHeight(true)) / 2),
        depth  : {
          active : (this.$nextSide.outerHeight(true) / 2),
          next   : (this.$activeSide.outerHeight(true) / 2)
        }
      }
    ;
    this.verbose('Setting the initial animation position as below', this.$nextSide, box);
    this.$activeSide.css({'transform' : 'rotateX(0deg)'});
    this.$nextSide
      .addClass(this.settings.className.animating)
      .css({
        'top'       : box.origin + 'px',
        'transform' : 'rotateX(-90deg) translateZ(' + box.depth.next + 'px) translateY(' + box.depth.active + 'px)'
      })
    ;
  }

  stage_left(): void {
    let
      height = {
        active : this.$activeSide.outerWidth(true),
        next   : this.$nextSide.outerWidth(true)
      },
      box = {
        origin : ( ( height.active - height.next ) / 2),
        depth  : {
          active : (height.next / 2),
          next   : (height.active / 2)
        }
      }
    ;
    this.verbose('Setting the initial animation position as left', this.$nextSide, box);
    this.$activeSide.css({'transform' : 'rotateY(0deg)'});
    this.$nextSide
      .addClass(this.settings.className.animating)
      .css({
        'left'      : box.origin + 'px',
        'transform' : 'rotateY(-90deg) translateZ(' + box.depth.next + 'px) translateX(-' + box.depth.active + 'px)'
      })
    ;
  }

  stage_right(): void {
    let
      height = {
        active : this.$activeSide.outerWidth(true),
        next   : this.$nextSide.outerWidth(true)
      },
      box = {
        origin : ( ( height.active - height.next ) / 2),
        depth  : {
          active : (height.next / 2),
          next   : (height.active / 2)
        }
      }
    ;
    this.verbose('Setting the initial animation position as right', this.$nextSide, box);
    this.$activeSide.css({'transform' : 'rotateY(0deg)'});
    this.$nextSide
      .addClass(this.settings.className.animating)
      .css({
        'left'      : box.origin + 'px',
        'transform' : 'rotateY(90deg) translateZ(' + box.depth.next + 'px) translateX(' + box.depth.active + 'px)'
      })
    ;
  }

  stage_behind(): void {
    let
      height = {
        active : this.$activeSide.outerWidth(true),
        next   : this.$nextSide.outerWidth(true)
      },
      box = {
        origin : ( ( height.active - height.next ) / 2),
        depth  : {
          active : (height.next / 2),
          next   : (height.active / 2)
        }
      }
    ;
    this.verbose('Setting the initial animation position as behind', this.$nextSide, box);
    this.$activeSide.css({'transform' : 'rotateY(0deg)'});
    this.$nextSide
      .addClass(this.settings.className.animating)
      .css({
        'left'      : box.origin + 'px',
        'transform' : 'rotateY(-180deg)'
      })
    ;
  }

  is_complete(): boolean {
    return (this.$side.filter('.' + this.settings.className.active)[0] == this.$nextSide[0]);
  }

  is_animating(): boolean {
    return this.$element.hasClass(this.settings.className.animating);
  }

  is_hidden(): boolean {
    // return this.$element.closest(':hidden').length > 0;
    return this.$element.closest('hidden').length > 0;
  }
  
  get_transform_up(): object {
    let
      translateZ = this.$activeSide.outerHeight(true) / 2,
      translateY = this.$nextSide.outerHeight(true) - translateZ
    ;
    return {
      transform: 'translateY(' + translateY + 'px) translateZ(-'+ translateZ + 'px) rotateX(-90deg)'
    };
  }

  get_transform_down(): object {
    let
      translate = {
        z: this.$activeSide.outerHeight(true) / 2
      }
    ;
    return {
      transform: 'translateY(-' + translate.z + 'px) translateZ(-'+ translate.z + 'px) rotateX(90deg)'
    };
  }

  get_transform_left(): object {
    let
      translateZ = this.$activeSide.outerWidth(true) / 2,
      translateX = this.$nextSide.outerWidth(true) - translateZ
    ;
    return {
      transform: 'translateX(' + translateX + 'px) translateZ(-' + translateZ + 'px) rotateY(90deg)'
    };
  }

  get_transform_right(): object {
    let
      translate = {
        z : this.$activeSide.outerWidth(true) / 2
      }
    ;
    return {
      transform: 'translateX(-' + translate.z + 'px) translateZ(-' + translate.z + 'px) rotateY(-90deg)'
    };
  }

  get_transform_over(): object {
    let
      translate = {
        x : -((this.$activeSide.outerWidth(true) - this.$nextSide.outerWidth(true)) / 2)
      }
    ;
    return {
      transform: 'translateX(' + translate.x + 'px) rotateY(180deg)'
    };
  }

  get_transform_back(): object {
    let
      translate = {
        x : -((this.$activeSide.outerWidth(true) - this.$nextSide.outerWidth(true)) / 2)
      }
    ;
    return {
      transform: 'translateX(' + translate.x + 'px) rotateY(-180deg)'
    };
  }

  get_transitionEvent(): string {
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
    for (transition in transitions){
      if( element.style[transition] !== undefined ){
        return transitions[transition];
      }
    }
  }

  get_nextSide(): Cash {
    return (this.$activeSide.next(this.settings.selector.side).length > 0)
      ? this.$activeSide.next(this.settings.selector.side)
      : this.$side.first()
    ;
  }

  set_defaultSide(): void {
    this.$activeSide = this.$side.filter('.' + this.settings.className.active);
    this.$nextSide   = (this.$activeSide.next(this.settings.selector.side).length > 0)
      ? this.$activeSide.next(this.settings.selector.side)
      : this.$side.first()
    ;
    this.nextIndex = false;
    this.verbose('Active side set to', this.$activeSide);
    this.verbose('Next side set to', this.$nextSide);
  }

  set_duration(duration): void {
    duration = duration || this.settings.duration;
    duration = (typeof duration == 'number')
      ? duration + 'ms'
      : duration
    ;
    this.verbose('Setting animation duration', duration);
    if (this.settings.duration || this.settings.duration === 0) {
      this.$sides.add(this.$side).css({
        '-webkit-transition-duration': duration,
        '-moz-transition-duration': duration,
        '-ms-transition-duration': duration,
        '-o-transition-duration': duration,
        'transition-duration': duration
      });
    }
  }

  set_currentStageSize(): void {
    let
      $activeSide = this.$side.filter('.' + this.settings.className.active),
      width       = $activeSide.outerWidth(true),
      height      = $activeSide.outerHeight(true)
    ;
    this.$element.css({
      width: width,
      height: height
    });
  }

  set_stageSize(): void {
    let
      $clone      = this.$element.clone().addClass(this.settings.className.loading),
      $side       = $clone.find('>' +this.settings. selector.sides + '>' + this.settings.selector.side),
      $activeSide = $side.filter('.' + this.settings.className.active),
      $nextSide   = (this.nextIndex)
        ? $side.eq(this.nextIndex)
        : ($activeSide.next(this.settings.selector.side).length > 0)
          ? $activeSide.next(this.settings.selector.side)
          : $side.first(),
      newWidth    = (this.settings.width === 'next')
        ? $nextSide.outerWidth(true)
        : (this.settings.width === 'initial')
          ? this.$element.width()
          : this.settings.width,
      newHeight    = (this.settings.height === 'next')
        ? $nextSide.outerHeight(true)
        : (this.settings.height === 'initial')
          ? this.$element.height()
          : this.settings.height
    ;
    $activeSide.removeClass(this.settings.className.active);
    $nextSide.addClass(this.settings.className.active);
    $clone.insertAfter(this.$element);
    $clone.remove();
    if (this.settings.width !== 'auto') {
      this.$element.css('width', newWidth + this.settings.jitter);
      this.verbose('Specifying width during animation', newWidth);
    }
    if (this.settings.height !== 'auto') {
      this.$element.css('height', newHeight + this.settings.jitter);
      this.verbose('Specifying height during animation', newHeight);
    }
  }

  set_nextSide(selector): void {
    this.nextIndex = selector;
    this.$nextSide = this.$side.filter(selector);
    this.nextIndex = this.$side.index(this.$nextSide);
    if (this.$nextSide.length === 0) {
      this.set_defaultSide();
      this.error(this.settings.error.side);
    }
    this.verbose('Next side manually set to', this.$nextSide);
  }

  set_active(): void {
    this.verbose('Setting new side to active', this.$nextSide);
    this.$side.removeClass(this.settings.className.active);
    this.$nextSide.addClass(this.settings.className.active);
    // this.settings.onChange.call(this.$nextSide[0]);
    this.invokeCallback('change').call(this.$nextSide[0])
    this.set_defaultSide();
  }
}
  