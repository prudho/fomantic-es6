"use strict";

import Module from '../module';

import $, { Cash } from 'cash-dom';
import Transition from './transition';

const settings = {
  name        : 'Dimmer',
  namespace   : 'dimmer',

  silent      : false,
  debug       : false,
  verbose     : false,
  performance : true,

  // whether should use flex layout
  useFlex     : true,

  // name to distinguish between multiple dimmers in context
  dimmerName  : false,

  // whether to add a variation type
  variation   : false,

  // whether to bind close events
  closable    : 'auto',

  // whether to use css animations
  useCSS      : true,

  // css animation to use
  transition  : 'fade',

  // event to bind to
  on          : false,

  // overriding opacity value
  opacity     : 'auto',

  // transition durations
  duration    : {
    show : 500,
    hide : 500
  },
  // whether the dynamically created dimmer should have a loader
  displayLoader: false,
  loaderText  : false,
  loaderVariation : '',

  error   : {
    method   : 'The method you called is not defined.'
  },

  className : {
    active     : 'active',
    animating  : 'animating',
    dimmable   : 'dimmable',
    dimmed     : 'dimmed',
    dimmer     : 'dimmer',
    disabled   : 'disabled',
    hide       : 'hide',
    legacy     : 'legacy',
    pageDimmer : 'page',
    show       : 'show',
    loader     : 'ui loader'
  },

  selector: {
    dimmer   : ':scope > .ui.dimmer',
    content  : '.ui.dimmer > .content, .ui.dimmer > .content > .center'
  },

  template: {
    dimmer: function(settings) {
      let d = $('<div/>').addClass('ui dimmer'), l: Cash;
      if (settings.displayLoader) {
        l = $('<div/>')
          .addClass(settings.className.loader)
          .addClass(settings.loaderVariation)
        ;
        if (!!settings.loaderText) {
          l.text(settings.loaderText);
          l.addClass('text');
        }
        d.append(l);
      }
      return d;
    }
  },

  events: ['change', 'show', 'hide', 'visible', 'hidden']
}

export class Dimmer extends Module {
  $dimmable: Cash;
  $dimmer  : Cash;

  clickEvent: string = ('ontouchstart' in document.documentElement) ? 'touchstart' : 'click';

  instance: Dimmer;

  constructor(selector: string, parameters) {
    super(selector, parameters, settings);
    
    this.preinitialize();

    this.initialize();
  }

  preinitialize(): void {
    if (this.is_dimmer()) {
      this.$dimmable = this.$element.parent();
      this.$dimmer   = this.$element;
    }
    else {
      this.$dimmable = this.$element;
      if (this.has_dimmer()) {
        if (this.settings.dimmerName) {
          this.$dimmer = this.$dimmable.find(this.settings.selector.dimmer).filter('.' + this.settings.dimmerName);
        }
        else {
          this.$dimmer = this.$dimmable.find(this.settings.selector.dimmer);
        }
      }
      else {
        this.$dimmer = this.create();
      }
    }
  }

  initialize(): void {
    this.debug('Initializing dimmer', this.settings);
    
    this.bind_events();
    this.set_dimmable();
    this.instantiate();
  }

  create(): Cash {
    let $element = $(this.settings.template.dimmer(this.settings));

    if (this.settings.dimmerName) {
      this.debug('Creating named dimmer', this.settings.dimmerName);
      $element.addClass(this.settings.dimmerName);
    }
    $element.appendTo(this.$dimmable);
    return $element;
  }

  instantiate(): void {
    this.verbose('Storing instance of module', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this.instance);
  }

  destroy(): void {
    this.verbose('Destroying previous module', this.$dimmer);
    this.unbind_events();
    this.remove_variation(undefined);
    this.$dimmable.off(this.eventNamespace);
  }

  bind_events(): void {
    if (this.settings.on == 'hover') {
      this.$dimmable
        .on('mouseenter' + this.eventNamespace, this.show.bind(this))
        .on('mouseleave' + this.eventNamespace, this.hide.bind(this))
      ;
    }
    else if (this.settings.on == 'click') {
      this.$dimmable.on(this.clickEvent + this.eventNamespace, this.toggle.bind(this));
    }
    if (this.is_page()) {
      this.debug('Setting as a page dimmer', this.$dimmable);
      this.set_pageDimmer();
    }

    if (this.is_closable()) {
      this.verbose('Adding dimmer close event', this.$dimmer);
      this.$dimmable.on(this.clickEvent + this.eventNamespace, this.settings.selector.dimmer, this.event_click.bind(this));
    }
  }

  unbind_events(): void {
    this.$element.removeAttr(this.moduleNamespace);
    this.$dimmable.off(this.eventNamespace);
  }

  show(callback: Function = () => {}): void {
    this.debug('Showing dimmer', this.$dimmer, this.settings);
    this.set_variation(undefined);
    if ((!this.is_dimmed() || this.is_animating()) && this.is_enabled()) {
      this.animate_show(callback);
      this.invokeCallback('show')(this.element);
      this.invokeCallback('change')(this.element);
    }
    else {
      this.debug('Dimmer is already shown or disabled');
    }
  }

  hide(callback: Function = () => {}): void {
    if (this.is_dimmed() || this.is_animating()) {
      this.debug('Hiding dimmer', this.$dimmer);
      this.animate_hide(callback);
      this.invokeCallback('hide')(this.element);
      this.invokeCallback('change')(this.element);
    }
    else {
      this.debug('Dimmer is not visible');
    }
  }

  toggle(): void {
    this.verbose('Toggling dimmer visibility', this.$dimmer);
    if (!this.is_dimmed() ) {
      this.show(undefined);
    }
    else {
      if (this.is_closable()) {
        this.hide(undefined);
      }
    }
  }

  animate_show(callback: Function = () => {}): void {
    // if (this.settings.useCSS && $.fn.transition !== undefined && this.$dimmer.transition('is supported')) {
    if (this.settings.useCSS) {
      if (this.settings.useFlex) {
        this.debug('Using flex dimmer');
        this.remove_legacy();
      }
      else {
        this.debug('Using legacy non-flex dimmer');
        this.set_legacy();
      }
      if (this.settings.opacity !== 'auto') {
        this.set_opacity(undefined);
      }

      let transition = new Transition(this.$dimmer, {
        debug       : this.settings.debug,
        verbose     : this.settings.verbose,
        displayType : this.settings.useFlex ? 'flex' : 'block',
        animation   : (this.settings.transition.showMethod || this.settings.transition) + ' in',
        queue       : false,
        duration    : this.get_duration(),
        useFailSafe : true,
        autostart   : false
      });

      transition.on('start', () => {
        this.set_dimmed();
      });

      transition.on('complete', () => {
        this.set_active();
        this.invokeCallback('visible')(this.element);
        callback();
      });

      transition.toggle();
    }
    else {
      this.verbose('Showing dimmer animation with javascript');
      this.set_dimmed();
      if (this.settings.opacity == 'auto') {
        this.settings.opacity = 0.8;
      }
      this.$dimmer
        // .stop()
        .css({
          opacity : 0,
          width   : '100%',
          height  : '100%'
        })
        // .fadeTo(this.get_duration(), this.settings.opacity, () => {
        //   this.$dimmer.removeAttr('style');
        //   this.set_active();
        //   callback();
        // })
      ;
    }
  }

  animate_hide(callback: Function = () => {}): void {
    // if (this.settings.useCSS && $.fn.transition !== undefined && this.$dimmer.transition('is supported')) {
    if (this.settings.useCSS) {
      this.verbose('Hiding dimmer with css');

      let transition = new Transition(this.$dimmer, {
        debug       : this.settings.debug,
        verbose     : this.settings.verbose,
        displayType : this.settings.useFlex ? 'flex' : 'block',
        animation   : (this.settings.transition.hideMethod || this.settings.transition) + ' out',
        queue       : false,
        duration    : this.get_duration(),
        useFailSafe : true,
        autostart   : false
      });

      transition.on('start', () => {
        this.set_dimmed();
      });

      transition.on('complete', () => {
        this.remove_dimmed();
        this.remove_variation(undefined);
        this.remove_active();
        this.invokeCallback('hidden')(this.element);
        callback();
      });

      transition.toggle();
    }
    else {
      this.verbose('Hiding dimmer with javascript');
      this.$dimmer
        // .stop()
        // .fadeOut(this.get_duration(), () => {
        //   this.remove_dimmed();
        //   this.remove_active();
        //   this.$dimmer.removeAttr('style');
        //   callback();
        // })
      ;
    }
  }

  event_click(event): void {
    this.verbose('Determining if event occurred on dimmer', event);
    if (this.$dimmer.find(event.target).length === 0 || $(event.target).is(this.settings.selector.content)) {
      this.hide(undefined);
      event.stopImmediatePropagation();
    }
  }

  can_show(): boolean {
    return !this.$dimmer.hasClass(this.settings.className.disabled);
  }

  is_active(): boolean {
    return this.$dimmer.hasClass(this.settings.className.active);
  }

  is_animating(): boolean {
    return ( this.$dimmer.is('animated') || this.$dimmer.hasClass(this.settings.className.animating) );
  }

  is_closable(): boolean {
    if (this.settings.closable == 'auto') {
      if (this.settings.on == 'hover') {
        return false;
      }
      return true;
    }
    return this.settings.closable;
  }

  is_dimmable (): boolean {
    return this.$element.hasClass(this.settings.className.dimmable);
  }

  is_dimmed(): boolean {
    return this.$dimmable.hasClass(this.settings.className.dimmed);
  }

  is_dimmer(): boolean {
    return this.$element.hasClass(this.settings.className.dimmer);
  }

  is_disabled(): boolean {
    return this.$dimmable.hasClass(this.settings.className.disabled);
  }

  is_enabled(): boolean {
    return !this.is_disabled();
  }

  is_page(): boolean {
    return this.$dimmable.is('body');
  }

  is_pageDimmer(): boolean {
    return this.$dimmer.hasClass(this.settings.className.pageDimmer);
  }

  has_dimmer(): boolean {
    if (this.settings.dimmerName) {
      return (this.$element.find(this.settings.selector.dimmer).filter('.' + this.settings.dimmerName).length > 0);
    }
    else {
      return (this.$element.find(this.settings.selector.dimmer).length > 0 );
    }
  }

  get_dimmer(): Cash {
    return this.$dimmer;
  }

  get_duration() {
    if (typeof this.settings.duration == 'object') {
      if (this.is_active()) {
        return this.settings.duration.hide;
      }
      else {
        return this.settings.duration.show;
      }
    }
    return this.settings.duration;
  }

  set_active(): void {
    this.$dimmer.addClass(this.settings.className.active);
  }

  set_dimmable(): void {
    this.$dimmable.addClass(this.settings.className.dimmable);
  }

  set_dimmed(): void {
    this.$dimmable.addClass(this.settings.className.dimmed);
  }

  set_disabled(): void {
    this.$dimmer.addClass(this.settings.className.disabled);
  }

  set_legacy(): void {
    this.$dimmer.addClass(this.settings.className.legacy);
  }

  set_opacity(opacity): void {
    let
      color      = this.$dimmer.css('background-color'),
      colorArray = color.split(','),
      isRGB      = (colorArray && colorArray.length >= 3)
    ;
    opacity = this.settings.opacity === 0 ? 0 : this.settings.opacity || opacity;
    if (isRGB) {
      colorArray[2] = colorArray[2].replace(')','');
      colorArray[3] = opacity + ')';
      color         = colorArray.join(',');
    }
    else {
      color = 'rgba(0, 0, 0, ' + opacity + ')';
    }
    this.debug('Setting opacity to', opacity);
    this.$dimmer.css('background-color', color);
  }

  set_pageDimmer(): void {
    this.$dimmer.addClass(this.settings.className.pageDimmer);
  }

  set_variation(variation = this.settings.variation): void {
    if (variation) {
      this.$dimmer.addClass(variation);
    }
  }

  remove_active(): void {
    this.$dimmer.removeClass(this.settings.className.active);
  }

  remove_dimmed(): void {
    this.$dimmable.removeClass(this.settings.className.dimmed);
  }

  remove_disabled(): void {
    this.$dimmer.removeClass(this.settings.className.disabled);
  }

  remove_legacy(): void {
    this.$dimmer.removeClass(this.settings.className.legacy);
  }

  remove_variation(variation): void {
    variation = variation || settings.variation;
    if (variation) {
      this.$dimmer.removeClass(variation);
    }
  }

  add_content(element): void {
    let $content = $(element);
    this.debug('Add content to dimmer', $content);
    if ($content.parent()[0] !== this.$dimmer[0]) {
      $content.detach().appendTo(this.$dimmer);
    }
  }
}
