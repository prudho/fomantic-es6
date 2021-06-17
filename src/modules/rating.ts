"use strict";

import { Module, ModuleOptions } from '../module';

import $, { Cash } from 'cash-dom';

export interface RatingOptions extends ModuleOptions {
  icon: string;
  initialRating: number;
  interactive: boolean;
  maxRating: number;
  fireOnInit: boolean;
  clearable?: boolean;
  
  metadata: {
    rating: string;
    maxRating: string;
    icon: string;
  };

  className: {
    active: string,
    disabled: string,
    selected: string
  };

  selector: {
    icon: string;
  };

  templates: {
    icon: Function
  };

  events: Array<string>;
}

const default_settings: RatingOptions = {
  name          : 'Rating',
  namespace     : 'rating',

  icon          : 'star',
  
  silent        : false,
  debug         : false,
  verbose       : false,
  performance   : true,
  
  initialRating : 0,
  interactive   : true,
  maxRating     : 4,
  fireOnInit    : false,
  
  metadata: {
    rating    : 'rating',
    maxRating : 'maxRating',
    icon      : 'icon'
  },
  
  className : {
    active   : 'active',
    disabled : 'disabled',
    selected : 'selected'
  },
  
  selector  : {
    icon : '.icon'
  },
  
  templates: {
    icon: (maxRating: number, iconClass: string): string => {
      let
        icon:number = 1,
        html:string = ''
      ;
      while (icon <= maxRating) {
        html +=  `<i class="${iconClass} icon"></i>`;
        icon++;
      }
      return html;
    }
  },

  events: ['rate', 'beforeRate']
}

export class Rating extends Module {
  settings: RatingOptions;

  $icons: Cash;
  initialLoad: boolean;

  instance: Rating;

  constructor(selector: string, parameters: RatingOptions) {
    super(selector, parameters, default_settings);

    this.$icons = $(this.settings.selector.icon);
    
    this.initialize();
  }

  initialize(): void {
    this.verbose('Initializing rating module', this.settings);

    if (this.$icons.length === 0) {
      this.setup_layout();
    }

    if (this.settings.interactive && !this.is_disabled()) {
      this.enable();
    } else {
      this.disable();
    }
    this.initialLoad = true;
    this.set_rating(this.get_initialRating());
    this.initialLoad = false;
    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Instantiating module', this.settings);
    this.instance = this; // FIXME
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.verbose('Destroying previous instance', this.instance);
    this.remove_events();
    this.$element.removeAttr(this.moduleNamespace);
  }

  setup_layout(): void {
    let
      maxRating: number = this.get_maxRating(),
      icon: string      = this.get_icon(),
      html: string      = this.settings.templates.icon(maxRating, icon)
    ;
    this.debug('Generating icon html dynamically');
    this.$element.html(html);
    this.refresh();
  }

  bind_events(): void {
    this.verbose('Binding events');
    this.$icons
      .on('mouseenter' + this.eventNamespace, this.event_mouseenter.bind(this))
      .on('mouseleave' + this.eventNamespace, this.event_mouseleave.bind(this))
      .on('click'      + this.eventNamespace, this.event_click.bind(this))
    ;
  }

  refresh(): void {
    this.$icons = this.$element.find(this.settings.selector.icon);
  }

  enable(): void {
    this.debug('Setting rating to interactive mode');
    this.bind_events();
    this.$element.removeClass(this.settings.className.disabled);
  }

  disable(): void {
    this.debug('Setting rating to read-only mode');
    this.remove_events();
    this.$element.addClass(this.settings.className.disabled);
  }

  clearRating(): void {
    this.debug('Clearing current rating');
    this.set_rating(0);
  }

  event_mouseenter(element): void {
    let
      $activeIcon: Cash = $(element.target),
      idx: number       = this.$icons.index($activeIcon)
    ;
    for (let i: number = idx + 1; i < this.get_maxRating(); i++) {
      this.$icons.eq(i).removeClass(this.settings.className.selected);
    }
    this.$element.addClass(this.settings.className.selected);
    for (let i: number = idx; i >= 0; i--) {
      this.$icons.eq(i).addClass(this.settings.className.selected);
    }
  }

  event_mouseleave(): void {
    this.$element.removeClass(this.settings.className.selected);
    this.$icons.removeClass(this.settings.className.selected);
  }

  event_click(element): void {
    let
      $activeIcon: Cash = $(element.target),
      currentRating: number = this.get_rating(),
      rating: number        = this.$icons.index($activeIcon) + 1,
      canClear: boolean     = (this.settings.clearable === undefined)
        ? (this.$icons.length === 1 || currentRating == rating)
        : this.settings.clearable
    ;
    if (canClear && currentRating == rating) {
      this.clearRating();
    } else {
      this.set_rating(rating);
    }
  }

  get_icon(): string {
    let icon: string = this.$element.data(this.settings.metadata.icon);
    if (icon) {
      this.$element.removeAttr(this.settings.metadata.icon);
    }
    return icon || this.settings.icon;
  }

  get_initialRating(): number {
    if (this.$element.data(this.settings.metadata.rating) !== undefined) {
      this.$element.removeAttr(this.settings.metadata.rating);
      return this.$element.data(this.settings.metadata.rating);
    }
    return this.settings.initialRating;
  }

  get_rating(): number {
    let currentRating: number = this.$icons.filter('.' + this.settings.className.active).length;
    this.verbose('Current rating retrieved', currentRating);
    return currentRating;
  }

  get_maxRating(): number {
    if (this.$element.data(this.settings.metadata.maxRating) !== undefined) {
      this.$element.removeAttr(this.settings.metadata.maxRating);
      return this.$element.data(this.settings.metadata.maxRating);
    }
    return this.settings.maxRating;
  }

  is_disabled(): boolean {
    return this.$element.hasClass(this.settings.className.disabled);
  }

  set_rating(rating: number): void {
    let
      ratingIndex: number = (rating - 1 >= 0)
        ? (rating - 1)
        : 0,
      idx: number = ratingIndex;
    ;
    this.$element.removeClass(this.settings.className.selected);
    this.$icons
      .removeClass(this.settings.className.selected)
      .removeClass(this.settings.className.active)
    ;
    if (rating > 0) {
      this.verbose('Setting current rating to', rating);
      while (idx >= 0 ) {
        this.$icons.eq(idx).addClass(this.settings.className.active)

        --idx;
      }
    }
    if (!this.initialLoad || this.settings.fireOnInit) {
      this.invokeCallback('rate')(rating);
    }
  }
  
  remove_events(): void {
    this.verbose('Removing events');
    this.$icons.off(this.eventNamespace);
  }
}
